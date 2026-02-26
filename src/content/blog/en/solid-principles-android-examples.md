---
title: "SOLID Principles: Android Examples"
description: "Understanding SOLID principles in modern Android. Examples using Kotlin, Hilt, and MVVM."
pubDate: 2025-06-21
heroImage: "/images/placeholder-article-solid-android.svg"
tags: ["SOLID", "Principles", "Android", "Kotlin", "Clean Code", "Architecture"]
reference_id: "23245d12-f1a0-4c90-a479-5054040d07f3"
---
## 📏 SOLID Principles in Android

SOLID is a set of 5 principles for writing maintainable OOP code.

### 1. Single Responsibility (SRP)
A class should have one reason to change.
- **Bad**: `UserActivity` handling UI, Network, and Database.
- **Good**: `UserActivity` (UI) -> `UserViewModel` (State) -> `UserRepository` (Data) -> `UserRemoteSource` (Network).

### 2. Open/Closed (OCP)
Open for extension, closed for modification.
- **Bad**: `if (type == A) ... else if (type == B) ...`
- **Good**: Use interfaces and polymorphism.
  ```kotlin
  interface Payment {
      fun pay()
  }

  class CreditCard : Payment { ... }
  class PayPal : Payment { ... }
  ```

### 3. Liskov Substitution (LSP)
Subtypes must be substitutable for their base types.
- **Bad**: `Square` inheriting `Rectangle` and changing `setHeight`.
- **Good**: Use composition or separate interfaces.

### 4. Interface Segregation (ISP)
Clients shouldn't depend on methods they don't use.
- **Bad**: `interface Worker { work(); eat(); }` -> Robot doesn't eat.
- **Good**: `interface Workable { work(); }`, `interface Eatable { eat(); }`.

### 5. Dependency Inversion (DIP)
High-level modules shouldn't depend on low-level modules. Both should depend on abstractions.
- **Bad**: `ViewModel` depends on `RetrofitUserApi` directly.
- **Good**: `ViewModel` depends on `UserRepository` interface. `UserRepositoryImpl` depends on `RetrofitUserApi`.

## 🧠 Why It Matters in Android

SOLID prevents "God Activities" and tightly coupled code that breaks when you update libraries (e.g., migrating from Gson to Moshi).
- **SRP** makes ViewModels testable.
- **DIP** (via Hilt) allows easy mocking.
- **ISP** keeps interfaces clean.

## 🏁 Conclusion

Applying SOLID principles (especially SRP and DIP) is the foundation of Clean Architecture.
