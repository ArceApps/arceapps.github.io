# Light Mode Default & Theme Toggle Fix Task List

- [x] **Task 1: Update Layout.astro inline script**
  - [x] Modify `getTheme()` in `src/layouts/Layout.astro` to return `"dark"` ONLY if `localStorage.getItem("theme") === "dark"`. Otherwise return `"light"`.
  - [x] Remove `localStorage.setItem("theme", theme)` from `applyTheme()` in `src/layouts/Layout.astro`.

- [x] **Task 2: Refactor header.ts event binding & lifecycle**
  - [x] Update `src/scripts/header.ts` to ensure `initHeader()` is invoked on immediate DOM load as well as `astro:page-load`.
  - [x] Verify click handler correctly toggles `.dark` on `document.documentElement` and sets `localStorage.setItem("theme", ...)`.

- [x] **Task 3: Run Vitest Unit Tests & Astro Build Verification**
  - [x] Update `src/scripts/header.test.ts` to match new default behavior.
  - [x] Execute `pnpm test` and `pnpm build`.
