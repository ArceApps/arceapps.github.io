import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLLECTIONS = ['blog', 'devlog'] as const;
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src/content');

interface Post {
  filename: string;
  referenceId: string | undefined;
}

type Status = 'PAIR' | 'ORPHAN_EN' | 'ORPHAN_ES' | 'MISMATCH';

interface Finding {
  collection: string;
  status: Status;
  enName?: string;
  esName?: string;
  referenceId?: string;
  detail: string;
}

function readPostMetadata(lang: string, collection: string): Map<string, Post> {
  const dir = path.join(CONTENT_DIR, collection, lang);
  const map = new Map<string, Post>();
  if (!fs.existsSync(dir)) return map;
  for (const filename of fs.readdirSync(dir)) {
    if (!filename.endsWith('.md')) continue;
    const full = path.join(dir, filename);
    const raw = fs.readFileSync(full, 'utf8');
    const m = raw.match(/^reference_id:\s*['"]?([a-f0-9-]+)['"]?\s*$/m);
    map.set(filename, { filename, referenceId: m ? m[1] : undefined });
  }
  return map;
}

function checkCollection(collection: string): { findings: Finding[]; mismatches: number; orphans: number } {
  const en = readPostMetadata('en', collection);
  const es = readPostMetadata('es', collection);
  const findings: Finding[] = [];
  let mismatches = 0;
  let orphans = 0;

  // Detect MISMATCH: for each EN file, is there an ES file with the SAME
  // reference_id? If yes but the filename is different -> MISMATCH.
  // If the filename is the same -> PAIR.
  for (const [enName, enPost] of en) {
    let matched: { name: string; post: Post } | undefined;
    if (enPost.referenceId) {
      for (const [esName, esPost] of es) {
        if (esPost.referenceId === enPost.referenceId) {
          matched = { name: esName, post: esPost };
          break;
        }
      }
    }
    if (matched && matched.name !== enName) {
      mismatches++;
      findings.push({
        collection,
        status: 'MISMATCH',
        enName,
        esName: matched.name,
        referenceId: enPost.referenceId,
        detail: `same reference_id (${enPost.referenceId}) but different filename: en=${enName}, es=${matched.name}`,
      });
    } else if (!matched) {
      orphans++;
      findings.push({
        collection,
        status: 'ORPHAN_EN',
        enName,
        referenceId: enPost.referenceId,
        detail: `exists only in en/ (no ES file with same reference_id${enPost.referenceId ? ` ${enPost.referenceId}` : ''})`,
      });
    }
  }

  // Detect ORPHAN_ES: ES files that have no EN equivalent.
  for (const [esName, esPost] of es) {
    let matched = false;
    if (esPost.referenceId) {
      for (const enPost of en.values()) {
        if (enPost.referenceId === esPost.referenceId) {
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      orphans++;
      findings.push({
        collection,
        status: 'ORPHAN_ES',
        esName,
        referenceId: esPost.referenceId,
        detail: `exists only in es/ (no EN file with same reference_id${esPost.referenceId ? ` ${esPost.referenceId}` : ''})`,
      });
    }
  }

  return { findings, mismatches, orphans };
}

function main(): number {
  let totalMismatches = 0;
  let totalOrphans = 0;
  for (const collection of COLLECTIONS) {
    const { findings, mismatches, orphans } = checkCollection(collection);
    totalMismatches += mismatches;
    totalOrphans += orphans;
    for (const f of findings) {
      if (f.status === 'MISMATCH') {
        console.error(`FAIL  [${f.collection}] ${f.detail}`);
      } else {
        console.warn(`WARN  [${f.collection}] ${f.detail}`);
      }
    }
  }
  console.log('');
  if (totalMismatches > 0) {
    console.error(`${totalMismatches} MISMATCH(es). Filename parity violated; build blocked.`);
    return 1;
  }
  if (totalOrphans > 0) {
    console.warn(`${totalOrphans} ORPHAN(s). Articles in only one language. Not a build failure.`);
  }
  console.log('OK: i18n parity check passed.');
  return 0;
}

process.exit(main());
