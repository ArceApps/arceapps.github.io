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

## 2026-01-09 - [Optimización de Imágenes de Marca con Astro Assets]
**Revisado:** `src/components/Header.astro`, `src/components/Footer.astro`, `public/images/`.
**Propuesta:** Se detectó que el logo de la marca (`brand-icon.png`) se servía como una imagen estática estándar (`<img>`) desde la carpeta `public/`. Esto impedía que Astro realizara optimizaciones de formato (WebP/AVIF), redimensionamiento y cache-busting (hashing), afectando potencialmente el LCP (Largest Contentful Paint) en la cabecera.
**Cambios Realizados:**
1.  Se creó el directorio `src/assets` y se migró una copia del archivo `brand-icon.png` desde `public/`.
2.  Se refactorizó `src/components/Header.astro` para usar el componente `<Image />` de `astro:assets` con `loading="eager"` y `fetchpriority="high"`.
3.  Se refactorizó `src/components/Footer.astro` para usar el componente `<Image />` de `astro:assets`.
**Impacto:**
- **Rendimiento:** Conversión automática a formatos modernos (WebP) y optimización de tamaño. Mejora del LCP en dispositivos móviles al priorizar la carga del logo.
- **Best Practices:** Uso consistente del pipeline de assets de Astro, eliminando referencias estáticas no procesadas en componentes críticos.

## 2026-01-10 - [Prevención de CLS en Tarjetas del Blog]
**Revisado:** `src/components/BlogCard.astro`, `src/components/ProjectCard.astro`.
**Propuesta:** Se identificó que las imágenes en `BlogCard.astro` carecían de atributos explícitos `width` y `height`. Aunque el contenedor CSS forza una relación de aspecto 16:9 (`aspect-video`), la ausencia de atributos HTML puede causar que el navegador no reserve el espacio correctamente durante el renderizado inicial en algunos contextos, o que herramientas de auditoría (Lighthouse) penalicen el CLS.
**Cambios Realizados:**
1.  Se añadieron los atributos `width="800"` y `height="450"` a la etiqueta `<img>` en `src/components/BlogCard.astro`.
**Impacto:**
- **Rendimiento:** Eliminación de riesgo de Cumulative Layout Shift (CLS) al proporcionar dimensiones explícitas al navegador.
- **Consistencia:** Alineación con `ProjectCard.astro` y `AppCard.astro` que ya incluían estas optimizaciones.

## 2026-01-11 - [Eliminación de Manipulación DOM Redundante]
**Revisado:** `src/components/Header.astro`, `src/components/Search.astro`, `src/layouts/Layout.astro`.
**Propuesta:** Se detectó un patrón anti-patrón de uso de `cloneNode` para reiniciar listeners de eventos, el cual era ineficiente y redundante dado que `ClientRouter` de Astro reemplaza el `body` en las transiciones de vista. Además, se encontró código ejecutándose dos veces en la carga inicial (una por llamada directa y otra por `astro:page-load`) y un error de TypeScript en `Search.astro` debido a la inferencia incorrecta de tipos en nodos clonados.
**Cambios Realizados:**
1.  Se eliminó la llamada manual inicial a `initHeader` y `initLayout`, unificando la ejecución bajo el evento `astro:page-load` (que también dispara en carga inicial).
2.  Se eliminó el patrón `cloneNode` y `replaceChild` en `Header.astro`, `Layout.astro` y `Search.astro`, ya que los elementos son nuevos en cada navegación.
3.  Se simplificó la lógica de listeners en `Search.astro`, lo que colateralmente solucionó el error de TypeScript `Property 'classList' does not exist on type 'Node'`.
**Impacto:**
- **Rendimiento:** Reducción de operaciones DOM costosas (`cloneNode`, `replaceChild`) en cada navegación.
- **Eficiencia:** Eliminación de ejecución duplicada de scripts de inicialización en la carga de la página.
- **Calidad de Código:** Código más limpio, idiomático de Astro View Transitions y libre de errores de tipo (`pnpm astro check` pasando).

## 2026-01-12 - [Registro Diferido del Service Worker]
**Revisado:** `src/layouts/Layout.astro`
**Propuesta:** La función `initServiceWorker()` se invocaba inmediatamente en el `<script>` del layout principal. Esto causaba que el navegador iniciara el proceso de registro (y potencial descarga/parseo del SW) durante la fase crítica de renderizado inicial, compitiendo por el hilo principal y recursos de red. Se propuso diferir este registro hasta que la página haya completado su carga (`load` event).
**Cambios Realizados:**
1.  Se envolvió la llamada a `navigator.serviceWorker.register` en un listener condicional: si `document.readyState` es `complete`, se ejecuta inmediatamente; de lo contrario, se espera al evento `window.addEventListener('load')`.
**Impacto:**
- **Rendimiento:** Reducción del Total Blocking Time (TBT) y liberación del hilo principal durante la carga crítica inicial. El Service Worker (que es una mejora progresiva) se inicializa solo cuando la página ya es interactiva para el usuario.
