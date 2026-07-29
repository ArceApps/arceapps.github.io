import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

describe('contrato de fichas internas de proyectos', () => {
  it('mantiene rutas bilingües basadas en la colección de contenido', () => {
    const english = readSource('pages/projects/[...slug].astro');
    const spanish = readSource('pages/es/projects/[...slug].astro');

    for (const page of [english, spanish]) {
      expect(page).toContain("getCollection('projects'");
      expect(page).toContain('getStaticPaths');
      expect(page).toContain('project.render()');
      expect(page).toContain('project.data.heroImage');
      expect(page).toContain('project.data.repositoryUrl');
    }
  });
});
