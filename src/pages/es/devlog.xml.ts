import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('devlog', ({ data, id }) => {
    return !data.draft && data.pubDate <= new Date() && id.startsWith('es/');
  });

  return rss({
    title: 'ArceApps Devlog - Español',
    description: 'Artículos sobre desarrollo, actualizaciones de progreso y aspectos invisibles del desarrollo indie.',
    site: context.site ?? 'https://arceapps.com',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/es/devlog/${post.slug.split('/').pop()}/`,
      guid: post.id,
    })),
    customData: '<language>es-es</language>',
  });
}