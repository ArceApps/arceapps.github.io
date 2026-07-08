# AI CLI Semifinal 1 Rewrite Detailed Task List

Esta es la lista detallada de tareas atómicas para llevar a cabo la reescritura de la Semifinal 1 del torneo de CLI de IA.

---

### Task 1: Imagen de Portada SVG

**Files:**
- Create/Modify: `public/images/cli-ai-semifinal-1.svg`

**Acceptance for this task:**
- El archivo SVG existe, es válido y utiliza la paleta de colores corporativos de ArceApps (Teal `#018786`, Orange `#FF9800`) sobre fondo oscuro `#0F172A`.

**Steps:**

- [ ] **Step 1: Escribir el código SVG en public/images/cli-ai-semifinal-1.svg**
  Generar el diseño geométrico y minimalista de 1200x630px que simule la terminal con diagramas de engranajes y bucles agénticos.
- [ ] **Step 2: Verificar que el archivo SVG existe y no tiene errores de sintaxis XML**
  Run: `grep -q "</svg>" public/images/cli-ai-semifinal-1.svg`
  Expected: Retorno 0 (éxito).
- [ ] **Step 3: Commit**
  Run: `git add public/images/cli-ai-semifinal-1.svg && git commit -m "design: add new geometric hero image SVG for CLI AI Semifinal 1"`

---

### Task 2: Redactar el Artículo en Español (ES)

**Files:**
- Modify: `src/content/blog/es/cli-ai-semifinal-1.md`

**Acceptance for this task:**
- El archivo existe, contiene más de 5000 palabras de contenido de crónica, las 10 herramientas analizadas y puntuadas en las 7 categorías, los diagramas Mermaid correspondientes y el veredicto final.

**Steps:**

- [ ] **Step 1: Escribir frontmatter SEO y secciones introductorias (Gancho y Escenario de Pruebas)**
  Escribir la introducción y la explicación del escenario general de evaluación y las 7 categorías aprobadas de 1 a 10 puntos.
- [ ] **Step 2: Escribir las fichas técnicas y crónicas de uso de las primeras 5 herramientas**
  Detallar Kimi Code CLI, MiniMax CLI, Mistral Vibe, Claude Code y GitHub Copilot CLI con información de su instalación, costos y adherencia a skills (`openspec`/`superpowers`).
- [ ] **Step 3: Escribir las fichas técnicas y crónicas de uso de las siguientes 5 herramientas**
  Detallar Pi, Cline, Hermes, LLM y AIChat.
- [ ] **Step 4: Escribir la sección de análisis comparativo económico y diagramas Mermaid**
  Comparativa del volumen de trabajo por presupuesto de $20 (Gemini vs Claude Code) y uso de Ollama local. Incluir los diagramas Mermaid de flujo y control.
- [ ] **Step 5: Escribir la sección de resultados, veredicto final y bibliografía/referencias**
  Tabla de puntuaciones (con suma final sobre 70), veredicto de los 2 clasificados a la gran final, y la bibliografía con URLs reales oficiales de internet.
- [ ] **Step 6: Verificar el conteo de palabras del post de blog en español**
  Run: `wc -w src/content/blog/es/cli-ai-semifinal-1.md`
  Expected: Al menos 5000 palabras.
- [ ] **Step 7: Commit**
  Run: `git add src/content/blog/es/cli-ai-semifinal-1.md && git commit -m "content: rewrite CLI AI Semifinal 1 post in Spanish"`

---

### Task 3: Redactar el Artículo en Inglés (EN)

**Files:**
- Modify: `src/content/blog/en/cli-ai-semifinal-1.md`

**Acceptance for this task:**
- El archivo existe, contiene la traducción simétrica adaptada de forma natural al inglés con más de 5000 palabras y los mismos diagramas e infografías.

**Steps:**

- [ ] **Step 1: Escribir frontmatter SEO y secciones introductorias en inglés**
  Escribir introducción y explicación de categorías en inglés.
- [ ] **Step 2: Escribir las fichas técnicas y crónicas de uso de las 10 herramientas en inglés**
  Detalle simétrico en inglés para las 10 herramientas evaluadas.
- [ ] **Step 3: Escribir el análisis económico, rendimiento por presupuesto y diagramas Mermaid en inglés**
  Sección financiera y diagramas Mermaid en inglés.
- [ ] **Step 4: Escribir la sección de resultados, veredicto y bibliografía en inglés**
  Tabla de resultados, veredicto final de clasificados y referencias en inglés.
- [ ] **Step 5: Verificar el conteo de palabras del post de blog en inglés**
  Run: `wc -w src/content/blog/en/cli-ai-semifinal-1.md`
  Expected: Al menos 5000 palabras.
- [ ] **Step 6: Commit**
  Run: `git add src/content/blog/en/cli-ai-semifinal-1.md && git commit -m "content: rewrite CLI AI Semifinal 1 post in English"`

---

### Task 4: Compilación y Verificación Final

**Files:**
- Modify: `docs/specai/20260708-cli-ai-semifinal-1-rewrite/20260708-cli-ai-semifinal-1-rewrite-verify.md`

**Acceptance for this task:**
- El sitio compila correctamente y el reporte de verificación está completo sin estado PENDING.

**Steps:**

- [ ] **Step 1: Ejecutar la compilación de producción de Astro**
  Run: `pnpm build`
  Expected: Build exitoso sin errores de tipado de frontmatter o sintaxis MDX.
- [ ] **Step 2: Ejecutar la auditoría SEO local de frontmatter**
  Ejecutar mentalmente/lógicamente la skill `write-blog-seo` sobre ambos archivos para verificar que no se violan las reglas SEO.
- [ ] **Step 3: Actualizar el reporte de verificación y guardar cambios**
  Completar las secciones de evidencia de `20260708-cli-ai-semifinal-1-rewrite-verify.md`.
- [ ] **Step 4: Commit final**
  Run: `git add docs/specai/20260708-cli-ai-semifinal-1-rewrite/ && git commit -m "specai: complete implementation and verification for CLI AI Semifinal 1 rewrite"`
