import Parser from 'rss-parser';
import fs from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';

const parser = new Parser();

const FEEDS = [
  { name: 'Android Developers Blog', url: 'https://feeds.feedburner.com/blogspot/hsDu' },
  { name: 'ProAndroidDev', url: 'https://proandroiddev.com/feed' },
  { name: 'Kotlin Blog', url: 'https://blog.jetbrains.com/kotlin/feed/' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Google AI Blog', url: 'https://feeds.feedburner.com/blogspot/gJZg' }
];

const OUTPUT_DIR = path.join(process.cwd(), 'agents', 'workspace');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'news_feed_raw.json');

/**
 * Sanitizes text by removing HTML tags (including script/style content) and normalizing whitespace.
 * @param {string} text - The text to sanitize.
 * @param {number} maxLength - Maximum length of the result.
 * @returns {string} - Sanitized text.
 */
function sanitize(text, maxLength = 500) {
  if (!text) return '';

  // Use JSDOM to parse HTML
  const dom = new JSDOM(text);
  const doc = dom.window.document;

  // Remove script and style elements to prevent their content from appearing in textContent
  doc.querySelectorAll('script, style').forEach(el => el.remove());

  // Extract text content
  let clean = doc.body.textContent || "";

  // Normalize whitespace (remove newlines, multiple spaces)
  clean = clean.replace(/\s+/g, ' ').trim();

  // Truncate
  if (clean.length > maxLength) {
    return clean.substring(0, maxLength) + '...';
  }

  return clean;
}

async function fetchFeeds() {
  console.log('📰 Starting RSS Feed Collection...');

  const allItems = [];

  for (const feed of FEEDS) {
    try {
      console.log(`fetching ${feed.name}...`);
      const feedData = await parser.parseURL(feed.url);

      const items = feedData.items.slice(0, 10).map(item => ({
        source: feed.name,
        title: sanitize(item.title, 150),
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: sanitize(item.contentSnippet || item.summary || item.content || '', 500)
      }));

      allItems.push(...items);
    } catch (error) {
      console.error(`❌ Error fetching ${feed.name}:`, error.message);
    }
  }

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Write to file
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(allItems, null, 2), 'utf-8');

  console.log(`✅ Successfully saved ${allItems.length} articles to ${OUTPUT_FILE}`);
}

fetchFeeds();
