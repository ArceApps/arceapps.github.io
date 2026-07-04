# Infographics Update for OpenSpec and SDD Articles — Verification Plan

This file is the single source of truth for global acceptance criteria and final verification steps.

## Global Acceptance Criteria

1. **Asset Generation:**
   - [ ] All 10 PNG image files exist in `public/images/`.
   - [ ] All images have a resolution of 1200x630px (verified with `file` or other tools).
   - [ ] Background color is Slate-50 (`#F8FAFC`), not pure white or dark.
   - [ ] Accent colors are Teal (`#018786`) and Orange (`#FF9800`) representing the brand.
   - [ ] Text elements in the graphics are crisp, highly readable, and free of glaring spelling glitches.

2. **Localization Symmetry:**
   - [ ] English versions (`-en.png`) contain copy translated into English.
   - [ ] Spanish versions (`-es.png`) contain copy translated into Spanish.

3. **Frontmatter Metadata:**
   - [ ] Frontmatter parameter `heroImage` is updated in all 10 blog post markdown files.
   - [ ] Correct relative URLs (e.g. `"/images/blog-....png"`) are used.

4. **Repository Consistency:**
   - [ ] Old SVGs and placeholders remain in the repository to prevent broken links elsewhere.
   - [ ] Astro build passes successfully: `pnpm build`.
   - [ ] Commits follow Conventional Commits standard with no AI attribution.

---

## Verification Handoff Checklist

Run these validation commands and check off items before requesting merge:

### Automated Validation
- [ ] **Check files existence:**
  Run: `ls -la public/images/blog-openspec-mobile-development-*.png public/images/blog-sdd-agentic-*.png public/images/blog-superpowers-vs-openspec-*.png public/images/blog-sdd-frameworks-analysis-*.png public/images/blog-spec-kitty-mobile-development-*.png`
  Expected: All 10 files are listed.
- [ ] **Astro Build Test:**
  Run: `pnpm build`
  Expected: Successful compilation.

### Visual Verification
- [ ] Open the generated PNG images or run `pnpm preview` to visually verify their layout, readability, and look in the local dev server.
