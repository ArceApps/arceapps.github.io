# Bitácora de Radar (The SEO & Discoverability Engine) 📡

Registro de intervenciones, auditorías técnicas de SEO, optimización de palabras clave y mejoras de indexabilidad orgánica en el portfolio y blog de ArceApps.

---

## 2026-08-27 - Inicialización de la Suite Modular de SEO y Bot Radar (Issue #566)
**Estado:** Realizado  
**Análisis:** Se analizó el repositorio `every-app/open-seo` y su ecosistema de skills MCP (`seo-audit`, `keyword-research`, `competitor-analysis`, `seo-project-setup`). Se identificó la necesidad de estructurar una suite centralizada bajo `agents/skills/seo/` que combine las capacidades avanzadas de OpenSEO MCP con las validaciones técnicas locales de Astro y Markdown de ArceApps.  
**Cambios:**
1. Creada la carpeta modular `agents/skills/seo/` con los submódulos:
   - `audit/SKILL.md`: Auditoría técnica bajo el principio "The One Thing" + validaciones de Astro (canonicals, Schema JSON-LD, sitemaps, i18n).
   - `keyword-research/SKILL.md`: Descubrimiento de keywords, análisis de dificultad e hidratación de términos *striking distance* de Search Console.
   - `competitor-analysis/SKILL.md`: Análisis de huella orgánica y brechas de contenido en competidores del nicho.
   - `project-setup/SKILL.md`: Gestión de memoria persistente de proyecto en OpenSEO (`get_project_context`/`update_project_context`).
   - `write-blog-seo/SKILL.md`: Validación de frontmatter, naming y metadatos pre-publicación.
   - `SKILL.md`: Orquestador principal de la suite SEO.
2. Definido el bot `agents/bots/bot_Radar.md` (y alias `bot_SEO.md`) para liderar la optimización y auditoría continua.
3. Actualizada la documentación de `AGENTS.md` y `.opencode/opencode.json`.  
**Aprendizaje:** Unificar las skills de OpenSEO bajo una suite modular con un bot dedicado permite separar claramente las responsabilidades de redacción (Scribe) y control de calidad/seguridad (Sentinel), dotando a ArceApps de una arquitectura de descubrimiento orgánico reproducible y libre de dependencias propietarias costosas.
