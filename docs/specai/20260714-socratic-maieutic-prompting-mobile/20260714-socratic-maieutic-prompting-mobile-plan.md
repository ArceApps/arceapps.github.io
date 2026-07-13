# Socratic & Maieutic Prompting Blog Post Implementation Plan

**Goal:** Create a comprehensive, bilingual (ES/EN) blog post of over 4000 words per language detailing Socratic and Maieutic Prompting in mobile development, including original and translated diagrams.
**Architecture:** Bilingual blog content collections structured under Astro content directories (`src/content/blog/es/` and `src/content/blog/en/`), and vector asset management under `public/images/`.
**Tech Stack:** Astro, TypeScript, Tailwind CSS, SVG, Git.
**Status:** ✅ DONE

---

## Acceptance Criteria

What "done" means:
- [ ] Spanish blog post file `src/content/blog/es/socratic-maieutic-prompting-mobile-dev.md` exists, contains >4000 words of technical depth (including Android & iOS dialog case studies with source code), validates frontmatter correctly, and references correct Spanish image assets.
- [ ] English blog post file `src/content/blog/en/socratic-maieutic-prompting-mobile-dev.md` exists, contains >4000 words of technical depth (including Android & iOS dialog case studies with source code), validates frontmatter correctly, and references correct English SVG image assets.
- [ ] The 5 original Spanish PNG images are copied from `/home/arceappspc/Descargas/` to `public/images/` with correct names.
- [ ] The 5 translated English SVG images are generated in `public/images/` with identical visual styles but translated texts.
- [ ] `pnpm build` completes successfully with no errors from TypeScript, Content Collections, or Astro.

## Constraints & Guardrails

- Do NOT use plain, generic colors. Apply the official brand colors (`#018786` Teal, `#FF9800` Orange) and background `#0F172A` in all SVGs.
- Ensure all texts inside SVGs are cleanly positioned and fully visible.
- Keep the writing tone warm, natural, and using voseo in the Spanish article, without using corporate jargon.
- No placeholders ("TODO", "TBD", or incomplete code blocks) are allowed in the blog posts or plan.

---

## Task List

- **Task 1:** Copy Spanish PNG images from Downloads to public directory.
- **Task 2:** Write English SVG files for the diagrams (Hero, Phases, Abductive Tree, 6 Questions, Prompting Scale).
- **Task 3:** Write the Spanish blog post (at least 4000 words).
- **Task 4:** Write the English blog post (at least 4000 words).
- **Task 5:** Run Astro build to verify frontmatter and structure consistency.
