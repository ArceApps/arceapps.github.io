# Tareas: rediseño visual moderno integral

### Task 1: Baseline y contratos
**Files:** Test: `src/components/*-contract.test.ts`, `package.json`.
**Control Metadata:** Complexity: 3. Risk: Low. Checkpoint: No.
**Depends On:** —. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** contratos.
- [ ] Ejecutar `pnpm test` y registrar la base.
- [ ] Añadir contratos que exijan colección `projects`, lista mezclada de tres y anchos seguros del TOC.

### Task 2: Sistema visual compartido
**Files:** Modify: `src/styles/global.css`, `Card.astro`, `PageIntro.astro`, `Header.astro`, `Footer.astro`, `src/i18n/ui.ts`.
**Control Metadata:** Complexity: 6. Risk: Medium. Checkpoint: No.
**Depends On:** 1. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** global.css, i18n.
- [ ] Consolidar tokens, espaciado y tarjetas; eliminar utilidades visuales sin consumidor.
- [ ] Implementar estados móvil, tablet y escritorio de navegación sin romper teclado.
- [ ] Añadir todas las cadenas localizadas necesarias y ejecutar contratos.

### Task 3: Colección y contenido Projects
**Files:** Modify: `src/content/config.ts`; Create: seis Markdown en `src/content/projects/{en,es}/`, heroes SVG en `public/images/projects/`; Remove: `src/data/projects.json` tras migración.
**Control Metadata:** Complexity: 7. Risk: High. Checkpoint: Yes.
**Depends On:** 1. **Parallelizable:** Sí, con 4. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** content config.
- [ ] **Checkpoint: Human Approval:** revisar esquema y los tres repositorios antes de crear contenido.
- [ ] Definir `datePrecision`, `reference_id`, assets, tecnologías y procedencia en el esquema.
- [ ] Crear EN/ES para SpecAI, NewsAPI y SkillsAI, con 2026-06-02, 2022-12-12 y 2026-01-14 etiquetadas como aproximadas.
- [ ] Verificar que no quedan importaciones de `projects.json` antes de retirarlo.

### Task 4: Auditoría y preparación de SkillsAI
**Files:** Modify: `/home/arceappspc/Projects/ArceApps/skillsAI/README.md`; Create: `LICENSE`, registro de procedencia y notices por skill.
**Control Metadata:** Complexity: 8. Risk: High. Checkpoint: Yes.
**Depends On:** 1. **Parallelizable:** Sí, con 3. **Requires Solo:** Yes. **Workspace:** skillsAI. **Shared Resources:** licencia y procedencia.
- [ ] **Checkpoint: Human Approval:** revisar inventario, scripts y licencias antes de copiar contenido.
- [ ] Añadir MIT propio y una explicación de colección personal para ArceApps/SpecAI.
- [ ] Incorporar `android/skills` Apache-2.0 y adaptaciones MIT de LLM Wiki y Ponytail, con enlace, autor, licencia y cambios por skill.
- [ ] Auditar scripts y validar que ningún aviso de tercero se pierde.

### Task 5: Listados y detalles Projects
**Files:** Modify: `src/pages/{,es/}projects.astro`, `ProjectCard.astro`; Create: `src/pages/{,es/}projects/[...slug].astro` y pruebas de contratos.
**Control Metadata:** Complexity: 7. Risk: High. Checkpoint: Yes.
**Depends On:** 2, 3. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** ProjectCard, i18n.
- [ ] **Checkpoint: Human Approval:** revisar las rutas generadas y el diseño de ficha antes de sustituir el listado actual.
- [ ] Renderizar solo Projects públicos de la colección, ordenados por `pubDate`, con fecha aproximada accesible.
- [ ] Crear detalles EN/ES con hero, tecnologías, enlaces y procedencia.

### Task 6: Home y hero de trabajo real
**Files:** Modify: `HomePage.astro`, `Hero.astro`, `ProjectCard.astro`, i18n y contratos Home.
**Control Metadata:** Complexity: 6. Risk: Medium. Checkpoint: No.
**Depends On:** 2, 3. **Parallelizable:** Sí, con 5. **Requires Solo:** No. **Workspace:** sitio. **Shared Resources:** ProjectCard, i18n.
- [ ] Unificar Apps y Projects por `pubDate`, desempatar de forma determinista y mostrar tres.
- [ ] Etiquetar App/Project y enlazar al detalle localizado.
- [ ] Sustituir el panel geométrico del hero por el trabajo más reciente.

### Task 7: Lectura de blog y TOC
**Files:** Modify: `src/pages/{,es/}blog/[...slug].astro`, `src/styles/global.css`, contratos blog.
**Control Metadata:** Complexity: 5. Risk: Medium. Checkpoint: No.
**Depends On:** 2. **Parallelizable:** Sí, con 5 y 6. **Requires Solo:** No. **Workspace:** sitio. **Shared Resources:** global.css.
- [ ] Usar contenedor máximo 1200 px y TOC 264–288 px solo sin colisión; conservar `<details>` inferior.
- [ ] Comprobar 1280 px sin solapamiento, teclado y lectura de 720–760 px.

### Task 8: Rediseño de las rutas restantes
**Files:** Modify: listados/detalles públicos, About, Contact, Privacy, 404 y componentes compartidos.
**Control Metadata:** Complexity: 7. Risk: Medium. Checkpoint: Yes.
**Depends On:** 2. **Parallelizable:** Sí, con 5–7 por archivos disjuntos. **Requires Solo:** No. **Workspace:** sitio. **Shared Resources:** Card, Header, Footer.
- [ ] **Checkpoint: Human Approval:** revisar la primera ruta representativa antes de propagar el sistema.
- [ ] Aplicar componentes, espaciado, estados vacíos y equivalencia EN/ES.

### Task 9: Publicación segura de SkillsAI
**Files:** Verify: SkillsAI y GitHub; Modify: visibilidad del repositorio.
**Control Metadata:** Complexity: 8. Risk: High. Checkpoint: Yes.
**Depends On:** 4. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** GitHub/skillsAI. **Shared Resources:** repositorio público.
- [ ] **Checkpoint: Human Approval:** revisar README, LICENSE, notices y resultados de auditoría antes de hacer público el repositorio.
- [ ] Cambiar visibilidad a pública y verificarla mediante GitHub.
- [ ] Solo entonces habilitar el enlace desde la ficha web de SkillsAI.

### Task 10: Verificación integrada
**Files:** Test: `src/components/home-contract.test.ts`, `src/components/blog-detail-contract.test.ts`, `src/components/listings-contract.test.ts`, `src/components/cross-cutting-contract.test.ts`, `src/components/project-detail-contract.test.ts`.
**Control Metadata:** Complexity: 6. Risk: High. Checkpoint: Yes.
**Depends On:** 5–9. **Parallelizable:** No. **Requires Solo:** Yes. **Workspace:** sitio. **Shared Resources:** build final.
- [ ] **Checkpoint: Human Approval:** confirmar el alcance final antes de validación de publicación.
- [ ] Ejecutar `pnpm test`, `pnpm build`, revisión de rutas EN/ES y navegador a 1280 px.
- [ ] Registrar resultados y actualizar documentos vivos.
