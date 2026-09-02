import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { isPublished } from '../utils/publishing';

export async function GET(context: APIContext) {
  const posts = await getCollection('devlog', ({ data, id }) => {
    return !data.draft && isPublished(data.pubDate) && id.startsWith('en/');
  });

  return rss({
    title: 'ArceApps Devlog',
    description: 'Development journey, progress updates, and behind-the-scenes of indie app development.',
    site: context.site ?? 'https://arceapps.com',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/devlog/${post.slug.split('/').pop()}/`,
      guid: post.id,
    })),
    customData: '<language>en-us</language>',
  });
}