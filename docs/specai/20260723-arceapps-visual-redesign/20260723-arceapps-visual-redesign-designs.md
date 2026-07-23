# Design Spec: Rediseño visual de ArceApps

**Fecha:** 2026-07-23

**Estado:** BACKLOG — pendiente de aprobación antes de implementar

**Alcance:** Hallazgos 1–10 de la auditoría visual
**Base:** `docs/specai/audit-findings.md` y `docs/specai/architecture-audit-report.md`

## 1. Decisión de dirección visual

ArceApps adoptará una dirección de **estudio indie de software**: editorial, sobria, técnica y cercana. La interfaz debe hacer que el trabajo real —apps, artículos y bitácora— sea el protagonista, con una capa visual reconocible pero contenida.

### Principios

1. Una sola gramática visual para portada, listados y detalles.
2. Teal (`#018786`) como color estructural para enlaces, navegación, foco y CTA principal.
3. Orange (`#FF9800`) como acento puntual para estados, etiquetas y llamadas secundarias.
4. Una superficie dominante por sección; los gradientes, blur y glows quedan reservados para hero y pequeños acentos.
5. El contenido debe tener más peso que la decoración: títulos, propuesta de valor, fecha, lectura y acción principal.
6. El mismo componente debe producir la composición inglesa y española; solo cambian datos y traducciones.

## 2. Objetivos y límites

### Objetivos

- Eliminar la mezcla no gobernada de Material Design, glassmorphism, Bento y estilos locales.
- Crear tokens semánticos para superficies, texto, borde, foco, radio y elevación.
- Unificar las tarjetas en las variantes `article`, `app` y `feature`.
- Simplificar la portada para presentar al creador y una pieza real antes de mostrar contenido secundario.
- Mejorar la jerarquía de los detalles de app y artículo.
- Hacer explícitos los estados responsive, teclado, foco y `prefers-reduced-motion`.
- Completar los strings de interfaz en `src/i18n/ui.ts` para inglés y español.
- Reducir la divergencia visual entre rutas EN y ES sin cambiar slugs ni URLs públicas.

### Fuera de objetivos

- No cambiar el contenido editorial, las colecciones, los slugs ni el modelo de frontmatter.
- No añadir dependencias ni sustituir Astro, Tailwind, DaisyUI, Material Icons o las fuentes existentes.
- No resolver en esta feature la configuración ausente de `CONTACT_FORM_KEY`.
- No reparar en esta feature la deuda completa de `src/scripts/header.test.ts` ni las validaciones de enlaces existentes.
- No convertir el sitio en un dashboard, SaaS o página corporativa.
- No crear otra librería de diseño interna más grande que el problema.

## 3. Modelo visual

### Tokens semánticos

Los tokens se declaran en `src/styles/global.css` dentro de `@theme` y se consumen mediante clases Tailwind o variables CSS. Los nombres deben expresar intención, no el componente que los usa.

| Grupo | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `brand-primary` | `#018786` | teal claro accesible | enlace, foco, CTA principal |
| `brand-secondary` | `#FF9800` | naranja claro accesible | acento, estado, CTA secundario |
| `surface-page` | fondo cálido claro | fondo profundo | cuerpo y secciones principales |
| `surface-raised` | blanco cálido | gris profundo | card y panel dominante |
| `surface-subtle` | slate suave | slate oscuro | metadatos, campos y navegación secundaria |
| `content-primary` | texto casi negro | blanco suave | títulos y texto principal |
| `content-secondary` | gris tealado | gris claro | descripciones y metadatos |
| `border-subtle` | gris translúcido | gris oscuro | separación y contorno |
| `focus-ring` | teal con contraste | teal claro | foco visible de teclado |

La escala de radios será pequeña y deliberada: `sm` para controles, `md` para cards y `lg` solo para hero o composición destacada. No se añadirán radios arbitrarios por componente.

La elevación se limita a tres niveles semánticos: `flat`, `raised` y `floating`. Se sustituye el uso de `elevation-4`, que hoy no está declarado, por una clase o variable existente y comprobable.

### Superficies y tarjetas

Se creará `src/components/Card.astro` como primitiva ligera con tres variantes:

- `article`: imagen, categoría/fecha, título, resumen y enlace de lectura.
- `app`: icono, nombre, propuesta de valor, metadatos breves y CTA.
- `feature`: una pieza visual dominante para hero, proyecto en construcción o devlog destacado.

La primitiva controla radio, borde, superficie, foco, transición y espaciado. `BlogCard.astro`, `ProjectCard.astro` y `AppCard.astro` conservarán su API de datos pública, pero delegarán la superficie y los estados comunes en `Card.astro`.

## 4. Composición por tipo de página

### Portada

`HomePage.astro` mantendrá el flujo de datos actual —últimos artículos, última bitácora y apps—, pero la jerarquía será:

1. Hero editorial con identidad de ArceApps, propuesta clara y una pieza real destacada.
2. Bloque “lo que estoy construyendo” con un `feature` dominante y un único CTA principal.
3. Apps destacadas en una fila de cards `app` consistente.
4. Artículos recientes en cards `article`.
5. CTA final de código/Google Play sin competir con el hero.

El mockup de teléfono ficticio, la estadística simulada y el Bento decorativo se retiran de la composición principal. Las imágenes reales de apps y artículos conservan sus rutas existentes.

### Listados

Las rutas de Apps, Blog y Bitácora conservarán su carga de colecciones y paginación. Compartirán `PageIntro.astro` para título/subtítulo, la misma retícula responsive y el mismo tratamiento de foco, separación y estados vacíos. Cada ruta seguirá usando el idioma derivado de su path.

### Detalle de app

La parte superior prioriza, en este orden: nombre, propuesta de valor, icono/hero, Google Play y prueba visual. Rating, versión, fecha, tags y repositorio quedan como metadatos secundarios. La galería pasa a ser una secuencia de medios estable, sin inclinaciones obligatorias ni rotaciones que dificulten la lectura.

### Detalle de artículo

La página mantiene breadcrumbs, progreso, tabla de contenidos y compartir. El encabezado será editorial y el contenido usará una columna de lectura controlada, aproximadamente 720–760px para texto y medios. El hero puede ocupar más ancho que el texto; las imágenes no quedan limitadas globalmente a 500px. La caja única con sombra alrededor de todo el prose se sustituye por separación, tipografía y reglas de lectura.

## 5. Internacionalización

- Todo texto visible, texto de controles, `aria-label`, `alt` generado por UI y estado vacío se añade a `src/i18n/ui.ts`.
- Las páginas EN y ES mantienen las rutas actuales y delegan la composición común a los mismos componentes.
- Los componentes reciben `lang` cuando necesitan resolver rutas o traducciones; no leen directamente una traducción inglesa fija.
- Los contenidos editoriales y nombres propios conservan los datos de sus colecciones.
- El rediseño debe revisar como mínimo `Gallery`, `Live Demo`, `Code`, `Updated`, `No Image Available`, `Filter by tags`, `Contact`, `Home`, `Blog`, `Table of Contents` y sus etiquetas ARIA equivalentes.

## 6. Accesibilidad, responsive y motion

- Cada enlace y botón conserva orden lógico de teclado, foco visible y nombre accesible.
- El menú móvil se presenta como panel delimitado, con estado abierto/cerrado anunciado y cierre por teclado cuando el comportamiento actual lo permita.
- Las acciones primarias se mantienen alcanzables en pantallas pequeñas sin depender de hover.
- La retícula se degrada a una columna sin desbordamiento horizontal; las imágenes usan dimensiones y `object-fit` coherentes.
- Se elimina el hover global que cambia el peso de todos los encabezados.
- Se conservan únicamente transiciones cortas de foco, navegación y entrada de contenido; los escalados, giros y pulsos decorativos se reducen.
- `@media (prefers-reduced-motion: reduce)` desactiva transiciones y animaciones no esenciales y mantiene el contenido visible.

## 7. Mapa de archivos

### Nuevos

- `src/components/Card.astro` — primitiva de superficie y variantes.
- `src/components/PageIntro.astro` — encabezado común para listados.

### Modificados

- `src/styles/global.css` — tokens, superficies, prose, elevación y motion.
- `src/components/Hero.astro` — hero editorial sin mockup ficticio.
- `src/components/Header.astro` — navegación, panel móvil y estados localizados.
- `src/components/BlogCard.astro` — variante `article`.
- `src/components/ProjectCard.astro` — variante `app`.
- `src/components/AppCard.astro` — variante `app` y compatibilidad de uso.
- `src/components/pages/HomePage.astro` — nueva jerarquía de portada.
- `src/pages/apps/index.astro`, `src/pages/es/apps/index.astro` — composición común de listado.
- `src/pages/blog/[...page].astro`, `src/pages/es/blog/[...page].astro` — composición común de listado.
- `src/pages/devlog/index.astro`, `src/pages/es/devlog/index.astro` — composición común de listado.
- `src/pages/apps/[...slug].astro`, `src/pages/es/apps/[...slug].astro` — jerarquía de detalle.
- `src/pages/blog/[...slug].astro`, `src/pages/es/blog/[...slug].astro` — lectura editorial e i18n.
- `src/i18n/ui.ts` — strings UI completos.
- `src/i18n/utils.ts` — solo si la composición compartida requiere una utilidad localizada adicional.

### No modificados deliberadamente

- `src/content/` y sus slugs.
- `public/images/` salvo que una tarea posterior detecte un asset real necesario; no se generan imágenes en esta feature.
- `src/pages/404.astro`, salvo que la migración de tokens requiera sustituir `bg-primary-dark` por un token declarado.

## 8. Deuda registrada fuera del alcance

- Hallazgo 11: `.material-card` está declarado pero no usado; se documentará como decisión de limpieza posterior si queda sin consumidores tras la migración.
- Hallazgo 12: `CONTACT_FORM_KEY` ausente y fallos existentes de tests/enlaces; se conservará el baseline y no se presentará como resuelto por el rediseño.

## 9. Decisiones cerradas

- Se conserva Astro estático y el modelo de colecciones actual.
- Se conserva Tailwind/DaisyUI y no se introduce una dependencia visual externa.
- Se conserva el bilingüismo por rutas raíz y `/es`.
- Se elimina el mockup ficticio del teléfono del hero en favor de contenido real.
- Se usa una primitiva de card pequeña, no un sistema de componentes generalista.
- La implementación no empieza hasta que el usuario apruebe el plan.
