import { FULL_REGION, type Region, type VisionModelResult } from "./schemas.js";

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeRegion(value?: Region): Region {
  const region = value ?? FULL_REGION;
  const x = clamp(region.x);
  const y = clamp(region.y);
  const width = clamp(region.width, 0, 1 - x);
  const height = clamp(region.height, 0, 1 - y);
  if (width <= 0 || height <= 0) {
    throw new Error("region must have positive width and height inside the image");
  }
  return { page: region.page, x, y, width, height };
}

export function mapBoxFromCrop(box: Region, crop: Region): Region {
  const local = normalizeRegion(box);
  return normalizeRegion({
    page: crop.page,
    x: crop.x + local.x * crop.width,
    y: crop.y + local.y * crop.height,
    width: local.width * crop.width,
    height: local.height * crop.height,
  });
}

export function mapModelResultFromCrop(result: VisionModelResult, crop: Region): VisionModelResult {
  return {
    ...result,
    evidence: result.evidence.map((item) => ({ ...item, region: mapBoxFromCrop(item.region, crop) })),
    visibleText: result.visibleText.map((item) => ({ ...item, region: mapBoxFromCrop(item.region, crop) })),
  };
}
