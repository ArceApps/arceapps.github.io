# web-share-api Specification

## Purpose

Enhance SocialShare.astro to use the Web Share API on supporting browsers, with desktop fallback to existing Twitter/LinkedIn/WhatsApp buttons. Add SocialShare to devlog post pages.

## Requirements

### Requirement: Web Share API feature detection

On mount, the component SHALL check `'share' in navigator`. If true, render a single native Share button. If false, render the three social media fallback buttons.

#### Scenario: Mobile browser with Web Share API — single button

- GIVEN `SocialShare.astro` mounted with url="https://arceapps.com/blog/kotlin-flow" and title="Kotlin Flow Deep Dive" in Chrome on Android
- WHEN `'share' in navigator` is true
- THEN exactly ONE button labeled "Share" (or localized equivalent) is rendered
- AND no Twitter/LinkedIn/WhatsApp buttons are shown
- AND clicking the button calls `navigator.share({ title: "Kotlin Flow Deep Dive", url: "https://arceapps.com/blog/kotlin-flow" })`

#### Scenario: Desktop browser fallback — three buttons

- GIVEN `SocialShare.astro` mounted on a desktop browser
- WHEN `'share' in navigator` is false (or undefined)
- THEN three buttons are rendered: Twitter (X), LinkedIn, WhatsApp
- AND each button has the correct sharing URL
- AND clicking opens the URL in a new tab with `rel="noopener noreferrer"`

#### Scenario: Share API call fails — error caught gracefully

- GIVEN a mobile browser where `navigator.share()` is available but the call rejects (user cancels share sheet, or share fails)
- WHEN the share promise rejects
- THEN the error is caught with `.catch()` or try/catch
- AND no error message is displayed to the user
- AND the component remains fully functional
- AND no JavaScript error propagates to the console as an unhandled rejection

#### Scenario: Share button text is language-sensitive

- GIVEN `SocialShare.astro` mounted on a Spanish page (`/es/blog/...`)
- WHEN rendered with Web Share API available
- THEN the share button text reads "Compartir" (from i18n/ui.ts 'common.share' key)
- AND fallback button labels remain the same (Twitter, LinkedIn, WhatsApp)

### Requirement: SocialShare added to devlog post pages

The system SHALL include `SocialShare.astro` in devlog post pages at `/devlog/[slug]` and `/es/devlog/[slug]`.

#### Scenario: EN devlog post renders SocialShare

- GIVEN a devlog entry at `/devlog/my-devlog-entry`
- WHEN the page is rendered
- THEN `SocialShare.astro` is present in the article section
- AND it receives `url` = the devlog entry's canonical URL
- AND it receives `title` = the devlog entry's title

#### Scenario: ES devlog post renders SocialShare with Spanish text

- GIVEN a devlog entry at `/es/devlog/mi-entrada`
- WHEN the page is rendered
- THEN `SocialShare.astro` is present with Spanish labels
- AND share text (if any) uses Spanish

---

## File Structure

- `src/components/SocialShare.astro` — MODIFIED: Web Share API + fallback logic
- `src/pages/devlog/[...slug].astro` — MODIFIED: add SocialShare component
- `src/pages/es/devlog/[...slug].astro` — MODIFIED: add SocialShare component (ES)

## Success Criteria

- Mobile Chrome/Android shows single Share button calling `navigator.share()`
- iOS Safari shows single Share button calling `navigator.share()`
- Desktop browsers show three fallback buttons
- Failed `navigator.share()` call is caught, no user-visible error
- Share button text is localized (Share/Compartir)
- Devlog post pages include SocialShare component
- `pnpm build` succeeds without errors