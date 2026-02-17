---
title: "Refining the Experience: Performance and Invisible Details"
description: "Confessions of a week optimizing ArceApps. The battle against CSS overlays, lazy image loading, and why I refactored search."
pubDate: 2026-01-06
heroImage: "/images/performance-hero.svg"
tags: ["performance", "ux", "astro", "optimization"]
---

You know that feeling when you finish a feature and it works, but something "feels wrong"? No console errors, Lighthouse 100, but navigating you notice micro-friction.

This week at **ArceApps** haven't added big features. Instead, dedicated fighting invisible details separating demo from real product. Honestly, harder than creating original features.

Battle diary here.

## 1. `z-index` Nightmare (How to Click Everything)

Blog card design Figma simple: "Whole card link, except tags". Easy, right?

Reality frustrating. Placing `<a>` link covering card (`absolute inset-0`) instantly killed tag buttons interactivity underneath. Unreachable.

Tried raising tag `z-index`. Nothing. Link captured event.
Hour reading `pointer-events`. Solution counter-intuitive elegant:

1.  "Invisible" link covering everything `z-index: 10`.
2.  Text content (title, description) `z-index: 20` BUT `pointer-events-none`. Clicks "pass through" text hit link below.
3.  Tags `z-index: 30` `pointer-events-auto`.

"Eureka" moment mixed "Why CSS like this?". UX liquid: click carelessly card read, aim precisely tag.

## 2. Search Diet

Use **Fuse.js** search. Marvel, weighs ~20kb. Not much, loading 20kb JavaScript main thread before user thinks search waste.

Decided implement **Lazy Loading**. Logic:
*   Page loads. Fuse.js DOES NOT exist.
*   User clicks magnifier 🔍.
*   *That millisecond*, download library search index parallel (`Promise.all`).

Result: lighter initial page, search feels instant. Felt surgeon removing dead weight.

## 3. Image Dance (CLS)

Nothing bothers more reading article text jumps image loaded above. Cumulative Layout Shift (CLS) Google penalizes.

Realized `AppCard` components guilty. No height defined image loaded.
Solution strict: `aspect-ratio` everything. Reserve DOM space before first image pixel arrives. Added `loading="lazy"` `decoding="async"` tell browser: "Take time, prioritize text".

## 4. Efficient Scroll: Stop Listening Everything

Had "Back to top" button listening window `scroll` event.
Every mouse wheel millimeter, code executed function. Thousands times. Silent performance disaster.

Refactored **Intersection Observer**. Instead asking "where am I?" constantly, place invisible element ("sentinel") page start tell browser: "Notify when element leaves view".

Code went frenetic loop zen wait. Processor thanks.

## Reflection

Developers obsess "What" (new features) forget "How" (usage feeling). Week shipped nothing visibly "new", web feels solid, *professional*.

Special satisfaction knowing, under hood, geared perfectly.

*Keep coding.*
