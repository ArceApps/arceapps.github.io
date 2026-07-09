# AI CLI Grand Final Finalists Correction Implementation Plan

**Goal:** Correct the 4 finalists of the AI CLI Grand Final articles (in Spanish and English) to match the actual semifinal winners in the repo: Cline (instead of OpenCode) and Antigravity CLI (instead of Trae CLI).
**Architecture:** Markdown content collections (`src/content/blog/`) integrated with Astro 5 i18n routing.
**Tech Stack:** Astro, Markdown, Zod Schema.
**Status:** 🟡 IN PROGRESS

---

## Acceptance Criteria

- [ ] Both `es/cli-ai-grand-final.md` and `en/cli-ai-grand-final.md` use Cline (agnostic winner) instead of OpenCode.
- [ ] Both articles use Antigravity CLI (native/closed winner) instead of Trae CLI.
- [ ] Swapped content correctly details the architecture, context handling, diffs, costs, and benchmarks of Cline and Antigravity CLI based on their semifinal descriptions.
- [ ] The article length remains above 5000 words.
- [ ] Production build succeeds without errors.

## Constraints & Guardrails

- Maintain the first-person indie developer tone ("Espíritu Indie").
- Do not use placeholders or "TBD".
- Use the correct scores (Cline: 45/50, Antigravity CLI: 44/50).

---

## Task List

See [cli-ai-grand-final-correction-tasks.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/docs/specai/cli-ai-grand-final-correction/cli-ai-grand-final-correction-tasks.md) for the detailed step-by-step checklist.
