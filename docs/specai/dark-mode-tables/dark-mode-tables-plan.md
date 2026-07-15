# Dark Mode Tables & Visual Contrast Revamp Implementation Plan

**Goal:** Fix visual contrast of tables in dark mode (making column headers readable) and verify general dark mode accessibility across the site.
**Architecture:** Restructure the prose table CSS rules in `src/styles/global.css` using explicit `.dark .prose` selectors. This prevents CSS specificity drop-offs caused by Tailwind CSS v4 `:where` selectors when nested in utility directives.
**Tech Stack:** Astro, Tailwind CSS v4, DaisyUI, CSS.
**Status:** ✅ DONE

---

## Acceptance Criteria

What "done" means:
- [x] **Table Header Contrast**: Column headers (`<th>`) in dark mode are easily readable. They must use `#F5F5F5` (`text-dark-on-surface`) for high contrast on `#1f2937` (`gray-800`) or `#1c1c1e` background.
- [x] **Table Row Contrast**: Cells (`<td>`) and striped rows (`tr`) in dark mode have correct visual hierarchy and contrast.
- [x] **Material Design Brand Elements**: Table headers use the brand Teal color (`#018786`) as a subtle border-bottom separating the headers from the body.
- [x] **General Dark Mode Verification**: No visual issues or unreadable texts exist in key pages (Home, Blog List, Blog Article, Apps List, About Me, Contact Form, Search) when toggled to dark mode.
- [x] **Astro Compilation**: The project builds successfully with `pnpm build`.

## Constraints & Guardrails

- **Zero Inline Colors**: Use CSS variables or Tailwind tokens for color styling. Do not write magic hex codes directly on components.
- **Specific CSS Selectors**: To override the `.prose` default styles, write explicit `.dark .prose` styles in `src/styles/global.css`.
- **i18n Support**: Ensure changes do not break or affect any language-specific styling (Spanish and English).

---

## Task List

### Task 1: Restructure Table CSS for Dark Mode in `global.css`

Modify the CSS styling inside `src/styles/global.css` to define distinct clear blocks for standard prose tables and explicit dark mode table overrides.

**Files:**
- Modify: [global.css](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/styles/global.css)

**Acceptance for this task:**
- Explicit `.dark .prose table` selectors are used instead of nesting `@apply dark:...` within clear components where specificity drops.
- Column headers (`<th>`) have high contrast text (`#F5F5F5`) and brand Teal (`#018786`) border-bottom.
- Body cells (`<td>`) have `border-gray-700` and table rows hover state is set properly.

### Task 2: Verify Visual Styles and Compile Astro

Validate overall dark mode elements visually and ensure the build succeeds.

**Files:**
- None (Verification task)

**Acceptance for this task:**
- Compiles successfully using `pnpm build`.
- Verification checklist passes.
