import assert from 'node:assert/strict';
import test from 'node:test';

import { mapBoxFromCrop, normalizeRegion } from './geometry.js';

test('normalizeRegion clips a crop to the image', () => {
  assert.deepEqual(normalizeRegion({ page: 1, x: 0.8, y: 0.9, width: 0.5, height: 0.4 }), {
    page: 1,
    x: 0.8,
    y: 0.9,
    width: 0.19999999999999996,
    height: 0.09999999999999998,
  });
});

test('mapBoxFromCrop converts crop-local coordinates to full-image coordinates', () => {
  const mapped = mapBoxFromCrop(
    { page: 1, x: 0.5, y: 0.25, width: 0.2, height: 0.4 },
    { page: 1, x: 0.2, y: 0.1, width: 0.5, height: 0.6 },
  );
  assert.ok(Math.abs(mapped.x - 0.45) < 1e-9);
  assert.ok(Math.abs(mapped.y - 0.25) < 1e-9);
  assert.ok(Math.abs(mapped.width - 0.1) < 1e-9);
  assert.ok(Math.abs(mapped.height - 0.24) < 1e-9);
});
