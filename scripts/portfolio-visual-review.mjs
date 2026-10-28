import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const dir = 'artifacts/portfolio-visual-qa';
const pages = ['home-en', 'home-es', 'apps-en', 'apps-es', 'blog-en', 'blog-es', 'devlog-en', 'devlog-es', 'about-en', 'about-es'];
const tileWidth = 260;
const previewHeight = 690;
const labelHeight = 34;
const gap = 8;
const cols = 5;
const rows = 2;
const sheetWidth = cols * (tileWidth + gap) + gap;
const sheetHeight = rows * (previewHeight + labelHeight + gap) + gap;

for (const theme of ['light', 'dark']) {
  for (const size of ['mobile', 'desktop']) {
    const tiles = [];
    for (const [index, name] of pages.entries()) {
      const screenshot = await readFile(`${dir}/${name}-${size}-${theme}.png`);
      const resized = await sharp(screenshot).resize({ width: tileWidth }).toBuffer({ resolveWithObject: true });
      const height = Math.min(previewHeight, resized.info.height);
      const cropped = await sharp(resized.data).extract({ left: 0, top: 0, width: tileWidth, height }).toBuffer();
      const label = Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#142f3d"/><text x="10" y="23" fill="#ffffff" font-size="17" font-family="sans-serif">${name}</text></svg>`);
      const tile = await sharp({
        create: { width: tileWidth, height: previewHeight + labelHeight, channels: 3, background: '#e7edf2' }
      }).composite([{ input: label, left: 0, top: 0 }, { input: cropped, left: 0, top: labelHeight }]).jpeg({ quality: 62 }).toBuffer();
      tiles.push({ input: tile, left: gap + (index % cols) * (tileWidth + gap), top: gap + Math.floor(index / cols) * (previewHeight + labelHeight + gap) });
    }
    const jpeg = await sharp({
      create: { width: sheetWidth, height: sheetHeight, channels: 3, background: '#e7edf2' }
    }).composite(tiles).jpeg({ quality: 58 }).toBuffer();
    const name = `${size}-${theme}`;
    await writeFile(`${dir}/contact-${name}.jpg`, jpeg);
    // The private runner cannot upload artifacts while the GitHub quota is
    // exhausted. Small, chunked log previews can still be reviewed remotely.
    const encoded = jpeg.toString('base64');
    console.log(`VISUAL_CONTACT_SHEET_BEGIN ${name} ${encoded.length}`);
    for (let offset = 0; offset < encoded.length; offset += 3000) {
      console.log(`VISUAL_CONTACT_SHEET_CHUNK ${encoded.slice(offset, offset + 3000)}`);
    }
    console.log(`VISUAL_CONTACT_SHEET_END ${name}`);
    console.log(`Visual contact sheet ready: ${name} (${jpeg.length} bytes)`);
  }
}
