# Dark Mode Tables & Visual Contrast Revamp Tasks

## Task Checklist

- [x] **Task 1: Restructure Table CSS for Dark Mode in `global.css`**
  - [x] Step 1: Open [global.css](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/styles/global.css) and locate the tables styling block (around lines 253-279).
  - [x] Step 2: Replace standard `dark:text-dark-on-surface-variant` on `<th>` and nesting `@apply dark:...` rules with a separate, explicit `.dark .prose` block for tables, matching the requirements of high-contrast text (`text-dark-on-surface`) and Teal border-bottom (`border-primary`).
  - [x] Step 3: Run `pnpm build` to compile the CSS assets and ensure there are no compilation errors with Tailwind v4 or Astro.
  - [x] Step 4: Commit the changes with `git commit -m "style: fix table headers and cells contrast in dark mode"`.

- [x] **Task 2: Perform Visual Verification and Compile**
  - [x] Step 1: Start dev server with `pnpm dev` and preview the table inside the blog post "AI Tools Worth Learning in 2026" in dark mode.
  - [x] Step 2: Audit other key components and layouts (Footer, Header, PhilosophyCard, ContactForm) in dark mode to ensure no other text has poor contrast.
  - [x] Step 3: Create the final verification report [dark-mode-tables-verify.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/docs/specai/dark-mode-tables/dark-mode-tables-verify.md).
  - [x] Step 4: Build project in production mode with `pnpm build` to confirm output validity.
  - [x] Step 5: Commit the verification report with `git commit -m "docs: add dark mode verification report"`.

## Iteration Tasks

- [x] **Task 3: Refine Table Headers & Cells Contrast in `global.css` (Iteration 1)**
  - [x] Step 1: Modify [global.css](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/styles/global.css) applying `!important` to `.dark .prose th` and `.dark .prose td` table overrides. Set `th` text color to bright Teal (`#00bfa5` or `#03dac6`) and `td` to `#F5F5F5` (off-white).
  - [x] Step 2: Compile CSS with `pnpm build` to verify syntax.
  - [x] Step 3: Verify the generated CSS file in `dist/_astro/` contains the forced styles.
  - [x] Step 4: Commit the changes with `git commit -m "style: force high-contrast brand Teal text on dark mode table headers"`.
