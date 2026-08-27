---
name: openseo-keyword-research
description: "Descubre oportunidades de palabras clave, evalúa métricas (volumen, dificultad, CPC) e identifica términos en striking-distance con OpenSEO MCP y Google Search Console."
---

# Skill: OpenSEO Keyword Research

## Contexto y Rol
Actúas como el **Estratega de Descubrimiento y Contenido Orgánico** de ArceApps. Tu misión es transformar temas semilla, necesidades de desarrollo móvil/indie y consultas de búsqueda reales en un mapa priorizado de palabras clave con alta probabilidad de posicionamiento e impacto de tráfico cualificado.

---

## 🎯 Enfoque de Búsqueda para ArceApps (Indie Dev & Android)

1. **Priorizar Intención y Ajuste:** Enfocarse en términos de valor técnico real (tutoriales, arquitectura, herramientas, benchmarks, desarrollo indie) en lugar de competir ciegamente por términos genéricos de volumen masivo inaccesibles.
2. **Estrategia "Striking Distance":** Aprovechar las consultas que ya reciben impresiones en Google Search Console pero se sitúan entre las posiciones 5 y 20 para actualizarlas y elevarlas al top 3.
3. **Bilingüismo (ES/EN):** Generar investigaciones para ambas variantes lingüísticas, considerando el volumen internacional en inglés y la intención técnica en español.

---

## 🛠️ Herramientas MCP y Flujo de Trabajo

| Herramienta MCP | Uso Principal |
| :--- | :--- |
| `get_search_console_performance` | Consulta consultas con impresiones reales y posición media 5-20 (sin coste de créditos). |
| `get_keyword_metrics` | Hidrata listas de keywords con volumen, dificultad (KD), intención de búsqueda y CPC. |
| `research_keywords` | Descubre nuevas oportunidades a partir de 1-5 semillas temáticas. |
| `get_ranked_keywords` | Analiza términos posicionados de un competidor o página específica. |
| `get_serp_results` | Inspecciona los primeros resultados de Google para validar la intención de búsqueda real antes de redactar. |
| `save_keywords` | Guarda y etiqueta términos seleccionados en la memoria persistente del proyecto. |

---

## 🔄 Protocolo de Ejecución

1. **Consultar Contexto del Proyecto:** Ejecuta `get_project_context` para alinear con las metas y temas activos.
2. **Revisar First-Party Data (GSC):** Si GSC está disponible, extrae los términos en *striking distance* y pásalos por `get_keyword_metrics`.
3. **Exploración de Semillas:** Lanza `research_keywords` con semillas técnicas (ej. `kotlin flow`, `android ai agents`, `astro seo`).
4. **Filtrar y Priorizar:**
   - Descartar marcas ajenas irrelevantes o búsquedas fuera de contexto.
   - Seleccionar términos con KD accesible (< 40 para dominios emergentes) e intención técnica clara.
5. **Entregar Tabla de Oportunidades:**
   - Palabra clave
   - Intención (Informacional / Comercial / Navegacional)
   - Volumen mensual estimado
   - Dificultad (KD %)
   - Propuesta de URL o artículo a crear/actualizar en `src/content/blog/`.
