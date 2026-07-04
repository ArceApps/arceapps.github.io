# Infographics Update for OpenSpec and SDD Articles — Task List

> **For agentic workers:** Read this file once, then dispatch one implementer per task with minimal context.
> Tasks are atomic. Do not bundle tasks. Do not skip the order.

## Task 1: OpenSpec Workflow Infographics

**Files:**
- Create: `public/images/blog-openspec-mobile-development-es.png`
- Create: `public/images/blog-openspec-mobile-development-en.png`
- Modify: `src/content/blog/es/openspec-desarrollo-movil.md`
- Modify: `src/content/blog/en/openspec-mobile-development.md`

**Spec context:**
- Visual: Horizontal timeline with 3 nodes: Propose (`change_proposal.md`), Run (`task.md`), Validate (`walkthrough.md`).
- Colors: Background slate-50 (`#F8FAFC`), Accents: Teal (`#018786`), Orange (`#FF9800`).
- Text ES: "Flujo de OpenSpec", "1. Propuesta de Cambio", "2. Tareas en Progreso (Archivo Vivo)", "3. Verificación de Resultados"
- Text EN: "OpenSpec Workflow", "1. Change Proposal", "2. Tasks in Progress (Living File)", "3. Results Verification"

**Acceptance for this task:**
- Images are created in `public/images/` at 1200x630px resolution.
- Markdown frontmatter `heroImage` is updated in both ES and EN articles.
- `pnpm build` compiles successfully without any validation errors.

**Steps:**

- [x] **Step 1: Generate Spanish infographic**
  Use `generate_image` with prompt:
  "A modern, clean technical infographic with a light gray slate background (#F8FAFC). Horizontal timeline layout showing a 3-step software development workflow. Accent colors are deep teal (#018786) and bright orange (#FF9800). Central nodes should feature clean vector icons: a document icon for step 1, a checkmark list icon for step 2, and a test verification shield icon for step 3. The main title is 'Flujo de OpenSpec'. Node labels are: '1. Propuesta de Cambio', '2. Tareas en Progreso (Archivo Vivo)', and '3. Verificación de Resultados'. Clear, readable typography, flat design, premium tech portfolio style."
  Save as: `blog_openspec_es` (and copy to `public/images/blog-openspec-mobile-development-es.png`)

- [x] **Step 2: Generate English infographic**
  Use `generate_image` with prompt:
  "A modern, clean technical infographic with a light gray slate background (#F8FAFC). Horizontal timeline layout showing a 3-step software development workflow. Accent colors are deep teal (#018786) and bright orange (#FF9800). Central nodes should feature clean vector icons: a document icon for step 1, a checkmark list icon for step 2, and a test verification shield icon for step 3. The main title is 'OpenSpec Workflow'. Node labels are: '1. Change Proposal', '2. Tasks in Progress (Living File)', and '3. Results Verification'. Clear, readable typography, flat design, premium tech portfolio style."
  Save as: `blog_openspec_en` (and copy to `public/images/blog-openspec-mobile-development-en.png`)

- [x] **Step 3: Update blog post frontmatter**
  Update `heroImage` in `src/content/blog/es/openspec-desarrollo-movil.md` to `"/images/blog-openspec-mobile-development-es.png"`.
  Update `heroImage` in `src/content/blog/en/openspec-mobile-development.md` to `"/images/blog-openspec-mobile-development-en.png"`.

- [x] **Step 4: Verify the build**
  Run: `pnpm build`
  Expected: Successful build with no Zod frontmatter schema errors.

- [x] **Step 5: Commit**
  Run:
  ```bash
  git add public/images/blog-openspec-mobile-development-*.png src/content/blog/*/openspec-*.md
  git commit -m "feat: add OpenSpec workflow infographics and update blog cover images"
  ```

---

## Task 2: Specs-Driven Development (SDD) Infographics

**Files:**
- Create: `public/images/blog-sdd-agentic-es.png`
- Create: `public/images/blog-sdd-agentic-en.png`
- Modify: `src/content/blog/es/specs-driven-development.md`
- Modify: `src/content/blog/en/spec-driven-development-ai.md`

**Spec context:**
- Visual: Parallel loops contrasting Vibe Coding (Red path -> Chaos) vs SDD Cycle (Teal path -> Success).
- Colors: Background slate-50 (`#F8FAFC`), Accents: Teal (`#018786`), Orange (`#FF9800`), Red (`#EF4444`).
- Text ES: "Vibe Coding vs. Desarrollo Guiado por Specs", "Vibe Coding (Código Directo sin Plan)", "Flujo SDD (Desarrollo Guiado por Especificaciones)"
- Text EN: "Vibe Coding vs. Spec-Driven Development", "Vibe Coding (Direct Coding without Plan)", "SDD Flow (Spec-Driven Development)"

**Acceptance for this task:**
- Images are created in `public/images/` at 1200x630px resolution.
- Markdown frontmatter `heroImage` is updated in both ES and EN articles.
- `pnpm build` compiles successfully.

**Steps:**

- [ ] **Step 1: Generate Spanish infographic**
  Use `generate_image` with prompt:
  "A modern, clean comparative technical infographic with a light gray slate background (#F8FAFC). Two parallel vertical or horizontal paths contrasting development flows. Top path uses red accents (#EF4444) labeled 'Vibe Coding (Código Directo sin Plan)' showing chaotic lines leading to bugs. Bottom path uses teal (#018786) and orange (#FF9800) accents labeled 'Flujo SDD (Desarrollo Guiado por Especificaciones)' showing orderly blocks: Spec -> Branch -> Implement -> Verify leading to success. Main title is 'Vibe Coding vs. Desarrollo Guiado por Specs'. Clean vector style, highly readable text, professional look."
  Save as: `blog_sdd_es` (and copy to `public/images/blog-sdd-agentic-es.png`)

- [ ] **Step 2: Generate English infographic**
  Use `generate_image` with prompt:
  "A modern, clean comparative technical infographic with a light gray slate background (#F8FAFC). Two parallel vertical or horizontal paths contrasting development flows. Top path uses red accents (#EF4444) labeled 'Vibe Coding (Direct Coding without Plan)' showing chaotic lines leading to bugs. Bottom path uses teal (#018786) and orange (#FF9800) accents labeled 'SDD Flow (Spec-Driven Development)' showing orderly blocks: Spec -> Branch -> Implement -> Verify leading to success. Main title is 'Vibe Coding vs. Spec-Driven Development'. Clean vector style, highly readable text, professional look."
  Save as: `blog_sdd_en` (and copy to `public/images/blog-sdd-agentic-en.png`)

- [ ] **Step 3: Update blog post frontmatter**
  Update `heroImage` in `src/content/blog/es/specs-driven-development.md` to `"/images/blog-sdd-agentic-es.png"`.
  Update `heroImage` in `src/content/blog/en/spec-driven-development-ai.md` to `"/images/blog-sdd-agentic-en.png"`.

- [ ] **Step 4: Verify the build**
  Run: `pnpm build`
  Expected: Successful build.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add public/images/blog-sdd-agentic-*.png src/content/blog/*/spec*-driven-development*.md
  git commit -m "feat: add SDD conceptual infographics and update blog covers"
  ```

---

## Task 3: Superpowers vs OpenSpec Infographics

**Files:**
- Create: `public/images/blog-superpowers-vs-openspec-es.png`
- Create: `public/images/blog-superpowers-vs-openspec-en.png`
- Modify: `src/content/blog/es/superpowers-vs-openspec.md`
- Modify: `src/content/blog/en/superpowers-vs-openspec.md`

**Spec context:**
- Visual: Comparison matrix/panels (Left: Superpowers skill execution; Right: OpenSpec artifact-guided flow).
- Colors: Background slate-50 (`#F8FAFC`), Accents: Teal (`#018786`), Orange (`#FF9800`).
- Text ES: "Comparativa de Metodologías", "Superpowers (Basado en Habilidades)", "OpenSpec (Guiado por Artefactos)"
- Text EN: "Methodologies Comparison", "Superpowers (Skill-Based)", "OpenSpec (Artifact-Guided)"

**Acceptance for this task:**
- Images are created in `public/images/` at 1200x630px resolution.
- Markdown frontmatter `heroImage` is updated in both ES and EN articles.
- `pnpm build` compiles successfully.

**Steps:**

- [ ] **Step 1: Generate Spanish infographic**
  Use `generate_image` with prompt:
  "A modern, clean comparison infographic with a light gray slate background (#F8FAFC). Two distinct comparison panels side-by-side. Left panel labeled 'Superpowers (Basado en Habilidades)' with icons representing modular skill plugins. Right panel labeled 'OpenSpec (Guiado por Artefactos)' with icons representing structured text specifications under git control. Accent colors: teal (#018786) and orange (#FF9800). Main title: 'Comparativa de Metodologías'. Flat minimalist tech style, highly professional."
  Save as: `blog_superpowers_es` (and copy to `public/images/blog-superpowers-vs-openspec-es.png`)

- [ ] **Step 2: Generate English infographic**
  Use `generate_image` with prompt:
  "A modern, clean comparison infographic with a light gray slate background (#F8FAFC). Two distinct comparison panels side-by-side. Left panel labeled 'Superpowers (Skill-Based)' with icons representing modular skill plugins. Right panel labeled 'OpenSpec (Artifact-Guided)' with icons representing structured text specifications under git control. Accent colors: teal (#018786) and orange (#FF9800). Main title: 'Methodologies Comparison'. Flat minimalist tech style, highly professional."
  Save as: `blog_superpowers_en` (and copy to `public/images/blog-superpowers-vs-openspec-en.png`)

- [ ] **Step 3: Update blog post frontmatter**
  Update `heroImage` in `src/content/blog/es/superpowers-vs-openspec.md` to `"/images/blog-superpowers-vs-openspec-es.png"`.
  Update `heroImage` in `src/content/blog/en/superpowers-vs-openspec.md` to `"/images/blog-superpowers-vs-openspec-en.png"`.

- [ ] **Step 4: Verify the build**
  Run: `pnpm build`
  Expected: Successful build.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add public/images/blog-superpowers-vs-openspec-*.png src/content/blog/*/superpowers-vs-openspec.md
  git commit -m "feat: add Superpowers vs OpenSpec infographics and update blog covers"
  ```

---

## Task 4: SDD Frameworks Analysis Infographics

**Files:**
- Create: `public/images/blog-sdd-frameworks-analysis-es.png`
- Create: `public/images/blog-sdd-frameworks-analysis-en.png`
- Modify: `src/content/blog/es/sdd-frameworks-spec-kit-openspec-bmad.md`
- Modify: `src/content/blog/en/sdd-frameworks-analysis-spec-kit-openspec-bmad.md`

**Spec context:**
- Visual: A conceptual triangle or spectrum diagram connecting Spec Kit (contracts), OpenSpec (agile proposals), and BMAD (multi-agent orchestration).
- Colors: Background slate-50 (`#F8FAFC`), Accents: Teal (`#018786`), Orange (`#FF9800`).
- Text ES: "Ecosistema de Frameworks SDD", "GitHub Spec Kit: Contratos Arquitectónicos", "OpenSpec: Propuestas Ágiles", "BMAD: Orquestación Multi-Agente"
- Text EN: "SDD Frameworks Ecosystem", "GitHub Spec Kit: Architectural Contracts", "OpenSpec: Agile Proposals", "BMAD: Multi-Agent Orchestration"

**Acceptance for this task:**
- Images are created in `public/images/` at 1200x630px resolution.
- Markdown frontmatter `heroImage` is updated in both ES and EN articles.
- `pnpm build` compiles successfully.

**Steps:**

- [ ] **Step 1: Generate Spanish infographic**
  Use `generate_image` with prompt:
  "A modern, clean technical architecture infographic with a light gray slate background (#F8FAFC). A large triangle diagram in the center connecting three key vertices. Vertex 1 is labeled 'GitHub Spec Kit: Contratos Arquitectónicos'. Vertex 2 is labeled 'OpenSpec: Propuestas Ágiles'. Vertex 3 is labeled 'BMAD: Orquestación Multi-Agente'. Accent colors: teal (#018786) and orange (#FF9800). Main title is 'Ecosistema de Frameworks SDD'. Clean typography, flat tech layout."
  Save as: `blog_frameworks_es` (and copy to `public/images/blog-sdd-frameworks-analysis-es.png`)

- [ ] **Step 2: Generate English infographic**
  Use `generate_image` with prompt:
  "A modern, clean technical architecture infographic with a light gray slate background (#F8FAFC). A large triangle diagram in the center connecting three key vertices. Vertex 1 is labeled 'GitHub Spec Kit: Architectural Contracts'. Vertex 2 is labeled 'OpenSpec: Agile Proposals'. Vertex 3 is labeled 'BMAD: Multi-Agent Orchestration'. Accent colors: teal (#018786) and orange (#FF9800). Main title is 'SDD Frameworks Ecosystem'. Clean typography, flat tech layout."
  Save as: `blog_frameworks_en` (and copy to `public/images/blog-sdd-frameworks-analysis-en.png`)

- [ ] **Step 3: Update blog post frontmatter**
  Update `heroImage` in `src/content/blog/es/sdd-frameworks-spec-kit-openspec-bmad.md` to `"/images/blog-sdd-frameworks-analysis-es.png"`.
  Update `heroImage` in `src/content/blog/en/sdd-frameworks-analysis-spec-kit-openspec-bmad.md` to `"/images/blog-sdd-frameworks-analysis-en.png"`.

- [ ] **Step 4: Verify the build**
  Run: `pnpm build`
  Expected: Successful build.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add public/images/blog-sdd-frameworks-analysis-*.png src/content/blog/*/sdd-frameworks-*.md
  git commit -m "feat: add SDD frameworks ecosystem infographics and update blog covers"
  ```

---

## Task 5: Spec Kitty Infographics

**Files:**
- Create: `public/images/blog-spec-kitty-mobile-development-es.png`
- Create: `public/images/blog-spec-kitty-mobile-development-en.png`
- Modify: `src/content/blog/es/spec-kitty-mobile-development.md`
- Modify: `src/content/blog/en/spec-kitty-mobile-development.md`

**Spec context:**
- Visual: Spec Kitty CLI flow showing terminal control, isolated git worktrees, and a 9-lane Kanban board structure.
- Colors: Background slate-50 (`#F8FAFC`), Accents: Teal (`#018786`), Orange (`#FF9800`).
- Text ES: "Spec Kitty: Automatización SDD", "CLI de Control", "Git Worktrees Aislados", "Tablero Kanban de 9 Carriles"
- Text EN: "Spec Kitty: SDD Automation", "Control CLI", "Isolated Git Worktrees", "9-Lane Kanban Board"

**Acceptance for this task:**
- Images are created in `public/images/` at 1200x630px resolution.
- Markdown frontmatter `heroImage` is updated in both ES and EN articles.
- `pnpm build` compiles successfully.

**Steps:**

- [ ] **Step 1: Generate Spanish infographic**
  Use `generate_image` with prompt:
  "A modern, clean technical infographic with a light gray slate background (#F8FAFC). Center layout showing a developer terminal window labeled 'CLI de Control' connected to two branches labeled 'Git Worktrees Aislados', which in turn feed cards into a simplified 'Tablero Kanban de 9 Carriles'. Accent colors: teal (#018786) and orange (#FF9800). Main title is 'Spec Kitty: Automatización SDD'. Clean typography, modern developer tool illustration style."
  Save as: `blog_speckitty_es` (and copy to `public/images/blog-spec-kitty-mobile-development-es.png`)

- [ ] **Step 2: Generate English infographic**
  Use `generate_image` with prompt:
  "A modern, clean technical infographic with a light gray slate background (#F8FAFC). Center layout showing a developer terminal window labeled 'Control CLI' connected to two branches labeled 'Isolated Git Worktrees', which in turn feed cards into a simplified '9-Lane Kanban Board'. Accent colors: teal (#018786) and orange (#FF9800). Main title is 'Spec Kitty: SDD Automation'. Clean typography, modern developer tool illustration style."
  Save as: `blog_speckitty_en` (and copy to `public/images/blog-spec-kitty-mobile-development-en.png`)

- [ ] **Step 3: Update blog post frontmatter**
  Update `heroImage` in `src/content/blog/es/spec-kitty-mobile-development.md` to `"/images/blog-spec-kitty-mobile-development-es.png"`.
  Update `heroImage` in `src/content/blog/en/spec-kitty-mobile-development.md` to `"/images/blog-spec-kitty-mobile-development-en.png"`.

- [ ] **Step 4: Verify the build**
  Run: `pnpm build`
  Expected: Successful build.

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add public/images/blog-spec-kitty-mobile-development-*.png src/content/blog/*/spec-kitty-*.md
  git commit -m "feat: add Spec Kitty automation infographics and update blog covers"
  ```
