# Infographics Update for OpenSpec and SDD Articles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use specai:specai-subagent-driven-development
> This plan has three parts: the plan file (`20260704-infographics-update-plan.md`), the tasks list (`20260704-infographics-update-tasks.md`), and the verification report (`20260704-infographics-update-verify.md`).
> Acceptance criteria live ONLY in `20260704-infographics-update-verify.md` — never duplicate them here.
> The documenter subagent updates all files during execution.

**Goal:** Rebuild placeholder and SVG blog headers with elegant, professional PNG infographics generated via `generate_image` in both English and Spanish, and update the blog posts frontmatter metadata.
**Architecture:** Generate 10 distinct PNG infographics (5 topics, 2 languages each) using the `generate_image` tool with precise prompts specifying layout, typography, off-white background, brand accents, and localized text. Save them to `public/images/` and update frontmatter references in Astro.
**Tech Stack:** Astro, Antigravity Image Generator.
**Status:** 🟡 IN PROGRESS

---

## Constraints & Guardrails

- **Fondo Elegante:** Do not use pure white backgrounds (`#FFFFFF`). Use slate-50 (`#F8FAFC`).
- **Brand Colors:** Text and layout lines must use Slate (`#0F172A`), Teal (`#018786`), and Orange (`#FF9800`) as defined in the spec.
- **Bilingüismo:** Keep the infographics strictly symmetrical in ES/EN translations for each corresponding article.
- **No breaking changes:** Keep existing SVGs in the workspace. Only replace frontmatter references.
- **Dimensions:** Keep all generated images strictly at 1200x630px.

## Architectural Notes

- The images should have clean, flat vector illustrations representing the technical cycle/nodes/terminal.
- Typographic labels should be generated directly in the image. If there are minor spelling glitches, regenerate or tweak the prompt.

## Execution Log

_Living record, updated by the documenter subagent. Do not edit by hand._
