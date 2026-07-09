# Desktop AI Agents Grand Final Task List

## Task 1: Setup and Git Branching

**Files:**
- Create: Feature branch `feature/arceapps.github.io_desktop-ai-grand-final`

**Acceptance for this task:**
- [x] Active Git branch is `feature/arceapps.github.io_desktop-ai-grand-final`

**Steps:**
- [x] **Step 1: Create and switch to new branch**
  Run: `git checkout -b feature/arceapps.github.io_desktop-ai-grand-final`
  Expected: Switched to a new branch 'feature/arceapps.github.io_desktop-ai-grand-final'

---

## Task 2: Hero Image Creation

**Files:**
- Create: `public/images/desktop-ai-grand-final.svg`

**Acceptance for this task:**
- [x] SVG file is created at 1200x630px using brand colors `#018786` and `#FF9800` on background `#0F172A`.

**Steps:**
- [x] **Step 1: Write the minimal geometric SVG file**
  Create `public/images/desktop-ai-grand-final.svg` with high-quality SVG content.
- [x] **Step 2: Commit image**
  Run:
  ```bash
  git add public/images/desktop-ai-grand-final.svg
  git commit -m "feat(assets): add desktop-ai-grand-final hero image SVG"
  ```

---

## Task 3: Spanish Article Redaction

**Files:**
- Create: `src/content/blog/es/desktop-ai-grand-final.md`

**Acceptance for this task:**
- [ ] File has at least 8000 words in Spanish.
- [ ] Follows Scribe identity and "Espíritu Indie" tone.
- [ ] Fully documents all 10 benchmark tasks and 19 categories.
- [ ] Uses the exact scorecard and veredict defined in the PRD.

**Steps:**
- [ ] **Step 1: Draft the frontmatter and introduction**
  Add required Astro metadata with today's date `2026-07-09`.
- [ ] **Step 2: Write the 10 benchmark tasks sections**
  Add deep-dive technical descriptions with code snippets and token/cost metrics for each of the 10 tasks.
- [ ] **Step 3: Write the 19 comparison categories**
  Write detailed comparisons of Codex App, Antigravity, OpenCode Desktop, and Hermes Desktop for each category.
- [ ] **Step 4: Include the scorecard and veredict**
  Generate the markdown table and the award classifications as defined.
- [ ] **Step 5: Write the bibliography and references**
  Add references and related posts links.
- [ ] **Step 6: Commit Spanish article**
  Run:
  ```bash
  git add src/content/blog/es/desktop-ai-grand-final.md
  git commit -m "feat(blog): add desktop-ai-grand-final Spanish article"
  ```

---

## Task 4: English Article Redaction

**Files:**
- Create: `src/content/blog/en/desktop-ai-grand-final.md`

**Acceptance for this task:**
- [ ] File has at least 8000 words in English.
- [ ] Symmetrical in quality and technical depth to the Spanish version.

**Steps:**
- [ ] **Step 1: Draft frontmatter and translate/adapt the text into English**
  Maintain proper English slugs, links, and tone.
- [ ] **Step 2: Commit English article**
  Run:
  ```bash
  git add src/content/blog/en/desktop-ai-grand-final.md
  git commit -m "feat(blog): add desktop-ai-grand-final English article"
  ```

---

## Task 5: SEO Validation

**Files:**
- Modify: `src/content/blog/es/desktop-ai-grand-final.md`
- Modify: `src/content/blog/en/desktop-ai-grand-final.md`

**Acceptance for this task:**
- [ ] Both files pass the `/write-blog-seo` audit with Status: PASS.

**Steps:**
- [ ] **Step 1: Run SEO audit for Spanish article**
  Validate the frontmatter length, slug structure, and keywords.
- [ ] **Step 2: Run SEO audit for English article**
  Validate English metadata.
- [ ] **Step 3: Commit any SEO fixes**
  Run:
  ```bash
  git add src/content/blog/es/desktop-ai-grand-final.md src/content/blog/en/desktop-ai-grand-final.md
  git commit -m "fix(seo): adjust metadata for desktop-ai-grand-final"
  ```

---

## Task 6: Production Build & Verification

**Files:**
- Run build tool and inspect console.

**Acceptance for this task:**
- [ ] `pnpm build` completes successfully.
- [ ] Word counts verified to be >= 8000 words per file.

**Steps:**
- [ ] **Step 1: Run production build**
  Run: `pnpm build`
  Expected: Successful Astro build.
- [ ] **Step 2: Verify word counts**
  Run: `wc -w src/content/blog/es/desktop-ai-grand-final.md src/content/blog/en/desktop-ai-grand-final.md`
  Expected: Both files >= 8000 words.

---

## Task 7: Log Activity (Bitácora)

**Files:**
- Modify/Create: `agents/bitacora/Scribe_bitacora.md`

**Acceptance for this task:**
- [ ] Log entry is recorded with today's date `2026-07-09`.

**Steps:**
- [ ] **Step 1: Append log entry to Scribe's bitácora**
- [ ] **Step 2: Commit bitácora changes**
  Run:
  ```bash
  git add agents/bitacora/Scribe_bitacora.md
  git commit -m "docs(scribe): log desktop-ai-grand-final publication in bitacora"
  ```
