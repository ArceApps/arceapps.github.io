# Open Knowledge Format (OKF) Blog Post Task List

Este es el listado detallado de tareas para la implementación atómica del artículo sobre OKF de Google.

## Phase 1: Setup & Assets
- [ ] **Task 1.1:** Crear rama de desarrollo `feature/arceapps_okf-blog-post`.
  - *Verify seam:* `git branch` muestra que estamos en la rama correcta.
- [ ] **Task 1.2:** Generar la imagen de portada SVG `public/images/open-knowledge-format-google.svg` con dimensiones 1200x630px y paleta Teal (`#018786`) y Orange (`#FF9800`) sobre fondo oscuro (`#0F172A`).
  - *Verify seam:* La imagen se abre correctamente y se puede verificar visualmente.

## Phase 2: Español Article Writing (ES)
- [ ] **Task 2.1:** Escribir Frontmatter y Secciones 1 a 4 de `src/content/blog/es/open-knowledge-format-google.md` (Apertura, Por qué ahora, Problema de fondo, Qué es OKF).
  - *Verify seam:* El archivo se crea y se valida la legibilidad del texto preliminar.
- [ ] **Task 2.2:** Escribir Secciones 5 a 7 (Anatomía con diagramas Mermaid, Principios de diseño, Linaje y Karpathy).
  - *Verify seam:* La sintaxis de los diagramas Mermaid es correcta.
- [ ] **Task 2.3:** Escribir Secciones 8 a 11 (Ejemplo práctico, Comparativa, Lo que NO es OKF, A quién le sirve).
  - *Verify seam:* Se incluyen las referencias cruzadas y los enlaces a los artículos del blog existentes (`agents-md-estandar.md`, `obsidian-desarrolladores.md`, `contexto-efectivo-ia.md`).
- [ ] **Task 2.4:** Escribir Secciones 12 a 14 (Críticas y riesgos, Opinión personal, Cierre y CTA) en la versión en Español.
  - *Verify seam:* Conteo de palabras en español supera las 3200 palabras (`wc -w src/content/blog/es/open-knowledge-format-google.md`).

## Phase 3: Inglés Article Writing (EN)
- [ ] **Task 3.1:** Escribir Frontmatter y Secciones 1 a 4 de `src/content/blog/en/open-knowledge-format-google.md` en inglés.
  - *Verify seam:* El archivo se crea y se valida que la traducción es conceptualmente equivalente y fluye bien.
- [ ] **Task 3.2:** Escribir Secciones 5 a 7 en inglés.
  - *Verify seam:* Los diagramas Mermaid coinciden exactamente con la versión en español en estructura.
- [ ] **Task 3.3:** Escribir Secciones 8 a 11 en inglés.
  - *Verify seam:* Los enlaces y referencias a los posts anteriores apuntan a la versión en inglés (`en/`).
- [ ] **Task 3.4:** Escribir Secciones 12 a 14 en inglés.
  - *Verify seam:* Conteo de palabras en inglés supera las 3200 palabras (`wc -w src/content/blog/en/open-knowledge-format-google.md`).

## Phase 4: Validation & Quality Assurance
- [ ] **Task 4.1:** Ejecutar la auditoría SEO local en ambos archivos Markdown para garantizar la conformidad con los metadatos.
  - *Verify seam:* Validar title (<= 60 chars), description (120-160 chars), keywords, lastmod y canonical.
- [ ] **Task 4.2:** Ejecutar la compilación del proyecto Astro para validar que no haya errores de esquemas Zod o tipados.
  - *Verify seam:* El comando `pnpm build` finaliza con éxito.
- [ ] **Task 4.3:** Registrar la actividad en la bitácora del agente `agents/bitacora/bitacora_scribe.md`.
  - *Verify seam:* El log refleja los cambios y la fecha actual real.
