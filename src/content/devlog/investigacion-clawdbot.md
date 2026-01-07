---
title: "Investigación: Clawdbot y la Arquitectura Local-First"
description: "Análisis técnico de Clawdbot, configuración de Gateway y exploración de la integración con modelos externos como Gemini y GitHub Copilot."
pubDate: "2026-01-07"
tags: ["Investigación", "Clawdbot", "Arquitectura", "Local-First"]
heroImage: "/images/devlog-default.svg"
---

Hoy he dedicado tiempo a investigar en profundidad **Clawdbot**, un proyecto de asistente personal open-source que promete devolver la soberanía de los datos al usuario.

## Hallazgos Arquitectónicos

Lo más interesante es su diseño descentralizado pero coordinado:
*   **Gateway:** Actúa como el núcleo. No es solo un proxy; mantiene el estado de la sesión y el contexto. Esto es crucial porque permite cambiar de "interfaz" (de Telegram a WebChat) sin perder el hilo de la conversación.
*   **Protocolo de Nodos:** La forma en que los dispositivos (Android, iOS) se conectan no es simplemente como clientes de chat, sino como nodos de ejecución. Exponen *capabilities* (cámara, micrófono, location) que el Gateway puede invocar.

## Configuración de Modelos (La parte truculenta)

La documentación sugiere fuertemente usar Claude (Anthropic), lo cual tiene sentido dado el nombre. Sin embargo, para hacerlo viable económicamente para un desarrollador individual, la integración con **Gemini 3.0** es vital.

Descubrí que la configuración de `agent.models` es flexible. Aunque la UI a veces empuja hacia los defaults, el archivo `clawdbot.json` permite definir cualquier endpoint compatible con OpenAI. Esto es lo que permite usar:
1.  **Google Gemini:** Usando la base URL de `generativelanguage.googleapis.com`.
2.  **GitHub Models:** Usando el endpoint de Azure AI Inference.

## Retos en Android

La compilación del nodo Android es estándar (Gradle), pero la dependencia de servicios de voz locales para el "Talk Mode" puede requerir configuración extra en `local.properties` si se quieren usar servicios premium de TTS como ElevenLabs. Para la versión básica, el TTS del sistema funciona, pero la latencia puede variar.

## Conclusión

Clawdbot representa un cambio de paradigma: de "consumir IA" a "hospedar IA". Para el roadmap de ArceApps, investigar cómo integrar nuestros agentes (Sentinel, Bolt) dentro de esta arquitectura de Gateway podría ser el siguiente gran paso.
