import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '../..');
const COMPONENT_DIR = path.join(ROOT_DIR, 'src/components');

const filePath = (file: string) => path.join(COMPONENT_DIR, file);
const readComponent = (file: string) => {
  const sourcePath = filePath(file);
  return fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : '';
};

const cardSource = readComponent('Card.astro');
const pageIntroSource = readComponent('PageIntro.astro');
const blogCardSource = readComponent('BlogCard.astro');
const projectCardSource = readComponent('ProjectCard.astro');
const appCardSource = readComponent('AppCard.astro');

describe('contrato de primitivas de superficie', () => {
  it('declara Card como una primitiva tipada y ligera', () => {
    expect(fs.existsSync(filePath('Card.astro')), 'Falta Card.astro').toBe(true);
    expect(cardSource).not.toContain('astro:content');
    expect(cardSource).toMatch(/CardVariant\s*=\s*["']article["']\s*\|/);
    expect(cardSource).toContain('"app"');
    expect(cardSource).toContain('"feature"');
    expect(cardSource).toMatch(/href\??\s*:/);
    expect(cardSource).toMatch(/ariaLabel\??\s*:/);
    expect(cardSource).toMatch(/class(Name)?\??\s*:/);
    expect(cardSource).toMatch(/bg-surface-raised/);
    expect(cardSource).toMatch(/border-border/);
    expect(cardSource).toMatch(/focus-visible:ring/);
    expect(cardSource).toMatch(/transition/);
    expect(cardSource).toMatch(/motion-reduce/);
    expect(cardSource).toContain('dark:bg-dark-surface-raised');
  });

  it('declara PageIntro para textos localizados con composición responsive', () => {
    expect(fs.existsSync(filePath('PageIntro.astro')), 'Falta PageIntro.astro').toBe(true);
    expect(pageIntroSource).toMatch(/title\s*:\s*string/);
    expect(pageIntroSource).toMatch(/description\s*:\s*string/);
    expect(pageIntroSource).toMatch(/text-4xl/);
    expect(pageIntroSource).toMatch(/md:text-5xl/);
    expect(pageIntroSource).toMatch(/max-w-/);
  });

  it('migra cada card a la variante de superficie correspondiente', () => {
    expect(blogCardSource).toContain('import Card from "./Card.astro"');
    expect(blogCardSource).toMatch(/<Card[\s\S]*variant="article"/);
    expect(projectCardSource).toContain('import Card from "./Card.astro"');
    expect(projectCardSource).toMatch(/<Card[\s\S]*variant="app"/);
    expect(appCardSource).toContain('import Card from "./Card.astro"');
    expect(appCardSource).toMatch(/<Card[\s\S]*variant="app"/);
  });
});
