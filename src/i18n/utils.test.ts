import { describe, it, expect } from 'vitest';
import { getLangFromUrl, getRouteFromUrl } from './utils';

describe('i18n utils', () => {
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
  });
});
