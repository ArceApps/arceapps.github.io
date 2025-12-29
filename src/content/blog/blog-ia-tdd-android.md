---
title: "IA y Test-Driven Development: TDD Potenciado por Agentes Inteligentes"
description: "Descubre cómo los agentes de IA transforman TDD en Android, generando tests completos y facilitando el ciclo Red-Green-Refactor con precisión."
pubDate: "2025-12-29"
heroImage: "/images/placeholder-article-tdd-ia.svg"
tags: ["AI", "TDD", "Testing", "Android", "Desarrollo", "GitHub Copilot", "Gemini"]
---

## TDD Tradicional vs TDD con IA

### TDD Tradicional

```kotlin
// Ciclo tradicional (lento y manual):
// 1. RED: Escribir test (5-10 min)
// 2. GREEN: Implementar código mínimo (10-15 min)
// 3. REFACTOR: Mejorar código (5-10 min)
// Total: 20-35 min por ciclo
```

### TDD con IA

```kotlin
// Ciclo con IA (rápido y eficiente):
// 1. RED: IA genera test comprehensivo (30 seg)
// 2. GREEN: IA genera implementación (1 min)
// 3. REFACTOR: IA optimiza código (30 seg)
// Total: 2-3 min por ciclo
// Ganancia: 10x más rápido
```

## El Nuevo Ciclo TDD con IA

### Fase 1: Especificación

Primero defines QUÉ quieres:

```kotlin
/**
 * Feature: User Authentication
 * 
 * Requirements:
 * - Login con email/password
 * - Validación de formato
 * - Máximo 5 intentos fallidos
 * - Bloqueo temporal después de 5 intentos
 * - Session persistence con token
 * 
 * States:
 * - Idle: Estado inicial
 * - Loading: Autenticando
 * - Success: Login exitoso con user
 * - Error: Login fallido con mensaje
 * - Blocked: Usuario bloqueado temporalmente
 */
```

### Fase 2: AI Genera Tests (RED)

**Prompt para IA:**
```
Basándote en la especificación, genera tests completos para LoginViewModel.
Incluye casos:
- Login exitoso
- Credenciales incorrectas
- Email inválido
- Usuario bloqueado
- Network error
- Intentos múltiples

Usa JUnit5, MockK, Turbine. Cobertura > 95%.
```

**Tests generados por IA:**

```kotlin
@ExperimentalCoroutinesApi
class LoginViewModelTest {
    
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()
    
    private lateinit var viewModel: LoginViewModel
    private val mockLoginUseCase = mockk<LoginUseCase>()
    private val mockAttemptTracker = mockk<LoginAttemptTracker>()
    
    @BeforeEach
    fun setup() {
        clearAllMocks()
        coEvery { mockAttemptTracker.isBlocked(any()) } returns false
        viewModel = LoginViewModel(mockLoginUseCase, mockAttemptTracker)
    }
    
    @Nested
    @DisplayName("Successful Login")
    inner class SuccessfulLogin {
        
        @Test
        fun `should transition to loading when login starts`() = runTest {
            // Arrange
            val email = "user@example.com"
            val password = "Password123!"
            coEvery { 
                mockLoginUseCase(email, password) 
            } returns flowOf(Result.Success(mockUser))
            
            // Act
            viewModel.uiState.test {
                assertThat(awaitItem()).isEqualTo(LoginUiState.Idle)
                
                viewModel.login(email, password)
                
                // Assert
                assertThat(awaitItem()).isEqualTo(LoginUiState.Loading)
                cancelAndIgnoreRemainingEvents()
            }
        }
        
        @Test
        fun `should emit success state when credentials are correct`() = runTest {
            // Arrange
            val email = "user@example.com"
            val password = "Password123!"
            val expectedUser = User("1", "John Doe", email)
            
            coEvery { 
                mockLoginUseCase(email, password) 
            } returns flowOf(Result.Success(expectedUser))
            
            // Act
            viewModel.login(email, password)
            
            // Assert
            viewModel.uiState.test {
                assertThat(awaitItem()).isEqualTo(LoginUiState.Loading)
                val successState = awaitItem() as LoginUiState.Success
                assertThat(successState.user).isEqualTo(expectedUser)
            }
        }
        
        @Test
        fun `should reset attempt counter on successful login`() = runTest {
            // Arrange
            val email = "user@example.com"
            coEvery { 
                mockLoginUseCase(any(), any()) 
            } returns flowOf(Result.Success(mockUser))
            coEvery { mockAttemptTracker.resetAttempts(email) } just Runs
            
            // Act
            viewModel.login(email, "password")
            advanceUntilIdle()
            
            // Assert
            coVerify { mockAttemptTracker.resetAttempts(email) }
        }
    }
    
    @Nested
    @DisplayName("Failed Login")
    inner class FailedLogin {
        
        @Test
        fun `should emit error state when credentials are incorrect`() = runTest {
            // Arrange
            val email = "user@example.com"
            val password = "WrongPassword"
            val errorMessage = "Credenciales incorrectas"
            
            coEvery { 
                mockLoginUseCase(email, password) 
            } returns flowOf(Result.Error(InvalidCredentialsException(errorMessage)))
            
            // Act
            viewModel.login(email, password)
            
            // Assert
            viewModel.uiState.test {
                assertThat(awaitItem()).isEqualTo(LoginUiState.Loading)
                val errorState = awaitItem() as LoginUiState.Error
                assertThat(errorState.message).isEqualTo(errorMessage)
            }
        }
        
        @Test
        fun `should increment attempt counter on failed login`() = runTest {
            // Arrange
            val email = "user@example.com"
            coEvery { 
                mockLoginUseCase(any(), any()) 
            } returns flowOf(Result.Error(InvalidCredentialsException()))
            coEvery { mockAttemptTracker.recordFailedAttempt(email) } just Runs
            
            // Act
            viewModel.login(email, "wrong")
            advanceUntilIdle()
            
            // Assert
            coVerify { mockAttemptTracker.recordFailedAttempt(email) }
        }
        
        @ParameterizedTest
        @ValueSource(ints = [1, 2, 3, 4])
        fun `should allow retry after failed attempts less than 5`(attemptCount: Int) = runTest {
            // Arrange
            coEvery { mockAttemptTracker.getAttemptCount(any()) } returns attemptCount
            coEvery { mockAttemptTracker.isBlocked(any()) } returns false
            
            // Act
            viewModel.login("user@example.com", "wrong")
            
            // Assert
            viewModel.uiState.test {
                assertThat(awaitItem()).isInstanceOf<LoginUiState.Loading>()
                cancelAndIgnoreRemainingEvents()
            }
        }
        
        @Test
        fun `should block user after 5 failed attempts`() = runTest {
            // Arrange
            val email = "user@example.com"
            coEvery { mockAttemptTracker.isBlocked(email) } returns true
            
            // Act
            viewModel.login(email, "password")
            
            // Assert
            viewModel.uiState.test {
                val blockedState = awaitItem() as LoginUiState.Blocked
                assertThat(blockedState.remainingTime).isGreaterThan(0)
            }
            
            // No debe llamar al use case si está bloqueado
            coVerify(exactly = 0) { mockLoginUseCase(any(), any()) }
        }
    }
    
    @Nested
    @DisplayName("Validation")
    inner class Validation {
        
        @ParameterizedTest
        @ValueSource(strings = ["", "invalid", "no@domain", "@example.com"])
        fun `should not allow login with invalid email format`(invalidEmail: String) = runTest {
            // Act
            viewModel.login(invalidEmail, "Password123!")
            
            // Assert
            viewModel.uiState.test {
                val errorState = awaitItem() as LoginUiState.Error
                assertThat(errorState.message).contains("email", ignoreCase = true)
            }
            
            coVerify(exactly = 0) { mockLoginUseCase(any(), any()) }
        }
        
        @Test
        fun `should not allow login with empty password`() = runTest {
            // Act
            viewModel.login("user@example.com", "")
            
            // Assert
            viewModel.uiState.test {
                val errorState = awaitItem() as LoginUiState.Error
                assertThat(errorState.message).contains("contraseña", ignoreCase = true)
            }
        }
        
        @Test
        fun `should trim whitespace from email`() = runTest {
            // Arrange
            val cleanEmail = "user@example.com"
            val emailWithSpaces = "  $cleanEmail  "
            coEvery { 
                mockLoginUseCase(cleanEmail, any()) 
            } returns flowOf(Result.Success(mockUser))
            
            // Act
            viewModel.login(emailWithSpaces, "password")
            advanceUntilIdle()
            
            // Assert
            coVerify { mockLoginUseCase(cleanEmail, any()) }
        }
    }
    
    @Nested
    @DisplayName("Network Errors")
    inner class NetworkErrors {
        
        @Test
        fun `should emit error state on network failure`() = runTest {
            // Arrange
            coEvery { 
                mockLoginUseCase(any(), any()) 
            } returns flowOf(Result.Error(NetworkException("Sin conexión")))
            
            // Act
            viewModel.login("user@example.com", "password")
            
            // Assert
            viewModel.uiState.test {
                assertThat(awaitItem()).isEqualTo(LoginUiState.Loading)
                val errorState = awaitItem() as LoginUiState.Error
                assertThat(errorState.message).contains("conexión", ignoreCase = true)
                assertThat(errorState.canRetry).isTrue()
            }
        }
        
        @Test
        fun `should allow retry after network error`() = runTest {
            // Arrange
            coEvery { 
                mockLoginUseCase(any(), any()) 
            } returns flowOf(Result.Error(NetworkException()))
            
            // Act
            viewModel.login("user@example.com", "password")
            viewModel.uiState.first()
            
            viewModel.retry()
            
            // Assert
            coVerify(exactly = 2) { mockLoginUseCase(any(), any()) }
        }
    }
    
    @Nested
    @DisplayName("State Management")
    inner class StateManagement {
        
        @Test
        fun `should start with idle state`() = runTest {
            // Assert
            assertThat(viewModel.uiState.value).isEqualTo(LoginUiState.Idle)
        }
        
        @Test
        fun `should reset to idle when clearing error`() = runTest {
            // Arrange
            coEvery { 
                mockLoginUseCase(any(), any()) 
            } returns flowOf(Result.Error(InvalidCredentialsException()))
            
            viewModel.login("user@example.com", "wrong")
            viewModel.uiState.first { it is LoginUiState.Error }
            
            // Act
            viewModel.clearError()
            
            // Assert
            assertThat(viewModel.uiState.value).isEqualTo(LoginUiState.Idle)
        }
    }
    
    companion object {
        private val mockUser = User("1", "Test User", "test@example.com")
    }
}
```

**Ejecuta tests → FALLAN (no hay implementación)** ✅ RED

### Fase 3: AI Genera Implementación (GREEN)

**Prompt para IA:**
```
Genera la implementación de LoginViewModel que haga pasar todos los tests.
Debe:
- Usar @HiltViewModel
- StateFlow para UI state
- viewModelScope para coroutines
- Validar email con Patterns.EMAIL_ADDRESS
- Manejar todos los casos de error
- Implementar retry
```

**Implementación generada por IA:**

```kotlin
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val attemptTracker: LoginAttemptTracker
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    private var lastCredentials: Pair<String, String>? = null
    
    fun login(email: String, password: String) {
        // Guardar para retry
        lastCredentials = email to password
        
        // Validaciones
        val trimmedEmail = email.trim()
        
        if (!isValidEmail(trimmedEmail)) {
            _uiState.value = LoginUiState.Error(
                message = "Formato de email inválido",
                canRetry = false
            )
            return
        }
        
        if (password.isEmpty()) {
            _uiState.value = LoginUiState.Error(
                message = "La contraseña no puede estar vacía",
                canRetry = false
            )
            return
        }
        
        // Verificar si está bloqueado
        if (attemptTracker.isBlocked(trimmedEmail)) {
            val remainingTime = attemptTracker.getRemainingBlockTime(trimmedEmail)
            _uiState.value = LoginUiState.Blocked(remainingTime)
            return
        }
        
        // Ejecutar login
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            
            loginUseCase(trimmedEmail, password)
                .catch { error ->
                    handleError(error, trimmedEmail)
                }
                .collect { result ->
                    when (result) {
                        is Result.Success -> {
                            attemptTracker.resetAttempts(trimmedEmail)
                            _uiState.value = LoginUiState.Success(result.data)
                        }
                        is Result.Error -> {
                            handleError(result.exception, trimmedEmail)
                        }
                    }
                }
        }
    }
    
    fun retry() {
        lastCredentials?.let { (email, password) ->
            login(email, password)
        }
    }
    
    fun clearError() {
        if (_uiState.value is LoginUiState.Error) {
            _uiState.value = LoginUiState.Idle
        }
    }
    
    private fun handleError(error: Throwable, email: String) {
        when (error) {
            is InvalidCredentialsException -> {
                attemptTracker.recordFailedAttempt(email)
                _uiState.value = LoginUiState.Error(
                    message = error.message ?: "Credenciales incorrectas",
                    canRetry = true
                )
            }
            is NetworkException -> {
                _uiState.value = LoginUiState.Error(
                    message = "Error de conexión. Verifica tu internet.",
                    canRetry = true
                )
            }
            else -> {
                _uiState.value = LoginUiState.Error(
                    message = "Error inesperado. Intenta nuevamente.",
                    canRetry = true
                )
            }
        }
    }
    
    private fun isValidEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
}

sealed interface LoginUiState {
    object Idle : LoginUiState
    object Loading : LoginUiState
    data class Success(val user: User) : LoginUiState
    data class Error(val message: String, val canRetry: Boolean) : LoginUiState
    data class Blocked(val remainingTime: Long) : LoginUiState
}
```

**Ejecuta tests → PASAN** ✅ GREEN

### Fase 4: AI Refactoriza (REFACTOR)

**Prompt para IA:**
```
Refactoriza LoginViewModel para:
- Extraer validaciones a validator class
- Mejorar manejo de errores
- Añadir analytics events
- Optimizar memory usage
- Mantener todos los tests pasando
```

**Código refactorizado por IA:**

```kotlin
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val attemptTracker: LoginAttemptTracker,
    private val loginValidator: LoginValidator,
    private val analyticsTracker: AnalyticsTracker
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    private var lastCredentials: Pair<String, String>? = null
    
    fun login(email: String, password: String) {
        lastCredentials = email to password
        
        // Validar con validator dedicado
        val validationResult = loginValidator.validate(email, password)
        if (validationResult is ValidationResult.Invalid) {
            _uiState.value = LoginUiState.Error(
                message = validationResult.message,
                canRetry = false
            )
            analyticsTracker.logEvent("login_validation_failed", mapOf(
                "reason" to validationResult.reason
            ))
            return
        }
        
        val trimmedEmail = email.trim()
        
        // Verificar bloqueo
        if (attemptTracker.isBlocked(trimmedEmail)) {
            val remainingTime = attemptTracker.getRemainingBlockTime(trimmedEmail)
            _uiState.value = LoginUiState.Blocked(remainingTime)
            analyticsTracker.logEvent("login_blocked", mapOf(
                "remaining_seconds" to remainingTime
            ))
            return
        }
        
        // Ejecutar login
        performLogin(trimmedEmail, password)
    }
    
    private fun performLogin(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            analyticsTracker.logEvent("login_attempt")
            
            val startTime = System.currentTimeMillis()
            
            loginUseCase(email, password)
                .catch { error ->
                    handleError(error, email, startTime)
                }
                .collect { result ->
                    val duration = System.currentTimeMillis() - startTime
                    
                    when (result) {
                        is Result.Success -> {
                            attemptTracker.resetAttempts(email)
                            _uiState.value = LoginUiState.Success(result.data)
                            
                            analyticsTracker.logEvent("login_success", mapOf(
                                "duration_ms" to duration,
                                "user_id" to result.data.id
                            ))
                        }
                        is Result.Error -> {
                            handleError(result.exception, email, startTime)
                        }
                    }
                }
        }
    }
    
    private fun handleError(error: Throwable, email: String, startTime: Long) {
        val duration = System.currentTimeMillis() - startTime
        
        val (message, shouldRecordAttempt, errorType) = when (error) {
            is InvalidCredentialsException -> Triple(
                error.message ?: "Credenciales incorrectas",
                true,
                "invalid_credentials"
            )
            is NetworkException -> Triple(
                "Error de conexión. Verifica tu internet.",
                false,
                "network_error"
            )
            else -> Triple(
                "Error inesperado. Intenta nuevamente.",
                false,
                "unknown_error"
            )
        }
        
        if (shouldRecordAttempt) {
            attemptTracker.recordFailedAttempt(email)
        }
        
        _uiState.value = LoginUiState.Error(
            message = message,
            canRetry = true
        )
        
        analyticsTracker.logEvent("login_failed", mapOf(
            "error_type" to errorType,
            "duration_ms" to duration
        ))
        
        Timber.e(error, "Login failed: $errorType")
    }
    
    fun retry() {
        lastCredentials?.let { (email, password) ->
            analyticsTracker.logEvent("login_retry")
            login(email, password)
        }
    }
    
    fun clearError() {
        if (_uiState.value is LoginUiState.Error) {
            _uiState.value = LoginUiState.Idle
        }
    }
}

// Nueva clase extraída para validaciones
class LoginValidator @Inject constructor() {
    
    fun validate(email: String, password: String): ValidationResult {
        val trimmedEmail = email.trim()
        
        if (trimmedEmail.isEmpty()) {
            return ValidationResult.Invalid(
                message = "El email no puede estar vacío",
                reason = "empty_email"
            )
        }
        
        if (!isValidEmail(trimmedEmail)) {
            return ValidationResult.Invalid(
                message = "Formato de email inválido",
                reason = "invalid_email_format"
            )
        }
        
        if (password.isEmpty()) {
            return ValidationResult.Invalid(
                message = "La contraseña no puede estar vacía",
                reason = "empty_password"
            )
        }
        
        return ValidationResult.Valid
    }
    
    private fun isValidEmail(email: String): Boolean {
        return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
}

sealed class ValidationResult {
    object Valid : ValidationResult()
    data class Invalid(val message: String, val reason: String) : ValidationResult()
}
```

**Ejecuta tests → TODOS PASAN** ✅ REFACTOR

## Ventajas de TDD con IA

### 1. Velocidad Exponencial

```kotlin
// Sin IA: 30 min por feature
// - 10 min escribiendo tests
// - 15 min implementando
// - 5 min refactorizando

// Con IA: 3 min por feature
// - 30 seg generando tests
// - 1 min generando implementación
// - 30 seg refactorizando

// Ganancia: 10x más rápido
```

### 2. Cobertura Exhaustiva

La IA piensa en edge cases que podrías olvidar:

```kotlin
// IA genera automáticamente tests para:
@ParameterizedTest
@MethodSource("provideInvalidEmails")
fun `should reject invalid email formats`(invalidEmail: String) = runTest {
    // ...
}

companion object {
    @JvmStatic
    fun provideInvalidEmails() = listOf(
        "plainaddress",
        "@no-local.org",
        "missing-at-sign.com",
        "missing-domain@.com",
        "two@@at-signs.com",
        "dotdot..@example.com",
        "spaces in email@example.com",
        "特殊字符@example.com",
        "emoji😀@example.com"
    )
}
```

### 3. Documentación Viva

Los tests son especificación ejecutable:

```kotlin
@DisplayName("User Registration")
class UserRegistrationTest {
    
    @Nested
    @DisplayName("When user provides valid data")
    inner class ValidData {
        
        @Test
        fun `should create account successfully`()
        
        @Test
        fun `should send verification email`()
        
        @Test
        fun `should log registration event`()
    }
    
    @Nested
    @DisplayName("When email already exists")
    inner class EmailExists {
        
        @Test
        fun `should return email exists error`()
        
        @Test
        fun `should not create duplicate account`()
        
        @Test
        fun `should offer password reset option`()
    }
}
```

### 4. Refactoring Seguro

Con tests completos, refactoriza confiadamente:

```kotlin
// Prompt: "Refactoriza este código a Clean Architecture 
//          manteniendo todos los tests pasando"

// IA refactoriza sin romper nada porque tests validan comportamiento
```

## Patrones TDD con IA

### Patrón 1: Test-First con IA

```kotlin
// 1. Escribe especificación
/*
 * Feature: Password Reset
 * - Request reset code via email
 * - Validate code (6 digits, expires in 10 min)
 * - Update password
 * - Invalidate all sessions
 */

// 2. IA genera tests
// Prompt: "Genera tests para Password Reset feature según spec"

// 3. Tests fallan (RED)

// 4. IA genera implementación
// Prompt: "Implementa PasswordResetViewModel para pasar los tests"

// 5. Tests pasan (GREEN)

// 6. IA refactoriza
// Prompt: "Refactoriza extrayendo validation logic"

// 7. Tests siguen pasando (REFACTOR)
```

### Patrón 2: Golden Master Testing

```kotlin
// IA genera tests de regresión completos:

@Test
fun `should match golden master output for complex calculation`() = runTest {
    // Arrange
    val inputs = loadGoldenMasterInputs()
    val expectedOutputs = loadGoldenMasterOutputs()
    
    // Act & Assert
    inputs.zip(expectedOutputs).forEach { (input, expected) ->
        val actual = calculator.calculate(input)
        assertThat(actual).isEqualTo(expected)
    }
}
```

### Patrón 3: Property-Based Testing

```kotlin
// IA genera property-based tests:

@Property
fun `user creation should always result in valid user`(
    @ForAll name: String,
    @ForAll email: String
) {
    // Arrange
    val result = userService.createUser(name, email)
    
    // Assert - properties that should always hold
    if (result.isSuccess) {
        val user = result.getOrNull()!!
        assertThat(user.id).isNotEmpty()
        assertThat(user.createdAt).isLessThanOrEqualTo(System.currentTimeMillis())
        assertThat(user.name).isEqualTo(name.trim())
    }
}
```

## Workflows Completos

### Workflow: Nueva Feature End-to-End

```kotlin
// Paso 1: Define Feature
/*
 * Feature: Shopping Cart
 * - Add/remove products
 * - Update quantities
 * - Calculate total with discounts
 * - Apply coupon codes
 * - Handle stock limitations
 */

// Paso 2: IA → Tests
"Genera tests completos para Shopping Cart feature"
// → Genera 40+ tests cubriendo todos los casos

// Paso 3: Tests fallan (RED)

// Paso 4: IA → Implementación
"Implementa ShoppingCartViewModel para pasar todos los tests"
// → Genera implementación completa

// Paso 5: Tests pasan (GREEN)

// Paso 6: IA → Refactor
"Refactoriza para mejorar performance y readability"
// → Código optimizado, tests siguen pasando

// Paso 7: IA → Documentación
"Genera KDoc completo basándote en tests y código"
// → Documentación perfectamente alineada

// Total time: 5-10 minutos
// Coverage: 95%+
// Quality: Production-ready
```

## Herramientas para TDD con IA

### JUnit5 + IA

```kotlin
// IA genera tests parametrizados automáticamente:
@ParameterizedTest
@CsvSource([
    "password123, false, 'No uppercase'",
    "PASSWORD123, false, 'No lowercase'",
    "Password, false, 'No number'",
    "Pass123, false, 'Too short'",
    "Password123, true, 'Valid'"
])
fun `should validate password strength`(
    password: String,
    expected: Boolean,
    reason: String
) {
    assertThat(validator.isStrong(password))
        .describedAs(reason)
        .isEqualTo(expected)
}
```

### MockK + IA

```kotlin
// IA genera mocks complejos:
@BeforeEach
fun setup() {
    // IA genera setup completo con comportamiento realista
    coEvery { 
        apiService.getProducts(any(), any()) 
    } answers {
        val page = firstArg<Int>()
        val size = secondArg<Int>()
        Response.success(generateMockProducts(page, size))
    }
    
    coEvery { 
        database.getProducts() 
    } returns flowOf(cachedProducts)
    
    every { 
        networkMonitor.isOnline 
    } returns flowOf(true)
}
```

### Turbine + IA

```kotlin
// IA genera tests de Flow complejos:
@Test
fun `should emit multiple states in correct order`() = runTest {
    // Act
    viewModel.loadData()
    
    // Assert
    viewModel.uiState.test {
        assertThat(awaitItem()).isEqualTo(UiState.Idle)
        assertThat(awaitItem()).isEqualTo(UiState.Loading)
        
        val success = awaitItem() as UiState.Success
        assertThat(success.data).isNotEmpty()
        
        ensureAllEventsConsumed()
    }
}
```

## Mejores Prácticas

### 1. Specs Primero, Siempre

```kotlin
// ❌ MAL: Implementar directo
class UserViewModel { ... }

// ✅ BIEN: Spec → Tests → Implementación
/*
 * Feature Spec:
 * - Load users with pagination
 * - Search with debounce
 * - Handle errors gracefully
 */

@Test  // Tests primero
fun `should load users on init`() { ... }

class UserViewModel { ... }  // Implementación después
```

### 2. Tests Descriptivos

```kotlin
// ❌ MAL: Nombres crípticos
@Test
fun testLogin() { ... }

// ✅ BIEN: Nombres descriptivos
@Test
fun `should emit success state when login credentials are valid`() { ... }
```

### 3. Arrange-Act-Assert

```kotlin
@Test
fun `should calculate discount correctly`() = runTest {
    // Arrange - Setup
    val cart = ShoppingCart(listOf(
        Product("1", price = 100.0),
        Product("2", price = 50.0)
    ))
    val coupon = Coupon("SAVE20", discountPercent = 20)
    
    // Act - Execute
    val total = cart.applyDiscount(coupon)
    
    // Assert - Verify
    assertThat(total).isEqualTo(120.0) // (150 - 20%)
}
```

### 4. Un Concepto por Test

```kotlin
// ❌ MAL: Test que verifica múltiples cosas
@Test
fun testEverything() {
    // Verifica login
    // Verifica navegación
    // Verifica logout
    // ...
}

// ✅ BIEN: Un concepto por test
@Test
fun `should navigate to home after successful login`()

@Test
fun `should clear session on logout`()
```

## Conclusión

**TDD con IA** es el futuro del desarrollo de calidad. La combinación de:
- Tests comprehensivos generados por IA
- Implementaciones que pasan tests automáticamente
- Refactorings seguros con tests como red de seguridad

Resulta en:
- ✅ **10x velocidad** en desarrollo
- ✅ **95%+ cobertura** automáticamente
- ✅ **Código de calidad** desde el inicio
- ✅ **Refactoring confiado** siempre
- ✅ **Documentación viva** en tests

**Tu siguiente paso:**
Toma tu próxima feature y aplica TDD con IA:
1. Define spec clara
2. IA genera tests
3. IA genera implementación
4. IA refactoriza
5. Repite

Observa cómo tu productividad y calidad se disparan.
