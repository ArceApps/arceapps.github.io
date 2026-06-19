# Auditoría SEO y Migración de ArceApps — Task List

> **For agentic workers:** Lee este archivo una vez y dispacha un implementer por task. Las tasks son atómicas (2-5 min). NO bundles de tasks. NO sigas este orden si no entiendes las dependencias (ver sección "Task Dependencies").
>
> **REGLA CRÍTICA:** NO hacer commit durante la ejecución. El usuario revisará y decidirá el commit/PR al final. Las tasks terminan con archivos staged pero no commiteados.

---

## Task Dependencies

```
Task 1 (Auditoría)  →  [GATE USER]  →  Task 2 (Config)
                                              ↓
                          ┌───────────────────┼───────────────────┐
                          ↓                   ↓                   ↓
                    Task 3.1 (blog EN)  Task 3.2 (blog ES)  Task 3.3 (devlog EN)  Task 3.4 (devlog ES)
                          └───────────────────┬───────────────────┘
                                              ↓
                                       Task 3.5 (Compilar redirects)
                                              ↓
                                       Task 3.6 (Endurecer schema)
                                              ↓
                          ┌───────────────────┴───────────────────┐
                          ↓                                       ↓
              Task 4.1 (Update skills)                  Task 4.2 (Update bots)
                          └───────────────────┬───────────────────┘
                                              ↓
                                       Task 5 (Verificación)
```

- Tasks 3.1-3.4 son **paralelas** (distintas colecciones, sin race conditions).
- Task 3.5 depende de las 4 anteriores.
- Tasks 4.1 y 4.2 son **paralelas** entre sí.
- Task 5 es la última.

---

## Task 1: Auditoría SEO Completa

**Files:**
- Create: `docs/tasksdd/20260619-seo-audit/20260619-seo-audit-audit-report.md`
- Read: `src/content/blog/en/*.md`, `src/content/blog/es/*.md`, `src/content/devlog/en/*.md`, `src/content/devlog/es/*.md`

**Spec context (minimal):**
De la sección 5.1 del spec (`20260619-seo-audit-designs.md`):
- Blog: title ≤ 60 chars + tool name en primeras 5 palabras; slug kebab-case sin stopwords, sin prefijo `blog-`, sin sufijo `-en`/`-es`.
- Devlog: title `YYYY W[N]: [Título] ([Tool])`; slug `YYYY-W[N]-[slug]` sin stopwords.
- Categorías de cambio: `rename-slug-and-title`, `rename-slug`, `title-only`, `metadata-only`, `no-change`.

**Acceptance for this task:**
- [ ] El archivo `audit-report.md` existe.
- [ ] Contiene una tabla Markdown con TODOS los artículos de las 4 colecciones.
- [ ] Cada fila tiene columnas: archivo actual, nuevo slug, title actual, nuevo title, keywords sugeridas, categoría, notas.
- [ ] El reporte está dividido en 4 secciones (una por colección).

**Steps:**

- [ ] **Step 1: Listar todos los archivos**

```bash
ls src/content/blog/en/ src/content/blog/es/ src/content/devlog/en/ src/content/devlog/es/
```

Anotar el número total de archivos por colección.

- [ ] **Step 2: Para cada archivo, extraer frontmatter y evaluar**

Crear un script mental (no es necesario crear el archivo) que para cada .md:
1. Lee el frontmatter (entre `---`).
2. Extrae `title`, `description`, `slug` (del nombre de archivo).
3. Evalúa:
   - ¿`title` ≤ 60 chars?
   - ¿Tool/subject en las primeras 5 palabras del `title`?
   - ¿Slug en kebab-case sin stopwords?
   - ¿Slug tiene prefijo `blog-` o sufijo `-en`/`-es`?
   - ¿Existe `keywords`/`author`/`lastmod`/`canonical`?
   - ¿`description` ∈ [120, 160] chars?
4. Clasifica en una de las 5 categorías.
5. Propón nuevo slug y/o title y/o keywords.

- [ ] **Step 3: Crear el reporte**

Escribir `docs/tasksdd/20260619-seo-audit/20260619-seo-audit-audit-report.md` con la estructura:

```markdown
# Auditoría SEO — Reporte de Cambios Propuestos

**Fecha:** 2026-06-19
**Total artículos analizados:** <N>
**Artículos con cambios:** <N>
**Distribución por categoría:**
- rename-slug-and-title: <N>
- rename-slug: <N>
- title-only: <N>
- metadata-only: <N>
- no-change: <N>

---

## Blog EN (<N> archivos)

| Archivo actual | Nuevo slug | Title actual | Nuevo title | Keywords | Categoría | Notas |
|----------------|------------|--------------|-------------|----------|-----------|-------|
| ... | ... | ... | ... | ... | ... | ... |

---

## Blog ES (<N> archivos)

(misma estructura)

---

## Devlog EN (<N> archivos)

(misma estructura)

---

## Devlog ES (<N> archivos)

(misma estructura)

---

## Resumen de Slugs Renombrados (para redirects)

| Slug viejo | Slug nuevo | Idioma |
|------------|------------|--------|
| ... | ... | en/es |
```

- [ ] **Step 4: Notificar al usuario para validación**

El subagente implementer **NO continúa** hasta que el usuario apruebe el reporte. Reportar al orquestador con un resumen:
- Total de artículos
- Total con cambios
- Lista de renames más impactantes (top 10)

El usuario revisará y aprobará o solicitará ajustes antes de pasar a Task 2.

---

## Task 2: Configuración de Schema y Layout

**Files:**
- Modify: `src/content/config.ts` (extender schemas de blog y devlog con campos SEO)
- Modify: `src/layouts/Layout.astro` (añadir og/twitter/canonical en `<head>`)
- Modify: `astro.config.mjs` (añadir array `redirects: []`)

**Spec context (minimal):**
De las secciones 5.2 y 5.3 del spec.

**Acceptance for this task:**
- [ ] `src/content/config.ts` tiene los nuevos campos (`keywords`, `author`, `lastmod`, `canonical`) en `blog` y `devlog`.
- [ ] Los nuevos campos son `.optional()` o tienen `.default()` (NO `.min()`/`.max()` aún — eso se endurece en Task 3.6).
- [ ] `astro.config.mjs` tiene `redirects: []` (array vacío).
- [ ] `src/layouts/Layout.astro` genera `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` y `canonical` desde los datos del frontmatter.
- [ ] `pnpm build` aún pasa (no debería romperse porque los nuevos campos son opcionales).

**Steps:**

- [ ] **Step 1: Extender schema en `src/content/config.ts`**

Reemplazar las definiciones de `blogCollection` y `devlogCollection` con:

```ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    author: z.string().default('ArceApps'),
    keywords: z.array(z.string()).optional(),
    canonical: z.string().url().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
    reference_id: z.string().optional(),
  }),
});

const appsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    draft: z.boolean().optional().default(false),
    icon: z.string().optional().default('android'),
    realIconUrl: z.string().url().regex(/^https?:\/\//, 'Must start with http:// or https://').optional(),
    screenshots: z.array(z.string()).optional(),
    rating: z.number().optional(),
    version: z.string().optional(),
    lastUpdated: z.string().optional(),
    tags: z.array(z.string()).optional(),
    repoUrl: z.string().url().regex(/^https?:\/\//, 'Must start with http:// or https://').optional(),
    demoUrl: z.string().url().regex(/^https?:\/\//, 'Must start with http:// or https://').optional(),
    googlePlayUrl: z.string().url().regex(/^https?:\/\//, 'Must start with http:// or https://').optional(),
    reference_id: z.string().optional(),
  }),
});

const devlogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    author: z.string().default('ArceApps'),
    keywords: z.array(z.string()).optional(),
    canonical: z.string().url().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = {
  'blog': blogCollection,
  'apps': appsCollection,
  'devlog': devlogCollection,
};
```

- [ ] **Step 2: Añadir `redirects: []` a `astro.config.mjs`**

Localizar el bloque de configuración existente (probablemente tiene `site:`, `integrations:`, etc.). Añadir:

```js
redirects: [],
```

Si ya existe un `redirects`, mantener el existente y dejar la lista vacía (los redirects de Fase 3.5 se añadirán después).

- [ ] **Step 3: Añadir og/twitter/canonical en `Layout.astro`**

Localizar la sección `<head>` del `src/layouts/Layout.astro`. Después de los `<meta>` y `<link>` existentes, añadir:

```astro
{/* SEO meta — derived from frontmatter */}
{title && <meta property="og:title" content={title} />}
{description && <meta property="og:description" content={description} />}
{heroImage && <meta property="og:image" content={new URL(heroImage, Astro.site ?? 'http://localhost').toString()} />}
<meta property="og:type" content="article" />
{description && <meta name="twitter:card" content="summary_large_image" />}
{title && <meta name="twitter:title" content={title} />}
{description && <meta name="twitter:description" content={description} />}
{heroImage && <meta name="twitter:image" content={new URL(heroImage, Astro.site ?? 'http://localhost').toString()} />}
<link rel="canonical" href={canonical ?? new URL(Astro.url.pathname, Astro.site ?? 'http://localhost').toString()} />
```

- [ ] **Step 4: Validar build**

```bash
pnpm build
```

Esperado: PASS (los nuevos campos son opcionales, no rompen nada).

---

## Task 3.1: Migración Blog EN

**Files:**
- Modify: `src/content/blog/en/*.md` (múltiples)
- Create: `agents/workspace/redirects-pending-blog-en.json`

**Spec context (minimal):**
Sección 5.3 del spec. Aplicar las reglas de naming y metadata de la sección 5.1.

**Acceptance for this task:**
- [ ] 100% de los artículos en `src/content/blog/en/` tienen `keywords` (3-8), `author`, `lastmod`, `canonical`.
- [ ] 100% de los titles tienen ≤ 60 chars y mencionan la tool/subject en las primeras 5 palabras.
- [ ] Cero archivos con prefijo `blog-` o sufijo `-en`.
- [ ] Slugs en kebab-case sin stopwords.
- [ ] `description` en 120-160 chars.
- [ ] Renames aplicados con `git mv`.
- [ ] `agents/workspace/redirects-pending-blog-en.json` contiene todas las entradas de redirect para esta colección.

**Steps:**

- [ ] **Step 1: Leer reporte de auditoría**

Leer `docs/tasksdd/20260619-seo-audit/20260619-seo-audit-audit-report.md`, sección "Blog EN". Filtrar solo entradas con categoría ≠ `no-change`.

- [ ] **Step 2: Para cada artículo con rename de slug, ejecutar `git mv`**

```bash
git mv src/content/blog/en/slug-viejo.md src/content/blog/en/slug-nuevo.md
```

- [ ] **Step 3: Para cada artículo, actualizar frontmatter**

Patrón de actualización:

```yaml
---
title: "<nuevo title ≤ 60 chars con tool name al inicio>"
description: "<nueva descripción 120-160 chars>"
pubDate: <mantener original>
lastmod: <mantener pubDate por defecto>
author: "ArceApps"
keywords: ["k1", "k2", "k3", "k4", "k5"]  # 3-8 keywords incluyendo la tool
canonical: "https://arceapps.com/blog/<nuevo-slug>/"
heroImage: <mantener si existe>
tags: <mantener o mejorar>
draft: <mantener si existe>
reference_id: <mantener si existe>
---
```

- [ ] **Step 4: Acumular redirects en JSON**

Crear `agents/workspace/redirects-pending-blog-en.json`:

```json
{
  "/blog/slug-viejo": "/blog/slug-nuevo",
  ...
}
```

- [ ] **Step 5: Validar con build**

```bash
pnpm build
```

Esperado: PASS (los campos son opcionales en schema actual, no fallan).

---

## Task 3.2: Migración Blog ES

**Files:**
- Modify: `src/content/blog/es/*.md`
- Create: `agents/workspace/redirects-pending-blog-es.json`

**Spec context (minimal):**
Idéntico a Task 3.1 pero en español. El slug sigue en inglés por convención del proyecto (ver sección 5.1 del spec). El prefijo `blog-` en el slug debe eliminarse.

**Acceptance for this task:**
- [ ] 100% de los artículos en `src/content/blog/es/` tienen `keywords`, `author`, `lastmod`, `canonical`.
- [ ] Cero archivos con prefijo `blog-` o sufijo `-es`.
- [ ] `description` en 120-160 chars (en español, manteniendo el sentido).
- [ ] `canonical` apunta a `https://arceapps.com/es/blog/<slug>/`.
- [ ] `agents/workspace/redirects-pending-blog-es.json` contiene las entradas de redirect con `from: /es/blog/...`.

**Steps:**

- [ ] **Step 1: Leer reporte de auditoría, sección "Blog ES"**

- [ ] **Step 2: Para cada rename, `git mv`**

```bash
git mv src/content/blog/es/slug-viejo.md src/content/blog/es/slug-nuevo.md
```

⚠️ El slug nuevo NO debe tener prefijo `blog-` ni sufijo `-es`. Si el slug del EN es `clean-architecture-android.md`, el slug del ES debe ser idéntico (mismo nombre de archivo).

- [ ] **Step 3: Actualizar frontmatter (en español)**

```yaml
---
title: "<título en español ≤ 60 chars con tool name al inicio>"
description: "<descripción en español, 120-160 chars>"
pubDate: <mantener>
lastmod: <mantener pubDate>
author: "ArceApps"
keywords: ["k1", "k2", "k3", "k4", "k5"]
canonical: "https://arceapps.com/es/blog/<slug>/"
heroImage: <mantener>
tags: <mantener>
draft: <mantener>
reference_id: <mantener>
---
```

- [ ] **Step 4: Acumular redirects**

Crear `agents/workspace/redirects-pending-blog-es.json` con paths `/es/blog/...`.

- [ ] **Step 5: Validar build**

```bash
pnpm build
```

Esperado: PASS.

---

## Task 3.3: Migración Devlog EN

**Files:**
- Modify: `src/content/devlog/en/*.md`
- Create: `agents/workspace/redirects-pending-devlog-en.json`

**Spec context (minimal):**
Sección 5.1 del spec para devlog. El formato `YYYY-W[N]: [Título] ([Tool])` se aplica al title. El slug mantiene `YYYY-W[N]-` y se limpia de stopwords.

**Acceptance for this task:**
- [ ] 100% de los devlogs EN tienen `keywords` (3-5), `author`, `lastmod`, `canonical`.
- [ ] 100% de los titles mencionan el proyecto o la tool principal en paréntesis al final.
- [ ] `description` en 120-160 chars.
- [ ] `canonical` apunta a `https://arceapps.com/devlog/<slug>/` o la ruta equivalente.
- [ ] `agents/workspace/redirects-pending-devlog-en.json` con las entradas.

**Steps:**

- [ ] **Step 1: Leer reporte, sección "Devlog EN"**

- [ ] **Step 2: Para cada rename, `git mv`**

```bash
git mv src/content/devlog/en/2025-W40-First-Pixel.md src/content/devlog/en/2025-W40-First-Pixel-PuzzleHub.md
```

⚠️ Solo renombrar si el slug actual no incluye el proyecto o tiene stopwords. NO romper el formato `YYYY-W[N]-`.

- [ ] **Step 3: Actualizar frontmatter**

```yaml
---
title: "2025 W40: The First Pixel (PuzzleHub MVP)"
description: "<descripción 120-160 chars>"
pubDate: <mantener>
lastmod: <mantener pubDate>
author: "ArceApps"
keywords: ["puzzlehub", "devlog", "mvp", "architecture"]
canonical: "https://arceapps.com/devlog/<slug>/"
heroImage: <mantener>
tags: <mantener>
draft: <mantener>
---
```

- [ ] **Step 4: Acumular redirects en JSON**

- [ ] **Step 5: Validar build**

```bash
pnpm build
```

Esperado: PASS.

---

## Task 3.4: Migración Devlog ES

**Files:**
- Modify: `src/content/devlog/es/*.md`
- Create: `agents/workspace/redirects-pending-devlog-es.json`

**Spec context (minimal):**
Idéntico a Task 3.3 pero en español. El slug del devlog ES se mantiene en el mismo formato (la fecha es universal). El título se traduce al español pero mantiene el formato `YYYY W[N]: [Título] ([Tool])`.

**Acceptance for this task:**
- [ ] 100% de los devlogs ES tienen metadata completa.
- [ ] Titles en español, mencionan proyecto/tool en paréntesis.
- [ ] `canonical` apunta a `https://arceapps.com/es/devlog/<slug>/`.
- [ ] `agents/workspace/redirects-pending-devlog-es.json` con paths `/es/devlog/...`.

**Steps:**

- [ ] **Step 1: Leer reporte, sección "Devlog ES"**

- [ ] **Step 2: `git mv` para los renames necesarios**

- [ ] **Step 3: Actualizar frontmatter en español**

- [ ] **Step 4: Acumular redirects**

- [ ] **Step 5: Validar build**

```bash
pnpm build
```

---

## Task 3.5: Compilar Redirects en `astro.config.mjs`

**Files:**
- Read: `agents/workspace/redirects-pending-blog-en.json`, `redirects-pending-blog-es.json`, `redirects-pending-devlog-en.json`, `redirects-pending-devlog-es.json`
- Modify: `astro.config.mjs` (poblar array `redirects`)

**Spec context (minimal):**
Sección 5.3 del spec. El array `redirects` se inicializó vacío en Task 2.

**Acceptance for this task:**
- [ ] `astro.config.mjs` contiene todas las entradas de los 4 JSONs pendientes en su array `redirects`.
- [ ] Formato correcto: `'/blog/slug-viejo': '/blog/slug-nuevo'` (objeto, no array).
- [ ] Sin duplicados.
- [ ] Build pasa con redirects poblados.

**Steps:**

- [ ] **Step 1: Leer los 4 JSONs pendientes**

```bash
cat agents/workspace/redirects-pending-blog-en.json
cat agents/workspace/redirects-pending-blog-es.json
cat agents/workspace/redirects-pending-devlog-en.json
cat agents/workspace/redirects-pending-devlog-es.json
```

- [ ] **Step 2: Consolidar entradas**

Crear una lista única de redirects (deduplicar por `from`).

- [ ] **Step 3: Actualizar `astro.config.mjs`**

Reemplazar `redirects: {}` con el objeto consolidado:

```js
redirects: {
  '/blog/slug-v1': '/blog/slug-n1',
  '/blog/slug-v2': '/blog/slug-n2',
  // ... todos los demás
},
```

⚠️ Astro 5.x usa formato objeto: `'/old-path': '/new-path'`. NO usar array. La coma final está permitida.

- [ ] **Step 4: Validar build**

```bash
pnpm build
```

Esperado: PASS (los redirects son sintácticamente correctos).

---

## Task 3.6: Endurecer Schema Zod

**Files:**
- Modify: `src/content/config.ts`

**Spec context (minimal):**
Sección 5.2 del spec. Una vez toda la metadata está rellenada, se pueden endurecer las validaciones.

**Acceptance for this task:**
- [ ] `description` tiene `.min(120).max(160)` en blog y devlog.
- [ ] `keywords` tiene `.min(3).max(8)` en blog y `.min(3).max(5)` en devlog.
- [ ] `lastmod` ya no es `.optional()` (es obligatorio, con default = pubDate).
- [ ] `pnpm build` pasa con TODOS los artículos migrados.

**Steps:**

- [ ] **Step 1: Endurecer schema de blog**

En `src/content/config.ts`, modificar la sección de `blogCollection`:

```ts
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string().max(100),
    description: z.string().min(120).max(160),
    pubDate: z.coerce.date(),
    lastmod: z.coerce.date(),
    author: z.string().default('ArceApps'),
    keywords: z.array(z.string()).min(3).max(8),
    canonical: z.string().url().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
    reference_id: z.string().optional(),
  }),
});
```

- [ ] **Step 2: Endurecer schema de devlog**

```ts
const devlogCollection = defineCollection({
  schema: z.object({
    title: z.string().max(100),
    description: z.string().min(120).max(160),
    pubDate: z.coerce.date(),
    lastmod: z.coerce.date(),
    author: z.string().default('ArceApps'),
    keywords: z.array(z.string()).min(3).max(5),
    canonical: z.string().url().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});
```

- [ ] **Step 3: Validar build**

```bash
pnpm build
```

Esperado: PASS. Si falla, hay un artículo con metadata fuera de rango → volver a Task 3.1-3.4 para corregirlo.

---

## Task 4.1: Actualizar Skills (write-blog, write-devlog, write-blog-seo)

**Files:**
- Modify: `.opencode/skills/write-blog/SKILL.md` (añadir sección "## SEO Obligatorio")
- Modify: `.opencode/skills/write-devlog/SKILL.md` (añadir sección "## SEO Obligatorio (modo narrativo)")
- Create: `.opencode/skills/write-blog-seo/SKILL.md`

**Spec context (minimal):**
Sección 5.4 del spec (12 validaciones de `write-blog-seo`). Sección 5.1 (reglas de naming).

**Acceptance for this task:**
- [ ] `write-blog/SKILL.md` contiene la sección "## SEO Obligatorio" con las reglas de blog (tool name al inicio, ≤ 60 chars, kebab-case sin stopwords, sin prefijos, sin sufijos de idioma).
- [ ] `write-devlog/SKILL.md` contiene la sección "## SEO Obligatorio (modo narrativo)" con las reglas de devlog.
- [ ] `write-blog-seo/SKILL.md` existe con las 12 validaciones definidas en el spec.
- [ ] Las 3 skills son internamente consistentes (las reglas coinciden entre sí).

**Steps:**

- [ ] **Step 1: Añadir sección SEO a `write-blog/SKILL.md`**

Insertar antes de "## Verificación Obligatoria":

```markdown
## SEO Obligatorio

Antes de escribir el archivo, el agente debe haber pasado por la skill
`write-blog-seo` para validar el frontmatter. Reglas innegociables:

### Naming
- **Title (≤ 60 chars visibles en SERP):** patrón `[Tool/Subject]: [gancho]`.
  La herramienta o sujeto principal va en las primeras 3-5 palabras.
- **Slug:** kebab-case en inglés, sin stopwords, sin prefijo `blog-`,
  sin sufijo de idioma, sin artículos.
- **Longitud del title:** medir con `wc -c` post-propuesta. Si > 60, recortar.

### Metadata obligatoria
- `keywords`: array de 3-8 strings, mezcla de la tool + términos de búsqueda.
- `author`: "ArceApps" (default).
- `pubDate`: fecha real del sistema (verificada con `date +%F`).
- `lastmod`: misma fecha que `pubDate` para artículos nuevos.
- `canonical`: `${SITE_URL}/blog/${slug}/` (auto-computado por la skill SEO).
- `description`: 120-160 chars, incluir la tool name y un verbo de acción.

### Checklist pre-publicación
- [ ] Tool name aparece en las primeras 5 palabras del title
- [ ] Title ≤ 60 chars
- [ ] Slug = kebab-case sin stopwords
- [ ] keywords tiene 3-8 elementos
- [ ] description tiene 120-160 chars
- [ ] canonical apunta a la URL final
- [ ] `pnpm build` pasa sin errores de Zod
```

- [ ] **Step 2: Añadir sección SEO a `write-devlog/SKILL.md`**

Insertar antes de "## Requisitos Estrictos" o donde encaje:

```markdown
## SEO Obligatorio (modo narrativo)

A diferencia del blog, el devlog prioriza storytelling. Las reglas son más
flexibles pero la tool/proyecto debe aparecer:

### Naming
- **Title:** `YYYY W[N]: [Título ingenioso] ([Tool o Proyecto])`
  La tool/proyecto entre paréntesis al final, o como subtítulo visible.
- **Slug:** formato existente `YYYY-W[N]-[Slug]` se mantiene, pero
  se limpian stopwords.

### Metadata obligatoria
- `keywords`: 3-5 tags, incluyendo el proyecto (PuzzleHub, ArceApps, etc.).
- `author`: "ArceApps".
- `pubDate` + `lastmod`: idem blog.
- `description`: 120-160 chars, menciona el proyecto/herramienta.
```

- [ ] **Step 3: Crear `write-blog-seo/SKILL.md`**

Crear el archivo `.opencode/skills/write-blog-seo/SKILL.md`:

```markdown
---
name: write-blog-seo
description: Valida que el frontmatter de un artículo cumple los requisitos SEO de ArceApps (naming, metadata, schema). Se invoca DESPUÉS de write-blog y ANTES de publicar.
---

# Skill: Write Blog SEO (Validador)

## Rol
Eres un auditor SEO técnico. Recibes un archivo Markdown de blog o devlog
y produces un veredicto: PASS / FAIL con lista de issues accionables.

## Validaciones

### Naming
1. Extraer `title` del frontmatter.
2. **Tool name presente:** leer las primeras 5 palabras del title. Si no
   contiene ninguna tool/subject reconocible → FAIL con sugerencia.
3. **Longitud title:** contar chars del title (sin comillas). Si > 60 → FAIL.
4. **Slug kebab-case:** verificar regex `^[a-z0-9]+(-[a-z0-9]+)*$`.
5. **Stopwords en slug:** detectar `the`, `a`, `an`, `and`, `or`, `for`,
   `to`, `of`, `in`, `con`, `para`, `el`, `la` en el slug → FAIL.
6. **Prefijos/sufijos prohibidos:** `blog-` al inicio, `-en` o `-es` al
   final del slug → FAIL.

### Metadata
7. `keywords` presente y length ∈ [3, 8] → FAIL si no.
8. `author` presente → WARN si falta (default = "ArceApps").
9. `description` length ∈ [120, 160] → WARN si fuera de rango.
10. `canonical` presente y parseable como URL absoluta → WARN si falta
    (auto-derivable en `Layout.astro`); FAIL si presente pero mal formado.
11. `lastmod` ≥ `pubDate` → WARN si no.
12. `pnpm build` no falla por Zod → FAIL si falla.

## Salida
Devolver al agente Scribe un bloque:

\`\`\`
## SEO Audit Result
Status: PASS | FAIL
Issues:
- [FAIL] title contiene la tool name en las primeras 5 palabras
- [WARN] description tiene 145 chars (óptimo 150-160)
Suggestions:
- Cambiar title a: "Hilt vs. Koin: Dependency Injection in Android"
- Añadir keywords: ["hilt", "koin", "dependency injection", "android"]
\`\`\`

El agente Scribe itera hasta que Status: PASS antes de declarar el
artículo listo para publicar.
```

---

## Task 4.2: Actualizar Bots (Scribe, Curator)

**Files:**
- Modify: `agents/bots/bot_Scribe.md` (añadir paso 5 al protocolo)
- Modify: `agents/bots/bot_Curator.md` (añadir criterio SEO)

**Spec context (minimal):**
Secciones 5.5 y 5.6 del spec.

**Acceptance for this task:**
- [ ] `bot_Scribe.md` referencia la skill `write-blog-seo` en su protocolo operativo.
- [ ] `bot_Curator.md` incluye un criterio SEO en `Brain / Context`.

**Steps:**

- [ ] **Step 1: Modificar `bot_Scribe.md`**

Localizar la sección `## 🛠️ Protocolo Operativo`. Añadir después del paso 4 (existente):

```markdown
5.  **Validación SEO:** Tras generar el contenido, invocar la skill
    `write-blog-seo` para auditar el frontmatter. Iterar hasta PASS
    antes de declarar el artículo terminado. Aplican también las
    reglas de naming SEO descritas en `write-blog`/`write-devlog`.
```

- [ ] **Step 2: Modificar `bot_Curator.md`**

Localizar la sección `## 🧠 Brain / Context`. Añadir al final de la lista:

```markdown
-   **Criterio SEO:** Al evaluar una noticia, considerar si tiene tool
    name claro y potencial de keyword search ("AI improves coding" se
    descarta; "Anthropic launches Claude 4.6" se prioriza). Las
    noticias con tool/subject identificable generan artículos con
    mejor SEO; las que no, se descartan.
```

---

## Task 5: Verificación Final

**Files:**
- Read: `docs/tasksdd/20260619-seo-audit/20260619-seo-audit-verify.md`
- Run: `pnpm build`

**Spec context (minimal):**
Criterios de aceptación del spec y de `verify.md`.

**Acceptance for this task:**
- [ ] `pnpm build` completa sin errores.
- [ ] `pnpm build` no genera warnings de Zod.
- [ ] Cero archivos con prefijo `blog-` o sufijo de idioma en `src/content/blog/`.
- [ ] 100% de artículos de blog tienen `keywords`, `author`, `lastmod`, `canonical`.
- [ ] 100% de devlogs tienen `keywords`, `author`, `lastmod`, `canonical`.
- [ ] `astro.config.mjs` tiene redirects poblados sin duplicados.
- [ ] Las 3 skills (`write-blog`, `write-devlog`, `write-blog-seo`) existen y contienen las secciones SEO.
- [ ] Los 2 bots (`Scribe`, `Curator`) están actualizados.

**Steps:**

- [ ] **Step 1: Ejecutar build**

```bash
pnpm build
```

Esperado: PASS sin errores.

- [ ] **Step 2: Validar slugs**

```bash
ls src/content/blog/en/ | grep -E "(^blog-|-en\.)" || echo "OK: no blog- prefix or -en suffix in blog/en"
ls src/content/blog/es/ | grep -E "(^blog-|-es\.)" || echo "OK: no blog- prefix or -es suffix in blog/es"
```

Esperado: ambos `OK`.

- [ ] **Step 3: Validar metadata**

```bash
for f in src/content/blog/en/*.md src/content/blog/es/*.md src/content/devlog/en/*.md src/content/devlog/es/*.md; do
  rg -q "^keywords:" "$f" || echo "MISSING keywords: $f"
  rg -q "^author:" "$f" || echo "MISSING author: $f"
  rg -q "^lastmod:" "$f" || echo "MISSING lastmod: $f"
  rg -q "^canonical:" "$f" || echo "MISSING canonical: $f"
done
```

Esperado: cero líneas "MISSING".

- [ ] **Step 4: Validar redirects en config**

```bash
rg "'/blog" astro.config.mjs | wc -l
```

Esperado: al menos el número de slugs renombrados (según el reporte de auditoría).

- [ ] **Step 5: Validar skills y bots**

```bash
rg -q "## SEO Obligatorio" .opencode/skills/write-blog/SKILL.md && echo "OK: write-blog SEO section"
rg -q "## SEO Obligatorio" .opencode/skills/write-devlog/SKILL.md && echo "OK: write-devlog SEO section"
test -f .opencode/skills/write-blog-seo/SKILL.md && echo "OK: write-blog-seo exists"
rg -q "write-blog-seo" agents/bots/bot_Scribe.md && echo "OK: Scribe references SEO skill"
rg -q "Criterio SEO" agents/bots/bot_Curator.md && echo "OK: Curator has SEO criterion"
```

Esperado: todos `OK`.

- [ ] **Step 6: Reportar resultado**

El subagente `verifier` produce un reporte con el resultado de cada check. Si todo pasa, marca el plan como completado. Si algo falla, lista los issues para que el `build-fixer` los resuelva.
