# Tasks: schema-plus-web-share

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Layout.astro — JSON-LD Upgrades

- [ ] 1.1 In `src/layouts/Layout.astro`, replace `@type: "BlogPosting"` with `@type: "Article"` in the conditional JSON-LD block (line ~167)
- [ ] 1.2 Add `WebSite + SearchAction` JSON-LD block in `<head>` of `Layout.astro`, always rendered (before the conditional block)
- [ ] 1.3 Verify both JSON-LD blocks use `.replace(/</g, "\\u003C")` for `<` escaping

## Phase 2: SocialShare.astro — Web Share API

- [ ] 2.1 Add `lang?: 'en' | 'es'` prop to `SocialShare.astro` interface
- [ ] 2.2 Refactor SocialShare to conditionally render: if `'share' in navigator`, show single Share button; else show Twitter/LinkedIn/WhatsApp fallback buttons
- [ ] 2.3 Wrap `navigator.share()` call in try/catch to gracefully handle rejection/cancellation
- [ ] 2.4 Add language-sensitive aria-label ("Share this post" EN / "Compartir esta entrada" ES) to the Share button
- [ ] 2.5 Ensure both button sets are accessible (keyboard nav, focus states)

## Phase 3: Listing Pages — BreadcrumbList JSON-LD

- [ ] 3.1 In `src/pages/blog/[...page].astro`, add BreadcrumbList JSON-LD inline `<script>` block with Home + Blog items (EN labels)
- [ ] 3.2 In `src/pages/es/blog/[...page].astro`, add same BreadcrumbList with ES labels ("Inicio", "Blog")
- [ ] 3.3 In `src/pages/apps/index.astro`, add BreadcrumbList JSON-LD with Home + Apps items (EN)
- [ ] 3.4 In `src/pages/es/apps/index.astro`, add BreadcrumbList JSON-LD with ES labels ("Inicio", "Apps")
- [ ] 3.5 In `src/components/pages/DevlogIndexPage.astro`, add BreadcrumbList JSON-LD inside `<Layout>` (both EN/ES handled via `lang` prop): Home + Devlog/Devlog ES

## Phase 4: Devlog Post Pages — SocialShare Integration

- [ ] 4.1 Import and add `<SocialShare>` to `src/pages/devlog/[...slug].astro` below article content (pass `url`, `title`, `lang="en"`)
- [ ] 4.2 Import and add `<SocialShare>` to `src/pages/es/devlog/[...slug].astro` (pass `lang="es"`)

## Phase 5: Verification

- [ ] 5.1 Run `pnpm build` — verify no errors
- [ ] 5.2 Inspect rendered HTML for a blog post: Article JSON-LD present, WebSite JSON-LD present, no duplicate BreadcrumbList
- [ ] 5.3 Inspect `/blog`, `/apps`, `/devlog` (EN+ES) — BreadcrumbList JSON-LD present with correct itemListElement

## Effort Summary

| Feature | Tasks | Focus |
|---------|-------|-------|
| JSON-LD (Layout.astro + listing pages) | 8 | Schema.org structured data |
| Web Share API (SocialShare.astro + devlog pages) | 6 | Progressive enhancement |
| **Total** | **14** | |