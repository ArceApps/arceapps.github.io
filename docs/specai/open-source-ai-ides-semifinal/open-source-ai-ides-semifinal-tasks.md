# Open Source AI IDEs Semifinal Task List

## Task 1: Research and Information Gathering (Fase 1) [x]

**Files:**
- Create: `docs/specai/open-source-ai-ides-semifinal/research-report.md` (Temporary research report)

**Acceptance for this task:**
- [x] Detailed summaries for the 10 tools: OpenCode Desktop, Hermes Desktop, Continue, Cline, Roo Code, Aider, Void IDE, PearAI, Zed AI, Augment Code.
- [x] List of technical features, MCP support, memory capabilities, and terminal integrations.
- [x] Bibliography with verified URLs for all tools.
- [x] List of related articles in the blog to link to (e.g. `opencode-subagents`, `loop-engineering-desarrollo-movil`, etc.).

**Steps:**
- [x] **Step 1: Delegate research to research subagent**
  Launch the research subagent to gather deep technical documentation, URLs, and insights for the 10 tools, and search existing articles for linking.
- [x] **Step 2: Save the research report**
  Compile the results into `docs/specai/open-source-ai-ides-semifinal/research-report.md`.

---

## Task 2: Create Spanish Semifinal Article [x]

**Files:**
- Create: `src/content/blog/es/open-source-ai-ides-semifinal.md`

**Acceptance for this task:**
- [x] Article is written in Spanish (indie creator tone, voseo when referring to the reader, but matching the persona scope constraints).
- [x] Frontmatter matches the Astro Zod schema (`title`, `description`, `pubDate`, `lastmod`, `keywords`, `canonical`, `heroImage`, `tags`, `reference_id`).
- [x] Content exceeds 1500 words and follows the structure: Gancho, Contexto, Deep Dive (evaluating 10 tools), Lecciones Aprendidas, Bibliografía, Cierre.
- [x] Enlaces to existing related posts in the blog (e.g., `opencode-subagents` or other articles discovered).

**Steps:**
- [x] **Step 1: Write the article in Spanish**
  Create `src/content/blog/es/open-source-ai-ides-semifinal.md` using the research report.
- [x] **Step 2: Generate reference_id**
  Generate a unique UUID v4 and assign it to the `reference_id` field in the frontmatter.

---

## Task 3: Create English Semifinal Article [x]

**Files:**
- Create: `src/content/blog/en/open-source-ai-ides-semifinal.md`

**Acceptance for this task:**
- [x] English version is a symmetrical translation of the Spanish version (indie creator tone, natural English).
- [x] Frontmatter matches the Zod schema and uses the exact same `reference_id`, `pubDate`, `lastmod`, and slug.
- [x] Content exceeds 1500 words and follows the identical narrative structure.

**Steps:**
- [x] **Step 1: Translate and write the article in English**
  Create `src/content/blog/en/open-source-ai-ides-semifinal.md`.

---

## Task 4: Generate SVG Cover Image

**Files:**
- Create: `public/images/open-source-ai-ides-semifinal.svg`

**Acceptance for this task:**
- [ ] File exists at `public/images/open-source-ai-ides-semifinal.svg`.
- [ ] Valid geometric minimal SVG with 1200x630px dimensions.
- [ ] Employs primary teal (`#018786`), secondary orange (`#FF9800`), and dark slate (`#0F172A`) for styling.

**Steps:**
- [ ] **Step 1: Create the SVG file**
  Write the SVG XML code to `public/images/open-source-ai-ides-semifinal.svg`.

---

## Task 5: SEO Audit & Verification

**Files:**
- Run build tool and count words.

**Acceptance for this task:**
- [ ] SEO audit check passes:
  - Title ≤ 60 chars.
  - Tool/subject name in the first 5 words of title.
  - Description 120-160 chars.
  - Keywords array size is 3 to 8.
- [ ] `pnpm build` runs successfully.
- [ ] Word counts for both articles are verified to be above 1500 words.

**Steps:**
- [ ] **Step 1: Run SEO validation script/checks**
  Double check all metadata constraints.
- [ ] **Step 2: Run production build**
  ```bash
  pnpm build
  ```
- [ ] **Step 3: Verify word counts**
  Run `wc -w` on both markdown files.
- [ ] **Step 4: Commit changes**
  ```bash
  git add docs/specai/open-source-ai-ides-semifinal/ src/content/blog/ public/images/
  git commit -m "feat(blog): add open source AI IDEs semifinal articles (ES + EN) and cover image"
  ```
