# Proposal: Schema.org JSON-LD + Web Share API

## Intent

Two independent SEO and sharing enhancements: (1) extend existing JSON-LD to Schema.org `Article` + `BreadcrumbList` + `WebSite` types for Google Rich Results; (2) replace hardcoded social buttons with `navigator.share()` + desktop fallback. Both serve the indie dev brand — privacy-respecting, zero-dependency, minimal.

## Scope

### In Scope
- Add `<script type="application/ld+json">` for `Article` on blog/devlog post pages (replacing current `BlogPosting`)
- Add `BreadcrumbList` JSON-LD to blog/apps/devlog index pages (inline in existing `[...page].astro` files)
- Add `WebSite` + `潜在searchAction` JSON-LD in `Layout.astro` for sitelinks search box
- Replace `SocialShare.astro` hardcoded links with `navigator.share()` feature detection
- Desktop fallback: preserve custom Twitter/LinkedIn/WhatsApp buttons when `navigator.share` is unavailable
- Spanish versions of all pages

### Out of Scope
- Server-side rendering changes
- New testing infrastructure
- Changes to content frontmatter schema
- OpenSearch/SEO beyond Google Rich Results

## Capabilities

### New Capabilities
- `schema-article-jsonld`: Structured data for blog/devlog posts (Google `Article` type)
- `schema-breadcrumb-jsonld`: Breadcrumb structured data for listing pages
- `schema-website-search`: WebSite search action for sitelinks search box
- `web-share-api`: Native share button with desktop fallback

### Modified Capabilities
- `social-share`: Replace link-based sharing with Web Share API

## Approach

### JSON-LD
- `Layout.astro` already renders `BlogPosting` for `type="article"`. Extend to render `Article` type (Google prefers `Article` over `BlogPosting` for blog posts).
- Create `BreadcrumbList` JSON-LD in page-level `[...page].astro` files where `Breadcrumbs.astro` is used (blog index, apps index, devlog index). Pass breadcrumb items to Layout or render inline.
- Add `WebSite` + `潜在searchAction` to `Layout.astro` as a separate `<script type="application/ld+json">` block (always rendered).
- JSON-LD injection is pure template work, no new files.

### Web Share API
- `SocialShare.astro`: On mount, check `'share' in navigator`. If true, replace buttons with a single "Share" button calling `navigator.share({ title, url })`. Hide fallback buttons.
- If `navigator.share` unavailable, render existing social buttons as-is (no changes needed for fallback path).
- No new dependencies — pure browser API.
- `devlog/[...slug].astro` lacks `SocialShare` — add it.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/layouts/Layout.astro` | Modified | `WebSite` JSON-LD; upgrade `BlogPosting` → `Article` |
| `src/components/SocialShare.astro` | Modified | Web Share API + fallback logic |
| `src/pages/blog/[...page].astro` | Modified | `BreadcrumbList` JSON-LD |
| `src/pages/es/blog/[...page].astro` | Modified | `BreadcrumbList` JSON-LD (ES) |
| `src/pages/apps/index.astro` | Modified | `BreadcrumbList` JSON-LD |
| `src/pages/es/apps/index.astro` | Modified | `BreadcrumbList` JSON-LD (ES) |
| `src/pages/devlog/index.astro` | Modified | `BreadcrumbList` JSON-LD |
| `src/pages/es/devlog/index.astro` | Modified | `BreadcrumbList` JSON-LD (ES) |
| `src/pages/devlog/[...slug].astro` | Modified | Add `SocialShare` component |
| `src/pages/es/devlog/[...slug].astro` | Modified | Add `SocialShare` component (ES) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Invalid JSON-LD syntax breaks Rich Results | Low | Validate with Google Rich Results Test before merge |
| `navigator.share` fails silently on some mobile browsers | Low | Feature-detect; fallback always visible |
| Duplicate JSON-LD if multiple scripts of same type | Medium | Ensure only one `WebSite` block in Layout; one `Article` per page |

## Rollback Plan

- **JSON-LD**: Remove the injected `<script>` blocks from `Layout.astro` and page files. Previous metadata only.
- **Web Share API**: Revert `SocialShare.astro` to previous hardcoded version. `SocialShare` usage on devlog pages can be removed if the component is not desired there.

## Dependencies

- None. Both features use built-in browser APIs or template injection.

## Success Criteria

- [ ] Google Rich Results Test shows `Article` for blog posts and `BreadcrumbList` for listing pages
- [ ] `navigator.share` works on mobile (Android Chrome, iOS Safari)
- [ ] Desktop fallback renders existing social buttons when Web Share API unavailable
- [ ] `pnpm build` succeeds with no errors