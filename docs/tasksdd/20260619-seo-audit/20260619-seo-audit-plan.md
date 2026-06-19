# Auditoría SEO y Migración de Nombres/Metadata en ArceApps — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use tasksdd:tasksdd-subagent-driven-development
> Este plan tiene tres partes: este archivo de plan (`20260619-seo-audit-plan.md`), la lista de tasks (`20260619-seo-audit-tasks.md`), y el reporte de verificación (`20260619-seo-audit-verify.md`).
> El subagente documenter actualizará todos los archivos durante la ejecución.

**Goal:** Auditar, renombrar y completar la metadata SEO de los artículos del blog y devlog de ArceApps, configurar redirects 301, y actualizar las skills/agentes para que el flujo de publicación exija las nuevas reglas.

**Architecture:** 5 fases secuenciales: (1) Auditoría → reporte; (2) Extensión del schema Zod y config de Astro con `redirects: []`; (3) Migración de contenido en 4 subagentes paralelos (uno por colección EN/ES × blog/devlog) con acumulación de redirects en `agents/workspace/redirects-pending.json` para evitar race conditions; (4) Modificación de `write-blog`/`write-devlog`/`bot_Scribe`/`bot_Curator` y creación de `write-blog-seo`; (5) Verificación con `pnpm build` y checklist de acceptance.

**Tech Stack:** Astro 5.16.3, TypeScript, Zod (Content Collections), Astro `redirects` config, pnpm.

**Status:** 🟡 IN PROGRESS

---

## Acceptance Criteria

Desde la perspectiva del usuario final (visitante del sitio web y operador de los agentes):

- [ ] Cero archivos con prefijo `blog-` o sufijo de idioma (`-en`/`-es`) en `src/content/blog/{en,es}/`.
- [ ] 100% de los artículos de blog y devlog tienen `keywords` (3-8 elementos), `author`, `lastmod`, y `canonical` en su frontmatter.
- [ ] 100% de los titles de blog tienen ≤ 60 caracteres y mencionan la tool/subject en las primeras 5 palabras.
- [ ] 100% de los titles de devlog mencionan el proyecto (PuzzleHub, ArceApps, etc.) o la tool principal en paréntesis al final.
- [ ] `description` en rango 120-160 caracteres en todos los artículos.
- [ ] `og:title`, `og:description`, `og:image`, `og:type` y `twitter:card` se generan automáticamente en `Layout.astro`.
- [ ] Cada slug renombrado tiene una entrada de redirect 301 correspondiente en `astro.config.mjs`.
- [ ] Las skills `write-blog` y `write-devlog` contienen una sección "## SEO Obligatorio" con las reglas de naming y metadata.
- [ ] La skill `write-blog-seo` existe con las 12 validaciones definidas en el spec.
- [ ] `bot_Scribe.md` referencia la skill `write-blog-seo` en su protocolo operativo.
- [ ] `bot_Curator.md` incluye criterio SEO en `Brain / Context`.
- [ ] `pnpm build` completa sin errores ni warnings de Zod.
- [ ] El reporte `20260619-seo-audit-audit-report.md` existe y lista todos los cambios aplicados.

---

## Constraints & Guardrails

- **No commits durante la ejecución:** según la regla tasksdd, el commit final lo decide el usuario. Los subagentes deben dejar los cambios staged pero NO hacer commit.
- **No romper artículos legacy:** el schema extendido en Fase 2 puede rechazar artículos preexistentes. La migración (Fase 3) debe añadir metadata ANTES de activar el schema estricto. La forma más segura: extender el schema con defaults o `.optional()` en un primer commit lógico, ejecutar la migración, y luego endurecer con `.min()`/`.max()` reales.
- **Concurrencia sobre `astro.config.mjs`:** los 4 subagentes de Fase 3 NO escriben directamente en `astro.config.mjs`. Cada uno acumula sus entradas en `agents/workspace/redirects-pending-<collection>.json`. Un subagente final de Fase 3.5 compila todas en el array `redirects` de `astro.config.mjs`.
- **Preservar history:** los renombrados de slug se hacen con `git mv` (no `mv` + add/delete).
- **No modificar el cuerpo del artículo:** solo frontmatter y nombre de archivo.
- **Description reescritura:** si la descripción está fuera de 120-160 chars, el subagente DEBE reescribirla sin perder semántica. El schema endurecido rechazará valores fuera de rango.
- **Fechas:** `lastmod` se inicializa con el mismo valor que `pubDate`. En futuras actualizaciones reales, el operador lo actualizará.
- **Indie spirit:** mantener el tono cercano y artesanal en todos los mensajes de commit y descripciones (regla de oro de `AGENTS.md`).

---

## Architectural Notes

### Esquema de paralelización

- **Fase 1 (auditoría):** 1 subagente `general`. Lee las 4 carpetas, produce el reporte único.
- **Fase 2 (config):** 1 subagente `implementer` (secuencial tras Fase 1).
- **Fase 3 (migración):** 4 subagentes `implementer` en paralelo. Cada uno opera sobre una colección distinta. Recurso compartido: `agents/workspace/redirects-pending-<col>.json` (un archivo por subagente → no hay race).
- **Fase 3.5 (compilar redirects):** 1 subagente `implementer` que lee los 4 JSON pendientes, los une, y actualiza `astro.config.mjs`.
- **Fase 4 (skills/agents):** 1 subagente `implementer` que modifica las 4 skills/bots y crea la nueva.
- **Fase 5 (verificación):** 1 subagente `verifier` que ejecuta `pnpm build` y revisa contra el checklist.

### Manejo del schema (orden crítico)

1. **Fase 2.1:** añadir los nuevos campos con `.optional()` o `.default()` (no rompe artículos legacy).
2. **Fase 3:** los subagentes rellenan los nuevos campos en cada artículo.
3. **Fase 3.5:** una vez rellenados, endurecer el schema con `.min(120).max(160)` en `description` y `.min(3).max(8)` en `keywords`.
4. **Fase 5:** `pnpm build` valida el schema endurecido contra todos los artículos migrados.

Si se hace en otro orden, el build fallará durante la migración.

### Convenciones de slug

- Blog: kebab-case, todo en minúsculas, sin stopwords, sin prefijo `blog-`, sin sufijo `-en`/`-es`, en inglés incluso para la versión ES.
- Devlog: `YYYY-W[N]-[slug-descriptivo]` (formato ya existente), se mantienen los `YYYY-` y `W[N]-`.

### Canonical URL

- Para EN: `${SITE_URL}/blog/${slug}/`
- Para ES: `${SITE_URL}/es/blog/${slug}/`

`SITE_URL` se debe leer de `astro.config.mjs` o de una variable de entorno. Si el proyecto no define `SITE_URL` explícitamente, se puede derivar del `site` config o usar la URL pública.

---

## Execution Log

_Living record, updated by the documenter subagent. Do not edit by hand._
