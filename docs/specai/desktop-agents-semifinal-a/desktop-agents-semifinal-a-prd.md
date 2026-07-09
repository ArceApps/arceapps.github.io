# PRD: Semifinal A - Agentes IA de Escritorio

Este documento de requerimientos formales (PRD) define la eliminación de los artículos obsoletos de IDEs de escritorio y la creación del nuevo artículo bilingüe de la Semifinal A de Agentes de Escritorio.

## 1. Objetivos del Negocio e "Espíritu Indie"
*   **Limpieza de Contenido:** Eliminar artículos y recursos obsoletos que comparaban IDEs de escritorio tradicionales con IA para evitar confusión y solapamiento.
*   **Nuevo Artículo Técnico:** Publicar una comparativa de alta calidad (5000+ palabras por idioma) con un enfoque en agentes con ventana gráfica (desktop agents).
*   **Tono de Redacción:** Tono de Scribe de desarrollador indie, honesto, pragmático, alejado de la jerga B2B o corporativa.

## 2. Requerimientos de Contenido

### 2.1 Estructura del Artículo
El artículo debe organizarse en base a la siguiente narrativa en español e inglés de forma simétrica:
1.  **Gancho/Introducción:** El salto tecnológico de autocompletado simple a sistemas operativos de desarrollo y agentes autónomos.
2.  **Los 10 Competidores:**
    *   **Codex App (OpenAI)**
    *   **Claude Desktop / Claude Code (Anthropic)**
    *   **Antigravity (Google)**
    *   **GitHub Copilot Workspace**
    *   **Windsurf (Codeium)**
    *   **Cursor**
    *   **Le Chat / Mistral Vibe (Mistral AI)**
    *   **Kimi Code (Moonshot AI)**
    *   **MiniMax Code (MiniMax AI)**
    *   **Qwen Code (Alibaba)**
3.  **Selección de Finalistas:**
    *   **Codex App (OpenAI):** Plan/Build mode y estabilidad a nivel OS.
    *   **Antigravity (Google):** Paralelización y contexto masivo.
4.  **Prior Art / Continuidad:** Enlazar los artículos del torneo CLI de forma natural para contextualizar la transición a interfaces de escritorio.
5.  **Referencias/Bibliografía:** Sección final con enlaces y documentación técnica.

### 2.2 Requerimientos SEO (Innegociables)
*   **Título:** Menor o igual a 60 caracteres. Debe contener la herramienta o sujeto en las primeras 5 palabras.
*   **Slug:** `desktop-ai-agents-semifinal-a` (kebab-case, en inglés, sin stopwords).
*   **Descripción:** 120-160 caracteres, incluyendo la palabra clave y un verbo de acción.
*   **Keywords:** Array de 3 a 8 cadenas.
*   **Canonical:** URL absoluta (`https://arceapps.com/blog/desktop-ai-agents-semifinal-a/`).
*   **Fecha de Publicación (`pubDate` y `lastmod`):** `2026-07-09`.

## 3. Requerimientos Técnicos

### 3.1 Archivos a Eliminar
*   `src/content/blog/es/ai-ide-closed-ecosystem.md`
*   `src/content/blog/es/ai-ide-open-ecosystem.md`
*   `src/content/blog/es/ai-ide-tournament-grand-final.md`
*   `src/content/blog/en/ai-ide-closed-ecosystem.md`
*   `src/content/blog/en/ai-ide-open-ecosystem.md`
*   `src/content/blog/en/ai-ide-tournament-grand-final.md`
*   `public/images/ai-ide-closed-ecosystem-semifinal.svg`
*   `public/images/ai-ide-open-ecosystem-semifinal.svg`
*   `public/images/ai-ide-tournament-grand-final.svg`

### 3.2 Archivos a Crear
*   `src/content/blog/es/desktop-ai-agents-semifinal-a.md`
*   `src/content/blog/en/desktop-ai-agents-semifinal-a.md`
*   `public/images/desktop-ai-agents-semifinal-a.svg` (SVG 1200x630px, colores Teal `#018786`, Orange `#FF9800`, fondo oscuro `#0F172A`).

## 4. Criterios de Aceptación
*   [ ] Ambos artículos (ES/EN) tienen más de 5000 palabras de contenido técnico real.
*   [ ] Las páginas compilan y validan contra el esquema Zod en `src/content/config.ts`.
*   [ ] La auditoría de SEO pasa al 100% (título <= 60, descripción 120-160, slug sin stopwords).
*   [ ] Los enlaces anteriores de IDEs fueron removidos del blog y no quedan rutas huérfanas.
*   [ ] Los enlaces a los artículos de CLI AI funcionan correctamente en la nueva publicación.
