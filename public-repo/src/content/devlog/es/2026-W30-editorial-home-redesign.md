---
title: "W30: Home editorial, construyendo en público"
description: "Reconstruimos la portada de ArceApps como una portada de revista: hero tipográfico con el manifiesto indie y cuatro secciones numeradas (Devlog, Blog, Trabajo destacado, CTA)."
pubDate: 2026-07-29
lastmod: 2026-07-29
author: "ArceApps"
keywords: ["ArceApps", "bitacora", "editorial", "home", "tailwind"]
canonical: "https://arceapps.com/es/devlog/2026-w30-editorial-home-redesign/"
tags: ["home", "editorial", "redesign", "tipografia", "i18n"]
heroImage: "/images/2026-W30-editorial-home-redesign-cover.svg"
---

## Home editorial, semana 30

La portada de **ArceApps** ha vivido dos vidas en las últimas semanas. Primero fue un layout lineal clásico, después se convirtió en un Bento Grid. Hoy se vuelve algo más parecido a la portada de una revista: un único titular enorme, un manifiesto indie de dos líneas y cuatro capítulos numerados.

## Por qué cambiarlo todo

El Bento Grid era denso y moderno, pero enterraba el **porqué** detrás del trabajo. Cualquiera que llegase al sitio tenía que escanear cinco tarjetas para entender qué tipo de desarrollador había detrás. El nuevo layout hace la respuesta inmediata: *una persona, horas robadas, apps Android hechas a fuego lento y en público*.

## Qué cambió

- **Hero:** "ArceApps" a `clamp(14vw)` peso 900, un único punto naranja como acento de marca y el manifiesto debajo en peso ligero. Indicador de scroll anclado a la primera sección.
- **Secciones:** `01 Devlog`, `02 Blog`, `03 Trabajo destacado`, `04 CTA`. Cada una con número ghost, título en negrita y enlace "ver todo" opcional.
- **Accesibilidad:** cada animación respeta `prefers-reduced-motion`, los números decorativos son `aria-hidden`, los anillos de foco se mantienen visibles sobre el acento naranja.
- **i18n:** el manifiesto y los nuevos títulos de sección existen en inglés y español. Cinco claves nuevas aterrizaron en `ui.ts`; las obsoletas `home.bento.*` se eliminaron.

## Qué se quedó

- **Colores de marca:** Teal `#018786` y Orange `#FF9800`. Ningún otro color.
- **`BlogCard.astro`:** reutilizado tal cual en la sección 02.
- **Obtención de datos:** los mismos filtros y orden de `getCollection` que antes.

La bitácora se queda corta a propósito. La próxima entrada hablará del emparejamiento tipográfico y las animaciones scroll-driven.
