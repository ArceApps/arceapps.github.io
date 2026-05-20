# schema-article-jsonld Specification

## Purpose

Extend Layout.astro to emit Schema.org `Article` structured data (replacing `BlogPosting`) for blog and devlog post pages, enabling Google Rich Results for articles.

## Requirements

### Requirement: Article JSON-LD replaces BlogPosting

When a page is rendered with `type="article"`, the system SHALL emit exactly one `<script type="application/ld+json">` block in `<head>` with `@type: "Article"` (not `BlogPosting`). All required Schema.org `Article` fields MUST be present: `@context`, `@type`, `headline`, `description`, `image`, `datePublished`, `dateModified`, `url`, `author`, `publisher`, `inLanguage`.

#### Scenario: Blog post renders Article JSON-LD

- GIVEN a blog post page with `type="article"`, title="Kotlin Flow Deep Dive", description="A deep dive into Kotlin Flow", image="/images/blog/kotlin-flow.png", publishDate=2025-01-15, lang="en"
- WHEN the page is rendered
- THEN one `<script type="application/ld+json">` exists with `@type: "Article"`
- AND `headline` = "Kotlin Flow Deep Dive"
- AND `description` = "A deep dive into Kotlin Flow"
- AND `image` is the absolute URL to the image
- AND `datePublished` and `dateModified` are ISO 8601 (e.g., "2025-01-15T00:00:00.000Z")
- AND `author` object has `@type: "Person"` and `name: "ArceApps"`
- AND `publisher` object has `@type: "Organization"`, `name: "ArceApps"`, and logo with `url: "https://arceapps.com/logo.png"`
- AND `inLanguage` = "en"

#### Scenario: Devlog entry renders Article JSON-LD

- GIVEN a devlog entry page at `/devlog/my-entry` with `type="article"`
- WHEN rendered
- THEN the same `Article` JSON-LD structure is emitted
- AND it uses the devlog entry's title, description, publishDate, and hero image

#### Scenario: JSON-LD escape for HTML safety

- GIVEN any content containing `<` characters in title or description
- WHEN the JSON is stringified
- THEN all `<` are escaped as `\u003C` (not `<`)
- AND the `<script>` tag remains valid HTML

#### Scenario: Build succeeds with JSON-LD

- GIVEN the modified Layout.astro
- WHEN `pnpm build` runs
- THEN the build completes with no errors
- AND the output HTML contains the JSON-LD script blocks

### Requirement: Invalid JSON-LD graceful handling

The system SHALL ensure that malformed JSON-LD does not break the build. If the JSON.stringify produces invalid output, the build MUST NOT fail.

#### Scenario: Empty publishDate handled gracefully

- GIVEN a blog post page where `publishDate` is undefined
- WHEN rendered
- THEN `datePublished` and `dateModified` are omitted from the JSON-LD (not null or "null")
- AND no JS error is thrown

---

## File Structure

- `src/layouts/Layout.astro` — MODIFIED: `BlogPosting` → `Article`, add `WebSite` JSON-LD

## Success Criteria

- Google Rich Results Test shows `Article` type for blog posts and devlog entries
- `pnpm build` succeeds without errors
- JSON-LD script block is present in `<head>` on article pages