---
title: "Investigación: Clawdbot y la Arquitectura Local-First"
description: "Diario de investigación sobre Clawdbot. Más allá del tutorial, aquí analizo la arquitectura descentralizada y los retos de integración con Gemini 3.0."
pubDate: "2026-01-07"
tags: ["Investigación", "Clawdbot", "Arquitectura", "Local-First"]
heroImage: "/images/devlog-default.svg"
---

Si llegaste aquí buscando *cómo* instalar Clawdbot, detente un momento. Ya he cubierto el "paso a paso" en el blog principal, donde explico cómo configurar el [Gateway y Telegram](/blog/clawdbot-asistente-ia-telegram) y cómo compilar el [Nodo Android](/blog/clawdbot-android-node-build).

Esta entrada no es un tutorial. Es el "detrás de cámaras" de esa investigación. Es el registro de mi obsesión de esta semana por entender cómo demonios funciona esta bestia descentralizada.

## La Promesa de la Soberanía

Llevo días dándole vueltas a una idea: estamos perdiendo el control. Usamos ChatGPT, Claude, Gemini... pero al final del día, son cajas negras en la nube de otra persona. Clawdbot me llamó la atención no por ser otro bot más, sino por su filosofía. Promete devolverte la soberanía.

Pero, ¿cumple?

Hoy me he pasado la mañana destripando el código fuente, intentando entender qué lo hace diferente a un simple script de Python con la API de OpenAI.

## Hallazgos Arquitectónicos (Lo que no se ve)

Lo primero que me golpeó fue la elegancia de su diseño. No es monolítico.

1.  **El Gateway es el Rey:** Al principio pensé que era un simple proxy, pero es mucho más. Mantiene el estado de la sesión de una forma que me recuerda a cómo Discord maneja las conexiones. Puedes empezar hablando en Telegram y seguir en la web sin perder el contexto. Eso no es trivial.
2.  **Los Nodos no son Clientes:** Esto me voló la cabeza. Mi móvil Android no se conecta al Gateway para "pedir" cosas. Se conecta para **ofrecer** capacidades. Se anuncia: *"Hola, soy un Pixel 7, tengo cámara, micrófono y GPS. Úsame"*. Invertir esa dependencia cambia todo el juego de la automatización.

## La "Trampa" de los Modelos (y cómo salir de ella)

Aquí es donde me frustré un poco. La documentación te empuja suavemente (y a veces no tan suavemente) hacia Claude de Anthropic. Tiene sentido, se llama *Clawd*bot. Pero para un dev indie como yo, pagar otra suscripción más duele.

Pasé un par de horas peleándome con `clawdbot.json`. La UI me decía una cosa, pero el código decía otra. Resulta que el sistema es mucho más agnóstico de lo que parece.

Descubrí que podía inyectar **Gemini 3.0** simplemente apuntando a `generativelanguage.googleapis.com`. Fue un momento de victoria total ver cómo el bot respondía usando la capa gratuita de Google en lugar de quemar créditos de Anthropic. También logré conectar **GitHub Models** vía Azure AI Inference. De repente, el bot "caro" se volvió accesible.

## El Reto de Android: No todo es color de rosa

Compilar el nodo de Android fue... una experiencia. Gradle siendo Gradle. Pero lo que realmente me dio dolor de cabeza fue el TTS (Text-to-Speech).

El modo "Talk" depende fuertemente de servicios en la nube de calidad (ElevenLabs). Intenté usar el motor local de Android y, sinceramente, suena robótico y con latencia. Funciona, sí, pero rompe la magia de hablar con una IA "viva". Tuve que tocar `local.properties` varias veces hasta que entendí que sin una API Key de pago, la experiencia de voz está a medias. Es un compromiso que hay que aceptar por ahora.

## Reflexión Final

Clawdbot no es perfecto. Tiene aristas ásperas y la documentación asume que sabes lo que haces. Pero representa un cambio de paradigma real: pasar de "consumir IA" a "hospedar IA".

Me quedo pensando en cómo nuestros propios agentes (Sentinel, Bolt) podrían vivir dentro de esta arquitectura. ¿Se imaginan a Sentinel no como un script de CI/CD, sino como un nodo activo monitoreando el repo en tiempo real?

Eso es material para otra investigación. Por hoy, cierro el editor.
