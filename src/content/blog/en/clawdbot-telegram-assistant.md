---
title: "Clawdbot: AI Assistant on Telegram"
description: "Connecting your self-hosted Clawdbot to Telegram. How to build a private, smart bot that lives in your chat app."
pubDate: 2025-10-31
heroImage: "/images/placeholder-article-clawdbot-telegram.svg"
tags: ["AI", "Telegram", "Bot", "Node.js", "Self-hosting", "Clawdbot", "Productivity"]
reference_id: "a799021c-02cb-427a-ae6e-cd63360b833b"
---
## 🤖 Why Telegram?

Telegram is arguably the best platform for bots. Its API is robust, fast, and free. By connecting your self-hosted LLM (Clawdbot) to Telegram, you get:
1.  **Access Everywhere**: Chat with your AI from any device.
2.  **Voice Messages**: Send audio, get text back (Speech-to-Text).
3.  **Media**: Send images for analysis (Multi-modal models).

## 🏗️ Architecture

1.  **Telegram Bot API**: Webhook or Long Polling.
2.  **Middleware (Node.js)**: Receives message -> Sends to LLM -> Formats response -> Sends back to Telegram.
3.  **LLM Backend**: Ollama / LocalAI running Llama 3.

## 🛠️ Step-by-Step Guide

### 1. Create a Bot
Talk to `@BotFather` on Telegram.
- `/newbot` -> Name: `MyPrivateAI` -> Username: `MyPrivateAI_bot`.
- Copy the **API Token**.

### 2. Set Up Node.js Project

```bash
mkdir clawdbot-telegram
cd clawdbot-telegram
npm init -y
npm install telegraf axios dotenv
```

### 3. Write the Bot Logic (`index.js`)

```javascript
require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx) => ctx.reply('Hello! I am your private AI.'));

bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    ctx.sendChatAction('typing'); // Show "typing..." status

    try {
        // Call local LLM (Ollama)
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3',
            prompt: userMessage,
            stream: false
        });

        ctx.reply(response.data.response);
    } catch (error) {
        console.error(error);
        ctx.reply('Error talking to the brain 🧠');
    }
});

bot.launch();
console.log('Bot is running...');
```

### 4. Run It
```bash
node index.js
```

## 🧠 Advanced Features

### Maintaining Context
The simple example above has no memory. To fix this:
1.  Store `chat_id` and message history in a simple array or Redis.
2.  Send the last N messages as context to Ollama.

### Voice Notes (Whisper)
Telegram sends audio as `.ogg`.
1.  Download file.
2.  Convert to `.wav` (ffmpeg).
3.  Send to OpenAI Whisper (or local Faster-Whisper).
4.  Feed text to LLM.

## 🚀 Deployment
Run this Node.js script on a Raspberry Pi, a spare laptop, or a cheap VPS (if you expose your Ollama port via tunnel like Ngrok).

## 🏁 Conclusion

Building a Telegram bot for your AI is a weekend project with massive utility. It democratizes access to your personal intelligence stack.
