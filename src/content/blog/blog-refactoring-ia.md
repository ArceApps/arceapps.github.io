---
title: "Refactoring Inteligente con IA: Transformación Segura de Código Android"
description: "Aprende a usar agentes de IA para refactorizar código Android de manera segura y efectiva, desde pequeños cambios hasta migraciones arquitectónicas completas."
pubDate: "2025-12-29"
heroImage: "/images/placeholder-article-refactoring-ia.svg"
tags: ["AI", "Refactoring", "Android", "Desarrollo", "Clean Code", "GitHub Copilot"]
---

## El Desafío del Refactoring

Refactorizar código es una de las tareas más importantes pero más riesgosas en desarrollo. **Cambiar código funcionando sin romper nada** requiere experiencia, paciencia y tests exhaustivos.

Con agentes de IA, el refactoring se transforma de:
- ⏰ Proceso lento y tedioso → ⚡ Transformación rápida y precisa
- 😰 Alto riesgo de bugs → ✅ Cambios verificados automáticamente
- 🤔 Decisiones complejas → 🎯 Mejores prácticas aplicadas consistentemente

## Niveles de Refactoring con IA

### Nivel 1: Refactoring Simple (Nombres, Extracción)

**Caso: Renombrar con consistencia total**

```kotlin
// ANTES: Nombres inconsistentes
class UserManager {
    fun getUserData(id: String): UserInfo { ... }
    fun updateUserInformation(user: UserInfo) { ... }
    fun removeUserFromSystem(id: String) { ... }
}

// Prompt IA: "Renombra para consistencia: get/update/delete pattern"

// DESPUÉS: Nombres consistentes
class UserManager {
    fun getUser(id: String): User { ... }
    fun updateUser(user: User) { ... }
    fun deleteUser(id: String) { ... }
}
```

**Caso: Extraer función**

```kotlin
// ANTES: Código repetido
fun processOrder(order: Order) {
    if (order.items.isEmpty()) {
        throw IllegalArgumentException("Order must have items")
    }
    if (order.total < 0) {
        throw IllegalArgumentException("Total cannot be negative")
    }
    if (order.customerId.isEmpty()) {
        throw IllegalArgumentException("Customer ID is required")
    }
    // ... proceso
}

fun validatePayment(payment: Payment) {
    if (payment.amount < 0) {
        throw IllegalArgumentException("Amount cannot be negative")
    }
    if (payment.method.isEmpty()) {
        throw IllegalArgumentException("Payment method is required")
    }
    // ... validación
}

// Prompt IA: "Extrae validaciones a función reutilizable"

// DESPUÉS: DRY (Don't Repeat Yourself)
private fun validatePositiveAmount(amount: Double, fieldName: String) {
    require(amount >= 0) { "$fieldName cannot be negative" }
}

private fun validateNotEmpty(value: String, fieldName: String) {
    require(value.isNotEmpty()) { "$fieldName is required" }
}

fun processOrder(order: Order) {
    validateNotEmpty(order.items.toString(), "Order items")
    validatePositiveAmount(order.total, "Order total")
    validateNotEmpty(order.customerId, "Customer ID")
    // ... proceso
}

fun validatePayment(payment: Payment) {
    validatePositiveAmount(payment.amount, "Payment amount")
    validateNotEmpty(payment.method, "Payment method")
    // ... validación
}
```

### Nivel 2: Refactoring de Patrones (Design Patterns)

**Caso: Extraer Strategy Pattern**

```kotlin
// ANTES: Condicionales complejos
class PaymentProcessor {
    fun processPayment(payment: Payment, method: String): Result<Receipt> {
        return when (method) {
            "credit_card" -> {
                // 50 líneas de lógica de tarjeta
                validateCreditCard(payment.cardNumber)
                chargeCreditCard(payment.amount)
                generateReceipt("Credit Card", payment.amount)
            }
            "paypal" -> {
                // 40 líneas de lógica de PayPal
                validatePayPalAccount(payment.email)
                chargePayPal(payment.amount)
                generateReceipt("PayPal", payment.amount)
            }
            "bitcoin" -> {
                // 60 líneas de lógica de Bitcoin
                validateBitcoinAddress(payment.address)
                chargeBitcoin(payment.amount)
                generateReceipt("Bitcoin", payment.amount)
            }
            else -> Result.failure(UnsupportedPaymentException())
        }
    }
}

// Prompt IA: "Refactoriza a Strategy pattern para payment methods"

// DESPUÉS: Strategy Pattern limpio
interface PaymentStrategy {
    suspend fun validate(payment: Payment): ValidationResult
    suspend fun charge(amount: Double): ChargeResult
    fun getMethodName(): String
}

class CreditCardStrategy @Inject constructor(
    private val creditCardService: CreditCardService
) : PaymentStrategy {
    
    override suspend fun validate(payment: Payment): ValidationResult {
        return creditCardService.validateCard(payment.cardNumber)
    }
    
    override suspend fun charge(amount: Double): ChargeResult {
        return creditCardService.charge(amount)
    }
    
    override fun getMethodName() = "Credit Card"
}

class PayPalStrategy @Inject constructor(
    private val paypalService: PayPalService
) : PaymentStrategy {
    
    override suspend fun validate(payment: Payment): ValidationResult {
        return paypalService.validateAccount(payment.email)
    }
    
    override suspend fun charge(amount: Double): ChargeResult {
        return paypalService.charge(amount)
    }
    
    override fun getMethodName() = "PayPal"
}

class PaymentProcessor @Inject constructor(
    private val strategies: Map<String, @JvmSuppressWildcards PaymentStrategy>
) {
    suspend fun processPayment(payment: Payment, method: String): Result<Receipt> {
        val strategy = strategies[method] 
            ?: return Result.failure(UnsupportedPaymentException())
        
        return try {
            // Validar
            val validationResult = strategy.validate(payment)
            if (!validationResult.isValid) {
                return Result.failure(ValidationException(validationResult.error))
            }
            
            // Cargar
            val chargeResult = strategy.charge(payment.amount)
            if (!chargeResult.isSuccessful) {
                return Result.failure(ChargeException(chargeResult.error))
            }
            
            // Generar recibo
            val receipt = generateReceipt(strategy.getMethodName(), payment.amount)
            Result.success(receipt)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// Hilt Module para configurar strategies
@Module
@InstallIn(SingletonComponent::class)
abstract class PaymentModule {
    
    @Binds
    @IntoMap
    @StringKey("credit_card")
    abstract fun bindCreditCardStrategy(impl: CreditCardStrategy): PaymentStrategy
    
    @Binds
    @IntoMap
    @StringKey("paypal")
    abstract fun bindPayPalStrategy(impl: PayPalStrategy): PaymentStrategy
    
    @Binds
    @IntoMap
    @StringKey("bitcoin")
    abstract fun bindBitcoinStrategy(impl: BitcoinStrategy): PaymentStrategy
}
```

### Nivel 3: Refactoring Arquitectónico

**Caso: Migrar a Clean Architecture**

```kotlin
// ANTES: Todo en un ViewModel (God Object)
@HiltViewModel
class ProductViewModel @Inject constructor(
    private val apiService: ProductApiService,
    private val database: AppDatabase
) : ViewModel() {
    
    private val _products = MutableLiveData<List<Product>>()
    val products: LiveData<List<Product>> = _products
    
    fun loadProducts() {
        viewModelScope.launch {
            try {
                // Lógica de negocio mezclada
                val cachedProducts = database.productDao().getAll()
                _products.value = cachedProducts
                
                val response = apiService.getProducts()
                if (response.isSuccessful) {
                    val networkProducts = response.body()!!.map { dto ->
                        Product(
                            id = dto.id,
                            name = dto.name,
                            price = dto.price
                        )
                    }
                    
                    // Más lógica de negocio
                    database.productDao().insertAll(networkProducts.map { 
                        ProductEntity(it.id, it.name, it.price) 
                    })
                    
                    _products.value = networkProducts
                }
            } catch (e: Exception) {
                // Manejo pobre de errores
                Log.e("ProductViewModel", "Error", e)
            }
        }
    }
}

// Prompt IA: "Refactoriza a Clean Architecture con capas:
// - Domain: Models, UseCases, Repository interfaces
// - Data: Repository impl, DataSources, DTOs, Entities
// - Presentation: ViewModel con UiState
// Usa Result para errores, Flow para reactive updates"

// DESPUÉS: Clean Architecture completa

// ============ DOMAIN LAYER ============

// Domain Model
data class Product(
    val id: String,
    val name: String,
    val price: Double
)

// Repository Interface (en domain)
interface ProductRepository {
    fun getProducts(): Flow<Result<List<Product>>>
    suspend fun refreshProducts(): Result<Unit>
}

// Use Case
class GetProductsUseCase @Inject constructor(
    private val repository: ProductRepository
) {
    operator fun invoke(): Flow<Result<List<Product>>> {
        return repository.getProducts()
    }
}

// ============ DATA LAYER ============

// DTO (Data Transfer Object)
data class ProductDto(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "price") val price: Double
)

// Entity (Database)
@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: String,
    val name: String,
    val price: Double
)

// Mappers
fun ProductDto.toDomain(): Product = Product(id, name, price)
fun ProductEntity.toDomain(): Product = Product(id, name, price)
fun Product.toEntity(): ProductEntity = ProductEntity(id, name, price)

// Remote Data Source
interface ProductRemoteDataSource {
    suspend fun getProducts(): List<ProductDto>
}

class ProductRemoteDataSourceImpl @Inject constructor(
    private val apiService: ProductApiService
) : ProductRemoteDataSource {
    
    override suspend fun getProducts(): List<ProductDto> {
        val response = apiService.getProducts()
        if (response.isSuccessful && response.body() != null) {
            return response.body()!!
        }
        throw ApiException("Failed to fetch products")
    }
}

// Local Data Source
interface ProductLocalDataSource {
    fun getProducts(): Flow<List<ProductEntity>>
    suspend fun saveProducts(products: List<ProductEntity>)
    suspend fun clearProducts()
}

class ProductLocalDataSourceImpl @Inject constructor(
    private val productDao: ProductDao
) : ProductLocalDataSource {
    
    override fun getProducts(): Flow<List<ProductEntity>> {
        return productDao.getAllProducts()
    }
    
    override suspend fun saveProducts(products: List<ProductEntity>) {
        productDao.insertAll(products)
    }
    
    override suspend fun clearProducts() {
        productDao.deleteAll()
    }
}

// Repository Implementation
class ProductRepositoryImpl @Inject constructor(
    private val remoteDataSource: ProductRemoteDataSource,
    private val localDataSource: ProductLocalDataSource,
    private val networkMonitor: NetworkMonitor
) : ProductRepository {
    
    override fun getProducts(): Flow<Result<List<Product>>> = flow {
        // Emit cached data first
        localDataSource.getProducts()
            .first()
            .map { it.toDomain() }
            .let { cached ->
                if (cached.isNotEmpty()) {
                    emit(Result.success(cached))
                }
            }
        
        // Sync with network if available
        if (networkMonitor.isOnline.first()) {
            try {
                val remoteProducts = remoteDataSource.getProducts()
                val domainProducts = remoteProducts.map { it.toDomain() }
                
                // Update cache
                localDataSource.saveProducts(
                    domainProducts.map { it.toEntity() }
                )
                
                emit(Result.success(domainProducts))
            } catch (e: Exception) {
                // Si ya emitimos cache, no emitimos error
                val cached = localDataSource.getProducts().first()
                if (cached.isEmpty()) {
                    emit(Result.failure(e))
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override suspend fun refreshProducts(): Result<Unit> {
        return try {
            val products = remoteDataSource.getProducts()
            localDataSource.clearProducts()
            localDataSource.saveProducts(products.map { it.toDomain().toEntity() })
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// ============ PRESENTATION LAYER ============

// UI State
sealed interface ProductUiState {
    object Loading : ProductUiState
    data class Success(val products: List<Product>) : ProductUiState
    data class Error(val message: String) : ProductUiState
}

// ViewModel (ahora simple y enfocado)
@HiltViewModel
class ProductViewModel @Inject constructor(
    private val getProductsUseCase: GetProductsUseCase
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<ProductUiState>(ProductUiState.Loading)
    val uiState: StateFlow<ProductUiState> = _uiState.asStateFlow()
    
    init {
        loadProducts()
    }
    
    private fun loadProducts() {
        viewModelScope.launch {
            getProductsUseCase()
                .catch { error ->
                    _uiState.value = ProductUiState.Error(
                        error.localizedMessage ?: "Unknown error"
                    )
                }
                .collect { result ->
                    _uiState.value = when (result) {
                        is Result.Success -> ProductUiState.Success(result.data)
                        is Result.Failure -> ProductUiState.Error(result.exception.message)
                    }
                }
        }
    }
    
    fun refresh() {
        loadProducts()
    }
}
```

### Nivel 4: Migraciones Tecnológicas

**Caso: Migrar de LiveData a StateFlow**

```kotlin
// Prompt IA: "Migra este ViewModel de LiveData a StateFlow,
// manteniendo comportamiento idéntico"

// ANTES: LiveData
class UserViewModel @Inject constructor(
    private val repository: UserRepository
) : ViewModel() {
    
    private val _users = MutableLiveData<List<User>>()
    val users: LiveData<List<User>> = _users
    
    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    fun loadUsers() {
        _loading.value = true
        viewModelScope.launch {
            try {
                val result = repository.getUsers()
                _users.value = result
                _error.value = null
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _loading.value = false
            }
        }
    }
}

// DESPUÉS: StateFlow (mejor para Compose y testing)
@HiltViewModel
class UserViewModel @Inject constructor(
    private val repository: UserRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<UserUiState>(UserUiState.Loading)
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()
    
    init {
        loadUsers()
    }
    
    private fun loadUsers() {
        viewModelScope.launch {
            _uiState.value = UserUiState.Loading
            
            try {
                repository.getUsers()
                    .collect { users ->
                        _uiState.value = UserUiState.Success(users)
                    }
            } catch (e: Exception) {
                _uiState.value = UserUiState.Error(e.message ?: "Unknown error")
            }
        }
    }
}

sealed interface UserUiState {
    object Loading : UserUiState
    data class Success(val users: List<User>) : UserUiState
    data class Error(val message: String) : UserUiState
}
```

**Caso: Migrar XML Views a Jetpack Compose**

```kotlin
// Prompt IA: "Convierte este XML layout a Jetpack Compose
// manteniendo el mismo diseño y comportamiento"

// ANTES: XML
/*
<LinearLayout
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:padding="16dp">
    
    <TextView
        android:id="@+id/title"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textSize="20sp"
        android:textStyle="bold" />
    
    <TextView
        android:id="@+id/description"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:textSize="14sp" />
    
    <Button
        android:id="@+id/actionButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Action" />
</LinearLayout>
*/

// DESPUÉS: Jetpack Compose
@Composable
fun ContentCard(
    title: String,
    description: String,
    onActionClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        
        Text(
            text = description,
            style = MaterialTheme.typography.bodyMedium
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Button(
            onClick = onActionClick,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Action")
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun ContentCardPreview() {
    MaterialTheme {
        ContentCard(
            title = "Sample Title",
            description = "This is a sample description",
            onActionClick = {}
        )
    }
}
```

## Refactoring Seguro con Tests

### Workflow: Refactoring Test-Protected

```kotlin
// Paso 1: Genera tests ANTES de refactorizar
// Prompt IA: "Genera tests comprehensivos para este código"

@Test
fun `should calculate total correctly`() {
    val cart = ShoppingCart()
    cart.addItem(Product("1", price = 10.0))
    cart.addItem(Product("2", price = 20.0))
    
    assertEquals(30.0, cart.getTotal())
}

// Paso 2: Tests pasan con código actual ✅

// Paso 3: Refactoriza con IA
// Prompt: "Refactoriza ShoppingCart para mejor mantenibilidad"

// Paso 4: Tests siguen pasando ✅

// Paso 5: Si tests fallan, revierte o corrige
```

## Estrategias de Refactoring con IA

### Estrategia 1: Incremental

```kotlin
// No refactorices todo a la vez
// IA ayuda a refactorizar paso a paso:

// Paso 1: Extraer constantes
// Prompt: "Extrae magic numbers a constantes nombradas"

// Paso 2: Extraer funciones
// Prompt: "Extrae lógica repetida a funciones"

// Paso 3: Extraer clases
// Prompt: "Extrae responsabilidades a clases separadas"

// Paso 4: Aplicar patterns
// Prompt: "Aplica Repository pattern"

// Cada paso: commit + tests ✅
```

### Estrategia 2: Branch by Abstraction

```kotlin
// IA ayuda a refactorizar sin romper código existente:

// 1. Crear abstracción
interface PaymentProcessor {
    fun process(payment: Payment): Result<Receipt>
}

// 2. Implementar nueva versión
class NewPaymentProcessor : PaymentProcessor { ... }

// 3. Mantener versión vieja
class LegacyPaymentProcessor : PaymentProcessor { ... }

// 4. Feature flag para toggle
val processor = if (featureFlags.useNewPayment) {
    NewPaymentProcessor()
} else {
    LegacyPaymentProcessor()
}

// 5. Cuando nuevo funciona: eliminar viejo
```

### Estrategia 3: Strangler Pattern

```kotlin
// Para refactorizar sistemas grandes:

// 1. Nueva implementación en paralelo
class NewUserService { ... }

// 2. Proxy que decide qué usar
class UserServiceProxy(
    private val legacy: LegacyUserService,
    private val new: NewUserService,
    private val migrationService: MigrationService
) : UserService {
    
    override fun getUser(id: String): User {
        return if (migrationService.isMigrated(id)) {
            new.getUser(id)
        } else {
            legacy.getUser(id).also {
                // Migrar progresivamente
                migrationService.migrate(it)
            }
        }
    }
}

// 3. Gradualmente todos usan nuevo
// 4. Eliminar legacy cuando migración completa
```

## Herramientas IA para Refactoring

### GitHub Copilot Chat

```
// Comando: /refactor
Selecciona código → /refactor "Extract to repository pattern"

// Comando: /fix
Selecciona código → /fix "Apply SOLID principles"

// Comando: /optimize
Selecciona código → /optimize "Reduce memory allocations"
```

### Gemini Code Assist

```
"Analiza este código y sugiere refactorings:
- Code smells
- Anti-patterns
- Performance issues
- Violaciones SOLID

Prioriza por impacto."
```

## Anti-Patrones a Evitar

### ❌ Refactoring Sin Tests

```kotlin
// MAL: Refactorizar código sin cobertura
// Resultado: Bugs silenciosos

// BIEN: Tests primero, luego refactoriza
// Resultado: Cambios seguros
```

### ❌ Big Bang Refactoring

```kotlin
// MAL: Refactorizar todo el sistema de una vez
// Resultado: Merge conflicts, bugs, stress

// BIEN: Refactorizar incrementalmente
// Resultado: Cambios controlados, fácil de revertir
```

### ❌ Refactoring Por Refactoring

```kotlin
// MAL: "Refactoricemos porque sí"
// Resultado: Tiempo perdido

// BIEN: Refactorizar con propósito
// - Facilitar nueva feature
// - Mejorar performance
// - Reducir bugs
// - Mejorar mantenibilidad
```

## Métricas de Éxito

Refactoring exitoso con IA resulta en:

- ✅ **Tests siguen pasando** (100%)
- ✅ **Cobertura aumenta** o se mantiene
- ✅ **Complejidad ciclomática reduce**
- ✅ **Líneas de código reduce** (menos es más)
- ✅ **Performance igual o mejor**
- ✅ **Bugs no aumentan**

## Conclusión

**Refactoring con IA** transforma una tarea arriesgada en un proceso seguro y productivo:

- 🚀 **10x más rápido** que refactoring manual
- ✅ **Tests automáticos** garantizan corrección
- 🎯 **Best practices** aplicadas consistentemente
- 🔄 **Iterativo y seguro** con validación continua

**Tu siguiente paso:**
1. Identifica código que necesita refactoring
2. Genera tests con IA para ese código
3. Usa IA para refactorizar incrementalmente
4. Valida que tests sigan pasando
5. Commit y continúa

El refactoring ya no es algo a temer, es una oportunidad de mejorar continuamente con ayuda de IA.
