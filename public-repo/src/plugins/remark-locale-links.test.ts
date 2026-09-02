import { describe, it, expect } from 'vitest';
import { remarkLocaleLinks } from './remark-locale-links';

// ---------------------------------------------------------------------------
// Helper: run the plugin transformer against a minimal MDAST tree
// ---------------------------------------------------------------------------

interface LinkNode {
  type: 'link';
  url: string;
  children: [];
}

function buildTree(links: string[]): { type: 'root'; children: LinkNode[] } {
  return {
    type: 'root',
    children: links.map((url) => ({ type: 'link', url, children: [] })),
  };
}

function runPlugin(links: string[], filePath: string): string[] {
  const tree = buildTree(links);
  const file = { history: [filePath], path: filePath } as unknown as import('vfile').VFile;
  const transformer = remarkLocaleLinks();
  transformer(tree as unknown as import('mdast').Root, file);
  return tree.children.map((n) => n.url);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('remarkLocaleLinks', () => {
  const esFilePath = '/home/project/src/content/blog/es/my-post.md';
  const enFilePath = '/home/project/src/content/blog/en/my-post.md';

  describe('Spanish content files', () => {
    it('prefixes /blog/ links with /es/', () => {
      const result = runPlugin(['/blog/some-article'], esFilePath);
      expect(result).toEqual(['/es/blog/some-article']);
    });

    it('prefixes /apps/ links with /es/', () => {
      const result = runPlugin(['/apps/my-app'], esFilePath);
      expect(result).toEqual(['/es/apps/my-app']);
    });

    it('prefixes /devlog/ links with /es/', () => {
      const result = runPlugin(['/devlog/entry-1'], esFilePath);
      expect(result).toEqual(['/es/devlog/entry-1']);
    });

    it('does not double-prefix already-localised links', () => {
      const result = runPlugin(['/es/blog/some-article'], esFilePath);
      expect(result).toEqual(['/es/blog/some-article']);
    });

    it('does not transform external https:// links', () => {
      const result = runPlugin(['https://example.com/blog/post'], esFilePath);
      expect(result).toEqual(['https://example.com/blog/post']);
    });

    it('does not transform protocol-relative // links', () => {
      const result = runPlugin(['//cdn.example.com/resource'], esFilePath);
      expect(result).toEqual(['//cdn.example.com/resource']);
    });

    it('does not transform /images/ paths (not a locale route)', () => {
      const result = runPlugin(['/images/photo.png'], esFilePath);
      expect(result).toEqual(['/images/photo.png']);
    });

    it('does not transform root / path', () => {
      const result = runPlugin(['/'], esFilePath);
      expect(result).toEqual(['/']);
    });

    it('handles multiple links in the same tree', () => {
      const result = runPlugin(
        ['/blog/article-1', '/blog/article-2', 'https://external.com', '/images/img.png'],
        esFilePath
      );
      expect(result).toEqual([
        '/es/blog/article-1',
        '/es/blog/article-2',
        'https://external.com',
        '/images/img.png',
      ]);
    });
  });

  describe('English content files', () => {
    it('does not transform /blog/ links in English files', () => {
      const result = runPlugin(['/blog/some-article'], enFilePath);
      expect(result).toEqual(['/blog/some-article']);
    });

    it('does not transform /apps/ links in English files', () => {
      const result = runPlugin(['/apps/my-app'], enFilePath);
      expect(result).toEqual(['/apps/my-app']);
    });
  });

  describe('Spanish apps content files', () => {
    it('prefixes links correctly for apps collection', () => {
      const appsFilePath = '/home/project/src/content/apps/es/my-app.md';
      const result = runPlugin(['/blog/article', '/apps/other-app'], appsFilePath);
      expect(result).toEqual(['/es/blog/article', '/es/apps/other-app']);
    });
  });

  describe('Spanish devlog content files', () => {
    it('prefixes links correctly for devlog collection', () => {
      const devlogFilePath = '/home/project/src/content/devlog/es/entry.md';
      const result = runPlugin(['/devlog/other-entry'], devlogFilePath);
      expect(result).toEqual(['/es/devlog/other-entry']);
    });
  });

  describe('nested link nodes', () => {
    it('transforms links nested inside paragraphs and blockquotes', () => {
      const transformer = remarkLocaleLinks();

      interface NestedTree {
        type: string;
        children: Array<{
          type: string;
          children: Array<{
            type: string;
            children: Array<{ type: string; url: string; children: [] }>;
          }>;
        }>;
      }

      const tree: NestedTree = {
        type: 'root',
        children: [
          {
            type: 'blockquote',
            children: [
              {
                type: 'paragraph',
                children: [
                  { type: 'link', url: '/blog/deep-link', children: [] },
                ],
              },
            ],
          },
        ],
      };
      const file = { history: [esFilePath], path: esFilePath } as unknown as import('vfile').VFile;
      transformer(tree as unknown as import('mdast').Root, file);
      const deepLink = tree.children[0].children[0].children[0];
      expect(deepLink.url).toBe('/es/blog/deep-link');
    });
  });
});
