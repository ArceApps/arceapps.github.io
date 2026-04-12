import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Search Script', () => {
  let searchModule: any;
  let searchMock: any;

  beforeEach(async () => {
    vi.resetModules();

    // Reset DOM
    document.body.innerHTML = `
      <button id="search-button" aria-expanded="false"></button>
      <div id="search-modal" class="hidden">
        <button id="close-search"></button>
        <input id="search-input" type="text" />
        <div id="search-results" class="hidden"></div>
        <div id="search-status"></div>
      </div>
    `;

    // Setup Mock for Fuse.js
    searchMock = vi.fn();
    vi.doMock('fuse.js', () => {
      return {
        default: class {
          search = searchMock;
        }
      };
    });

    // Import module dynamically
    searchModule = await import('./search');

    // Initialize component
    searchModule.initSearchComponent();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      vi.useFakeTimers();
      const func = vi.fn();
      const debouncedFunc = searchModule.debounce(func, 100);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(func).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should only execute once for multiple calls', () => {
      vi.useFakeTimers();
      const func = vi.fn();
      const debouncedFunc = searchModule.debounce(func, 100);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should pass arguments to the function', () => {
      vi.useFakeTimers();
      const func = vi.fn();
      const debouncedFunc = searchModule.debounce(func, 100);

      debouncedFunc('test', 123);

      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledWith('test', 123);
      vi.useRealTimers();
    });

    it('should preserve this context', () => {
      vi.useFakeTimers();
      const context = { value: 'test' };
      let capturedContext: any;
      const func = function(this: any) {
        capturedContext = this;
      };
      const debouncedFunc = searchModule.debounce(func, 100);

      debouncedFunc.call(context);

      vi.advanceTimersByTime(100);
      expect(capturedContext).toBe(context);
      vi.useRealTimers();
    });
  });

  describe('escapeHtml', () => {
    it('should escape special characters', () => {
      expect(searchModule.escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should handle empty strings', () => {
        expect(searchModule.escapeHtml('')).toBe('');
    });
  });

  describe('performSearch', () => {
    it('should show "at least 2 characters" message for short query', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([{ title: "Test", slug: "/test", type: "App" }]),
        });

        await searchModule.initFuse();
        searchModule.performSearch('a');

        const status = document.getElementById('search-status');
        expect(status?.textContent).toContain('Escribe al menos 2 caracteres');
    });

    it('should display results when query matches', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([{ title: "Test App", slug: "/app", type: "App" }]),
        });

        searchMock.mockReturnValue([{
            item: { title: "Test App", slug: "/app", type: "App", description: "Desc" }
        }]);

        await searchModule.initFuse();
        searchModule.performSearch('test');

        const results = document.getElementById('search-results');
        expect(results?.innerHTML).toContain('Test App');
    });

    it('should sanitize javascript: URIs in results', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([{ title: "XSS", slug: "javascript:alert(1)", type: "App" }]),
        });

        searchMock.mockReturnValue([{
            item: { title: "XSS", slug: "javascript:alert(1)", type: "App", description: "Vulnerable" }
        }]);

        await searchModule.initFuse();
        searchModule.performSearch('xss');

        const results = document.getElementById('search-results');
        const anchor = results?.querySelector('a');
        expect(anchor?.getAttribute('href')).toBe('about:blank');
    });

    it('should NOT sanitize legitimate URIs in results', async () => {
        const legitimateSlug = "/blog/my-awesome-post";
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([{ title: "Safe", slug: legitimateSlug, type: "Article" }]),
        });

        searchMock.mockReturnValue([{
            item: { title: "Safe", slug: legitimateSlug, type: "Article", description: "Safe Link" }
        }]);

        await searchModule.initFuse();
        searchModule.performSearch('safe');

        const results = document.getElementById('search-results');
        const anchor = results?.querySelector('a');
        expect(anchor?.getAttribute('href')).toBe(legitimateSlug);
    });

    it('should render malicious title as plain text (XSS protection)', async () => {
        const xssPayload = '<img src=x onerror=alert(1)>';
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([{ title: xssPayload, slug: "/app", type: "App", description: "Desc" }]),
        });

        searchMock.mockReturnValue([{
            item: { title: xssPayload, slug: "/app", type: "App", description: "Desc" }
        }]);

        await searchModule.initFuse();
        searchModule.performSearch('xss');

        const results = document.getElementById('search-results');
        const h4 = results?.querySelector('h4');
        expect(h4?.textContent).toBe(xssPayload);
        expect(h4?.innerHTML).not.toContain('<img');
    });

    it('should render malicious query as plain text in "no results" (XSS protection)', async () => {
        const xssPayload = '"><img src=x onerror=alert(1)>';
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        });

        searchMock.mockReturnValue([]);

        await searchModule.initFuse();
        searchModule.performSearch(xssPayload);

        const status = document.getElementById('search-status');
        expect(status?.textContent).toContain(`No encontramos resultados para "${xssPayload}"`);
        expect(status?.innerHTML).not.toContain('<img');
    });
  });

  describe('initSearchComponent', () => {
    it('should prefetch on mouseenter', () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        });

        const button = document.getElementById('search-button');
        button?.dispatchEvent(new Event('mouseenter'));

        expect(global.fetch).toHaveBeenCalledWith('/search-index.json');
    });

    it('should prefetch on focus', () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        });

        const button = document.getElementById('search-button');
        button?.dispatchEvent(new Event('focus'));

        expect(global.fetch).toHaveBeenCalledWith('/search-index.json');
    });
  });
});
