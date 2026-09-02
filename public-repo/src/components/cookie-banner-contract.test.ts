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

describe('contrato del banner de consentimiento de cookies', () => {
  it('existe CookieBanner.astro con la estructura del banner', () => {
    expect(banner).toContain('id="cookie-banner"');
    expect(banner).toContain('data-cookie-action="accept"');
    expect(banner).toContain('data-cookie-action="reject"');
    expect(banner).toContain('role="dialog"');
    expect(banner).toMatch(/cookie-consent/);
    expect(banner).toMatch(/gtag\("consent", "update", \{ analytics_storage: value \}\)/);
    expect(banner).toContain('astro:before-swap');
  });

  it('Layout.astro declara el consent default ANTES del bloque partytown de gtag', () => {
    const consentIdx = layout.indexOf('gtag("consent", "default"');
    const gtagSrcIdx = layout.indexOf('googletagmanager.com/gtag/js');
    expect(consentIdx, 'falta el consent default').toBeGreaterThan(-1);
    expect(gtagSrcIdx, 'falta el script gtag partytown').toBeGreaterThan(-1);
    expect(consentIdx).toBeLessThan(gtagSrcIdx);
    expect(layout).toMatch(/ad_storage: "denied"/);
    expect(layout).toMatch(/ad_user_data: "denied"/);
    expect(layout).toMatch(/ad_personalization: "denied"/);
    expect(layout).toMatch(/analytics_storage: "denied"/);
    expect(layout).toContain('CookieBanner');
  });

  it('ui.ts contiene las claves i18n del banner en EN y ES', () => {
    ['cookie.aria', 'cookie.accept', 'cookie.reject', 'cookie.more_info', 'footer.cookies'].forEach((k) => {
      const count = (ui.match(new RegExp(`'${k}'`, 'g')) || []).length;
      expect(count, `clave ${k} debe existir en EN y ES`).toBe(2);
    });
  });
});
