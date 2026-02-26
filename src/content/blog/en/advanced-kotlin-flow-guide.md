---
title: "Advanced Kotlin Flow: Operators and Patterns"
description: "Level up with Kotlin Flow. Master operators like combine, zip, flatMapLatest, and learn to handle complex reactive streams in Android."
pubDate: 2025-10-15
heroImage: "/images/placeholder-article-flow-advanced.svg"
tags: ["Kotlin", "Flow", "Reactive Programming", "Android", "Coroutines"]
reference_id: "bbab8f8a-8eba-4227-988a-15f5c7ec0ad4"
---
## 🌊 Beyond basic `collect`

If you are already using `StateFlow` and `SharedFlow`, you are on the right track. But the true power of Kotlin Flow lies in its transformation and combination operators. These allow you to model complex data flows declaratively, eliminating "callback hells" and scattered mutable state variables.

## 🔀 Combining Flows (Streams)

In Android, it is common for a view to depend on multiple data sources (e.g., user data + settings + network status).

### `combine` vs `zip`

This is a classic interview question.

#### `zip`: Strict Synchronization
Waits for **both** flows to emit a new value to combine them. It's like a zipper.

```kotlin
val flowA = flowOf(1, 2, 3)
val flowB = flowOf("A", "B", "C")

flowA.zip(flowB) { a, b -> "$a$b" }
// Emissions: "1A", "2B", "3C"
```
If `flowB` takes a while to emit "B", `zip` waits. It does not advance.

#### `combine`: Latest Known State
Emits a new value every time **either** flow emits, using the latest known value of the other.

```kotlin
val userFlow = repository.getUser() // Emits User
val settingsFlow = repository.getSettings() // Emits Settings

userFlow.combine(settingsFlow) { user, settings ->
    ProfileUiState(user, settings)
}.collect { state -> updateUi(state) }
```
If `settingsFlow` changes, the state is re-calculated using the last emitted `user`. This is ideal for **UI State**.

## ⚡ Flattening Operators

When a Flow emits *other* Flows (e.g., a search that triggers a network request for each keystroke), you need to "flatten" them.

### The King: `flatMapLatest`

It is the most useful operator for search in Android. When a new emission arrives (new letter typed), it cancels the previous flow (previous search) and starts the new one.

```kotlin
searchQueryStateFlow
    .debounce(300) // Wait 300ms of inactivity
    .flatMapLatest { query ->
        if (query.isEmpty()) {
            flowOf(emptyList())
        } else {
            apiService.searchProducts(query).asFlow()
        }
    }
    .collect { results -> showResults(results) }
```
This saves bandwidth and ensures you only show the results of the *latest* search.

### Other Flavors
- **`flatMapConcat`**: Processes sequentially. Waits for flow A to finish before starting B.
- **`flatMapMerge`**: Processes in parallel. Watch out for order!

## 🛡️ Robust Error Handling

In Flow, exceptions propagate downstream.

```kotlin
flow {
    emit(1)
    throw RuntimeException("Boom")
}
.catch { e ->
    // Catches the exception from above
    emit(-1) // We can emit an error value or fallback
}
.collect { ... }
```

**Important:** `catch` only catches errors that occur *upstream*. It does not catch errors occurring in `collect` or *downstream* operators.

## ⏱️ Timing Operators

- **`debounce(ms)`**: Filters rapid emissions. Vital for SearchViews and buttons (to avoid double clicks).
- **`sample(ms)`**: Takes a sample every X time. Useful for very fast UI updates (e.g., download progress) to not saturate the Main Thread.

## 🎯 Pattern: Partial MVI with `scan`

The `scan` operator is like `reduce`, but emits every intermediate step. It is perfect for handling cumulative state (Redux-style).

```kotlin
sealed class Intent {
    data class Add(val n: Int) : Intent()
    data class Subtract(val n: Int) : Intent()
}

intentFlow
    .scan(0) { total, intent ->
        when (intent) {
            is Intent.Add -> total + intent.n
            is Intent.Subtract -> total - intent.n
        }
    }
    .collect { total -> render(total) }
```

## 🧠 Conclusion

Mastering Flow operators allows you to write complex business logic that is:
1.  **Declarative**: You say *what* to do, not *how*.
2.  **Reactive**: The UI always reflects the current state.
3.  **Efficient**: Automatic cancellation and backpressure handling.

Don't stick with just `collect`. Explore the toolbox.
