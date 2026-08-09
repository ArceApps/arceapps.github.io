import { performance } from 'perf_hooks';

// Generate mock data
const allPosts = Array.from({ length: 1000 }, (_, i) => ({
  data: {
    tags: Array.from({ length: 5 }, (_, j) => `tag-${(i * 5 + j) % 50}`),
  }
}));

function original() {
  return [...new Set(allPosts.flatMap((post) => post.data.tags || []))].sort();
}

function optimized() {
  const tagsSet = new Set();
  for (let i = 0; i < allPosts.length; i++) {
    const tags = allPosts[i].data.tags;
    if (tags) {
      for (let j = 0; j < tags.length; j++) {
        tagsSet.add(tags[j]);
      }
    }
  }
  return [...tagsSet].sort();
}

// Warmup
for (let i = 0; i < 100; i++) {
  original();
  optimized();
}

const ITERATIONS = 10000;

const startOriginal = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  original();
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;

const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  optimized();
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Original: ${timeOriginal.toFixed(2)} ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)} ms`);
console.log(`Improvement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}%`);
