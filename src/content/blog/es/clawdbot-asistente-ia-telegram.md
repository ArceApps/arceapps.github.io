---
title: "Clawdbot: Tu Asistente IA Privado en Telegram con Gemini 3.0 y GitHub Copilot"
description: "Aprende a instalar Clawdbot, conectarlo a Telegram y potenciarlo con Gemini 3.0 y GitHub Copilot para tener un 'Code Buddy' 24/7 en tu bolsillo."
pubDate: 2026-01-07
tags: ["IA", "Clawdbot", "Telegram", "Gemini", "GitHub Copilot", "Productividad", "Android"]
heroImage: "/images/clawdbot-telegram-gemini.svg"
reference_id: "a799021c-02cb-427a-ae6e-cd63360b833b"
---

¿Alguna vez has deseado tener a ChatGPT o Claude "viviendo" en tu Telegram, pero con acceso real a tus herramientas locales y sin pagar suscripciones extras absurdas?

Hoy te presento **[Clawdbot](https://github.com/clawdbot/clawdbot)**, un asistente personal de código abierto, *local-first*, que puedes alojar tú mismo. A diferencia de los bots comerciales, Clawdbot es tuyo: tus datos, tus claves, tu control.

En este artículo, vamos a configurarlo para que sea la herramienta definitiva para un desarrollador Android, usando **Gemini 3.0 Flash/Pro** (que tiene una capa gratuita generosa) y **GitHub Copilot** (a través de GitHub Models) como su cerebro.

> **Nota:** La inspiración para este artículo viene del excelente post de [Antonio (DevExpert)](https://www.linkedin.com/posts/antonio-devexpert_hablando-con-clawdbot-por-telegram-hemos-activity-7414338288188297216-FB2u), quien mostró cómo usaba Clawdbot para discutir arquitectura Android desde el móvil. ¡Todo el crédito para él por descubrirnos esta joya!

## ¿Qué es Clawdbot? 🦞

Clawdbot no es solo un bot de chat. Es una plataforma "Gateway" que conecta múltiples interfaces (WhatsApp, Telegram, Slack, Discord) con múltiples modelos de IA (Claude, OpenAI, Gemini, etc.).

Su arquitectura se divide en:
1.  **Gateway:** El servidor central que gestiona mensajes y sesiones.
2.  **Providers:** Conexiones con servicios como Telegram.
3.  **Agents:** La lógica de IA que procesa tu intención.
4.  **Nodes:** Dispositivos que ejecutan acciones locales (como tu Mac o tu Android).

## Paso 1: Instalación del Gateway

Clawdbot está escrito en TypeScript. Necesitarás tener Node.js instalado (v22+ recomendado).

```bash
# Clona el repositorio
git clone https://github.com/clawdbot/clawdbot.git
cd clawdbot

# Instala dependencias (usa pnpm, es lo recomendado)
npm install -g pnpm
pnpm install

# Inicia el asistente de configuración
pnpm clawdbot onboard
```

El comando `onboard` te guiará, pero para nuestra configuración avanzada con Gemini y Copilot, vamos a editar el archivo de configuración manualmente.

## Paso 2: Configurando el Cerebro (Gemini y Copilot)

Aquí es donde la magia ocurre. Clawdbot soporta cualquier modelo compatible con la API de OpenAI.

### Opción A: Gemini 3.0 (Velocidad y Ventana de Contexto)

Google ofrece acceso a Gemini 3.0 Pro y Flash a través de [Google AI Studio](https://aistudio.google.com/). Es extremadamente rápido y maneja contextos enormes, ideal para pegarle clases enteras de Kotlin.

1.  Consigue tu API Key en AI Studio.
2.  Edita tu archivo `~/.clawdbot/clawdbot.json` (o créalo):

```json
{
  "agent": {
    "model": "google/gemini-3.0-pro",
    "models": {
      "google/gemini-3.0-pro": {
         "id": "gemini-3.0-pro-latest",
         "provider": "openai",
         "apiBase": "https://generativelanguage.googleapis.com/v1beta/openai/",
         "apiKey": "TU_API_KEY_DE_GEMINI"
      }
    }
  }
}
```
*Nota: Asegúrate de usar el endpoint compatible con OpenAI de Gemini.*

### Opción B: GitHub Copilot (Calidad de Código)

Si tienes acceso a GitHub Models (parte del Marketplace), puedes usar modelos potentes como GPT-4o o Claude 3.5 Sonnet usando tu identidad de GitHub.

1.  Genera un [Personal Access Token (PAT)](https://github.com/settings/tokens) con permisos de acceso a Models.
2.  Configura en `clawdbot.json`:

```json
{
  "agent": {
    "models": {
      "github/gpt-4o": {
        "id": "gpt-4o",
        "provider": "openai",
        "apiBase": "https://models.inference.ai.azure.com",
        "apiKey": "TU_GITHUB_TOKEN"
      }
    }
  }
}
```

Puedes configurar varios y cambiar entre ellos hablando con el bot: *"Switch model to github/gpt-4o"*.

## Paso 3: Conexión con Telegram

Telegram es la interfaz perfecta: rápida, soporta notas de voz y archivos, y tiene clientes nativos excelentes en Android.

1.  Abre Telegram y habla con [@BotFather](https://t.me/BotFather).
2.  Envía `/newbot` y sigue las instrucciones para obtener tu **Token**.
3.  Añade esto a tu `clawdbot.json`:

```json
{
  "telegram": {
    "botToken": "TU_TELEGRAM_BOT_TOKEN",
    "allowFrom": ["tu_username_de_telegram"]
  }
}
```
*Importante: `allowFrom` es crucial para la seguridad. Solo tu usuario debería poder hablar con tu asistente.*

## Iniciando el Bot

Vuelve a la terminal y arranca el Gateway:

```bash
pnpm clawdbot gateway
```

¡Listo! Abre tu chat en Telegram y di "Hola". Tu asistente personal, potenciado por Gemini o Copilot, te responderá.

## Casos de Uso para Desarrolladores Android

Ahora que lo tienes en el bolsillo, ¿para qué sirve?

### 1. "Rubber Ducking" en el Bus
Estás volviendo a casa y se te ocurre una idea para solucionar ese bug de concurrencia.
*   **Tú (Audio):** *"Oye, estoy pensando en migrar de LiveData a StateFlow, pero me preocupa cómo manejar los eventos de una sola vez, tipo los Toasts. ¿Qué opinas?"*
*   **Clawdbot (Gemini):** Te responderá con un análisis de pros y contras, sugiriendo patrones como `Channel` o librerías de terceros, y te dará un ejemplo de código.

### 2. Generación de Boilerplate
*   **Tú:** *"Necesito un Adapter para un RecyclerView que muestre una lista de `User` con DiffUtil. Hazlo en Kotlin y usa ViewBinding."*
*   **Clawdbot:** Genera el código completo listo para copiar y pegar cuando llegues al PC.

### 3. Explicación de Conceptos
*   **Tú:** *"Explícame la diferencia entre `LaunchedEffect` y `DisposableEffect` en Compose como si tuviera 5 años."*

## Siguientes Pasos

Esto es solo el principio. Clawdbot tiene una característica "killer": los **Nodes**. En el próximo artículo, veremos cómo compilar e instalar la aplicación de Android nativa de Clawdbot para darle a tu asistente ojos y oídos reales (cámara, ubicación y más).

👉 [Leer Parte 2: Clawdbot en Android - Compilando el Nodo Nativo](/blog/clawdbot-android-node-build)
