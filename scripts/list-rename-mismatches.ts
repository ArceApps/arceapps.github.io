import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src/content');

interface Post {
  filename: string;
  referenceId: string | undefined;
}

interface Rename {
  collection: string;
  from: string;
  to: string;
}

const COLLECTIONS = ['blog', 'devlog'] as const;

function readPostMetadata(lang: string, collection: string): Map<string, Post> {
  const dir = path.join(CONTENT_DIR, collection, lang);
  const map = new Map<string, Post>();
  if (!fs.existsSync(dir)) return map;
  for (const filename of fs.readdirSync(dir)) {
    if (!filename.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(dir, filename), 'utf8');
    const m = raw.match(/^reference_id:\s*['"]?([a-f0-9-]+)['"]?\s*$/m);
    map.set(filename, { filename, referenceId: m ? m[1] : undefined });
  }
  return map;
}

function computeRenames(): Rename[] {
  const renames: Rename[] = [];
  for (const collection of COLLECTIONS) {
    const en = readPostMetadata('en', collection);
    const es = readPostMetadata('es', collection);
    for (const [enName, enPost] of en) {
      if (!enPost.referenceId) continue;
      for (const [esName, esPost] of es) {
        if (esPost.referenceId === enPost.referenceId && esName !== enName) {
          renames.push({ collection, from: esName, to: enName });
          break;
        }
      }
    }
  }
  return renames;
}

const renames = computeRenames();
console.log(`# ${renames.length} renames to apply (ES filename -> EN filename)`);
for (const r of renames) {
  console.log(`git mv src/content/${r.collection}/es/${r.from} src/content/${r.collection}/es/${r.to}`);
}
