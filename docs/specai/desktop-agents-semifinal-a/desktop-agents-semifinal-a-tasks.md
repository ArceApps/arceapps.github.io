# Task List: Desktop AI Agents Semifinal A

## Task 1: Setup Feature Branch [x]

**Files:**
*   None (Git Command)

**Acceptance for this task:**
*   [x] Checked out feature branch `feature/arceapps_desktop-agents-semifinal-a`

**Steps:**
*   [x] **Step 1: Check out feature branch**
    ```bash
    git checkout -b feature/arceapps_desktop-agents-semifinal-a
    ```

---

## Task 2: Delete Obsolete Articles and Images [x]

**Files:**
*   Delete: `src/content/blog/es/ai-ide-closed-ecosystem.md`
*   Delete: `src/content/blog/es/ai-ide-open-ecosystem.md`
*   Delete: `src/content/blog/es/ai-ide-tournament-grand-final.md`
*   Delete: `src/content/blog/en/ai-ide-closed-ecosystem.md`
*   Delete: `src/content/blog/en/ai-ide-open-ecosystem.md`
*   Delete: `src/content/blog/en/ai-ide-tournament-grand-final.md`
*   Delete: `public/images/ai-ide-closed-ecosystem-semifinal.svg`
*   Delete: `public/images/ai-ide-open-ecosystem-semifinal.svg`
*   Delete: `public/images/ai-ide-tournament-grand-final.svg`

**Acceptance for this task:**
*   [x] Verification that all 9 files are deleted from the working tree.

**Steps:**
*   [x] **Step 1: Delete files and commit deletion**
    ```bash
    rm -f src/content/blog/es/ai-ide-closed-ecosystem.md src/content/blog/es/ai-ide-open-ecosystem.md src/content/blog/es/ai-ide-tournament-grand-final.md src/content/blog/en/ai-ide-closed-ecosystem.md src/content/blog/en/ai-ide-open-ecosystem.md src/content/blog/en/ai-ide-tournament-grand-final.md public/images/ai-ide-closed-ecosystem-semifinal.svg public/images/ai-ide-open-ecosystem-semifinal.svg public/images/ai-ide-tournament-grand-final.svg
    git commit -am "style: delete obsolete desktop ide articles and images"
    ```

---

## Task 3: Create Spanish Article [x]

**Files:**
*   Create: `src/content/blog/es/desktop-ai-agents-semifinal-a.md`

**Acceptance for this task:**
*   [x] Article has 5000+ words in Spanish.
*   [x] Tono indie, no corporate jargon.
*   [x] Frontmatter validates with title length ≤ 60 and description 120-160 characters.

**Steps:**
*   [x] **Step 1: Write the article file** with the 10 competitors, Scribe tone, and CLI tournament links.
*   [x] **Step 2: Verify word count (ES)**
    ```bash
    wc -w src/content/blog/es/desktop-ai-agents-semifinal-a.md
    ```
    *Expected output:* `> 5000`

---

## Task 4: Create English Article [x]

**Files:**
*   Create: `src/content/blog/en/desktop-ai-agents-semifinal-a.md`

**Acceptance for this task:**
*   [x] Article has 5000+ words in English.
*   [x] Symmetrical with Spanish version.
*   [x] SEO tags correctly set.

**Steps:**
*   [x] **Step 1: Write the article file** in English with symmetric sections and content.
*   [x] **Step 2: Verify word count (EN)**
    ```bash
    wc -w src/content/blog/en/desktop-ai-agents-semifinal-a.md
    ```
    *Expected output:* `> 5000`

---

## Task 5: Generate Cover SVG [x]

**Files:**
*   Create: `public/images/desktop-ai-agents-semifinal-a.svg`

**Acceptance for this task:**
*   [x] File exists and contains valid 1200x630 SVG with Teal `#018786` and Orange `#FF9800` colors.

**Steps:**
*   [x] **Step 1: Write the SVG content** to `public/images/desktop-ai-agents-semifinal-a.svg`.

---

## Task 6: Audit and Build [x]

**Files:**
*   None (Build Command)

**Acceptance for this task:**
*   [x] `pnpm build` succeeds without warnings or Zod schema validation errors.

**Steps:**
*   [x] **Step 1: Run production build**
    ```bash
    pnpm build
    ```
*   [x] **Step 2: Commit all changes**
    ```bash
    git add .
    git commit -m "feat: publish desktop ai agents semifinal a"
    ```
