# Light Mode Default & Theme Toggle Fix Implementation Plan

**Goal:** Fix theme initialization to default to Light Mode on first visit (ignoring system OS preferences until manually changed) and ensure `#theme-toggle` button operates reliably on initial load and View Transitions.
**Architecture:** Astro View Transitions + Client Script Lifecycle in `src/scripts/header.ts` and `<head>` pre-render script in `src/layouts/Layout.astro`.
**Tech Stack:** Astro 5, TypeScript, Tailwind CSS v4.
**Status:** 🟡 IN PROGRESS

---

## Acceptance Criteria

- [ ] Web application defaults strictly to Light Mode ("light") for users with no saved theme in `localStorage`.
- [ ] No `theme` key is written to `localStorage` on initial load until the user manually clicks `#theme-toggle`.
- [ ] Clicking `#theme-toggle` toggles between Light Mode and Dark Mode reliably on initial page load and after View Transitions.
- [ ] Icon transition (rotate + scale between Sun and Moon) and background color transitions perform smoothly with 500ms duration.
- [ ] `pnpm test` and `pnpm build` pass with zero errors.

---

## Constraints & Guardrails

- Conventional commits only (no AI attribution or Co-Authored-By).
- Do not mutate global state unnecessarily on initial load.
- Ensure strict type safety in TypeScript files.

---

## Task List

### Task 1: Update Layout.astro Inline Theme Initialization Script
- **Files:** `src/layouts/Layout.astro`
- **Acceptance:** Default theme returns `"light"` if `localStorage.getItem("theme")` is null/empty. No `localStorage.setItem` call on initial load.

### Task 2: Refactor Header Theme Toggle Event Listener & Lifecycle
- **Files:** `src/scripts/header.ts`
- **Acceptance:** `#theme-toggle` listener bound on DOM ready and `astro:page-load`. Cleaned up on `astro:before-swap`.

### Task 3: Unit Testing & Build Verification
- **Files:** `src/scripts/header.test.ts`
- **Acceptance:** Vitest tests pass for header theme toggling, and `pnpm build` succeeds.
