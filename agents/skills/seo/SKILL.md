---
name: seo
description: "Suite integral de SEO para la web de ArceApps: integra OpenSEO MCP, auditorías técnicas estáticas de Astro, investigación de keywords, clustering, análisis de competencia, prospección de enlaces y validación de frontmatter/contenido."
---

# Suite SEO de ArceApps (OpenSEO & Astro Engine)

## Visión General
Esta suite centraliza todas las capacidades de optimización para motores de búsqueda (SEO) y descubrimiento orgánico de la **web de ArceApps** (`arceapps.com`). Integra protocolos abiertos (**OpenSEO MCP Server**), first-party data (**Google Search Console**) y validaciones técnicas directas sobre el framework **Astro** y colecciones **Markdown**.

> **Nota de Alcance:** Esta suite está dedicada exclusivamente al **SEO Web** (rastreo, indexación, Core Web Vitals, Schema.org y visibilidad en buscadores de escritorio y móvil). La optimización para tiendas de aplicaciones móviles (ASO / Google Play) es un área independiente no cubierta por esta suite.

---

## 📂 Catálogo Completo de Skills SEO

| Skill | Subdirectorio | Propósito Principal |
| :--- | :--- | :--- |
| **`openseo-audit`** | `audit/` | Auditoría técnica "The One Thing" + checklist estático local de Astro (canonicals, JSON-LD, sitemap, i18n, SVGs). |
| **`openseo-keyword-research`** | `keyword-research/` | Descubrimiento de keywords, análisis de dificultad (KD)/volumen y optimización de consultas *striking distance* (GSC). |
| **`openseo-keyword-clustering`** | `keyword-clustering/` | Agrupación de keywords por intención SERP y mapeo directo a URLs web, previniendo canibalizaciones. |
| **`openseo-competitor-analysis`** | `competitor-analysis/` | Análisis profundo de la huella orgánica, palabras clave y backlinks de un competidor web específico. |
| **`openseo-competitive-landscape`** | `competitive-landscape/` | Mapeo macro de líderes de mercado web, formatos de contenido ganadores y brechas de nicho. |
| **`openseo-link-prospecting`** | `link-prospecting/` | Prospección de páginas de recursos, menciones técnicas y diseño de outreach para enlaces de autoridad. |
| **`openseo-project-setup`** | `project-setup/` | Inicialización y persistencia de la memoria compartida del proyecto en OpenSEO (`get_project_context`). |
| **`openseo-local-seo`** | `local-seo/` | Auditoría de fichas Google Business y rankings geolocalizados en Google Maps. |
| **`openseo-coach`** | `seo-coach/` | Asesor interactivo para guiar al desarrollador en qué workflow ejecutar según su meta web. |
| **`write-blog-seo`** | `write-blog-seo/` | Validador exhaustivo de frontmatter, jerarquía de encabezados, textos alt, enlaces internos y naming. |

---

## 🤖 Agente Encargado
El **Bot-SEO** (`agents/bots/bot_SEO.md` / `agents/bots/bot_Radar.md`) es el agente responsable de orquestar y ejecutar estas herramientas en colaboración con **Scribe** (Redactor) y **Sentinel** (Seguridad/QA).
