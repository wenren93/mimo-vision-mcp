import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { normalizeRegion } from "./geometry.js";
import type { Region } from "./schemas.js";

const ASSET_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/;
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export interface PreparedImage {
  assetId: string;
  dataUrl: string;
  width: number;
  height: number;
  sentWidth: number;
  sentHeight: number;
  analyzedRegion: Region;
}

export interface ImportedAsset {
  assetId: string;
  width: number;
  height: number;
  bytes: number;
}

export class AssetStore {
  constructor(
    readonly root: string,
    private readonly maxFileBytes: number,
    private readonly maxPixels: number,
  ) {}

  async ensureRoot(): Promise<void> {
    await mkdir(this.root, { recursive: true });
  }

  resolve(assetId: string): string {
    if (!ASSET_ID.test(assetId) || assetId.includes("..")) {
      throw new Error("invalid assetId");
    }
    if (!ALLOWED_EXTENSIONS.has(path.extname(assetId).toLowerCase())) {
      throw new Error("assetId must end in png, jpg, jpeg, webp, or gif");
    }
    const candidate = path.resolve(this.root, assetId);
    if (path.dirname(candidate) !== path.resolve(this.root)) {
      throw new Error("assetId escapes the asset root");
    }
    return candidate;
  }

  async importFile(sourcePath: string): Promise<ImportedAsset> {
    await this.ensureRoot();
    const source = path.resolve(sourcePath);
    const inputStat = await stat(source);
    if (!inputStat.isFile()) throw new Error("source must be a regular file");
    if (inputStat.size > this.maxFileBytes * 5) throw new Error("source file is too large");

    const assetId = `img_${randomUUID()}.png`;
    const destination = this.resolve(assetId);
    const temporary = `${destination}.${process.pid}.tmp`;

    try {
      const { data, info } = await sharp(source, { limitInputPixels: this.maxPixels, animated: false })
        .rotate()
        .resize({ width: 3_000, height: 3_000, fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer({ resolveWithObject: true });

      if (data.byteLength > this.maxFileBytes) {
        throw new Error("normalized image exceeds VISION_MAX_FILE_MB");
      }

      await writeFile(temporary, data, { flag: "wx" });
      await rename(temporary, destination);
      return { assetId, width: info.width, height: info.height, bytes: data.byteLength };
    } finally {
      await unlink(temporary).catch(() => undefined);
    }
  }

  async prepare(assetId: string, requestedRegion: Region | undefined, resolution: "auto" | "low" | "high"): Promise<PreparedImage> {
    const file = this.resolve(assetId);
    const fileStat = await stat(file);
    if (!fileStat.isFile()) throw new Error("asset is not a regular file");
    if (fileStat.size > this.maxFileBytes) throw new Error("asset exceeds VISION_MAX_FILE_MB");

    const metadata = await sharp(file, { limitInputPixels: this.maxPixels, animated: false }).metadata();
    if (!metadata.width || !metadata.height) throw new Error("unable to read image dimensions");

    const analyzedRegion = normalizeRegion(requestedRegion);
    const left = Math.min(metadata.width - 1, Math.floor(analyzedRegion.x * metadata.width));
    const top = Math.min(metadata.height - 1, Math.floor(analyzedRegion.y * metadata.height));
    const width = Math.max(1, Math.min(metadata.width - left, Math.round(analyzedRegion.width * metadata.width)));
    const height = Math.max(1, Math.min(metadata.height - top, Math.round(analyzedRegion.height * metadata.height)));

    const maxEdge = resolution === "low" ? 768 : resolution === "high" ? 2_400 : 1_600;
    const { data, info } = await sharp(file, { limitInputPixels: this.maxPixels, animated: false })
      .extract({ left, top, width, height })
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer({ resolveWithObject: true });

    if (data.byteLength > this.maxFileBytes) throw new Error("prepared image is too large");

    return {
      assetId,
      dataUrl: `data:image/png;base64,${data.toString("base64")}`,
      width: metadata.width,
      height: metadata.height,
      sentWidth: info.width,
      sentHeight: info.height,
      analyzedRegion,
    };
  }
}
