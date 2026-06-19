# Auditoría SEO y Migración de ArceApps — Verificación

> **For agentic workers:** Este archivo es la checklist de aceptación final. El subagente `verifier` lo ejecuta al terminar Task 5 y emite un veredicto PASS/FAIL.

## Acceptance Criteria Globales

### Schema & Config

- [ ] `src/content/config.ts` define `keywords`, `author`, `lastmod`, `canonical` en `blog` y `devlog`.
- [ ] `description` tiene `.min(120).max(160)` en blog y devlog.
- [ ] `keywords` tiene `.min(3).max(8)` en blog y `.min(3).max(5)` en devlog.
- [ ] `lastmod` es obligatorio (sin `.optional()`) en blog y devlog.
- [ ] `astro.config.mjs` tiene `redirects: [...]` poblado con todas las entradas del reporte de auditoría.
- [ ] `src/layouts/Layout.astro` genera `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` y `canonical` automáticamente.

### Contenido — Blog EN (`src/content/blog/en/`)

- [ ] Cero archivos con prefijo `blog-` al inicio del nombre.
- [ ] Cero archivos con sufijo `-en` en el nombre.
- [ ] 100% de artículos tienen `keywords` (3-8 elementos) en frontmatter.
- [ ] 100% de artículos tienen `author` en frontmatter.
- [ ] 100% de artículos tienen `lastmod` ≥ `pubDate`.
- [ ] 100% de artículos tienen `canonical` apuntando a URL absoluta `https://arceapps.com/blog/<slug>/`.
- [ ] `description` en rango 120-160 chars en 100% de artículos.
- [ ] `title` ≤ 60 chars en 100% de artículos.
- [ ] 100% de titles mencionan la tool/subject en las primeras 5 palabras.

### Contenido — Blog ES (`src/content/blog/es/`)

- [ ] Cero archivos con prefijo `blog-` al inicio del nombre.
- [ ] Cero archivos con sufijo `-es` en el nombre.
- [ ] 100% de artículos tienen `keywords`, `author`, `lastmod`, `canonical`.
- [ ] `description` en 120-160 chars.
- [ ] `canonical` apunta a `https://arceapps.com/es/blog/<slug>/`.

### Contenido — Devlog EN/ES

- [ ] 100% de devlogs tienen `keywords` (3-5 elementos), `author`, `lastmod`, `canonical`.
- [ ] 100% de devlog titles mencionan el proyecto (PuzzleHub / ArceApps / Clawdbot / etc.) o la tool principal en paréntesis al final del title.
- [ ] `description` en 120-160 chars.

### Redirects

- [ ] Para cada slug renombrado, existe entrada en `astro.config.mjs` con formato `'/old': '/new'`.
- [ ] Versiones EN tienen redirect `'/blog/...': '/blog/...'`.
- [ ] Versiones ES tienen redirect `'/es/blog/...': '/es/blog/...'`.
- [ ] Versiones devlog EN tienen redirect `'/devlog/...': '/devlog/...'`.
- [ ] Versiones devlog ES tienen redirect `'/es/devlog/...': '/es/devlog/...'`.
- [ ] Sin duplicados (no dos redirects con el mismo key).

### Skills y Agentes

- [ ] `.opencode/skills/write-blog/SKILL.md` contiene la sección "## SEO Obligatorio" con las reglas de la Sección 5.1 del spec.
- [ ] `.opencode/skills/write-devlog/SKILL.md` contiene la sección "## SEO Obligatorio (modo narrativo)".
- [ ] `.opencode/skills/write-blog-seo/SKILL.md` existe y tiene las 12 validaciones definidas en la Sección 5.4 del spec.
- [ ] `agents/bots/bot_Scribe.md` referencia la skill `write-blog-seo` en su protocolo operativo.
- [ ] `agents/bots/bot_Curator.md` incluye el criterio SEO en `Brain / Context`.

### Build

- [ ] `pnpm build` completa sin errores.
- [ ] `pnpm build` no genera warnings de Zod sobre frontmatter.
- [ ] Cero enlaces rotos (internos a `/blog/...`, `/es/blog/...`, `/devlog/...`, `/es/devlog/...`).

### Reporte de Auditoría

- [ ] `docs/tasksdd/20260619-seo-audit/20260619-seo-audit-audit-report.md` existe y lista todos los cambios aplicados (slug viejo → nuevo, title viejo → nuevo, keywords añadidas, categoría).

---

## Plantilla de Verificación Final

> A continuación, el reporte que el subagente `verifier` debe completar al ejecutar Task 5.

```markdown
## Reporte de Verificación — Auditoría SEO

**Fecha:** YYYY-MM-DD
**Verifier:** <subagente>
**Resultado global:** PASS | FAIL

### Resumen
- Total artículos en blog EN: N
- Total artículos en blog ES: N
- Total devlogs EN: N
- Total devlogs ES: N
- Artículos con cambios: N
- Redirects añadidos: N
- Skills modificadas: 2
- Skills creadas: 1
- Bots modificados: 2

### Check 1: Schema & Config
- [ ] config.ts tiene los nuevos campos
- [ ] config.ts tiene min/max endurecidos
- [ ] astro.config.mjs tiene redirects poblados
- [ ] Layout.astro genera og/twitter/canonical
**Resultado:** PASS | FAIL
**Issues (si FAIL):** ...

### Check 2: Blog EN
- [ ] Sin prefijos `blog-` ni sufijos `-en`
- [ ] 100% metadata completa
- [ ] titles ≤ 60 chars
- [ ] tool en primeras 5 palabras
**Resultado:** PASS | FAIL
**Issues (si FAIL):** ...

### Check 3: Blog ES
- [ ] Sin prefijos `blog-` ni sufijos `-es`
- [ ] 100% metadata completa
**Resultado:** PASS | FAIL
**Issues (si FAIL):** ...

### Check 4: Devlog EN/ES
- [ ] Metadata completa
- [ ] Tool/proyecto en paréntesis al final del title
**Resultado:** PASS | FAIL
**Issues (si FAIL):** ...

### Check 5: Redirects
- [ ] Todos los slugs renombrados tienen redirect
- [ ] Sin duplicados
- [ ] Paths correctos (`/blog/...`, `/es/blog/...`, etc.)
**Resultado:** PASS | FAIL
**Issues (si FAIL):** ...

### Check 6: Skills
- [ ] write-blog con sección SEO
- [ ] write-devlog con sección SEO
- [ ] write-blog-seo existe con 12 validaciones
**Resultado:** PASS | FAIL
**Issues (si FAIL):** ...

### Check 7: Bots
- [ ] Scribe referencia write-blog-seo
- [ ] Curator tiene criterio SEO
**Resultado:** PASS | FAIL
**Issues (si FAIL):** ...

### Check 8: Build
- [ ] `pnpm build` pasa
- [ ] Sin warnings de Zod
- [ ] Sin enlaces rotos
**Resultado:** PASS | FAIL
**Issues (si FAIL):** ...

### Veredicto Final
PASS — listo para commit por el usuario.
FAIL — issues arriba; requiere build-fixer antes de re-verificar.
```

---

## Comandos de Validación Rápida

```bash
# Build
pnpm build

# Slugs problemáticos
ls src/content/blog/en/ | grep -E "(^blog-|-en\.)" || echo "OK"
ls src/content/blog/es/ | grep -E "(^blog-|-es\.)" || echo "OK"

# Metadata completa
for f in src/content/blog/en/*.md src/content/blog/es/*.md src/content/devlog/en/*.md src/content/devlog/es/*.md; do
  rg -q "^keywords:|^author:|^lastmod:|^canonical:" "$f" || echo "MISSING: $f"
done

# Title length
for f in src/content/blog/en/*.md; do
  title=$(rg '^title: "' "$f" | sed 's/title: "//;s/"$//')
  if [ ${#title} -gt 60 ]; then echo "TITLE >60: $f ($title)"; fi
done

# Skills y bots
rg -l "## SEO Obligatorio" .opencode/skills/write-blog/SKILL.md .opencode/skills/write-devlog/SKILL.md
test -f .opencode/skills/write-blog-seo/SKILL.md && echo "OK: write-blog-seo"
rg -q "write-blog-seo" agents/bots/bot_Scribe.md && echo "OK: Scribe"
rg -q "Criterio SEO" agents/bots/bot_Curator.md && echo "OK: Curator"
```
