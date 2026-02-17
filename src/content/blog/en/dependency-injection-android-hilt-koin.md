---
title: "Dependency Injection in Android: Hilt, Koin, and Manual DI"
description: "Confused about DI in Android? We compare Hilt (Dagger), Koin, and Manual Dependency Injection. Which one should you choose for your 2025 project?"
pubDate: 2025-09-01
heroImage: "/images/placeholder-article-di.svg"
tags: ["Dependency Injection", "Hilt", "Koin", "Android", "Architecture"]
reference_id: "2cc50128-7f43-419d-9c29-864115ddb76a"
---

Dependency Injection (DI) is one of the most intimidating topics for junior Android developers. "Annotations everywhere", "Magic code generation", "Service Locator vs DI"... let's simplify it.

## 💉 What is DI?

Simply put: **Don't create your dependencies inside your class. Ask for them.**

**Bad (Tight Coupling):**
```kotlin
class Car {
    private val engine = V8Engine() // Car creates Engine
}
```

**Good (Inversion of Control):**
```kotlin
class Car(private val engine: Engine) { // Car asks for Engine
}
```

Now `Car` works with `V8Engine`, `ElectricEngine`, or `FakeTestEngine`.

## ⚔️ The Battle: Hilt vs Koin

### 1. Hilt (Google's Recommended)
Built on top of Dagger. It uses **Compile-time** generation.
*   **Pros**: Catch errors at compile time (if a dependency is missing, the app won't build). Standard for large teams. Excellent integration with Jetpack (ViewModel, WorkManager).
*   **Cons**: Slow build times (kapt/ksp). Verbose setup (`@Module`, `@InstallIn`, `@Provides`). Steep learning curve.
*   **Verdict**: Use it for serious, long-term, scalable apps.

### 2. Koin (The Kotlin Way)
A "Service Locator" DSL. It uses **Runtime** resolution.
*   **Pros**: Pure Kotlin (no code generation). Extremely fast build times. Very easy to read and write.
*   **Cons**: Runtime crashes (if you forget a definition, the app crashes when you open the screen). Slightly slower startup time (reflection-like behavior).
*   **Verdict**: Perfect for smaller apps, rapid prototyping, KMP (Kotlin Multiplatform), or if you hate annotation processing.

### 3. Manual DI
Just passing objects in constructors.
*   **Pros**: Zero magic. You understand exactly what is happening.
*   **Cons**: Lots of boilerplate. Managing scopes (Singleton vs ActivityRetained) manually is hard.
*   **Verdict**: Only if:
    *   You are learning how DI works (educational purposes).
    *   Your app is extremely tiny (a calculator).

## 🧠 Clean Architecture & DI

Regardless of the tool, your **Domain** layer should not know about it.
*   Don't put Dagger `@Inject` annotations on your Domain Entities (if you want to be a purist).
*   Don't use `KoinComponent` inside your Use Cases.

DI should be configured in the "Framework" layer (or `app` module), injecting Data implementations into Use Cases, and Use Cases into ViewModels.

**Golden Rule**: The DI tool is an implementation detail. Your business logic should not marry it.
