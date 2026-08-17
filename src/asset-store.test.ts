import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

import { AssetStore } from "./asset-store.js";

test("AssetStore imports, normalizes and crops a local image", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "vision-mcp-test-"));
  try {
    const source = path.join(temporaryRoot, "source.png");
    await sharp({
      create: {
        width: 1_000,
        height: 500,
        channels: 3,
        background: { r: 20, g: 120, b: 220 },
      },
    })
      .png()
      .toFile(source);

    const store = new AssetStore(path.join(temporaryRoot, "assets"), 10 * 1024 * 1024, 10_000_000);
    const imported = await store.importFile(source);
    assert.match(imported.assetId, /^img_.+\.png$/);
    assert.equal(imported.width, 1_000);
    assert.equal(imported.height, 500);

    const prepared = await store.prepare(
      imported.assetId,
      { page: 1, x: 0.25, y: 0, width: 0.5, height: 1 },
      "low",
    );
    assert.equal(prepared.width, 1_000);
    assert.equal(prepared.height, 500);
    assert.equal(prepared.sentWidth, 500);
    assert.equal(prepared.sentHeight, 500);
    assert.match(prepared.dataUrl, /^data:image\/png;base64,/);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
