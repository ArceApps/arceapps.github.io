---
title: "W31: Bento Grids, SEO Agents, and Portfolio Architectural Redesign"
description: "Technical chronicle about ArceApps' modern portfolio redesign using Bento Grids, JSON-LD schemas, OpenCode automation, and Astro."
pubDate: "2026-08-01"
lastmod: "2026-08-01"
tags: ["devlog", "arceapps", "ia-agents", "astro", "seo", "ui", "opencode"]
keywords: ["bento grid astro", "seo json-ld", "opencode ai", "portfolio redesign"]
heroImage: "/images/devlog-default.svg"
---

**[ArceApps Portfolio]** – *Building in Public.*

These past two weeks have represented a quantum leap in the maturity and online presence of my ecosystem. I have temporarily paused direct implementations on my main gaming product (PuzzleHub) to focus entirely on the mothership: **The ArceApps Portfolio**.

As an independent developer and solopreneur, the way I present my projects, technical articles, and artificial intelligence experiments is just as vital as the source code behind them. In this devlog, I will deeply narrate the engineering, agent architecture, and technical SEO decisions that have shaped the complete redesign of the web, from the UI down to the agent-driven CI/CD.

## The State of the Art: Beyond a Simple Portfolio

My stack and workflow are designed to minimize operational friction. However, my old website had become obsolete in the face of the torrent of new content, AI agent research, and applications I was publishing. I needed a web architecture that was modular, highly optimized for SEO, accessible, and capable of displaying the complexity of what I build solo at a glance.

So, I decided to bet on a complete redesign using **Astro**. I wanted the platform to be static and extremely fast, leveraging the framework's capabilities to generate semantic schemas and structure a new visual system based on **Bento Grids**.

## Milestone 1 (Web/UI Development): The Geometry of the Bento Grid

The first challenge was structuring the massive amount of information on the homepage. I opted for a "Bento Grid" design pattern. This pattern is not only visually appealing, but it also allows me to modularly package quick links, my featured applications, the tech stack, and the latest devlogs into completely isolated components.

To implement this, I created a master `BentoGrid.astro` component that handles responsive design robustly without additional JavaScript, relying on pure CSS Grid:

```astro
---
interface Props {
  class?: string;
  id?: string;
}

const { class: className = "", id = "bento-grid" } = Astro.props;
---

<section id={id} class="py-12 md:py-20 px-4 md:px-6 container mx-auto max-w-7xl cv-auto fade-in-section">
  <div class={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(220px,auto)] ${className}`}>
    <slot />
  </div>
</section>
```

This solution is elegant and declarative. It allows me to iterate over the individual "boxes" of the Bento without touching the main layout. Combined with this, I implemented a rigorous validation of design contracts (`design-contract.test.ts`), ensuring that all Bento components respect the responsive visual hierarchy, restricting images or heavy elements so they never overflow their containers—something fundamental in my indie philosophy where a broken component costs visibility.

Alongside this, I consolidated the internationalization (i18n) system, standardizing breadcrumbs and Open Graph images (`OGImage.astro`).

## Milestone 2 (Infrastructure/AI): The Arrival of OpenCode Agents

At the automation level, this fortnight introduced a paradigm shift in my CI/CD flow. I have integrated **OpenCode** directly into GitHub Actions. This means I now have an AI agent environment capable of executing reviews and automated tasks on pull requests.

I added the workflow in `.github/workflows/opencode.yml`:

```yaml
name: opencode

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  opencode:
    if: |
      contains(github.event.comment.body, ' /oc') ||
      startsWith(github.event.comment.body, '/oc')
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
      pull-requests: write
      issues: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
      - name: Install and run opencode
        run: |
          curl -fsSL https://opencode.ai/install | sh (emulated)
          echo "$HOME/.opencode/bin" >> $GITHUB_PATH
          $HOME/.opencode/bin/opencode github run
```

Alongside this infrastructure, I deployed new "brand agents" and documented skills. For instance, I implemented the SEO agent (`write-blog-seo`). This is a shell agent that strictly validates that each article has a kebab-case slug, no "stopwords," and that the frontmatter complies with title lengths (maximum 60 characters) and description (120-160 characters), as well as `lastmod` dates.

It's an engineering marvel: outsourcing SEO scrutiny to an automated agent allows me to focus 100% on technical writing and product building, while trusting that the machine will enforce strict compliance with the SEO Zod Schema in Astro.

## Milestone 3 (The Challenge of the Week): JSON-LD Schemas and DOM XSS Security

The deepest engineering challenge of the week was the secure integration of rich SEO metadata (JSON-LD) into Astro's main Layout. It's not enough to inject JSON into a script tag; if any variable (such as the title or description) includes escaped HTML characters, it opens the door to DOM XSS vulnerabilities or simply breaking the schema validation.

I had to refactor `src/layouts/Layout.astro` to incorporate dynamic schemas (`Person`, `WebSite`, `Article`) depending on the page type. The key was to ensure the injection of serialized data through rigorous sanitization directly in Astro:

```astro
    <!-- Schema.org - Person (when type="profile") -->
    {type === "profile" && (
      <script
        type="application/ld+json"
        set:html={JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "ArceApps",
          url: "https://arceapps.com/about-me",
          image: "https://arceapps.com/logo.png",
          sameAs: [
            "https://github.com/arceapps",
            "https://play.google.com/store/apps/developer?id=Arce+Apps",
          ],
        }).replace(/</g, "\\u003C")}
      />
    )}
```

Notice the `.replace(/</g, "\\u003C")`. This is the critical technical detail. Astro, by default, injects `set:html` directly. If I don't replace the angle brackets in the JSON serialization, an attacker or a malformed title could close the `<script>` tag prematurely. This seemingly tiny change ensures the total integrity of the portfolio and mitigates one of the most common flaws in modern web applications that render metadata dynamically.

## Lessons Learned

This fortnight, I have consolidated my vision of delegation and specialization in a solo project. When your time is the most scarce resource, investing in infrastructure yields massive returns. Having integrated auditing tools (methodically recorded in the design audits commit) and the OpenCode pipeline drastically reduces my cognitive load.

I have understood that a portfolio is not just a static resume. It is a *living system*. The integration of Bento Grids is not merely aesthetic; it obeys a necessity for modular information organization.

## Future Vision

The next two weeks promise to be a turning point. With the foundation of the ArceApps platform completely revamped and the agents (Scribe, Sentinel, Palette) orchestrated and functional, my goal now is to turn my attention to the data layer. I want to explore how local persistence (Local First Inference) can revolutionize the next iteration of AI tools I am devising for my applications. Additionally, I will continue refining SEO validations and possibly extending E2E test coverage for the new web design, ensuring the portfolio maintains its status as an impeccable technical reference. The Indie revolution continues.
