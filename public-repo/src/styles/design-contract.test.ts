import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '../..');
const RELEVANT_FILES = [
  'src/styles/global.css',
  'src/pages/404.astro',
  'src/layouts/Layout.astro',
  'src/components/pages/HomePage.astro',
] as const;

const sourceByFile = Object.fromEntries(
  await Promise.all(
    RELEVANT_FILES.map(async (file) => [
      file,
      await fs.readFile(path.join(ROOT_DIR, file), 'utf8'),
    ])
  )
) as Record<(typeof RELEVANT_FILES)[number], string>;

const globalStyles = sourceByFile['src/styles/global.css'];
const consumers = RELEVANT_FILES.filter(
  (file) => file !== 'src/styles/global.css'
).map((file) => sourceByFile[file]);
const consumerSource = consumers.join('\n');

describe('contrato de diseño visual', () => {
  it('declara tokens semánticos para superficie, contenido, borde, foco y elevación', () => {
    const requiredTokens = [
      '--color-surface',
      '--color-surface-subtle',
      '--color-surface-raised',
      '--color-content',
      '--color-content-muted',
      '--color-border',
      '--color-border-strong',
      '--color-focus',
      '--color-focus-contrast',
      '--shadow-elevation-1',
      '--shadow-elevation-2',
      '--shadow-elevation-3',
    ];

    for (const token of requiredTokens) {
      expect(globalStyles, `Falta el token ${token}`).toContain(token);
    }

    expect(globalStyles).toContain('--color-dark-surface-subtle');
    expect(globalStyles).toContain('--color-dark-surface-raised');
    expect(globalStyles).toContain('--color-dark-content');
    expect(globalStyles).toContain('--color-dark-content-muted');
    expect(globalStyles).toContain('--color-dark-border');
    expect(globalStyles).toContain('--color-dark-border-strong');
    expect(globalStyles).toContain('--color-dark-focus');
    expect(globalStyles).toContain('--color-dark-focus-contrast');
    expect(globalStyles).toContain('--shadow-dark-elevation-1');
    expect(globalStyles).toContain('--shadow-dark-elevation-2');
    expect(globalStyles).toContain('--shadow-dark-elevation-3');
  });

  it('no consume tokens inexistentes en los archivos permitidos', () => {
    expect(consumerSource).not.toMatch(/\bbg-primary-dark\b/);
    expect(consumerSource).not.toMatch(/\belevation-4\b/);
  });

  it('no aplica hover tipográfico global a los headings', () => {
    expect(globalStyles).not.toMatch(/h[1-6]\s*:hover/);
    expect(globalStyles).not.toMatch(/\.prose\s+h[1-6]\s*:hover/);
    expect(globalStyles).not.toMatch(/\.font-(semibold|bold|extrabold)\s*:hover/);
  });
});
