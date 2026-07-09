# Product Requirement Document (PRD): Open Knowledge Format (OKF) Blog Post

Este documento define los requisitos funcionales, de contenido y técnicos para la redacción y publicación del artículo sobre el formato OKF (Open Knowledge Format) lanzado por Google Cloud.

## 1. Objetivos del Artículo
*   **Divulgación y Análisis Crítico:** Explicar qué es OKF de Google Cloud, qué problemas resuelve en la ingeniería de contexto para agentes de IA y ofrecer un análisis objetivo (no corporativo, ni fanboy ni hater) desde la perspectiva de un desarrollador indie.
*   **Extensión de Gran Calidad:** Escribir un artículo de entre 3.200 y 3.500 palabras por idioma (español e inglés) con profundidad técnica real y ejemplos prácticos completos.
*   **Bilingüismo:** Versiones en español e inglés completamente simétricas en contenido y estilo, adaptadas para los respectivos públicos del blog de ArceApps.
*   **Fecha de Publicación:** Fijada el 12 de julio de 2026 (`2026-07-12`).

## 2. Requisitos de Contenido (Estructura Macro)

El artículo debe estructurarse en las siguientes 14 secciones:

1.  **Apertura (El Gancho) [250-300 palabras]:**
    *   Escena en segunda persona describiendo la frustración de entrenar a un agente de soporte con PDFs y Notion sin que aprenda realmente el contexto del negocio (efecto "becario brillante que no sabe dónde está el café").
    *   Planteamiento del problema técnico: falta de contexto portable.
    *   Planteamiento de la tesis: Lanzamiento silencioso de OKF por Google Cloud el 12 de junio de 2026, un estándar abierto que podría cambiar cómo construimos agentes.
2.  **Por qué este tema y por qué ahora [200-250 palabras]:**
    *   Contexto del debate actual (concentrado en círculos técnicos en inglés).
    *   Ventana de oportunidad para aprenderlo.
    *   Trayectoria de Google en "knowledge management" (Knowledge Graph, Vertex AI Search) y la novedad de OKF como estándar abierto y neutral (Apache 2.0).
    *   Promesa del post (revisión completa en 15 minutos).
3.  **El problema de fondo [400-450 palabras]:**
    *   *3.1 El caos del conocimiento organizacional:* dispersión de la información en Notion, Slack, Drive (60-80% de datos no estructurados según IDC/Gartner).
    *   *3.2 Agentes listos pero ignorantes:* limitaciones de meter contexto en prompts, RAG clásico (costoso, opaco, complejo) y sistemas de metadatos propietarios.
    *   *3.3 Islas de conocimiento:* pérdida de portabilidad de contexto entre agentes y proveedores de LLM.
4.  **Qué es OKF, exactamente [350-400 palabras]:**
    *   Definición corta: Estándar abierto v0.1 (Draft) publicado por Google Cloud el 12 de junio de 2026 (Licencia Apache 2.0).
    *   Definición larga: Especificación para representar conocimiento organizacional en Markdown legible por humanos y máquinas sin SDK ni runtime. "OKF formalizes the LLM-wiki pattern into a portable, interoperable format".
    *   Lo que NO es: No es plataforma, API, SaaS ni esquema JSON complejo.
5.  **La anatomía de un Bundle OKF [500-600 palabras]:**
    *   Componentes: *Concept* (.md), *Bundle* (directorio + bundle.yaml), *Frontmatter* (YAML con campo obligatorio `type`), *Grafo* (enlaces Markdown).
    *   Ejemplo de código: Estructura de carpetas de `.okf/` y ejemplo completo de un concepto (métrica de tasa de abandono del carrito en BigQuery con enlaces a runbooks y otros conceptos) y de `bundle.yaml`.
6.  **Los tres principios de diseño [300-350 palabras]:**
    *   "Just Markdown" (independencia de parser).
    *   "Just files" (directorio versionable con git, sin bases de datos).
    *   "Just YAML frontmatter" (mínima estructura necesaria).
    *   Cita literal: *"No inventamos nada. Es Markdown. Es un archivo. Es un poquito de YAML. Es el formato que tu equipo ya estaba usando de manera informal, pero ahora con un nombre y unas reglas."* — Google Cloud.
7.  **El linaje: De Obsidian a Karpathy a Google [400-450 palabras]:**
    *   La evolución del wiki personal en Markdown (Obsidian, Notion, Logseq).
    *   El "LLM Wiki pattern" propuesto por Andrej Karpathy a finales de 2024 en un gist.
    *   Aparición de `AGENTS.md` y `CLAUDE.md`.
    *   La necesidad del estándar mínimo que Google formaliza con OKF (comparación histórica con la creación de Markdown en 2004 por Aaron Swartz y John Gruber).
8.  **Ejemplo práctico paso a paso [350-400 palabras]:**
    *   Tutorial rápido para montar un bundle en 5 minutos.
    *   Cómo lo consume un agente de forma barata y explicable en comparación con RAG.
    *   Mención a las herramientas de referencia de Google (generación automática de docs para BigQuery, enriquecimiento con LLM, y visualizador HTML estático del grafo).
9.  **Comparativa: OKF vs. lo que usábamos antes [400-450 palabras]:**
    *   OKF vs. RAG clásico (búsqueda semántica masiva vs. conocimiento curado de alto valor).
    *   OKF vs. AGENTS.md / CLAUDE.md (instrucciones para un agente en un repo vs. grafo de conocimiento portable cross-project).
    *   OKF vs. Notion/wikis propietarios (API propietaria vs. texto plano versionable).
    *   OKF vs. esquemas JSON / RDF / OWL (ontologías complejas de máquina vs. Markdown comprensible por humanos).
10. **Lo que OKF NO es [300-350 palabras]:**
    *   No afecta el ranking de SEO de Google Search (no es un factor de ranking web).
    *   Ningún LLM público (ChatGPT, Claude, Gemini) lo crawlea automáticamente en la web.
    *   No es un producto oficial de Google (es un Draft v0.1 en GitHub "not an official Google product").
    *   No es mágico (si tu conocimiento está mal escrito, OKF no lo arregla).
11. **¿A quién le sirve hoy de verdad? [300-350 palabras]:**
    *   Equipos de datos internos (BigQuery, Snowflake, Databricks).
    *   Equipos de desarrollo de agentes que consumen datos del negocio.
    *   Proyectos open source (documentar la arquitectura estructurada para Codex/Claude Code).
    *   Makers y proyectos personales.
12. **Críticas y riesgos [300-350 palabras]:**
    *   Problema de adopción: Dependencia de que la comunidad y otros proveedores (Anthropic, OpenAI) lo apoyen.
    *   Drift corporativo: Herramientas de referencia muy ligadas a GCP (BigQuery).
    *   Fragilidad por simplicidad: Dificultad para añadir features avanzadas (relaciones tipadas, versionado) sin romper su minimalismo.
    *   La dificultad real sigue siendo curar el conocimiento.
13. **Mi opinión (extendida) [350-400 palabras]:**
    *   Lo bueno: Apertura genuina (Apache 2.0) y simplicidad brillante.
    *   Lo que hay que vigilar: Gobernanza futura y hype comercial no justificado (ventas de "SEO para IA").
    *   Predicción suave a 12-18 meses: 60% se queda, 40% muere.
14. **Cierre + CTA [200-250 palabras]:**
    *   Resumen del concepto OKF en una frase.
    *   Anuncio del próximo post (ejemplo de código consumido por un agente real).
    *   Preguntas de debate abiertas para comentarios.

## 3. Requisitos Técnicos y SEO

### 3.1 Naming y Slugs
*   **Slug:** `open-knowledge-format-google`
*   **Rutas de archivos:**
    *   ES: `src/content/blog/es/open-knowledge-format-google.md`
    *   EN: `src/content/blog/en/open-knowledge-format-google.md`
*   **Fechas:** `pubDate` y `lastmod` del frontmatter deben ser `2026-07-12`.

### 3.2 Metadata SEO Obligatoria
*   **Título Frontmatter (SEO):** `OKF de Google: Qué es y por qué te importa` (45 caracteres).
*   **Título H1 (Visual):** `OKF: lo que Google acaba de lanzar (y por qué debería importarte aunque no uses Google)`
*   **Description:** Entre 120 y 160 caracteres con un verbo de acción claro.
*   **Keywords:** Array de 3 a 8 cadenas (ej. `["OKF", "Google Cloud", "AI Agents", "Context Engineering", "Markdown"]`).
*   **Canonical:** URL absoluta auto-generada.

### 3.3 Recursos Visuales
*   **Hero Image:** `/images/open-knowledge-format-google.svg` (SVG geométrico minimalista de 1200x630px con colores `#018786` Teal y `#FF9800` Orange sobre fondo `#0F172A`).
*   **Diagramas Mermaid:**
    1.  Estructura de directorios de un bundle en el apartado 5.
    2.  Grafo de interconexión de conceptos ( checkout -> abandonos -> runbooks ) en el apartado 5.
    3.  Comparación visual de flujos antes vs. después en el apartado 9.

## 4. Criterios de Aceptación
1.  Ambos archivos de blog creados con contenido completo y sin TBDs (> 3200 palabras cada uno).
2.  Imagen SVG creada en `public/images/open-knowledge-format-google.svg`.
3.  La auditoría de SEO con la herramienta correspondiente devuelve `PASS` para ambos archivos.
4.  `pnpm build` compila con éxito en el sistema local sin advertencias ni errores.
5.  Registro de actividades guardado en la bitácora del agente.
