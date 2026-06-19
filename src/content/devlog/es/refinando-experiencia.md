---
title: "Refinando la Experiencia: Rendimiento y Detalles Invisibles (ArceApps)"
description: "Confesiones de una semana optimizando ArceApps. La batalla contra los overlays de CSS, la carga perezosa de imagenes y por que refactrice la busqueda."
pubDate: 2026-01-06
lastmod: 2026-01-06
author: "ArceApps"
keywords: ["ArceApps", "devlog", "rendimiento", "ux", "optimizacion"]
canonical: "https://arceapps.com/es/devlog/refinando-experiencia/"
heroImage: "/images/performance-hero.svg"
tags: ["performance", "ux", "astro", "optimization"]
---

¿Sabes esa sensación cuando terminas una feature y funciona, pero algo "se siente mal"? No hay errores en la consola, Lighthouse da 100, pero al navegar notas una micro-fricción.

Esta semana en **ArceApps** no he añadido grandes funcionalidades. En su lugar, me he dedicado a pelearme con esos detalles invisibles que separan una demo de un producto real. Y honestamente, ha sido más difícil que crear las features originales.

Aquí está mi diario de batalla.

## 1. La Pesadilla del `z-index` (o Cómo Hacer Clic en Todo)

El diseño de las tarjetas del blog parecía simple en Figma: "Toda la tarjeta es un enlace, excepto los tags". Fácil, ¿verdad?

La realidad fue frustrante. Al poner un enlace `<a>` que cubría toda la tarjeta (`absolute inset-0`), maté instantáneamente la interactividad de los botones de "tags" que estaban debajo. Eran inalcanzables.

Intenté subir el `z-index` de los tags. Nada. El enlace seguía capturando el evento.
Pasé una hora leyendo sobre `pointer-events`. Al final, la solución fue contraintuitiva pero elegante:

1.  El enlace "invisible" que cubre todo tiene `z-index: 10`.
2.  El contenido de texto (título, descripción) tiene `z-index: 20` PERO `pointer-events-none`. Esto significa que los clics "atraviesan" el texto y llegan al enlace de abajo.
3.  Los tags tienen `z-index: 30` y `pointer-events-auto`.

Fue uno de esos momentos "Eureka" mezclado con "¿Por qué CSS es así?". Pero ahora la UX es líquida: puedes hacer clic descuidadamente en la tarjeta para leer, o apuntar con precisión a un tag.

## 2. Poniendo la Búsqueda a Dieta

Usamos **Fuse.js** para el buscador. Es una maravilla, pero pesa ~20kb. Puede no parecer mucho, pero cargar 20kb de JavaScript en el hilo principal antes de que el usuario siquiera piense en buscar me parecía un desperdicio.

Decidí implementar **Lazy Loading**. La lógica ahora es:
*   La página carga. Fuse.js NO existe.
*   El usuario hace clic en el icono de lupa 🔍.
*   *En ese milisegundo*, descargo la librería y el índice de búsqueda en paralelo (`Promise.all`).

El resultado: la página inicial es más ligera y la búsqueda sigue sintiéndose instantánea. Me sentí como un cirujano quitando peso muerto.

## 3. El Baile de las Imágenes (CLS)

Nada me molesta más que estar leyendo un artículo y que el texto salte porque se cargó una imagen arriba. Eso es Cumulative Layout Shift (CLS) y Google te penaliza por ello.

Me di cuenta de que mis componentes `AppCard` eran culpables. No tenían altura definida hasta que la imagen cargaba.
La solución fue estricta: `aspect-ratio` en todo. Reservar el espacio en el DOM antes de que llegue el primer pixel de la imagen. Además, añadí `loading="lazy"` y `decoding="async"` para decirle al navegador: "Tómate tu tiempo con esto, prioriza el texto".

## 4. Scroll Eficiente: Dejando de Escuchar Todo

Tenía un botón de "Volver arriba" que escuchaba el evento `scroll` de la ventana.
Básicamente, cada vez que movías la rueda del ratón un milímetro, mi código ejecutaba una función. Miles de veces. Un desastre de performance silencioso.

Lo refactoricé usando **Intersection Observer**. En lugar de preguntar "¿dónde estoy?" constantemente, ahora pongo un elemento invisible (un "centinela") al principio de la página y le digo al navegador: "Avísame cuando este elemento deje de verse".

El código pasó de ser un bucle frenético a una espera zen. El procesador lo agradece.

## Reflexión

A veces, como desarrolladores, nos obsesionamos con el "Qué" (nuevas features) y olvidamos el "Cómo" (la sensación de uso). Esta semana no he shippeado nada "nuevo" visiblemente, pero la web se siente más sólida, más *profesional*.

Y hay una satisfacción especial en saber que, bajo el capó, todo está engranado perfectamente.

*Seguimos picando código.*
