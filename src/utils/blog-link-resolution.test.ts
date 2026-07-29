import { describe, expect, it } from 'vitest';
import { normalizeBlogSlug, parseBlogRedirects, resolveBlogSlug } from './blog-link-resolution';

describe('blog link resolution', () => {
  it('normalizes trailing slashes before resolving a local slug', () => {
    expect(normalizeBlogSlug('opencode-subagents/')).toBe('opencode-subagents');
    expect(
      resolveBlogSlug({
        slug: 'opencode-subagents/',
        locale: 'en',
        availableSlugs: new Set(['opencode-subagents']),
        redirects: {},
      })
    ).toEqual({ status: 'resolved', slug: 'opencode-subagents' });
  });

  it('resolves locale-specific Astro redirect aliases to their canonical slug', () => {
    expect(
      resolveBlogSlug({
        slug: 'blog-superpowers-deep-dive',
        locale: 'es',
        availableSlugs: new Set(['superpowers-deep-dive']),
        redirects: {
          '/es/blog/blog-superpowers-deep-dive': '/es/blog/superpowers-deep-dive',
        },
      })
    ).toEqual({ status: 'resolved', slug: 'superpowers-deep-dive' });
  });

  it('keeps an unavailable slug unresolved', () => {
    expect(
      resolveBlogSlug({
        slug: 'missing-post',
        locale: 'en',
        availableSlugs: new Set(['existing-post']),
        redirects: {},
      })
    ).toEqual({ status: 'missing', slug: 'missing-post' });
  });

  it('parses blog aliases from the Astro redirects source', () => {
    expect(
      parseBlogRedirects(`redirects: {
        '/blog/blog-superpowers-deep-dive': '/blog/superpowers-deep-dive',
        '/es/blog/blog-agents-md-estandar': '/es/blog/agents-md-estandar',
      }`)
    ).toEqual({
      '/blog/blog-superpowers-deep-dive': '/blog/superpowers-deep-dive',
      '/es/blog/blog-agents-md-estandar': '/es/blog/agents-md-estandar',
    });
  });
});
