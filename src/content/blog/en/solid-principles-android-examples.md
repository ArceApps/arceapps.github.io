---
title: "SOLID Principles in Android: Not Just Theory"
description: "How to apply S.O.L.I.D. principles in real Kotlin code for Android. Examples with UseCases, Repositories, and UI."
pubDate: 2025-10-08
heroImage: "/images/placeholder-article-solid.svg"
tags: ["Architecture", "SOLID", "Clean Code", "Kotlin", "Android"]
reference_id: "97184284-4820-4389-a292-07447230492e"
---
## 🏛️ Why SOLID matters in 2025?

With Jetpack Compose and Coroutines, do principles from the 2000s still matter? **Yes.**
Frameworks change, but coupling problems remain. SOLID is the antidote to spaghetti code.

## 1. Single Responsibility Principle (SRP)

> "A class should have one, and only one, reason to change."

**Bad:**
A `UserViewModel` that validates email format, calls the API, and saves to SharedPreferences.

**Good:**
*   `EmailValidator` (Validates).
*   `UserRepository` (Handles data).
*   `UserViewModel` (Manages UI state).

## 2. Open/Closed Principle (OCP)

> "Entities should be open for extension, but closed for modification."

**Example:**
If you have a `PaymentManager` with a `switch` for `Paypal` and `CreditCard`, adding `Bitcoin` requires modifying the class (violating OCP).

**Solution:**
Define a `PaymentMethod` interface. `PaymentManager` accepts any implementation. To add Bitcoin, create `BitcoinPayment` implementing the interface. You don't touch `PaymentManager`.

## 3. Liskov Substitution Principle (LSP)

> "Objects of a superclass shall be replaceable with objects of its subclasses without breaking the application."

**The Classic Error:**
Class `Square` inherits from `Rectangle`.
If you set `square.width = 5`, the height also changes. A generic code expecting a `Rectangle` (where width and height are independent) will fail.

**In Android:**
Don't inherit from `ArrayList` just to override one method if you break the contract of the List. Use Composition/Delegation.

## 4. Interface Segregation Principle (ISP)

> "Many client-specific interfaces are better than one general-purpose interface."

**Bad:**
One giant `View` interface with `showLoading()`, `showError()`, `showUser()`, `playAnimation()`.
A simple fragment might only need `showLoading`.

**Good:**
Split into `LoadableView`, `ErrorView`, `UserView`.

## 5. Dependency Inversion Principle (DIP)

> "Depend on abstractions, not on concretions."

This is the core of Clean Architecture.
The `UseCase` should not import `RetrofitUserApi` (Concretion).
It should import `UserRepository` (Abstraction/Interface).

This allows swapping Retrofit for GraphQL or Firebase without touching the UseCase.

## 🎯 Conclusion

SOLID requires more files and more thought upfront. But it prevents the code from rotting. It is the difference between a project that gets harder to maintain over time and one that remains agile.
