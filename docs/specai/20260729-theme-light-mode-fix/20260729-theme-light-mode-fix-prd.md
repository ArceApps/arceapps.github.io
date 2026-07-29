# Product Requirements Document: Light Mode Default & Theme Toggle Fix

**Date:** 2026-07-29
**Status:** DRAFT

## 1. Problem Statement & Solution

### Problem Statement
The website is currently defaulting to Dark Mode on initial load when the user's OS has `prefers-color-scheme: dark` active, and immediately saves `"dark"` to `localStorage`. Furthermore, the `#theme-toggle` button in the header becomes non-functional ("does nothing") due to race conditions or lifecycle detachment in the Astro View Transitions script loading flow (`header.ts`).

### Solution
1. Update `Layout.astro` inline theme script to default strictly to Light Mode (`"light"`) on initial visits when `localStorage` has no `"theme"` key set, ignoring `prefers-color-scheme`. Avoid calling `localStorage.setItem` automatically during initial load without user interaction.
2. Refactor `header.ts` event binding so that `initHeader()` is securely attached both on initial DOM load (`DOMContentLoaded` / immediate check) and on `astro:page-load`, ensuring the `#theme-toggle` click listener is always active and responsive.
3. Preserve full 500ms smooth visual animations for the Sun/Moon icons (`#icon-light` and `#icon-dark`) and background color surface transitions in `global.css`.

---

## 2. User Stories

> **As a** visitor, **I want to** load the website in Light Mode by default on my first visit **so that** I experience the intended brand design regardless of my OS theme settings.

> **As a** visitor, **I want to** click the theme toggle button in the header **so that** I can seamlessly switch between Light and Dark mode with a smooth icon and color animation.

> **As a** returning visitor, **I want to** have my manually chosen theme preference persisted across sessions and pages **so that** my custom choice is respected.

---

## 3. Architectural Decisions

### Module Architecture
- **`Layout.astro`**: Inline script inside `<head>` responsible for reading `localStorage.getItem("theme")`. If set to `"dark"`, it adds `.dark` to `document.documentElement`. Otherwise, it removes `.dark`. No `localStorage.setItem` is called during this pre-render step if no value exists.
- **`src/scripts/header.ts`**: Contains `initHeader()`. Queries `#theme-toggle` element, attaches click event listener `handleThemeToggle()`. Toggles `.dark` on `document.documentElement`, sets `localStorage.setItem("theme", isDark ? "dark" : "light")`, and triggers haptic feedback.
- **`src/components/Header.astro`**: Renders `#theme-toggle` button with SVG/Material icons `#icon-dark` (Moon) and `#icon-light` (Sun), with Tailwind dark mode transition classes.

### Verification Seams (Costuras)
- **Unit Tests**: `src/scripts/header.test.ts` verifying event listener attachment and `localStorage` mutation on `#theme-toggle` click.
- **Build Verification**: `pnpm build` to verify Astro static site compilation without TypeScript or bundling errors.

### Avoiding Side Effects
- Theme state is strictly governed by the presence or absence of the `.dark` class on `document.documentElement`.
- No global mutation of `localStorage` on passive page loads.

---

## 4. System Constraints (Must-NOTs)

- The application **must NOT** default to Dark Mode on first visit.
- The script **must NOT** write to `localStorage` automatically on page load unless the user clicks the toggle button.
- The execution **must NOT** lose event listeners when navigating between pages via Astro View Transitions.

---

## 5. Edge Case Analysis

- **`localStorage` Access Denied / Disabled**: Wrap `localStorage` access in `typeof localStorage !== "undefined"` try-catch blocks to prevent errors in strict/incognito browser settings.
- **Fast Navigation / View Transitions**: Cleanup existing listeners on `astro:before-swap` and re-bind on `astro:page-load` and `DOMContentLoaded`.

---

## 6. Out of Scope

- Adding custom color themes beyond Light and Dark mode.
- System auto-detect toggle settings.
