import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('derived surfaces', () => {
  it('footer con atribucion de fotos stock', () => {
    const s = readFileSync('src/components/Footer.astro', 'utf8');
    expect(s).toContain('Unsplash');
    expect(s).toContain('6D6omiCxHWM');
    expect(s).toContain('3no88nSvK88');
  });
});
