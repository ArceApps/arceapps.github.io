# Diseño del Artículo: AI CLI Semifinal 1 (Reescritura Completa)

Este documento define la estructura, componentes y decisiones de diseño técnico para la reescritura desde cero de la Semifinal 1 del Torneo de herramientas CLI de IA.

## 1. Estructura Narrativa (Crónica Híbrida)

El artículo se estructurará siguiendo el **Enfoque 1 (Crónica de Torneo)**, enriquecido con **Fichas Técnicas rigurosas** para cada una de las 10 herramientas.

### Secciones del Artículo:
1. **El Gancho (Introducción):** 
   - El estado de la terminal en julio de 2026.
   - Por qué los programadores indie estamos migrando a la terminal.
   - Presentación de la Semifinal 1 (comparativa masiva de 10 herramientas).
2. **Las Reglas del Campo de Pruebas:**
   - Explicación del escenario general de pruebas: refactorización de un backend/servicio (por ejemplo, Express/Node.js o FastAPI/Python) integrando directrices de proyecto externas (`openspec`, `superpowers`).
   - Explicación de los 7 criterios de evaluación (1-10 puntos cada uno).
3. **El Análisis Individual (Las 10 Fichas Técnicas + Crónica de Uso):**
   - Para cada herramienta (Kimi Code, MiniMax, Mistral Vibe, Claude Code, GitHub Copilot CLI, Pi, Cline, Hermes, LLM, AIChat):
     - Ficha técnica rigurosa (Instalación, creador, backend de modelos, costos oficiales/suscripción).
     - Relato de la prueba en la terminal (DX, consumo de tokens en API, adherencia a `openspec` vs terquedad de flujo predefinido).
     - Puntuación detallada en las 7 categorías con justificación.
4. **Matriz Comparativa General e Infografías:**
   - Tabla comparativa que reúne las puntuaciones y especificaciones de las 10 herramientas.
   - Infografía Mermaid comparando el flujo de trabajo de un **Agente Autónomo de Bucle Cerrado** (ej. Claude Code / Cline) frente a un **Asistente Pasivo de Terminal** (ej. LLM CLI / AIChat).
   - Infografía Mermaid sobre la gestión de **Maleabilidad de Contexto (Adherencia a Skills)**: cómo el agente procesa las reglas del proyecto frente a su prompt de sistema nativo.
5. **Análisis Económico y Volumen de Trabajo por Presupuesto:**
   - Comparación del rendimiento real por $20 USD. 
   - El caso de Gemini vs Claude Sonnet.
   - Cuándo conviene usar modelos locales gratuitos (Ollama) con Mistral Vibe, Cline o Pi.
6. **El Veredicto Final de la Semifinal 1:**
   - Suma total de puntos (sobre 70) para cada herramienta.
   - Selección de los 2 ganadores indiscutibles que avanzan a la Gran Final.
7. **Bibliografía y Referencias:**
   - Enlaces oficiales de documentación y repositorios GitHub validados en internet.

---

## 2. Pautas Técnicas y de SEO (ArceApps Standard)

### Frontmatter Requerido (ES):
- **Title (≤ 60 chars):** `AI CLI Semifinal 1: La Batalla de los Agentes de Terminal` (57 caracteres)
- **Description (120-160 chars):** `Comparamos 10 herramientas CLI de IA en 2026: Claude Code, Cline, Vibe, Kimi, Pi y más. Fichas técnicas, costo real de API, obediencia a las skills y veredicto.` (158 caracteres)
- **Slug:** `cli-ai-semifinal-1`
- **Canonical:** `https://arceapps.com/blog/cli-ai-semifinal-1/`
- **Keywords:** `AI CLI`, `Claude Code`, `Cline`, `Mistral Vibe`, `Kimi Code CLI`, `Pi coding agent`, `terminal agents`
- **Reference ID:** `CLI-AI-SF1-2026-REWRITE-001`

### Frontmatter Requerido (EN):
- **Title (≤ 60 chars):** `AI CLI Semifinal 1: The Terminal Agent Showdown` (47 caracteres)
- **Description (120-160 chars):** `We compare 10 AI CLI tools in 2026: Claude Code, Cline, Vibe, Kimi, Pi, and more. Detailed specs, actual API costs, skill compliance, and final verdict.` (154 caracteres)
- **Slug:** `cli-ai-semifinal-1`
- **Canonical:** `https://arceapps.com/blog/cli-ai-semifinal-1/`
- **Keywords:** `AI CLI`, `Claude Code`, `Cline`, `Mistral Vibe`, `Kimi Code CLI`, `Pi coding agent`, `terminal agents`
- **Reference ID:** `CLI-AI-SF1-2026-REWRITE-001`

---

## 3. Especificación de la Imagen de Portada (SVG)

- **Archivo:** `public/images/cli-ai-semifinal-1.svg`
- **Estilo:** Geométrico minimalista, con formas abstractas que sugieran una terminal, loops y engranajes agénticos.
- **Paleta de Colores:**
  - Fondo oscuro: `#0F172A` (Slate 900)
  - Color Primario (Teal): `#018786`
  - Color Secundario (Orange): `#FF9800`
- **Dimensiones:** 1200x630px.

---

## 4. Plan de Verificación

- **Compilación:** `pnpm build` para asegurar que el validador estricto de esquemas MDX/Astro no falle y el tipado sea correcto.
- **SEO Audit:** Cargar la skill `write-blog-seo` para validar los campos del frontmatter de ambos archivos generados.
- **Extensión:** Medir el número de palabras en ambos idiomas (`wc -w`) para certificar que supera las 5000 palabras por artículo.
