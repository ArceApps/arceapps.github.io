import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('accessible screenshots', () => {
  it('has a native dialog, keyboard navigation and accessible controls', () => {
    const src = readFileSync('src/components/AppGallery.astro', 'utf8');
    for (const marker of ['<dialog', 'showModal()', "event.key === 'ArrowLeft'", "event.key === 'ArrowRight'", 'focus-visible:', 'aria-label']) expect(src).toContain(marker);
  });
});
