---
title: "Clean Architecture: Use Cases in Android"
description: "Why Use Cases matter in Clean Architecture. How to implement them effectively in Kotlin to decouple business logic from UI."
pubDate: 2025-06-21
heroImage: "/images/placeholder-article-use-cases.svg"
tags: ["Architecture", "Clean Code", "Use Cases", "Android", "Domain"]
reference_id: "2eddc21e-4c8f-4f39-859d-e4c1fc1066bc"
---
## 🎯 The Role of the Use Case

In Clean Architecture, the **Use Case** (Interactor) encapsulates a single, specific business rule. It sits between the ViewModel (Presentation) and the Repository (Data).

### Why Do We Need It?
1.  **Reusability**: `GetUserProfile` can be called from `ProfileViewModel`, `SettingsViewModel`, and `OrderViewModel`.
2.  **Testability**: Testing pure business logic without mocking ViewModels or Repositories.
3.  **Encapsulation**: Hides complex data fetching logic (e.g., fetch from API, save to DB, transform data) from the UI.

## 🏗️ Implementation Structure

A Use Case should do one thing and do it well.

### 1. Functional Interface (Invoke Operator)
By overriding `operator fun invoke`, the Use Case can be called like a function.

```kotlin
class GetUserUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    operator fun invoke(userId: String): Flow<Result<User>> {
        return userRepository.getUser(userId)
            .map { ... } // Transform data for UI if needed
    }
}
```

### 2. ViewModel Usage
The ViewModel injects the Use Case, not the Repository.

```kotlin
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase
) : ViewModel() {

    fun loadProfile() {
        getUserUseCase("123").collect { ... }
    }
}
```

## ⚠️ Common Pitfalls

1.  **Anemic Use Cases**: A Use Case that just forwards the call to Repository.
    - *Is it bad?* Not necessarily. It maintains consistency. But if 90% are anemic, consider skipping Use Cases for simple CRUD.
2.  **God Use Cases**: `UserManagerUseCase` handling login, logout, profile, settings. Split it up!

## 🏁 Conclusion

Use Cases are the "verbs" of your application (`Login`, `GetProfile`, `BuyItem`). They define *what* your app does, independent of *how* it shows it or *where* it stores data.
