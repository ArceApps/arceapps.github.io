---
title: "Refinando la Experiencia: Rendimiento y Detalles Invisibles"
description: "Un vistazo a las optimizaciones recientes bajo el capó: desde carga perezosa y mejoras en la búsqueda hasta correcciones de UX que hacen que todo se sienta más fluido."
pubDate: "2025-05-26"
tags: ["performance", "ux", "astro", "optimization"]
---

A veces, el trabajo más importante en el desarrollo de software es aquel que el usuario final no ve directamente, pero definitivamente siente. Durante esta última semana, me he centrado en pulir esos detalles invisibles que transforman una "buena web" en una experiencia sólida y profesional.

Aquí está el registro de lo que ha estado sucediendo tras bambalinas en **ArceApps**.

## 1. La "Trampa" del Overlay Link (y cómo salir de ella)
Uno de los desafíos de diseño más comunes en las tarjetas modernas (como las que ves en el blog) es hacer que toda la tarjeta sea clickeable, pero permitiendo a la vez interactuar con elementos internos, como los tags.

Inicialmente, al hacer clickeable toda la tarjeta, los tags quedaban "enterrados" bajo el enlace principal. La solución implementada fue un baile preciso de CSS `z-index` y `pointer-events`:
*   **El enlace principal** cubre toda la tarjeta (`absolute inset-0`) pero vive en un nivel inferior (`z-10`).
*   **El contenido de texto** se coloca visualmente encima (`z-20`) pero se vuelve "transparente" a los clics con `pointer-events-none`.
*   **Los botones interactivos (tags)** se elevan aún más (`z-30`) y recuperan su interactividad con `pointer-events-auto`.

El resultado es una UX sin fricción: clica donde quieras para leer el artículo, o apunta con precisión para filtrar por tag.

## 2. Búsqueda Instantánea, Peso Pluma
Nuestra búsqueda es potente gracias a **Fuse.js**, pero cargar toda la librería (~20kb) en la carga inicial de la página era un desperdicio de recursos, considerando que no todos los usuarios la utilizan.

Implementé una estrategia de **Importación Dinámica**. Ahora, la lógica de búsqueda y la librería solo se descargan del servidor en el momento exacto en que haces clic en el icono de la lupa. Además, la descarga del índice de búsqueda y la librería se realiza en paralelo (`Promise.all`), reduciendo la latencia percibida a casi cero.

## 3. Core Web Vitals y Estabilidad Visual
¿Alguna vez has estado leyendo una web y de repente el texto salta porque se cargó una imagen? Eso es un cambio de diseño acumulativo (CLS), y es molesto.

Para evitar esto, he auditado todos los componentes de imagen (`ProjectCard`, `AppCard`) para asegurar que tengan dimensiones explícitas (`width` y `height`). Esto reserva el espacio en el navegador antes de que la imagen llegue. Además, he añadido `loading="lazy"` y `decoding="async"` para priorizar el contenido crítico y no saturar tu ancho de banda con imágenes que aún no están en pantalla.

## 4. Scroll Eficiente
El botón de "Volver arriba" solía escuchar cada píxel que desplazabas. En términos de rendimiento, era como preguntar "¿Ya llegamos?" mil veces por segundo.

Lo he refactorizado utilizando **Intersection Observer**. Ahora, en lugar de escuchar el scroll constantemente, el navegador nos "avisa" solo cuando un elemento invisible (un centinela) sale de la pantalla. El hilo principal de JavaScript respira aliviado.

## Conclusión
Estos cambios no añaden nuevas "features" llamativas, pero construyen una base sólida. La performance es una feature, y la atención al detalle es lo que define la calidad del software.

*Seguimos construyendo.*
