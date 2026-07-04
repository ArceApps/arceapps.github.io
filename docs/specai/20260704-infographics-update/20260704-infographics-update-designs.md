# Design Spec: Infographics Update for OpenSpec and SDD Articles

**Date:** 2026-07-04  
**Author:** ArceApps AI Assistant (Scribe/Architect)  
**Topic:** Rebuilding placeholder and SVG blog headers with elegant, professional PNG infographics in both English and Spanish.

---

## 1. Visual Design Standards

To ensure a premium, modern, and cohesive look across all blog posts, the new infographics will adhere to these specs:

* **Canvas Dimensions:** 1200x630px (Landscape 1.91:1 ratio, optimized for Open Graph and blog cover headers).
* **Background Color:** Elegant off-white / light slate (`#F8FAFC`). No pure white (`#FFFFFF`) to avoid high-contrast screen glare.
* **Brand Colors (Accents):**
  * **Teal (`#018786`):** Primary workflow lines, main step nodes, and active titles.
  * **Orange (`#FF9800`):** Validation gates, critical checkmarks, and focal callouts.
* **Typography:** Clean, readable sans-serif (e.g., Roboto or Inter) for diagrams and label copy.
* **Art Style:** Modern flat vector illustration with subtle soft shadows for depth. Clean lines and solid shapes only.

---

## 2. Infographic Concepts & Copy Matrix

Ten separate infographics will be generated: 5 unique topics, each translated into both English (EN) and Spanish (ES).

### 2.1. OpenSpec Workflow
* **Concept:** Step-by-step pipeline of lightweight spec alignment.
* **Visuals:** Left-to-right flow with 3 nodes:
  1. Human icon proposing changes -> `change_proposal.md`
  2. AI agent icon running tasks -> `task.md` (active checklist)
  3. CI/CD or PR icon validating work -> `walkthrough.md`
* **ES Text:** "Flujo de OpenSpec", "1. Propuesta de Cambio", "2. Tareas en Progreso (Archivo Vivo)", "3. Verificación de Resultados"
* **EN Text:** "OpenSpec Workflow", "1. Change Proposal", "2. Tasks in Progress (Living File)", "3. Results Verification"

### 2.2. Specs-Driven Development (SDD) Cycle
* **Concept:** Contrast loop comparing Vibe Coding with SDD.
* **Visuals:** Two parallel visual paths:
  * *Top (Red - Vibe Coding):* Idea -> Start Coding -> Bugs -> Chaos.
  * *Bottom (Teal/Orange - SDD):* Idea -> Design Spec -> Atomic Branch -> Surgical Edit -> Automated Verification -> Success.
* **ES Text:** "Vibe Coding vs. Desarrollo Guiado por Specs", "Vibe Coding (Código Directo sin Plan)", "Flujo SDD (Desarrollo Guiado por Especificaciones)"
* **EN Text:** "Vibe Coding vs. Spec-Driven Development", "Vibe Coding (Direct Coding without Plan)", "SDD Flow (Spec-Driven Development)"

### 2.3. Superpowers vs OpenSpec Comparison
* **Concept:** Visual side-by-side comparison of execution methodologies.
* **Visuals:** Left and right panels:
  * *Left (Superpowers):* Pre-built modular Skill engines executing specific workflows.
  * *Right (OpenSpec):* Version-controlled, dynamic text specifications steering the execution.
* **ES Text:** "Comparativa de Metodologías", "Superpowers (Basado en Habilidades)", "OpenSpec (Guiado por Artefactos)"
* **EN Text:** "Methodologies Comparison", "Superpowers (Skill-Based)", "OpenSpec (Artifact-Guided)"

### 2.4. SDD Frameworks Analysis
* **Concept:** Spectrum triangle of popular agentic development frameworks.
* **Visuals:** Triangle with vertices representing different strengths:
  * *Vertex 1 (GitHub Spec Kit):* Rigid architectural contracts.
  * *Vertex 2 (OpenSpec):* Fast, light change proposals.
  * *Vertex 3 (BMAD):* Multi-agent coordination and orchestration.
* **ES Text:** "Ecosistema de Frameworks SDD", "GitHub Spec Kit: Contratos Arquitectónicos", "OpenSpec: Propuestas Ágiles", "BMAD: Orquestación Multi-Agente"
* **EN Text:** "SDD Frameworks Ecosystem", "GitHub Spec Kit: Architectural Contracts", "OpenSpec: Agile Proposals", "BMAD: Multi-Agent Orchestration"

### 2.5. Spec Kitty CLI Flow
* **Concept:** Developer CLI tool orchestrating workspaces and branches.
* **Visuals:** Central command line console emitting isolated git worktrees mapped to Kanban board columns.
* **ES Text:** "Spec Kitty: Automatización SDD", "CLI de Control", "Git Worktrees Aislados", "Tablero Kanban de 9 Carriles"
* **EN Text:** "Spec Kitty: SDD Automation", "Control CLI", "Isolated Git Worktrees", "9-Lane Kanban Board"

---

## 3. Blog Frontmatter Integration Mapping

The following content files in the blog collection will be modified to point to the new PNG graphics:

| Original Article (Slug) | Language | Content File Path | Target `heroImage` |
| --- | --- | --- | --- |
| `openspec-desarrollo-movil` | ES | `src/content/blog/es/openspec-desarrollo-movil.md` | `"/images/blog-openspec-mobile-development-es.png"` |
| `openspec-mobile-development` | EN | `src/content/blog/en/openspec-mobile-development.md` | `"/images/blog-openspec-mobile-development-en.png"` |
| `specs-driven-development` | ES | `src/content/blog/es/specs-driven-development.md` | `"/images/blog-sdd-agentic-es.png"` |
| `spec-driven-development-ai` | EN | `src/content/blog/en/spec-driven-development-ai.md` | `"/images/blog-sdd-agentic-en.png"` |
| `superpowers-vs-openspec` | ES | `src/content/blog/es/superpowers-vs-openspec.md` | `"/images/blog-superpowers-vs-openspec-es.png"` |
| `superpowers-vs-openspec` | EN | `src/content/blog/en/superpowers-vs-openspec.md` | `"/images/blog-superpowers-vs-openspec-en.png"` |
| `sdd-frameworks-spec-kit-openspec-bmad` | ES | `src/content/blog/es/sdd-frameworks-spec-kit-openspec-bmad.md` | `"/images/blog-sdd-frameworks-analysis-es.png"` |
| `sdd-frameworks-analysis-spec-kit-openspec-bmad` | EN | `src/content/blog/en/sdd-frameworks-analysis-spec-kit-openspec-bmad.md` | `"/images/blog-sdd-frameworks-analysis-en.png"` |
| `spec-kitty-mobile-development` | ES | `src/content/blog/es/spec-kitty-mobile-development.md` | `"/images/blog-spec-kitty-mobile-development-es.png"` |
| `spec-kitty-mobile-development` | EN | `src/content/blog/en/spec-kitty-mobile-development.md` | `"/images/blog-spec-kitty-mobile-development-en.png"` |
