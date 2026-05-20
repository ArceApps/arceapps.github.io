# Delta for schema-plus-web-share

## ADDED Requirements

### Requirement: schema-article-jsonld

When a blog post or devlog entry is rendered with `type="article"`, the system SHALL render exactly one `<script type="application/ld+json">` block containing a valid Schema.org `Article` type with all required fields: `@context`, `@type`, `headline`, `description`, `image`, `datePublished`, `dateModified`, `url`, `author`, `publisher`, and `inLanguage`. The `BlogPosting` type from the existing Layout.astro implementation SHALL be replaced by `Article`.

#### Scenario: Valid Article page with all fields

- GIVEN a blog post page with `type="article"`, `title`, `description`, `image`, `publishDate`, and `lang`
- WHEN the page is rendered
- THEN a single `<script type="application/ld+json">` block is present in `<head>` with `@type: "Article"`
- AND `headline` matches the page title
- AND `description` matches the page description
- AND `image` is the absolute social image URL
- AND `datePublished` and `dateModified` are ISO 8601 strings
- AND `author` has `@type: "Person"` with correct name
- AND `publisher` has `@type: "Organization"` with ArceApps name and logo URL
- AND `inLanguage` matches the page lang
- AND all `<` characters in the JSON are escaped as `\u003C`

#### Scenario: Devlog post page renders Article JSON-LD

- GIVEN a devlog entry page with `type="article"`
- WHEN the page is rendered
- THEN the same `Article` JSON-LD structure is rendered in the `<head>`
- AND it uses the devlog entry's title, description, publishDate, and hero image

#### Scenario: Invalid JSON-LD graceful handling

- GIVEN the JSON.stringify or escape logic produces malformed output
- WHEN `pnpm build` runs
- THEN the build MUST NOT fail
- AND the rendered HTML contains a `<script type="application/ld+json">` block (even if content is empty or "{}")

---

### Requirement: schema-breadcrumb-jsonld

The system SHALL render a `BreadcrumbList` JSON-LD `<script type="application/ld+json">` block in the `<head>` of listing pages: blog index (`/blog` and `/es/blog`), apps index (`/apps` and `/es/apps`), and devlog index (`/devlog` and `/es/devlog`).

#### Scenario: Blog index page renders BreadcrumbList

- GIVEN the EN blog index page (`/blog`)
- WHEN the page is rendered
- THEN a `<script type="application/ld+json">` block contains `@type: "BreadcrumbList"`
- AND `itemListElement` contains two items: Home (/) and Blog (/blog)
- AND each item has `name` and `item` URL
- AND `position` starts at 1 and increments

#### Scenario: Spanish blog index renders Spanish breadcrumb names

- GIVEN the ES blog index page (`/es/blog`)
- WHEN the page is rendered
- THEN `itemListElement[0].name` is "Inicio" (not "Home")
- AND `itemListElement[1].name` is "Blog"

#### Scenario: Apps index page renders BreadcrumbList

- GIVEN the EN apps index page (`/apps`)
- WHEN the page is rendered
- THEN breadcrumb items are Home (/) → Apps (/apps)
- AND the same structure as blog index but with Apps names

#### Scenario: Devlog index page renders BreadcrumbList

- GIVEN the EN devlog index page (`/devlog`)
- WHEN the page is rendered
- THEN breadcrumb items are Home (/) → Devlog (/devlog)

#### Scenario: Multiple BreadcrumbList scripts avoided

- GIVEN a paginated listing page (e.g., `/blog/2`)
- WHEN the page is rendered
- THEN exactly ONE BreadcrumbList JSON-LD block exists
- AND it points to the base listing URL (/blog), not the pagination URL

---

### Requirement: schema-website-search

The system SHALL render a `WebSite` JSON-LD `<script type="application/ld+json">` block in `Layout.astro` that includes a `potentialAction` with `SearchAction` for the sitelinks search box. This block SHALL be rendered on every page.

#### Scenario: WebSite search action rendered on all pages

- GIVEN any page using Layout.astro (blog, apps, devlog, home, about)
- WHEN the page is rendered
- THEN exactly one `<script type="application/ld+json">` with `@type: "WebSite"` is present in `<head>`
- AND it contains `potentialAction` with `@type: "SearchAction"`
- AND `target` contains a URL template with `queryInput` parameter
- AND `queryInput` is set to `required name="search_term_string"`

#### Scenario: WebSite JSON-LD does not duplicate with page-specific JSON-LD

- GIVEN a blog post page that renders both `Article` and `WebSite` JSON-LD
- WHEN the page is rendered
- THEN there are TWO separate `<script type="application/ld+json">` blocks
- AND the `Article` block is for the article content
- AND the `WebSite` block is for site-wide search

---

### Requirement: web-share-api

The `SocialShare.astro` component SHALL feature-detect `navigator.share()` on mount. If available, it SHALL render a single "Share" button that calls `navigator.share({ title, url, text? })`. If unavailable, it SHALL render the existing Twitter/LinkedIn/WhatsApp fallback buttons. The component SHALL add `SocialShare` to devlog post pages.

#### Scenario: Mobile browser with Web Share API available

- GIVEN a mobile browser where `'share' in navigator` is true
- WHEN `SocialShare.astro` mounts with `url` and `title` props
- THEN exactly ONE share button is rendered (not the three social buttons)
- AND clicking it calls `navigator.share({ title, url })`
- AND the button has appropriate aria-label "Share this post"

#### Scenario: Desktop browser without Web Share API

- GIVEN a desktop browser where `'share' in navigator` is false
- WHEN `SocialShare.astro` mounts
- THEN three buttons are rendered: Twitter, LinkedIn, WhatsApp
- AND clicking each opens the respective sharing URL in a new tab
- AND no `navigator.share` call is attempted

#### Scenario: Share API call fails with fallback

- GIVEN a mobile browser where Web Share API is available but `navigator.share()` rejects (e.g., user cancels or share fails)
- WHEN the share call rejects with an error
- THEN the error MUST be caught (no unhandled promise rejection)
- AND the component MUST NOT crash or show an error state to the user
- AND the component remains interactive (share button still present)

#### Scenario: Share button text is language-sensitive

- GIVEN `SocialShare.astro` mounted on a Spanish page (`/es/blog/...`)
- WHEN rendered
- THEN the share button text reads "Compartir" (not "Share")
- AND the fallback buttons remain unchanged (icons + names)

#### Scenario: Devlog post pages include SocialShare

- GIVEN a devlog entry page at `/devlog/[slug]`
- WHEN rendered
- THEN `SocialShare.astro` is included in the article section
- AND the component receives the devlog entry's title and current page URL

---

## MODIFIED Requirements

### Requirement: social-share

The system MUST replace the existing `SocialShare.astro` component that renders hardcoded Twitter/LinkedIn/WhatsApp links with a component that first checks for `navigator.share()` support.
(Previously: Static social buttons always rendered regardless of platform)

#### Scenario: Feature detection determines rendering

- GIVEN `SocialShare.astro` with props `url` and `title`
- WHEN the component mounts in the browser
- THEN `'share' in navigator` is checked
- AND if true, a single native Share button is shown
- AND if false, the three social buttons are shown as fallback

---

## File Structure

```
src/
  layouts/
    Layout.astro                              # MODIFIED: Article replaces BlogPosting; add WebSite JSON-LD
  components/
    SocialShare.astro                          # MODIFIED: Web Share API + fallback logic
  pages/
    blog/
      [...page].astro                          # MODIFIED: add BreadcrumbList JSON-LD
    es/
      blog/
        [...page].astro                        # MODIFIED: add BreadcrumbList JSON-LD (ES)
    apps/
      index.astro                              # MODIFIED: add BreadcrumbList JSON-LD
    es/
      apps/
        index.astro                            # MODIFIED: add BreadcrumbList JSON-LD (ES)
    devlog/
      index.astro                              # MODIFIED: add BreadcrumbList JSON-LD
      [...slug].astro                          # MODIFIED: add SocialShare component
    es/
      devlog/
        index.astro                            # MODIFIED: add BreadcrumbList JSON-LD (ES)
        [...slug].astro                        # MODIFIED: add SocialShare component (ES)
openspec/
  changes/
    schema-plus-web-share/
      SPEC.md                                  # This file
      proposal.md                              # Already exists
      specs/
        schema-article-jsonld/
          spec.md                              # NEW
        schema-breadcrumb-jsonld/
          spec.md                              # NEW
        schema-website-search/
          spec.md                              # NEW
        web-share-api/
          spec.md                              # NEW
```

## Success Criteria

- [ ] Google Rich Results Test validates `Article` type on blog posts and devlog entries
- [ ] Google Rich Results Test validates `BreadcrumbList` on /blog, /apps, /devlog listing pages
- [ ] Google Rich Results Test validates `WebSite` with `potentialAction` on all pages
- [ ] Mobile Chrome/iOS Safari shows single Share button calling `navigator.share()`
- [ ] Desktop browsers show Twitter/LinkedIn/WhatsApp fallback buttons
- [ ] Failed `navigator.share()` call is caught, no error shown to user
- [ ] Share button text is localized (Share/Compartir)
- [ ] `pnpm build` succeeds with no errors
- [ ] Devlog post pages render SocialShare component