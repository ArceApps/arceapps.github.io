import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog');
  const apps = await getCollection('apps');

  const searchIndex = [
    ...posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      slug: `/blog/${post.slug}`,
      type: 'Blog',
      tags: post.data.tags || [],
    })),
    ...apps.map((app) => ({
      title: app.data.title,
      description: app.data.description,
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
