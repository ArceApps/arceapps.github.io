import { performance } from 'perf_hooks';

const NUM_APPS = 1000;
const apps = Array.from({ length: NUM_APPS }, (_, i) => ({
  data: { reference_id: `ref_${i}` },
  slug: `es/app-${i}`
}));

const enApps = Array.from({ length: NUM_APPS }, (_, i) => ({
  data: { reference_id: `ref_${i}` },
  slug: `en/app-${i}`
}));

function baseline() {
  const start = performance.now();
  const result = apps.map((app) => {
    let hreflangPath = undefined;
    if (app.data.reference_id) {
      const enApp = enApps.find(a => a.data.reference_id === app.data.reference_id);
      if (enApp) {
        hreflangPath = `/apps/${enApp.slug.split('/').pop()}`;
      }
    }
    return hreflangPath;
  });
  return performance.now() - start;
}

function optimized() {
  const start = performance.now();

  const enAppsMap = new Map();
  for (let i = 0; i < enApps.length; i++) {
    const app = enApps[i];
    if (app.data.reference_id) {
      enAppsMap.set(app.data.reference_id, app);
    }
  }

  const result = apps.map((app) => {
    let hreflangPath = undefined;
    if (app.data.reference_id) {
      const enApp = enAppsMap.get(app.data.reference_id);
      if (enApp) {
        hreflangPath = `/apps/${enApp.slug.split('/').pop()}`;
      }
    }
    return hreflangPath;
  });
  return performance.now() - start;
}

// Warmup
for (let i = 0; i < 100; i++) {
  baseline();
  optimized();
}

let baselineTotal = 0;
let optimizedTotal = 0;
const iterations = 1000;

for (let i = 0; i < iterations; i++) {
  baselineTotal += baseline();
  optimizedTotal += optimized();
}

const baselineAvg = baselineTotal / iterations;
const optimizedAvg = optimizedTotal / iterations;

console.log(`Baseline Avg: ${baselineAvg.toFixed(4)} ms`);
console.log(`Optimized Avg: ${optimizedAvg.toFixed(4)} ms`);
console.log(`Improvement: ${((baselineAvg - optimizedAvg) / baselineAvg * 100).toFixed(2)}%`);
