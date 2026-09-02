import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const expectedDeveloperUrl =
  'https://play.google.com/store/apps/dev?id=8812775800441745731';

const developerLinkSources = [
  'src/components/Footer.astro',
  'src/components/home/HomeCta.astro',
  'src/pages/404.astro',
  'src/pages/privacy-policy.astro',
];

describe('Google Play developer links', () => {
  it.each(developerLinkSources)('uses the numeric developer URL in %s', (relativePath) => {
    const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8');

    expect(source).toContain(`href="${expectedDeveloperUrl}"`);
  });

  it('does not retain the previous developer URL format', () => {
    for (const relativePath of developerLinkSources) {
      const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8');

      expect(source).not.toContain('https://play.google.com/store/apps/developer?id=');
    }
  });
});
