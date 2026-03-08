
const FEEDS = [
  { name: 'Android Developers Blog', url: 'https://feeds.feedburner.com/blogspot/hsDu' },
  { name: 'ProAndroidDev', url: 'https://proandroiddev.com/feed' },
  { name: 'Kotlin Blog', url: 'https://blog.jetbrains.com/kotlin/feed/' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Google AI Blog', url: 'https://feeds.feedburner.com/blogspot/gJZg' }
];

// Mock Parser simulating network delay
const mockParser = {
  parseURL: async (url) => {
    // Simulate 200ms delay per request
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      items: [
        { title: 'Test Item', link: 'https://example.com', pubDate: new Date().toISOString(), contentSnippet: 'Snippet' }
      ]
    };
  }
};

async function sequentialFetch() {
  console.log('--- Sequential Fetch (Baseline) ---');
  const start = Date.now();
  const allItems = [];

  for (const feed of FEEDS) {
    try {
      // console.log(`fetching ${feed.name}...`);
      const feedData = await mockParser.parseURL(feed.url);
      const items = feedData.items.slice(0, 10).map(item => ({
        source: feed.name,
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet
      }));
      allItems.push(...items);
    } catch (error) {
      console.error(`❌ Error fetching ${feed.name}:`, error.message);
    }
  }

  const duration = Date.now() - start;
  console.log(`Duration: ${duration}ms`);
  return duration;
}

async function parallelFetch() {
  console.log('--- Parallel Fetch (Optimized) ---');
  const start = Date.now();

  const feedPromises = FEEDS.map(async (feed) => {
    try {
      // console.log(`fetching ${feed.name}...`);
      const feedData = await mockParser.parseURL(feed.url);
      return feedData.items.slice(0, 10).map(item => ({
        source: feed.name,
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet
      }));
    } catch (error) {
      console.error(`❌ Error fetching ${feed.name}:`, error.message);
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  const allItems = results.flat();

  const duration = Date.now() - start;
  console.log(`Duration: ${duration}ms`);
  return duration;
}

async function runBenchmark() {
  const seqTime = await sequentialFetch();
  const parTime = await parallelFetch();

  console.log('\n--- Results Summary ---');
  console.log(`Sequential: ${seqTime}ms`);
  console.log(`Parallel:   ${parTime}ms`);
  console.log(`Improvement: ${((seqTime - parTime) / seqTime * 100).toFixed(2)}%`);
}

runBenchmark();
