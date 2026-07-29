# Product Requirements Document: Home Page Bento Grid Redesign

**Date:** 2026-07-29  
**Status:** DRAFT  

## 1. Problem Statement & Solution

### Problem Statement
The current home page layout (`HomePage.astro`) uses a standard linear vertical structure with basic card elements. While functional, it lacks a visual "wow factor", dynamic modern aesthetics, and fluid micro-interactions that showcase the developer's craftsman mindset and high attention to detail as an indie software creator.

### Solution
Redesign the home page from scratch into an elegant, highly structured **Bento Grid** layout. It retains the core brand identity (Teal `#018786` and Orange `#FF9800`, dark mode support) while elevating the user experience through fluid Y-axis elevation (`-translate-y-2`), ambient shadows, subtle border highlights, live activity indicators, and staggered content reveals.

---

## 2. User Stories

1. **As a** visitor browsing the website, **I want to** see a modern, visually striking Bento Grid landing page **so that** I am immediately impressed by the craftsman quality and indie developer identity.
2. **As a** user hovering over any card in the Bento Grid, **I want to** experience smooth Y-axis elevation and ambient shadow transitions **so that** the UI feels responsive, dynamic, and tactile.
3. **As a** Spanish-speaking or English-speaking visitor, **I want to** view all content in my preferred language seamlessly **so that** I can consume articles, app descriptions, and devlogs without language barriers.
4. **As a** visitor, **I want to** see the latest devlog entry with a live activity pulse **so that** I know the developer is actively building in public.
5. **As a** visitor on a mobile device or screen with reduced motion enabled, **I want to** navigate a responsive, accessible layout with non-intrusive transitions **so that** usability is preserved across all hardware and accessibility settings.

---

## 3. Architectural Decisions

### Module Architecture
- **`src/components/pages/HomePage.astro`**: Central component that consumes Astro content collections (`apps`, `projects`, `blog`, `devlog`), accepts `lang: 'en' | 'es'`, and renders the Bento Grid + Blog section + CTA banner.
- **`src/components/bento/BentoGrid.astro`**: Layout container component for the Bento Grid with responsive CSS Grid rules.
- **`src/components/bento/BentoCard.astro`**: Reusable card component wrapping common elevation effects, ambient shadows, and hover transitions.
- **`src/components/bento/BentoHeroCard.astro`**: Specialty card for the primary developer intro & live status badge.
- **`src/components/bento/BentoFeaturedWorkCard.astro`**: Specialty card for the latest app/project highlight with eager LCP image loading.
- **`src/components/bento/BentoDevlogCard.astro`**: Specialty card for "Building in Public" devlog feed with pulse animation.
- **`src/components/bento/BentoTechStackCard.astro`**: Specialty card showcasing key technologies (Kotlin, Jetpack Compose, Astro, Tailwind).
- **`src/components/bento/BentoQuickLinksCard.astro`**: Specialty card offering fast direct actions to GitHub and Google Play.
- **`src/i18n/ui.ts`**: Expanded with new `home.bento.*` translation keys for both English and Spanish.

### Verification Seams (Costuras)
- **Astro Build Check:** `pnpm build` must pass cleanly with zero TypeScript or Astro template errors.
- **i18n Key Verification:** Both `/` (EN) and `/es/` (ES) routes must render all strings without missing translation keys or fallbacks.
- **Visual & Layout Check:** Grid layout must adapt seamlessly across desktop (`lg:grid-cols-3` / `lg:grid-cols-4`), tablet (`md:grid-cols-2`), and mobile (`grid-cols-1`).

### Avoiding Side Effects
- Existing components (`Hero.astro`, `ProjectCard.astro`, `BlogCard.astro`) will not be modified directly unless needed for consistency, preventing regression on secondary pages like `/apps`, `/projects`, or `/blog`.
- All CSS rules utilize Tailwind v4 utility classes and local CSS variables to avoid leaking styles to global scope.

---

## 4. System Constraints (Must-NOTs)

- The implementation **must NOT** introduce heavy client-side JavaScript frameworks (e.g. React, Framer Motion, GSAP). All animations must be CSS-driven for maximum performance.
- The design **must NOT** use generic, uncurated colors; it must strictly adhere to `--color-primary` (`#018786`), `--color-secondary` (`#FF9800`), and dark mode surface tokens.
- The layout **must NOT** break accessibility: interactive cards must be keyboard-navigable (`focus-visible:ring-4`), and `motion-reduce:transition-none` must disable animations when requested by the OS.
- Images in the Bento Grid **must NOT** cause LCP regressions; the primary featured image must use `loading="eager"` and `fetchpriority="high"`.

---

## 5. Edge Case Analysis

- **Empty Collection / Missing Data:** If `devlog` collection contains no active entries for the current language, the `BentoDevlogCard` gracefully falls back to displaying a "Recent Open Source Projects" card.
- **Title / Description Overflow:** Text fields inside cards enforce clean CSS line-clamping (`line-clamp-2`, `line-clamp-3`) to prevent card height distortion in asymmetric grid rows.
- **Dark Mode Preference:** Instant dark mode toggle support via `dark:` class without layout shift or flash of unstyled content (FOUC).

---

## 6. Out of Scope

- Redesigning inner detail pages (`/apps/[slug]`, `/blog/[slug]`, `/devlog/[slug]`).
- Adding complex backend server endpoints or dynamic runtime databases.
