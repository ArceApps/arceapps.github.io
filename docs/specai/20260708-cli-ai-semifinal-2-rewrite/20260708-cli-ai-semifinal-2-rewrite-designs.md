# Diseño del Artículo: AI CLI Semifinal 2 (Reescritura Completa)

Este documento define la estructura, componentes y decisiones de diseño técnico para la reescritura desde cero de la Semifinal 2 del Torneo de herramientas CLI de IA.

## 1. Estructura Narrativa (Crónica Híbrida - Simétrica a Semifinal 1)

El artículo seguirá la misma estructura que la Semifinal 1: una crónica de pruebas en vivo sobre un escenario de desarrollo general, combinada con fichas técnicas rigurosas de cada programa.

### Secciones del Artículo:
1. **El Gancho (Introducción):**
   - Continuación del torneo de julio de 2026.
   - El hype de la terminal y por qué la Semifinal 2 promete ser aún más reñida que la primera.
2. **Las Reglas y Categorías de Evaluación:**
   - Recordatorio del escenario general de pruebas en la terminal y las directrices externas (`openspec`, `superpowers`).
   - Las 7 categorías de evaluación aprobadas (puntuación de 1 a 10 cada una).
3. **El Análisis Individual (Las 10 Fichas Técnicas + Crónica de Uso):**
   - Para cada una de las 10 herramientas de la Semifinal 2 (Qwen Code, DeepSeek CLI, Codex CLI, Antigravity CLI, Llama CLI, OpenHands CLI, OpenCode CLI, Aider, Mods CLI, Plandex CLI):
     - Ficha técnica rigurosa (Instalación, creador, backend de modelos, costos oficiales/suscripción).
     - Relato de la prueba (DX, consumo real de tokens en API, obediencia a skills e instrucciones de proyecto externos frente a terquedad).
     - Puntuación detallada en las 7 categorías con justificación.
4. **Matriz Comparativa General e Infografías Mermaid:**
   - Tabla comparativa que reúne las puntuaciones y especificaciones de las 10 herramientas.
   - Infografía Mermaid del flujo operativo de agentes pesados en paralelo (ej. OpenHands / Plandex) vs. la ejecución rápida y directa de utilidades Unix (ej. Mods / Llama CLI).
   - Infografía Mermaid sobre la gestión de **Maleabilidad de Contexto**: cómo procesa este grupo de agentes las directrices externas (`openspec`).
5. **Análisis Económico y Rendimiento por Presupuesto:**
   - Rendimiento por $20 USD.
   - El caso de uso con modelos locales rápidos y open-source (Ollama) para herramientas flexibles.
6. **El Veredicto Final de la Semifinal 2:**
   - Suma total de puntos (sobre 70) para cada herramienta.
   - Selección de los 2 ganadores indiscutibles que avanzan a la gran final (para enfrentarse a los ganadores de la Semifinal 1).
7. **Bibliografía y Referencias:**
   - Enlaces oficiales de documentación y repositorios GitHub validados en internet.

---

## 2. Pautas Técnicas y de SEO (ArceApps Standard)

### Frontmatter Requerido (ES):
- **Title (≤ 60 chars):** `AI CLI Semifinal 2: La Batalla de los Ecosistemas Nativos` (57 caracteres)
- **Description (120-160 chars):** `Comparamos 10 herramientas CLI de IA en 2026: OpenHands, Aider, Plandex, Mods, Qwen y más. Fichas técnicas, costo real de API, obediencia a las skills y veredicto.` (159 caracteres)
- **Slug:** `cli-ai-semifinal-2`
- **Canonical:** `https://arceapps.com/blog/cli-ai-semifinal-2/`
- **Keywords:** `AI CLI`, `OpenHands`, `Aider`, `Plandex`, `Mods CLI`, `Qwen Code`, `terminal agents`
- **Reference ID:** `CLI-AI-SF2-2026-REWRITE-002`

### Frontmatter Requerido (EN):
- **Title (≤ 60 chars):** `AI CLI Semifinal 2: The Native Ecosystem Clash` (45 caracteres)
- **Description (120-160 chars):** `We compare 10 AI CLI tools in 2026: OpenHands, Aider, Plandex, Mods, Qwen, and more. Detailed specs, actual API costs, skill compliance, and final verdict.` (154 caracteres)
- **Slug:** `cli-ai-semifinal-2`
- **Canonical:** `https://arceapps.com/blog/cli-ai-semifinal-2/`
- **Keywords:** `AI CLI`, `OpenHands`, `Aider`, `Plandex`, `Mods CLI`, `Qwen Code`, `terminal agents`
- **Reference ID:** `CLI-AI-SF2-2026-REWRITE-002`

---

## 3. Especificación de la Imagen de Portada (SVG)

- **Archivo:** `public/images/cli-ai-semifinal-2.svg`
- **Estilo:** Geométrico minimalista, simétrico al de la Semifinal 1 pero con variaciones visuales en los patrones para distinguirlos.
- **Paleta de Colores:**
  - Fondo oscuro: `#0F172A` (Slate 900)
  - Color Primario (Teal): `#018786`
  - Color Secundario (Orange): `#FF9800`
- **Dimensiones:** 1200x630px.

---

## 4. Plan de Verificación

- **Compilación:** `pnpm build` para asegurar que el validador estricto de esquemas de Astro no falle.
- **SEO Audit:** Cargar la skill `write-blog-seo` para validar los campos del frontmatter de ambos archivos generados.
- **Extensión:** Medir el número de palabras en ambos idiomas (`wc -w`) para certificar que supera las 5000 palabras por artículo.
