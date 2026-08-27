# Bitácora de Bot-SEO (Radar) 📡

Registro de intervenciones, auditorías técnicas de SEO, optimización de palabras clave y mejoras de indexabilidad orgánica en la web de ArceApps.

---

## 2026-08-27 - Importación Completa de la Suite OpenSEO y Configuración de Bot-SEO (Issue #566)
**Estado:** Realizado  
**Análisis:** Se revisó el repositorio `every-app/open-seo` y se importó la suite completa de habilidades adaptándolas rigurosamente a la optimización de motores de búsqueda para la **web** (`arceapps.com`), clarificando la distinción entre SEO Web y ASO (App Store Optimization para móviles).  
**Cambios:**
1. Importada y adaptada la suite completa de OpenSEO bajo `agents/skills/seo/`:
   - `audit/`: Auditoría técnica "The One Thing" + checklist estático de Astro (canonicals, Schema JSON-LD, sitemap, i18n).
   - `keyword-research/`: Descubrimiento de keywords y términos en *striking distance* de Search Console.
   - `keyword-clustering/`: Agrupación por intención SERP y prevención de canibalización de URLs web.
   - `competitor-analysis/`: Análisis profundo de competidores web y *content gaps*.
   - `competitive-landscape/`: Mapeo macro de nichos y líderes orgánicos en la web.
   - `link-prospecting/`: Prospección de páginas de recursos, recopilatorios y menciones técnicas.
   - `local-seo/`: Auditoría de fichas Google Business y posicionamiento en Maps.
   - `project-setup/`: Gestión de memoria persistente de proyecto en OpenSEO (`get_project_context`).
   - `seo-coach/`: Asesor interactivo de flujos y toma de decisiones SEO.
   - `write-blog-seo/`: Validador enriquecido con jerarquía de encabezados, textos alt en imágenes, densidad de enlaces internos (grafo temático) y frontmatter Zod.
   - `SKILL.md`: Catálogo y orquestador central de la suite.
2. Definido el bot `agents/bots/bot_SEO.md` (y `bot_Radar.md`) como especialista técnico de SEO Web.
3. Actualizada la documentación en `AGENTS.md` y `.opencode/opencode.json`.  
**Aprendizaje:** Mantener un límite conceptual estricto entre SEO Web (rastreo de páginas HTML, marcado Schema, sitemaps) y ASO móvil evita mezclar métricas de tiendas de apps con la visibilidad orgánica de la plataforma web en buscadores.
