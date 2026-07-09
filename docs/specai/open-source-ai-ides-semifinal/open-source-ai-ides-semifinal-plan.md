# Open Source AI IDEs Semifinal Implementation Plan

**Goal:** Create the technical blog post "Semifinal B – Open Source y Comunidad" for ArceApps in both Spanish and English, evaluating the 10 community/open source AI tools and selecting OpenCode Desktop and Hermes Desktop as finalists.
**Architecture:** Markdown content collections (`src/content/blog/`).
**Tech Stack:** Astro, Markdown, SVG.
**Status:** 🟡 IN PROGRESS

---

## Acceptance Criteria

- [ ] **Bilingual Publication**: Two symmetric, high-quality Markdown files created:
  - Spanish: `src/content/blog/es/open-source-ai-ides-semifinal.md`
  - English: `src/content/blog/en/open-source-ai-ides-semifinal.md`
- [ ] **Content requirements**:
  - Evaluation of the 10 specified tools: OpenCode Desktop, Hermes Desktop (Nous Research), Continue, Cline, Roo Code, Aider, Void IDE, PearAI, Zed AI, Augment Code.
  - Finalists selected: OpenCode Desktop and Hermes Desktop.
  - Tone aligns with the personal "indie developer / creator" spirit (no corporate jargon).
  - Length of at least 1500 words per article.
  - Includes a "Bibliography/References" section at the end with links to documentation and related posts.
- [ ] **Hero Image**: A minimal geometric SVG image created at `public/images/open-source-ai-ides-semifinal.svg` with dimensions 1200x630px, using colors `#018786` and `#FF9800` on a dark background (`#0F172A`).
- [ ] **SEO Optimization**:
  - Title ≤ 60 chars.
  - Tool/Subject name in the first 5 words of the title.
  - Description between 120 and 160 characters.
  - Slug is `open-source-ai-ides-semifinal` (no forbidden stopwords, no lang suffix, kebab-case).
  - Keywords array contains between 3 and 8 elements.
  - Canonical URL points to the correct path.
  - UUID v4 reference_id generated and assigned to both files.
- [ ] **Build Validation**: `pnpm build` completes successfully.

## Constraints & Guardrails

- Do not use placeholders or TBD.
- Maintain strict bilingual symmetry.
- Do not commit directly on main. Run all tasks on the current feature branch.

---

## Task List

See [open-source-ai-ides-semifinal-tasks.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/docs/specai/open-source-ai-ides-semifinal/open-source-ai-ides-semifinal-tasks.md) for the detailed step-by-step checklist.
