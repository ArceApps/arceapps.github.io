---
title: RadioHub
description: >-
  Tune into more than 30,000 live radio stations worldwide with a built-in equalizer, 
  sleep timer, and a clean, ad-free Material 3 interface.
pubDate: '2026-07-02'
heroImage: /images/apps/radiohub/en/feature_graphic.png
icon: radio
tags:
  - Music
  - Radio
  - Streaming
googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.arceapps.radiohub'
repoUrl: 'https://github.com/ArceApps/PodcastRadio.git'
screenshots:
  - /images/apps/radiohub/en/screenshot_player.png
  - /images/apps/radiohub/en/screenshot_explore.png
  - /images/apps/radiohub/en/screenshot_browse.png
  - /images/apps/radiohub/en/screenshot_favorites.png
  - /images/apps/radiohub/en/screenshot_countries.png
  - /images/apps/radiohub/en/screenshot_timer.png
  - /images/apps/radiohub/en/screenshot_equalizer.png
lastUpdated: 2 Jul 2026
version: 1.0.0
---

<!-- ABOUT_START -->
## Behind the App

RadioHub was born from a simple personal frustration: I wanted a radio app for Android that wasn't cluttered with intrusive ads, giant banners, or sneaky background trackers. The public, community-maintained directory of `radio-browser.info` was the perfect starting point to access over 30,000 global stations, but building a reliable, high-quality stream player on top of community-run servers proved to be a fascinating engineering challenge.

The first technical hurdle was reliability. Since we are relying on a community API, we couldn't just trust a single server endpoint. I implemented a Kotlin HTTP client using Ktor that performs a dynamic, seamless failover between 4 API mirror servers. If a server is slow or goes offline, the app switches to another node in milliseconds, ensuring that searching or exploring categories remains completely uninterrupted for the user.

The second obstacle was real-time audio playback and audio effects processing in the background. Integrating ExoPlayer (Media3) with `android.media.audiofx.Equalizer` required careful tuning: Android's audio effects API is notorious for causing metallic pop or click sounds if enabled abruptly. I developed a reactive controller that delays the equalizer setup until ExoPlayer's audio session ID is fully initialized, and maps decibel levels to millibels smoothly in real time without locking the main thread. Additionally, strict integration with MediaSession ensures audio playback remains solid, allowing users to control the radio from their lock screen or headsets natively.
<!-- ABOUT_END -->

<!-- STORE_DESCRIPTION_START -->

**Discover the ultimate radio experience with RadioHub**. Tune into more than 30,000 live radio stations from every corner of the world, all in one modern, intuitive app built with Jetpack Compose, and 100% free of third-party ads or tracking. Fine-tune your audio with the built-in professional equalizer and set the sleep timer to drift off to your favorite sounds.

<!-- STORE_DESCRIPTION_END -->

## Main Features

*   **Unlimited Global Access**: Search and stream over 30,000 live radio stations grouped by country, language, or genre.
*   **Professional Equalizer**: Customize your sound output with pre-configured profiles (Rock, Pop, Jazz) or adjust frequency bands manually to suit your audio setup.
*   **Sleep Timer**: Schedule the app to stop playing automatically after a set period, saving battery while you sleep.
*   **Fast Local Storage**: Instantly save your favorite stations and browse your playback history with an optimized local Room database.
*   **System Integration**: Effortlessly control playback from the lock screen or navigation drawer thanks to native MediaSession integration.
*   **Material 3 Design**: Enjoy a clean, modern, and accessible user interface with full dark mode support.
*   **Strict Privacy**: No third-party ads, no creepy telemetry, and no unnecessary permissions. Just you and your music.

## Tech Stack

*   **Kotlin & Jetpack Compose**: Modern declarative UI built with Material Design 3 guidelines.
*   **Media3 & ExoPlayer**: High-performance audio player capable of streaming low-latency MP3 and AAC broadcasts.
*   **Ktor Client**: Asynchronous HTTP client designed to handle external API requests with mirror failover.
*   **Koin**: Lightweight dependency injection framework for modular architecture and testing.
*   **Room Database**: Secure local persistence layer for favorites and recent history.
*   **Roborazzi**: Automated screenshot testing framework ensuring layout consistency across different screen form-factors.
