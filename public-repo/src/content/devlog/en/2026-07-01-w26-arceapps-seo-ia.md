---
title: "W26: SEO Audit, AI Agents, and the Evolution of the ArceApps Portfolio"
description: "A deep dive into my comprehensive SEO audit process, the evolution of comparative AI articles, and how I technically differentiate my portfolio from other projects like PuzzleHub."
pubDate: 2026-07-01
lastmod: 2026-07-01
tags: ["devlog", "arceapps", "ia-agents", "seo", "astro"]
keywords: ["arceapps", "seo audit", "astro sitemap", "ia agents", "indie dev"]
heroImage: "/images/placeholder-devlog-w26.svg"
---

# W26: SEO Audit, AI Agents, and the Evolution of the ArceApps Portfolio

[ArceApps Portfolio] Welcome to a new entry in the logbook of my journey as an indie developer ("Indie Spirit/Solopreneur"). These past two weeks have been the kind where the hard, meticulous infrastructure work—which often goes unseen—takes center stage. I have focused my efforts on consolidating **ArceApps**, not just as a simple app showcase, but as the central platform and agentic ecosystem that defines my technical identity, clearly distinguishing it from concrete products like **PuzzleHub**.

Throughout this devlog, I am going to break down how I tackled a massive SEO audit for a multilingual Astro site, how I improved the quality of my technical AI articles, and the architectural challenges of differentiating ecosystems within my stack.

## Milestone 1 (Web/UI Development): The Great SEO Audit

Commit `2559108` marked the end of a long-overdue task: a *complete SEO audit*. When you are building your own portfolio in public, you sometimes leave metadata and search engine optimization for "later". That "later" arrived last week.

### Dynamic Generation of Multilingual Sitemaps

One of the main challenges in ArceApps is that all my content (Devlogs, Apps, Blog) is localized. I use Astro, and while its ecosystem is fantastic, maintaining a multilingual sitemap requires precision. I decided to refactor the sitemap generation into two dynamic endpoints: `src/pages/sitemap-en.xml.ts` and `src/pages/sitemap-es.xml.ts`.

The goal was to programmatically extract the content collections and establish indexing priorities based on the site's hierarchy. Here is a snippet of how I extract the English routes, ensuring that only non-draft articles with a valid publication date are included:

```typescript
// Snippet from src/pages/sitemap-en.xml.ts
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blogPosts = await getCollection('blog', ({ data, id }) =>
    !data.draft && data.pubDate <= new Date() && id.startsWith('en/')
  );
  const apps = await getCollection('apps', ({ data, id }) =>
    !data.draft && id.startsWith('en/')
  );

  // URL Mapping
  const blogUrls = blogPosts.map(post => ({
    url: `/blog/${post.slug.split('/').pop()}/`,
    lastmod: post.data.pubDate.toISOString(),
    priority: '0.8',
    changefreq: 'monthly',
  }));
  // ...
}
```

The key here was the `id.startsWith('en/')` or `id.startsWith('es/')` filtering. Since my Astro collection handles language subfolders transparently in the `slugs`, using the original `id` ensures there is no language crossover.

### RSS Feeds and Search Endpoints
Along with the sitemaps, I refactored the RSS Feed (`src/pages/rss.xml.js`) and the search index in `src/pages/search-index.json.ts`. For the index, I applied the same optimization I mentioned in a previous devlog: concurrently processing collections with `Promise.all`:

```typescript
export async function GET() {
  const [posts, apps] = await Promise.all([
    getCollection('blog', ({ data }) => !data.draft),
    getCollection('apps', ({ data }) => !data.draft),
  ]);
  // Index generation
}
```

Additionally, I normalized the way URI schemes are sanitized to avoid security issues, a vital practice when your search engine is written in pure Vanilla JS on the client side.

## Milestone 2 (Content and Agents): Deepening into AI

The ArceApps portfolio is as much about the code I write as it is about my research into intelligent agent workflows. Commit `bdf2c98` represented a massive update to the technical content of the site.

I have been actively researching and documenting persistent memory patterns for agents, MCP (Model Context Protocol) servers, Socratic Agent frameworks, and deep reasoning models (like o1 or r1).

My workflow for this is purely agentic (what I call the *Scribe Agent* and other skills under `agents/skills/`). But I had to calibrate these agents' guidelines so they follow my voice ("My stack", "My workflow"). An indie developer does not need corporate jargon; they need technical density.

In recent updates, I have forced my content generation ecosystem to be strict with frontmatters (demanding `lastmod` and `keywords`), because Astro 5.16 and typed collections with Zod are unforgiving:

```typescript
// src/content/config.ts (illustrative schema)
const devlogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    lastmod: z.date(), // Now mandatory
    tags: z.array(z.string()),
    keywords: z.array(z.string()).min(3).max(8), // Strict validation for SEO
    heroImage: z.string().optional(),
  }),
});
```

This "specs-driven development" rigor carries over to my articles. It is no longer just about "writing about AI", but about documenting *how I use AI to build my software*.

## Milestone 3 (The Challenge of the Week): Differentiating ArceApps from PuzzleHub

This is where the architectural design of my different projects comes in. As a solopreneur, I manage multiple applications and ecosystems. Commit `451cd51` introduced substantial changes in how achievements and statistics persistence are handled, but *those* changes belong to **PuzzleHub**, my gaming ecosystem (Hitori, Kakuro, Dominosa, etc.).

The challenge of the week was to ensure that **ArceApps**, the portfolio and container platform, reflected those advancements coherently without mixing the brands. ArceApps is "who I am and how I work"; PuzzleHub is "what users play".

When I updated the portfolio UI (adding detail pages for specific apps in `src/pages/apps/[...slug].astro`), I had to apply the Responsive Visual Hierarchy principle (`.prose img { max-inline-size: min(100%, 500px); }`) to ensure that PuzzleHub gameplay screenshots looked perfect in the context of the ArceApps portfolio.

In particular, the `max-w-[200px]` limitation with `object-contain` in the app galleries was crucial. It allowed me to showcase the retroactive persistence of PuzzleHub statistics (that difficult database migration with columns starting at zero instead of being nullable) elegantly on the ArceApps website, as an engineering *case study*, not as an isolated feature.

## Conclusion and Future Vision

Working alone ("Indie Spirit") means I am my own Product Manager, my own DevOps engineer, and my own SEO specialist. This fortnight has taught me that SEO is not black magic; it is simply structured code and well-maintained metadata. The inclusion of `sitemap-en.xml.ts` and the massive redirect fixes are the invisible foundations that allow high-value technical content about AI agents to reach the right audience.

In the next two weeks, my focus will shift back to ArceApps CI/CD automation, exploring how my agents can integrate directly into GitHub Actions to not only write these devlogs (like the one you are reading) but to pre-verify visual regressions.

That is the power of the ecosystem I am building. Every commit in the portfolio is not just code; it is another brick in an autonomous workflow that allows me to compete as a one-person army.

Until the next sprint. See you in the code.