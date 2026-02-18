---
title: "Research: Clawdbot and Local-First Architecture"
description: "Research diary on Clawdbot. Beyond the tutorial, here I analyze the decentralized architecture and Gemini 3.0 integration challenges."
pubDate: 2026-01-07
tags: ["Research", "Clawdbot", "Architecture", "Local-First"]
heroImage: "/images/devlog-default.svg"
---

If you came here looking for *how* to install Clawdbot, stop for a moment. I've already covered the "step by step" in the main blog, where I explain how to configure the [Gateway and Telegram](/blog/clawdbot-asistente-ia-telegram) and how to compile the [Android Node](/blog/clawdbot-android-node-build).

This entry is not a tutorial. It is the "behind the scenes" of that research. It is the record of my obsession this week to understand how on earth this decentralized beast works.

## The Promise of Sovereignty

I've been thinking about an idea for days: we are losing control. We use ChatGPT, Claude, Gemini... but at the end of the day, they are black boxes in someone else's cloud. Clawdbot caught my attention not for being just another bot, but for its philosophy. It promises to give you back sovereignty.

But does it deliver?

Today I spent the morning dissecting the source code, trying to understand what makes it different from a simple Python script with the OpenAI API.

## Architectural Findings (The Unseen)

The first thing that hit me was the elegance of its design. It is not monolithic.

1.  **The Gateway is King:** At first I thought it was a simple proxy, but it is much more. It maintains session state in a way that reminds me of how Discord handles connections. You can start talking on Telegram and continue on the web without losing context. That is not trivial.
2.  **Nodes aren't Clients:** This blew my mind. My Android mobile doesn't connect to the Gateway to "ask" for things. It connects to **offer** capabilities. It advertises itself: *"Hi, I'm a Pixel 7, I have camera, mic, and GPS. Use me"*. Inverting that dependency changes the whole automation game.

## The Model "Trap" (And how to get out of it)

Here is where I got a bit frustrated. The documentation gently (and sometimes not so gently) pushes you towards Anthropic's Claude. It makes sense, it's called *Clawd*bot. But for an indie dev like me, paying for yet another subscription hurts.

I spent a couple of hours fighting with `clawdbot.json`. The UI told me one thing, but the code said another. Turns out the system is much more agnostic than it appears.

I discovered I could inject **Gemini 3.0** simply by pointing to `generativelanguage.googleapis.com`. It was a moment of total victory seeing the bot respond using Google's free tier instead of burning Anthropic credits. I also managed to connect **GitHub Models** via Azure AI Inference. Suddenly, the "expensive" bot became accessible.

## The Android Challenge: Not all roses

Compiling the Android node was... an experience. Gradle being Gradle. But what really gave me a headache was TTS (Text-to-Speech).

The "Talk" mode depends heavily on quality cloud services (ElevenLabs). I tried using Android's local engine and, honestly, it sounds robotic and has latency. It works, yes, but it breaks the magic of talking to an "alive" AI. I had to touch `local.properties` several times until I understood that without a paid API Key, the voice experience is half-baked. It is a compromise we have to accept for now.

## Final Reflection

Clawdbot is not perfect. It has rough edges and the documentation assumes you know what you are doing. But it represents a real paradigm shift: moving from "consuming AI" to "hosting AI".

I am left thinking about how our own agents (Sentinel, Bolt) could live inside this architecture. Can you imagine Sentinel not as a CI/CD script, but as an active node monitoring the repo in real-time?

That is material for another research. Closing the editor for today.
