# 20260729-editorial-home-redesign — Verification Report

> Fuente única de verdad para los criterios de aceptación. Este archivo NO debe duplicarse en `plan.md` o `tasks.md`.
> El agente verifier compara la implementación final contra esta lista al terminar.

## Resumen ejecutivo

La pantalla principal ha pasado de una rejilla Bento a una portada editorial tipográfica con cuatro secciones numeradas. Los colores de marca Teal `#018786` y Orange `#FF9800` se conservan en todo el sitio.

## Criterios de aceptación globales

### Estructura y archivos

- [ ] Existe `src/components/home/HomeHero.astro`.
- [ ] Existe `src/components/home/HomeSectionHeader.astro`.
- [ ] Existe `src/components/home/HomeDevlog.astro`.
- [ ] Existe `src/components/home/HomeBlog.astro`.
- [ ] Existe `src/components/home/HomeFeaturedWork.astro`.
- [ ] Existe `src/components/home/HomeCta.astro`.
- [ ] `src/components/pages/HomePage.astro` ha sido reescrito y compone las 4 secciones anteriores en orden.
- [ ] El directorio `src/components/bento/` NO existe.
- [ ] El archivo `src/components/Hero.astro` NO existe.
- [ ] El archivo `src/components/pages/home-contract.test.ts` está reescrito al nuevo contrato.

### i18n

- [ ] Las claves `home.manifesto`, `home.scroll_hint`, `home.work.title`, `home.work.cta`, `home.devlog.all` existen en `ui.en` y `ui.es`.
- [ ] Las claves `home.bento.*` (12) NO existen en `ui.ts`.
- [ ] Las claves `home.hero.*` (5) NO existen en `ui.ts`.
- [ ] Las claves `home.latest_devlog`, `home.building`, `home.building_desc`, `home.view_all_apps` NO existen en `ui.ts`.
- [ ] Las claves reutilizadas siguen presentes: `home.building_public`, `home.read_entry`, `home.tech_articles`, `home.tech_articles_desc`, `home.view_all_articles`, `home.explore_code`, `home.explore_code_desc`, `home.view_github`, `home.google_play`, `home.view_all_projects`.

### Test de contrato

- [ ] `pnpm test` finaliza en VERDE con los 4 tests siguientes:
  1. "el hero es editorial: marca gigante, manifiesto y sin Bento".
  2. "la home compone las cuatro secciones numeradas en orden editorial".
  3. "las secciones usan la cabecera numerada compartida".
  4. "declara el copy editorial nuevo en ambos idiomas".

### Build

- [ ] `pnpm build` finaliza sin errores (ni TypeScript ni Astro).

### Diseño y comportamiento

- [ ] El hero ocupa el primer viewport (`min-h-[calc(100svh-4rem)]`) con "ArceApps" en tipografía gigante (`clamp(3.5rem,14vw,11rem)`, peso 900) y el punto final en naranja `#FF9800`.
- [ ] El manifiesto se renderiza debajo del titular con peso ligero y color `on-surface-variant`.
- [ ] El indicador de scroll es un enlace con icono `keyboard_arrow_down` anclado a `#section-devlog`.
- [ ] Las cuatro secciones aparecen en este orden estricto:
  1. `01` — Devlog (título `home.building_public`).
  2. `02` — Blog (título `home.tech_articles`).
  3. `03` — Trabajo destacado (título `home.work.title`).
  4. `04` — CTA (título `home.explore_code`).
- [ ] Cada sección numerada usa `HomeSectionHeader` con `number="01"`/`"02"`/`"03"`/`"04"`, ghost color `primary/15`, divisor `border-b border-border/60`.
- [ ] La sección 01 (Devlog) muestra la última entrada como cita editorial con título `clamp(3xl → 5xl)`, fecha localizada, descripción y enlace `home.read_entry`. Si no hay devlog, fallback con enlace a `/projects`.
- [ ] La sección 02 (Blog) renderiza 3 `BlogCard` en grid `md:grid-cols-3` con `hover:-translate-y-1`.
- [ ] La sección 03 (Featured Work) usa layout asimétrico `md:grid-cols-[1.2fr_1fr]` con imagen `loading="eager" fetchpriority="high"`, `realIconUrl` overlay si existe, y CTA `home.work.cta`.
- [ ] La sección 04 (CTA) tiene fondo teal sólido (sin `bg-gradient`), borde naranja arriba/abajo, dos botones (GitHub + Google Play) con `target="_blank"`.

### Accesibilidad

- [ ] El número ghost de cada sección tiene `aria-hidden="true"`.
- [ ] El indicador de scroll tiene `aria-label` con `home.scroll_hint` localizado y `sr-only` para el label si se usa solo icono (en este caso el icono es visible, el label está en el `<a>`).
- [ ] Todas las animaciones están dentro de `@media (prefers-reduced-motion: no-preference)` o usan `motion-reduce:transition-none`.
- [ ] Los anillos de foco (`focus-visible:ring-2`) están presentes en todos los enlaces interactivos.

### SEO y rendimiento

- [ ] La home tiene exactamente un `<h1>` (el titular "ArceApps") y un `<h2>` por sección numerada.
- [ ] La imagen del trabajo destacado lleva `loading="eager" fetchpriority="high"` (LCP candidate).
- [ ] Las secciones con contenido pesado mantienen `cv-auto` + `contain-intrinsic-size`.
- [ ] El `title` del `Layout` sigue siendo "ArceApps - Premium Android Apps" (EN) / "ArceApps - Apps Android Premium" (ES).

### Bitácora

- [ ] Existe `src/content/devlog/en/2026-W30-editorial-home-redesign.md` con frontmatter válido y `pubDate: 2026-07-29`.
- [ ] Existe `src/content/devlog/es/2026-W30-editorial-home-redesign.md` con frontmatter válido y `pubDate: 2026-07-29`.
- [ ] Existe `public/images/2026-W30-editorial-home-redesign-cover.svg` con formas geométricas en Teal `#018786` y Orange `#FF9800`.
- [ ] El devlog histórico `2026-W25-redesign-bento-grid-ai-agents.md` NO ha sido modificado.

### Independencia

- [ ] `Layout.astro` NO ha sido modificado.
- [ ] `BlogCard.astro` NO ha sido modificado.
- [ ] `DevlogIndexPage.astro` NO ha sido modificado.
- [ ] Páginas de apps/projects/blog/devlog NO han sido modificadas.

## Comprobaciones de regresión (a ejecutar por el verifier)

```bash
# 1. Tests
pnpm test

# 2. Build
pnpm build

# 3. Greps de regresión
grep -rn "Bento" src/components src/pages src/layouts
grep -rn "home.bento\." src/
grep -rn "home.hero\." src/
grep -rn "Hero\.astro" src/

# 4. Smoke test visual (no automatizable en este flujo): levantar `pnpm dev`
# y verificar:
#   - hero con "ArceApps." en naranja
#   - scroll revela 01 Devlog, 02 Blog, 03 Featured Work, 04 CTA
#   - toggle dark mode funciona
#   - toggle ES/EN cambia los textos
```

Si cualquiera de estos falla, ABORTAR y devolver al implementer con el log exacto.

## Estado de aceptación

Pendiente de verificación final. Se actualizará al cerrar la fase de verificación.
