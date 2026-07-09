# Open Knowledge Format (OKF) Blog Post Implementation Plan

**Goal:** Write a comprehensive, high-quality, bilingual (ES/EN) blog article of at least 3200-3500 words per language about Google Cloud's OKF specification published on June 12, 2026.
**Architecture:** Astro 5.0 Markdown Content Collections (`src/content/blog/`).
**Tech Stack:** Astro, Markdown, Mermaid, Zod Content Schema, SVG.
**Status:** 🟡 IN PROGRESS

---

## Acceptance Criteria

- [ ] ES version `src/content/blog/es/open-knowledge-format-google.md` is created with >= 3200 words.
- [ ] EN version `src/content/blog/en/open-knowledge-format-google.md` is created with >= 3200 words.
- [ ] Both articles adhere to the "Espíritu Indie" tone (first-person sections, technical, sobrio).
- [ ] Both articles pass the SEO audit using `/write-blog-seo` (Status: PASS).
- [ ] Both articles contain the 3 required Mermaid diagrams (Bundle structure, Graph of concepts, Before vs After flows).
- [ ] SVG hero image `public/images/open-knowledge-format-google.svg` is created at 1200x630px with brand colors `#018786` and `#FF9800` on a dark background `#0F172A`.
- [ ] Zod schema verification and Astro build (`pnpm build`) succeed with no errors.
- [ ] Scribe agent activities are logged in the bitácora `agents/bitacora/bitacora_scribe.md`.

## Constraints & Guardrails

- No placeholder text, TBDs, or generic AI summaries. The content must be fully written and ready to publish.
- Strict limit of 60 characters for the frontmatter title (SEO title). H1 in the Markdown body can be the full catchy title.
- Link at least 3 related blog posts from the repo as Prior Art:
  - `agents-md-estandar.md`
  - `obsidian-desarrolladores.md`
  - `contexto-efectivo-ia.md`
- Code samples must be valid and conform to the OKF draft specification v0.1.

---

## Task List

See [20260712-okf-google-blog-tasks.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/docs/specai/20260712-okf-google-blog/20260712-okf-google-blog-tasks.md) for the detailed step-by-step checklist.
