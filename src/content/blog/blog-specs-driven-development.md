---
title: "Specs-Driven Development con Agentes IA: El Futuro del Desarrollo Android"
description: "Aprende cómo Specification-Driven Development (SDD) combinado con agentes de IA transforma la manera de construir aplicaciones Android robustas y mantenibles."
pubDate: "2025-12-29"
heroImage: "/images/placeholder-article-specs-driven.svg"
tags: ["AI", "Android", "Desarrollo", "TDD", "Specs", "GitHub Copilot", "Gemini"]
---

## ¿Qué es Specs-Driven Development?

**Specification-Driven Development (SDD)** es una metodología donde escribes especificaciones detalladas de comportamiento antes de implementar el código. A diferencia de TDD (Test-Driven Development) que comienza con tests, SDD comienza con especificaciones en lenguaje natural o semi-formal que describen exactamente qué debe hacer el código.

Cuando combinas SDD con agentes de IA como GitHub Copilot o Gemini, obtienes un superpoder: **las especificaciones se convierten automáticamente en código funcional**.

### La Evolución del Desarrollo

```
TDD: Test → Implementation → Refactor
BDD: Behavior Spec → Test → Implementation
SDD con IA: Specification → AI Generated Code + Tests → Review
```

## Por Qué SDD con IA es Poderoso

### 1. Claridad de Intención
Las especificaciones fuerzan a pensar en el "qué" antes del "cómo":

```markdown
# Especificación: User Authentication Feature

## Overview
Sistema de autenticación con email/password que soporta:
- Login con credenciales
- Registro de nuevos usuarios
- Recuperación de contraseña
- Sesión persistente

## User Stories

### US-001: Login exitoso
**Given** un usuario registrado con email "user@example.com" y password "Password123!"
**When** el usuario ingresa credenciales correctas
**Then** el sistema debe:
- Validar credenciales contra el backend
- Guardar token de sesión de forma segura (EncryptedSharedPreferences)
- Navegar a la pantalla principal
- Emitir evento de login exitoso

### US-002: Login fallido
**Given** un usuario intenta hacer login
**When** las credenciales son incorrectas
**Then** el sistema debe:
- Mostrar mensaje de error específico
- No navegar a otra pantalla
- Permitir reintentar
- Registrar intento fallido (max 5 intentos antes de bloqueo temporal)

### US-003: Login con sesión existente
**Given** un usuario con sesión válida guardada
**When** la app inicia
**Then** el sistema debe:
- Verificar validez del token
- Si válido: navegar directamente a pantalla principal
- Si inválido: mostrar pantalla de login
```

### 2. Generación Automática de Código
Con la especificación clara, el agente de IA genera implementación completa:

```kotlin
// Generado por IA basado en la especificación

/**
 * Use case para autenticar usuario.
 * Implementa US-001, US-002 según especificación.
 */
class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager,
    private val loginAttemptTracker: LoginAttemptTracker
) {
    /**
     * Ejecuta el login del usuario.
     * 
     * @param email Email del usuario
     * @param password Password en texto plano (será hasheado)
     * @return Result con el usuario autenticado o error específico
     * @throws MaxLoginAttemptsException si se exceden 5 intentos
     */
    suspend operator fun invoke(
        email: String,
        password: String
    ): Result<User> {
        // Verificar intentos previos (US-002)
        if (loginAttemptTracker.isBlocked(email)) {
            return Result.failure(
                MaxLoginAttemptsException("Demasiados intentos. Intenta en 15 minutos.")
            )
        }
        
        // Validar formato de email
        if (!email.isValidEmail()) {
            return Result.failure(
                ValidationException("Email inválido")
            )
        }
        
        // Intentar autenticación (US-001)
        return try {
            val authResponse = authRepository.login(email, password)
            
            // Guardar sesión de forma segura (US-001)
            sessionManager.saveSession(
                token = authResponse.token,
                refreshToken = authResponse.refreshToken,
                userId = authResponse.userId
            )
            
            // Reset intentos fallidos en login exitoso
            loginAttemptTracker.resetAttempts(email)
            
            // Emitir evento de login exitoso
            eventBus.emit(LoginSuccessEvent(authResponse.user))
            
            Result.success(authResponse.user)
        } catch (e: InvalidCredentialsException) {
            // Registrar intento fallido (US-002)
            loginAttemptTracker.recordFailedAttempt(email)
            Result.failure(e)
        } catch (e: Exception) {
            Result.failure(NetworkException("Error de conexión", e))
        }
    }
}

/**
 * ViewModel que maneja el estado de login.
 * Implementa flujo de UI para US-001, US-002.
 */
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val checkSessionUseCase: CheckSessionUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    init {
        // Implementa US-003: Verificar sesión existente
        checkExistingSession()
    }
    
    /**
     * Verifica si existe sesión válida (US-003).
     */
    private fun checkExistingSession() {
        viewModelScope.launch {
            _uiState.value = LoginUiState.CheckingSession
            
            when (val result = checkSessionUseCase()) {
                is Result.Success -> {
                    // Sesión válida: navegar a home
                    _uiState.value = LoginUiState.SessionValid(result.data)
                }
                is Result.Error -> {
                    // Sesión inválida o no existe: mostrar login
                    _uiState.value = LoginUiState.Idle
                }
            }
        }
    }
    
    /**
     * Ejecuta login con credenciales (US-001, US-002).
     */
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            
            when (val result = loginUseCase(email, password)) {
                is Result.Success -> {
                    _uiState.value = LoginUiState.Success(result.data)
                }
                is Result.Error -> {
                    val errorMessage = when (result.exception) {
                        is InvalidCredentialsException -> 
                            "Email o contraseña incorrectos"
                        is MaxLoginAttemptsException -> 
                            result.exception.message ?: "Demasiados intentos"
                        is ValidationException -> 
                            result.exception.message ?: "Datos inválidos"
                        else -> 
                            "Error al iniciar sesión. Intenta nuevamente."
                    }
                    _uiState.value = LoginUiState.Error(errorMessage)
                }
            }
        }
    }
    
    fun resetError() {
        if (_uiState.value is LoginUiState.Error) {
            _uiState.value = LoginUiState.Idle
        }
    }
}

sealed interface LoginUiState {
    object Idle : LoginUiState
    object CheckingSession : LoginUiState
    object Loading : LoginUiState
    data class Success(val user: User) : LoginUiState
    data class SessionValid(val user: User) : LoginUiState
    data class Error(val message: String) : LoginUiState
}
```

### 3. Tests Generados Automáticamente
La especificación también genera los tests:

```kotlin
/**
 * Tests para LoginUseCase basados en especificación.
 * Cubre US-001, US-002, US-003.
 */
@ExperimentalCoroutinesApi
class LoginUseCaseTest {
    
    private lateinit var useCase: LoginUseCase
    private val mockRepository = mockk<AuthRepository>()
    private val mockSessionManager = mockk<SessionManager>()
    private val mockAttemptTracker = mockk<LoginAttemptTracker>()
    
    @Before
    fun setup() {
        useCase = LoginUseCase(
            mockRepository,
            mockSessionManager,
            mockAttemptTracker
        )
    }
    
    @Nested
    @DisplayName("US-001: Login exitoso")
    inner class LoginSuccess {
        
        @Test
        fun `should save session securely when login succeeds`() = runTest {
            // Arrange
            val email = "user@example.com"
            val password = "Password123!"
            val authResponse = AuthResponse(
                token = "valid-token",
                refreshToken = "refresh-token",
                userId = "user-id",
                user = User(id = "user-id", email = email)
            )
            
            coEvery { mockAttemptTracker.isBlocked(email) } returns false
            coEvery { mockRepository.login(email, password) } returns authResponse
            coEvery { mockSessionManager.saveSession(any(), any(), any()) } just Runs
            
            // Act
            val result = useCase(email, password)
            
            // Assert
            assertTrue(result.isSuccess)
            coVerify {
                mockSessionManager.saveSession(
                    token = "valid-token",
                    refreshToken = "refresh-token",
                    userId = "user-id"
                )
            }
        }
        
        @Test
        fun `should reset failed attempts on successful login`() = runTest {
            // Arrange
            val email = "user@example.com"
            val authResponse = AuthResponse(
                token = "token",
                refreshToken = "refresh",
                userId = "id",
                user = User(id = "id", email = email)
            )
            
            coEvery { mockAttemptTracker.isBlocked(email) } returns false
            coEvery { mockRepository.login(any(), any()) } returns authResponse
            coEvery { mockSessionManager.saveSession(any(), any(), any()) } just Runs
            coEvery { mockAttemptTracker.resetAttempts(email) } just Runs
            
            // Act
            useCase(email, "password")
            
            // Assert
            coVerify { mockAttemptTracker.resetAttempts(email) }
        }
    }
    
    @Nested
    @DisplayName("US-002: Login fallido")
    inner class LoginFailure {
        
        @Test
        fun `should show specific error message for invalid credentials`() = runTest {
            // Arrange
            val email = "user@example.com"
            val password = "WrongPassword"
            
            coEvery { mockAttemptTracker.isBlocked(email) } returns false
            coEvery { 
                mockRepository.login(email, password) 
            } throws InvalidCredentialsException()
            coEvery { mockAttemptTracker.recordFailedAttempt(email) } just Runs
            
            // Act
            val result = useCase(email, password)
            
            // Assert
            assertTrue(result.isFailure)
            assertTrue(result.exceptionOrNull() is InvalidCredentialsException)
        }
        
        @Test
        fun `should record failed attempt when credentials are wrong`() = runTest {
            // Arrange
            val email = "user@example.com"
            
            coEvery { mockAttemptTracker.isBlocked(email) } returns false
            coEvery { 
                mockRepository.login(any(), any()) 
            } throws InvalidCredentialsException()
            coEvery { mockAttemptTracker.recordFailedAttempt(email) } just Runs
            
            // Act
            useCase(email, "wrong-password")
            
            // Assert
            coVerify { mockAttemptTracker.recordFailedAttempt(email) }
        }
        
        @Test
        fun `should block login after 5 failed attempts`() = runTest {
            // Arrange
            val email = "user@example.com"
            
            coEvery { mockAttemptTracker.isBlocked(email) } returns true
            
            // Act
            val result = useCase(email, "any-password")
            
            // Assert
            assertTrue(result.isFailure)
            assertTrue(result.exceptionOrNull() is MaxLoginAttemptsException)
            
            // Verificar que no se intentó login real
            coVerify(exactly = 0) { mockRepository.login(any(), any()) }
        }
    }
    
    @Nested
    @DisplayName("Validaciones")
    inner class Validation {
        
        @Test
        fun `should fail when email format is invalid`() = runTest {
            // Arrange
            val invalidEmail = "not-an-email"
            
            coEvery { mockAttemptTracker.isBlocked(any()) } returns false
            
            // Act
            val result = useCase(invalidEmail, "password")
            
            // Assert
            assertTrue(result.isFailure)
            assertTrue(result.exceptionOrNull() is ValidationException)
            
            // No debe intentar login con email inválido
            coVerify(exactly = 0) { mockRepository.login(any(), any()) }
        }
    }
}
```

## Workflow Completo de SDD con IA

### Paso 1: Escribir Especificación Detallada

```markdown
# Specification: User Profile Feature

## Feature Overview
Pantalla de perfil de usuario que permite visualizar y editar información personal.

## Requirements

### R-001: Display User Information
- Mostrar foto de perfil (o avatar por defecto)
- Nombre completo (editable)
- Email (no editable, mostrar verificado/no verificado)
- Teléfono (opcional, editable)
- Bio (opcional, editable, máximo 200 caracteres)

### R-002: Edit Profile
- Botón de editar que activa modo edición
- Validación en tiempo real de campos
- Botón guardar (solo habilitado si hay cambios válidos)
- Botón cancelar para descartar cambios
- Loading state durante guardado
- Confirmación de éxito con SnackBar

### R-003: Profile Picture
- Click en foto abre selector de imagen
- Opciones: Cámara, Galería, Remover foto
- Crop circular de imagen seleccionada
- Upload asíncrono con indicador de progreso
- Rollback si upload falla

### R-004: Validations
- Nombre: mínimo 2 caracteres, máximo 50
- Teléfono: formato internacional válido (si provisto)
- Bio: máximo 200 caracteres, contador visible
- Email: solo lectura (cambio requiere verificación separada)

### R-005: Error Handling
- Network errors: mostrar retry action
- Validation errors: mostrar inline en campo
- Permission denied (cámara/storage): explicar y ofrecer ir a settings
- Conflictos de versión: ofrecer refresh

## UI Specs

### States
```kotlin
sealed interface ProfileUiState {
    object Loading : ProfileUiState
    data class Display(val user: User) : ProfileUiState
    data class Editing(
        val user: User,
        val editedUser: User,
        val validationErrors: Map<Field, String> = emptyMap(),
        val hasChanges: Boolean = false
    ) : ProfileUiState
    data class Saving(val user: User) : ProfileUiState
    data class Error(val message: String, val canRetry: Boolean) : ProfileUiState
}
```

### User Interactions
- onEditClick() -> Cambia a modo edición
- onFieldChange(field, value) -> Actualiza campo y valida
- onSaveClick() -> Guarda cambios si validaciones pasan
- onCancelClick() -> Descarta cambios y vuelve a display
- onProfilePictureClick() -> Abre selector de imagen
- onRetryClick() -> Reintenta operación fallida
```

### Paso 2: Generar Código con IA

Usando GitHub Copilot o Gemini:

```
Prompt: "Basándote en la especificación R-001 a R-005, genera:
1. Data models (User, ValidationError, etc)
2. Repository con operaciones CRUD
3. Use cases para cada operación
4. ViewModel con manejo de estados
5. UI Composable para perfil
6. Tests unitarios completos"
```

### Paso 3: Review y Refinamiento

```kotlin
// Código generado por IA - revisamos y refinamos si es necesario

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase,
    private val updateUserUseCase: UpdateUserUseCase,
    private val uploadProfilePictureUseCase: UploadProfilePictureUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val userId: String = checkNotNull(savedStateHandle["userId"])
    
    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()
    
    init {
        loadProfile()
    }
    
    private fun loadProfile() {
        viewModelScope.launch {
            getUserUseCase(userId)
                .catch { error ->
                    _uiState.value = ProfileUiState.Error(
                        message = "Error al cargar perfil",
                        canRetry = true
                    )
                }
                .collect { result ->
                    _uiState.value = when (result) {
                        is Result.Success -> ProfileUiState.Display(result.data)
                        is Result.Error -> ProfileUiState.Error(
                            message = result.exception.message ?: "Error desconocido",
                            canRetry = true
                        )
                    }
                }
        }
    }
    
    fun onEditClick() {
        val currentState = _uiState.value
        if (currentState is ProfileUiState.Display) {
            _uiState.value = ProfileUiState.Editing(
                user = currentState.user,
                editedUser = currentState.user.copy()
            )
        }
    }
    
    fun onFieldChange(field: ProfileField, value: String) {
        val currentState = _uiState.value
        if (currentState is ProfileUiState.Editing) {
            // Actualizar campo editado
            val updatedUser = when (field) {
                ProfileField.NAME -> currentState.editedUser.copy(name = value)
                ProfileField.PHONE -> currentState.editedUser.copy(phone = value)
                ProfileField.BIO -> currentState.editedUser.copy(bio = value)
                ProfileField.EMAIL -> currentState.editedUser // Email no editable
            }
            
            // Validar cambios (R-004)
            val validationErrors = validateUser(updatedUser)
            val hasChanges = updatedUser != currentState.user
            
            _uiState.value = currentState.copy(
                editedUser = updatedUser,
                validationErrors = validationErrors,
                hasChanges = hasChanges
            )
        }
    }
    
    private fun validateUser(user: User): Map<ProfileField, String> {
        val errors = mutableMapOf<ProfileField, String>()
        
        // R-004: Validaciones
        if (user.name.length < 2) {
            errors[ProfileField.NAME] = "Nombre debe tener al menos 2 caracteres"
        } else if (user.name.length > 50) {
            errors[ProfileField.NAME] = "Nombre no puede exceder 50 caracteres"
        }
        
        if (user.phone?.isNotEmpty() == true && !user.phone.isValidPhoneNumber()) {
            errors[ProfileField.PHONE] = "Formato de teléfono inválido"
        }
        
        if (user.bio != null && user.bio.length > 200) {
            errors[ProfileField.BIO] = "Bio no puede exceder 200 caracteres"
        }
        
        return errors
    }
    
    fun onSaveClick() {
        val currentState = _uiState.value
        if (currentState is ProfileUiState.Editing && 
            currentState.validationErrors.isEmpty() &&
            currentState.hasChanges) {
            
            viewModelScope.launch {
                _uiState.value = ProfileUiState.Saving(currentState.editedUser)
                
                when (val result = updateUserUseCase(currentState.editedUser)) {
                    is Result.Success -> {
                        _uiState.value = ProfileUiState.Display(result.data)
                        // Mostrar confirmación de éxito (R-002)
                        _snackbarMessage.emit("Perfil actualizado exitosamente")
                    }
                    is Result.Error -> {
                        _uiState.value = ProfileUiState.Error(
                            message = "Error al guardar cambios",
                            canRetry = true
                        )
                    }
                }
            }
        }
    }
    
    fun onCancelClick() {
        val currentState = _uiState.value
        if (currentState is ProfileUiState.Editing) {
            _uiState.value = ProfileUiState.Display(currentState.user)
        }
    }
    
    fun onProfilePictureClick() {
        // R-003: Selector de imagen
        viewModelScope.launch {
            _showImagePicker.emit(Unit)
        }
    }
    
    fun onImageSelected(uri: Uri) {
        viewModelScope.launch {
            when (val result = uploadProfilePictureUseCase(userId, uri)) {
                is Result.Success -> {
                    // Actualizar foto en el estado
                    val currentState = _uiState.value
                    if (currentState is ProfileUiState.Display) {
                        _uiState.value = currentState.copy(
                            user = currentState.user.copy(
                                profilePictureUrl = result.data
                            )
                        )
                    }
                    _snackbarMessage.emit("Foto actualizada")
                }
                is Result.Error -> {
                    _snackbarMessage.emit("Error al subir foto")
                }
            }
        }
    }
}

enum class ProfileField {
    NAME, EMAIL, PHONE, BIO
}
```

## Ventajas de SDD con IA en Android

### 1. **Documentación que No Envejece**
Las especificaciones son código vivo:

```markdown
# Cada feature tiene su spec
features/
├── auth/
│   ├── SPEC.md           # Especificación
│   ├── implementation/   # Código generado
│   └── tests/           # Tests generados
├── profile/
│   ├── SPEC.md
│   ├── implementation/
│   └── tests/
└── payment/
    ├── SPEC.md
    ├── implementation/
    └── tests/
```

### 2. **Onboarding Acelerado**
Nuevos desarrolladores leen specs, no código:

```markdown
# Para entender el feature de Profile:
1. Lee profile/SPEC.md (10 minutos)
2. El código es auto-explicativo porque sigue la spec
3. Los tests verifican cada requirement de la spec
```

### 3. **Menos Bugs, Más Cobertura**
Specs detalladas generan tests comprehensivos:

```kotlin
// Cada requirement en la spec genera múltiples tests
@Nested
@DisplayName("R-004: Validations")
inner class ProfileValidations {
    
    @Test
    fun `name should reject less than 2 characters`()
    
    @Test
    fun `name should reject more than 50 characters`()
    
    @Test
    fun `phone should validate international format`()
    
    @Test
    fun `bio should reject more than 200 characters`()
    
    @Test
    fun `email should be read-only`()
}
```

### 4. **Refactoring Seguro**
Specs permiten regenerar código manteniendo comportamiento:

```bash
# Necesitas refactor? Regenera desde spec
$ ai-codegen --spec features/profile/SPEC.md \
             --architecture clean-architecture-v2 \
             --output features/profile/implementation/

# Los tests verifican que el comportamiento se mantiene
$ ./gradlew test
```

## Mejores Prácticas para SDD con IA

### 1. Specs Atómicas y Verificables

```markdown
❌ MAL:
## Requirement
El usuario debe poder editar su perfil.

✅ BIEN:
## R-002: Edit Profile
**Given** el usuario está en modo visualización de perfil
**When** presiona el botón "Editar"
**Then** el sistema debe:
  - Cambiar a modo edición
  - Habilitar campos editables (nombre, teléfono, bio)
  - Deshabilitar campo email (read-only)
  - Mostrar botones "Guardar" y "Cancelar"
  - Habilitar "Guardar" solo cuando hay cambios válidos
  
**Validation Rules:**
- Nombre: 2-50 caracteres
- Teléfono: formato internacional (opcional)
- Bio: máx 200 caracteres (opcional)

**Error Cases:**
- Si no hay cambios: "Guardar" permanece deshabilitado
- Si hay errores de validación: mostrar inline en campo
- Si falla guardado: mostrar error y mantener ediciones
```

### 2. Specs con Ejemplos Concretos

```markdown
## R-005: Password Validation

### Valid Examples
✅ "Password123!" (mayúscula, minúscula, número, especial)
✅ "MyP@ssw0rd" (8+ caracteres, todos los tipos)
✅ "Secure#2024" (dentro de límites)

### Invalid Examples
❌ "password" (sin mayúscula, sin número, sin especial)
❌ "Pass1!" (menos de 8 caracteres)
❌ "PASSWORD123!" (sin minúscula)
❌ "Password123" (sin carácter especial)

### Implementation Rules
- Mínimo 8 caracteres, máximo 128
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial (!@#$%^&*)
```

### 3. Specs con Criterios de Aceptación Medibles

```markdown
## R-006: Performance Requirements

### Loading Time
- **Target**: Carga inicial < 2 segundos (P95)
- **Acceptable**: < 3 segundos (P99)
- **Measurement**: Desde viewModel.init() hasta primer render

### Memory Usage
- **Target**: < 50MB heap durante operación normal
- **Peak**: < 100MB durante procesamiento de imágenes
- **Measurement**: Android Studio Profiler

### Network Efficiency
- **Target**: < 500KB por carga de perfil
- **Caching**: Imágenes cacheadas localmente (max 7 días)
- **Offline**: Mostrar datos cacheados si no hay red

### Acceptance Criteria
```kotlin
@Test
fun `profile should load within 2 seconds`() = runTest {
    val startTime = System.currentTimeMillis()
    
    viewModel.loadProfile()
    viewModel.uiState.first { it is ProfileUiState.Display }
    
    val loadTime = System.currentTimeMillis() - startTime
    assertThat(loadTime).isLessThan(2000)
}
```
```

### 4. Integración con CI/CD

```yaml
# .github/workflows/spec-validation.yml
name: Validate Specifications

on: [pull_request]

jobs:
  validate-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check all features have specs
        run: |
          for feature_dir in features/*/; do
            if [ ! -f "${feature_dir}SPEC.md" ]; then
              echo "Missing SPEC.md in ${feature_dir}"
              exit 1
            fi
          done
      
      - name: Validate spec format
        run: |
          # Verificar que specs contengan secciones requeridas
          python scripts/validate_specs.py
      
      - name: Generate code from specs
        run: |
          # Regenerar código con IA y verificar que compila
          ./scripts/generate_from_specs.sh --dry-run
      
      - name: Run tests generated from specs
        run: ./gradlew test
```

## Herramientas para SDD con IA

### GitHub Copilot con Specs

```markdown
# En el archivo SPEC.md

# AI Generation Instructions
Genera el siguiente código basándote en las especificaciones R-001 a R-006:

1. Domain Models (features/profile/domain/model/)
2. Repository Interface (features/profile/domain/repository/)
3. Use Cases (features/profile/domain/usecase/)
4. Repository Implementation (features/profile/data/repository/)
5. ViewModel (features/profile/presentation/viewmodel/)
6. UI Composables (features/profile/presentation/ui/)
7. Unit Tests (features/profile/test/)

Seguir guidelines de agents.md para arquitectura y convenciones.
```

### Gemini Code Assist con Specs

```python
# Script para generar código desde specs con Gemini

import google.generativeai as genai

def generate_from_spec(spec_file: str, output_dir: str):
    # Leer especificación
    with open(spec_file, 'r') as f:
        spec_content = f.read()
    
    # Leer convenciones del proyecto
    with open('agents.md', 'r') as f:
        agents_content = f.read()
    
    # Prompt para Gemini
    prompt = f"""
    Basándote en la siguiente especificación y las convenciones del proyecto,
    genera código Android completo incluyendo:
    - Data models
    - Repository con implementación
    - Use cases
    - ViewModel con manejo de estados
    - Composables para UI
    - Tests unitarios completos
    
    ESPECIFICACIÓN:
    {spec_content}
    
    CONVENCIONES DEL PROYECTO:
    {agents_content}
    
    Genera código siguiendo Clean Architecture y MVVM.
    Incluye documentación KDoc completa.
    """
    
    model = genai.GenerativeModel('gemini-1.5-pro')
    response = model.generate_content(prompt)
    
    # Procesar y guardar código generado
    save_generated_code(response.text, output_dir)
```

## Casos de Uso Reales

### Caso: Nueva Feature de Búsqueda

```markdown
# SPEC: Search Feature

## R-001: Search Bar
**Given** el usuario está en la pantalla principal
**When** toca el icono de búsqueda
**Then** muestra:
- Input field con hint "Buscar..."
- Botón clear (solo visible con texto)
- Lista de búsquedas recientes (max 10)
- Categorías sugeridas

## R-002: Real-time Search
**Given** el usuario está escribiendo en búsqueda
**When** escribe al menos 3 caracteres
**Then** el sistema debe:
- Debounce input (300ms)
- Mostrar loading indicator
- Realizar búsqueda en backend
- Mostrar resultados agrupados por tipo
- Destacar texto coincidente

## R-003: Search Results
Mostrar resultados en secciones:
- Usuarios (max 5)
- Posts (max 10)
- Tags (max 5)
- Botón "Ver más" en cada sección

## R-004: Empty States
- Sin query: Mostrar recientes y sugerencias
- Sin resultados: Mensaje + botón para ajustar filtros
- Error de red: Mensaje + botón retry

## R-005: Performance
- Búsqueda debe completar en < 500ms (P95)
- Cache de resultados por 5 minutos
- Cancelar búsquedas anteriores si hay nueva
```

Con esta spec, le pides a la IA:
"Genera implementación completa de Search Feature según SPEC"

Y obtienes código completo, tests y documentación.

## Conclusión

**Specification-Driven Development con IA** representa un cambio de paradigma en cómo desarrollamos software. En lugar de traducir manualmente ideas a código, escribimos especificaciones claras y dejamos que la IA genere implementaciones consistentes y bien testeadas.

**Beneficios clave:**
- ✅ **Claridad**: Specs forzan a pensar antes de codificar
- ✅ **Velocidad**: Generación automática de código y tests
- ✅ **Calidad**: Cobertura completa y consistencia garantizada
- ✅ **Documentación**: Specs son documentación viva
- ✅ **Colaboración**: Specs son lenguaje común entre stakeholders y devs

**Para empezar:**
1. Escribe una spec detallada para tu próxima feature
2. Usa GitHub Copilot o Gemini para generar código
3. Revisa y refina el código generado
4. Ejecuta tests (también generados)
5. Itera basándote en resultados

El futuro del desarrollo no es escribir menos código, es **especificar mejor qué código queremos** y dejar que la IA lo materialice siguiendo nuestras mejores prácticas.
