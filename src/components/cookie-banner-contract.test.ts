import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '../..');
const bannerPath = path.join(ROOT_DIR, 'src/components/CookieBanner.astro');
const layoutPath = path.join(ROOT_DIR, 'src/layouts/Layout.astro');
const uiPath = path.join(ROOT_DIR, 'src/i18n/ui.ts');

const banner = fs.existsSync(bannerPath) ? fs.readFileSync(bannerPath, 'utf8') : '';
const layout = fs.existsSync(layoutPath) ? fs.readFileSync(layoutPath, 'utf8') : '';
const ui = fs.existsSync(uiPath) ? fs.readFileSync(uiPath, 'utf8') : '';

describe('contrato del banner de cookies funcionales', () => {
  it('existe CookieBanner.astro con la estructura del banner', () => {
    expect(banner).toContain('id="cookie-banner"');
    expect(banner).toContain('data-cookie-action');
    expect(banner).toContain('role="dialog"');
    expect(banner).toMatch(/cookie-consent/);
    expect(banner).toContain('astro:before-swap');
  });

  it('el IIFE usa event-delegation sobre document (no listeners directos)', () => {
    expect(banner).toMatch(/document\.addEventListener\(\s*["']click["']/);
    expect(banner).toMatch(/closest\(["']\[data-cookie-action\]["']\)/);
  });

  it('Layout.astro NO carga Google Analytics ni gtag', () => {
    expect(layout).not.toMatch(/googletagmanager\.com/);
    expect(layout).not.toMatch(/gtag\(/);
    expect(layout).not.toMatch(/google-analytics\.com/);
    expect(layout).toContain('CookieBanner');
  });

  it('el copy no menciona Google Analytics ni analytics de terceros', () => {
    expect(banner).not.toMatch(/[Gg]oogle [Aa]nalytics/);
    expect(banner).not.toMatch(/[Aa]nalytics cookies/);
  });

  it('ui.ts contiene las claves i18n del banner en EN y ES', () => {
    ['cookie.aria', 'cookie.dismiss', 'cookie.more_info', 'footer.cookies'].forEach((k) => {
      const count = (ui.match(new RegExp(`'${k}'`, 'g')) || []).length;
      expect(count, `clave ${k} debe existir en EN y ES`).toBe(2);
    });
  });
});
