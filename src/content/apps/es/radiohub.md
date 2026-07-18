---
title: RadioHub
description: >-
  Sintoniza más de 30,000 emisoras en vivo de todo el mundo con ecualizador, 
  temporizador y una interfaz Material 3 moderna sin interrupciones.
pubDate: '2026-07-02'
heroImage: /images/apps/radiohub/es/feature_graphic.png
icon: radio
tags:
  - Music
  - Radio
  - Streaming
googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.arceapps.radiohub'
repoUrl: 'https://github.com/ArceApps/PodcastRadio.git'
screenshots:
  - /images/apps/radiohub/es/screenshot_player.png
  - /images/apps/radiohub/es/screenshot_explore.png
  - /images/apps/radiohub/es/screenshot_browse.png
  - /images/apps/radiohub/es/screenshot_favorites.png
  - /images/apps/radiohub/es/screenshot_countries.png
  - /images/apps/radiohub/es/screenshot_timer.png
  - /images/apps/radiohub/es/screenshot_equalizer.png
lastUpdated: 2 jul 2026
version: 1.0.0
---

<!-- ABOUT_START -->
## Detrás de la App

RadioHub nació de una necesidad muy personal: quería una app de radio para Android que no estuviese plagada de publicidad invasiva, banners gigantescos o rastreadores innecesarios. El directorio público y gratuito de `radio-browser.info` era el punto de partida perfecto para acceder a más de 30,000 emisoras globales, pero construir una experiencia de reproducción robusta y de calidad sobre servidores comunitarios supuso una serie de desafíos de ingeniería muy interesantes.

El primer reto técnico fue la alta disponibilidad. Al depender de una API comunitaria, no podíamos confiar en un único servidor. Implementé un cliente HTTP en Kotlin utilizando Ktor que realiza un failover automático entre 4 servidores espejo (mirrors) de la API. Si un nodo responde lento o se cae, la app salta de forma transparente al siguiente en milisegundos, garantizando que el usuario nunca sufra interrupciones al buscar o explorar categorías.

El segundo obstáculo fue la reproducción de audio en tiempo real y el procesamiento de efectos en segundo plano. Integrar ExoPlayer (Media3) con `android.media.audiofx.Equalizer` requirió hilar muy fino: los ecualizadores de Android a veces producen ruidos de clic metálico si se activan en frío. Desarrollé un controlador reactivo que pospone el encendido del ecualizador hasta que el Session ID de ExoPlayer está completamente establecido y aplica las ganancias de decibelios a milibelios en tiempo real sin congelar la interfaz. Además, la integración estricta de MediaSession asegura que la reproducción sea fluida, permitiendo controlar la radio desde la pantalla de bloqueo o los auriculares de manera nativa y eficiente.
<!-- ABOUT_END -->

<!-- STORE_DESCRIPTION_START -->

**Descubre la experiencia definitiva de radio con RadioHub**. Sintoniza más de 30,000 emisoras en vivo de todos los rincones del planeta, todo en una aplicación moderna, intuitiva, construida con Jetpack Compose y 100% libre de rastreo o anuncios. Personaliza tu audio con el ecualizador profesional integrado y programa el temporizador para dormirte con tu música preferida.

<!-- STORE_DESCRIPTION_END -->

## Características Principales

*   **Acceso Global Ilimitado**: Explora y reproduce más de 30,000 emisoras organizadas por país, idioma o etiqueta musical de forma sencilla.
*   **Ecualizador Profesional**: Modifica el sonido con presets para Rock, Pop, Jazz, o ajusta las bandas de frecuencia manualmente para adaptarlo a tus altavoces o auriculares.
*   **Temporizador de Apagado (Sleep Timer)**: Configura la app para que detenga la reproducción automáticamente tras el tiempo seleccionado, ahorrando batería mientras descansás.
*   **Persistencia Local Rápida**: Guarda tus emisoras preferidas y accede a tu historial de reproducción reciente al instante gracias a una base de datos local Room.
*   **Integración del Sistema**: Controla la música desde el centro de notificaciones o la pantalla de bloqueo gracias al soporte nativo de MediaSession.
*   **Diseño Material 3**: Interfaz limpia, accesible y moderna con soporte completo para tema oscuro que cuida tu vista por la noche.
*   **Privacidad Absoluta**: Sin anuncios de terceros, sin telemetría intrusiva y sin permisos extraños. Solo vos y tu música.

## Stack Tecnológico Utilizado

*   **Kotlin & Jetpack Compose**: Interfaz de usuario declarativa moderna y eficiente bajo Material Design 3.
*   **Media3 & ExoPlayer**: Motor de reproducción de alto rendimiento capaz de sintonizar streams AAC y MP3 en vivo de baja latencia.
*   **Ktor Client**: Cliente HTTP asíncrono para gestionar la API externa con balanceo y failover dinámico entre espejos.
*   **Koin**: Inyección de dependencias ligera para mantener la modularidad y facilidad de pruebas.
*   **Room Database**: Persistencia local cifrada para favoritos e historial.
*   **Roborazzi**: Pruebas automatizadas de interfaz mediante capturas de pantalla de la UI para asegurar la consistencia visual en múltiples pantallas.
