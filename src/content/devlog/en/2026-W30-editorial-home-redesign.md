---
title: "W30: Editorial Home, Building in Public"
description: "Rebuilding the ArceApps landing page as an editorial cover: a typographic hero with the indie manifesto and four numbered sections (Devlog, Blog, Featured Work, CTA)."
pubDate: 2026-07-29
lastmod: 2026-07-29
author: "ArceApps"
keywords: ["ArceApps", "devlog", "editorial", "home", "tailwind"]
canonical: "https://arceapps.com/devlog/2026-w30-editorial-home-redesign/"
tags: ["home", "editorial", "redesign", "typography", "i18n"]
heroImage: "/images/2026-W30-editorial-home-redesign-cover.svg"
---

## Editorial home, week 30

The landing page of **ArceApps** has lived two lives in the last few weeks. First it was a classic linear layout, then it became a Bento Grid. Today it becomes something closer to a magazine cover: a single oversized headline, a two-line indie manifesto, and four numbered chapters.

## Why change everything

The Bento Grid was dense and modern, but it buried the **why** behind the work. Anyone arriving at the site had to scan five tiles to figure out what kind of developer this was. The new layout makes the answer immediate: *one person, spare hours, Android apps crafted slowly and in public*.

## What changed

- **Hero:** "ArceApps" at `clamp(14vw)` weight 900, a single orange dot as the brand accent, and the manifesto below in a light weight. Scroll hint anchored to the first section.
- **Sections:** `01 Devlog`, `02 Blog`, `03 Featured Work`, `04 CTA`. Each has a ghost number, a bold title, and an optional "view all" link.
- **Accessibility:** every animation respects `prefers-reduced-motion`, decorative numbers are `aria-hidden`, focus rings stay visible on the orange accent.
- **i18n:** the manifesto and the new section titles exist in both English and Spanish. Five new keys landed in `ui.ts`; the obsolete `home.bento.*` keys were removed.

## What stayed

- **Brand colors:** Teal `#018786` and Orange `#FF9800`. No other colors.
- **`BlogCard.astro`:** reused as-is in section 02.
- **Data fetching:** the same `getCollection` filters and ordering as before.

The devlog stays short on purpose. The next entry will be about the typography pairing and the scroll-driven animations.
