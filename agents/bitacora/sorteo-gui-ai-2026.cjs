// Sorteo del Torneo GUI IA 2026 con Fisher-Yates sembrado.
// Semilla: hash sha256 de "2026-07-08".
// Salida: archivo agents/bitacora/sorteo-gui-ai-2026.txt con los cruces.

const fs = require('node:fs');
const path = require('node:crypto');
const crypto = require('node:crypto');

const seedSource = '2026-07-08';
const seedHex = crypto.createHash('sha256').update(seedSource).digest('hex').slice(0, 8);
const seedInt = parseInt(seedHex, 16);
console.log('Semilla (sha256("2026-07-08")[:8]) =>', seedInt, 'hex', seedHex);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(seedInt);

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const occidentales = [
  { id: 'W1', name: 'Cursor', vendor: 'Anysphere' },
  { id: 'W2', name: 'Windsurf', vendor: 'Exafunction' },
  { id: 'W3', name: 'Zed', vendor: 'Zed Industries' },
  { id: 'W4', name: 'GitHub Copilot', vendor: 'Microsoft / GitHub' },
  { id: 'W5', name: 'Claude Desktop', vendor: 'Anthropic' },
  { id: 'W6', name: 'ChatGPT Desktop', vendor: 'OpenAI' },
  { id: 'W7', name: 'JetBrains AI Assistant', vendor: 'JetBrains' },
  { id: 'W8', name: 'Cline', vendor: 'Cline (OSS)' }
];

const chinos = [
  { id: 'C1', name: 'DeepSeek Desktop', vendor: 'DeepSeek AI' },
  { id: 'C2', name: 'Kimi', vendor: 'Moonshot AI' },
  { id: 'C3', name: 'Qwen / Tongyi Yuanbao', vendor: 'Alibaba Cloud' },
  { id: 'C4', name: 'MiniMax', vendor: 'MiniMax' },
  { id: 'C5', name: 'Mimo', vendor: 'Xiaomi' },
  { id: 'C6', name: 'Doubao', vendor: 'ByteDance' },
  { id: 'C7', name: 'Lingma', vendor: 'Alibaba Cloud' },
  { id: 'C8', name: 'iFlyCode', vendor: 'iFlytek' }
];

function bracket(pool, label) {
  const shuffled = shuffle(pool);
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({ m: matches.length + 1, a: shuffled[i], b: shuffled[i + 1] });
  }
  return { label, shuffled, matches };
}

const sf1 = bracket(occidentales, 'SF1 Occidental');
const sf2 = bracket(chinos, 'SF2 Chino');

const lines = [];
lines.push('=== SORTEO TORNEO GUI IA 2026 ===');
lines.push('Fecha del sorteo: 2026-07-08');
lines.push('Semilla: sha256("2026-07-08")[0..8] = ' + seedInt + ' (hex ' + seedHex + ')');
lines.push('Algoritmo: Fisher-Yates sembrado con PRNG Mulberry32');
lines.push('PRNG reproducible: ejecutar este script devuelve el mismo orden.');
lines.push('Formato del torneo: round-robin todos contra todos en cada semifinal.');
lines.push('Final: 2 ganadores de SF1 + 2 ganadores de SF2, comparativa real sin bracket.');
lines.push('');
lines.push('Nota: el round-robin implica que los cruces de a pares solo son para');
lines.push('orden narrativo. Todas las apps se enfrentan entre si en cada semifinal.');
lines.push('');

for (const sf of [sf1, sf2]) {
  lines.push('--- ' + sf.label + ' ---');
  lines.push('Orden barajado: ' + sf.shuffled.map((x) => x.id + '(' + x.name + ')').join(', '));
  lines.push('Bloques narrativos (orden de presentacion):');
  for (const m of sf.matches) {
    lines.push('  Bloque ' + m.m + ': ' + m.a.name + ' [' + m.a.id + '] vs ' + m.b.name + ' [' + m.b.id + ']');
  }
  lines.push('');
}

const out = 'agents/bitacora/sorteo-gui-ai-2026.txt';
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log('\nGuardado en:', out);
console.log(lines.join('\n'));