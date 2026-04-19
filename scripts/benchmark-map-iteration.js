
function generateData(numTags, namesPerTag) {
  const tagGroups = new Map();
  for (let i = 0; i < numTags; i++) {
    const displayNames = new Map();
    for (let j = 0; j < namesPerTag; j++) {
      displayNames.set(`Tag ${i} Name ${j}`, j);
    }
    tagGroups.set(`tag-${i}`, { displayNames, posts: new Set() });
  }
  return tagGroups;
}

function runOld(tagGroups) {
  const start = performance.now();
  const result = Array.from(tagGroups.entries()).map(([slug, data]) => {
    let bestDisplayName = "";
    let maxCount = -1;

    for (const [name, count] of data.displayNames.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestDisplayName = name;
      }
    }
    return { params: { tag: slug }, props: { tagName: bestDisplayName } };
  });
  const end = performance.now();
  return end - start;
}

function runNew(tagGroups) {
  const start = performance.now();
  const result = Array.from(tagGroups, ([slug, data]) => {
    let bestDisplayName = "";
    let maxCount = -1;

    for (const [name, count] of data.displayNames) {
      if (count > maxCount) {
        maxCount = count;
        bestDisplayName = name;
      }
    }
    return { params: { tag: slug }, props: { tagName: bestDisplayName } };
  });
  const end = performance.now();
  return end - start;
}

const tagGroups = generateData(5000, 5);

console.log('--- Performance Benchmark: Map Iteration Optimization ---');

// Warmup
runOld(tagGroups);
runNew(tagGroups);

let totalOld = 0;
let totalNew = 0;
const iterations = 100;

for (let i = 0; i < iterations; i++) {
  totalOld += runOld(tagGroups);
  totalNew += runNew(tagGroups);
}

const avgOld = totalOld / iterations;
const avgNew = totalNew / iterations;

console.log(`Average Old method: ${avgOld.toFixed(4)}ms`);
console.log(`Average New method: ${avgNew.toFixed(4)}ms`);

const improvement = ((avgOld - avgNew) / avgOld * 100).toFixed(2);
console.log(`Improvement: ${improvement}%`);
