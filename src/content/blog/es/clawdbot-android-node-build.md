---
title: "Clawdbot en Android: Compila e Instala tu Propio Nodo desde el Código Fuente"
description: "Guía técnica para compilar la app nativa de Clawdbot para Android, permitiendo a tu asistente acceder a la cámara, ubicación y modo de voz."
pubDate: 2026-01-07
lastmod: 2026-01-07
author: ArceApps
keywords:
  - "Clawdbot"
  - "Android"
  - "Compilar"
  - "Nodo"
  - "Build"
canonical: "https://arceapps.com/es/blog/clawdbot-android-node-build/"
heroImage: "/images/clawdbot-android-node.svg"
tags: ["Android", "Clawdbot", "Kotlin", "Build", "Gradle", "IA"]
category: android-kotlin
reference_id: "3eb5c086-8be4-48c6-a348-5973806f84e9"
---



En el [artículo anterior](/blog/clawdbot-asistente-ia-telegram), configuramos el "cerebro" de Clawdbot (Gateway) y su interfaz de chat (Telegram). Pero Clawdbot brilla realmente cuando tiene "cuerpo".

El **Nodo Android** es una aplicación nativa escrita en Kotlin que convierte tu dispositivo en un periférico inteligente para tu asistente. No es solo un chat; es una extensión sensorial.

## ¿Por qué un Nodo Android?

Al instalar la app nativa, tu asistente gana capacidades que Telegram no puede ofrecer:

1.  **Talk Mode (Modo Conversación):** Habla con tu asistente en tiempo real con una latencia mínima, usando Voice Activity Detection (VAD) local. Ideal para *pair programming* manos libres.
2.  **Cámara y Visión:** *"Clawdbot, ¿qué estoy viendo?"*. El nodo puede enviar capturas de la cámara al modelo (perfecto para modelos multimodales como Gemini 3.0).
3.  **Ubicación y Sensores:** Permite al asistente saber dónde estás (si le das permiso).
4.  **Ejecución Local:** Puede ejecutar acciones en el dispositivo.

## Requisitos Previos

Como desarrolladores Android, vamos a compilar la app desde cero. Necesitas:
*   Android Studio Ladybug o superior.
*   JDK 17.
*   El repositorio de `clawdbot` clonado.

## Paso 1: Explorando el Proyecto Android

El código de la app se encuentra en la carpeta `/android` del repositorio monorepo.

1.  Abre Android Studio.
2.  Selecciona **Open** y navega hasta `clawdbot/android`.
3.  Espera a que Gradle sincronice.

La estructura es moderna, usando **Jetpack Compose** para la UI y corrutinas para la gestión asíncrona. Es un excelente ejemplo de una arquitectura limpia en un proyecto real de IA.

## Paso 2: Configuración de Secretos (Opcional)

Para desarrollo local, generalmente no necesitas configurar claves de firma complejas si solo vas a instalarlo en modo debug. Sin embargo, revisa el archivo `local.properties` si necesitas definir alguna variable de entorno específica para servicios de voz (como ElevenLabs, si decides usarlo).

## Paso 3: Compilación e Instalación

1.  Conecta tu dispositivo Android físico (o usa un emulador) con depuración USB activada.
2.  En Android Studio, selecciona la variante de build `debug`.
3.  Dale al botón **Run (▶)**.

Gradle compilará la app (`./gradlew installDebug`) y la lanzará en tu dispositivo.

## Paso 4: Emparejamiento (Pairing)

Aquí viene la parte interesante. El nodo necesita conectarse a tu Gateway (que tienes corriendo en tu PC/Servidor).

1.  Asegúrate de que tu móvil y tu PC estén en la misma red Wi-Fi (o usa Tailscale).
2.  En la app Android, verás una pantalla de "Pairing".
3.  En tu terminal del Gateway, ejecuta:
    ```bash
    pnpm clawdbot pairing generate
    ```
4.  Escanea el código QR que aparecerá en la terminal con la cámara de la app Android.

¡Boom! 💥 Tu dispositivo ahora aparece como un "Nodo" en el sistema.

## Probando el "Talk Mode"

Una vez conectado:
1.  Toca el botón del micrófono en la app.
2.  Di: *"Clawdbot, ¿me escuchas?"*.
3.  Si configuraste Gemini 3.0 correctamente en el Gateway, recibirás una respuesta de voz casi instantánea.

## Conclusión

Has pasado de tener un simple chatbot a un sistema distribuido de IA donde tu cerebro (el modelo en la nube) se conecta con tu Gateway (tu servidor personal) y actúa a través de tu cuerpo (tu dispositivo Android).

Esto abre un mundo de posibilidades para la automatización y la asistencia personal. ¿Te imaginas pedirle a tu asistente que revise tus logs de Logcat mientras conduces? Ahora es posible.
