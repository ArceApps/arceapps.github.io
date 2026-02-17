---
title: "Clawdbot on Android: Building the Native Node"
description: "Turn your old Android phone into a powerful AI node. Step-by-step guide to compiling and installing the Clawdbot Android application."
pubDate: 2025-05-26
heroImage: "/images/clawdbot-android-build.svg"
tags: ["Android", "AI", "Open Source", "Clawdbot", "Self-hosting"]
reference_id: "89c2dae3-6e3a-4a25-a134-2e987c3b9a11"
---

In the [previous article](/blog/clawdbot-telegram-assistant), we set up the brain (the Gateway). Now let's set up the body. We are going to compile the **Clawdbot Node Android** app to give your AI access to sensors, camera, and location.

## Prerequisites

*   Android Studio Koala or newer.
*   JDK 17.
*   An Android device (API 26+).

## 1. Cloning the Repo

```bash
git clone https://github.com/clawdbot/clawdbot-node-android.git
cd clawdbot-node-android
```

## 2. Configuration

Create a `local.properties` file if it doesn't exist, and add your API keys if you plan to use cloud services directly (optional, as the Gateway usually handles this).

More importantly, check `app/src/main/assets/config.json`. Here you define the Gateway connection.

```json
{
  "gateway_url": "wss://tu-gateway.railway.app",
  "node_id": "android_pixel_5",
  "secret": "YOUR_SHARED_SECRET"
}
```

## 3. Compilation

Open the project in Android Studio.
Sync Gradle.
Run `AssembleDebug`.

Or via CLI:
```bash
./gradlew installDebug
```

## 4. Permissions

The app will ask for LOTS of permissions.
*   **Camera**: To send photos to the AI ("What is this?").
*   **Location**: For geofencing or "Where am I?".
*   **Microphone**: For voice notes.

Grant them without fear; the code is open source and nothing leaves your device without your explicit command.

## 5. First Test

1.  Open the App. It should show "Connected".
2.  Go to Telegram.
3.  Write: `"Take a photo"` (or whatever command you configured).
4.  The bot sends the command to the Gateway -> Gateway to Android Node -> Android Node takes photo -> Returns to Gateway -> Telegram.

Magic. ✨

## 🚀 What's Next?

You now have a complete physical AI system. In future articles, we will explore how to write **custom skills** so your Android Node can do things like:
*   "Read my latest SMS" (for 2FA).
*   "Turn on the flashlight if the server goes down."
