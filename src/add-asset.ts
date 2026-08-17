import { AssetStore } from './asset-store.js';
import { loadAssetConfig } from './config.js';

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('Usage: npm run add-asset -- /absolute/path/to/image.png');
  process.exit(2);
}

try {
  const config = loadAssetConfig();
  const store = new AssetStore(config.assetRoot, config.maxFileBytes, config.maxPixels);
  const imported = await store.importFile(sourcePath);
  console.log(JSON.stringify(imported, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
