const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const imagesDir = path.join(rootDir, 'images');
const manifestPath = path.join(rootDir, 'assets', 'image-manifest.json');
const validExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg']);
const excludedNames = new Set(['geomonb&w.jpg']);

const files = fs
  .readdirSync(imagesDir)
  .filter((file) => validExtensions.has(path.extname(file).toLowerCase()))
  .filter((file) => !excludedNames.has(file.toLowerCase()))
  .sort()
  .map((file) => `/images/${file}`);

fs.writeFileSync(manifestPath, `${JSON.stringify(files, null, 2)}\n`);
console.log(`Wrote ${files.length} image paths to ${manifestPath}`);
