import Parser from 'rss-parser';
import fs from 'fs/promises';
import path from 'path';
import { sanitize } from './rss-utils.js';

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

async function fetchFeeds() {
  console.log('📰 Starting RSS Feed Collection...');

  const feedPromises = FEEDS.map(async (feed) => {
    try {
      console.log(`fetching ${feed.name}...`);
      const feedData = await parser.parseURL(feed.url);

      return feedData.items.slice(0, 10).map(item => ({
        source: feed.name,
        title: sanitize(item.title, 150),
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: sanitize(item.contentSnippet || item.summary || item.content || '', 500)
      }));
    } catch (error) {
      console.error(`❌ Error fetching ${feed.name}:`, error.message);
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  const allItems = results.flat();

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Write to file
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(allItems, null, 2), 'utf-8');

  console.log(`✅ Successfully saved ${allItems.length} articles to ${OUTPUT_FILE}`);
}

fetchFeeds();
