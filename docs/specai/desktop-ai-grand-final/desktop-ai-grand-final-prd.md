# Product Requirement Document (PRD): Desktop AI Agents Grand Final

Este documento define los requisitos funcionales, de contenido y de optimización para el artículo "La Gran Final" del torneo de agentes e IDEs de IA de escritorio de 2026.

## 1. Objetivos del Artículo
*   **Decisión Definitiva:** Evaluar y coronar al ganador del torneo de agentes de escritorio 2026 entre los cuatro finalistas: Codex App (OpenAI), Antigravity (Google), OpenCode Desktop y Hermes Desktop.
*   **Extensión y Rigor:** Escribir un artículo de al menos 8000 palabras por idioma con profundidad real (evitando resúmenes genéricos o TBDs).
*   **Bilingüismo:** Versiones en español e inglés completamente simétricas y adaptadas cultural y lingüísticamente.

## 2. Requisitos de Contenido

### 2.1 Estructura del Artículo
1.  **Gancho (Introducción):** Tono en primera persona ("Espíritu Indie") describiendo el cierre del torneo.
2.  **Metodología (El Benchmark de 10 Tareas):**
    *   Crear una app Flutter desde cero (persistencia local + diseño adaptativo).
    *   Corregir un bug complejo en Kotlin (hilos concurrentes + fugas de memoria).
    *   Refactorizar un proyecto de 50.000 líneas (Python 2 a 3 + tipado).
    *   Añadir autenticación (OAuth2 + almacenamiento seguro de tokens).
    *   Escribir tests (cobertura > 85% en microservicios).
    *   Crear documentación (OpenAPI 3.0 automático).
    *   Resolver un conflicto de Git (fusión multi-rama).
    *   Crear un servidor MCP (TS + conexión PostgreSQL).
    *   Ejecutar comandos en terminal (Docker Compose + variables).
    *   Navegar por Internet (APIs externas nuevas + depuración).
3.  **Análisis en Detalle (19 Categorías Clave):** Comparación exhaustiva de los cuatro agentes en cada una de las 19 categorías provistas por el usuario.
4.  **Matriz de Puntuaciones Estandarizada:** Tabla markdown con los puntajes exactos provistos por el usuario (máximo 100 puntos).
5.  **Veredicto Final y Premios:**
    *   🥇 Mejor agente de IA de escritorio: Codex App (OpenAI)
    *   🥈 Mejor calidad/precio: OpenCode Desktop
    *   🥉 Mejor Open Source: Hermes Desktop
    *   🏅 Mejor para principiantes: Codex App (OpenAI)
    *   🏅 Mejor para empresas: Antigravity (Google)
6.  **Bibliografía/Referencias:** Listado riguroso de fuentes oficiales y documentación de los proyectos.

## 3. Requisitos Técnicos y SEO

### 3.1 Naming y Slugs
*   **Slug:** `desktop-ai-grand-final` (sin stopwords, kebab-case).
*   **Archivos:**
    *   ES: `src/content/blog/es/desktop-ai-grand-final.md`
    *   EN: `src/content/blog/en/desktop-ai-grand-final.md`
*   **Fechas:** `pubDate` y `lastmod` fijados en `2026-07-09`.

### 3.2 Metadata SEO Obligatoria
*   **Title:** Debe contener la palabra clave principal ("Desktop AI" o similar) en las primeras 5 palabras y medir $\le 60$ caracteres.
*   **Description:** Rango de 120 a 160 caracteres con un verbo de acción.
*   **Keywords:** Array de 3 a 8 cadenas representativas.
*   **Canonical:** URL absoluta auto-generada.

### 3.3 Imagen de Portada
*   **Ubicación:** `public/images/desktop-ai-grand-final.svg`.
*   **Diseño:** Imagen SVG geométrica minimalista (1200x630px), usando estrictamente `#018786` (Teal) y `#FF9800` (Orange) sobre fondo oscuro o claro.

## 4. Criterios de Aceptación
1.  Ambos archivos de blog creados con contenido completo (> 8000 palabras cada uno).
2.  Imagen SVG creada y accesible en disco.
3.  Auditoría de SEO (`write-blog-seo`) devuelve `Status: PASS` para ambos archivos.
4.  `pnpm build` compila con éxito sin errores de tipado o esquemas de contenido Zod.
5.  Actualización de la bitácora del agente.
