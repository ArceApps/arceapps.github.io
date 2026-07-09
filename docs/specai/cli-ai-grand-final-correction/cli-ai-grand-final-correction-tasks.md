# AI CLI Grand Final Finalists Correction Task List

## Task 1: Rewrite Spanish Article Content

**Files:**
- Modify: [es/cli-ai-grand-final.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/es/cli-ai-grand-final.md)

**Acceptance for this task:**
- [ ] Spanish article references Cline (instead of OpenCode) and Antigravity CLI (instead of Trae CLI).
- [ ] Swapped content matches their actual characteristics (Cline = open source, BYOK, OpenRouter, TUI; Antigravity = Google, Gemini 3.5 Pro, 2M context, gcloud).
- [ ] Mermaid diagram and SVG chart updated.

**Steps:**
- [ ] **Step 1: Replace OpenCode section with Cline**
  Update title, installer, backend, architecture description, and scoring.
- [ ] **Step 2: Replace Trae CLI section with Antigravity CLI**
  Update title, installer, backend, architecture description, and scoring.
- [ ] **Step 3: Update Head-to-Head section**
  Update "OpenCode vs Aider" to "Cline vs Aider" and "Claude Code vs Trae CLI" to "Claude Code vs Antigravity CLI".
- [ ] **Step 4: Update Scorecard, Mermaid diagram, SVG chart, and Champion comparison**
  Replace OpenCode -> Cline, Trae CLI -> Antigravity CLI in all final comparisons, tables, and graphic elements.
- [ ] **Step 5: Commit Spanish corrections**
  ```bash
  git add src/content/blog/es/cli-ai-grand-final.md
  git commit -m "fix(blog/es): swap finalists to Cline and Antigravity CLI"
  ```

---

## Task 2: Rewrite English Article Content

**Files:**
- Modify: [en/cli-ai-grand-final.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/en/cli-ai-grand-final.md)

**Acceptance for this task:**
- [ ] English article references Cline and Antigravity CLI with updated details.
- [ ] Mermaid and SVG charts updated.

**Steps:**
- [ ] **Step 1: Replace OpenCode section with Cline**
- [ ] **Step 2: Replace Trae CLI section with Antigravity CLI**
- [ ] **Step 3: Update Head-to-Head section**
- [ ] **Step 4: Update Scorecard, diagrams, and Champion comparison**
- [ ] **Step 5: Commit English corrections**
  ```bash
  git add src/content/blog/en/cli-ai-grand-final.md
  git commit -m "fix(blog/en): swap finalists to Cline and Antigravity CLI"
  ```

---

## Task 3: Verification

**Files:**
- Run build tool and inspect terminal output.

**Acceptance for this task:**
- [ ] `pnpm build` completes successfully.
- [ ] Both articles have at least 5000 words.

**Steps:**
- [ ] **Step 1: Run production build**
  ```bash
  pnpm build
  ```
- [ ] **Step 2: Verify word counts**
  Verify with `wc -w`.
