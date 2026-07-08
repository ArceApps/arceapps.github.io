# AI CLI Semifinal 1 Rewrite Implementation Plan

**Goal:** Reescribir desde cero el artículo de la primera semifinal del torneo de herramientas CLI de IA en español e inglés, comparando un set específico de 10 herramientas reales y actualizando la portada SVG.
**Architecture:** Creación de un post de blog con narrativa híbrida de crónica y ficha técnica profunda, incluyendo infografías en tablas y Mermaid. La portada se actualiza con un nuevo SVG minimalista de marca.
**Tech Stack:** Astro 5.16.3, Markdown, SVG, Mermaid.
**Status:** 🟢 BACKLOG

---

## Acceptance Criteria

- [ ] El artículo en español se encuentra en `src/content/blog/es/cli-ai-semifinal-1.md` y cuenta con un mínimo de 5000 palabras de contenido riguroso.
- [ ] El artículo en inglés se encuentra en `src/content/blog/en/cli-ai-semifinal-1.md` y cuenta con un mínimo de 5000 palabras de contenido riguroso simétrico.
- [ ] Ambos artículos analizan en detalle las 10 herramientas requeridas y las puntúan del 1 al 10 en las 7 categorías de evaluación aprobadas.
- [ ] Ambos artículos incorporan diagramas comparativos Mermaid (de flujo de bucle cerrado vs pasivo y de adherencia a directrices de proyecto externas).
- [ ] La portada SVG se sobrescribe en `public/images/cli-ai-semifinal-1.svg` usando exclusivamente colores de marca Teal (`#018786`) y Orange (`#FF9800`) sobre fondo oscuro.
- [ ] La compilación `pnpm build` finaliza exitosamente sin errores de schema o build de Astro.
- [ ] La auditoría de la skill `write-blog-seo` (frontmatter exitoso) pasa con estado PASS en ambos archivos.

## Constraints & Guardrails

- No utilizar jerga corporativa, mantener 100% el Espíritu Indie y tono de artesano de software en chat y artículos.
- Seguir fielmente la información fidedigna de las fichas técnicas obtenida en la investigación real por internet.
- Los slugs y referencias cruzadas entre artículos existentes del blog deben ser correctos.

---

## Task List

Consulte el desglose detallado de tareas en el archivo: [20260708-cli-ai-semifinal-1-rewrite-tasks.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/docs/specai/20260708-cli-ai-semifinal-1-rewrite/20260708-cli-ai-semifinal-1-rewrite-tasks.md)
