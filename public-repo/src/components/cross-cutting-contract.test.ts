import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '../..');
const COMPONENT_DIR = path.join(ROOT_DIR, 'src/components');
const GLOBAL_STYLES = path.join(ROOT_DIR, 'src/styles/global.css');

const readFile = (filePath: string) => fs.readFileSync(filePath, 'utf8');

describe('contrato transversal de motion y foco', () => {
  it('ofrece reduced motion y elimina transforms hover en superficies auditadas', () => {
    const files = [
      'AppCard.astro',
      'BlogCard.astro',
      'ProjectCard.astro',
      'PostNavigation.astro',
      'SocialShare.astro',
    ];

    for (const file of files) {
      const source = readFile(path.join(COMPONENT_DIR, file));
      expect(source, `${file} debe declarar una salida para reduced motion`).toMatch(
        /motion-reduce/
      );
      expect(source, `${file} no debe animar transforms en estados hover`).not.toMatch(
        /(?:hover|group-hover|group-focus-visible):(?:scale|translate|rotate)-/
      );
    }
  });

  it('desactiva globalmente transiciones y animaciones no esenciales con reduced motion', () => {
    const source = readFile(GLOBAL_STYLES);

    expect(source).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\{\s*\*,\s*\*::before,\s*\*::after\s*\{[\s\S]*animation-duration[\s\S]*transition-duration/
    );
    expect(source).toContain('scroll-behavior: auto !important;');
  });

  it('mantiene foco visible y nombres accesibles en compartir y navegación de artículos', () => {
    for (const file of ['PostNavigation.astro', 'SocialShare.astro']) {
      const source = readFile(path.join(COMPONENT_DIR, file));
      const interactiveElements = source.match(/<(?:a|button)\b[\s\S]*?>/g) ?? [];

      expect(interactiveElements.length, `${file} debe conservar elementos interactivos`).toBeGreaterThan(0);
      for (const element of interactiveElements) {
        expect(element, `${file} debe conservar foco visible por control`).toMatch(/focus-visible:/);
        expect(element, `${file} debe conservar aria-label por control`).toMatch(/aria-label/);
      }
    }
  });
});
