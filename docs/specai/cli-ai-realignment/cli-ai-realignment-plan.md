# AI CLI Tournament Realignment Implementation Plan

**Goal:** Realign the AI CLI tournament articles (Semifinal 1, Semifinal 2, and Grand Final) in both Spanish and English so that the 4 finalists are OpenCode, Codex, Claude Code, and Hermes.
**Architecture:** Markdown content collections (`src/content/blog/`).
**Tech Stack:** Astro, Markdown, Zod Schema.
**Status:** 🟢 COMPLETED

---

## Acceptance Criteria

- [x] **Semifinal 1**: The top 2 winners are Claude Code and Hermes Agent in both Spanish and English versions. Cline's score is adjusted downward, and Hermes Agent's score is adjusted upward.
- [x] **Semifinal 2**: The top 2 winners are OpenCode and OpenAI Codex in both Spanish and English versions. Aider's and Antigravity's scores are adjusted downward, and OpenCode's and Codex's scores are adjusted upward.
- [x] **Grand Final**: The 4 finalists analyzed are OpenCode, Codex, Claude Code, and Hermes Agent in both Spanish and English versions. Swapped sections detail Codex and Hermes instead of Aider and Trae CLI.
- [x] All updated articles maintain a high level of detail, indie developer tone, and are above 5000 words.
- [x] Production build succeeds without errors.

## Constraints & Guardrails

- Keep the first-person indie developer tone ("Espíritu Indie").
- Do not use placeholders or TBD.
- Follow the structure of `write-blog.md` and `write-blog-seo.md`.

---

## Task List

See [cli-ai-realignment-tasks.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/docs/specai/cli-ai-realignment/cli-ai-realignment-tasks.md) for the detailed step-by-step checklist.
