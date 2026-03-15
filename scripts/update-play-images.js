import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import gplay from 'google-play-scraper';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS_DIR = path.join(__dirname, '../src/content/apps');

async function processFile(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const parsed = matter(content);
  const data = parsed.data;

  if (!data.googlePlayUrl) {
    return;
  }

  try {
    const urlPattern = /id=([^&]+)/;
    const match = data.googlePlayUrl.match(urlPattern);

    if (!match || !match[1]) {
      console.warn(`[WARN] Could not extract app ID from: ${data.googlePlayUrl}`);
      return;
    }

    const appId = match[1];

    // Extraneous query string parameter lang handling
    let lang = 'en';
    if (filePath.includes(`${path.sep}es${path.sep}`)) {
        lang = 'es';
    }

    console.log(`Fetching data for ${appId} (lang: ${lang})...`);

    const appInfo = await gplay.app({ appId, lang });

    let updated = false;

    // Update realIconUrl
    if (appInfo.icon && appInfo.icon !== data.realIconUrl) {
      data.realIconUrl = appInfo.icon;
      updated = true;
    }

    // Update heroImage (headerImage)
    if (appInfo.headerImage && appInfo.headerImage !== data.heroImage) {
      data.heroImage = appInfo.headerImage;
      updated = true;
    }

    // Update screenshots
    if (appInfo.screenshots && appInfo.screenshots.length > 0) {
      // Check if arrays are different
      const currentScreenshots = data.screenshots || [];
      const isDifferent = appInfo.screenshots.length !== currentScreenshots.length ||
                          appInfo.screenshots.some((url, i) => url !== currentScreenshots[i]);

      if (isDifferent) {
        data.screenshots = appInfo.screenshots;
        updated = true;
      }
    }

    // Update rating (rounded to 1 decimal)
    if (appInfo.score) {
      const roundedScore = Math.round(appInfo.score * 10) / 10;
      if (roundedScore !== data.rating) {
        data.rating = roundedScore;
        updated = true;
      }
    } else if (data.rating !== undefined) {
      // If there's no score in the store but we have a rating, remove it
      delete data.rating;
      updated = true;
    }

    // Update version
    if (appInfo.version && appInfo.version !== data.version) {
      data.version = appInfo.version;
      updated = true;
    }

    // Update lastUpdated
    if (appInfo.updated) {
        const date = new Date(appInfo.updated);
        // Format to something like "Jul 23, 2025" or "23 Jul 2025"
        // Let's use the native date formatter based on lang
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', options);

        if (formattedDate !== data.lastUpdated && data.lastUpdated !== appInfo.updated) {
             // Fallback to storing string if formatting gets weird or store raw string from playstore
             // appInfo.updated is a timestamp (number)
             // We can also just store string "Jul 23, 2025"
             data.lastUpdated = formattedDate;
             updated = true;
        }
    }

    // Actualizar la descripción de la ficha de la tienda en el cuerpo del artículo
    let bodyUpdated = false;
    if (appInfo.description) {
      const STORE_START = '<!-- STORE_DESCRIPTION_START -->';
      const STORE_END   = '<!-- STORE_DESCRIPTION_END -->';
      const startIdx = parsed.content.indexOf(STORE_START);
      const endIdx   = parsed.content.indexOf(STORE_END);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const currentSection = parsed.content.slice(startIdx + STORE_START.length, endIdx);
        const newSection     = `\n\n${appInfo.description}\n\n`;

        if (currentSection.trim() !== appInfo.description.trim()) {
          parsed.content =
            parsed.content.slice(0, startIdx + STORE_START.length) +
            newSection +
            parsed.content.slice(endIdx);
          bodyUpdated = true;
        }
      }
    }

    if (updated || bodyUpdated) {
      const newContent = matter.stringify(parsed.content, data);
      await fs.promises.writeFile(filePath, newContent, 'utf8');
      console.log(`[OK] Updated ${path.basename(filePath)} with latest Google Play data.`);
    } else {
      console.log(`[SKIP] No updates needed for ${path.basename(filePath)}.`);
    }

  } catch (error) {
    console.error(`[ERROR] Failed to fetch data for ${filePath}:`, error.message);
  }
}

async function walkDir(dir) {
  const files = await fs.promises.readdir(dir);
  const tasks = files.map(async (file) => {
    const fullPath = path.join(dir, file);
    const stat = await fs.promises.stat(fullPath);
    if (stat.isDirectory()) {
      return walkDir(fullPath);
    } else if (file.endsWith('.md')) {
      return processFile(fullPath);
    }
  });
  await Promise.all(tasks);
}

async function main() {
  console.log('Starting Google Play data update (images + store description)...');
  try {
    const appsDirExists = await fs.promises.access(APPS_DIR).then(() => true).catch(() => false);
    if (appsDirExists) {
      await walkDir(APPS_DIR);
      console.log('Finished updating Google Play data.');
    } else {
      console.error(`Directory not found: ${APPS_DIR}`);
    }
  } catch (error) {
    console.error('Error during update process:', error);
    process.exit(1);
  }
}

main();
