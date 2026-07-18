---
title: "Repository Pattern: La Verdadera Abstracción de Datos"
description: "Por qué el Repository es el patrón más importante en Clean Architecture. Estrategias de caché, manejo de errores y orquestación de fuentes de datos."
pubDate: 2025-10-18
lastmod: 2026-07-18
author: ArceApps
keywords:
  - "Repository Pattern"
  - "Abstracción"
  - "Datos"
  - "Android"
  - "Patrón"
canonical: "https://arceapps.com/es/blog/repository-pattern/"
heroImage: "/images/placeholder-article-repository.svg"
tags: ["Architecture", "Design Patterns", "Android", "Data Layer"]
category: architecture
reference_id: "e1498656-14e2-4b0b-9914-752ae17e6062"
---


## 🏛️ Teoría: El Guardián de los Datos

El **Repository Pattern** tiene un propósito simple pero vital: **Desacoplar la lógica de negocio de la procedencia de los datos.**

El Use Case (o ViewModel) pregunta: *"Dame los usuarios"*.
Al Use Case no le importa si los usuarios vienen de:
- Una API REST (Retrofit)
- Una base de datos local (Room)
- Un archivo JSON en assets
- Una caché en memoria

Esto permite cambiar la implementación de datos sin tocar ni una línea de la lógica de negocio.

Este artículo es la expansión completa del original de octubre 2025. Lo he reescrito tras un año viéndolo funcionar (y fallar) en producción. Si quieres ver la contraparte de los Repositories en la capa de dominio, lee [Use Cases en Android](/es/blog/use-cases) — son las dos caras de la misma moneda.

## 🏗️ Anatomía de un Repositorio Moderno

### 1. La Interfaz (Dominio)

Define **qué** se puede hacer, no **cómo**.

```kotlin
interface ProductRepository {
    // Retorna Flow para actualizaciones en tiempo real
    fun getProducts(): Flow<Result<List<Product>>>

    // Funciones suspendidas para operaciones one-shot
    suspend fun refreshProducts(): Result<Unit>

    suspend fun getProductById(id: String): Result<Product>
}
```

La convención `Result<T>` de Kotlin para errores es preferible a tirar excepciones en operaciones que pueden fallar por causas conocidas (red caída, DB corrupta). Las excepciones se reservan para "esto no debería pasar nunca".

### 2. La Implementación (Capa de Datos)

Aquí vive la lógica sucia de coordinación.

```kotlin
class ProductRepositoryImpl @Inject constructor(
    private val remote: ProductRemoteDataSource, // Retrofit
    private val local: ProductLocalDataSource,   // Room
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : ProductRepository { ... }
```

El dispatcher inyectable es clave para testear. En tests, puedes inyectar `UnconfinedTestDispatcher` y verificar el orden de operaciones sin esperar a hilos reales.

## 🔄 Estrategias de Sincronización

El valor real del repositorio está en cómo coordina Local y Remote.

### Estrategia 1: Single Source of Truth (SSOT)

La base de datos local es la ÚNICA verdad.

1. La UI observa la DB (Room Flow).
2. Cuando se piden datos, el Repo lanza una llamada a la API.
3. Si la API responde, el Repo guarda en la DB.
4. Room notifica automáticamente a la UI con los nuevos datos.

```kotlin
override fun getProducts(): Flow<Result<List<Product>>> {
    return local.getProducts() // Flow desde Room
        .map { Result.Success(it) }
        .onStart {
            // Trigger refresh lateral
            try {
                val remoteData = remote.fetch()
                local.save(remoteData)
            } catch (e: Exception) {
                emit(Result.Error(e))
            }
        }
}
```

Esta estrategia es robusta porque la app funciona **Offline-First** por defecto. La UI siempre tiene datos (los que estén en DB), incluso sin conexión.

### Estrategia 2: Cache-Aside (Lectura con Fallback)

Útil para datos que cambian poco o no se guardan en DB.

1. Busca en memoria/disco.
2. Si no existe o expiró -> Llama a red.
3. Retorna y guarda.

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
            // Fallback: si la red falla pero tenemos cache (incluso expirado),
            // devolvemos lo que tengamos
            if (cached != null) Result.Success(cached.data)
            else Result.Error(e)
        }
    }

    companion object {
        private const val KEY_PRODUCTS = "products"
    }
}
```

El truco aquí es el **fallback a cache expirado** cuando la red falla. Mejor mostrar datos viejos que pantalla en blanco.

### Estrategia 3: Network Bound Resource (Google Architecture Components)

El patrón oficial de Google para "datos que vienen de red pero persisten en DB". Es SSOT con tres estados explícitos: `Loading`, `Success`, `Error`.

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

Este patrón es ideal para listas paginadas donde el usuario espera ver algo inmediatamente y luego actualizarse.

## ⚠️ Errores Comunes (los que yo he cometido)

**1. Exponer DTOs**: El Repo debe devolver Modelos de Dominio, no `NetworkResponse<UserDto>`. Mapea siempre dentro del Repo. Esto evita que un cambio en el backend rompa toda tu app.

**2. Lógica de Negocio**: El Repo no debe decidir "si el usuario es VIP, dale descuento". Eso es del Use Case. El Repo solo almacena y recupera. La separación Use Case ↔ Repo es sagrada.

**3. Manejo de Hilos**: El Repo debe ser "Main-Safe". Usa `withContext(Dispatchers.IO)` para asegurarte de que llamar al repo desde la UI nunca bloquee. Si tu repo es suspend y hace I/O, el caller debería poder llamarlo desde Main sin que se congele la UI.

**4. Race conditions en cache**: Si dos coroutines piden el mismo recurso simultáneamente y la cache está vacía, ambas hacen la llamada de red. La solución es `Mutex` o `lazy` thread-safe:

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

## 🚫 El Repository Facade: legacy code sin reescritura total

A veces te toca trabajar con código legacy donde la mitad de la lógica de datos está en Activities, fragments, y Managers. Reescribir todo es inviable. El patrón **Repository Facade** te permite crear una API limpia sin tocar lo de debajo:

```kotlin
class LegacyUserRepositoryFacade @Inject constructor(
    private val legacyUserManager: LegacyUserManager, // clase legacy existente
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

El Facade implementa la interfaz moderna (`UserRepository`) pero delega al código viejo internamente. Una vez que todo el código nuevo usa solo la interfaz, puedes ir migrando el legacy por detrás sin romper nada.

## ⚡ Performance: N+1 queries y el anti-patrón del loop

Un error que he visto en repos reales: hacer N queries en un loop cuando una sola query batch resolvería.

```kotlin
// ❌ N+1 queries: para cada producto, query aparte para su categoría
override suspend fun getProductsWithCategories(): List<ProductWithCategory> {
    return remote.fetchProducts().map { product ->
        val category = remote.fetchCategory(product.categoryId) // N queries
        ProductWithCategory(product, category)
    }
}

// ✅ Una sola query con JOIN o endpoint batched
override suspend fun getProductsWithCategories(): List<ProductWithCategory> {
    return remote.fetchProductsWithCategories() // 1 query
}
```

En una lista de 50 productos, la diferencia es 50 requests vs 1. En una red 3G, la diferencia es 30 segundos vs 0.6 segundos. Esto importa.

## 🧪 Testing: el patrón Testcontainers para repos reales

Mockear el repo y testear la lógica del ViewModel está bien. Pero los bugs más caros son los bugs de **integración** entre Room, Retrofit y la lógica del repo. Para esos necesitas tests de integración:

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
        // Arrange: precache datos en Room
        db.productDao().insert(testProducts)

        // Act: simular fallo de red
        mockServer.enqueue(MockResponse().setSocketPolicy(SocketPolicy.DISCONNECT_AT_START))

        // Assert: el repo devuelve datos cacheados, no error
        val result = repository.getProducts().first()
        assertTrue(result is Result.Success)
        assertEquals(testProducts, (result as Result.Success).data)
    }
}
```

`MockWebServer` simula el servidor real; Room Test te da una DB en memoria. Juntos verifican que tu lógica de SSOT funciona de verdad, no solo en tu cabeza.

## Cuándo NO usar Repository (la herejía)

Después de años predicando Repository, hay casos donde NO lo uso:

1. **CRUD trivial sobre una sola tabla**: si tu código es `dao.insert(user)`, envolverlo en un Repository añade boilerplate sin valor.
2. **Read-only static data**: configuración, feature flags. Acceso directo a `DataStore` desde el ViewModel.
3. **Prototipos descartables**: si la app va a vivir 2 semanas, el Repository es overhead.

**Regla de tres**: si solo vas a leer la misma data desde un sitio, no necesitas Repository. Si la lees desde 3 sitios distintos, ya lo necesitas.

## 🎯 Conclusión

Un buen Repository es invisible. La capa de dominio confía ciegamente en él. Al centralizar el acceso a datos, ganas la capacidad de optimizar (añadir caché en memoria, cambiar de SQL a NoSQL) sin romper el resto de la app. Es la pieza clave de la mantenibilidad a largo plazo.

Si tuviera que dejarte con un único consejo: **invierte en el Repository ANTES de que lo necesites**. Migrar una app de "ViewModel toca Retrofit directo" a "ViewModel toca Repository" es caro. Empezar con Repository desde el día 1 es gratis.

## Bibliografía y Referencias

- [Use Cases en Android: Lógica de Negocio Limpia y Reutilizable](/es/blog/use-cases) — El complemento natural en la capa de dominio.
- [StateFlow vs SharedFlow: Guía Definitiva para Android](/es/blog/stateflow-sharedflow) — Para emitir datos reactivos desde el Repository.
- [Room Database: Persistencia Robusta en Android](/es/blog/room-database) — Si tu "local" es Room, esta guía cubre los detalles.
- [Google's Guide to App Architecture — Data layer](https://developer.android.com/topic/architecture/data-layer) — La guía oficial con diagramas actualizados a 2026.
- [Now in Android — Data layer](https://github.com/android/nowinandroid) — Implementación de referencia de Google.
- *Patterns of Enterprise Application Architecture* — Martin Fowler. El Repository original (2002). Denso pero la referencia definitiva.
