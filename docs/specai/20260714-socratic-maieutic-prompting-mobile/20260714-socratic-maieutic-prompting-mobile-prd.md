# Product Requirement Document (PRD): Socratic & Maieutic Prompting in Mobile Development

Este documento define los requisitos funcionales, de contenido y técnicos para la redacción y publicación del artículo sobre Prompting Socrático y Maiéutico enfocado en desarrollo mobile (Android/iOS).

## 1. Objetivos del Artículo
*   **Análisis Técnico Profundo:** Explicar cómo el método socrático de Chang y el Maieutic Prompting de Jung et al. resuelven el problema del código "casi correcto" en el desarrollo móvil (Android/iOS) con herramientas de IA.
*   **Extensión de Gran Calidad:** Escribir un artículo de al menos **4000 palabras por idioma** (español e inglés) con profundidad técnica real y casos de estudio con código de producción.
*   **Bilingüismo:** Versiones en español e inglés completamente simétricas en contenido y estilo.
*   **Fecha de Publicación:** Fijada el 14 de julio de 2026 (`2026-07-14`).

## 2. Requisitos de Contenido (Estructura Macro)

El artículo debe estructurarse en las siguientes 16 secciones:

1.  **Resumen Ejecutivo [300 palabras]:**
    *   La analogía de la entrevista clínica vs. la búsqueda de Google.
    *   Presentación del prompting socrático y maiéutico como soluciones a la complacencia de los LLM (sicofancia).
2.  **El Problema de los Prompts Directos en Mobile Dev [400 palabras]:**
    *   Estadísticas de adopción y desconfianza (Stack Overflow 2025).
    *   El coste del código "casi correcto" en entornos móviles de recursos limitados (ej. LazyColumn con miles de elementos, rotaciones de pantalla, fugas de memoria).
3.  **El Método Socrático Aplicado a los LLMs [400 palabras]:**
    *   Análisis del paper de Chang (IEEE CCWC 2023).
    *   Las 6 técnicas socráticas y su mapeo sobre patrones modernos de prompting (RaR, Dialéctica, Elenchus, Maiéutica).
4.  **Las Tres Fases Operativas [400 palabras]:**
    *   Fase 1 (Preguntas únicamente), Fase 2 (Verificación de supuestos) y Fase 3 (Respuesta).
    *   La importancia decisional de cada fase para evitar asunciones incorrectas del modelo.
5.  **Caso de Estudio Android: Onboarding en Compose, Room y WorkManager [700 palabras]:**
    *   Implementación de código Kotlin/Compose modular.
    *   Detalle paso a paso del chat multiturno: la Fase 1 forzando preguntas de persistencia y adaptive layout, la Fase 2 consolidando asunciones y la Fase 3 con la alternativa de enmarcado (CMS remoto vs. local).
6.  **Caso de Estudio iOS: Almacenamiento Seguro con Swift 6, SwiftUI y Swift Concurrency [700 palabras]:**
    *   Implementación de código Swift usando el patrón Repository y Swift Concurrency (`@MainActor`, `async/await`).
    *   Detalle paso a paso del chat multiturno: forzando preguntas de target de iOS, ciclo de vida, concurrencia de Swift 6 y asunciones de GCD vs. async/await.
7.  **Maieutic Prompting y la Profundidad Abdutiva [500 palabras]:**
    *   Análisis del paper de Jung et al. (EMNLP 2022).
    *   Explicación de la construcción del árbol abdutivo de explicaciones y la resolución lógica con MAX-SAT.
    *   El patrón *Self-Ask* como la variante zero-shot para prompts cotidianos.
8.  **Casos de Uso de Alta Tensión en Mobile [300 palabras]:**
    *   Decisiones arquitectónicas donde el Maieutic Prompting brilla (cifrado en reposo, caching local vs. en memoria, paginación local vs. remota).
9.  **Seis Tipos de Preguntas Socráticas (Taxonomía de Paul) [400 palabras]:**
    *   Mapeo de la taxonomía de Richard Paul (1993) sobre prompts reales de desarrollo móvil.
10. **El Stack de IA para Mobile en 2025-2026 [400 palabras]:**
    *   Comparativa detallada de herramientas (Copilot, Cursor Composer, Claude Code, Gemini en Android Studio, JetBrains AI Assistant).
    *   El surgimiento de los modos agente nativos e interacciones desde apps móviles.
11. **Selección de Técnica: Socrático, Few-shot, CoT o Maieutic [450 palabras]:**
    *   Tabla comparativa de idoneidad, coste en tokens y problemas que resuelve cada técnica.
    *   Heurística para saber cuándo escalar el nivel de complejidad del prompt.
12. **Patrones Avanzados para Programadores Mobile [400 palabras]:**
    *   La especificación viva, el revisor socrático, el plan previo al código y el árbol de alternativas arquitectónicas.
13. **Límites y la Crisis de Confianza [300 palabras]:**
    *   Costes de latencia y consumo de tokens.
    *   La limitación de los modelos cuando el dominio es muy nicho o propietario.
14. **El Horizonte: Agentes Dialécticos y Verificación Formal [300 palabras]:**
    *   Setup multi-agente dialéctico interno.
    *   Integración futura de verificadores formales (compiladores, linters, fuzzers) podando ramas del árbol en tiempo de inferencia.
15. **Conclusión y CTA [300 palabras]:**
    *   Resumen del cambio de paradigma: descentralizar la carga de la especificación.
    *   Llamada a la acción e invitación al debate técnico.
16. **Referencias [200 palabras]:**
    *   Bibliografía detallada con enlaces y citas precisas a papers académicos y recursos del sector.

## 3. Requisitos Técnicos y SEO

### 3.1 Naming y Slugs
*   **Slug:** `socratic-maieutic-prompting-mobile-dev`
*   **Rutas de archivos:**
    *   ES: `src/content/blog/es/socratic-maieutic-prompting-mobile-dev.md`
    *   EN: `src/content/blog/en/socratic-maieutic-prompting-mobile-dev.md`
*   **Fechas:** `pubDate` y `lastmod` fijadas en `2026-07-14`.

### 3.2 Metadata SEO Obligatoria
*   **Título Frontmatter (SEO) [ES]:** `Prompting Socrático: Razonamiento Maiéutico en Mobile`
*   **Título Frontmatter (SEO) [EN]:** `Socratic Prompting: Maieutic Reasoning in Mobile Dev`
*   **Description (ES):** `Evita el código casi correcto en Android e iOS. Domina el prompting socrático y maiéutico con Gemini, Copilot y Cursor mediante guías de diálogo y código.`
*   **Description (EN):** `Avoid 'almost correct' code in Android & iOS. Master Socratic and Maieutic prompting with Gemini, Copilot, and Cursor using dialog flows and source code.`
*   **Keywords:** `["Socratic Prompting", "Maieutic Prompting", "Mobile Development", "Android Studio", "Xcode", "AI Agents", "Prompt Engineering"]`
*   **Canonical:** URL absoluta auto-generada por la build de Astro.

### 3.3 Recursos Visuales e Imágenes

#### Imágenes en Español (Copiadas desde Downloads)
*   `public/images/socratic-maieutic-prompting-mobile-hero-es.png` (Portada ES)
*   `public/images/socratic-maieutic-prompting-mobile-fases-es.png` (3 fases)
*   `public/images/socratic-maieutic-prompting-mobile-arbol-es.png` (Árbol maieutic)
*   `public/images/socratic-maieutic-prompting-mobile-preguntas-es.png` (6 preguntas Paul)
*   `public/images/socratic-maieutic-prompting-mobile-cuando-es.png` (¿Cuándo usar cada técnica?)

#### Imágenes en Inglés (Diseñadas como SVGs)
*   `public/images/socratic-maieutic-prompting-mobile-hero-en.svg` (Portada EN - SVG vectorizado con texto en inglés, patrón de circuitos/redes)
*   `public/images/socratic-maieutic-prompting-mobile-fases-en.svg` (SVG con las 3 fases traducidas)
*   `public/images/socratic-maieutic-prompting-mobile-arbol-en.svg` (SVG con el árbol abdutivo traducido)
*   `public/images/socratic-maieutic-prompting-mobile-preguntas-en.svg` (SVG con los 6 tipos de preguntas traducidos)
*   `public/images/socratic-maieutic-prompting-mobile-cuando-en.svg` (SVG con la escala de prompting traducida)

*   **Estilo SVG:** Fondo oscuro `#0F172A`, colores de marca `#018786` (Teal) y `#FF9800` (Orange), fuentes legibles (sans-serif/monospace), estructuración idéntica a las originales pero traducida a inglés de forma fluida y profesional.
