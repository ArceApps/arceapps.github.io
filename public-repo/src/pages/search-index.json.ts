import { getCollection } from 'astro:content';
import { sanitizeForSearch } from '../utils/sanitizer';

// Strip markdown to clean text for search indexing
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')       // headings
    .replace(/\*\*(.*?)\*\*/g, '$1')    // bold
    .replace(/\*(.*?)\*/g, '$1')        // italic
    .replace(/~~(.*?)~~/g, '$1')        // strikethrough
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline/code blocks
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> text
    .replace(/!\[.*?\]\(.*?\)/g, ' ')   // images
    .replace(/[>\-*+|]/g, ' ')          // blockquote/markdown symbols
    .replace(/<[^>]*>/g, ' ')           // HTML tags
    .replace(/&[a-z]+;/g, ' ')          // HTML entities
    .replace(/\s+/g, ' ')               // collapse whitespace
    .replace(/\.{3,}/g, ' ')            // trailing dots
    .trim();
}

export async function GET() {
  const [posts, apps] = await Promise.all([
    getCollection('blog', ({ data }) => !data.draft),
    getCollection('apps', ({ data }) => !data.draft),
  ]);

  const searchIndex = [
    ...posts.map((post) => {
      const isSpanish = post.slug.startsWith('es/');
      const cleanSlug = post.slug.replace(/^(en|es)\//, '');
      const urlPrefix = isSpanish ? '/es/blog/' : '/blog/';
      return {
        title: sanitizeForSearch(post.data.title, 100),
        description: sanitizeForSearch(post.data.description, 200),
        slug: `${urlPrefix}${cleanSlug}`,
        type: 'Blog',
        tags: post.data.tags || [],
        lang: isSpanish ? 'es' : 'en',
        body: stripMarkdown(post.body || '').slice(0, 600),
      };
    }),
    ...apps.map((app) => {
      const isSpanish = app.slug.startsWith('es/');
      const cleanSlug = app.slug.replace(/^(en|es)\//, '');
      const urlPrefix = isSpanish ? '/es/apps/' : '/apps/';
      return {
        title: sanitizeForSearch(app.data.title, 100),
        description: sanitizeForSearch(app.data.description, 200),
        slug: `${urlPrefix}${cleanSlug}`,
        type: 'App',
        tags: app.data.tags || [],
        lang: isSpanish ? 'es' : 'en',
        body: stripMarkdown(app.body || '').slice(0, 600),
      };
    }),
  ];

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
