# Bitácora de Bolt - Optimización y Rendimiento

## [2025-05-20] Solución Overlay Link con Pointer Events
### Contexto
Se requería hacer que las tarjetas del blog fueran completamente clickables sin romper la funcionalidad de los enlaces anidados (tags).

### Solución Implementada
Se utilizó un patrón de capas CSS (`z-index`) con manipulación de `pointer-events`:
1.  **Enlace Principal (Overlay):** `absolute inset-0 z-10`. Cubre toda la tarjeta.
2.  **Contenedor de Contenido:** `relative z-20 pointer-events-none`. Se coloca visualmente encima del enlace, pero permite que los clics "atraviesen" el contenedor y lleguen al enlace principal.
3.  **Enlaces Interactivos Anidados (Tags):** `relative z-30 pointer-events-auto`. Se colocan encima del contenedor y reactivan los eventos de puntero, permitiendo que sean clickeables independientemente del enlace principal.

### Aprendizaje
Este patrón es robusto para interfaces tipo "tarjeta clickable" que contienen acciones secundarias. Evita el uso de JavaScript para navegación y mantiene una estructura HTML semántica. Es importante notar que `pointer-events-none` en el contenedor de texto deshabilita la selección de texto con el mouse, lo cual es un compromiso aceptable en este contexto de UI de navegación.

## 2025-05-21 - [Optimización de Carga Diferida en Búsqueda]
**Revisado:** `src/components/Search.astro`
**Propuesta:** El componente de búsqueda importaba `fuse.js` estáticamente, lo que incluía la librería completa (~20kb) en el bundle inicial de JavaScript, a pesar de que la búsqueda es una funcionalidad bajo demanda que requiere interacción del usuario.
**Cambios Realizados:**
1.  Se reemplazó la importación estática `import Fuse from 'fuse.js'` por un `import('fuse.js')` dinámico dentro de la función `initSearch`.
2.  Se implementó `Promise.all` para ejecutar la petición del índice de búsqueda (`fetch('/search-index.json')`) y la carga de la librería en paralelo.
**Impacto:** Reducción del tamaño del bundle JS inicial en ~6.6kB (gzip). La librería ahora solo se descarga cuando el usuario abre el modal de búsqueda.

## 2025-05-22 - [Optimización de Carga de Imágenes en Tarjetas]
**Revisado:** `astro.config.mjs`, `package.json`, `src/layouts/Layout.astro`, `src/components/ProjectCard.astro`, `src/components/AppCard.astro`. Se verificó que el proyecto usa `astro:assets` pero las imágenes de contenido se sirven desde `public/` (limitando la optimización automática de tiempo de compilación).
**Propuesta:** Se identificó que las imágenes en `ProjectCard` y `AppCard` se cargaban de forma "eager" (predeterminada). Dado que estos componentes se utilizan principalmente en listas que suelen extenderse por debajo del pliegue (below the fold) o en secciones secundarias (como en `src/pages/index.astro` donde `AppCard` está bajo el Hero), esto consumía ancho de banda innecesario en la carga inicial.
**Cambios Realizados:**
1.  Se añadieron los atributos `loading="lazy"` y `decoding="async"` a la etiqueta `<img>` en `src/components/ProjectCard.astro`.
2.  Se añadieron los atributos `loading="lazy"` y `decoding="async"` a la etiqueta `<img>` en `src/components/AppCard.astro`.
**Impacto:** Reducción de la contención del hilo principal y ahorro de ancho de banda inicial al diferir la carga de imágenes fuera de pantalla. Esto prioriza los recursos críticos (fuentes, CSS, imagen LCP del Hero).

## 2025-05-23 - [Preconexión a CDN de Imágenes]
**Revisado:** `src/layouts/Layout.astro` y los componentes de tarjeta (`AppCard`). Se identificó que las imágenes de los íconos de las aplicaciones se cargan desde un dominio externo (`play-lh.googleusercontent.com`).
**Propuesta:** Añadir una etiqueta `<link rel="preconnect">` para establecer una conexión temprana con el CDN de Google Play. Esto reduce la latencia de red (DNS, TCP, TLS) cuando el navegador descubre las imágenes en el DOM, especialmente en la página de inicio y la lista de aplicaciones.
**Cambios Realizados:**
1.  Se añadió `<link rel="preconnect" href="https://play-lh.googleusercontent.com" />` en el `<head>` de `src/layouts/Layout.astro`.
**Impacto:** Reducción del tiempo de carga de las imágenes de las aplicaciones (First Contentful Paint para esas imágenes) al eliminar el overhead de conexión cuando se solicitan los recursos.

## 2025-05-24 - [Dimensiones Explícitas para Íconos y Tipado Estricto]
**Revisado:** `src/components/ProjectCard.astro`, `src/components/AppCard.astro`, `src/components/Search.astro`, `src/components/ContactForm.astro`.
**Propuesta:**
1. Se detectó que las imágenes de los íconos de las aplicaciones (`realIconUrl`) carecían de atributos `width` y `height`, dependiendo solo de CSS para su tamaño. Esto puede causar cambios de diseño acumulativos (CLS) menores durante la carga.
2. Se encontraron errores de TypeScript en `Search.astro` (tipos `any` implícitos) y `ContactForm.astro` (acceso a propiedad `disabled` en `HTMLElement`) que impedían una verificación limpia (`pnpm check`).
**Cambios Realizados:**
1.  Se añadieron `width="64" height="64"` a la etiqueta `<img>` en `src/components/ProjectCard.astro`.
2.  Se añadieron `width="56" height="56"` a la etiqueta `<img>` en `src/components/AppCard.astro`.
3.  Se corrigieron los tipos en `src/components/Search.astro` (definiendo `fuse: any`, `searchIndex: any[]` y parámetros de funciones).
4.  Se corrigió el tipado del botón de envío en `src/components/ContactForm.astro` (casting a `HTMLButtonElement`).
**Impacto:**
- **Rendimiento:** Prevención de Layout Shift (CLS) en los contenedores de íconos, mejorando la estabilidad visual.
- **Calidad de Código:** Resolución de 6 errores de TypeScript, mejorando la robustez y mantenibilidad del código.

## 2025-05-25 - [Optimización de Scroll Listener con Intersection Observer]
**Revisado:** `src/layouts/Layout.astro`, `src/pages/blog/[...page].astro`
**Propuesta:**
1. El botón de "Volver arriba" utilizaba un listener de evento `scroll` en el objeto `window` que se ejecutaba en cada píxel de desplazamiento. Aunque usaba `requestAnimationFrame`, seguía activando lógica en el hilo principal innecesariamente. Se propuso usar `IntersectionObserver` con un elemento centinela para detectar cuándo mostrar el botón.
2. `pnpm astro check` fallaba debido a tipos faltantes en la paginación del blog.
**Cambios Realizados:**
1. Se añadió un `div#scroll-sentinel` absoluto al inicio del body.
2. Se reemplazó el evento `window.onscroll` con un `IntersectionObserver` que observa el centinela. Cuando el centinela sale del viewport, se muestra el botón.
3. Se añadieron tipos explícitos (`Page<CollectionEntry<'blog'>>`) en `src/pages/blog/[...page].astro` para corregir errores de TypeScript.
**Impacto:**
- **Rendimiento:** Eliminación completa del listener `scroll` constante en el hilo principal, liberando recursos para otras tareas de renderizado e interacción.
- **Calidad de Código:** Corrección de errores de tipado estricto en la paginación del blog, permitiendo un pipeline de CI/CD (o `check`) limpio.

## 2025-05-26 - [Validación de Integridad de Contenido]
**Revisado:** `src/content/blog/` y `public/images/`
**Propuesta:** Se añadieron 3 nuevos artículos avanzados de Kotlin. Para evitar errores 404 y mantener la calidad visual, se debía asegurar que cada artículo tuviera su imagen hero correspondiente.
**Cambios Realizados:**
1.  Se generaron y validaron 3 archivos SVG ligeros en `public/images/` correspondientes al frontmatter de los nuevos artículos (`placeholder-article-collections.svg`, `placeholder-article-flow-advanced.svg`, `placeholder-article-delegation.svg`).
2.  Se realizó una verificación mediante inspección del build generado (`dist/blog`) para confirmar la presencia y el enlace correcto de los artículos y sus imágenes.
**Impacto:**
- **UX/UI:** Se garantiza que no haya "broken images" en el feed del blog.
- **Integridad:** Se validó que el contenido Markdown se procesa correctamente en la build estática de Astro.
## 2025-05-27 - [Optimización de Caché Service Worker]
**Revisado:** `public/sw.js`
**Propuesta:** El Service Worker utilizaba una estrategia "Stale-while-revalidate" indiscriminada para todas las peticiones no navegacionales. Esto provocaba errores al intentar cachear peticiones `POST` (ej. Google Analytics) y llenaba el almacenamiento del usuario con respuestas opacas o de terceros innecesarias.
**Cambios Realizados:**
1.  Se añadió un filtro explícito `if (event.request.method !== 'GET') return;` al inicio del listener `fetch`.
2.  Dentro de la lógica de caché, se añadió una verificación de respuesta válida: `networkResponse.status === 200` y `networkResponse.type === 'basic'` (mismo origen).
**Impacto:**
- **Estabilidad:** Eliminación de errores en consola por intentos de cachear peticiones POST.
- **Eficiencia:** Prevención de "cache bloat" al evitar guardar respuestas opacas, de error (4xx/5xx) o recursos externos no críticos. El Service Worker ahora solo cachea recursos estáticos del propio dominio que han cargado correctamente.
