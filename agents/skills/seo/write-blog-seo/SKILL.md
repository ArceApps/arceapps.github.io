---
name: write-blog-seo
description: Valida rigurosamente que el frontmatter, la semántica web, los enlaces internos y los metadatos de un artículo de blog cumplen los estándares de SEO técnico de ArceApps antes de su publicación.
---

# Skill: Write Blog SEO (Validador de Contenido y Metadatos Web)

## Rol y Objetivo
Actúas como el **Auditor Técnico de SEO On-Page** de ArceApps. Recibes un archivo Markdown de blog o devlog (`src/content/blog/` o `src/content/devlog/`) y emites un veredicto formal: **PASS / FAIL** con la lista de correcciones exactas.

---

## 🔍 Checklist Exhaustivo de Validación SEO Web

### 1. Naming y Título (SERP Optimization)
- [ ] **Longitud del Título:** Longitud total ≤ 60 caracteres (evita el truncado en los snippets de Google y motores IA).
- [ ] **Posición de la Keyword:** La herramienta, tecnología o tema principal debe ubicarse en las **primeras 5 palabras** del título.
- [ ] **Formato del Slug:** Kebab-case estricto (`^[a-z0-9]+(-[a-z0-9]+)*$`).
- [ ] **Sin Stopwords en Slug:** Eliminar palabras vacías innecesarias (`the`, `a`, `an`, `and`, `or`, `for`, `to`, `of`, `in`, `con`, `para`, `el`, `la`, `de`).
- [ ] **Sin Prefijos/Sufijos Prohibidos:** Prohibido el prefijo `blog-` y los sufijos de idioma `-en` o `-es` en el slug.

### 2. Frontmatter y Metadatos
- [ ] **Meta Descripción:** Entre 120 y 160 caracteres. Debe contener la tecnología principal y un verbo de acción claro.
- [ ] **Keywords:** Array de 3 a 8 palabras clave técnicas relevantes.
- [ ] **Imagen de Portada (`heroImage`):** Ruta absoluta (`/images/nombre.svg`). El archivo físico **DEBE existir** en `public/images/`.
- [ ] **Fechas:** `pubDate` verificado con la fecha real actual (`date +%F`). `lastmod` ≥ `pubDate`.
- [ ] **Autor:** Presente (`author: "ArceApps"`).
- [ ] **Compatibilidad Zod:** `pnpm build` no produce errores de validación de esquema en `src/content/config.ts`.

### 3. Semántica Web y Estructura de Contenido
- [ ] **Jerarquía de Encabezados:** No debe incluir `# ` (H1) en el cuerpo del Markdown (el layout lo inyecta desde el `title`). Las secciones principales deben usar `## ` (H2) y subsecciones `### ` (H3), sin saltos abruptos de nivel.
- [ ] **Accesibilidad en Imágenes:** Todas las imágenes insertadas (`![alt text](url)`) deben incluir un texto alternativo descriptivo.
- [ ] **Grafo de Enlaces Internos (Internal Linking):** Debe contener al menos **2–3 enlaces internos** a otros artículos o páginas de `arceapps.com` para transferir autoridad temática (*PageRank interno*).
- [ ] **Bibliografía y Citas:** Sección final `## Referencias` o `## Bibliografía` con fuentes primarias y documentación técnica.

### 4. Simetría Bilingüe (i18n)
- [ ] Todo post en `src/content/blog/es/<slug>.md` debe existir de forma simétrica en `src/content/blog/en/<slug>.md`.
- [ ] Enlaces en la versión ES deben apuntar estrictamente a rutas `/es/blog/<slug>/`.
- [ ] Enlaces en la versión EN deben apuntar estrictamente a rutas `/blog/<slug>/`.

---

## 📋 Formato del Veredicto

Devolver al agente redactor (Scribe o Bot-SEO) el siguiente bloque:

```markdown
## SEO Audit Result
Status: PASS | FAIL
Issues:
- [FAIL] title excede los 60 caracteres (actual: 68 chars).
- [WARN] description tiene 115 caracteres (rango óptimo: 120-160).
- [FAIL] No se encontraron enlaces internos a artículos relacionados de ArceApps.
- [WARN] La imagen "diagram.png" carece de texto alternativo (alt).
Suggestions:
- Reducir title a: "Koin vs. Hilt: Dependency Injection Architecture" (48 chars).
- Añadir enlace interno hacia: `/blog/clean-architecture/`.
- Completar descripción a 145 chars: "Compare Koin and Hilt for dependency injection in modern software. Discover benchmarks, performance trade-offs, and clean architectural patterns."
```

El redactor debe iterar hasta alcanzar **Status: PASS** antes de finalizar la tarea.
