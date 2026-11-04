# Rediseño visual 1:1 — Task List

**Feature ID:** 20261029-rediseno-web-visual-1-1

> **For agentic workers:** Read this file once, then dispatch one implementer per task with minimal context.
> Tasks are atomic. Do not bundle tasks. Do not skip the order. Internal steps are never marked; only `specai-documentation` updates `**Status:**` and `**Completed:**`.

## Task 1: Tokens de paleta de la maqueta

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/styles/global.css`
- Test: `src/styles/design-contract.test.ts`

**Criteria:** `C1`, `C9`

**Control Metadata:**
- Complexity: 4
- Risk: High
- Checkpoint: Yes

**Research & Context:**
- Paleta medida de la maqueta: acento light `#038D90`, body light `#FCFCFC`, contenido light `#0B1014`, dark body `#091117` (ya correcto), dark raised `#0E171D`, dark muted `#BDC0C2`.

**Implementation Contract:**
- **Target:** `--color-primary`, `--color-content`, `--color-dark-surface-raised`, `--color-dark-content-muted`, body background
- **Location:** `src/styles/global.css`, bloque `@theme` y regla `body` de `@layer base`
- **Current:** `#007F7D`, `#111827`, `#111E26`, `#9CA3AF`, `bg-[#F8F9FA]`
- **Change:** `#007F7D` -> `#038D90` (con `#111827` -> `#0B1014`, `#111E26` -> `#0E171D`, `#9CA3AF` -> `#BDC0C2`, `bg-[#F8F9FA]` -> `bg-[#FCFCFC]`)
- **Assertion:** `paleta de la maqueta declarada en @theme`

**Spec context (minimal):**
Paleta de `designs.md` — literales exactos; conservar nombres de tokens.

**Acceptance for this task:**
- [ ] `global.css` contiene los cinco literales nuevos y elimina los viejos.
- [ ] Solo se toca `src/styles/global.css` y su test.

**Steps:**

- [ ] **Step 1: Checkpoint: Human Approval**
  - Confirmar con el usuario el cambio de paleta global (Risk High) antes de continuar.
- [ ] **Step 2: Write the failing test**
```ts
it('paleta de la maqueta declarada en @theme', () => {
  expect(globalStyles).toContain('--color-primary: #038D90');
  expect(globalStyles).toContain('--color-content: #0B1014');
  expect(globalStyles).toContain('--color-dark-surface-raised: #0E171D');
  expect(globalStyles).toContain('--color-dark-content-muted: #BDC0C2');
  expect(globalStyles).toContain('bg-[#FCFCFC]');
});
```
- [ ] **Step 3: Run test to verify it fails**
Run: `pnpm vitest run src/styles/design-contract.test.ts`
Expected: FAIL en `paleta de la maqueta declarada en @theme`
- [ ] **Step 4: Write minimal implementation**
  - Sustituir en `@theme`: `--color-primary: #038D90`, `--color-content: #0B1014`, `--color-dark-surface-raised: #0E171D`, `--color-dark-content-muted: #BDC0C2`; en `body`: `bg-[#FCFCFC]`. Actualizar literales viejos que el resto del design-contract afirme (`#007F7D`, `#F8F9FA`).
- [ ] **Step 5: Run test to verify it passes**
Run: `pnpm vitest run src/styles/design-contract.test.ts`
Expected: PASS
- [ ] **Step 6: Commit**
```bash
git add src/styles/global.css src/styles/design-contract.test.ts
git commit -m "feat(design): paleta de tokens medida de la maqueta"
```

## Task 2: Override oscuro del acento

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/styles/global.css`
- Test: `src/styles/design-contract.test.ts`

**Criteria:** `C1`, `C9`

**Control Metadata:**
- Complexity: 2
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Patrón existente: `:root.dark .text-primary { color: #2DD4BF; }` en `@layer utilities`. La maqueta usa acento `#00ACB0` en modo oscuro (botones, chips, links).

**Implementation Contract:**
- **Target:** `:root.dark .text-primary`, `:root.dark .bg-primary`, `:root.dark .border-primary`
- **Location:** `src/styles/global.css`, `@layer utilities`
- **Current:** `:root.dark .text-primary { color: #2DD4BF; }`
- **Change:** `#2DD4BF` -> `#00ACB0` (y añadir `:root.dark .bg-primary` y `:root.dark .border-primary` con `#00ACB0`)
- **Assertion:** `override dark del acento a #00ACB0`

**Spec context (minimal):**
Decisión D4 de `designs.md`: overrides `:root.dark` manteniendo clases `bg-primary/text-primary/border-primary`.

**Acceptance for this task:**
- [ ] El acento dark es `#00ACB0` en texto, fondo y borde.
- [ ] No se cambian componentes, solo `global.css` y test.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('override dark del acento a #00ACB0', () => {
  expect(globalStyles).toContain(':root.dark .text-primary');
  expect(globalStyles).toContain(':root.dark .bg-primary');
  expect(globalStyles).toContain('color: #00ACB0');
  expect(globalStyles).toContain('background-color: #00ACB0');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/styles/design-contract.test.ts`
Expected: FAIL en `override dark del acento a #00ACB0`
- [ ] **Step 3: Write minimal implementation**
  - En `@layer utilities`: `:root.dark .text-primary { color: #00ACB0; }`, `:root.dark .bg-primary { background-color: #00ACB0; }`, `:root.dark .border-primary { border-color: #00ACB0; }`.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/styles/design-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/styles/global.css src/styles/design-contract.test.ts
git commit -m "feat(design): acento dark #00ACB0 con overrides .dark"
```

## Task 3: Fotos stock del héroe y Sobre mí

**Status:** completed
**Completed:** [x]

**Files:**
- Create: `src/assets/hero-mountain-sunset.jpg`
- Create: `src/assets/about-mountains.jpg`
- Test: `src/components/pages/imagery-contract.test.ts`

**Criteria:** `C3`, `C7`, `C9`

**Control Metadata:**
- Complexity: 2
- Risk: Medium
- Checkpoint: Yes

**Research & Context:**
- Hero: Unsplash License, `https://unsplash.com/photos/6D6omiCxHWM/download?force=true` (verificado 200 image/jpeg).
- About: Unsplash License, `https://images.unsplash.com/photo-1578589591337-864142c03335?w=1600&q=80&auto=format&fit=crop` (verificado 200 image/jpeg).
- Fallback si la descarga falla: copiar `public/images/portfolio-landscape.svg` como base y documentar en el Execution Log.

**Implementation Contract:**
- **Target:** `src/assets/hero-mountain-sunset.jpg`, `src/assets/about-mountains.jpg`
- **Location:** `src/assets/`, ficheros de asset
- **Current:** `N/A — no existe asset fotográfico en el repo`
- **Change:** `sin asset fotografico` -> `src/assets/hero-mountain-sunset.jpg` (y `src/assets/about-mountains.jpg`)
- **Assertion:** `fotos stock presentes en src/assets`

**Spec context (minimal):**
Decisión D5 de `designs.md`: stock libre con atribución; fallback SVG documentado.

**Acceptance for this task:**
- [ ] Ambos JPEG existen en `src/assets/` y son imágenes válidas.
- [ ] Si no se pudieron descargar, el fallback está documentado en el Execution Log.

**Steps:**

- [ ] **Step 1: Checkpoint: Human Verification Checkpoint for stock photos**
  - Confirmar licencia Unsplash License de ambas fotos; si no se aprueba, usar fallback y documentar.
- [ ] **Step 2: Write the failing test**
```ts
import { existsSync } from 'node:fs';
it('fotos stock presentes en src/assets', () => {
  expect(existsSync('src/assets/hero-mountain-sunset.jpg')).toBe(true);
  expect(existsSync('src/assets/about-mountains.jpg')).toBe(true);
});
```
- [ ] **Step 3: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/imagery-contract.test.ts`
Expected: FAIL (archivos inexistentes)
- [ ] **Step 4: Write minimal implementation**
```bash
curl -L "https://unsplash.com/photos/6D6omiCxHWM/download?force=true" -o src/assets/hero-mountain-sunset.jpg
curl -L "https://images.unsplash.com/photo-1578589591337-864142c03335?w=1600&q=80&auto=format&fit=crop" -o src/assets/about-mountains.jpg
```
  - Verificar que ambos son JPEG (`file src/assets/*.jpg`); si falla, fallback documentado.
- [ ] **Step 5: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/imagery-contract.test.ts`
Expected: PASS
- [ ] **Step 6: Commit**
```bash
git add src/assets/hero-mountain-sunset.jpg src/assets/about-mountains.jpg src/components/pages/imagery-contract.test.ts
git commit -m "feat(design): fotos stock Unsplash para hero y sobre mi"
```

## Task 4: Header con Sobre mí

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/i18n/ui.ts`
- Test: `src/components/header-ux-contract.test.ts`

**Criteria:** `C2`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- `nav.about` ya existe en `src/i18n/ui.ts` con valores "About"/"Sobre ArceApps". La maqueta muestra nav: Inicio, Proyectos, Apps, Blog, Devlog, Sobre mí, Contacto.

**Implementation Contract:**
- **Target:** `navItems`, `nav.about`
- **Location:** `src/components/Header.astro`, array `navItems`; `src/i18n/ui.ts`, claves `nav.about`
- **Current:** `navItems` con 6 ítems y `nav.about` = `Sobre ArceApps`
- **Change:** `6 navItems sin about` -> `7 navItems con about` (y `Sobre ArceApps` -> `Sobre mí`, `About` -> `About me`)
- **Assertion:** `nav de 7 items con Sobre mi`

**Spec context (minimal):**
R1 del spec: nav de 7 ítems con activo por `isPathActive`; etiquetas de la maqueta.

**Acceptance for this task:**
- [ ] El nav desktop y móvil incluyen "Sobre mí" (/about-me, /es/about-me).
- [ ] Paridad de claves i18n intacta.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('nav de 7 items con Sobre mi', () => {
  const s = readFileSync('src/components/Header.astro', 'utf8');
  expect(s).toContain("'nav.about'");
  const ui = readFileSync('src/i18n/ui.ts', 'utf8');
  expect(ui).toContain("'nav.about': 'Sobre mí'");
  expect(ui).toContain("'nav.about': 'About me'");
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/header-ux-contract.test.ts`
Expected: FAIL en `nav de 7 items con Sobre mi`
- [ ] **Step 3: Write minimal implementation**
  - En `navItems`, entre Devlog y Contacto: `{ label: t('nav.about'), href: lang === 'es' ? '/es/about-me' : '/about-me', icon: 'person' }`. En `ui.ts`: ES `'nav.about': 'Sobre mí'`, EN `'nav.about': 'About me'`.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/header-ux-contract.test.ts`
Expected: PASS (incluye contratos previos de `hidden xl:flex`)
- [ ] **Step 5: Commit**
```bash
git add src/components/Header.astro src/i18n/ui.ts src/components/header-ux-contract.test.ts
git commit -m "feat(header): nav de 7 items con Sobre mi segun maqueta"
```

## Task 5: Footer con lenguaje de la maqueta

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/Footer.astro`
- Test: `src/components/pages/derived-surfaces-contract.test.ts`

**Criteria:** `C8`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Research & Context:**
- El footer no aparece en la maqueta: se crea con el mismo lenguaje (tipografía, tokens, botones). Debe incluir atribución de fotos: Unsplash (6D6omiCxHWM, 3no88nSvK88).

**Implementation Contract:**
- **Target:** `footer`, `foto-credits`
- **Location:** `src/components/Footer.astro`, plantilla del componente
- **Current:** `footer legado sin atribución de fotos`
- **Change:** `footer legado sin atribución` -> `footer con atribución Unsplash y lenguaje de la maqueta`
- **Assertion:** `footer con atribucion de fotos stock`

**Spec context (minimal):**
R6 del spec: footer con logo, navegación, redes y atribución de fotos; tokens de la paleta nueva.

**Acceptance for this task:**
- [ ] Footer con clases de tokens nuevos y atribución de fotos visible.
- [ ] Enlaces internos existentes intactos.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('footer con atribucion de fotos stock', () => {
  const s = readFileSync('src/components/Footer.astro', 'utf8');
  expect(s).toContain('Unsplash');
  expect(s).toContain('6D6omiCxHWM');
  expect(s).toContain('3no88nSvK88');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: FAIL en `footer con atribucion de fotos stock`
- [ ] **Step 3: Write minimal implementation**
  - Reestilizar `Footer.astro` con tokens nuevos (`bg-surface-raised`, `text-content-muted`, `border-border`) y añadir línea de créditos con enlaces a las páginas de ambas fotos de Unsplash.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/Footer.astro src/components/pages/derived-surfaces-contract.test.ts
git commit -m "feat(footer): lenguaje visual de la maqueta con atribucion de fotos"
```

## Task 6: Home hero fotografico

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/home/HomeHero.astro`
- Test: `src/components/pages/home-contract.test.ts`

**Criteria:** `C3`, `C9`

**Control Metadata:**
- Complexity: 5
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Maqueta: foto de montaña a sangre con overlay claro; contenido izquierda: eyebrow "DESARROLLO · ANDROID · IA · PROYECTOS", H1 "Software independiente que resuelve problemas reales", subtítulo, CTA teal "Explorar proyectos →" y CTA contorno "Leer artículos".

**Implementation Contract:**
- **Target:** `home-hero`, `home-hero-title`
- **Location:** `src/components/home/HomeHero.astro`, sección `home-hero`
- **Current:** `hero centrado sin foto`
- **Change:** `hero centrado sin foto` -> `hero con foto a sangre y contenido a la izquierda`
- **Assertion:** `hero fotografico con CTAs de la maqueta`

**Spec context (minimal):**
R2 del spec + decisión D1 (`designs.md`).

**Acceptance for this task:**
- [ ] Hero con `src/assets/hero-mountain-sunset.jpg` a sangre, overlay y contenido a la izquierda.
- [ ] CTAs "Explorar proyectos →" (`bg-primary`) y "Leer artículos" (contorno).

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('hero fotografico con CTAs de la maqueta', () => {
  const s = readFileSync('src/components/home/HomeHero.astro', 'utf8');
  expect(s).toContain('hero-mountain-sunset');
  expect(s).toContain('Explorar proyectos');
  expect(s).toContain('Leer artículos');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: FAIL en `hero fotografico con CTAs de la maqueta`
- [ ] **Step 3: Write minimal implementation**
  - Rehacer el hero: imagen importada de `src/assets/hero-mountain-sunset.jpg` a sangre con `object-cover` y overlay degradado; columna izquierda con eyebrow, `h1` (`text-content font-extrabold`), subtítulo (`text-content-muted`) y dos CTAs (`bg-primary text-white` y `border-border bg-surface`).
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/home/HomeHero.astro src/components/pages/home-contract.test.ts
git commit -m "feat(home): hero fotografico a sangre con CTAs de la maqueta"
```

## Task 7: Fila de 4 pilares de la home

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/home/HomeHero.astro`
- Create: `src/components/home/HomePillars.astro`
- Test: `src/components/pages/home-contract.test.ts`

**Criteria:** `C3`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Maqueta: fila de 4 pilares con icono en cuadrado tintado + título + subtítulo, divisores verticales: Apps Android / Productos en Google Play (emerald), Herramientas de IA / Agentes y automatización (naranja), Proyectos open source / Ideas que exploro (teal), Contenido técnico / Blog y devlog (rojo). Datos existentes en `quickAccessPills` de `HomeHero.astro`.

**Implementation Contract:**
- **Target:** `HomePillars`
- **Location:** `src/components/home/HomePillars.astro`, componente nuevo
- **Current:** `sin fila de pilares en la home`
- **Change:** `sin fila de pilares` -> `HomePillars con 4 pilares de la maqueta`
- **Assertion:** `fila de 4 pilares de la home`

**Spec context (minimal):**
R3 del spec.

**Acceptance for this task:**
- [ ] Cuatro pilares con labels de la maqueta e iconos tintados (emerald, naranja, teal, rojo).
- [ ] Se renderiza debajo del hero en HomePage.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('fila de 4 pilares de la home', () => {
  const s = readFileSync('src/components/home/HomePillars.astro', 'utf8');
  expect(s).toContain('Apps Android');
  expect(s).toContain('Herramientas de IA');
  expect(s).toContain('Proyectos open source');
  expect(s).toContain('Contenido técnico');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: FAIL en `fila de 4 pilares de la home`
- [ ] **Step 3: Write minimal implementation**
  - Crear `HomePillars.astro` con los 4 ítems (labels ES/EN vía i18n), iconos Material Icons en cuadrado tintado y divisores; renderizar desde `HomePage.astro` tras el hero.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/home/HomePillars.astro src/components/home/HomeHero.astro src/components/pages/HomePage.astro src/components/pages/home-contract.test.ts src/i18n/ui.ts
git commit -m "feat(home): fila de 4 pilares segun maqueta"
```

## Task 8: Proyecto destacado split-card

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/home/HomeFeaturedWork.astro`
- Test: `src/components/pages/home-contract.test.ts`

**Criteria:** `C3`, `C9`

**Control Metadata:**
- Complexity: 5
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Maqueta: heading "Proyecto destacado", tarjeta con icono de app, título "RadioHub", meta real (chips de tags + badge Android — sin ratings, decisión D2), descripción, botones "Ver proyecto →" y "Ver en Google Play", screenshots a la derecha, flechas de carrusel debajo.
- Datos reales en `featuredWork` (`radiohub.md`: `icon`, `googlePlayUrl`, `screenshots`, `tags`).

**Implementation Contract:**
- **Target:** `home-featured-work`
- **Location:** `src/components/home/HomeFeaturedWork.astro`, plantilla de la split-card
- **Current:** `featured work legado sin meta de tags ni carrusel`
- **Change:** `featured work legado` -> `split-card con icono, meta de tags, botones y screenshots con carrusel`
- **Assertion:** `split-card Proyecto destacado con carrusel`

**Spec context (minimal):**
R4 del spec + decisiones D2 y D6.

**Acceptance for this task:**
- [ ] Split-card con icono, chips de tags reales, badge Android, 2 botones y screenshots.
- [ ] Flechas de carrusel con `aria-label` accesibles.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('split-card Proyecto destacado con carrusel', () => {
  const s = readFileSync('src/components/home/HomeFeaturedWork.astro', 'utf8');
  expect(s).toContain('Proyecto destacado');
  expect(s).toContain('Ver proyecto');
  expect(s).toContain('Ver en Google Play');
  expect(s).toContain('aria-label');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: FAIL en `split-card Proyecto destacado con carrusel`
- [ ] **Step 3: Write minimal implementation**
  - Rehacer la sección: `material-card` con grid 2 columnas (contenido izquierda: icono en cuadrado redondeado, título, chips de `tags`, badge Android, descripción, botones `bg-primary` y contorno; `screenshots` a la derecha con scroll-snap y botones ‹ ›).
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/home/HomeFeaturedWork.astro src/components/pages/home-contract.test.ts
git commit -m "feat(home): split-card Proyecto destacado con carrusel"
```

## Task 9: Ultimos articulos con chips Blog y Devlog

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/home/HomeBlog.astro`
- Modify: `src/components/pages/HomePage.astro`
- Test: `src/components/pages/home-contract.test.ts`

**Criteria:** `C3`, `C9`

**Control Metadata:**
- Complexity: 4
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Maqueta: heading "Últimos artículos", chips "Blog" (activo, teal) y "Devlog" (contorno), enlace "Ver todas →", grid de 3 tarjetas (imagen, título, fecha · tiempo de lectura). Absorbe la sección HomeDevlog (decisión D7).

**Implementation Contract:**
- **Target:** `home-articles`
- **Location:** `src/components/home/HomeBlog.astro` (renombrado lógico a artículos), plantilla
- **Current:** `HomeBlog sin chips de filtro`
- **Change:** `HomeBlog sin chips` -> `articulos con chips Blog y Devlog y grid de 3`
- **Assertion:** `ultimos articulos con chips Blog y Devlog`

**Spec context (minimal):**
R5 del spec + decisión D7.

**Acceptance for this task:**
- [ ] Chips Blog/Devlog conmutan las 3 tarjetas visibles (script inline con `data-*`).
- [ ] "Ver todas →" apunta a `/blog` o `/devlog` según chip activo.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('ultimos articulos con chips Blog y Devlog', () => {
  const s = readFileSync('src/components/home/HomeBlog.astro', 'utf8');
  expect(s).toContain('Últimos artículos');
  expect(s).toContain('Ver todas');
  expect(s).toContain('data-filter');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: FAIL en `ultimos articulos con chips Blog y Devlog`
- [ ] **Step 3: Write minimal implementation**
  - Rehacer `HomeBlog.astro` como "Últimos artículos" con chips (`data-filter="blog|devlog"`), grid `md:grid-cols-3` de tarjetas (imagen, título, `pubDate` · tiempo de lectura estimado) y enlace "Ver todas →". Quitar el render de `HomeDevlog` de `HomePage.astro`.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/home/HomeBlog.astro src/components/pages/HomePage.astro src/components/pages/home-contract.test.ts
git commit -m "feat(home): ultimos articulos con chips Blog y Devlog"
```

## Task 10: CTA final de la home

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/home/HomeCta.astro`
- Test: `src/components/pages/home-contract.test.ts`

**Criteria:** `C3`, `C9`

**Control Metadata:**
- Complexity: 2
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Maqueta (bloque "¿Hablamos?" de Sobre mí): título "¿Hablamos?", subtítulo y botón "Contactar →" teal. La home repite este bloque antes del footer (fuera de imagen, mismo lenguaje).

**Implementation Contract:**
- **Target:** `home-cta`
- **Location:** `src/components/home/HomeCta.astro`, plantilla
- **Current:** `HomeCta legado`
- **Change:** `HomeCta legado` -> `CTA ¿Hablamos? con boton Contactar`
- **Assertion:** `cta final Hablamos de la home`

**Spec context (minimal):**
R6 del spec.

**Acceptance for this task:**
- [ ] Bloque "¿Hablamos?" con botón `bg-primary` a `/contact` (ES: `/es/contact`).

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('cta final Hablamos de la home', () => {
  const s = readFileSync('src/components/home/HomeCta.astro', 'utf8');
  expect(s).toContain('Hablamos');
  expect(s).toContain('Contactar');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: FAIL en `cta final Hablamos de la home`
- [ ] **Step 3: Write minimal implementation**
  - `HomeCta.astro`: card tintada con `h2` "¿Hablamos?", subtítulo i18n y botón "Contactar →" (`bg-primary`).
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/home/HomeCta.astro src/components/pages/home-contract.test.ts src/i18n/ui.ts
git commit -m "feat(home): CTA final Hablamos con boton Contactar"
```

## Task 11: Chips de categoria de Aplicaciones

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/pages/apps/index.astro`
- Modify: `src/pages/es/apps/index.astro`
- Test: `src/components/pages/apps-contract.test.ts`

**Criteria:** `C4`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Maqueta: intro "Aplicaciones Android" + subtítulo, chips "Todas" (activo) + categorías. Con contenido real los chips derivan de los tags de las 5 apps (`Music`, `Radio`, `Streaming`, `Puzzle`, etc.) + "Todas" (decisión D6).
- Las páginas ES son copias completas: aplicar el cambio espejo en el gemelo ES listado

**Implementation Contract:**
- **Target:** `apps-category-chips`
- **Location:** `src/pages/apps/index.astro`, bloque de chips
- **Current:** `sin chips de categoria`
- **Change:** `sin chips de categoria` -> `chips Todas + tags reales con data-filter`
- **Assertion:** `chips de categoria de aplicaciones`

**Spec context (minimal):**
R7 del spec + decisión D6.

**Acceptance for this task:**
- [ ] Chip "Todas" activo por defecto; chips derivados de tags reales; filtrado en cliente por `data-filter`.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('chips de categoria de aplicaciones', () => {
  const s = readFileSync('src/pages/apps/index.astro', 'utf8');
  expect(s).toContain('Aplicaciones Android');
  expect(s).toContain('data-filter');
  expect(s).toContain('Todas');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/apps-contract.test.ts`
Expected: FAIL en `chips de categoria de aplicaciones`
- [ ] **Step 3: Write minimal implementation**
  - Intro con `h1` "Aplicaciones Android" + subtítulo i18n; chips derivados de tags únicos de las apps publicadas, con `data-filter` y chip activo `bg-primary`.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/apps-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/pages/apps/index.astro src/components/pages/apps-contract.test.ts src/i18n/ui.ts
git commit -m "feat(apps): chips de categoria derivados de tags reales"
```

## Task 12: Grid de tarjetas de Aplicaciones

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/AppCard.astro`
- Modify: `src/components/AppGallery.astro`
- Test: `src/components/pages/apps-contract.test.ts`

**Criteria:** `C4`, `C9`

**Control Metadata:**
- Complexity: 4
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Maqueta: grid 2 columnas de tarjetas con icono redondeado, título, descripción corta, badges ("Google Play" si `googlePlayUrl`, "Android") y flecha → a la derecha.

**Implementation Contract:**
- **Target:** `AppCard`
- **Location:** `src/components/AppCard.astro`, plantilla de tarjeta
- **Current:** `AppCard legado sin badges ni flecha`
- **Change:** `AppCard legado` -> `tarjeta con icono, titulo, descripcion, badges y flecha`
- **Assertion:** `grid de tarjetas de aplicaciones`

**Spec context (minimal):**
R7 del spec.

**Acceptance for this task:**
- [ ] Tarjeta con icono, título, descripción, badges condicionales y flecha; grid `md:grid-cols-2`.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('grid de tarjetas de aplicaciones', () => {
  const s = readFileSync('src/components/AppCard.astro', 'utf8');
  expect(s).toContain('Google Play');
  expect(s).toContain('material-icons');
  expect(s).toContain('arrow_forward');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/apps-contract.test.ts`
Expected: FAIL en `grid de tarjetas de aplicaciones`
- [ ] **Step 3: Write minimal implementation**
  - `AppCard.astro`: `material-card` con icono (`realIconUrl` o `icon`), título, descripción, badges (`Google Play` si `googlePlayUrl`, `Android`) y `arrow_forward`; `AppGallery.astro` en `grid md:grid-cols-2 gap-4`.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/apps-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/AppCard.astro src/components/AppGallery.astro src/components/pages/apps-contract.test.ts
git commit -m "feat(apps): grid de tarjetas con badges y flecha"
```

## Task 13: Destacada RadioHub de Aplicaciones

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/pages/apps/index.astro`
- Modify: `src/pages/es/apps/index.astro`
- Test: `src/components/pages/apps-contract.test.ts`

**Criteria:** `C4`, `C9`

**Control Metadata:**
- Complexity: 4
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Maqueta: bloque "La radio, como te gusta" con icono+nombre RadioHub, descripción, botones "Ver en Google Play" y "Ver código", screenshots, y fila de 4 características: "Miles de emisoras" (30,000+ emisoras reales), "Favoritos", "Sin registros", "Diseño Material 3" (todo respaldado por `radiohub.md`).
- Las páginas ES son copias completas: aplicar el cambio espejo en el gemelo ES listado

**Implementation Contract:**
- **Target:** `apps-featured-radiohub`
- **Location:** `src/pages/apps/index.astro`, sección destacada
- **Current:** `sin seccion destacada de RadioHub`
- **Change:** `sin seccion destacada` -> `destacada La radio como te gusta con 4 caracteristicas`
- **Assertion:** `destacada RadioHub con 4 caracteristicas`

**Spec context (minimal):**
R7 del spec + tabla de mapeo (características reales de `radiohub.md`).

**Acceptance for this task:**
- [ ] Bloque con título "La radio, como te gusta", 2 botones y 4 características reales.
- [ ] Screenshots del frontmatter de `radiohub.md`.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('destacada RadioHub con 4 caracteristicas', () => {
  const s = readFileSync('src/pages/apps/index.astro', 'utf8');
  expect(s).toContain('La radio, como te gusta');
  expect(s).toContain('Miles de emisoras');
  expect(s).toContain('Material 3');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/apps-contract.test.ts`
Expected: FAIL en `destacada RadioHub con 4 caracteristicas`
- [ ] **Step 3: Write minimal implementation**
  - Sección destacada tras el grid: split-card con datos de `radiohub.md`, botones "Ver en Google Play →" y "Ver código →", y grid de 4 características (icono + título + subtítulo).
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/apps-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/pages/apps/index.astro src/components/pages/apps-contract.test.ts src/i18n/ui.ts
git commit -m "feat(apps): destacada RadioHub con 4 caracteristicas reales"
```

## Task 14: Buscador y chips de tags del Blog

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/pages/blog/[...page].astro`
- Modify: `src/pages/es/blog/[...page].astro`
- Test: `src/components/pages/blog-contract.test.ts`

**Criteria:** `C5`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Maqueta: eyebrow "BLOG", H1 "Artículos técnicos y guías", buscador, chips "Todas" + tags (`Android`, `Kotlin`, `IA`, `Desarrollo`, `Herramientas`) + "Más +". Con contenido real: tags más frecuentes de `blog` + desborde.
- Las páginas ES son copias completas: aplicar el cambio espejo en el gemelo ES listado

**Implementation Contract:**
- **Target:** `blog-filters`
- **Location:** `src/pages/blog/`, componente de listado paginado
- **Current:** `listado sin buscador ni chips de tags`
- **Change:** `listado sin buscador ni chips` -> `buscador + chips de tags con Mas +`
- **Assertion:** `buscador y chips de tags del blog`

**Spec context (minimal):**
R8 del spec + decisión D6.

**Acceptance for this task:**
- [ ] Eyebrow "BLOG", H1, `Search.astro` y chips con `data-filter` y desborde "Más +".

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('buscador y chips de tags del blog', () => {
  const s = readFileSync('src/pages/blog/[...page].astro', 'utf8');
  expect(s).toContain('Artículos técnicos y guías');
  expect(s).toContain('data-filter');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/blog-contract.test.ts`
Expected: FAIL en `buscador y chips de tags del blog`
- [ ] **Step 3: Write minimal implementation**
  - Cabecera con eyebrow, `h1` i18n, componente `Search` y chips derivados de tags frecuentes (top 5 + "Más +" con el resto), filtrado en cliente por `data-filter`.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/blog-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add "src/pages/blog/[...page].astro" src/components/pages/blog-contract.test.ts src/i18n/ui.ts
git commit -m "feat(blog): buscador y chips de tags segun maqueta"
```

## Task 15: Filas editoriales del Blog

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/BlogCard.astro`
- Test: `src/components/pages/blog-contract.test.ts`

**Criteria:** `C5`, `C9`

**Control Metadata:**
- Complexity: 4
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Maqueta: filas con miniatura izquierda, título, resumen, meta "12 oct 2026 · 8 min" y badge de tag sobre la imagen. `pubDate` + tiempo de lectura estimado (palabras/200).

**Implementation Contract:**
- **Target:** `BlogCard`
- **Location:** `src/components/BlogCard.astro`, plantilla de tarjeta
- **Current:** `BlogCard legado sin tiempo de lectura`
- **Change:** `BlogCard legado` -> `fila editorial con miniatura, resumen, fecha y lectura estimada`
- **Assertion:** `filas editoriales del blog con meta`

**Spec context (minimal):**
R8 del spec + tabla de mapeo (fecha · tiempo de lectura).

**Acceptance for this task:**
- [ ] Meta con `pubDate` formateado · minutos estimados; badge de tag; miniatura con fallback de placeholder.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('filas editoriales del blog con meta', () => {
  const s = readFileSync('src/components/BlogCard.astro', 'utf8');
  expect(s).toContain('min');
  expect(s).toContain('heroImage');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/blog-contract.test.ts`
Expected: FAIL en `filas editoriales del blog con meta`
- [ ] **Step 3: Write minimal implementation**
  - `BlogCard.astro` en fila (`sm:flex`): miniatura 16:9, título `text-content`, resumen `text-content-muted`, meta `pubDate` · `readingTime` (prop calculada en la página desde el cuerpo), badge del primer tag.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/blog-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/BlogCard.astro src/components/pages/blog-contract.test.ts
git commit -m "feat(blog): filas editoriales con meta de lectura estimada"
```

## Task 16: Devlog con chips y entrada destacada

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/pages/DevlogIndexPage.astro`
- Modify: `src/pages/devlog/index.astro`
- Modify: `src/pages/es/devlog/index.astro`
- Test: `src/components/pages/devlog-contract.test.ts`

**Criteria:** `C6`, `C9`

**Control Metadata:**
- Complexity: 4
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Maqueta: H1 "Devlog", intro, chips (`Todos`, `Coucou`, `RadioHub`, `Herramientas`, `Otros`), tarjeta destacada con imagen grande, badge superior, título, resumen, meta y "Leer artículo →". Chips reales derivados de tags/series de `devlog` (decisión D6).
- Las páginas ES son copias completas: aplicar el cambio espejo en el gemelo ES listado

**Implementation Contract:**
- **Target:** `devlog-featured`
- **Location:** `src/components/pages/DevlogIndexPage.astro`, cabecera y destacada
- **Current:** `devlog index legado sin destacada ni chips`
- **Change:** `devlog index legado` -> `chips + entrada destacada con badge y Leer articulo`
- **Assertion:** `devlog con chips y entrada destacada`

**Spec context (minimal):**
R9 del spec + decisión D6.

**Acceptance for this task:**
- [ ] Chips derivados de tags reales + "Todos" + "Otros"; destacada con la entrada más reciente.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('devlog con chips y entrada destacada', () => {
  const s = readFileSync('src/components/pages/DevlogIndexPage.astro', 'utf8');
  expect(s).toContain('Leer artículo');
  expect(s).toContain('data-filter');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/devlog-contract.test.ts`
Expected: FAIL en `devlog con chips y entrada destacada`
- [ ] **Step 3: Write minimal implementation**
  - Cabecera (`h1` Devlog + intro i18n), chips con `data-filter`, y tarjeta destacada (imagen grande, badge del tag principal, título, resumen, meta fecha · lectura, "Leer artículo →" `bg-primary`).
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/devlog-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/pages/DevlogIndexPage.astro src/pages/devlog/index.astro src/components/pages/devlog-contract.test.ts src/i18n/ui.ts
git commit -m "feat(devlog): chips y entrada destacada segun maqueta"
```

## Task 17: Grid de tarjetas del Devlog

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/pages/DevlogIndexPage.astro`
- Test: `src/components/pages/devlog-contract.test.ts`

**Criteria:** `C6`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Maqueta: grid de 2 columnas bajo la destacada con tarjetas (título, resumen, fecha · lectura). Resto de entradas reales.

**Implementation Contract:**
- **Target:** `devlog-grid`
- **Location:** `src/components/pages/DevlogIndexPage.astro`, grid de entradas
- **Current:** `sin grid de tarjetas tras la destacada`
- **Change:** `sin grid tras destacada` -> `grid md:grid-cols-2 de tarjetas de devlog`
- **Assertion:** `grid de tarjetas del devlog`

**Spec context (minimal):**
R9 del spec.

**Acceptance for this task:**
- [ ] Grid 2 columnas con el resto de entradas (excluida la destacada).

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('grid de tarjetas del devlog', () => {
  const s = readFileSync('src/components/pages/DevlogIndexPage.astro', 'utf8');
  expect(s).toContain('md:grid-cols-2');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/devlog-contract.test.ts`
Expected: FAIL en `grid de tarjetas del devlog`
- [ ] **Step 3: Write minimal implementation**
  - Tras la destacada, `div` con `grid md:grid-cols-2 gap-4` y tarjetas (`material-card`) de las entradas restantes con título, resumen y meta.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/devlog-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/pages/DevlogIndexPage.astro src/components/pages/devlog-contract.test.ts
git commit -m "feat(devlog): grid de tarjetas 2 columnas"
```

## Task 18: Sobre mi con foto y stats dinamicos

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/pages/AboutPage.astro`
- Test: `src/components/pages/about-ux-contract.test.ts`

**Criteria:** `C7`, `C9`

**Control Metadata:**
- Complexity: 5
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Maqueta: H1 "Hola, soy ArceApps", intro, foto de montaña, bio, stats ("Apps publicadas", "Artículos publicados", "Proyectos open source") con conteos reales dinámicos: 5 / 162 / 3 (decisión D3).

**Implementation Contract:**
- **Target:** `about-hero`, `about-stats`
- **Location:** `src/components/pages/AboutPage.astro`, cabecera y bloque de stats
- **Current:** `about sin foto de portada ni stats`
- **Change:** `about sin foto ni stats` -> `hero con foto about-mountains y stats dinamicos`
- **Assertion:** `sobre mi con foto y stats dinamicos`

**Spec context (minimal):**
R10 del spec + decisiones D3 y D5.

**Acceptance for this task:**
- [ ] `src/assets/about-mountains.jpg` como foto de portada.
- [ ] Stats calculados de las colecciones reales (apps publicadas, artículos publicados, proyectos).

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('sobre mi con foto y stats dinamicos', () => {
  const s = readFileSync('src/components/pages/AboutPage.astro', 'utf8');
  expect(s).toContain('Hola, soy ArceApps');
  expect(s).toContain('about-mountains');
  expect(s).toContain('Apps publicadas');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/about-ux-contract.test.ts`
Expected: FAIL en `sobre mi con foto y stats dinamicos`
- [ ] **Step 3: Write minimal implementation**
  - Hero con `h1`, intro, imagen `about-mountains.jpg` redondeada; bio; fila de 3 stats con conteos de `getCollection` (`apps`, `blog`, `projects`) publicados del idioma actual.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/about-ux-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/pages/AboutPage.astro src/components/pages/about-ux-contract.test.ts src/i18n/ui.ts
git commit -m "feat(about): hero con foto y stats dinamicos reales"
```

## Task 19: En que trabajo y CTA de Sobre mi

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/pages/AboutPage.astro`
- Test: `src/components/pages/about-ux-contract.test.ts`

**Criteria:** `C7`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Maqueta: bloque "En qué trabajo" con 4 ítems (icono + título + subtítulo): Desarrollo Android / Apps nativas con Kotlin y Jetpack Compose; Inteligencia artificial / Agentes, automatización y herramientas prácticas; Proyectos de software / Herramientas, librerías y experimentos; Contenido técnico / Blog, devlog y guías prácticas. Luego "¿Hablamos?" con botón "Contactar →".

**Implementation Contract:**
- **Target:** `about-work`, `about-cta`
- **Location:** `src/components/pages/AboutPage.astro`, bloques finales
- **Current:** `sin bloque En que trabajo`
- **Change:** `sin bloque En que trabajo` -> `4 items de En que trabajo + CTA Contactar`
- **Assertion:** `bloque en que trabajo y cta contactar`

**Spec context (minimal):**
R10 del spec.

**Acceptance for this task:**
- [ ] 4 ítems con iconos y textos de la maqueta; CTA "¿Hablamos?" con botón `bg-primary` a Contacto.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('bloque en que trabajo y cta contactar', () => {
  const s = readFileSync('src/components/pages/AboutPage.astro', 'utf8');
  expect(s).toContain('En qué trabajo');
  expect(s).toContain('Desarrollo Android');
  expect(s).toContain('Contactar');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/about-ux-contract.test.ts`
Expected: FAIL en `bloque en que trabajo y cta contactar`
- [ ] **Step 3: Write minimal implementation**
  - Lista de 4 ítems (icono tintado, título, subtítulo) con strings i18n y bloque "¿Hablamos?" con botón "Contactar →".
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/about-ux-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/pages/AboutPage.astro src/components/pages/about-ux-contract.test.ts src/i18n/ui.ts
git commit -m "feat(about): bloque En que trabajo y CTA Contactar"
```

## Task 20: Proyectos y Contacto con lenguaje visual

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/pages/projects.astro`
- Modify: `src/pages/contact.astro`
- Modify: `src/pages/es/projects.astro`
- Modify: `src/pages/es/contact.astro`
- Test: `src/components/pages/derived-surfaces-contract.test.ts`

**Criteria:** `C8`, `C9`

**Control Metadata:**
- Complexity: 4
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Ambas superficies no aparecen en la maqueta: se crean con el mismo lenguaje (PageIntro, `material-card`, tokens nuevos). Proyectos: grid de `ProjectCard` reales. Contacto: intro + `ContactForm.astro` existente.
- Las páginas ES son copias completas: aplicar el cambio espejo en el gemelo ES listado

**Implementation Contract:**
- **Target:** `projects-page`, `contact-page`
- **Location:** `src/pages/projects.astro`, `src/pages/contact.astro`, plantillas
- **Current:** `paginas con estilo legado`
- **Change:** `paginas con estilo legado` -> `paginas con intro, material-card y tokens de la maqueta`
- **Assertion:** `proyectos y contacto con lenguaje visual`

**Spec context (minimal):**
R11 del spec.

**Acceptance for this task:**
- [ ] Ambas páginas usan tokens nuevos y patrones de tarjeta/tipografía de las pantallas maquetadas.
- [ ] Sin cambios de URL ni de contenido.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('proyectos y contacto con lenguaje visual', () => {
  for (const f of ['src/pages/projects.astro', 'src/pages/contact.astro']) {
    const s = readFileSync(f, 'utf8');
    expect(s).toContain('material-card');
    expect(s).toContain('text-content-muted');
  }
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: FAIL en `proyectos y contacto con lenguaje visual`
- [ ] **Step 3: Write minimal implementation**
  - Alinear ambas plantillas con la maqueta: `PageIntro` con eyebrow/título/subtítulo, tarjetas `material-card`, botones `bg-primary`, tipografía de headings `font-heading`.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/pages/projects.astro src/pages/contact.astro src/components/pages/derived-surfaces-contract.test.ts
git commit -m "feat(pages): proyectos y contacto con lenguaje visual de la maqueta"
```

## Task 21: Paginas de detalle con lenguaje visual

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/pages/apps/[...slug].astro`
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/pages/devlog/[...slug].astro`
- Modify: `src/pages/projects/[...slug].astro`
- Modify: `src/pages/es/apps/[...slug].astro`
- Modify: `src/pages/es/blog/[...slug].astro`
- Modify: `src/pages/es/devlog/[...slug].astro`
- Modify: `src/pages/es/projects/[...slug].astro`
- Test: `src/components/pages/derived-surfaces-contract.test.ts`

**Criteria:** `C8`, `C9`

**Control Metadata:**
- Complexity: 6
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Detalles no maquetados: mantener estructura actual (breadcrumbs, hero, galería, contenido) y reestilizar con tokens nuevos, botones `bg-primary` y tarjetas `material-card` para que lean como la maqueta.
- Las páginas ES son copias completas: aplicar el cambio espejo en el gemelo ES listado

**Implementation Contract:**
- **Target:** `detail-layout`
- **Location:** `src/pages/apps/`, `src/pages/blog/`, `src/pages/devlog/`, `src/pages/projects/`, plantillas de detalle
- **Current:** `detalles con estilos legados`
- **Change:** `detalles con estilos legados` -> `detalles con tokens y componentes de la maqueta`
- **Assertion:** `paginas de detalle con lenguaje visual`

**Spec context (minimal):**
R11 del spec; sin cambios de contenido ni URL.

**Acceptance for this task:**
- [ ] Las 4 plantillas usan tokens nuevos y componentes compartidos (`material-card`, botones primarios).
- [ ] Galerías y metas existentes intactas.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('paginas de detalle con lenguaje visual', () => {
  for (const f of ['src/pages/apps/[...slug].astro', 'src/pages/blog/[...slug].astro', 'src/pages/devlog/[...slug].astro', 'src/pages/projects/[...slug].astro']) {
    const s = readFileSync(f, 'utf8');
    expect(s).toContain('text-content-muted');
  }
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: FAIL en `paginas de detalle con lenguaje visual`
- [ ] **Step 3: Write minimal implementation**
  - Sustituir clases de color legadas (`text-gray-*`, `bg-white`, `#007F7D`, etc.) por tokens semánticos (`text-content`, `bg-surface-raised`, `bg-primary`) en las 4 plantillas.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/pages/apps src/pages/blog src/pages/devlog src/pages/projects src/components/pages/derived-surfaces-contract.test.ts
git commit -m "feat(pages): detalles con tokens y lenguaje visual de la maqueta"
```

## Task 22: Superficies secundarias con lenguaje visual

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/pages/404.astro`
- Modify: `src/pages/cookies.astro`
- Modify: `src/pages/privacy-policy.astro`
- Modify: `src/pages/series/[slug].astro`
- Modify: `src/pages/es/cookies.astro`
- Modify: `src/pages/es/privacy-policy.astro`
- Modify: `src/pages/es/series/[slug].astro`
- Test: `src/components/pages/derived-surfaces-contract.test.ts`

**Criteria:** `C8`, `C9`

**Control Metadata:**
- Complexity: 4
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Superficies restantes fuera de la maqueta: 404, cookies, privacidad y series. Mismo lenguaje: tokens nuevos, tipografía, tarjetas.
- Las páginas ES son copias completas: aplicar el cambio espejo en el gemelo ES listado

**Implementation Contract:**
- **Target:** `secondary-surfaces`
- **Location:** `src/pages/404.astro`, `src/pages/cookies.astro`, `src/pages/privacy-policy.astro`, `src/pages/series/`
- **Current:** `superficies secundarias con estilos legados`
- **Change:** `superficies secundarias legadas` -> `superficies con tokens de la maqueta`
- **Assertion:** `superficies secundarias con lenguaje visual`

**Spec context (minimal):**
R11 del spec.

**Acceptance for this task:**
- [ ] Las 4 plantillas usan tokens nuevos; textos legales intactos.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('superficies secundarias con lenguaje visual', () => {
  for (const f of ['src/pages/404.astro', 'src/pages/cookies.astro', 'src/pages/privacy-policy.astro', 'src/pages/series/[slug].astro']) {
    const s = readFileSync(f, 'utf8');
    expect(s).toContain('text-content');
  }
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: FAIL en `superficies secundarias con lenguaje visual`
- [ ] **Step 3: Write minimal implementation**
  - Migrar clases de color legadas a tokens semánticos en las 4 plantillas, conservando textos y estructura legal.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/pages/404.astro src/pages/cookies.astro src/pages/privacy-policy.astro "src/pages/series/[slug].astro" src/components/pages/derived-surfaces-contract.test.ts
git commit -m "feat(pages): superficies secundarias con lenguaje visual"
```

## Task 23: Pliego comparativo de verificacion visual

**Status:** completed
**Completed:** [x]

**Files:**
- Test: `artifacts/portfolio-visual-qa/portfolio-visual-report.md`

**Criteria:** `C10`, `C9`

**Control Metadata:**
- Complexity: 2
- Risk: Low
- Checkpoint: No

**Research & Context:**
- `scripts/portfolio-visual-qa.mjs` ya genera capturas ES/EN × móvil/escritorio × claro/oscuro contra `pnpm preview`. Este pliego es la base del Gate UA.

**Implementation Contract:**
- **Target:** `pliego comparativo`
- **Location:** `artifacts/portfolio-visual-qa/`, generación de artefactos de QA visual
- **Current:** `N/A — el pliego no existe hasta ejecutar la verificacion visual`
- **Change:** N/A — verification-only; se genera el pliego comparativo sin modificar codigo de producto
- **Assertion:** `pliego comparativo generado`

**Spec context (minimal):**
Costura de capturas de `designs.md` para el Gate UA.

**Acceptance for this task:**
- [ ] El reporte y las capturas existen en `artifacts/portfolio-visual-qa/`.
- [ ] Ningún archivo de producto modificado.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
import { existsSync } from 'node:fs';
it('pliego comparativo generado', () => {
  expect(existsSync('artifacts/portfolio-visual-qa/portfolio-visual-report.md')).toBe(true);
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: FAIL mientras no exista el reporte
- [ ] **Step 3: Write minimal implementation**
```bash
node scripts/portfolio-visual-qa.mjs
```
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add artifacts/portfolio-visual-qa
git commit -m "test(visual-qa): pliego comparativo para Gate UA"
```

## Task 24: Correctivo — tokens del body en Layout

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/layouts/Layout.astro`
- Test: `src/styles/design-contract.test.ts`

**Criteria:** `C1`, `C9`

**Control Metadata:**
- Complexity: 2
- Risk: Medium
- Checkpoint: No

**Corrective Of:** `C1` — evidencia: `src/layouts/Layout.astro:275` conserva `bg-[#F8F9FA]` y `text-[#111827]`, sobrescribiendo la paleta nueva en TODO el sitio (el QA visual reporta fondo claro rgb(248,249,250)).

**Implementation Contract:**
- **Target:** `body`
- **Location:** `src/layouts/Layout.astro`, atributo `class` del elemento `body`
- **Current:** `bg-[#F8F9FA] dark:bg-[#091117] text-[#111827] dark:text-[#F3F4F6]`
- **Change:** `bg-[#F8F9FA] text-[#111827]` -> `bg-[#FCFCFC] text-[#0B1014]` (dark conservado o migrado a tokens `dark:bg-dark-surface dark:text-dark-content`)
- **Assertion:** `body de Layout con tokens de la maqueta`

**Spec context (minimal):**
Paleta medida: body claro #FCFCFC, contenido #0B1014; dark #091117/#F3F4F6 (sin cambio visual).

**Acceptance for this task:**
- [ ] Layout sin literales legados de paleta.
- [ ] design-contract pasa con la paleta completa.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('body de Layout con tokens de la maqueta', () => {
  const layout = readFileSync('src/layouts/Layout.astro', 'utf8');
  expect(layout).toContain('bg-[#FCFCFC]');
  expect(layout).toContain('text-[#0B1014]');
  expect(layout).not.toContain('#F8F9FA');
  expect(layout).not.toContain('#111827');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/styles/design-contract.test.ts`
Expected: FAIL en `body de Layout con tokens de la maqueta`
- [ ] **Step 3: Write minimal implementation**
  - En `src/layouts/Layout.astro`, clase del `body`: `bg-[#FCFCFC] ... text-[#0B1014] ...` (dark sin cambios visuales).
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/styles/design-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/layouts/Layout.astro src/styles/design-contract.test.ts
git commit -m "fix(design): body de Layout con tokens de la maqueta"
```

## Task 25: Correctivo — tokens de ProjectCard

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/ProjectCard.astro`
- Test: `src/components/pages/derived-surfaces-contract.test.ts`

**Criteria:** `C1`, `C8`

**Control Metadata:**
- Complexity: 3
- Risk: Medium
- Checkpoint: No

**Corrective Of:** `C1` — evidencia: `src/components/ProjectCard.astro` conserva `bg-white`, `#111E26`, `#1F333E`, `#0D171F`, `#16242E` y clases `teal-*`.

**Implementation Contract:**
- **Target:** `ProjectCard`
- **Location:** `src/components/ProjectCard.astro`, plantilla del componente
- **Current:** `bg-white`, `#111E26`, `#1F333E`, `#0D171F`, `#16242E`, `teal-*`
- **Change:** `literales legados` -> `tokens semanticos (bg-surface-raised, dark:bg-dark-surface-raised, border-border, dark:border-dark-border, dark:text-primary)`
- **Assertion:** `ProjectCard con tokens semanticos`

**Spec context (minimal):**
Superficie derivada con el lenguaje visual de la maqueta (R11).

**Acceptance for this task:**
- [ ] ProjectCard sin literales legados ni teal-*.
- [ ] derived-surfaces-contract cubre ProjectCard.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('ProjectCard con tokens semanticos', () => {
  const s = readFileSync('src/components/ProjectCard.astro', 'utf8');
  expect(s).toContain('bg-surface-raised');
  for (const legacy of ['#111E26', '#1F333E', '#0D171F', '#16242E', 'bg-white', 'teal-']) {
    expect(s, 'literal legado ' + legacy).not.toContain(legacy);
  }
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: FAIL en `ProjectCard con tokens semanticos`
- [ ] **Step 3: Write minimal implementation**
  - Migrar la plantilla a tokens semánticos equivalentes (sin cambio de estructura).
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/ProjectCard.astro src/components/pages/derived-surfaces-contract.test.ts
git commit -m "fix(design): ProjectCard con tokens semanticos"
```

## Task 26: Correctivo — acento dark uniforme #00ACB0

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/styles/global.css`
- Test: `src/styles/design-contract.test.ts`

**Criteria:** `C1`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Medium
- Checkpoint: No

**Corrective Of:** `C1` — evidencia: `global.css` usa `#00bfa5` y componentes resuelven dark con `dark:text-teal-300`/`teal-400` en vez de `#00ACB0` (deriva de acento dentro del mismo lenguaje visual).

**Implementation Contract:**
- **Target:** `dark accent`, `dark:text-teal-300`, `dark:text-teal-400`
- **Location:** `src/styles/global.css` y componentes con clases `teal-*` en modo dark
- **Current:** `#00bfa5`, `dark:text-teal-300`, `dark:text-teal-400`
- **Change:** `teal-* y #00bfa5` -> `#00ACB0 / dark:text-primary`
- **Assertion:** `acento dark uniforme #00ACB0`

**Spec context (minimal):**
Decisión D4: acento dark `#00ACB0` vía overrides `:root.dark` de `bg-primary/text-primary/border-primary`.

**Acceptance for this task:**
- [ ] Sin `#00bfa5` ni `dark:text-teal-*` en src/ fuera de tests.
- [ ] design-contract aserta la uniformidad.

**Steps:**

- [ ] **Step 1: Write the failing test**
```ts
it('acento dark uniforme #00ACB0', () => {
  expect(globalStyles).not.toContain('#00bfa5');
  expect(consumerSource).not.toContain('dark:text-teal-');
  expect(consumerSource).not.toContain('dark:bg-teal-');
});
```
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/styles/design-contract.test.ts`
Expected: FAIL en `acento dark uniforme #00ACB0`
- [ ] **Step 3: Write minimal implementation**
  - `global.css`: `#00bfa5` -> `#00ACB0`. Componentes: `dark:text-teal-300`/`dark:text-teal-400` -> `dark:text-primary` (o `dark:text-[#00ACB0]` donde no exista la clase).
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/styles/design-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/styles/global.css src/styles/design-contract.test.ts
git commit -m "fix(design): acento dark uniforme #00ACB0"
```

## Task 27: Correctivo — sin hover scale en el árbol

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/pages/AboutPage.astro`
- Modify: `src/components/pages/DevlogIndexPage.astro`
- Modify: `src/components/home/HomeBlog.astro`
- Modify: `src/components/Header.astro`
- Modify: `src/components/AppGallery.astro`
- Modify: `src/layouts/Layout.astro`
- Test: `src/components/cross-cutting-contract.test.ts`

**Criteria:** `C8`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Corrective Of:** `C8` — evidencia: 10 apariciones de `hover:scale`/`group-hover:scale`/`hover:-translate-y-1` en AboutPage (x4), DevlogIndexPage, HomeBlog (x2), Header, AppGallery, Layout; cross-cutting-contract solo audita 5 componentes y por eso pasa en verde.

**Implementation Contract:**
- **Target:** `hover:scale`, `group-hover:scale`, `hover:-translate-y-1`
- **Location:** `src/components/pages/AboutPage.astro`, `src/components/pages/DevlogIndexPage.astro`, `src/components/home/HomeBlog.astro`, `src/components/Header.astro`, `src/components/AppGallery.astro`, `src/layouts/Layout.astro`
- **Current:** `10 apariciones de transform en hover`
- **Change:** `hover:scale-* y hover:-translate-y-1` -> `sin transform (hover por color/borde)`
- **Assertion:** `sin hover scale en el arbol`

**Spec context (minimal):**
cross-cutting-contract del repo prohíbe hover scale/translate/rotate; la maqueta no los usa.

**Acceptance for this task:**
- [ ] Cero transform de hover en los 6 archivos.
- [ ] cross-cutting-contract ampliado a los 6 archivos.

**Steps:**

- [ ] **Step 1: Write the failing test** (amplía el sweep de `cross-cutting-contract.test.ts` a los 6 archivos y aserta `not.toContain('hover:scale')`, `not.toContain('group-hover:scale')`, `not.toContain('hover:-translate')`)
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/cross-cutting-contract.test.ts`
Expected: FAIL
- [ ] **Step 3: Write minimal implementation**
  - Eliminar los transform de hover (mantener feedback por color/borde); sin cambios de estructura.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/cross-cutting-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/pages/AboutPage.astro src/components/pages/DevlogIndexPage.astro src/components/home/HomeBlog.astro src/components/Header.astro src/components/AppGallery.astro src/layouts/Layout.astro src/components/cross-cutting-contract.test.ts
git commit -m "fix(design): elimina hover scale del arbol de componentes"
```

## Task 28: Correctivo — 404 localizado ES/EN

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/pages/404.astro`
- Create: `src/pages/es/404.astro`
- Test: `src/components/pages/derived-surfaces-contract.test.ts`

**Criteria:** `C8`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Corrective Of:** `C8` — evidencia: `src/pages/404.astro` no tiene gemelo ES ni textos i18n (viola paridad R12).

**Implementation Contract:**
- **Target:** `404-pages`
- **Location:** `src/pages/404.astro`, `src/pages/es/404.astro`
- **Current:** `404 monolitico sin gemelo ES ni i18n`
- **Change:** `404 monolitico` -> `404 EN/ES con textos i18n`
- **Assertion:** `404 localizado ES y EN`

**Spec context (minimal):**
R12: paridad ES/EN en todas las superficies.

**Acceptance for this task:**
- [ ] Ambos 404 con copy i18n localizada y tokens nuevos.
- [ ] derived-surfaces-contract cubre ambos.

**Steps:**

- [ ] **Step 1: Write the failing test** (asertar ambos archivos con claves i18n y sin literales ES en el EN)
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: FAIL
- [ ] **Step 3: Write minimal implementation**
  - i18n de los textos del 404 + crear `src/pages/es/404.astro` con `useTranslations('es')` (patrón de los otros gemelos).
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/pages/404.astro src/pages/es/404.astro src/components/pages/derived-surfaces-contract.test.ts src/i18n/ui.ts
git commit -m "fix(i18n): 404 localizado ES y EN"
```

## Task 29: Correctivo — copy home vía i18n y claves muertas

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/components/home/HomeFeaturedWork.astro`
- Modify: `src/components/home/HomeBlog.astro`
- Modify: `src/components/home/HomeCta.astro`
- Modify: `src/i18n/ui.ts`
- Test: `src/components/pages/home-contract.test.ts`

**Criteria:** `C3`, `C9`

**Control Metadata:**
- Complexity: 4
- Risk: Medium
- Checkpoint: No

**Corrective Of:** `C3` — evidencia: literales ES hardcodeados en HomeFeaturedWork/HomeBlog/HomeCta (p. ej. 'Proyecto destacado', 'Ver proyecto') y claves muertas en ui.ts (`home.work.cta`, `home.work.title`, `home.devlog.all`, `home.explore_code*`, `home.view_*`, `home.tech_articles*`, `blog.subtitle`, `devlog.subtitle`).

**Implementation Contract:**
- **Target:** `home copy i18n`
- **Location:** `src/components/home/HomeFeaturedWork.astro`, `src/components/home/HomeBlog.astro`, `src/components/home/HomeCta.astro`, `src/i18n/ui.ts`
- **Current:** `literales ES hardcodeados + claves muertas`
- **Change:** `literales hardcodeados` -> `claves t() consumidas en ES y EN`
- **Assertion:** `home sin copy hardcodeada ni claves muertas`

**Spec context (minimal):**
R12: copy localizada por idioma; sin claves muertas.

**Acceptance for this task:**
- [ ] Los 3 componentes consumen claves (sin literales ES en render EN).
- [ ] Claves muertas eliminadas (y tests que las afirmaban actualizados).

**Steps:**

- [ ] **Step 1: Write the failing test** (asertar que cada clave declarada se consume y que los componentes usan t()/useTranslations sin literales muertos)
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: FAIL
- [ ] **Step 3: Write minimal implementation**
  - Sustituir literales por claves; eliminar claves muertas de ui.ts; actualizar asserts afectados.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/home-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/components/home/HomeFeaturedWork.astro src/components/home/HomeBlog.astro src/components/home/HomeCta.astro src/i18n/ui.ts src/components/pages/home-contract.test.ts
git commit -m "fix(i18n): copy home por claves y claves muertas eliminadas"
```

## Task 30: Correctivo — variant de apps, HomeDevlog y sweeps

**Status:** completed
**Completed:** [x]

**Files:**
- Modify: `src/pages/apps/index.astro`
- Delete: `src/components/home/HomeDevlog.astro`
- Modify: `src/components/pages/derived-surfaces-contract.test.ts`
- Test: `src/components/pages/derived-surfaces-contract.test.ts`

**Criteria:** `C4`, `C8`, `C9`

**Control Metadata:**
- Complexity: 3
- Risk: Medium
- Checkpoint: No

**Corrective Of:** `C4` — evidencia: variante arbitraria mal formada `[&>header]>p]:mx-0` en `src/pages/apps/index.astro:122` (no aplica; diverge del gemelo ES) y `src/components/home/HomeDevlog.astro` es código muerto tras D7.

**Implementation Contract:**
- **Target:** `apps intro variant`, `HomeDevlog`
- **Location:** `src/pages/apps/index.astro`, `src/components/home/HomeDevlog.astro`
- **Current:** `[&>header]>p]:mx-0` y `HomeDevlog.astro existente`
- **Change:** `[&>header]>p]:mx-0` -> `[&>header>p]:mx-0` (y `HomeDevlog.astro existente` -> `HomeDevlog.astro eliminado`)
- **Assertion:** `variant corregida y HomeDevlog eliminado`

**Spec context (minimal):**
Consistencia EN/ES (R12) y limpieza tras D7.

**Acceptance for this task:**
- [ ] Variant idéntica al gemelo ES; HomeDevlog eliminado sin referencias.
- [ ] derived-surfaces-contract ampliado a Layout.astro y ProjectCard.astro (sweep anti-regresión).

**Steps:**

- [ ] **Step 1: Write the failing test** (asertar variant correcta, ausencia de HomeDevlog y sweep ampliado)
- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: FAIL
- [ ] **Step 3: Write minimal implementation**
  - Corregir la variante, borrar HomeDevlog.astro (sin referencias), ampliar sweeps de derived-surfaces-contract a Layout.astro/ProjectCard.astro/home/*.
- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
Expected: PASS
- [ ] **Step 5: Commit**
```bash
git add src/pages/apps/index.astro src/components/pages/derived-surfaces-contract.test.ts
git rm src/components/home/HomeDevlog.astro
git commit -m "fix(pages): variant de apps, HomeDevlog eliminado y sweeps ampliados"
```

