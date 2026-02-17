---
title: "Kotlin Delegation: Composition over Inheritance, Simplified"
description: "Discover the power of the `by` keyword in Kotlin. Implementation delegation, property delegation, and how to avoid boilerplate code."
pubDate: 2025-08-30
heroImage: "/images/placeholder-article-delegation.svg"
tags: ["Kotlin", "Delegation", "Design Patterns", "Clean Code"]
reference_id: "c376d369-de3d-4d13-9aa9-e3fa53bb61d5"
---

"Composition over Inheritance" is a design principle we all know. Inheritance creates tight coupling; composition is flexible.
But in Java, composition requires a lot of boilerplate (forwarding methods manually).

Kotlin solves this elegantly with **Class Delegation** and the `by` keyword.

## 🎭 Class Delegation

Imagine you want to create an `ArrayList` that logs every added element.
Inheriting from `ArrayList` is dangerous (you might break internal logic).
Wrapping it (Composition) is safe but annoying.

**Kotlin Way:**

```kotlin
class LoggingList<T>(
    private val innerList: MutableList<T> = ArrayList()
) : MutableList<T> by innerList { // ✨ Magic happens here

    override fun add(element: T): Boolean {
        println("Adding $element")
        return innerList.add(element)
    }
}
```

The compiler generates all the other methods of `MutableList` (`remove`, `clear`, `get`...) and redirects them to `innerList` automatically. Zero boilerplate.

## 🏠 Property Delegation

Delegation is not just for classes. You can delegate the logic of `get` and `set` of a property.

### 1. `by lazy`
The most famous. The value is computed only on the first access.

```kotlin
val expensiveObject: HeavyObject by lazy {
    println("Computing...")
    HeavyObject() // Only runs once
}
```

### 2. `by observable`
React to changes in a variable.

```kotlin
var user: User by Delegates.observable(User()) { prop, old, new ->
    println("User changed from $old to $new")
    updateUI()
}
```

### 3. Custom Delegates (Android Example)
We can create our own delegates to encapsulate logic, for example, reading arguments from a Fragment.

```kotlin
class FragmentArgumentDelegate<T : Any> : ReadOnlyProperty<Fragment, T> {
    override fun getValue(thisRef: Fragment, property: KProperty<*>): T {
        val key = property.name
        return thisRef.arguments?.get(key) as T
            ?: throw IllegalStateException("Argument $key not found")
    }
}

// Usage
class UserFragment : Fragment() {
    private val userId: String by FragmentArgumentDelegate()
}
```

## 🎯 Conclusion

Delegation is one of Kotlin's "superpowers". It allows you to write code that follows the Composition principle without paying the verbosity tax. Use it to create decorators, wrappers, and encapsulate state logic cleanly.
