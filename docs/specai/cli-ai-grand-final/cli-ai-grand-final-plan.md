# AI CLI Grand Final Optimization Implementation Plan

**Goal:** Review, optimize, and verify the AI CLI Grand Final articles (in Spanish and English) to comply with SEO criteria, correct i18n link routing, and ensure build success.
**Architecture:** Markdown content collections (`src/content/blog/`) integrated with Astro 5 i18n routing and localized link rewriting plugin.
**Tech Stack:** Astro, Markdown, Zod Schema.
**Status:** ✅ DONE

---

## Acceptance Criteria

- [ ] Both `es/cli-ai-grand-final.md` and `en/cli-ai-grand-final.md` pass the SEO schema validation without build errors.
- [ ] Both articles have at least 5000 words (ES: ~8900 words, EN: ~8500 words).
- [ ] Frontmatter descriptions are within the optimal SEO range (120 to 160 characters).
- [ ] All English links in the Spanish article use absolute URLs `https://arceapps.com/blog/...` to bypass locale-prefix rewriting.
- [ ] All English links in the English article point to their correct English slugs (no Spanish slugs).
- [ ] Related articles' labels/titles in the English article are fully translated into English.

## Constraints & Guardrails

- Do not change file names/slugs of the final articles.
- Keep the first-person indie developer tone ("Espíritu Indie").
- Do not use placeholders or "TBD" in the text.

---

## Task List

See [cli-ai-grand-final-tasks.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/docs/specai/cli-ai-grand-final/cli-ai-grand-final-tasks.md) for the detailed step-by-step checklist.
