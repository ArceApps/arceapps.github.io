---
title: "W18: Hardening the Portfolio, DOM XSS Mitigation, and Visual Hierarchy"
description: "A deep dive into security patching in Astro, refining responsive visual hierarchy for Markdown content, and chronicling the genesis of mydevbot."
pubDate: 2026-05-01
tags: ["devlog", "arceapps", "security", "xss", "css", "mydevbot"]
heroImage: "/images/devlog-default.svg"
reference_id: "devlog-w18-security-visual-hierarchy"
---

Welcome to the ArceApps Portfolio Devlog! In our ongoing "Building in Public" series for the ArceApps ecosystem (distinct from our PuzzleHub gaming vertical), the past two weeks have been defined by a renewed focus on security fundamentals and visual refinement. While iterating on new features is always exciting, the mark of mature engineering lies in revisiting the foundations.

This fortnight, we tackled a critical cross-site scripting (XSS) vulnerability lurking in our client-side search logic, overhauled the responsive visual hierarchy for embedded media in our Markdown articles, and published a comprehensive three-part series detailing the genesis and architecture of "mydevbot," our custom AI workflow assistant.

Let's unpack the technical challenges and the solutions we implemented.

## Hito 1 (Desarrollo Web/UI): Responsive Visual Hierarchy for Prose Media

In the ArceApps Portfolio, our blog and devlog articles are heavily reliant on rich content. Over the past few weeks, we noticed that screenshots, videos, and embedded media within our Markdown `.prose` elements were occasionally breaking the container bounds on smaller mobile devices or appearing awkwardly oversized on desktop displays.

### The Problem with Unconstrained Media
By default, large images can overflow their parent containers, causing horizontal scrolling (a major UX anti-pattern). While Tailwind's `prose` plugin handles general typography beautifully, it sometimes requires manual intervention for specific media elements to maintain a strict visual hierarchy.

We needed a solution that would gracefully handle mixed media types (`img`, `video`, `iframe`) while respecting the logical properties we've adopted for our 2026 CSS standards.

### The CSS Logical Properties Solution
We updated `src/styles/global.css` to enforce a strict, responsive bounding box for all media within our article bodies. Instead of relying purely on Tailwind utility classes, which can become verbose when targeting deeply nested Markdown elements, we applied a targeted global CSS rule.

```css
/* src/styles/global.css */
/* Visual hierarchy for media inside markdown prose */
.prose img,
.prose video {
  max-width: min(100%, 500px);
  width: auto;
  height: auto;
  margin-inline: auto; /* Logical property for horizontal margin */
  margin-block: 2rem;  /* Logical property for vertical margin */
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  display: block;
}
```

**Why this approach works:**
1.  **`max-width: min(100%, 500px)`:** This is the core of the responsive behavior. It ensures the image never exceeds the width of its container (`100%`) on mobile, but caps its maximum growth at `500px` on desktop. This prevents low-resolution screenshots from being stretched to fill a wide article column, maintaining visual fidelity.
2.  **CSS Logical Properties:** By using `margin-inline` and `margin-block` instead of `margin-left`/`right` or `margin-top`/`bottom`, we ensure that our styles remain robust if we ever introduce right-to-left (RTL) language support in the future. This aligns with our commitment to modern, inclusive web standards outlined in our `ANALISIS_WEB.md`.
3.  **Aesthetic Polish:** The combination of `border-radius` and a subtle `box-shadow` elevates the presentation of screenshots, giving them a modern, "card-like" appearance that fits seamlessly with the ArceApps design language.

## Hito 2 (Infraestructura/IA): Chronicling the Genesis of mydevbot

Beyond the portfolio itself, much of our engineering effort in the ArceApps ecosystem involves building internal tools to accelerate our workflow. The most significant of these is **mydevbot**, our bespoke AI assistant designed to handle everything from CI/CD monitoring to code review triage.

Over the past two weeks, we dedicated time to document the creation and evolution of mydevbot in a three-part devlog series, published in both English and Spanish.

### The mydevbot Trilogy

1.  **Genesis and Hardware (`2026-03-05-mydevbot-genesis-hardware.md`):** This article explores the initial motivations for building a custom bot rather than relying on off-the-shelf solutions. We detailed the hardware constraints, the decision to run local inference for specific tasks, and the initial architectural sketch.
2.  **GitHub Actions and Cron Skills (`2026-03-06-mydevbot-github-cron-skills.md`):** Here, we dove into the practical integration. We explained how mydevbot interacts with the GitHub API to monitor repository health, utilizing GitHub Actions and cron jobs to automate routine maintenance tasks and PR checks.
3.  **CI/CD Integration and the eGPU Future (`2026-03-07-mydevbot-cicd-egpu-future.md`):** The final piece focuses on the complex orchestration required to inject an AI agent into a secure CI/CD pipeline. We also speculated on future hardware upgrades, specifically the potential integration of an eGPU to drastically reduce local inference times for more complex reasoning models.

Writing these articles is a core part of our "Building in Public" philosophy. By sharing the architectural decisions—and the missteps—we hope to contribute valuable insights to the broader indie hacking and AI engineering communities.

## Hito 3 (El Reto de la Semana): Mitigating DOM XSS in Search and Code Copy

The most critical technical challenge of this sprint was a proactive security audit that revealed potential DOM-based Cross-Site Scripting (XSS) vulnerabilities in two client-side scripts: our global search component (`src/scripts/search.ts`) and our code snippet copy utility (`src/scripts/code-copy.ts`).

### The Vulnerability: The Perils of `innerHTML`
Both scripts were previously using the `innerHTML` property to dynamically inject content into the DOM.

In the search component, user queries and search results were being concatenated into HTML strings and assigned to `innerHTML`. If a malicious actor managed to inject a crafted payload (e.g., `<img src=x onerror=alert(1)>`) into the search index or the query string, the browser would execute it.

Similarly, the code copy utility was using `innerHTML` to briefly display a "Copied!" message, which, while less exposed, still represented a violation of secure coding practices.

### The Solution: Secure DOM Manipulation APIs
To remediate this, we undertook a comprehensive refactoring of both scripts, entirely eradicating the use of `innerHTML`. We migrated to secure, built-in DOM APIs: `document.createElement`, `textContent`, and `replaceChildren`.

Here is a look at the transformation in the `search.ts` component:

**Before (Vulnerable):**
```typescript
// Vulnerable approach using innerHTML
resultsContainer.innerHTML = results.map(result => `
  <li class="search-result-item">
    <a href="${result.url}">
      <h4>${result.title}</h4>
      <p>${result.description}</p>
    </a>
  </li>
`).join('');
```

**After (Secure):**
```typescript
// Secure approach using createElement and textContent
resultsContainer.replaceChildren(); // Clear existing content securely

results.forEach(result => {
  const li = document.createElement('li');
  li.className = 'search-result-item p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0';

  const a = document.createElement('a');
  a.href = sanitizeUrl(result.url); // Additional layer of URL sanitization
  a.className = 'block';

  const h4 = document.createElement('h4');
  h4.className = 'text-lg font-semibold text-primary-600 dark:text-primary-400 mb-1';
  h4.textContent = result.title; // Safe: textContent automatically escapes HTML

  const p = document.createElement('p');
  p.className = 'text-sm text-gray-600 dark:text-gray-400 line-clamp-2';
  p.textContent = result.description; // Safe: textContent automatically escapes HTML

  a.appendChild(h4);
  a.appendChild(p);
  li.appendChild(a);

  resultsContainer.appendChild(li);
});
```

### Defense in Depth: URL Sanitization
While `textContent` protects against HTML injection in the text nodes, we also had to ensure the `href` attribute of the anchor tags was secure. An attacker could potentially inject a malicious URI scheme like `javascript:alert(1)`.

To counter this, we implemented a `sanitizeUrl` function. This utility validates the URL against an allowlist of safe protocols (like `http:` and `https:`) and removes invisible control characters that could be used to bypass simple string matching.

### Regression Testing with Vitest
Security fixes are only as good as the tests that prove they work and ensure they don't break in the future. We added specific XSS regression tests to `src/scripts/search.test.ts`.

```typescript
// src/scripts/search.test.ts
import { describe, it, expect } from 'vitest';
// ... imports ...

describe('Search Component Security', () => {
  it('should render malicious payloads as plain text', () => {
    const maliciousTitle = '<script>alert("xss")</script> Malicious Title';
    const safeContainer = renderSearchResult({ title: maliciousTitle, /* ... */ });

    // Assert that the script tag was NOT executed and is present as text
    expect(safeContainer.innerHTML).not.toContain('<script>');
    expect(safeContainer.textContent).toContain('<script>alert("xss")</script>');
  });
});
```
These tests utilize Vitest and JSDOM to simulate the browser environment, confirming that malicious payloads are rendered harmlessly as plain text.

## Conclusion

This two-week cycle was a crucial reminder that technical debt isn't just about messy code; it's also about latent security vulnerabilities and UX inconsistencies. By replacing `innerHTML` with secure DOM APIs and enforcing a strict visual hierarchy using modern CSS logical properties, we've significantly hardened the ArceApps Portfolio.

Looking ahead to the next sprint, we plan to shift our focus back to feature development, specifically exploring deeper integrations with our newly documented mydevbot to automate more of our content publishing pipeline.

Until next time, keep building securely.
