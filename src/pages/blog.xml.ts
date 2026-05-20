import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data, id }) => {
    return !data.draft && data.pubDate <= new Date() && id.startsWith('en/');
  });

  return rss({
    title: 'ArceApps Blog',
    description: 'Technical articles on Android development, software architecture, and indie dev life.',
    site: context.site ?? 'https://arceapps.com',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug.split('/').pop()}/`,
      guid: post.id,
    })),
    customData: '<language>en-us</language>',
  });
}