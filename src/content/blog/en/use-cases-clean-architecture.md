---
title: "Use Cases in Clean Architecture: More than wrappers?"
description: "Are your Use Cases just calling the repository? Learn the true value of the Domain layer and how to avoid 'Pass-Through' anti-patterns."
pubDate: 2025-10-14
heroImage: "/images/placeholder-article-usecases.svg"
tags: ["Architecture", "Clean Code", "Use Cases", "Android", "Domain"]
reference_id: "770fa324-4f0e-4395-829d-47677943d038"
---
## ❓ The Controversy

Many developers ask: "Why do I need a Use Case if it just does `repository.getData()`?".
It's a valid question. In simple CRUD apps, Use Cases can feel like boilerplate.

## 🛡️ The Defense: Why you need them

### 1. Reusability
If you put logic in `LoginViewModel`, you can't reuse it in `RegisterViewModel`.
A `ValidateEmailUseCase` can be injected anywhere.

### 2. Composition
A Use Case can combine multiple repositories.
`GetDashboardDataUseCase` might call `UserRepo`, `SalesRepo`, and `NotificationsRepo` and return a combined model. The ViewModel doesn't need to know this complexity.

### 3. Independence
Use Cases are pure Kotlin/Java. They don't know about `ViewModel`, `LiveData`, or `Context`. This makes them:
-   Incredibly fast to test.
-   Portable (share code between Android and Backend/Desktop).

### 4. Semantic Screaming Architecture
When you open your `domain/usecase` folder, the file names should scream what the app does:
-   `TransferMoneyUseCase`
-   `ApplyDiscountUseCase`
-   `LogoutUseCase`

This is "Screaming Architecture". You understand the features without reading code.

## 🛠️ Implementation Tips

### The `invoke` Operator
Make Use Cases feel like functions.

```kotlin
class GetUserUseCase @Inject constructor(repo: UserRepository) {
    suspend operator fun invoke(id: String): User = repo.getUser(id)
}

// Usage
val user = getUserUseCase("123") // Looks like a function call!
```

### Single Public Method
A Use Case should do **one thing**. Avoid `UserUseCase` with methods `get`, `save`, `delete`. Split them.

## 🎯 Conclusion

Yes, sometimes they are wrappers. But they are wrappers that protect your architecture. They are the boundary where "Application Logic" lives, separate from "Presentation Logic" (ViewModel) and "Data Logic" (Repository).
