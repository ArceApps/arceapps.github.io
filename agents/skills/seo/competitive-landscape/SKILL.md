---
name: openseo-competitive-landscape
description: Mapea líderes de mercado orgánico en la web, temas de contenido dominantes, cobertura de palabras clave y brechas estratégicas de posicionamiento web.
---

# Skill: OpenSEO Competitive Landscape (Panorama Competitivo Web)

## Objetivo y Contexto
Responder a la pregunta: *"¿Quién domina las búsquedas orgánicas en este nicho técnico, qué formatos y contenidos web les están funcionando, y dónde están las brechas que ArceApps puede ganar?"*

Se utiliza para obtener una **visión global del mercado web** a través de múltiples dominios competidores. Para analizar un dominio específico en detalle, se utiliza `openseo-competitor-analysis`.

---

## 🛠️ Herramientas MCP

- `research_keywords`: Descubre consultas representativas de la categoría web.
- `get_keyword_metrics`: Valida la dificultad (KD), volumen e intención de las búsquedas representativas.
- `find_serp_competitors`: Identifica automáticamente los dominios que compiten con mayor frecuencia en las SERPs de Google para el conjunto de keywords.
- `get_domain_overview`: Mide el tamaño del tráfico orgánico estimado y el volumen de keywords de los sitios líderes.
- `get_search_console_performance`: Ancla la posición real de `arceapps.com` usando datos reales de primera mano (clics, impresiones, CTR).
- `get_ranked_keywords`: Extrae las URLs y tipos de resultados donde rankean los líderes.
- `get_backlinks_overview`: Compara la autoridad y perfiles de enlaces entrantes entre los competidores web.

---

## 🔄 Flujo de Trabajo

1. **Definir Conjunto de Búsquedas del Nicho:** Seleccionar de 5 a 10 consultas representativas con intención variada (técnicas, guías, comparativas, herramientas).
2. **Identificar Dominios Recurrentes:** Ejecutar `find_serp_competitors` o `get_serp_results` para detectar qué sitios web copan las primeras posiciones.
3. **Clasificar los Tipos de Sitios Web:**
   - Blogs técnicos y creadores independientes.
   - Documentaciones oficiales y plataformas educativas.
   - Medios y publicaciones especializadas.
   - Foros y comunidades (Reddit, StackOverflow).
4. **Evaluar Brechas y Oportunidades (*Content Gaps*):**
   - Temas con alta demanda pero cubiertos con guías obsoletas o superficiales.
   - Formatos ganadores (benchmarks reales, código interactivo, diagramas visuales).
5. **Guardar Competidores Relevantes:** Persistir los dominios más importantes en la memoria del proyecto con `update_project_context` (`addCompetitors`).

---

## 📋 Formato de Salida

- Diagnóstico general del panorama orgánico web.
- Área de oportunidad con mayor probabilidad de posicionar a corto/medio plazo.
- Tabla comparativa de dominios líderes:

| Dominio Web | Tipo de Sitio | Por qué importa | Huella Orgánica | Temas Ganadores | Vulnerabilidad / Brecha |
| :--- | :--- | :--- | :--- | :--- | :--- |

- Recomendaciones de acción directa para el blog y páginas de ArceApps.
