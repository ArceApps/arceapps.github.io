---
title: "W20: Bilingual Refactoring, Optimization, and Security"
description: "An engineering chronicle detailing architectural improvements, performance optimizations, XSS security mitigations, and enriched unit testing at ArceApps."
pubDate: 2026-05-16
tags: ["devlog", "arceapps", "performance", "security", "vitest", "i18n"]
heroImage: "/images/devlog-default.svg"
reference_id: "2026-w20-refactoring-optimization"
---

## State of the Art: Building in Public

Hello everyone! Welcome to a new installment of the **ArceApps** devlog, the portfolio and agent ecosystem we are building in public. The last two weeks have been intense, focused primarily on consolidating the technical foundations of our web platform (the ArceApps portfolio). Unlike our PuzzleHub product, where the focus is on game logic, the priority here has been the web architecture, internationalization (i18n), performance, and security.

We embarked on a deep refactoring journey, tackling everything from the responsive visual hierarchy of our Markdown content to the mitigation of XSS vulnerabilities in our search engine and the validation of internal links. We have written code, a lot of unit tests (TDD in action), and optimized the Static Site Generation (SSG) of our pages.

Join us on this technical walkthrough of the challenges and solutions from this fortnight.

## Milestone 1: Optimizing Static Generation and Routing (i18n)

### Performance in Static Site Generation (SSG)

One of the classic bottlenecks in Astro (and many SSG frameworks) is redundant data fetching. During the generation of our blog pages (`src/pages/blog/[...slug].astro` and its Spanish counterpart), we noticed we were incurring $O(N^2)$ calls to `getCollection`.

The original logic calculated "related posts" within the Astro component for each page. This meant that for each of the $N$ posts, the collection was queried again and iterated over to find tag matches.

The solution was to move this logic to the `getStaticPaths` function. By precalculating the related posts and passing them as `props`, we reduced the `getCollection` calls to $O(1)$ per language during the build process.

```typescript
// Conceptual snippet of the optimization in getStaticPaths
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  const sortedPosts = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return sortedPosts.map(post => {
    // We calculate relations here, just once per post during the build
    const relatedPosts = sortedPosts
      .filter(p => p.id !== post.id && p.data.tags.some(t => post.data.tags.includes(t)))
      .slice(0, 3); // We only take the top 3 to optimize

    return {
      params: { slug: post.slug },
      props: { post, relatedPosts }, // We pass the computed data
    };
  });
}
```

This refactoring not only accelerated the compilation time but also cleaned up the component's rendering logic, clearly separating data fetching from the view.

### Centralization of Bilingual Routing

Route management in a bilingual website can become chaotic if spread across UI components. In our case, the `Header.astro` accumulated too much logic about which route was active and how to toggle languages.

We decided to extract this responsibility into the `src/i18n/utils.ts` module. We implemented pure, testable functions like `normalizePath`, `isPathActive`, and `getLocalizedTogglePath`.

A subtle security detail here was protecting the `getRouteFromUrl` function against prototype pollution. Directly using `Object.keys` or checking properties on a raw JavaScript object can be dangerous if the path matches inherent properties like `/toString/`.

```typescript
// src/i18n/utils.ts
export function getRouteFromUrl(url: URL): string | undefined {
  const pathname = new URL(url).pathname; // Memory analysis indicated a redundant instantiation that was later fixed.
  const parts = pathname.split('/');

  // Safe logic to determine the route and language...
}
```

By moving this to independent utilities, we were able to cover the entire routing scenarios with exhaustive unit testing in `src/i18n/utils.test.ts`.

## Milestone 2: Security First - Sanitization and XSS Prevention

In a modern web application, security is not optional. We have dedicated significant effort to securing our search engine and the injection of metadata (LD+JSON).

### Search Engine: Goodbye `innerHTML`

Our original client-side search script (`src/scripts/search.ts`) used `innerHTML` to render the results. This is a textbook Cross-Site Scripting (XSS) vulnerability if the indexed data contains malicious HTML.

We completely refactored the rendering to use secure DOM APIs: `document.createElement`, `textContent`, and `replaceChildren`.

```typescript
// src/scripts/search.ts (Refactored)
function renderResults(results: SearchResult[]) {
  const container = document.getElementById('search-results');
  if (!container) return;

  // Instead of container.innerHTML = '...', we use replaceChildren
  const fragment = document.createDocumentFragment();

  results.forEach(result => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = result.url;
    a.textContent = result.title; // XSS safe

    const p = document.createElement('p');
    p.textContent = result.description; // XSS safe

    li.appendChild(a);
    li.appendChild(p);
    fragment.appendChild(li);
  });

  container.replaceChildren(fragment);
}
```

Additionally, we introduced the `sanitizeForSearch` function in `src/utils/sanitizer.ts`. This utility is responsible for cleaning the content before indexing it, removing HTML tags, and truncating the text. We added specific tests in `src/scripts/search.test.ts` that inject malicious payloads (`<script>alert(1)</script>`) to ensure they are rendered harmlessly as plain text.

### Secure Serialization of JSON-LD

For SEO purposes, we inject `<script type="application/ld+json">` blocks with the metadata of the pages. If the content of this metadata includes script closing characters `</script>`, an attacker could break out of the block and execute code.

We implemented `safeJsonLd` in `src/utils/security.ts`, which escapes problematic characters `<, >, &` and Unicode line separators `\u2028, \u2029`.

```typescript
// src/utils/security.ts
export function safeJsonLd(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
```

The unit tests in `src/utils/security.test.ts` ensure that this behavior remains steadfast.

## Milestone 3: The Challenge of the Week - Bilingual Link Integrity

One of the most frustrating problems when translating content is maintaining correct internal links. If you translate an article from English to Spanish, the Markdown links within that article must be updated to point to the translated versions of other articles (`/es/blog/...`), not the English versions (`/blog/...`).

To automate this verification, we developed `src/utils/links-validation.test.ts`.

This is not a common unit test. It uses the file system API (`node:fs/promises`) and `Promise.all` to asynchronously validate each link in every Markdown file across our content collections.

```typescript
// src/utils/links-validation.test.ts (Concept)
import fs from 'node:fs/promises';
import { describe, it, expect } from 'vitest';

// ... link extraction logic ...

describe('Internal blog link validation', async () => {
  const files = await fs.readdir('src/content/blog/es');
  // ...
  await Promise.all(files.map(async file => {
     const content = await fs.readFile(`src/content/blog/es/${file}`, 'utf-8');
     const links = extractLinks(content);
     // Verify that links point to existing files in 'es'
  }));
  // ...
});
```

The main challenge was efficiency. Reading hundreds of files synchronously would slow down our test suite unacceptably. By using top-level `await` (supported by Vitest) and `Promise.all` for concurrent I/O, the validation completes in milliseconds. When a link is broken, the test fails and reports exactly which file has the problem and where it was trying to link to. An incredible safety net for our writers (and agents)!

## Reflection on Responsive Visual Hierarchy

Last but not least, we have consolidated our principle of "Responsive Visual Hierarchy". In our `src/styles/global.css` file, we realized that elements like images, videos, and iframes within Markdown content (`.prose`) sometimes broke the layout on mobile devices or looked enormous on large screens.

We applied logical CSS properties (`max-inline-size`, `inline-size`) instead of physical ones (`max-width`, `width`).

```css
/* src/styles/global.css */
.prose :where(img, video, iframe) {
  max-inline-size: min(100%, 500px); /* Prevents them from growing too large */
  margin-inline: auto; /* Logical centering */
}

.prose iframe {
  aspect-ratio: 16 / 9;
  inline-size: 100%;
}
```

The use of `:where()` is key here, as it reduces specificity to zero, allowing these styles to be easily overridden if necessary in specific components, greatly improving maintainability.

## Conclusion

These two weeks have been an exercise in rigor. We have prioritized architecture, security, and performance over flashy features. This solid foundation in ArceApps will allow us to scale our bilingual content and our AI agent platform with confidence.

What lies ahead? In the next iteration, we plan to dive deeper into agent orchestration and perhaps explore new ways to integrate artificial intelligence directly into our CI/CD pipeline.

Let's keep building in public! See you in the next commit.
