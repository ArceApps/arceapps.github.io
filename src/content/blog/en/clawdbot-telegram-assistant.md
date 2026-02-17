---
title: "Clawdbot: Your Personal AI Assistant on Telegram"
description: "Why pay for ChatGPT Plus? Learn how to deploy your own customized AI assistant on Telegram using Clawdbot, Node.js, and free providers."
pubDate: 2025-05-25
heroImage: "/images/clawdbot-telegram-hero.svg"
tags: ["AI", "Telegram", "Bot", "Node.js", "Self-hosting"]
reference_id: "ef1fe9be-2c97-42f0-9128-490333333333"
---

We all love ChatGPT, but the interface is... a web page.
What if you could have your AI on **WhatsApp** or **Telegram**? And not just a text bot, but one that can "see" (via camera), "hear" (via voice notes), and execute actions on your PC?

That is **Clawdbot**. An open-source project to create decentralized assistants.

## 🧠 The Architecture

Clawdbot is not a monolith. It has two parts:
1.  **Gateway (Server)**: The brain. Connects to Telegram and LLM APIs (OpenAI, Anthropic, Gemini).
2.  **Nodes (Clients)**: The body. Can be your PC, an Android phone, or a Raspberry Pi.

Today we will configure the **Gateway**.

## 🛠️ Installation

Requirements: Node.js 20+ and a Telegram Bot Token (from @BotFather).

```bash
git clone https://github.com/clawdbot/clawdbot-gateway.git
cd clawdbot-gateway
pnpm install
```

## ⚙️ Configuration

Copy `.env.example` to `.env`.

```env
TELEGRAM_TOKEN=123456:ABC-DEF...
OPENAI_API_KEY=sk-... (or ANTHROPIC_KEY)
# Optional: Use a free local model
# LLM_PROVIDER=ollama
```

### Config.json

Here you define your bot's personality.

```json
{
  "systemPrompt": "You are JARVIS. Concise, sarcastic, helpful.",
  "telegram": {
    "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
    "allowFrom": ["your_telegram_username"]
  }
}
```
*Important: `allowFrom` is crucial for security. Only your user should be able to talk to your assistant.*

## Starting the Bot

Back to the terminal and start the Gateway:

```bash
pnpm clawdbot gateway
```

Done! Open your chat in Telegram and say "Hello". Your personal assistant, powered by Gemini or Copilot, will respond.

## Use Cases for Android Developers

Now that you have it in your pocket, what is it for?

### 1. "Rubber Ducking" on the Bus
You are going home and you have an idea to fix that concurrency bug.
*   **You (Audio):** *"Hey, I'm thinking of migrating from LiveData to StateFlow, but I'm worried about handling one-off events, like Toasts. What do you think?"*
*   **Clawdbot (Gemini):** Will reply with a pros and cons analysis, suggesting patterns like `Channel` or third-party libraries, and give you a code example.

### 2. Boilerplate Generation
*   **You:** *"I need an Adapter for a RecyclerView showing a list of `User` with DiffUtil. Do it in Kotlin and use ViewBinding."*
*   **Clawdbot:** Generates the complete code ready to copy and paste when you get to the PC.

### 3. Concept Explanation
*   **You:** *"Explain the difference between `LaunchedEffect` and `DisposableEffect` in Compose like I'm 5."*

## Next Steps

This is just the beginning. Clawdbot has a "killer" feature: **Nodes**. In the next article, we will see how to compile and install the native Clawdbot Android application to give your assistant real eyes and ears (camera, location, and more).

👉 [Read Part 2: Clawdbot on Android - Building the Native Node](/blog/clawdbot-android-node-build)
