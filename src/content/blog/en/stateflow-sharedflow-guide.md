---
title: "StateFlow vs SharedFlow: The Definitive Guide"
description: "Stop using LiveData. Understand the difference between StateFlow (state) and SharedFlow (events) and when to use Channels."
pubDate: 2025-09-28
heroImage: "/images/placeholder-article-stateflow.svg"
tags: ["Kotlin", "Flow", "Android", "State Management", "Coroutines"]
reference_id: "ac516e4a-e9c1-41ed-8b1a-9c71e4b03d28"
---
## 📉 The Fall of LiveData

LiveData was great in 2017. It was lifecycle-aware. But it had problems:
-   It was tied to Android (hard to test in pure Kotlin).
-   It operated on the Main Thread (performance bottlenecks).
-   It didn't support powerful operators (map, filter, etc).

Enter **Flow**.

## 📊 StateFlow: The State Holder

**StateFlow** is a "Hot Flow" that always holds a value. It is the perfect replacement for `LiveData`.

*   **Initial Value**: Required.
*   **Replay**: 1 (New subscribers get the last value instantly).
*   **Usage**: UI State (Loading, Success, Error).

```kotlin
private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
val uiState = _uiState.asStateFlow()
```

## 📡 SharedFlow: The Event Stream

**SharedFlow** is for events. It doesn't necessarily hold a value.

*   **Initial Value**: None.
*   **Configurable Replay**: Can be 0 (fire and forget) or more.
*   **Usage**: Navigation events, Toasts, Analytics ticks.

```kotlin
private val _events = MutableSharedFlow<Event>()
val events = _events.asSharedFlow()

suspend fun showToast() {
    _events.emit(Event.ShowToast)
}
```

## ⚠️ The SharedFlow Pitfall (Lost Events)

If you emit to a SharedFlow while the View is stopped (e.g., app in background), the View might miss the event.
For "Single Shot Events" that MUST be delivered (like Navigation), consider using **Channels** or `SharedFlow` with `extraBufferCapacity` and `tryEmit`.

## 🎯 Summary

| Feature | StateFlow | SharedFlow | LiveData |
| :--- | :--- | :--- | :--- |
| **Has Initial Value?** | Yes | No | Optional |
| **Lifecycle Aware?** | No (Use `repeatOnLifecycle`) | No | Yes |
| **Thread** | Any | Any | Main |
| **Use Case** | UI State | Events | Legacy |

Switch to Flow. It's the standard.
