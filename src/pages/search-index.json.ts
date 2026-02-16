import { getCollection } from 'astro:content';
import { sanitizeForSearch } from '../utils/sanitizer';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const apps = await getCollection('apps', ({ data }) => !data.draft);

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
        lang: isSpanish ? 'es' : 'en'
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
        lang: isSpanish ? 'es' : 'en'
      };
    }),
  ];

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
