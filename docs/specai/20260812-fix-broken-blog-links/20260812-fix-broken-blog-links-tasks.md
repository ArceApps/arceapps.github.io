# Fix enlaces rotos del blog — Task List

> **For agentic workers:** Read this file once, then dispatch one implementer per task with minimal context.
> Tasks are atomic (2-5 min). Do not bundle tasks. Do not skip the order.

---

## Task 1: Commit de los documentos specai (en `main`, antes de crear la rama)

**Files:**
- Add: `docs/specai/20260812-fix-broken-blog-links/` (5 archivos: prd, designs, plan, tasks, verify)

**Control Metadata:**
- Complexity: 1
- Risk: Low
- Checkpoint: No

**Spec context (minimal):** Gate P2 — los documentos viven sin rama.

**Acceptance for this task:**
- [ ] Los 5 documentos están commiteados en `main`

**Steps:**

- [ ] **Step 1: Verificar que no hay basura**

Run: `git status --short`
Expected: solo `docs/specai/20260812-fix-broken-blog-links/` nuevo (??) y el `pnpm-lock.yaml` con drift (M, ajeno — NO se toca).

- [ ] **Step 2: Commit de los documentos**

```bash
git add docs/specai/20260812-fix-broken-blog-links/
git commit -m "docs(specai): plan fix enlaces rotos del blog"
```

- [ ] **Step 3: Verificar**

Run: `git log --oneline -1`
Expected: el commit de docs aparece.

---

## Task 2: Crear rama feature

**Files:**
- (solo git)

**Control Metadata:**
- Complexity: 1
- Risk: Low
- Checkpoint: No

**Steps:**

- [ ] **Step 1: Crear y cambiar a la rama**

```bash
git checkout -b feature/arceapps.github.io_20260812-fix-broken-blog-links
```

- [ ] **Step 2: Verificar**

Run: `git branch --show-current`
Expected: `feature/arceapps.github.io_20260812-fix-broken-blog-links`

---

## Task 3: Corregir los 8 enlaces del post EN

**Files:**
- Modify: `src/content/blog/en/agent-skills-addyosmani-lifecycle-completo.md`

**Control Metadata:**
- Complexity: 2
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Mapeo (PRD §4): `agentes-ia-skills`→`building-ai-agent-skills`; `agent-skills-contexto-dinamico`→`ai-agent-skills-dynamic-context`; `sdd-frameworks-spec-kit-openspec-bmad`→`sdd-frameworks-analysis-spec-kit-openspec-bmad`; `servidores-mcp-memoria-cross-agent/]`→`mcp-servers-memory-cross-agent` (arreglar el `]` extra); `specs-driven-development`→`spec-driven-development-ai`.
- Cada slug aparece en línea ~25 y en la sección de referencias (~532-538): corregir TODAS las ocurrencias (2 por slug, salvo servidores-mcp que aparece 1 vez en línea 460).

**Acceptance for this task:**
- [ ] `grep -n "blog/agentes-ia-skills\|blog/agent-skills-contexto-dinamico\|blog/sdd-frameworks-spec-kit-openspec-bmad\|blog/servidores-mcp-memoria-cross-agent\|blog/specs-driven-development" src/content/blog/en/agent-skills-addyosmani-lifecycle-completo.md` → 0 resultados
- [ ] Los slugs nuevos existen: `ls src/content/blog/en/{building-ai-agent-skills,ai-agent-skills-dynamic-context,sdd-frameworks-analysis-spec-kit-openspec-bmad,mcp-servers-memory-cross-agent,spec-driven-development-ai}.md`

**Steps:**

- [ ] **Step 1: Corregir los enlaces** (reemplazar cada URL destino; el texto visible no cambia)

```bash
# En src/content/blog/en/agent-skills-addyosmani-lifecycle-completo.md:
# /blog/agentes-ia-skills/          -> /blog/building-ai-agent-skills/
# /blog/agent-skills-contexto-dinamico/ -> /blog/ai-agent-skills-dynamic-context/
# /blog/sdd-frameworks-spec-kit-openspec-bmad/ -> /blog/sdd-frameworks-analysis-spec-kit-openspec-bmad/
# /blog/servidores-mcp-memoria-cross-agent/]  -> /blog/mcp-servers-memory-cross-agent/   (quitar el ] extra)
# /blog/specs-driven-development/   -> /blog/spec-driven-development-ai/
```

- [ ] **Step 2: Verificar con el validador**

Run: `npx vitest run src/utils/links-validation.test.ts 2>&1 | tail -5`
Expected: los fallos `[en] agent-skills-addyosmani...` desaparecen (quedan ≤1 fallos ES).

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/en/agent-skills-addyosmani-lifecycle-completo.md
git commit -m "fix(blog): corregir enlaces internos rotos del post EN de Addy Osmani"
```

---

## Task 4: Corregir el enlace del post ES

**Files:**
- Modify: `src/content/blog/es/buzz-mobile-coding-agent.md`

**Control Metadata:**
- Complexity: 1
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Línea 410: `/blog/persistent-memory-stack-implementation` → `/blog/stack-memoria-persistente-implementacion` (el post ES correcto).

**Acceptance for this task:**
- [ ] `grep -n "blog/persistent-memory-stack-implementation" src/content/blog/es/buzz-mobile-coding-agent.md` → 0 resultados

**Steps:**

- [ ] **Step 1: Corregir el enlace**

```bash
# En src/content/blog/es/buzz-mobile-coding-agent.md:
# /blog/persistent-memory-stack-implementation -> /blog/stack-memoria-persistente-implementacion
```

- [ ] **Step 2: Verificar el validador completo**

Run: `npx vitest run src/utils/links-validation.test.ts 2>&1 | tail -5`
Expected: `Tests 10 passed (10)` — 0 fallos.

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/es/buzz-mobile-coding-agent.md
git commit -m "fix(blog): corregir enlace interno del post ES de Buzz"
```

---

## Task 5: Verificación completa + living docs + bitácora

**Files:**
- Modify: `docs/specai/20260812-fix-broken-blog-links/*-plan.md` (execution log + Status ✅)
- Modify: `docs/specai/20260812-fix-broken-blog-links/*-tasks.md` (estados completed)
- Modify: `docs/specai/20260812-fix-broken-blog-links/*-verify.md` (tabla de verificación)
- Create/Modify: `agents/bitácora/bitacora_specai.md`

**Control Metadata:**
- Complexity: 1
- Risk: Low
- Checkpoint: No

**Acceptance for this task:**
- [ ] `pnpm test` completo: `links-validation` 10/10 PASS y el resto de suites sin regresiones (23/24 archivos o mejor)
- [ ] `pnpm build` OK
- [ ] Living docs y bitácora actualizados

**Steps:**

- [ ] **Step 1: Suite completa + build**

Run: `pnpm test 2>&1 | grep -E "Test Files|Tests "` y `pnpm build 2>&1 | tail -3`
Expected: `links-validation` PASS; build OK.

- [ ] **Step 2: Actualizar living docs** (execution log, estados, tabla de verificación, bitácora)

- [ ] **Step 3: Commit**

```bash
git add docs/specai/20260812-fix-broken-blog-links/ agents/bitácora/bitacora_specai.md
git commit -m "docs(specai): cierre de 20260812-fix-broken-blog-links"
```

- [ ] **Step 4: Presentar para Gate UA** (usuario prueba/acepta antes del finishing)
