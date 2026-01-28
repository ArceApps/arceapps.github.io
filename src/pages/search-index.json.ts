import { getCollection } from 'astro:content';
import { sanitizeForSearch } from '../utils/sanitizer';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const apps = await getCollection('apps', ({ data }) => !data.draft);

  const searchIndex = [
    ...posts.map((post) => ({
      title: sanitizeForSearch(post.data.title, 100),
      description: sanitizeForSearch(post.data.description, 200),
      slug: `/blog/${post.slug}`,
      type: 'Blog',
      tags: post.data.tags || [],
    })),
    ...apps.map((app) => ({
      title: sanitizeForSearch(app.data.title, 100),
      description: sanitizeForSearch(app.data.description, 200),
      slug: `/apps/${app.slug}`,
      type: 'App',
      tags: app.data.tags || [],
    })),
  ];

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
