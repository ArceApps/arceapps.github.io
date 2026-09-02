import { describe, it, expect } from 'vitest';
import { safeJsonLd } from './security';

describe('security utils', () => {
  describe('safeJsonLd', () => {
    it('serializes a simple object correctly', () => {
      const data = { name: 'ArceApps', type: 'WebSite' };
      const result = safeJsonLd(data);
      expect(result).toBe('{"name":"ArceApps","type":"WebSite"}');
      // Verify it's still valid JSON
      expect(JSON.parse(result)).toEqual(data);
    });

    it('escapes less-than and greater-than signs', () => {
      const data = { script: '</script><script>alert(1)</script>' };
      const result = safeJsonLd(data);
      expect(result).not.toContain('</script>');
      expect(result).toContain('\\u003c/script\\u003e');
      expect(result).toContain('\\u003cscript\\u003e');
      // Verify it's still valid JSON
      expect(JSON.parse(result)).toEqual(data);
    });

    it('escapes ampersands', () => {
      const data = { url: 'https://example.com?a=1&b=2' };
      const result = safeJsonLd(data);
      expect(result).toContain('\\u0026');
      expect(result).not.toContain('&');
      // Verify it's still valid JSON
      expect(JSON.parse(result)).toEqual(data);
    });

    it('escapes line separators', () => {
      const data = { text: '\u2028 and \u2029' };
      const result = safeJsonLd(data);
      expect(result).toContain('\\u2028');
      expect(result).toContain('\\u2029');
      // Verify it's still valid JSON
      expect(JSON.parse(result)).toEqual(data);
    });

    it('handles nested objects and arrays', () => {
      const data = {
        outer: {
          inner: '<b>bold</b>',
          list: ['&', '>']
        }
      };
      const result = safeJsonLd(data);
      expect(result).toContain('\\u003cb\\u003ebold\\u003c/b\\u003e');
      expect(result).toContain('\\u0026');
      expect(result).toContain('\\u003e');
      // Verify it's still valid JSON
      expect(JSON.parse(result)).toEqual(data);
    });
  });
});
