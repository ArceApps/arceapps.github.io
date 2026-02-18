---
title: "Refining the Experience: Performance and Invisible Details"
description: "Confessions of a week optimizing ArceApps. The battle against CSS overlays, lazy image loading, and why I refactored search."
pubDate: 2026-01-06
heroImage: "/images/performance-hero.svg"
tags: ["performance", "ux", "astro", "optimization"]
---

You know that feeling when you finish a feature and it works, but something "feels wrong"? No console errors, Lighthouse gives 100, but while navigating you notice a micro-friction.

This week at **ArceApps** I haven't added big features. Instead, I dedicated myself to fighting those invisible details that separate a demo from a real product. And honestly, it has been harder than creating the original features.

Here is my battle diary.

## 1. The `z-index` Nightmare (or How to Click Everything)

The blog card design in Figma seemed simple: "The whole card is a link, except the tags". Easy, right?

The reality was frustrating. By placing an `<a>` link covering the whole card (`absolute inset-0`), I instantly killed the interactivity of the "tags" buttons underneath. They were unreachable.

I tried raising the `z-index` of the tags. Nothing. The link kept capturing the event.
I spent an hour reading about `pointer-events`. In the end, the solution was counter-intuitive but elegant:

1.  The "invisible" link covering everything has `z-index: 10`.
2.  The text content (title, description) has `z-index: 20` BUT `pointer-events-none`. This means clicks "pass through" the text and hit the link below.
3.  The tags have `z-index: 30` and `pointer-events-auto`.

It was one of those "Eureka" moments mixed with "Why is CSS like this?". But now the UX is liquid: you can carelessly click the card to read, or aim precisely at a tag.

## 2. Putting Search on a Diet

We use **Fuse.js** for the search engine. It is a marvel, but it weighs ~20kb. It might not seem like much, but loading 20kb of JavaScript on the main thread before the user even thinks about searching seemed like a waste to me.

I decided to implement **Lazy Loading**. The logic now is:
*   The page loads. Fuse.js DOES NOT exist.
*   The user clicks on the magnifier icon 🔍.
*   *In that millisecond*, I download the library and the search index in parallel (`Promise.all`).

The result: the initial page is lighter and search still feels instant. I felt like a surgeon removing dead weight.

## 3. The Dance of the Images (CLS)

Nothing bothers me more than reading an article and having the text jump because an image loaded above. That is Cumulative Layout Shift (CLS) and Google penalizes you for it.

I realized that my `AppCard` components were guilty. They didn't have a defined height until the image loaded.
The solution was strict: `aspect-ratio` on everything. Reserve space in the DOM before the first pixel of the image arrives. Also, I added `loading="lazy"` and `decoding="async"` to tell the browser: "Take your time with this, prioritize the text".

## 4. Efficient Scroll: Stop Listening to Everything

I had a "Back to top" button that listened to the window `scroll` event.
Basically, every time you moved the mouse wheel a millimeter, my code executed a function. Thousands of times. A silent performance disaster.

I refactored it using **Intersection Observer**. Instead of asking "where am I?" constantly, now I place an invisible element (a "sentinel") at the start of the page and tell the browser: "Notify me when this element leaves the view".

The code went from a frenetic loop to a zen-like wait. The processor appreciates it.

## Reflection

Sometimes, as developers, we obsess over the "What" (new features) and forget the "How" (the feeling of usage). This week I haven't shipped anything "new" visibly, but the web feels more solid, more *professional*.

And there is a special satisfaction in knowing that, under the hood, everything is geared perfectly.

*We keep coding.*
