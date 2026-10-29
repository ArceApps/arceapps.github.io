import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
describe('imagery assets', () => {
  it('fotos stock presentes en src/assets', () => {
    expect(existsSync('src/assets/hero-mountain-sunset.jpg')).toBe(true);
    expect(existsSync('src/assets/about-mountains.jpg')).toBe(true);
  });
});
