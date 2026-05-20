# Design: Schema.org JSON-LD + Web Share API

## Technical Approach

### Feature 1 — JSON-LD Structured Data
- **WebSite** block: Always injected in `Layout.astro` `<head>` — no per-page condition.
- **Article** block: Replaces `BlogPosting` in `Layout.astro` when `type="article"` — fields map 1:1 from existing props.
- **BreadcrumbList** block: Injected inline in each listing page `[...page].astro` / index pages; uses `Breadcrumbs.astro` data (already has structured markup).

No new files. Template-level injection only.

### Feature 2 — Web Share API
- Client-side mount detection in `SocialShare.astro` (`'share' in navigator`).
- If supported: render single "Share" button that calls `navigator.share({ title, url })`.
- If unsupported: render existing social icon buttons unchanged.
- `devlog/[...slug].astro` receives `<SocialShare>` below article content.
- No new dependencies.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| `WebSite` always rendered | Always inject in `Layout.astro` | Required for sitelinks search box regardless of page type |
| `Article` replaces `BlogPosting` | Upgrade existing conditional block | Google's preferred type for blog posts; existing props already cover required fields |
| BreadcrumbList injected inline | Per-page template injection | Listing pages already use `Breadcrumbs.astro`; JSON-LD can reuse same item structure |
| Single Share button vs. social icons | Single button when Web Share supported | Progressive enhancement — native share sheet replaces all icons on supporting browsers |
| SocialShare added to devlog post pages | Add component to `devlog/[...slug].astro` | Currently missing; parity with blog posts |

---

## Data Flow

### JSON-LD

```
Astro.props ──→ Layout.astro ──→ <head>:
  ├── WebSite JSON-LD (always)
  ├── Article JSON-LD (when type="article")
  └── Product JSON-LD (when isAppPage)

Breadcrumb items ──→ [page].astro ──→ inline <script type="application/ld+json">
```

### Web Share API

```
SocialShare.astro mount
  ├── navigator.share available? ──→ YES ──→ single "Share" button
  └── NO ──→ render Twitter/LinkedIn/WhatsApp buttons
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/layouts/Layout.astro` | Modify | Upgrade BlogPosting→Article; add WebSite JSON-LD |
| `src/components/SocialShare.astro` | Modify | Web Share API mount detection + fallback |
| `src/pages/blog/[...page].astro` | Modify | BreadcrumbList JSON-LD inline |
| `src/pages/es/blog/[...page].astro` | Modify | BreadcrumbList JSON-LD (ES) |
| `src/pages/apps/index.astro` | Modify | BreadcrumbList JSON-LD inline |
| `src/pages/es/apps/index.astro` | Modify | BreadcrumbList JSON-LD (ES) |
| `src/components/pages/DevlogIndexPage.astro` | Modify | BreadcrumbList JSON-LD inline |
| `src/components/pages/DevlogIndexPage.astro` | Modify | BreadcrumbList JSON-LD (ES, same file) |
| `src/pages/devlog/[...slug].astro` | Modify | Add SocialShare component |
| `src/pages/es/devlog/[...slug].astro` | Modify | Add SocialShare component (ES) |

---

## Key Code Structures

### Layout.astro — WebSite JSON-LD (new block)

```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ArceApps",
  url: "https://arceapps.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://arceapps.com/blog?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
}).replace(/</g, "\\u003C")} />
```

### Layout.astro — Article JSON-LD (upgrade BlogPosting → Article)

```astro
// Replace "@type": "BlogPosting" with "@type": "Article"
// Add dateModified (reuse datePublished for now; consider adding to props later)
```

### SocialShare.astro — Web Share API logic

```astro
---
// Frontmatter: same props (url, title)
// Client-side inline script handles mount detection
---

<!-- Share button shown when API available -->
<button id="web-share-btn" class="hidden ...">...</button>

<!-- Fallback buttons shown when API unavailable -->
<div id="social-share-fallback" class="...">
  {shareLinks.map(...)}
</div>

<script>
(function() {
  if ('share' in navigator) {
    document.getElementById('web-share-btn').classList.remove('hidden');
    document.getElementById('social-share-fallback').classList.add('hidden');
    document.getElementById('web-share-btn').addEventListener('click', () => {
      navigator.share({ title: document.title, url: location.href });
    });
  }
})();
</script>
```

### BreadcrumbList JSON-LD (inline in listing pages)

```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://arceapps.com" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://arceapps.com/blog" },
  ],
}).replace(/</g, "\\u003C")} />
```

---

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Build | No TypeScript/compile errors | `pnpm build` — verify success |
| JSON-LD syntax | Valid JSON, no HTML injection breaks | Manual: paste output of Google Rich Results Test |
| JSON-LD page coverage | All blog/devlog posts have Article; all index pages have BreadcrumbList | List pages to test: `/blog`, `/blog/page/2`, `/apps`, `/devlog`, `/es/*` variants |
| Web Share API | Browser supports navigator.share | Manual: Chrome DevTools mobile emulation, check share sheet appears |
| Desktop fallback | Non-supporting browsers show social buttons | Manual: desktop Chrome, verify buttons render |

---

## Migration / Rollout

No migration required. Both features are fully additive.

Rollback: remove `<script type="application/ld+json">` blocks (JSON-LD) or revert `SocialShare.astro` (Web Share API).

---

## Open Questions

- [ ] `dateModified` — reuse `publishDate` for now; consider adding `updatedDate` to blog/devlog frontmatter in a future change.
- [ ] Google Rich Results Test validation — run manually before merge; no automated test planned.