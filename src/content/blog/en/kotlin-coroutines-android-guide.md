---
title: "Kotlin Coroutines: The Android Guide"
description: "Mastering Kotlin Coroutines on Android. Dispatchers, structured concurrency, and best practices for asynchronous programming."
pubDate: 2025-10-15
heroImage: "/images/placeholder-article-coroutines.svg"
tags: ["Kotlin", "Coroutines", "Android", "Async", "Concurrency", "Best Practices"]
reference_id: "68c16e5f-eccc-4903-bd42-f5c5dd0d19f6"
---
## 🔄 The Async Problem

Android apps are single-threaded by default (Main Thread). Long operations (Network, DB) block the UI, causing ANRs (Application Not Responding).

### Callbacks vs. RxJava vs. Coroutines

1.  **Callbacks**: Callback Hell (`onSuccess`, `onError` nested 5 levels deep).
2.  **RxJava**: Powerful but steep learning curve and verbose.
3.  **Coroutines**: Write async code sequentially. Built-in language support.

## 🧵 Dispatchers

Where does the code run?
- **Dispatchers.Main**: UI Thread (Updating views).
- **Dispatchers.IO**: Network, Disk (Reading files, API calls).
- **Dispatchers.Default**: CPU Intensive (Parsing JSON, sorting lists).

### Best Practice: Inject Dispatchers
Don't hardcode `Dispatchers.IO`. Inject them to make testing easier.

```kotlin
class UserRepository(
    private val ioDispatcher: CoroutineDispatcher
) {
    suspend fun getUser() = withContext(ioDispatcher) { ... }
}
```

## 🏗️ Structured Concurrency

Coroutines are launched in a `Scope`. When the scope dies, all coroutines are cancelled.

### ViewModelScope
Tied to ViewModel lifecycle. Cleared when ViewModel is cleared.
```kotlin
viewModelScope.launch {
    // Automatically cancelled if user leaves screen
    repository.getData()
}
```

### LifecycleScope
Tied to Fragment/Activity lifecycle.
```kotlin
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        // Collect flows safely
    }
}
```

## ⚠️ Common Pitfalls

1.  **GlobalScope**: Avoid it. It has no lifecycle and can leak memory.
2.  **Catching CancellationException**: Don't catch generic `Exception` inside a coroutine, or you might break cancellation. Rethrow `CancellationException`.
3.  **Blocking Code**: Never call `Thread.sleep` inside a coroutine. Use `delay`.

## 🏁 Conclusion

Coroutines simplify async code dramatically. By understanding scopes and dispatchers, you can write safe, efficient, and readable concurrent code.
