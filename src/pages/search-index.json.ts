import { getCollection } from 'astro:content';

function sanitizeText(text: string, limit: number): string {
  if (!text) return "";
  // Strip HTML tags
  let cleaned = text.replace(/<[^>]*>?/gm, '');
  // Strip Markdown links [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= limit) return cleaned;
  return cleaned.substring(0, limit).trim() + '...';
}

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const apps = await getCollection('apps', ({ data }) => !data.draft);

  const searchIndex = [
    ...posts.map((post) => ({
      title: sanitizeText(post.data.title, 100),
      description: sanitizeText(post.data.description, 200),
      slug: `/blog/${post.slug}`,
      type: 'Blog',
      tags: post.data.tags || [],
    })),
    ...apps.map((app) => ({
      title: sanitizeText(app.data.title, 100),
      description: sanitizeText(app.data.description, 200),
      slug: `/apps/${app.slug}`, // Assuming apps are at /apps/slug based on file structure, need to verify
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
