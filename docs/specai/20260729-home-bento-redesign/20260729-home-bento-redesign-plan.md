# Home Page Bento Grid Redesign Implementation Plan

**Goal:** Redesign the main landing page from scratch into an elegant, high-performance Bento Grid layout with fluid elevation hover animations, live activity indicators, and full bilinguality (`en` / `es`).  
**Architecture:** Astro component architecture featuring modular Bento Grid cards, CSS-driven GPU hardware-accelerated transitions, and i18n translation key integration.  
**Tech Stack:** Astro v5, Tailwind CSS v4, TypeScript, Material Icons.  
**Status:** 🟡 IN PROGRESS  

---

## Acceptance Criteria

What "done" means:
- [ ] The root home page (`/`) and Spanish home page (`/es/`) render the new Bento Grid layout cleanly.
- [ ] Cards elevate smoothly on hover (`-translate-y-2`) with subtle ambient shadows and border highlights.
- [ ] Featured app hero image loads eagerly for LCP performance.
- [ ] Devlog card presents a pulsing live indicator badge.
- [ ] Code builds without errors via `pnpm build`.

## Constraints & Guardrails

- CSS-only animations (GPU accelerated via `transform` and `opacity`); no heavy external JS animation libraries.
- Strict adherence to brand colors: Teal (`#018786` / `--color-primary`), Orange (`#FF9800` / `--color-secondary`), dark mode support (`dark:`).
- `motion-reduce:transition-none` applied to all animated elements for accessibility.

---

## Task List

### Task 1: Add Bento Grid Translation Keys (`src/i18n/ui.ts`)

**Files:**
- Modify: `src/i18n/ui.ts`

**Acceptance for this task:**
- [ ] `ui.ts` contains `home.bento.*` translation keys for both `en` and `es`.

---

### Task 2: Create Modular Bento Card Wrappers (`BentoGrid.astro` & `BentoCard.astro`)

**Files:**
- Create: `src/components/bento/BentoGrid.astro`
- Create: `src/components/bento/BentoCard.astro`

**Acceptance for this task:**
- [ ] `BentoGrid.astro` provides responsive grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 layout.
- [ ] `BentoCard.astro` provides hover elevation (`-translate-y-2`), ambient shadow, and focus ring.

---

### Task 3: Create Specialty Bento Grid Cards

**Files:**
- Create: `src/components/bento/BentoHeroCard.astro`
- Create: `src/components/bento/BentoFeaturedWorkCard.astro`
- Create: `src/components/bento/BentoDevlogCard.astro`
- Create: `src/components/bento/BentoTechStackCard.astro`
- Create: `src/components/bento/BentoQuickLinksCard.astro`

**Acceptance for this task:**
- [ ] `BentoHeroCard` renders developer manifesto and live badge.
- [ ] `BentoFeaturedWorkCard` renders featured project with `loading="eager"` image.
- [ ] `BentoDevlogCard` renders latest devlog entry with pulsing live activity dot.
- [ ] `BentoTechStackCard` renders interactive skill badges.
- [ ] `BentoQuickLinksCard` renders direct action buttons for GitHub and Google Play.

---

### Task 4: Refactor `HomePage.astro` to assemble the Bento Grid

**Files:**
- Modify: `src/components/pages/HomePage.astro`

**Acceptance for this task:**
- [ ] `HomePage.astro` uses the new Bento components to replace the old vertical Hero section.
- [ ] Re-uses `BlogCard` for the bottom technical articles section with updated grid styling.

---

### Task 5: Build and Verify

**Files:**
- Test: `pnpm build`

**Acceptance for this task:**
- [ ] `pnpm build` succeeds with 0 errors.
