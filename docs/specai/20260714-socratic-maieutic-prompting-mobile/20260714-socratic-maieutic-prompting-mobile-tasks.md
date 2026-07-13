# Socratic & Maieutic Prompting Blog Post Task List

Este es el listado de tareas atómicas para la redacción de los artículos y el procesamiento de sus imágenes.

## Phase 1: Setup & Assets
- [x] **Task 1.1:** Copiar las 5 imágenes en español desde `/home/arceappspc/Descargas/` a `public/images/` renombrándolas correspondientemente.
  - *Verify seam:* `ls -la public/images/socratic-maieutic-prompting-mobile-*-es.png` devuelve exactamente 5 archivos.
- [ ] **Task 1.2:** Crear la imagen SVG de la portada en inglés `public/images/socratic-maieutic-prompting-mobile-hero-en.svg` (Smartphone con circuito/redes, texto traducido).
  - *Verify seam:* El archivo SVG existe y se renderiza correctamente.
- [ ] **Task 1.3:** Crear las 4 infografías en inglés en formato SVG (`socratic-maieutic-prompting-mobile-fases-en.svg`, `socratic-maieutic-prompting-mobile-arbol-en.svg`, `socratic-maieutic-prompting-mobile-preguntas-en.svg`, `socratic-maieutic-prompting-mobile-cuando-en.svg`).
  - *Verify seam:* Todos los textos están correctamente traducidos al inglés y no se solapan.

## Phase 2: Español Article Writing (ES)
- [ ] **Task 2.1:** Escribir Frontmatter y Secciones 1 a 4 en `src/content/blog/es/socratic-maieutic-prompting-mobile-dev.md` (Resumen, Problema de prompts directos, Método socrático en LLMs, Tres fases).
  - *Verify seam:* El archivo de blog ES se crea y el texto preliminar es legible.
- [ ] **Task 2.2:** Escribir Secciones 5 y 6 (Caso de estudio de Android en Compose/Room/WorkManager y Caso de estudio de iOS en Swift 6/SwiftUI/Concurrency).
  - *Verify seam:* El código compila mentalmente y las plantillas de prompts multiturno están estructuradas correctamente.
- [ ] **Task 2.3:** Escribir Secciones 7 a 11 (Maieutic Prompting, Casos de uso de alta tensión, Taxonomía de Paul, Stack IA 2025-2026, Comparativa de técnicas).
  - *Verify seam:* Incluye referencias cruzadas a otros posts como `socratic-method-prompts-kotlin-android.md`.
- [ ] **Task 2.4:** Escribir Secciones 12 a 16 (Patrones avanzados, Límites y crisis de confianza, Horizonte y agentes dialécticos, Conclusión, Referencias).
  - *Verify seam:* El recuento total de palabras supera las 4000 palabras (`wc -w src/content/blog/es/socratic-maieutic-prompting-mobile-dev.md`).

## Phase 3: Inglés Article Writing (EN)
- [ ] **Task 3.1:** Escribir Frontmatter y Secciones 1 a 4 en `src/content/blog/en/socratic-maieutic-prompting-mobile-dev.md`.
  - *Verify seam:* La traducción conceptual es sólida y respeta el tono técnico.
- [ ] **Task 3.2:** Escribir Secciones 5 y 6 en inglés (Casos de estudio Android e iOS).
  - *Verify seam:* El código fuente de Compose y SwiftUI coincide con la versión española pero con comentarios en inglés.
- [ ] **Task 3.3:** Escribir Secciones 7 a 11 en inglés.
  - *Verify seam:* Las referencias cruzadas apuntan a las versiones en inglés correspondientes (en el path `en/`).
- [ ] **Task 3.4:** Escribir Secciones 12 a 16 en inglés.
  - *Verify seam:* El recuento total de palabras en inglés supera las 4000 palabras (`wc -w src/content/blog/en/socratic-maieutic-prompting-mobile-dev.md`).

## Phase 4: Validation & Quality Assurance
- [ ] **Task 4.1:** Ejecutar la validación SEO para asegurar metadatos correctos (Title, Description, Keywords, Canonical, etc.).
  - *Verify seam:* Los metadatos de Frontmatter son correctos en ambos archivos.
- [ ] **Task 4.2:** Ejecutar la compilación del proyecto Astro para validar que no haya errores de esquemas Zod o tipados.
  - *Verify seam:* `pnpm build` se ejecuta y finaliza con éxito.
- [ ] **Task 4.3:** Registrar la actividad en la bitácora del agente `agents/bitácora/bitacora_scribe.md` (o `agents/bitacora/...`).
  - *Verify seam:* El archivo log en la bitácora refleja fielmente los cambios realizados y la fecha actual del sistema.
