import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceIcon = 'public/logo.png';
const outputDir = 'public/icons';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const icons = [
  { name: 'favicon.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 }
];

async function generateIcons() {
  if (!fs.existsSync(sourceIcon)) {
    console.error(`Source icon not found at ${sourceIcon}`);
    process.exit(1);
  }

  console.log(`Generating icons from ${sourceIcon}...`);

  for (const icon of icons) {
    const outputPath = path.join(outputDir, icon.name);
    try {
      await sharp(sourceIcon)
        .resize(icon.size, icon.size)
        .toFile(outputPath);
      console.log(`Created ${outputPath} (${icon.size}x${icon.size})`);
    } catch (err) {
      console.error(`Error creating ${icon.name}:`, err);
    }
  }
}

generateIcons();
