# schema-website-search Specification

## Purpose

Add Schema.org `WebSite` JSON-LD with `potentialAction` (SearchAction) to Layout.astro for Google sitelinks search box Rich Result.

## Requirements

### Requirement: WebSite JSON-LD rendered on every page

The system SHALL render a `WebSite` JSON-LD `<script type="application/ld+json">` block in `Layout.astro` on every page. This is independent of page type.

#### Scenario: WebSite search action present on home page

- GIVEN the home page using Layout.astro
- WHEN rendered
- THEN one `<script type="application/ld+json">` exists with `@type: "WebSite"`
- AND `name` = "ArceApps"
- AND `url` = "https://arceapps.com/"
- AND `potentialAction` object has `@type: "SearchAction"`
- AND `target` contains a URL template like "https://arceapps.com/search?q={search_term_string}"
- AND `queryInput` = "required name=search_term_string"

#### Scenario: WebSite JSON-LD present alongside Article JSON-LD

- GIVEN a blog post page that renders both Article and WebSite JSON-LD
- WHEN rendered
- THEN there are TWO separate `<script type="application/ld+json">` blocks
- AND one has `@type: "Article"` (per-article data)
- AND one has `@type: "WebSite"` (site-wide)

#### Scenario: No duplicate WebSite blocks

- GIVEN any page using Layout.astro
- WHEN rendered
- THEN exactly ONE WebSite JSON-LD block is present
- AND it appears only once in the `<head>`

---

## File Structure

- `src/layouts/Layout.astro` — MODIFIED: add WebSite JSON-LD script block

## Success Criteria

- Google Rich Results Test validates `WebSite` with `potentialAction` on home page
- `WebSite` JSON-LD appears on all page types (home, blog, apps, devlog, about)
- No duplicate WebSite blocks on any page
- `pnpm build` succeeds without errors