---
title: "Repository Pattern: The True Data Abstraction"
description: "Why the Repository is the most important pattern in Clean Architecture. Caching strategies, error handling, and data source orchestration."
pubDate: 2025-10-18
heroImage: "/images/placeholder-article-repository.svg"
tags: ["Architecture", "Design Patterns", "Android", "Data Layer"]
reference_id: "e1498656-14e2-4b0b-9914-752ae17e6062"
---
## 🏛️ Theory: The Guardian of Data

The **Repository Pattern** has a simple but vital purpose: **Decouple business logic from the origin of data.**

The Use Case (or ViewModel) asks: *"Give me the users"*.
The Use Case doesn't care if the users come from:
-   A REST API (Retrofit)
-   A local database (Room)
-   A JSON file in assets
-   An in-memory cache

This allows changing the data implementation without touching a single line of business logic.

## 🏗️ Anatomy of a Modern Repository

### 1. The Interface (Domain)
Defines **what** can be done, not **how**.

```kotlin
interface ProductRepository {
    // Returns Flow for real-time updates
    fun getProducts(): Flow<Result<List<Product>>>

    // Suspend functions for one-shot operations
    suspend fun refreshProducts(): Result<Unit>

    suspend fun getProductById(id: String): Result<Product>
}
```

### 2. The Implementation (Data Layer)
Here lives the dirty logic of coordination.

```kotlin
class ProductRepositoryImpl @Inject constructor(
    private val remote: ProductRemoteDataSource, // Retrofit
    private val local: ProductLocalDataSource,   // Room
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : ProductRepository { ... }
```

## 🔄 Synchronization Strategies

The real value of the repository is in how it coordinates Local and Remote.

### Strategy: Single Source of Truth (SSOT)
The local database is the ONLY truth.

1.  UI observes DB (Room Flow).
2.  When data is requested, Repo launches API call.
3.  If API responds, Repo saves to DB.
4.  Room automatically notifies UI with new data.

```kotlin
override fun getProducts(): Flow<Result<List<Product>>> {
    return local.getProducts() // Flow from Room
        .map { Result.Success(it) }
        .onStart {
            // Trigger side-effect refresh
            try {
                val remoteData = remote.fetch()
                local.save(remoteData)
            } catch (e: Exception) {
                emit(Result.Error(e))
            }
        }
}
```

This strategy is robust because the app works **Offline-First** by default.

### Strategy: Cache-Aside (Read with Fallback)
Useful for data that changes rarely or isn't stored in DB.

1.  Check memory/disk.
2.  If missing or expired -> Call network.
3.  Return and save.

## ⚠️ Common Mistakes

1.  **Exposing DTOs**: The Repo must return Domain Models, not `NetworkResponse<UserDto>`. Always map inside the Repo.
2.  **Business Logic**: The Repo shouldn't decide "if user is VIP, give discount". That belongs in the Use Case. The Repo only stores and retrieves.
3.  **Threading**: The Repo must be "Main-Safe". Use `withContext(Dispatchers.IO)` to ensure calling repo from UI never blocks.

## 🎯 Conclusion

A good Repository is invisible. The domain layer trusts it blindly. By centralizing data access, you gain the ability to optimize (add in-memory cache, switch from SQL to NoSQL) without breaking the rest of the app. It is the key piece for long-term maintainability.
