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
