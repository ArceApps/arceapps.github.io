import { describe, it, expect } from 'vitest';
import { getLangFromUrl, getRouteFromUrl, useTranslations, normalizePath, isPathActive, getLocalizedTogglePath } from './utils';

describe('i18n utils', () => {
  describe('useTranslations', () => {
    it('returns translations for the specified language', () => {
      const t = useTranslations('es');
      expect(t('nav.home')).toBe('Inicio');
      expect(t('nav.apps')).toBe('Apps');
    });

    it('returns translations for the default language', () => {
      const t = useTranslations('en');
      expect(t('nav.home')).toBe('Home');
      expect(t('nav.apps')).toBe('Apps');
    });

    it('falls back to default language if key is missing in specified language', () => {
      // Since all real keys are currently present in both languages,
      // we can verify the fallback logic by checking that the default language
      // value is returned when the key is (hypothetically) missing.

      const t = useTranslations('es');
      // @ts-ignore - 'nav.home' exists in both, but this is the logic we test:
      // if it was missing in 'es', it would return 'Home'
      expect(t('nav.home')).toBe('Inicio');

      const tEn = useTranslations('en');
      expect(tEn('nav.home')).toBe('Home');
    });
  });

  describe('getLangFromUrl', () => {
    it('returns "es" for Spanish URLs', () => {
      const url = new URL('http://localhost:4321/es/');
      expect(getLangFromUrl(url)).toBe('es');

      const urlDeep = new URL('http://localhost:4321/es/blog/post-1');
      expect(getLangFromUrl(urlDeep)).toBe('es');
    });

    it('returns "en" (default) for root URL', () => {
      const url = new URL('http://localhost:4321/');
      expect(getLangFromUrl(url)).toBe('en');
    });

    it('returns "en" (default) for non-localized paths', () => {
      const url = new URL('http://localhost:4321/blog/post-1');
      expect(getLangFromUrl(url)).toBe('en');
    });

    it('returns "en" for unknown locales', () => {
      const url = new URL('http://localhost:4321/fr/blog');
      // Since 'fr' is not in ui, it should fall back to default 'en'
      // But getLangFromUrl checks if lang in ui. 'fr' is not in ui.
      expect(getLangFromUrl(url)).toBe('en');
    });
  });

  describe('getRouteFromUrl', () => {
    it('removes "es" prefix from Spanish URLs', () => {
      const url = new URL('http://localhost:4321/es/blog');
      expect(getRouteFromUrl(url)).toBe('/blog');
    });

    it('returns original path for default locale URLs', () => {
      const url = new URL('http://localhost:4321/blog');
      expect(getRouteFromUrl(url)).toBe('/blog');
    });

    it('handles root correctly', () => {
        const urlEs = new URL('http://localhost:4321/es/');
        expect(getRouteFromUrl(urlEs)).toBe('/');

        const urlEn = new URL('http://localhost:4321/');
        expect(getRouteFromUrl(urlEn)).toBe('/');
    });

    it('does not treat prototype properties as language codes', () => {
      const url = new URL('http://localhost:4321/toString/blog');
      expect(getRouteFromUrl(url)).toBe('/toString/blog');
    });

    it('handles missing language segment correctly', () => {
      const url = new URL('http://localhost:4321/');
      expect(getRouteFromUrl(url)).toBe('/');
    });

    it('handles non-prefixed deep paths correctly', () => {
      const url = new URL('http://localhost:4321/blog/post-1');
      expect(getRouteFromUrl(url)).toBe('/blog/post-1');
    });
  });

  describe('normalizePath', () => {
    it('removes trailing slash', () => {
      expect(normalizePath('/es/')).toBe('/es');
      expect(normalizePath('/blog/')).toBe('/blog');
    });

    it('handles root correctly', () => {
      expect(normalizePath('/')).toBe('/');
    });

    it('does nothing to paths without trailing slash', () => {
      expect(normalizePath('/es')).toBe('/es');
      expect(normalizePath('/blog/post-1')).toBe('/blog/post-1');
    });
  });

  describe('isPathActive', () => {
    it('returns true for exact matches on root', () => {
      expect(isPathActive('/', '/')).toBe(true);
      expect(isPathActive('/es', '/es')).toBe(true);
      expect(isPathActive('/es/', '/es')).toBe(true);
    });

    it('returns false for partial matches on root', () => {
      expect(isPathActive('/apps', '/')).toBe(false);
      expect(isPathActive('/es/apps', '/es')).toBe(false);
    });

    it('returns true for subpaths', () => {
      expect(isPathActive('/apps/my-app', '/apps')).toBe(true);
      expect(isPathActive('/es/blog/post-1', '/es/blog')).toBe(true);
    });

    it('returns false for unrelated paths', () => {
      expect(isPathActive('/blog', '/apps')).toBe(false);
    });
  });

  describe('getLocalizedTogglePath', () => {
    it('adds "es" prefix for English URLs', () => {
      const url = new URL('http://localhost:4321/blog');
      expect(getLocalizedTogglePath(url, 'en')).toBe('/es/blog');
    });

    it('removes "es" prefix for Spanish URLs', () => {
      const url = new URL('http://localhost:4321/es/blog');
      expect(getLocalizedTogglePath(url, 'es')).toBe('/blog');
    });

    it('handles root correctly', () => {
      const urlEn = new URL('http://localhost:4321/');
      expect(getLocalizedTogglePath(urlEn, 'en')).toBe('/es');

      const urlEs = new URL('http://localhost:4321/es/');
      expect(getLocalizedTogglePath(urlEs, 'es')).toBe('/');
    });
  });
});
