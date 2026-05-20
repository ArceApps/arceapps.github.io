import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data, id }) => {
    return !data.draft && data.pubDate <= new Date() && id.startsWith('es/');
  });

  return rss({
    title: 'ArceApps Blog - Español',
    description: 'Artículos técnicos sobre desarrollo Android, arquitectura de software y vida indie dev.',
    site: context.site ?? 'https://arceapps.com',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/es/blog/${post.slug.split('/').pop()}/`,
      guid: post.id,
    })),
    customData: '<language>es-es</language>',
  });
}