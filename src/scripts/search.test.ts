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

  describe('escapeHtml', () => {
    it('should escape special characters', () => {
      expect(searchModule.escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
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
  });
});
