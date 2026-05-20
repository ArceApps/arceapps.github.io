import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blogPosts = await getCollection('blog', ({ data, id }) => 
    !data.draft && data.pubDate <= new Date() && id.startsWith('es/')
  );
  const apps = await getCollection('apps', ({ data, id }) => 
    !data.draft && id.startsWith('es/')
  );
  const devlogs = await getCollection('devlog', ({ data, id }) => 
    !data.draft && data.pubDate <= new Date() && id.startsWith('es/')
  );

  const site = context.site ?? 'https://arceapps.com';

  const staticPages = [
    { url: '/es/', priority: '1.0', changefreq: 'weekly' },
    { url: '/es/blog', priority: '0.9', changefreq: 'weekly' },
    { url: '/es/apps', priority: '0.9', changefreq: 'monthly' },
    { url: '/es/devlog', priority: '0.8', changefreq: 'weekly' },
    { url: '/es/about-me', priority: '0.6', changefreq: 'monthly' },
    { url: '/es/privacy-policy', priority: '0.4', changefreq: 'monthly' },
  ];

  const blogUrls = blogPosts.map(post => ({
    url: `/es/blog/${post.slug.split('/').pop()}/`,
    lastmod: post.data.pubDate.toISOString(),
    priority: '0.8',
    changefreq: 'monthly',
  }));

  const appUrls = apps.map(app => ({
    url: `/es/apps/${app.slug.split('/').pop()}/`,
    lastmod: app.data.pubDate.toISOString(),
    priority: '0.7',
    changefreq: 'monthly',
  }));

  const devlogUrls = devlogs.map(devlog => ({
    url: `/es/devlog/${devlog.slug.split('/').pop()}/`,
    lastmod: devlog.data.pubDate.toISOString(),
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const allUrls: Array<{url: string; lastmod?: string; priority: string; changefreq: string}> = [
    ...staticPages,
    ...blogUrls,
    ...appUrls,
    ...devlogUrls,
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(page => `  <url>
    <loc>${site}${page.url === '/' ? '' : page.url.replace(/^\//, '')}</loc>
    <lastmod>${page.lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}