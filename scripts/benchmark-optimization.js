
function generateData(count) {
  const posts = Array.from({ length: count }, (_, i) => ({
    data: { reference_id: `ref-${i}` },
    slug: `en/post-${i}`
  }));

  const translations = Array.from({ length: count }, (_, i) => ({
    data: { reference_id: `ref-${i}` },
    slug: `es/post-${i}`
  }));

  return { posts, translations };
}

function runOld(posts, translations) {
  const start = performance.now();
  const result = posts.map(post => {
    let translatedPath = undefined;
    if (post.data.reference_id) {
       const esPost = translations.find(p => p.data.reference_id === post.data.reference_id);
       if (esPost) {
         translatedPath = `/es/blog/${esPost.slug.split('/').pop()}`;
       }
    }
    return translatedPath;
  });
  const end = performance.now();
  return end - start;
}

function runNew(posts, translations) {
  const start = performance.now();
  const translationsMap = new Map(translations.map(p => [p.data.reference_id, p]));
  const result = posts.map(post => {
    let translatedPath = undefined;
    if (post.data.reference_id) {
       const esPost = translationsMap.get(post.data.reference_id);
       if (esPost) {
         translatedPath = `/es/blog/${esPost.slug.split('/').pop()}`;
       }
    }
    return translatedPath;
  });
  const end = performance.now();
  return end - start;
}

const sizes = [70, 500, 2000];

console.log('--- Performance Benchmark: O(N^2) vs O(N) ---');

sizes.forEach(size => {
  const { posts, translations } = generateData(size);
  console.log(`\nDataset size: ${size} posts`);

  const timeOld = runOld(posts, translations);
  console.log(`Old method (O(N^2)): ${timeOld.toFixed(4)}ms`);

  const timeNew = runNew(posts, translations);
  console.log(`New method (O(N)): ${timeNew.toFixed(4)}ms`);

  const improvement = ((timeOld - timeNew) / timeOld * 100).toFixed(2);
  console.log(`Improvement: ${improvement}%`);
});
