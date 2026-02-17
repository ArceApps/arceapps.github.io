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

Today I spent the morning ripping apart the source code, trying to understand what makes it different from a simple Python script with the OpenAI API.

## Architectural Findings (The Unseen)

First thing that hit me was design elegance. Not monolithic.

1.  **Gateway is King:** Thought simple proxy initially, much more. Maintains session state reminding Discord connection handling. Start talking Telegram continue web without context loss. Not trivial.
2.  **Nodes aren't Clients:** Mind blown. Android mobile doesn't connect Gateway "ask" things. Connects **offer** capabilities. Advertises: *"Hi, Pixel 7, have camera, mic, GPS. Use me"*. Inverting dependency changes automation game.

## Model "Trap" (And how to exit)

Frustrated here. Documentation pushes gently (sometimes not gently) Anthropic Claude. Makes sense, *Clawd*bot. Indie dev paying subscription hurts.

Spent couple hours fighting `clawdbot.json`. UI said one thing, code another. System much more agnostic than appears.

Discovered could inject **Gemini 3.0** pointing `generativelanguage.googleapis.com`. Victory moment seeing bot respond using Google free tier instead burning Anthropic credits. Also connected **GitHub Models** via Azure AI Inference. Suddenly "expensive" bot accessible.

## Android Challenge: Not all roses

Compiling Android node... experience. Gradle being Gradle. TTS (Text-to-Speech) headache.

"Talk" mode depends heavily quality cloud services (ElevenLabs). Tried local Android engine, sounds robotic latency. Works, breaks magic talking "alive" AI. Touched `local.properties` until understood without paid API Key, voice experience half-baked. Compromise accepted for now.

## Final Reflection

Clawdbot not perfect. Rough edges, documentation assumes know what doing. Represents real paradigm shift: "consuming AI" to "hosting AI".

Thinking how own agents (Sentinel, Bolt) live architecture. Imagine Sentinel not CI/CD script, active node monitoring repo real-time?

Material another research. Editor close.
