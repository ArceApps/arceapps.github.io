# AI CLI Semifinal 2 Rewrite Detailed Task List

Esta es la lista detallada de tareas atómicas para llevar a cabo la reescritura de la Semifinal 2 del torneo de CLI de IA.

---

### Task 1: Imagen de Portada SVG (Semifinal 2)

**Files:**
- Create/Modify: `public/images/cli-ai-semifinal-2.svg`

**Acceptance for this task:**
- El archivo SVG existe, es válido y utiliza la paleta de colores corporativos de ArceApps (Teal `#018786`, Orange `#FF9800`) sobre fondo oscuro `#0F172A`.

**Steps:**

- [ ] **Step 1: Escribir el código SVG en public/images/cli-ai-semifinal-2.svg**
  Generar el diseño geométrico y minimalista de 1200x630px que simule la terminal con variaciones en los patrones con respecto a la Semifinal 1.
- [ ] **Step 2: Verificar que el archivo SVG existe y no tiene errores de sintaxis XML**
  Run: `grep -q "</svg>" public/images/cli-ai-semifinal-2.svg`
  Expected: Retorno 0 (éxito).
- [ ] **Step 3: Commit**
  Run: `git add public/images/cli-ai-semifinal-2.svg && git commit -m "design: add new geometric hero image SVG for CLI AI Semifinal 2"`

---

### Task 2: Redactar el Artículo en Español (ES) - Semifinal 2

**Files:**
- Modify: `src/content/blog/es/cli-ai-semifinal-2.md`

**Acceptance for this task:**
- El archivo existe, contiene más de 5000 palabras de contenido de crónica, las 10 herramientas de la Semifinal 2 analizadas y puntuadas en las 7 categorías, los diagramas Mermaid correspondientes y el veredicto final.

**Steps:**

- [ ] **Step 1: Escribir frontmatter SEO y secciones introductorias (Gancho y Escenario de Pruebas)**
  Escribir la introducción y la explicación del escenario general de evaluación y las 7 categorías aprobadas de 1 a 10 puntos.
- [ ] **Step 2: Escribir las fichas técnicas y crónicas de uso de las primeras 5 herramientas**
  Detallar Qwen Code, DeepSeek CLI (ambas versiones), Codex CLI, Antigravity CLI y Llama CLI con información de su instalación, costos y adherencia a skills (`openspec`/`superpowers`).
- [ ] **Step 3: Escribir las fichas técnicas y crónicas de uso de las siguientes 5 herramientas**
  Detallar OpenHands CLI, OpenCode CLI, Aider, Mods CLI (mencionando su sucesor Crush) y Plandex CLI.
- [ ] **Step 4: Escribir la sección de análisis comparativo económico y diagramas Mermaid**
  Comparativa del volumen de trabajo por presupuesto de $20 y uso de Ollama local. Incluir los diagramas Mermaid de flujo y control (agentes paralelos vs. utilidades Unix, y procesamiento de contexto).
- [ ] **Step 5: Escribir la sección de resultados, veredicto final y bibliografía/referencias**
  Tabla de puntuaciones (con suma final sobre 70), veredicto de los 2 clasificados a la gran final (que irán contra los ganadores de la Semifinal 1), y la bibliografía con URLs reales oficiales de internet.
- [ ] **Step 6: Verificar el conteo de palabras del post de blog en español**
  Run: `wc -w src/content/blog/es/cli-ai-semifinal-2.md`
  Expected: Al menos 5000 palabras.
- [ ] **Step 7: Commit**
  Run: `git add src/content/blog/es/cli-ai-semifinal-2.md && git commit -m "content: rewrite CLI AI Semifinal 2 post in Spanish"`

---

### Task 3: Redactar el Artículo en Inglés (EN) - Semifinal 2

**Files:**
- Modify: `src/content/blog/en/cli-ai-semifinal-2.md`

**Acceptance for this task:**
- El archivo existe, contiene la traducción simétrica adaptada de forma natural al inglés con más de 5000 palabras y los mismos diagramas e infografías.

**Steps:**

- [ ] **Step 1: Escribir frontmatter SEO y secciones introductorias en inglés**
  Escribir la introducción y la explicación del escenario y las 7 categorías en inglés.
- [ ] **Step 2: Escribir las fichas técnicas y crónicas de uso de las 10 herramientas en inglés**
  Detalle simétrico en inglés para las 10 herramientas de la Semifinal 2.
- [ ] **Step 3: Escribir el análisis económico, rendimiento por presupuesto y diagramas Mermaid en inglés**
  Sección financiera y diagramas Mermaid en inglés.
- [ ] **Step 4: Escribir la sección de resultados, veredicto y bibliografía en inglés**
  Tabla de resultados, veredicto final de clasificados y referencias en inglés.
- [ ] **Step 5: Verificar el conteo de palabras del post de blog en inglés**
  Run: `wc -w src/content/blog/en/cli-ai-semifinal-2.md`
  Expected: Al menos 5000 palabras.
- [ ] **Step 6: Commit**
  Run: `git add src/content/blog/en/cli-ai-semifinal-2.md && git commit -m "content: rewrite CLI AI Semifinal 2 post in English"`

---

### Task 4: Compilación y Verificación Final (Semifinal 2)

**Files:**
- Modify: `docs/specai/20260708-cli-ai-semifinal-2-rewrite/20260708-cli-ai-semifinal-2-rewrite-verify.md`

**Acceptance for this task:**
- El sitio compila correctamente y el reporte de verificación está completo sin estado PENDING.

**Steps:**

- [ ] **Step 1: Ejecutar la compilación de producción de Astro**
  Run: `pnpm build`
  Expected: Build exitoso sin errores de tipado de frontmatter o sintaxis MDX.
- [ ] **Step 2: Ejecutar la auditoría SEO local de frontmatter**
  Ejecutar mentalmente/lógicamente la skill `write-blog-seo` sobre ambos archivos para verificar que no se violan las reglas SEO.
- [ ] **Step 3: Actualizar el reporte de verificación y guardar cambios**
  Completar las secciones de evidencia de `20260708-cli-ai-semifinal-2-rewrite-verify.md`.
- [ ] **Step 4: Commit final**
  Run: `git add docs/specai/20260708-cli-ai-semifinal-2-rewrite/ && git commit -m "specai: complete implementation and verification for CLI AI Semifinal 2 rewrite"`
