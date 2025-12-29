---
title: "Capa Model en MVVM Android: Fundamentos de una Arquitectura Sólida"
description: "Descubre cómo construir la capa Model perfecta para PuzzleQuest, integrando modelos de dominio, repositorios y use cases en una arquitectura limpia y escalable."
pubDate: "2025-07-15"
heroImage: "/images/placeholder-article-model-layer.svg"
tags: ["Android", "MVVM", "Clean Architecture", "Model Layer", "Kotlin", "Domain Driven Design"]
---

## 🏗️ ¿Qué es la Capa Model en MVVM?

La capa Model es el **corazón de tu aplicación**. En PuzzleQuest, esta capa no solo representa los datos (puzzles, piezas, puntuaciones), sino que también encapsula toda la lógica de negocio, las reglas del juego y la gestión del estado de la aplicación. Es la capa más importante porque define *qué hace tu app*, independientemente de cómo se muestra al usuario.

### 📚 Orígenes e Historia de la Capa Model

El concepto de separar el modelo del dominio de la presentación tiene raíces profundas en la ingeniería de software:

**Smalltalk MVC (1979)**: Trygve Reenskaug introdujo MVC en Xerox PARC, donde el **Model** representaba el conocimiento del dominio y las reglas de negocio, completamente independiente de la UI.

**Domain-Driven Design (2003)**: Eric Evans formalizó el concepto del **Domain Model** como el corazón de las aplicaciones empresariales, enfatizando la importancia de modelar el negocio fielmente en código.

**Clean Architecture (2012)**: Robert C. Martin (Uncle Bob) popularizó la arquitectura en capas donde el **Domain Layer** (equivalente al Model) es el núcleo independiente, sin dependencias de frameworks o UI.

En Android, la evolución ha sido:
- **2008-2015**: Activities/Fragments contenían todo (UI + lógica + datos)
- **2015-2017**: MVP separó presentación, pero el modelo seguía mezclado
- **2017-presente**: MVVM + Clean Architecture estableció una capa Model verdaderamente independiente

### 🎯 Responsabilidades de la Capa Model
- **Modelos de Dominio**: Define las entidades core del negocio.
- **Repositorios**: Abstrae el acceso a fuentes de datos.
- **Use Cases**: Encapsula lógica de negocio específica.
- **Servicios**: Proporciona funcionalidades transversales.

### 🔍 El Model en MVVM vs Otros Patrones

#### Model en MVC (Model-View-Controller)
En MVC tradicional, el Model es responsable de:
- Datos + Lógica de negocio + Acceso a datos (todo mezclado)
- Notificar cambios directamente a las Views
- Acoplamiento directo con la persistencia

```kotlin
// ❌ MVC: Model acoplado a persistencia y notificación
class UserModel {
    private val database = SQLiteDatabase.openDatabase(...)
    private val observers = mutableListOf<UserObserver>()
    
    fun updateUser(user: User) {
        database.update(user) // Acoplamiento directo
        observers.forEach { it.onUserUpdated(user) } // Notificación directa
    }
}
```

#### Model en MVVM (Model-View-ViewModel)
En MVVM moderno, el Model se divide en capas claramente separadas:

```kotlin
// ✅ MVVM: Model dividido en capas desacopladas

// 1. Domain Layer: Lógica de negocio pura
data class User(
    val id: UserId,
    val email: Email,
    val profile: UserProfile
) {
    fun canEditProfile(): Boolean {
        return profile.isVerified && !profile.isLocked
    }
}

// 2. Repository Interface: Contrato de datos
interface UserRepository {
    fun getUser(id: UserId): Flow<User>
    suspend fun updateUser(user: User): Result<User>
}

// 3. Use Case: Orquestación de lógica
class UpdateUserProfileUseCase @Inject constructor(
    private val userRepository: UserRepository,
    private val validator: UserValidator
) {
    suspend operator fun invoke(user: User): Result<User> {
        return try {
            validator.validate(user)
            userRepository.updateUser(user)
        } catch (e: ValidationException) {
            Result.Error(e)
        }
    }
}
```

### 🧠 Principios Teóricos del Domain Model

#### 1. Domain-Driven Design (DDD)

Eric Evans definió varios conceptos fundamentales que aplicamos en la capa Model:

**Entities**: Objetos con identidad única que persiste en el tiempo
```kotlin
// ✅ Entity: Tiene identidad única (id)
data class Product(
    val id: ProductId, // Identidad
    val name: String,
    val price: Money,
    val category: Category
) {
    // ✅ Métodos de dominio
    fun applyDiscount(percentage: Int): Product {
        return copy(price = price.applyDiscount(percentage))
    }
}
```

**Value Objects**: Objetos inmutables sin identidad, definidos por sus valores
```kotlin
// ✅ Value Object: Sin identidad, inmutable
data class Money(
    val amount: BigDecimal,
    val currency: Currency
) {
    fun add(other: Money): Money {
        require(currency == other.currency) { "Currencies must match" }
        return Money(amount + other.amount, currency)
    }
    
    fun applyDiscount(percentage: Int): Money {
        val discount = amount * BigDecimal(percentage) / BigDecimal(100)
        return Money(amount - discount, currency)
    }
}

data class Email(val value: String) {
    init {
        require(value.contains("@")) { "Invalid email format" }
    }
}
```

**Aggregates**: Cluster de objetos relacionados tratados como una unidad
```kotlin
// ✅ Aggregate Root: Order coordina OrderItems
data class Order(
    val id: OrderId,
    val customerId: CustomerId,
    val items: List<OrderItem>,
    val status: OrderStatus,
    val totalAmount: Money
) {
    // ✅ Aggregate asegura invariantes
    fun addItem(item: OrderItem): Order {
        require(status == OrderStatus.DRAFT) { "Cannot modify confirmed order" }
        
        val updatedItems = items + item
        val newTotal = updatedItems.fold(Money.zero()) { acc, item -> 
            acc.add(item.subtotal) 
        }
        
        return copy(items = updatedItems, totalAmount = newTotal)
    }
    
    fun confirm(): Order {
        require(items.isNotEmpty()) { "Cannot confirm empty order" }
        return copy(status = OrderStatus.CONFIRMED)
    }
}

data class OrderItem(
    val productId: ProductId,
    val quantity: Int,
    val unitPrice: Money
) {
    val subtotal: Money = Money(
        unitPrice.amount * BigDecimal(quantity),
        unitPrice.currency
    )
}
```

**Domain Services**: Lógica que no pertenece naturalmente a una entidad
```kotlin
// ✅ Domain Service: Lógica que involucra múltiples entidades
interface PricingService {
    fun calculateOrderTotal(
        order: Order,
        customer: Customer,
        promotions: List<Promotion>
    ): Money
}

class PricingServiceImpl : PricingService {
    override fun calculateOrderTotal(
        order: Order,
        customer: Customer,
        promotions: List<Promotion>
    ): Money {
        var total = order.totalAmount
        
        // Aplicar descuento por membresía
        if (customer.isPremium) {
            total = total.applyDiscount(10)
        }
        
        // Aplicar promociones aplicables
        promotions.forEach { promo ->
            if (promo.appliesTo(order)) {
                total = total.applyDiscount(promo.discountPercentage)
            }
        }
        
        return total
    }
}
```

#### 2. Ubiquitous Language (Lenguaje Ubicuo)

Un principio clave de DDD es que el código debe reflejar el lenguaje del negocio:

```kotlin
// ❌ MAL: Lenguaje técnico que no refleja el dominio
data class Data1(
    val field1: String,
    val field2: Int,
    val flag: Boolean
) {
    fun process() { /* ... */ }
}

// ✅ BIEN: Lenguaje del dominio
data class Subscription(
    val customerId: CustomerId,
    val tier: SubscriptionTier,
    val isActive: Boolean
) {
    fun renew() { /* ... */ }
    fun cancel() { /* ... */ }
    fun upgrade(newTier: SubscriptionTier) { /* ... */ }
}
```

El código debe ser legible por expertos del dominio (product managers, analistas de negocio) sin necesidad de ser programadores.

#### 3. Rich Domain Model vs Anemic Domain Model

**Anemic Domain Model** (❌ Anti-patrón): Clases de dominio que solo contienen datos, sin comportamiento:

```kotlin
// ❌ ANÉMICO: Solo datos, sin lógica
data class Order(
    val id: String,
    val items: List<OrderItem>,
    val status: String,
    var total: Double
)

// Lógica en un "Service" externo
class OrderService {
    fun addItem(order: Order, item: OrderItem) {
        order.items.add(item) // Manipulación externa
        order.total += item.price * item.quantity
    }
    
    fun calculateTotal(order: Order): Double {
        return order.items.sumOf { it.price * it.quantity }
    }
}
```

**Rich Domain Model** (✅ Patrón correcto): Clases de dominio que encapsulan comportamiento y garantizan invariantes:

```kotlin
// ✅ RICO: Comportamiento encapsulado
data class Order private constructor(
    val id: OrderId,
    private val _items: List<OrderItem>,
    val status: OrderStatus
) {
    val items: List<OrderItem> = _items // Exposición inmutable
    
    val total: Money
        get() = _items.fold(Money.zero()) { acc, item -> acc.add(item.subtotal) }
    
    // ✅ Comportamiento en el dominio
    fun addItem(item: OrderItem): Order {
        require(status == OrderStatus.DRAFT) { "Cannot modify confirmed order" }
        return copy(_items = _items + item)
    }
    
    fun removeItem(itemId: OrderItemId): Order {
        require(status == OrderStatus.DRAFT) { "Cannot modify confirmed order" }
        return copy(_items = _items.filterNot { it.id == itemId })
    }
    
    fun confirm(): Order {
        require(_items.isNotEmpty()) { "Cannot confirm empty order" }
        require(status == OrderStatus.DRAFT) { "Order already confirmed" }
        return copy(status = OrderStatus.CONFIRMED)
    }
    
    companion object {
        fun create(id: OrderId): Order {
            return Order(id, emptyList(), OrderStatus.DRAFT)
        }
    }
}
```

**Ventajas del Rich Domain Model**:
- Invariantes garantizadas por construcción
- Lógica centralizada y reutilizable
- Código más expresivo y mantenible
- Menos bugs por estados inconsistentes

## 🧩 Arquitectura de la Capa Model en PuzzleQuest

### 📊 Estructura de la Capa Model
1. **Domain Layer (Núcleo)**: Entities, Use Cases, Repository Interfaces.
2. **Data Layer (Implementación)**: Repository Impl, Data Sources, Mappers.
3. **Infrastructure Layer**: Room DB, Retrofit API, SharedPrefs.

## 🎲 Modelos de Dominio: Las Entidades de PuzzleQuest

### 1. Modelo Principal: Puzzle

```kotlin
data class Puzzle(
    val id: PuzzleId,
    val metadata: PuzzleMetadata,
    val gameConfiguration: GameConfiguration,
    val progress: PuzzleProgress,
    val statistics: PuzzleStatistics
) {
    fun canBeStarted(): Boolean {
        return metadata.isActive && 
               gameConfiguration.isValid() && 
               !progress.isCompleted
    }
}
```

### 2. Modelo de Piezas del Puzzle

```kotlin
data class PuzzlePiece(
    val id: PieceId,
    val puzzleId: PuzzleId,
    val position: Position,
    val currentPosition: Position,
    val visualData: PieceVisualData,
    val state: PieceState = PieceState.NORMAL
) {
    fun isInCorrectPosition(): Boolean = position == currentPosition
    
    fun canMoveTo(targetPosition: Position, gridSize: GridSize): Boolean {
        return targetPosition.isValid(gridSize) && 
               currentPosition.isAdjacentTo(targetPosition)
    }
}
```

### 3. Enums y Value Objects del Dominio

```kotlin
enum class GridSize(val rows: Int, val columns: Int) {
    SMALL_3X3(3, 3),
    MEDIUM_4X4(4, 4),
    LARGE_5X5(5, 5),
    EXPERT_6X6(6, 6);
    
    fun isSupported(): Boolean = this in supportedSizes
}

enum class DifficultyLevel(val value: Int, val displayName: String) {
    BEGINNER(1, "Principiante"),
    EASY(2, "Fácil"),
    MEDIUM(3, "Medio"),
    HARD(4, "Difícil"),
    EXPERT(5, "Experto");
}
```

## 🎯 Domain Services: Lógica de Negocio Compleja

Los Domain Services encapsulan lógica de negocio que no pertenece naturalmente a una entidad específica:

```kotlin
interface PuzzleGameEngine {
    fun validateMove(currentState: GameState, move: PuzzleMove): MoveValidationResult
    fun applyMove(currentState: GameState, move: PuzzleMove): GameState
    fun isPuzzleCompleted(gameState: GameState): Boolean
    fun calculateScore(gameState: GameState): GameScore
}
```

## 🏪 Repository Pattern en la Capa Model

Los repositories definen contratos que la capa de datos debe implementar:

```kotlin
interface PuzzleRepository {
    fun getAllPuzzles(): Flow<List<Puzzle>>
    suspend fun getPuzzleById(id: PuzzleId): Puzzle?
    suspend fun saveProgress(puzzleId: PuzzleId, progress: PuzzleProgress)
}
```

## 🏛️ Clean Architecture y la Capa Model

### The Dependency Rule (La Regla de Dependencia)

El principio fundamental de Clean Architecture es la **Dependency Rule**: las dependencias de código fuente solo pueden apuntar **hacia adentro**, hacia capas de mayor nivel de abstracción.

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Activities, Fragments, ViewModels)  │
│              ↓ depends on               │
├─────────────────────────────────────────┤
│         Domain Layer (Model)            │
│   (Entities, Use Cases, Repositories)   │
│              ↓ depends on               │
├─────────────────────────────────────────┤
│          Data Layer                     │
│ (Repository Impl, Data Sources, APIs)   │
└─────────────────────────────────────────┘
```

**Implicaciones prácticas**:
1. El Domain Layer NO conoce ViewModels, Activities, o UI
2. El Domain Layer NO conoce Room, Retrofit, o frameworks específicos
3. El Domain Layer define INTERFACES que las capas externas implementan

```kotlin
// ✅ Domain Layer: Define el contrato
interface UserRepository {
    suspend fun getUser(id: UserId): User?
    suspend fun saveUser(user: User)
}

// ✅ Data Layer: Implementa el contrato
class UserRepositoryImpl @Inject constructor(
    private val userDao: UserDao,
    private val userApi: UserApi
) : UserRepository {
    override suspend fun getUser(id: UserId): User? {
        // Primero intenta local
        val cachedUser = userDao.getUser(id.value)
        if (cachedUser != null) return cachedUser.toDomain()
        
        // Si no, va a red
        return try {
            val networkUser = userApi.getUser(id.value)
            userDao.insertUser(networkUser.toEntity())
            networkUser.toDomain()
        } catch (e: Exception) {
            null
        }
    }
    
    override suspend fun saveUser(user: User) {
        userDao.insertUser(user.toEntity())
        userApi.updateUser(user.toDto())
    }
}
```

### Dependency Inversion Principle (DIP)

El Domain Layer invierte las dependencias definiendo interfaces:

```kotlin
// ❌ MAL: Domain depende de implementación concreta
class GetUserUseCase(
    private val database: Room Database // ❌ Dependencia de framework
) {
    suspend fun execute(id: String): User {
        return database.userDao().getUser(id)
    }
}

// ✅ BIEN: Domain depende de abstracción
class GetUserUseCase @Inject constructor(
    private val repository: UserRepository // ✅ Abstracción
) {
    suspend operator fun invoke(id: UserId): Result<User> {
        return try {
            val user = repository.getUser(id)
            if (user != null) {
                Result.Success(user)
            } else {
                Result.Error(UserNotFoundException(id))
            }
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
```

## 🎲 Modelos de Dominio Avanzados: Diseño Táctico

### 1. Inline Value Classes para Type Safety

Kotlin permite crear tipos con cero overhead en runtime:

```kotlin
// ✅ Value class: Type safety sin costo de performance
@JvmInline
value class UserId(val value: String) {
    init {
        require(value.isNotBlank()) { "UserId cannot be blank" }
    }
}

@JvmInline
value class Email(val value: String) {
    init {
        require(value.matches(EMAIL_REGEX)) { "Invalid email format" }
    }
    
    companion object {
        private val EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$".toRegex()
    }
}

// ✅ Uso con type safety
fun sendWelcomeEmail(userId: UserId, email: Email) {
    // No puedes pasar email donde se espera userId
    // sendWelcomeEmail(email, userId) // ❌ Error de compilación
}
```

### 2. Sealed Classes para Modelar Estados

```kotlin
// ✅ Sealed class: Representa todos los estados posibles
sealed class PaymentStatus {
    object Pending : PaymentStatus()
    object Processing : PaymentStatus()
    data class Completed(val transactionId: TransactionId, val timestamp: Instant) : PaymentStatus()
    data class Failed(val reason: String, val isRetryable: Boolean) : PaymentStatus()
    object Cancelled : PaymentStatus()
}

data class Payment(
    val id: PaymentId,
    val amount: Money,
    val status: PaymentStatus
) {
    // ✅ Lógica de dominio con pattern matching exhaustivo
    fun canBeRetried(): Boolean = when (status) {
        is PaymentStatus.Pending -> false
        is PaymentStatus.Processing -> false
        is PaymentStatus.Completed -> false
        is PaymentStatus.Failed -> status.isRetryable
        is PaymentStatus.Cancelled -> false
    }
    
    fun retry(): Payment {
        require(canBeRetried()) { "Payment cannot be retried" }
        return copy(status = PaymentStatus.Pending)
    }
}
```

### 3. Validation y Result Types

```kotlin
// ✅ Result type para operaciones que pueden fallar
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Exception) : Result<Nothing>()
    
    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
    }
    
    inline fun <R> flatMap(transform: (T) -> Result<R>): Result<R> = when (this) {
        is Success -> transform(data)
        is Error -> this
    }
}

// ✅ Validation con acumulación de errores
sealed class ValidationResult<out T> {
    data class Valid<T>(val value: T) : ValidationResult<T>()
    data class Invalid(val errors: List<ValidationError>) : ValidationResult<Nothing>()
}

data class ValidationError(val field: String, val message: String)

// Validator para User
class UserValidator {
    fun validate(
        email: String,
        password: String,
        age: Int
    ): ValidationResult<ValidatedUserData> {
        val errors = mutableListOf<ValidationError>()
        
        if (!email.contains("@")) {
            errors.add(ValidationError("email", "Invalid email format"))
        }
        
        if (password.length < 8) {
            errors.add(ValidationError("password", "Password must be at least 8 characters"))
        }
        
        if (age < 18) {
            errors.add(ValidationError("age", "Must be 18 or older"))
        }
        
        return if (errors.isEmpty()) {
            ValidationResult.Valid(ValidatedUserData(email, password, age))
        } else {
            ValidationResult.Invalid(errors)
        }
    }
}
```

## 🏪 Repository Pattern: Teoría y Práctica

### Origen del Patrón Repository

Martin Fowler definió el patrón Repository en "Patterns of Enterprise Application Architecture" (2002):

> "Mediates between the domain and data mapping layers using a collection-like interface for accessing domain objects."

**Propósito**: Abstraer el acceso a datos para que el domain layer trabaje con objetos de dominio sin conocer detalles de persistencia.

### Repository vs DAO (Data Access Object)

```kotlin
// ❌ DAO: Expone detalles de persistencia
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    fun getUserById(id: String): UserEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertUser(user: UserEntity)
}

// ✅ Repository: Abstrae persistencia, trabaja con domain objects
interface UserRepository {
    suspend fun getUser(id: UserId): User?
    suspend fun saveUser(user: User)
    fun observeUser(id: UserId): Flow<User?>
}
```

**Diferencias clave**:
- **DAO**: Trabaja con entidades de persistencia, expone SQL/queries
- **Repository**: Trabaja con domain objects, oculta implementación

### Patrones de Caching en Repositories

```kotlin
class ProductRepositoryImpl @Inject constructor(
    private val productDao: ProductDao,
    private val productApi: ProductApi,
    private val ioDispatcher: CoroutineDispatcher
) : ProductRepository {
    
    // ✅ Patrón 1: Cache-Aside (Load-Through)
    override suspend fun getProduct(id: ProductId): Product? = withContext(ioDispatcher) {
        // Primero intenta cache
        val cached = productDao.getProduct(id.value)
        if (cached != null && !cached.isStale()) {
            return@withContext cached.toDomain()
        }
        
        // Si no hay cache o está obsoleto, va a red
        try {
            val network = productApi.getProduct(id.value)
            productDao.insertProduct(network.toEntity())
            network.toDomain()
        } catch (e: IOException) {
            // Si falla red pero hay cache, devolver cache obsoleto
            cached?.toDomain()
        }
    }
    
    // ✅ Patrón 2: Write-Through
    override suspend fun saveProduct(product: Product) = withContext(ioDispatcher) {
        // Escribe en cache y red al mismo tiempo
        val entity = product.toEntity()
        productDao.insertProduct(entity)
        
        try {
            productApi.updateProduct(product.toDto())
        } catch (e: IOException) {
            // Marcar para sync posterior
            productDao.markForSync(product.id.value)
            throw e
        }
    }
    
    // ✅ Patrón 3: Refresh-Ahead
    override fun observeProducts(): Flow<List<Product>> = flow {
        // Emitir cache inmediatamente
        emitAll(productDao.observeAllProducts().map { list ->
            list.map { it.toDomain() }
        })
    }.onStart {
        // Actualizar en background
        refreshProducts()
    }
    
    private suspend fun refreshProducts() = withContext(ioDispatcher) {
        try {
            val networkProducts = productApi.getAllProducts()
            productDao.replaceAll(networkProducts.map { it.toEntity() })
        } catch (e: IOException) {
            // Silenciosamente falla, el usuario sigue viendo cache
        }
    }
}
```

### Single Source of Truth (SSOT)

El principio SSOT establece que debe haber una única fuente de verdad para cada dato:

```kotlin
class UserRepositoryImpl @Inject constructor(
    private val userDao: UserDao,
    private val userApi: UserApi
) : UserRepository {
    
    // ✅ SSOT: La base de datos es la única fuente de verdad
    override fun observeUser(id: UserId): Flow<User?> {
        // 1. Observar base de datos (SSOT)
        return userDao.observeUser(id.value)
            .map { it?.toDomain() }
            .onStart {
                // 2. Actualizar desde red en background
                refreshUser(id)
            }
    }
    
    private suspend fun refreshUser(id: UserId) {
        try {
            val networkUser = userApi.getUser(id.value)
            // 3. Actualizar SSOT
            userDao.insertUser(networkUser.toEntity())
            // 4. Los observers se notifican automáticamente
        } catch (e: IOException) {
            // Falla silenciosamente, el observer sigue mostrando cache
        }
    }
}
```

## 🔄 Use Cases: Orquestación de Lógica de Negocio

### Teoría de Use Cases

Los Use Cases (también llamados Interactors) representan **las acciones que un usuario puede realizar** en tu aplicación. Provienen de:

- **Clean Architecture (Robert C. Martin)**: Use Cases como capa que coordina el flujo de datos
- **Use Case Driven Object Modeling (Ivar Jacobson)**: Use Cases como descripción de interacciones

**Principios**:
1. **Un Use Case = Una acción de usuario**
2. **Sin dependencias de UI o frameworks**
3. **Reutilizable en diferentes contexts**
4. **Testeable aisladamente**

```kotlin
// ✅ Use Case bien diseñado
class PurchaseProductUseCase @Inject constructor(
    private val productRepository: ProductRepository,
    private val paymentRepository: PaymentRepository,
    private val inventoryRepository: InventoryRepository,
    private val userRepository: UserRepository
) {
    // ✅ Orquesta múltiples repositories
    suspend operator fun invoke(
        userId: UserId,
        productId: ProductId,
        paymentMethod: PaymentMethod
    ): Result<Purchase> {
        return try {
            // 1. Verificar que el producto existe y está disponible
            val product = productRepository.getProduct(productId)
                ?: return Result.Error(ProductNotFoundException(productId))
            
            if (!inventoryRepository.isAvailable(productId)) {
                return Result.Error(ProductNotAvailableException(productId))
            }
            
            // 2. Verificar que el usuario puede comprar
            val user = userRepository.getUser(userId)
                ?: return Result.Error(UserNotFoundException(userId))
            
            if (!user.canPurchase(product.price)) {
                return Result.Error(InsufficientFundsException())
            }
            
            // 3. Procesar pago
            val payment = paymentRepository.processPayment(
                userId = userId,
                amount = product.price,
                method = paymentMethod
            )
            
            if (payment.status !is PaymentStatus.Completed) {
                return Result.Error(PaymentFailedException())
            }
            
            // 4. Reducir inventario
            inventoryRepository.decrementStock(productId)
            
            // 5. Crear registro de compra
            val purchase = Purchase.create(
                userId = userId,
                productId = productId,
                payment = payment
            )
            
            Result.Success(purchase)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
```

### Composición de Use Cases

Los Use Cases pueden invocar otros Use Cases para reutilizar lógica:

```kotlin
// ✅ Use Case base
class GetUserProfileUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(userId: UserId): Result<UserProfile> {
        return try {
            val user = userRepository.getUser(userId)
                ?: return Result.Error(UserNotFoundException(userId))
            Result.Success(user.profile)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}

// ✅ Use Case compuesto que reutiliza el base
class GetUserDashboardUseCase @Inject constructor(
    private val getUserProfile: GetUserProfileUseCase,
    private val orderRepository: OrderRepository,
    private val recommendationRepository: RecommendationRepository
) {
    suspend operator fun invoke(userId: UserId): Result<UserDashboard> {
        return try {
            // Reutilizar use case existente
            val profile = when (val result = getUserProfile(userId)) {
                is Result.Success -> result.data
                is Result.Error -> return result
            }
            
            // Obtener datos adicionales
            val recentOrders = orderRepository.getRecentOrders(userId)
            val recommendations = recommendationRepository.getRecommendations(userId)
            
            Result.Success(UserDashboard(
                profile = profile,
                recentOrders = recentOrders,
                recommendations = recommendations
            ))
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
```

## ⚠️ Anti-Patrones en la Capa Model

### 1. God Objects (Objetos Dios)

```kotlin
// ❌ MAL: Clase que hace demasiado
class UserManager {
    fun createUser(...)  { /* ... */ }
    fun deleteUser(...)  { /* ... */ }
    fun sendEmail(...) { /* ... */ }
    fun processPayment(...) { /* ... */ }
    fun generateReport(...) { /* ... */ }
    fun validateInput(...) { /* ... */ }
    // ... 50 métodos más
}

// ✅ BIEN: Separación de responsabilidades
class CreateUserUseCase(...)
class DeleteUserUseCase(...)
class SendEmailUseCase(...)
class ProcessPaymentUseCase(...)
class GenerateReportUseCase(...)
```

### 2. Transaction Script (Lógica en Services)

```kotlin
// ❌ MAL: Toda la lógica en un service, modelo anémico
data class Order(
    val id: String,
    val items: MutableList<OrderItem>,
    var total: Double,
    var status: String
)

class OrderService {
    fun addItem(order: Order, item: OrderItem) {
        order.items.add(item)
        order.total += item.price * item.quantity
    }
    
    fun removeItem(order: Order, itemId: String) {
        val item = order.items.find { it.id == itemId }
        if (item != null) {
            order.items.remove(item)
            order.total -= item.price * item.quantity
        }
    }
}

// ✅ BIEN: Lógica en el modelo (Rich Domain Model)
data class Order private constructor(
    val id: OrderId,
    private val _items: List<OrderItem>,
    val status: OrderStatus
) {
    val items: List<OrderItem> = _items
    val total: Money
        get() = _items.fold(Money.zero()) { acc, item -> acc.add(item.subtotal) }
    
    fun addItem(item: OrderItem): Order {
        require(status == OrderStatus.DRAFT) { "Cannot modify confirmed order" }
        return copy(_items = _items + item)
    }
    
    fun removeItem(itemId: OrderItemId): Order {
        require(status == OrderStatus.DRAFT) { "Cannot modify confirmed order" }
        return copy(_items = _items.filterNot { it.id == itemId })
    }
}
```

### 3. Leaky Abstractions

```kotlin
// ❌ MAL: Repository expone detalles de implementación
interface UserRepository {
    fun getUserCursor(): Cursor // ❌ Expone SQLite Cursor
    fun getUserLiveData(): LiveData<User> // ❌ Expone LiveData (específico de Android)
}

// ✅ BIEN: Repository usa abstracciones universales
interface UserRepository {
    suspend fun getUser(id: UserId): User?
    fun observeUser(id: UserId): Flow<User?> // ✅ Flow es independiente de plataforma
}
```

## 🧪 Testing de la Capa Model

La capa Model es la más importante para testear porque contiene la lógica crítica de negocio:

### Testing de Entities y Value Objects

```kotlin
class MoneyTest {
    @Test
    fun `adding money with same currency returns correct amount`() {
        // Given
        val money1 = Money(BigDecimal("10.00"), Currency.USD)
        val money2 = Money(BigDecimal("20.00"), Currency.USD)
        
        // When
        val result = money1.add(money2)
        
        // Then
        assertEquals(BigDecimal("30.00"), result.amount)
        assertEquals(Currency.USD, result.currency)
    }
    
    @Test
    fun `adding money with different currencies throws exception`() {
        // Given
        val money1 = Money(BigDecimal("10.00"), Currency.USD)
        val money2 = Money(BigDecimal("20.00"), Currency.EUR)
        
        // When & Then
        assertThrows<IllegalArgumentException> {
            money1.add(money2)
        }
    }
}
```

### Testing de Use Cases

```kotlin
class PurchaseProductUseCaseTest {
    private lateinit var productRepository: ProductRepository
    private lateinit var paymentRepository: PaymentRepository
    private lateinit var useCase: PurchaseProductUseCase
    
    @Before
    fun setup() {
        productRepository = mockk()
        paymentRepository = mockk()
        useCase = PurchaseProductUseCase(productRepository, paymentRepository)
    }
    
    @Test
    fun `successful purchase returns success result`() = runTest {
        // Given
        val userId = UserId("user-123")
        val productId = ProductId("product-456")
        val product = createTestProduct(price = Money(BigDecimal("99.99"), Currency.USD))
        
        coEvery { productRepository.getProduct(productId) } returns product
        coEvery { paymentRepository.processPayment(any(), any(), any()) } returns createSuccessfulPayment()
        
        // When
        val result = useCase(userId, productId, PaymentMethod.CreditCard)
        
        // Then
        assertTrue(result is Result.Success)
        coVerify { productRepository.getProduct(productId) }
        coVerify { paymentRepository.processPayment(any(), any(), any()) }
    }
    
    @Test
    fun `purchase with nonexistent product returns error`() = runTest {
        // Given
        val userId = UserId("user-123")
        val productId = ProductId("nonexistent")
        
        coEvery { productRepository.getProduct(productId) } returns null
        
        // When
        val result = useCase(userId, productId, PaymentMethod.CreditCard)
        
        // Then
        assertTrue(result is Result.Error)
        assertTrue((result as Result.Error).exception is ProductNotFoundException)
    }
}
```

## 📚 Recursos y Lecturas Adicionales

### Libros Fundamentales
- **Domain-Driven Design** por Eric Evans (2003)
- **Implementing Domain-Driven Design** por Vaughn Vernon (2013)
- **Clean Architecture** por Robert C. Martin (2017)
- **Patterns of Enterprise Application Architecture** por Martin Fowler (2002)

### Artículos y Recursos
- [Android Architecture Guide](https://developer.android.com/topic/architecture)
- [Guide to app architecture - Domain layer](https://developer.android.com/topic/architecture/domain-layer)
- [Repository pattern](https://developer.android.com/codelabs/basic-android-kotlin-training-repository-pattern)

### Conceptos Relacionados
- CQRS (Command Query Responsibility Segregation)
- Event Sourcing
- Hexagonal Architecture (Ports and Adapters)
- Onion Architecture

## 🎯 Conclusión

La capa Model es el corazón de tu aplicación Android. Siguiendo los principios de Domain-Driven Design, Clean Architecture, y MVVM, puedes crear un modelo de dominio que:

- **Es independiente** de frameworks y UI
- **Expresa claramente** las reglas de negocio
- **Es altamente testeable** sin dependencias externas
- **Es reutilizable** en diferentes contexts (móvil, web, backend)
- **Evoluciona fácilmente** con los requisitos del negocio

**Conceptos Clave para Recordar**:
- Rich Domain Model > Anemic Domain Model
- Entities vs Value Objects vs Aggregates
- Repository abstrae persistencia
- Use Cases orquestan lógica de negocio
- Dependency Inversion mantiene el dominio limpio
- El lenguaje del código debe reflejar el lenguaje del negocio

Dominar la capa Model es dominar el arte de modelar el negocio en código, creando aplicaciones robustas, mantenibles y que verdaderamente resuelven problemas reales.
