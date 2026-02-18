---
title: "Kotlin Delegation: Clean Code Pattern"
description: "Master the Delegation pattern in Kotlin. Use `by` keyword to replace inheritance with composition. Practical examples for Android."
pubDate: 2025-10-15
heroImage: "/images/placeholder-article-delegation.svg"
tags: ["Kotlin", "Delegation", "Design Patterns", "Clean Code", "Android"]
reference_id: "f80704ef-54c1-481a-9d85-bd50b43cabc2"
---
## 🤝 Composition over Inheritance

Inheritance is often abused in OOP. It creates tight coupling. The Delegation pattern solves this by favoring composition. Kotlin makes this a first-class citizen with the `by` keyword.

### The Problem
You want to extend the functionality of a class (e.g., `ArrayList`), but you can't or shouldn't inherit from it directly because you only need to override one method and delegate the rest.

### The Solution: Class Delegation

```kotlin
interface Base {
    fun print()
}

class BaseImpl(val x: Int) : Base {
    override fun print() { print(x) }
}

class Derived(b: Base) : Base by b

fun main() {
    val b = BaseImpl(10)
    Derived(b).print() // prints 10
}
```

The compiler generates all the forwarding methods for `Base` interface automatically. Zero boilerplate.

## 📦 Property Delegation

The most common use case in Android.

### `by lazy`
Delays initialization until the first access. Thread-safe by default.

```kotlin
val heavyObject: Heavy by lazy {
    Heavy() // Computed only once
}
```

### `by viewModels()`
In Android KTX, we delegate ViewModel creation to a factory.

```kotlin
val viewModel: UserViewModel by viewModels()
```

### `by remember` (Compose)
Not technically a property delegate in the language sense, but conceptually similar. It delegates state retention to the composition.

## 🛠️ Custom Delegates

You can write your own!

```kotlin
class SharedPrefDelegate(context: Context, key: String, default: String) {
    // operator getValue / setValue
}

var username by SharedPrefDelegate(context, "user_name", "Guest")
```

Now, `username = "Alex"` writes to SharedPreferences automatically.

## ⚠️ When NOT to Use It

- **Performance**: While negligible, there is a tiny overhead for property delegation (object allocation).
- **Readability**: Don't hide complex logic in custom delegates. If a variable assignment triggers a network call, it's confusing.

## 🏁 Conclusion

Delegation is a powerful tool to reduce boilerplate and enforce separation of concerns. Use standard delegates (`lazy`, `observable`) freely, but be cautious with custom ones.
