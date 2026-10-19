---
title: "Cookie consent: when Partytown stopped being the answer"
description: "How the portfolio went from loading Google Analytics without asking to a Consent Mode v2 setup with default denied, a bilingual banner and real E2E checks."
pubDate: 2026-08-12
lastmod: 2026-10-19
author: "ArceApps"
keywords:
  - "Consent Mode v2"
  - "Partytown"
  - "Google Analytics"
  - "cookies"
  - "GDPR"
canonical: "https://arceapps.com/en/devlog/2026-08-12-portfolio-cookie-consent/"
heroImage: "/images/devlog/portfolio-cookie-consent.svg"
tags: ["Privacy", "Google Analytics", "Partytown", "Astro", "Building in Public"]
---

## Update — 19 October 2026

This entry is preserved as a historical record. The architecture it describes (Consent Mode v2 with default denied, Partytown, the bilingual banner with accept/reject) is no longer the current state of the site.

Two months after publishing this devlog, the editorial automation that runs `write-blog`/`write-devlog` introduced several regressions at once: a duplicate of the real Google Analytics measurement ID leaked into a devlog about secret-leak guard, the cookie banner stopped dismissing on click, the language switcher broke on the devlog that introduced this very feature, and a hero image on the DeepSeek article went missing on production. The shared root cause was that the automation executed skills that the codebase didn't enforce: filename parity, banner behaviour, and reference_id integrity were all implicit, not contracted.

The fix was a single feature that did four things at once: removed the dependency on third-party analytics entirely, made the cookie banner a one-click dismiss that survives Astro View Transitions, introduced an `i18n-parity-check` contract test that the build refuses to merge past when an article pair has mismatched filenames, and gave the devlog page the same `reference_id` cross-language bridge the blog page already had.

Concretely, the site as of 19 October 2026 does not load `gtag.js`, does not declare any Consent Mode signals, and the CSP no longer lists `googletagmanager.com` or `google-analytics.com`. The cookie banner that this entry introduced is still present, but it is now a notice about strictly functional cookies (theme, the fact that the user has seen and dismissed the notice) — there is nothing left to accept or reject, because there is no third-party data being collected. The bilingual content of this devlog is unchanged below; it is kept verbatim because the underlying mechanics (the order of the default-denied block, the `dataLayer.push(arguments)` stub, the `astro:before-swap` event, the `forward: ["dataLayer.push"]` Partytown proxy, the `pnpm test` contract that fails if the default lands after `gtag.js`) are still correct for any future site that does want Consent Mode v2 — and because the most useful lessons from the experience are not the ones that depended on the technology.

## Original entry — 12 August 2026

Some debts stay invisible until someone reads your own privacy policy with attention. For a long time, the ArceApps portfolio loaded Google Analytics on every page, unconditionally, with no consent mechanism at all. And the privacy page, written in good faith, stated that users "can accept or reject these cookies". One of those two things was a lie: there was no way to reject them.

On 12 August 2026 we fixed that contradiction from top to bottom. It was not a matter of dropping in a banner. The website's real behaviour had to match what it promised in writing, and it had to happen inside the architecture we already had: a static Astro site, analytics loaded through Partytown, and a privacy policy we did not want to rewrite just to paper over the problem.

This entry tells the full sequence: what we found, which alternatives we weighed, why we picked Google Consent Mode v2 and, above all, why a piece that looked perfect —running analytics in a web worker— turned out to be the piece we had to remove.

## A website that measured before it asked

The starting point was easy to describe and hard to defend. In `src/layouts/Layout.astro`, `gtag.js` was loaded with the Google Analytics measurement ID on every page, executed through Partytown. There was no prior condition: the script was injected always, for every visitor, without asking.

Google Analytics installs non-essential cookies —`_ga`, `_gid`, `_gat_*`— and in the European Union that kind of cookie requires prior consent. The basis isn't debatable: article 5.3 of the ePrivacy Directive governs storing information on a user's equipment, and the AEPD's cookie guide, in its July 2023 update, lays out how that consent must be requested and recorded. On top of that, since March 2024 Google requires Consent Mode v2 for its tags in the European Economic Area.

The most uncomfortable contradiction wasn't technical, it was one of consistency. The site's privacy policy already talked about cookies and took for granted that the user had a choice. That choice didn't exist in the interface. Anyone auditing the site could point at one specific sentence in our own documentation and ask us to honour it.

So the problem had three layers: a legal one (prior consent), a technical one (where and how the consent state is declared), and one of documentary honesty (what we say and what we do must match).

## Four paths and an uncomfortable decision

Before touching code, the work was to write the alternatives down and choose with a clear head. We documented four paths.

**Path A** was the most obvious: build your own banner and load `gtag.js` only after the user accepts. It's the solution most people imagine first, and it has a clear virtue: if someone rejects, not a single request goes to Google. The problem is the cost. Anyone who rejects or ignores the banner vanishes completely from the statistics. You don't lose part of the data: you lose that part entirely, with no estimate at all.

**Path C** went the opposite way: replace Google Analytics with a cookieless analytics tool —Plausible, Umami, GoatCounter— and remove the problem at the root. With no non-essential cookies there's no banner needed, and you legally measure practically everyone. On paper it was the cleanest option, and it's one that suits many indie projects. But it meant giving up the Google ecosystem —Search Console, funnels, already-instrumented events— and migrating the history. We discarded it deliberately.

**Path D** was to do nothing. We discarded it for the obvious reason: the legal exposure stayed live and the contradiction with the privacy policy would remain.

The chosen one was **Path B: Google Consent Mode v2**. The idea is that `gtag.js` always loads, but starts with consent in the `denied` state. From there, the site only updates it if the user accepts. Those who accept generate real data; those who reject or ignore generate cookie-less pings that Google can handle with statistical modelling. You keep the ecosystem and you keep an estimate of all traffic, in exchange for accepting that the modelled part is an estimate, not an exact count.

It's a product decision, not just a technical one. The AEPD, in its 2024 report, warned that modelling doesn't excuse you from configuring consent correctly. In other words, Consent Mode v2 isn't permission to measure everyone: it's a way not to lose everything when the configuration is right. That distinction guided every decision that followed.

## How Consent Mode v2 actually works

It helps to separate two things that are often blurred: the banner and the consent mode. The banner is the interface. The consent mode is a contract between the page and the Google tags underneath.

That contract is built with two commands. First, a default state:

```js
gtag("consent", "default", {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "granted",
  security_storage: "granted"
});
```

Then an update when the user decides:

```js
gtag("consent", "update", { analytics_storage: "granted" });
```

We made several deliberate decisions. The first: the default state is `denied` for **all** visitors, with no regional segmentation. It's the most conservative option and it avoids maintaining country lists that go stale. Besides, the banner is shown to everyone, so it makes no sense for the default to depend on geolocation.

The second: on accepting, **only** `analytics_storage` is granted. The three advertising signals —`ad_storage`, `ad_user_data`, `ad_personalization`— stay `denied` forever. The site carries no advertising, and its policy says so plainly; if the code enabled marketing signals, the banner's line ("we don't collect data for advertising") would be a lie. Consistency between what the interface promises and what the code allows was a review criterion, not a detail.

The third: `functionality_storage` and `security_storage` remain `granted`. They don't affect Google Analytics, but they're standard Consent Mode v2 signals and they leave the setup ready for future tags without having to rebuild the default.

## The default has to arrive first

This is where the first real ordering problem shows up. It isn't enough to declare the default somewhere on the page: it has to run **before** `gtag.js` loads and reads the state. If the analytics script starts first, the default is "no consent", and the mode is silently disabled.

The solution was to place the default script in the `<head>`, inline, on the main thread, before the block that loads analytics. At that point nothing third-party has run and no cookie has been created: the browser just stores an instruction in the `dataLayer`.

That script also handles the visitor who has already decided. It reads `localStorage['cookie-consent']` and, if a stored choice exists, fires the `update` right after the default. We chose `localStorage` rather than a cookie precisely because it isn't a cookie: it isn't part of what must be consented to, it survives navigation, and it's readable both by the default script and by the banner.

## The stub trap: arguments Google ignores

There's a tiny detail with enormous consequences. Before `gtag.js` finishes loading, a page usually defines a `gtag` stub that queues calls in the `dataLayer`. The most common way to write it is:

```js
function gtag() {
  dataLayer.push(arguments);
}
```

And the apparently equivalent, but broken, way is:

```js
function gtag() {
  dataLayer.push(Array.from(arguments));
}
```

`Array.from(arguments)` turns the `arguments` object into a normal array. It looks cleaner. But Google's consent API expects the native `arguments` object, and when it receives a serialized array it **ignores the command**. It doesn't error, it doesn't warn: it simply doesn't apply the consent state. The result is a silently disabled mode that appears to work until you actually audit it.
This is the kind of bug that justifies not trusting intuition. The official documentation and practical guides on the Astro + Google Tag Manager + Partytown combination flag it as a known trap, which is why it became an explicit project constraint: the stub **must** push `arguments`, with no `Array.from`. In the final code, moreover, the stub is defined only as a fallback —`window.gtag = window.gtag || function () { dataLayer.push(arguments); }`— so it doesn't overwrite the real `gtag.js` implementation if it has already loaded.

## Partytown enters the scene… and leaves

Partytown is a great tool and it fitted the project's spirit: it moves third-party scripts into a web worker so they don't block the main thread. The configuration already forwarded calls to the `dataLayer` with `forward: ["dataLayer.push"]`, so, in principle, everything we needed was already wired up.

In fact, the first version of the requirement was just that: keep `gtag.js` in Partytown and don't touch the configuration. But when we verified the real behaviour, the underlying problem appeared. Partytown runs analytics in a worker, and the worker has its own copy of the `dataLayer`. The forwarding is one-way: the main thread pushes into the worker, but the main thread doesn't see what happens inside. That means the order between the default and the `gtag.js` load isn't guaranteed the way Consent Mode v2 requires.

The final decision was to remove Partytown from the analytics path. The change was small in lines and big in intent: the `@astrojs/partytown` dependency disappears from `astro.config.mjs`, the `type="text/partytown"` disappears from the Google scripts, and `gtag.js` moves to the main thread, with `async`, right after the script that declares the default.

The comment we left in the code sums up the lesson: *"Consent Mode requires gtag.js to read the default directly from the main-thread dataLayer; Partytown does not guarantee that order in the worker"*. It's not that Partytown is a bad idea. It's that, in this specific case, a guarantee of order weighed more than the performance saving, and there was no way to have both with this architecture.

## Verifying without TagAssistant

Verifying Consent Mode v2 is harder than it looks, precisely because of this class of middlemen. TagAssistant, Google's usual tag-inspection tool, wasn't reliable here: in a worker-based setup the main thread doesn't see the updates, and tests that read `window.dataLayer` don't see the real state either.

So we verified by observable behaviour, not by third-party tooling. The sign that consent works is twofold: **which cookies exist** and **which requests are sent**. If the default didn't arrive, `gtag` would create `_ga` even before the user decided anything. If the update didn't arrive, accepting wouldn't create `_ga`.

With that logic we wrote an E2E suite that walks three scenarios and checks eight things: that the banner appears on the first visit, that there's no Google cookie before deciding, that accepting stores `granted` and creates `_ga`, that the banner doesn't reappear on return, that rejecting stores `denied` and leaves zero cookies, and that on returning after rejecting it doesn't reappear either.

Those eight checks aren't arbitrary. The first two establish the baseline: the banner is shown and, crucially, no Google cookie exists before any decision — which is the whole point of a `denied` default. The next two prove the accept path end to end: the choice is stored and `_ga` actually appears, which only happens if the update reached `gtag.js` through the main-thread `dataLayer`. Checks five and eight cover the returning visitor in both directions, because a banner that comes back after a decision is both annoying and a sign that persistence is broken. And the reject path (six and seven) proves the mirror image of accept: the choice is recorded and, despite `gtag.js` still being loaded, no cookie is created. Together they describe the whole contract, not a single happy path.

In parallel, we added a contract test protecting two things that are easy to break without noticing: the existence and content of the banner, and **the order** of the default-consent script relative to the analytics load. That second test is the one that stops a future refactor from moving the default behind `gtag.js` and disabling everything silently.

The verification's closure was explicit: the build went green with all its pages generated, the contract test passed, the test suite came back clean apart from one pre-existing failure unrelated to this change, and the `/cookies` and `/es/cookies` routes returned 200 with their cookie table. None of it was waved through "by eye".

## A *feature* isn't closed until someone accepts it

There's a rule in the internal workflow that deserves its own mention: the *Gate UA*, user acceptance. The technical verification can be entirely green and the work still isn't closed, because the final condition isn't that the tests pass, but that the person observes the real result and accepts it explicitly.

The distinction is more useful than it looks. It separates "the code does what it says" from "the result is what we wanted". In a change like consent, that second question can't be answered by any suite: the product decision —keeping Google Analytics with modelling instead of migrating to cookieless analytics— is a business choice, and the user's feeling on seeing the banner is an experience, not an assertion. That's why the work was documented as technically complete and functionally pending that acceptance, with no shortcuts and without declaring it "done" ahead of time.

## The legal half that isn't code

There's a temptation to treat consent as a purely technical problem: add the script, add the banner, done. But half of the matter is information, not code.

We wrote a bilingual Cookie Policy with a table in the style of the AEPD guide: cookie name, purpose, duration and provider. It covers Google Analytics cookies explicitly, explains consent, what Consent Mode is and how to withdraw the decision. The page lives at `/cookies` (English) and `/es/cookies` (Spanish), using the same internationalisation system as the rest of the site.

The banner is also a piece of language, not just of interface. The copy we approved says, in essence, three things: that the site is free and ad-free, that only statistics cookies are used, and that no data is collected for advertising, sold or shared, and no sensitive data is gathered. The two buttons —Accept statistics and Reject— carry the same visual weight, exactly as the AEPD requires. No pre-ticked boxes, no cookie walls, no accepting by default.

The decision to write a banner without dark patterns isn't only ethical; it's practical too. An honest banner reduces friction and raises the acceptance rate, and at the same time leaves the project in a defensible position if anyone audits it.

Accessibility was part of the same requirement. The banner behaves as a dialog (`role="dialog"`, `aria-label`), its buttons are keyboard-accessible and the contrast meets level AA. It's not decoration: consent you can't comfortably read or operate isn't real consent. The "Cookies" link in the footer also guarantees that the policy stays reachable from any page and that the decision can be reviewed later.

One last interface detail: the site uses View Transitions, and the banner lives in the global layout. When navigating between pages, the banner had to be prevented from flickering or reappearing. We solved it with a listener on `astro:before-swap` that removes the banner from the incoming document once a stored choice exists, the same pattern the theme script already used.

## The cost of finding out late

This work actually started with a reading. Someone —in this case, the workflow itself— read the privacy policy and realised it promised a choice that didn't exist. It's an uncomfortable and useful reminder: the debt isn't always where you look. It was in a sentence written months earlier, which nobody had checked again against the site's real behaviour.

If I take one thing from this period, it's that public documentation is part of the system and deserves the same checks as the code. A policy that isn't audited turns, over time, into a broken promise. And broken promises are the ones that, one day, someone points out to you in writing.

That's also why this devlog is being written now, weeks after the code shipped, as part of the portfolio's historical audit: the fix happened on 12 August, but documenting it properly is part of paying the same debt.

## What I learned

The first lesson is that a good tool for one problem can be the wrong tool for another. Partytown solved the real problem of not blocking the main thread, and it solved it well. But Consent Mode v2 needs a guarantee of order that a worker with one-way forwarding can't provide. Removing it wasn't a failure of Partytown: it was recognising that the constraint that mattered —the order between the default and the load— weighed more than the one Partytown optimised.

The second is that silent failures are the expensive ones. The `Array.from(arguments)` case doesn't break the page, doesn't throw and isn't visible at a glance. You only catch it if you verify real behaviour. That's why verification was done through cookies and network, not through a tool that confirms what the main thread believes it sees.

The third is that documentary consistency is part of the work. The privacy policy already talked about a choice that didn't exist. Fixing that wasn't rewriting the text to match the code, but building the choice for real.

And the fourth, the more general one: consent isn't an accessory you bolt on at the end. It's a boundary that runs through the layout, the third-party scripts, the bundler configuration, the tests and the public copy. When it's treated as a cross-cutting layer rather than an isolated component, it stops being a debt and starts being a property of the system.

## References and related reading

The documentation and guides we used as a basis:

- [Guide on the use of cookies](https://www.aepd.es/guias/guia-cookies.pdf) — Spanish Data Protection Agency (AEPD), 2023 update.
- [Directive 2002/58/EC (ePrivacy)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32002L0058) — article 5.3.
- [General Data Protection Regulation (EU) 2016/679](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) — article 6.
- [Consent Mode (Google Analytics)](https://developers.google.com/tag-platform/security/guides/consent) — official documentation.
- [Partytown](https://partytown.builder.io/) — official project documentation.

Within the portfolio itself, this work sits alongside two other entries. The first is the [publication boundary between the private workspace and the public mirror](/en/devlog/2026-W39-portfolio-mirror-pipeline/), which explains how the site separates source and distribution. The second is the [article about the private GitHub Pages mirror](/en/blog/github-pages-private-repo-mirror/), which details the flow that synchronises this devlog's content to the public repository.

This devlog documents the period of 12 August 2026 and is published as part of the portfolio's historical audit.
