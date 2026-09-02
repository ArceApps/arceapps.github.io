const { performance } = require('perf_hooks');

// Generate mock data
const numPosts = 1000;
const allTags = ['javascript', 'typescript', 'astro', 'react', 'vue', 'css', 'html', 'node', 'deno', 'python', 'go', 'rust', 'c++', 'java', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'flutter'];

const sortedPosts = Array.from({ length: numPosts }, (_, i) => ({
  slug: `post-${i}`,
  data: {
    tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => allTags[Math.floor(Math.random() * allTags.length)]),
    pubDate: new Date(Date.now() - Math.random() * 10000000000),
    title: `Post ${i}`
  }
}));

function originalMethod() {
  const start = performance.now();
  const results = sortedPosts.map((post) => {
    const currentTags = post.data.tags || [];
    const relatedPosts = sortedPosts
      .filter(p => p.slug !== post.slug)
      .map(p => {
        const commonTags = (p.data.tags || []).filter(t => currentTags.includes(t)).length;
        return { ...p, commonTags };
      })
      .sort((a, b) => {
        if (b.commonTags !== a.commonTags) return b.commonTags - a.commonTags;
        return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
      })
      .slice(0, 3);
    return relatedPosts;
  });
  const end = performance.now();
  return end - start;
}

function optimizedMethodBestFlatSet2() {
  const start = performance.now();

  const results = sortedPosts.map((post) => {
    const currentTags = post.data.tags || [];
    const currentTagsSet = new Set(currentTags);

    const relatedPosts = [];

    for (let i = 0; i < sortedPosts.length; i++) {
      const p = sortedPosts[i];
      if (p.slug === post.slug) continue;

      let commonTags = 0;
      const pTags = p.data.tags;
      if (pTags) {
        for (let j = 0; j < pTags.length; j++) {
          if (currentTagsSet.has(pTags[j])) {
            commonTags++;
          }
        }
      }

      relatedPosts.push({ post: p, commonTags });
    }

    relatedPosts.sort((a, b) => {
      if (b.commonTags !== a.commonTags) return b.commonTags - a.commonTags;
      return b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf();
    });

    return relatedPosts.slice(0, 3).map(r => ({ ...r.post, commonTags: r.commonTags }));
  });
  const end = performance.now();
  return end - start;
}

let sumOriginal = 0;
let sumBestFlatSet2 = 0;
const iterations = 50;

// Warmup
for (let i = 0; i < 10; i++) {
    originalMethod();
    optimizedMethodBestFlatSet2();
}

for (let i = 0; i < iterations; i++) {
    sumOriginal += originalMethod();
    sumBestFlatSet2 += optimizedMethodBestFlatSet2();
}

console.log(`Original Avg: ${(sumOriginal/iterations).toFixed(2)}ms`);
console.log(`Optimized Avg (Best Flat Set): ${(sumBestFlatSet2/iterations).toFixed(2)}ms`);
console.log(`Improvement: ${(((sumOriginal/iterations) - (sumBestFlatSet2/iterations)) / (sumOriginal/iterations) * 100).toFixed(2)}%`);
