# schema-breadcrumb-jsonld Specification

## Purpose

Emit Schema.org `BreadcrumbList` JSON-LD on listing pages (blog index, apps index, devlog index) for both EN and ES locales, enabling Google Rich Results breadcrumb display.

## Requirements

### Requirement: BreadcrumbList JSON-LD on listing pages

The system SHALL render a `BreadcrumbList` JSON-LD `<script type="application/ld+json">` block in the `<head>` of:
- `/blog` and `/es/blog`
- `/apps` and `/es/apps`
- `/devlog` and `/es/devlog`

#### Scenario: EN blog index renders BreadcrumbList

- GIVEN the EN blog index page at `/blog`
- WHEN rendered
- THEN one `<script type="application/ld+json">` exists with `@type: "BreadcrumbList"`
- AND `itemListElement` has exactly 2 items:
  - position 1: name="Home", item="https://arceapps.com/"
  - position 2: name="Blog", item="https://arceapps.com/blog"

#### Scenario: ES blog index renders localized breadcrumb names

- GIVEN the ES blog index page at `/es/blog`
- WHEN rendered
- THEN `itemListElement[0].name` = "Inicio"
- AND `itemListElement[1].name` = "Blog"
- AND URLs are the `/es/` prefixed versions

#### Scenario: Apps index renders correct BreadcrumbList

- GIVEN the EN apps index at `/apps`
- WHEN rendered
- THEN breadcrumb items are: Home (/) → Apps (/apps)
- AND same structure as blog index

#### Scenario: Devlog index renders correct BreadcrumbList

- GIVEN the EN devlog index at `/devlog`
- WHEN rendered
- THEN breadcrumb items are: Home (/) → Devlog (/devlog)

#### Scenario: Pagination does not add extra BreadcrumbList

- GIVEN a paginated page like `/blog/2`
- WHEN rendered
- THEN exactly ONE BreadcrumbList JSON-LD block exists
- AND it references the base `/blog` URL (not `/blog/2`)

---

## File Structure

- `src/pages/blog/[...page].astro` — MODIFIED: add BreadcrumbList JSON-LD
- `src/pages/es/blog/[...page].astro` — MODIFIED: add BreadcrumbList JSON-LD (ES)
- `src/pages/apps/index.astro` — MODIFIED: add BreadcrumbList JSON-LD
- `src/pages/es/apps/index.astro` — MODIFIED: add BreadcrumbList JSON-LD (ES)
- `src/pages/devlog/index.astro` — MODIFIED: add BreadcrumbList JSON-LD
- `src/pages/es/devlog/index.astro` — MODIFIED: add BreadcrumbList JSON-LD (ES)

## Success Criteria

- Google Rich Results Test validates `BreadcrumbList` on all 6 listing pages
- `pnpm build` succeeds without errors
- Each listing page has exactly one BreadcrumbList JSON-LD block