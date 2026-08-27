---
name: openseo-keyword-clustering
description: Agrupa palabras clave por intención de búsqueda y las mapea a URLs existentes o propuestas en la web de ArceApps, detectando y previniendo canibalizaciones SEO.
---

# Skill: OpenSEO Keyword Clustering & URL Mapping

## Objetivo y Contexto
Agrupar conjuntos de palabras clave por **intención de búsqueda** y definir qué página web existente (o nuevo post/página a crear en Astro) debe atacar cada cluster. 

Este flujo no es un simple agrupamiento semántico de texto: es un **mapeo estratégico de arquitectura web** para evitar que dos URLs de `arceapps.com` compitan entre sí por las mismas consultas (canibalización).

---

## 🛠️ Herramientas MCP y Fuentes de Datos

- `list_saved_keywords`: Obtiene palabras clave guardadas en el proyecto OpenSEO.
- `research_keywords`: Expande términos semilla cuando se explora una nueva categoría temática web.
- `get_ranked_keywords`: Extrae las URLs y rankings actuales de un dominio para mapear posiciones reales.
- `get_search_console_performance`: Consulta con `dimensions: ["query", "page"]` para ver qué páginas web ya reciben impresiones y detectar **canibalización real** (cuando una misma query reparte clics entre varias URLs).
- `get_serp_results`: Inspecciona las SERPs de Google para validar si dos términos comparten los mismos resultados orgánicos (mismo cluster) o requieren páginas web separadas.
- `save_keywords`: Etiqueta los clusters finales en la memoria del proyecto tras confirmación.

---

## 🔄 Flujo de Trabajo

1. **Recopilación de Términos:** Extraer las consultas reales desde Search Console (`query` + `page`) o mediante descubrimiento de keywords.
2. **Filtrado y Limpieza:** Eliminar duplicados, variantes irrelevantes y términos fuera de la temática de la web.
3. **Agrupación por Intención SERP:**
   - Si dos búsquedas muestran esencialmente los mismos tipos de páginas web en Google → Pertenecen al **mismo cluster y a la misma URL**.
   - Si la intención difiere (ej. tutorial técnico profundo vs. glosario breve vs. comparativa) → Se dividen en **páginas web separadas**.
4. **Asignación de URLs:**
   - Mapear a una URL existente en `src/content/blog/`, `src/pages/` o `src/content/apps/`.
   - Proponer un nuevo artículo en `src/content/blog/` si no existe página web para esa intención.
   - Marcar como "no priorizar" términos de baja relevancia técnica.
5. **Detección de Canibalización Web:** Identificar si múltiples artículos del blog compiten por la misma palabra clave principal y proponer fusión, canonicalización o redirección 301.

---

## 📋 Formato de Salida

Resumen del mapeo:
- Total de clusters identificados
- Páginas web a actualizar
- Nuevos artículos de blog a crear
- Alertas de canibalización detectadas

Tabla de Mapeo:

| Cluster | Keyword Principal | Keywords Secundarias | Intención | URL Objetivo en ArceApps | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |

Para cada cluster, entregar una breve pauta técnica para la página web:
- Tipo de página (`TechArticle`, `Hub`, `Landing`)
- Problema que resuelve al usuario
- Secciones mínimas necesarias (H2/H3)
- Oportunidades de enlaces internos cruzados
