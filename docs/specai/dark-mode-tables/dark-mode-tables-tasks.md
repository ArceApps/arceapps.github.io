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

- [x] **Task 3: Refine Table Headers & Cells Contrast in Templates and CSS (Iteration 1)**
  - [x] Step 1: Add `dark:prose-invert` class to prose wrapper elements in:
    - [src/pages/apps/[...slug].astro](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/pages/apps/[...slug].astro)
    - [src/pages/es/apps/[...slug].astro](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/pages/es/apps/[...slug].astro)
    - [src/pages/blog/[...slug].astro](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/pages/blog/[...slug].astro)
    - [src/pages/es/blog/[...slug].astro](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/pages/es/blog/[...slug].astro)
    - [src/pages/devlog/[...slug].astro](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/pages/devlog/[...slug].astro)
    - [src/pages/es/devlog/[...slug].astro](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/pages/es/devlog/[...slug].astro)
  - [x] Step 2: Refine [global.css](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/styles/global.css) by setting `.dark .prose th { color: #00bfa5 !important; }` and clean up explicit overrides that are now covered by `dark:prose-invert`.
  - [x] Step 3: Run `pnpm build` to compile the CSS assets and HTML pages.
  - [x] Step 4: Verify the output files (`dist/` and `dist/_astro/*.css`) have the correct styles.
  - [x] Step 5: Commit the changes with `git commit -m "style: add dark:prose-invert to templates and force high-contrast brand Teal text on table headers"`.
