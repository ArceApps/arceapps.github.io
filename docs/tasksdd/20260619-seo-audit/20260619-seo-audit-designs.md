# Diseño: Auditoría SEO y Migración de Nombres/Metadata en ArceApps

**Fecha:** 2026-06-19
**Estado:** Borrador pendiente de aprobación
**Topic:** `seo-audit`
**Directorio:** `docs/tasksdd/20260619-seo-audit/`

---

## 1. Contexto y Motivación

ArceApps es el sitio personal/portafolio de un desarrollador indie. Tras revisar el estado actual de `src/content/blog/` y `src/content/devlog/`, se han identificado tres categorías de problemas que afectan al SEO técnico del sitio:

### 1.1 Problemas en slugs (nombres de archivo)

- **Prefijo `blog-` redundante en español:** muchos artículos en `src/content/blog/es/` usan `blog-clean-architecture.md`, `blog-firebase-crashlytics.md`, `blog-kotlin-coroutines.md`, etc. La versión inglesa correspondiente no tiene ese prefijo. Resultado: URLs inconsistentes entre idiomas.
- **Sufijo de idioma en inglés:** `hermes-vs-openclaw-en.md` incluye `-en` en el slug, lo que es ruido SEO y feo en URL.
- **Slugs vagos sin la herramienta analizada:** `junior-to-senior-prioritization.md`, `imposter-syndrome-developer-2026.md`, `effective-mentorship-ai-era.md` no comunican el sujeto del artículo.

### 1.2 Problemas en titles (frontmatter)

- **Títulos sin tool/subject name:** "Refactoring Legacy Code with AI: From Nightmare to Dream", "Complete Beginner's Guide: Recommended Stack for Building AI Agents in 2026", "From Junior to Senior: The Art of Prioritizing and Saying 'No'", "Effective Mentorship: A Guide for Seniors in the AI Era", "Overcoming Imposter Syndrome as a Developer in 2026".
- **Títulos bien optimizados (referencia):** "Dependency Injection in Android: Hilt vs. Koin", "Clawdbot: Hosting Your Own AI Assistant", "Kotlin 2.1: Guard Clauses, K2 and the Future of the Language", "Anthropic Claude 4.6: Enterprise Integration and Infinite Context", "SDD Frameworks Deep Dive: GitHub Spec Kit, OpenSpec, and BMAD-METHOD Compared".

### 1.3 Problemas en metadata (frontmatter)

- Ausencia de `keywords`, `author`, `lastmod`, `canonical` en todos los artículos.
- `og:title`, `og:description`, `twitter:card` no derivados.
- `reference_id` falta en varios artículos (ej. `junior-to-senior-prioritization.md`, `imposter-syndrome-developer-2026.md`, `effective-mentorship-ai-era.md`).
- Schema en `src/content/config.ts` no valida campos SEO.

### 1.4 Problemas en agentes y skills

- `bot_Scribe.md`, `write-blog/SKILL.md`, `write-devlog/SKILL.md` definen el qué escribir pero no el cómo nombrar ni qué metadata exigir.
- No existe un validador SEO pre-publicación.
- `bot_Curator.md` evalúa noticias por valor técnico pero no por potencial SEO/keyword.

---

## 2. Objetivos

1. Renombrar slugs problemáticos a un patrón kebab-case limpio, sin prefijo `blog-` ni sufijo de idioma, sin stopwords, con la tool/subject presente.
2. Reescribir titles de artículos que no mencionan la tool/subject en las primeras 5 palabras, con longitud ≤ 60 chars.
3. Añadir metadata SEO obligatoria (`keywords`, `author`, `lastmod`, `canonical`) a todos los artículos de blog y devlog.
4. Derivar automáticamente `og:*` y `twitter:card` en `Layout.astro` desde `title`/`description`/`heroImage`.
5. Implementar redirects 301 en `astro.config.mjs` para todos los slugs renombrados.
6. Modificar las skills `write-blog` y `write-devlog` para que exijan las reglas SEO.
7. Crear la skill `write-blog-seo` que valida el frontmatter pre-publicación.
8. Actualizar `bot_Scribe.md` y `bot_Curator.md` para integrar el flujo SEO.

---

## 3. Decisiones de Diseño (consensuadas con el usuario)

| # | Decisión | Elección |
|---|----------|----------|
| D1 | Principios SEO innegociables | Tool name al inicio del título + keyword primaria al inicio |
| D2 | Reglas por colección | Distintas: blog SEO-first, devlog narrativo con tool name en subtítulo/tags |
| D3 | Alcance del renombrado | Slugs + títulos + redirects 301 en `astro.config.mjs` |
| D4 | Campos SEO obligatorios | `keywords` (3-8), `author`, `lastmod`, `canonical`; `og:`/`twitter:` derivados automáticamente |
| D5 | Validación de metadata | Schema Zod estricto en `config.ts` + checklist en skill `write-blog-seo` |
| D6 | Nivel de automatización en agentes | Crear skill dedicada `write-blog-seo` |
| D7 | Riesgo SEO durante migración | Cambio total + redirects 301 (asumir fluctuation 2-4 semanas) |
| D8 | Implementación de redirects | Array `redirects` en `astro.config.mjs` (build-time) |
| D9 | Enfoque de ejecución | Híbrido: un solo proyecto con tareas atómicas separadas (auditoría → config → migración → skills → verificación) |

---

## 4. Arquitectura de la Solución

### 4.1 Estructura de archivos del proyecto tasksdd

```
docs/tasksdd/20260619-seo-audit/
├── 20260619-seo-audit-designs.md           (este spec)
├── 20260619-seo-audit-plan.md              (plan de implementación)
├── 20260619-seo-audit-tasks.md             (tasks atómicas)
├── 20260619-seo-audit-verify.md            (checklist de aceptación)
└── 20260619-seo-audit-audit-report.md      (reporte de cambios a aplicar)
```

### 4.2 Fases de ejecución

| Fase | Descripción | Salida | Punto de control |
|------|-------------|--------|------------------|
| 1 | Auditoría SEO | `audit-report.md` con tabla de cambios propuestos | **Sí** — usuario valida antes de Fase 2 |
| 2 | Schema + redirects config | `config.ts` extendido + `astro.config.mjs` con `redirects: []` | No |
| 3 | Migración de contenido | 4 subagentes en paralelo (blog EN/ES, devlog EN/ES) | No |
| 4 | Skills y agentes | `write-blog`, `write-devlog`, `bot_Scribe`, `bot_Curator` modificados; `write-blog-seo` creada | No |
| 5 | Verificación final | `pnpm build` + checklist de acceptance | No |

---

## 5. Especificación Detallada

### 5.1 Reglas de Naming

#### Blog (SEO-first)

- **Title:** longitud ≤ 60 chars. Patrón: `[Tool/Subject Name]: [keyword secundaria — gancho]`. La tool/subject principal debe aparecer en las primeras 5 palabras.
  - Ejemplo correcto: `Hilt vs. Koin: Dependency Injection in Android`
  - Ejemplo a reescribir: `Refactoring Legacy Code with AI: From Nightmare to Dream` → `AI-Assisted Legacy Code Refactoring: Java to Kotlin`
- **Slug:** kebab-case en inglés, sin stopwords (`the`, `a`, `an`, `and`, `or`, `for`, `to`, `of`, `in`, `con`, `para`, `el`, `la`), sin prefijo `blog-`, sin sufijo de idioma (`-en`/`-es`).
  - Ejemplo correcto: `hilt-vs-koin-dependency-injection.md`
  - Ejemplo a renombrar: `blog-clean-architecture.md` → `clean-architecture-android.md`
  - Ejemplo a renombrar: `hermes-vs-openclaw-en.md` → `hermes-agent-vs-openclaw.md`

#### Devlog (narrativo con tool en subtítulo)

- **Title:** mantiene formato `YYYY W[N]: [Título ingenioso] ([Tool o Proyecto])` o con la tool/proyecto en paréntesis al final. Si el devlog trata sobre PuzzleHub, ArceApps, Clawdbot, etc., el nombre debe aparecer.
  - Ejemplo correcto: `2026 W04: El Silencio de los Lambdas (Kotlin Compiler Deep Dive)`
  - Ejemplo a reescribir: `2025 W40: First Pixel` → `2025 W40: First Pixel (PuzzleHub MVP)`
- **Slug:** formato existente `YYYY-W[N]-[Slug]` se mantiene; se limpian stopwords y se añade el proyecto si falta.

### 5.2 Schema SEO en `src/content/config.ts`

```ts
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string().max(100),               // safety upper bound
    description: z.string().min(120).max(160), // SEO optimal range
    pubDate: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    author: z.string().default('ArceApps'),
    keywords: z.array(z.string()).min(3).max(8),
    canonical: z.string().url().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
    reference_id: z.string().optional(),
  }),
});

const devlogCollection = defineCollection({
  schema: z.object({
    title: z.string().max(100),
    description: z.string().min(120).max(160),
    pubDate: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    author: z.string().default('ArceApps'),
    keywords: z.array(z.string()).min(3).max(5),
    canonical: z.string().url().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional().default(false),
  }),
});
```

`og:title`, `og:description`, `og:image`, `twitter:card` se **derivan automáticamente** en `src/layouts/Layout.astro` desde `title` + `description` + `heroImage` (no se almacenan en frontmatter).

### 5.3 Estrategia de Migración

#### Fase 1 — Auditoría

Un subagente `general` escanea las 4 colecciones y produce `audit-report.md` con una tabla:

| Columna | Descripción |
|---------|-------------|
| Archivo actual | Ruta absoluta al .md actual |
| Nuevo slug | Slug propuesto (kebab-case limpio) |
| Title actual | `title` del frontmatter actual |
| Nuevo title | `title` propuesto (≤ 60 chars, tool al inicio) |
| Keywords a añadir | Array de 3-8 strings |
| Categoría | `rename-slug` / `rename-slug-and-title` / `title-only` / `metadata-only` / `no-change` |
| Notas | Observaciones del auditor |

Categorías:
1. **rename-slug-and-title:** slug feo + título sin tool.
2. **rename-slug:** prefijo `blog-` o sufijo de idioma.
3. **title-only:** slug OK pero título vago.
4. **metadata-only:** título y slug OK, faltan `keywords`/`author`/`lastmod`/`canonical`.
5. **no-change:** ya cumple todo.

Total estimado: ~200 artículos, ~60-80 con cambios.

**Punto de control:** el reporte se muestra al usuario antes de Fase 2.

#### Fase 2 — Configuración

1. Extender `src/content/config.ts` con los nuevos campos (Sección 5.2).
2. Añadir `redirects: []` array vacío a `astro.config.mjs`.
3. Modificar `src/layouts/Layout.astro` para derivar og/twitter en `<head>`:

```astro
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={new URL(heroImage, Astro.site).toString()} />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={new URL(heroImage, Astro.site).toString()} />
<link rel="canonical" href={canonical ?? new URL(Astro.url.pathname, Astro.site).toString()} />
```

#### Fase 3 — Migración de Contenido

4 subagentes `implementer` en paralelo (uno por colección):

| Subagente | Carpeta | Idioma |
|-----------|---------|--------|
| SA-1 | `src/content/blog/en/` | Inglés |
| SA-2 | `src/content/blog/es/` | Español |
| SA-3 | `src/content/devlog/en/` | Inglés |
| SA-4 | `src/content/devlog/es/` | Español |

Cada subagente recibe:
- El reporte de auditoría filtrado a su colección.
- Las reglas de la Sección 5.1.
- El schema de la Sección 5.2.

Acciones por archivo (orden):
1. Si hay rename de slug → `git mv archivo_viejo archivo_nuevo` (preserva history).
2. Actualizar `title` en frontmatter.
3. Añadir `keywords` (3-8 strings), `author` (= "ArceApps"), `lastmod` (= `pubDate` por defecto), `canonical` (URL absoluta).
4. Validar que `description` esté en 120-160 chars. **Si está fuera del rango, el subagente DEBE reescribir la descripción** sin perder semántica, porque el schema de Fase 2 va a rechazar valores fuera de [120, 160]. Sin esta corrección, `pnpm build` fallará.
5. Añadir entrada al array `redirects` en `astro.config.mjs`:
   ```js
   { from: '/blog/slug-viejo', to: '/blog/slug-nuevo', status: 301 }
   ```
   Para ES: `from: '/es/blog/slug-viejo', to: '/es/blog/slug-nuevo'`.

Concurrencia: los 4 subagentes escriben a colecciones distintas. El único recurso compartido es `astro.config.mjs` → estrategia: el subagente de Fase 2 inicializa `redirects: []` y cada SA-3 añade sus entradas; al final, build-fixer resuelve conflictos.

**Nota práctica:** para evitar race conditions, las entradas de `astro.config.mjs` se acumularán en un archivo `agents/workspace/redirects-pending.json` durante Fase 3, y un subagente final compilará el array completo en `astro.config.mjs`.

#### Fase 4 — Skills y Agentes

1. **`.opencode/skills/write-blog/SKILL.md`:** añadir sección `## SEO Obligatorio` con reglas de Sección 5.1 (blog) y checklist pre-publish.
2. **`.opencode/skills/write-devlog/SKILL.md`:** añadir sección `## SEO Obligatorio (modo narrativo)` con reglas de Sección 5.1 (devlog) y checklist.
3. **`.opencode/skills/write-blog-seo/SKILL.md`:** **CREAR** con las 12 validaciones (ver Sección 5.4).
4. **`agents/bots/bot_Scribe.md`:** añadir paso 5 al Protocolo Operativo: invocar `write-blog-seo` post-generación.
5. **`agents/bots/bot_Curator.md`:** añadir criterio SEO en `Brain / Context`.

#### Fase 5 — Verificación

- `pnpm build` debe pasar sin errores.
- Checklist de `verify.md` ejecutado por un subagente `verifier`.

### 5.4 Skill `write-blog-seo` (a crear)

**Propósito:** validar el frontmatter de un artículo de blog o devlog contra las reglas SEO.

**Entradas:** ruta al archivo Markdown.

**Validaciones (12):**

| # | Validación | Severidad |
|---|------------|-----------|
| 1 | Extraer `title` del frontmatter | — |
| 2 | Tool/subject en las primeras 5 palabras del title | FAIL si no |
| 3 | `title` ≤ 60 chars | FAIL si no |
| 4 | Slug match `^[a-z0-9]+(-[a-z0-9]+)*$` | FAIL si no |
| 5 | Slug sin stopwords (the, a, an, and, or, for, to, of, in, con, para, el, la) | FAIL si contiene |
| 6 | Slug sin prefijo `blog-` ni sufijo `-en`/`-es` | FAIL si contiene |
| 7 | `keywords` length ∈ [3, 8] | FAIL si no |
| 8 | `author` presente | WARN si falta (default = "ArceApps") |
| 9 | `description` length ∈ [120, 160] | WARN si fuera |
| 10 | `canonical` presente y parseable como URL absoluta | WARN si falta (auto-derivable en `Layout.astro` desde `Astro.url.pathname`); FAIL si presente pero mal formado |
| 11 | `lastmod` ≥ `pubDate` | WARN si no |
| 12 | `pnpm build` no falla por Zod | FAIL si falla |

**Salida:**
```
## SEO Audit Result
Status: PASS | FAIL
Issues:
- [FAIL] ...
Suggestions:
- Cambiar title a: "..."
- Añadir keywords: [...]
```

Iteración: el agente Scribe itera hasta `Status: PASS` antes de declarar el artículo listo.

### 5.5 Cambios en `bot_Scribe.md`

Añadir al `## 🛠️ Protocolo Operativo` (después del paso 4):

```
5. **Validación SEO:** Tras generar el contenido, invocar la skill
   `write-blog-seo` para auditar el frontmatter. Iterar hasta PASS
   antes de declarar el artículo terminado. Aplican también las
   reglas de naming SEO descritas en `write-blog`/`write-devlog`.
```

### 5.6 Cambios en `bot_Curator.md`

Añadir al `## 🧠 Brain / Context`:

```
- **Criterio SEO:** Al evaluar una noticia, considerar si tiene tool
  name claro y potencial de keyword search ("AI improves coding" se
  descarta; "Anthropic launches Claude 4.6" se prioriza). Las
  noticias con tool/subject identificable generan artículos con
  mejor SEO; las que no, se descartan.
```

---

## 6. Criterios de Aceptación

Ver `20260619-seo-audit-verify.md` para el checklist completo. Resumen ejecutivo:

- Schema en `config.ts` valida los nuevos campos.
- Cero archivos con prefijo `blog-` o sufijo de idioma en `src/content/blog/{en,es}/`.
- 100% de artículos de blog con `keywords` (3-8), `author`, `lastmod`, `canonical`.
- 100% de devlogs con `keywords` (3-5), `author`, `lastmod`, `canonical`.
- 100% de titles ≤ 60 chars.
- 100% de titles mencionan tool/subject en las primeras 5 palabras.
- `og:*` y `twitter:card` derivados automáticamente en `Layout.astro`.
- Redirects 301 en `astro.config.mjs` para todos los slugs renombrados.
- Skills `write-blog`, `write-devlog`, `bot_Scribe`, `bot_Curator` actualizadas.
- Skill `write-blog-seo` creada con las 12 validaciones.
- `pnpm build` pasa sin errores.

---

## 7. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Article con tool name en tags pero sin tool analizable (ej. "Effective Mentorship") | El subagente implementador puede proponer rename usando el tema como subject ("Senior Mentorship in the AI Era") |
| Slug renombrado pierde backlinks externos | Redirects 301 en `astro.config.mjs` preservan autoridad |
| Article en ES desincronizado del EN tras rename | Cada subagente trabaja par ES+EN juntos; validación con build |
| `pnpm build` falla por Zod en algún archivo legacy | La auditoría identifica estos casos antes y propone fix |
| Race condition en `astro.config.mjs` con 4 subagentes | Estrategia: redirects se acumulan en `agents/workspace/redirects-pending.json` y un subagente final compila el array |
| Search Console no indexa nuevos slugs rápido | Se mantiene `sitemap.xml` y se hace ping post-deploy (manual) |
| Article con subject en tags pero título vago | El reporte de auditoría marca estas como `title-only` y el implementador propone nuevo title |

---

## 8. Plan de Rollback

- Todos los cambios de slug usan `git mv` (preserva history).
- Si la migración falla, `git revert` al commit pre-migración recupera el estado.
- El commit se hace **al final** (no durante la ejecución), según la regla de tasksdd.

---

## 9. Supuestos y Dependencias

- **S:** El usuario tiene acceso a `pnpm build` y puede ejecutarlo localmente.
- **S:** El sitio está deployado en GitHub Pages o Netlify con soporte para `redirects` en `astro.config.mjs`.
- **S:** Los archivos Markdown siguen el formato estándar de Astro Content Collections.
- **D:** No hay artículos con frontmatter personalizado fuera del schema actual.
- **D:** El paquete `astro` soporta el array `redirects` en config (>= 4.0).

---

## 10. Out of Scope

- Modificar el contenido (cuerpo) de los artículos, solo metadata y naming.
- Cambiar el diseño visual del sitio.
- Crear una skill para imágenes o heroImages.
- Optimizar la velocidad de carga (eso corresponde a `bot_Bolt`).
- Hacer ping a Google Search Console post-deploy (es manual).
- Reescribir articles en otros idiomas además de EN/ES.
