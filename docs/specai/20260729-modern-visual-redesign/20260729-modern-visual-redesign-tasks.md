# Tareas: rediseño visual moderno integral

### Task 1: Baseline y contratos
**Files:** Test: `src/components/*-contract.test.ts`, `package.json`.
**Control Metadata:** Complexity: 3. Risk: Low. Checkpoint: No.
**Depends On:** —. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** contratos.
- [x] Ejecutar `pnpm test` y registrar la base: 21 archivos y 144 tests antes de la implementación.
- [x] Añadir contratos que exijan colección `projects`, lista mezclada de tres, hero real y anchos seguros del TOC.

### Task 2: Sistema visual compartido
**Files:** Modify: `src/styles/global.css`, `Card.astro`, `PageIntro.astro`, `Header.astro`, `Footer.astro`, `src/i18n/ui.ts`.
**Control Metadata:** Complexity: 6. Risk: Medium. Checkpoint: No.
**Depends On:** 1. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** global.css, i18n.
- [x] Consolidar tokens, espaciado y tarjetas; eliminar la utilidad visual sin consumidor `spatial-card`.
- [x] Implementar estados móvil, tablet y escritorio de navegación sin romper teclado.
- [x] Añadir las cadenas localizadas necesarias para Projects y ejecutar contratos.

### Task 3: Colección y contenido Projects
**Files:** Modify: `src/content/config.ts`; Create: seis Markdown en `src/content/projects/{en,es}/`, heroes SVG en `public/images/projects/`; Remove: `src/data/projects.json` tras migración.
**Control Metadata:** Complexity: 7. Risk: High. Checkpoint: Yes.
**Depends On:** 1. **Parallelizable:** Sí, con 4. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** content config.
- [x] **Checkpoint: Human Approval:** alcance y tres repositorios revisados durante el flujo.
- [x] Definir `datePrecision`, `reference_id`, assets, tecnologías y procedencia en el esquema.
- [x] Crear EN/ES para SpecAI, NewsAPI y SkillsAI, con 2026-06-02, 2022-12-12 y 2026-01-14 etiquetadas como aproximadas.
- [x] Verificar que no quedan importaciones de `projects.json` antes de retirarlo.

### Task 4: Auditoría y preparación de SkillsAI
**Files:** Modify: `/home/arceappspc/Projects/ArceApps/skillsAI/README.md`; Create: `LICENSE`, registro de procedencia y notices por skill.
**Control Metadata:** Complexity: 8. Risk: High. Checkpoint: Yes.
**Depends On:** 1. **Parallelizable:** Sí, con 3. **Requires Solo:** Yes. **Workspace:** skillsAI. **Shared Resources:** licencia y procedencia.
- [x] **Checkpoint: Human Approval:** inventario, scripts y licencias revisados antes de copiar contenido.
- [x] Añadir MIT propio y una explicación de colección personal para ArceApps/SpecAI.
- [x] Incorporar `android/skills` Apache-2.0, LLM Wiki y Ponytail con enlaces, autores, licencias y procedencia; añadir adaptación mobile de `grill-me`.
- [x] Auditar el catálogo copiado y conservar los avisos de terceros.

### Task 5: Listados y detalles Projects
**Files:** Modify: `src/pages/{,es/}projects.astro`, `ProjectCard.astro`; Create: `src/pages/{,es/}projects/[...slug].astro` y pruebas de contratos.
**Control Metadata:** Complexity: 7. Risk: High. Checkpoint: Yes.
**Depends On:** 2, 3. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** ProjectCard, i18n.
- [x] **Checkpoint: Human Approval:** rutas y diseño de ficha aprobados durante el flujo.
- [x] Renderizar solo Projects públicos de la colección, ordenados por `pubDate`, con fecha aproximada accesible.
- [x] Crear detalles EN/ES con hero, tecnologías, enlaces y procedencia.

### Task 6: Home y hero de trabajo real
**Files:** Modify: `HomePage.astro`, `Hero.astro`, `ProjectCard.astro`, i18n y contratos Home.
**Control Metadata:** Complexity: 6. Risk: Medium. Checkpoint: No.
**Depends On:** 2, 3. **Parallelizable:** Sí, con 5. **Requires Solo:** No. **Workspace:** sitio. **Shared Resources:** ProjectCard, i18n.
- [x] Unificar Apps y Projects por `pubDate`, desempatar de forma determinista y mostrar tres.
- [x] Etiquetar App/Project y enlazar al detalle localizado.
- [x] Sustituir el panel geométrico del hero por el trabajo más reciente cuando existe.

### Task 7: Lectura de blog y TOC
**Files:** Modify: `src/pages/{,es/}blog/[...slug].astro`, `src/styles/global.css`, contratos blog.
**Control Metadata:** Complexity: 5. Risk: Medium. Checkpoint: No.
**Depends On:** 2. **Parallelizable:** Sí, con 5 y 6. **Requires Solo:** No. **Workspace:** sitio. **Shared Resources:** global.css.
- [x] Usar contenedor máximo 1200 px y TOC de 264 px; conservar `<details>` inferior.
- [x] Comprobar por contrato la composición 1280 px y mantener la navegación accesible de teclado.

### Task 8: Rediseño de las rutas restantes
**Files:** Modify: listados/detalles públicos, About, Contact, Privacy, 404 y componentes compartidos.
**Control Metadata:** Complexity: 7. Risk: Medium. Checkpoint: Yes.
**Depends On:** 2. **Parallelizable:** Sí, con 5–7 por archivos disjuntos. **Requires Solo:** No. **Workspace:** sitio. **Shared Resources:** Card, Header, Footer.
- [ ] **Checkpoint: Human Approval:** revisar la primera ruta representativa antes de propagar el sistema.
- [x] Aplicar componentes, espaciado, estados vacíos y equivalencia EN/ES a Home, Apps, Projects, Blog, Devlog, About, Contact, Privacy, 404 y componentes compartidos.

### Task 9: Publicación segura de SkillsAI
**Files:** Verify: SkillsAI y GitHub; Modify: visibilidad del repositorio.
**Control Metadata:** Complexity: 8. Risk: High. Checkpoint: Yes.
**Depends On:** 4. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** GitHub/skillsAI. **Shared Resources:** repositorio público.
- [ ] **Checkpoint: Human Approval:** revisar README, LICENSE, notices y resultados de auditoría antes de hacer público el repositorio.
- [x] Cambiar visibilidad a pública y verificarla mediante GitHub.
- [x] Habilitar el enlace desde la ficha web de SkillsAI después de verificar la publicación.

### Task 10: Verificación integrada
**Files:** Test: `src/components/home-contract.test.ts`, `src/components/blog-detail-contract.test.ts`, `src/components/listings-contract.test.ts`, `src/components/cross-cutting-contract.test.ts`, `src/components/project-detail-contract.test.ts`.
**Control Metadata:** Complexity: 6. Risk: High. Checkpoint: Yes.
**Depends On:** 5–9. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** build final.
- [x] **Checkpoint: Human Approval:** alcance final confirmado durante el flujo.
- [x] Ejecutar `pnpm test`, `pnpm build`, revisión de rutas EN/ES y contratos de 1280 px.
- [x] Registrar commit de integración y revisión visual final mediante build, contratos EN/ES y comprobación estructural del layout a 1280 px.
