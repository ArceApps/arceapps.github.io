---
title: "Repository Pattern: The Real Data Abstraction"
description: "Why Repository is the most important pattern in Clean Architecture. Caching strategies, error handling and data source orchestration."
pubDate: 2025-10-18
lastmod: 2026-07-18
author: ArceApps
keywords:
  - "Repository Pattern"
  - "Abstraction"
  - "Data"
  - "Android"
  - "Pattern"
canonical: "https://arceapps.com/blog/repository-pattern/"
heroImage: "/images/placeholder-article-repository.svg"
tags: ["Architecture", "Design Patterns", "Android", "Data Layer"]
category: architecture
reference_id: "e1498656-14e2-4b0b-9914-752ae17e6062"
---


## 🏛️ Theory: The Data Guardian

The **Repository Pattern** has a simple but vital purpose: **Decouple business logic from data provenance.**

The Use Case (or ViewModel) asks: *"Give me the users"*.
The Use Case doesn't care if the users come from:
- A REST API (Retrofit)
- A local database (Room)
- A JSON file in assets
- An in-memory cache

This lets you change the data implementation without touching a single line of business logic.

This article is the complete expansion of the original from October 2025. I've rewritten it after a year of seeing it work (and fail) in production. If you want to see the counterpart of Repositories in the domain layer, read [Use Cases in Android](/blog/use-cases) — they're the two sides of the same coin.

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

Kotlin's `Result<T>` convention for errors is preferable to throwing exceptions on operations that can fail for known reasons (network down, DB corrupt). Exceptions are reserved for "this should never happen".

### 2. The Implementation (Data Layer)

This is where the dirty coordination logic lives.

```kotlin
class ProductRepositoryImpl @Inject constructor(
    private val remote: ProductRemoteDataSource, // Retrofit
    private val local: ProductLocalDataSource,   // Room
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : ProductRepository { ... }
```

The injectable dispatcher is key for testing. In tests, you can inject `UnconfinedTestDispatcher` and verify the order of operations without waiting on real threads.

## 🔄 Synchronization Strategies

The real value of the repository is in how it coordinates Local and Remote.

### Strategy 1: Single Source of Truth (SSOT)

The local database is the ONLY truth.

1. UI observes the DB (Room Flow).
2. When data is requested, the Repo launches an API call.
3. If the API responds, the Repo saves to DB.
4. Room automatically notifies UI with new data.

```kotlin
override fun getProducts(): Flow<Result<List<Product>>> {
    return local.getProducts() // Flow from Room
        .map { Result.Success(it) }
        .onStart {
            // Lateral refresh trigger
            try {
                val remoteData = remote.fetch()
                local.save(remoteData)
            } catch (e: Exception) {
                emit(Result.Error(e))
            }
        }
}
```

This strategy is robust because the app works **Offline-First** by default. UI always has data (whatever's in DB), even without connection.

### Strategy 2: Cache-Aside (Read with Fallback)

Useful for data that changes little or isn't saved in DB.

1. Look in memory/disk.
2. If it doesn't exist or expired -> Call network.
3. Return and save.

```kotlin
class CachedProductRepository @Inject constructor(
    private val remote: ProductRemoteDataSource,
    private val cache: InMemoryCache<List<Product>>,
    private val clock: Clock = Clock.System
) : ProductRepository {

    override suspend fun getProducts(): Result<List<Product>> {
        val cached = cache.get(KEY_PRODUCTS)
        if (cached != null && !cached.isExpired()) {
            return Result.Success(cached.data)
        }

        return try {
            val fresh = remote.fetch()
            cache.put(KEY_PRODUCTS, CachedData(fresh, expiresAt = clock.now() + 5.minutes))
            Result.Success(fresh)
        } catch (e: Exception) {
            // Fallback: if network fails but we have cache (even expired),
            // return what we have
            if (cached != null) Result.Success(cached.data)
            else Result.Error(e)
        }
    }

    companion object {
        private const val KEY_PRODUCTS = "products"
    }
}
```

The trick here is the **fallback to expired cache** when network fails. Better to show old data than a blank screen.

### Strategy 3: Network Bound Resource (Google Architecture Components)

Google's official pattern for "data that comes from network but persists in DB". It's SSOT with three explicit states: `Loading`, `Success`, `Error`.

```kotlin
fun getProducts(): Flow<Resource<List<Product>>> = flow {
    emit(Resource.Loading)

    val cached = local.getProductsOnce()
    if (cached.isNotEmpty()) {
        emit(Resource.Success(cached))
    }

    try {
        val fresh = remote.fetch()
        local.save(fresh)
        emit(Resource.Success(fresh))
    } catch (e: Exception) {
        if (cached.isEmpty()) emit(Resource.Error(e))
    }
}
```

This pattern is ideal for paginated lists where the user expects to see something immediately and then update.

## ⚠️ Common Mistakes (The Ones I've Made)

**1. Exposing DTOs**: The Repo must return Domain Models, not `NetworkResponse<UserDto>`. Always map inside the Repo. This prevents a backend change from breaking your entire app.

**2. Business Logic**: The Repo shouldn't decide "if the user is VIP, give them a discount". That's Use Case's job. The Repo only stores and retrieves. The Use Case ↔ Repo separation is sacred.

**3. Threading**: The Repo must be "Main-Safe". Use `withContext(Dispatchers.IO)` to ensure calling the repo from the UI never blocks. If your repo is suspend and does I/O, the caller should be able to call it from Main without freezing the UI.

**4. Race conditions in cache**: If two coroutines request the same resource simultaneously and cache is empty, both make the network call. The solution is `Mutex` or thread-safe `lazy`:

```kotlin
class MutexProtectedRepository @Inject constructor(
    private val remote: ProductRemoteDataSource,
    private val local: ProductLocalDataSource
) : ProductRepository {
    private val mutex = Mutex()

    override suspend fun getProducts(): Result<List<Product>> = mutex.withLock {
        val cached = local.getProductsOnce()
        if (cached.isNotEmpty()) return@withLock Result.Success(cached)

        val fresh = remote.fetch()
        local.save(fresh)
        Result.Success(fresh)
    }
}
```

## 🚫 The Repository Facade: Legacy Code Without Full Rewrite

Sometimes you have to work with legacy code where half the data logic is in Activities, fragments, and Managers. Rewriting everything is infeasible. The **Repository Facade** pattern lets you create a clean API without touching what's underneath:

```kotlin
class LegacyUserRepositoryFacade @Inject constructor(
    private val legacyUserManager: LegacyUserManager, // existing legacy class
    private val mapper: UserDtoMapper
) : UserRepository {

    override fun observeUsers(): Flow<List<User>> = callbackFlow {
        val listener = LegacyUserListener { legacyUsers ->
            trySend(legacyUsers.map(mapper::toDomain))
        }
        legacyUserManager.registerListener(listener)
        awaitClose { legacyUserManager.unregisterListener(listener) }
    }

    override suspend fun getUser(id: String): User? {
        return legacyUserManager.findById(id)?.let(mapper::toDomain)
    }
}
```

The Facade implements the modern interface (`UserRepository`) but delegates to the old code internally. Once all new code only uses the interface, you can migrate the legacy behind the scenes without breaking anything.

## ⚡ Performance: N+1 Queries and the Loop Anti-pattern

An error I've seen in real repos: making N queries in a loop when a single batch query would solve it.

```kotlin
// ❌ N+1 queries: for each product, separate query for its category
override suspend fun getProductsWithCategories(): List<ProductWithCategory> {
    return remote.fetchProducts().map { product ->
        val category = remote.fetchCategory(product.categoryId) // N queries
        ProductWithCategory(product, category)
    }
}

// ✅ Single query with JOIN or batched endpoint
override suspend fun getProductsWithCategories(): List<ProductWithCategory> {
    return remote.fetchProductsWithCategories() // 1 query
}
```

On a list of 50 products, the difference is 50 requests vs 1. On a 3G network, that's 30 seconds vs 0.6 seconds. It matters.

## 🧪 Testing: The Testcontainers Pattern for Real Repos

Mocking the repo and testing ViewModel logic is fine. But the most expensive bugs are **integration** bugs between Room, Retrofit, and the repo logic. For those you need integration tests:

```kotlin
@RunWith(AndroidJUnit4::class)
class ProductRepositoryIntegrationTest {

    @get:Rule
    val hiltRule = HiltAndroidRule(this)

    @Inject lateinit var db: TestAppDatabase
    @Inject lateinit var mockServer: MockWebServer
    @Inject lateinit var repository: ProductRepository

    @Before
    fun setup() {
        hiltRule.inject()
        mockServer.start()
    }

    @Test
    fun `offline-first returns cached data when network fails`() = runTest {
        // Arrange: precache data in Room
        db.productDao().insert(testProducts)

        // Act: simulate network failure
        mockServer.enqueue(MockResponse().setSocketPolicy(SocketPolicy.DISCONNECT_AT_START))

        // Assert: repo returns cached data, not error
        val result = repository.getProducts().first()
        assertTrue(result is Result.Success)
        assertEquals(testProducts, (result as Result.Success).data)
    }
}
```

`MockWebServer` simulates the real server; Room Test gives you an in-memory DB. Together they verify your SSOT logic actually works, not just in your head.

## When NOT to Use Repository (The Heresy)

After years preaching Repository, there are cases where I DON'T use it:

1. **Trivial CRUD on a single table**: if your code is `dao.insert(user)`, wrapping it in a Repository adds boilerplate without value.
2. **Read-only static data**: configuration, feature flags. Direct access to `DataStore` from the ViewModel.
3. **Throwaway prototypes**: if the app will live 2 weeks, Repository is overhead.

**Rule of three**: if you'll only read the same data from one place, you don't need a Repository. If you read it from 3 different places, you already need it.

## 🎯 Conclusion

A good Repository is invisible. The domain layer trusts it blindly. By centralizing data access, you gain the ability to optimize (add in-memory cache, switch from SQL to NoSQL) without breaking the rest of the app. It's the key piece of long-term maintainability.

If I had to leave you with one piece of advice: **invest in the Repository BEFORE you need it**. Migrating an app from "ViewModel touches Retrofit directly" to "ViewModel touches Repository" is expensive. Starting with Repository from day 1 is free.

## Bibliography and References

- [Use Cases in Android: Clean and Reusable Business Logic](/blog/use-cases) — The natural complement in the domain layer.
- [StateFlow vs SharedFlow: The Definitive Guide for Android](/blog/stateflow-sharedflow) — For emitting reactive data from the Repository.
- [Room Database: Robust Persistence in Android](/blog/room-database) — If your "local" is Room, this guide covers the details.
- [Google's Guide to App Architecture — Data layer](https://developer.android.com/topic/architecture/data-layer) — The official guide with diagrams updated for 2026.
- [Now in Android — Data layer](https://github.com/android/nowinandroid) — Google's reference implementation.
- *Patterns of Enterprise Application Architecture* — Martin Fowler. The original Repository (2002). Dense but the definitive reference.
