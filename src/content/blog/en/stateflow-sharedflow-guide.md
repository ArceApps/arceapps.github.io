---
title: "StateFlow vs. SharedFlow: A Practical Guide"
description: "When to use which? Hot streams in Kotlin Coroutines. How to prevent event loss and ensure UI consistency."
pubDate: 2025-10-15
heroImage: "/images/placeholder-article-stateflow.svg"
tags: ["Kotlin", "Coroutines", "Flow", "Android", "StateFlow", "SharedFlow"]
reference_id: "4f809146-8583-4075-ade0-d55d8523f8d9"
---
## 🌊 The Hot Flow Confusion

In Kotlin Coroutines, we have `Flow` (cold) and two types of Hot Flows: `StateFlow` and `SharedFlow`. Knowing the difference is critical for Android UI development.

### Cold Flow
- Starts only when collected.
- Each collector gets a fresh stream.
- Example: Room query, Retrofit call.

### Hot Flow
- Always active (depending on scope).
- Multicast (multiple collectors get same updates).
- Example: UI State, Events.

## 💾 StateFlow: The State Holder

Designed to replace `LiveData`. It always has a value.

### Characteristics
1.  **Initial Value**: Mandatory.
2.  **Replay Cache**: size = 1 (always emits last value to new subscribers).
3.  **Equality Check**: Only emits if value changes (`distinctUntilChanged`).

### Use Case: UI State
Perfect for holding the current state of a screen (Loading, Content, Error).

```kotlin
private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
val uiState: StateFlow<UiState> = _uiState.asStateFlow()
```

## 📡 SharedFlow: The Event Emitter

Designed for one-time events or streams without initial state.

### Characteristics
1.  **No Initial Value**: Starts empty.
2.  **Configurable Replay**: Can replay 0, 1, or N previous values.
3.  **Buffer Overflow**: Can drop oldest or suspend.

### Use Case: Navigation, Toasts
Perfect for "fire and forget" events.

```kotlin
private val _events = MutableSharedFlow<UiEvent>()
val events: SharedFlow<UiEvent> = _events.asSharedFlow()

// Emitting
_events.emit(UiEvent.ShowToast("Hello"))
```

## ⚠️ The Trap: SharedFlow for State

Don't use `SharedFlow` for UI state. If the UI collects it *after* emission (e.g., rotation), the state is lost unless you configure replay. Just use `StateFlow`.

## ⚠️ The Trap: StateFlow for Events

Don't use `StateFlow` for events like "Show Toast". If you emit the same event twice, `StateFlow` will ignore the second one (because value didn't change). And if you rotate the screen, the event re-triggers (because it replays).

## 🏁 Conclusion

- **StateFlow**: For State (What to show). Replaces LiveData.
- **SharedFlow**: For Events (What to do). Replaces SingleLiveEvent.
