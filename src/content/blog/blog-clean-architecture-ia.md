---
title: "Arquitectura Limpia con Asistencia IA: Mantén Clean Architecture con Agentes"
description: "Descubre cómo los agentes de IA ayudan a implementar y mantener Clean Architecture en proyectos Android, garantizando separación de capas y principios SOLID."
pubDate: "2025-12-29"
heroImage: "/images/placeholder-article-clean-arch-ia.svg"
tags: ["AI", "Clean Architecture", "Android", "SOLID", "Arquitectura", "GitHub Copilot"]
---

## El Desafío de Clean Architecture

**Clean Architecture** es un ideal que todos queremos alcanzar:
- 🎯 Separación clara de capas
- 🔄 Testabilidad completa
- 🔌 Independencia de frameworks
- 📦 Código mantenible y escalable

Pero la realidad es más compleja:
- 😰 Difícil de implementar correctamente
- 🤔 Fácil de violar sin querer
- 💼 Requiere disciplina constante del equipo
- ⏰ Presión por features rápidas

**IA al rescate:** Los agentes de IA pueden ser tus guardianes de Clean Architecture, asegurando que cada nuevo código siga los principios, sugiriendo refactorings cuando hay violaciones, y educando al equipo continuamente.

## Clean Architecture: Repaso Rápido

```
┌─────────────────────────────────────────┐
│          PRESENTATION                    │
│  (UI, ViewModels, Composables)          │
│  • StateFlow/LiveData                    │
│  • UI Events                             │
│  • Navigation                            │
└──────────────┬──────────────────────────┘
               │ depende de ↓
┌──────────────┴──────────────────────────┐
│          DOMAIN                          │
│  (Models, UseCases, Repositories)        │
│  • Business Logic                        │
│  • Pure Kotlin                           │
│  • No Android deps                       │
└──────────────┬──────────────────────────┘
               │ depende de ↓
┌──────────────┴──────────────────────────┐
│          DATA                            │
│  (Repository Impl, DataSources, DTOs)    │
│  • Room, Retrofit                        │
│  • Mappers                               │
│  • Cache Strategy                        │
└─────────────────────────────────────────┘

Reglas:
→ Presentation depende de Domain
→ Domain NO depende de Data ni Presentation
→ Data depende de Domain (implementa interfaces)
```

## IA Como Guardian de Arquitectura

### Guardian 1: Detectar Violaciones de Capas

```kotlin
// ❌ VIOLACIÓN DETECTADA POR IA:

// En capa DOMAIN:
package com.app.domain.usecase

import com.app.data.api.UserApiService  // ❌ Domain depende de Data!
import androidx.lifecycle.ViewModel      // ❌ Domain depende de Android!

class GetUserUseCase(
    private val apiService: UserApiService  // ❌ Domain tiene implementación concreta
) {
    suspend fun execute(id: String): User {
        val dto = apiService.getUser(id)  // ❌ Domain hace llamada directa a API
        return User(dto.id, dto.name)
    }
}

// ✅ IA COMENTA:
"""
🚨 **Clean Architecture Violation**

**Problemas detectados:**
1. Domain layer importa de Data layer (línea 3)
2. Domain layer importa Android framework (línea 4)
3. Domain tiene dependencia concreta de API service (línea 7)
4. Domain hace operación I/O directamente (línea 10)

**Reglas violadas:**
- Domain debe ser independiente de frameworks
- Domain solo debe depender de abstracciones
- Domain no debe tener implementaciones de I/O

**Arquitectura correcta:**
```kotlin
// En DOMAIN layer - Solo interfaces y modelos

package com.app.domain.model

data class User(
    val id: String,
    val name: String,
    val email: String
)

package com.app.domain.repository

interface UserRepository {
    suspend fun getUser(id: String): Result<User>
}

package com.app.domain.usecase

class GetUserUseCase @Inject constructor(
    private val repository: UserRepository  // ✅ Dependencia de abstracción
) {
    suspend operator fun invoke(id: String): Result<User> {
        return repository.getUser(id)  // ✅ Delega a repository
    }
}

// En DATA layer - Implementaciones

package com.app.data.repository

class UserRepositoryImpl @Inject constructor(
    private val apiService: UserApiService,
    private val userDao: UserDao
) : UserRepository {
    
    override suspend fun getUser(id: String): Result<User> {
        // Implementación con API y cache
    }
}
```

**Impacto de la violación:**
🔴 HIGH
- Testing difícil (dependencia de API real)
- Domain no reutilizable
- Violación de Dependency Inversion Principle
- Coupling alto entre capas

**Referencias:**
- [Clean Architecture by Uncle Bob](...)
- [Android Architecture Guidelines](...)
"""
```

### Guardian 2: Verificar Dependency Rule

```kotlin
// IA analiza TODAS las imports y detecta violaciones

// ❌ VIOLACIÓN:
// Archivo: data/repository/UserRepositoryImpl.kt
package com.app.data.repository

import com.app.presentation.viewmodel.UserViewModel  // ❌ Data → Presentation

class UserRepositoryImpl {
    fun getUser(): User {
        // Algún código que referencia ViewModel
    }
}

// ✅ IA COMENTA:
"""
🚨 **Dependency Rule Violation**

Data layer está importando de Presentation layer.

**Flujo correcto de dependencias:**
Presentation → Domain → Data

**Flujo INCORRECTO detectado:**
Data → Presentation (CIRCULAR!)

**Problema:**
Las capas internas (Data) no deben conocer capas externas (Presentation).

**Solución:**
Elimina cualquier referencia a Presentation desde Data.
Si necesitas comunicación, usa eventos/callbacks a través de Domain.

**Ejemplo correcto:**
```kotlin
// Data layer
class UserRepositoryImpl : UserRepository {
    override fun getUser(): Flow<Result<User>> = flow {
        // Implementación sin conocer Presentation
    }
}

// Domain layer  
interface UserRepository {
    fun getUser(): Flow<Result<User>>
}

// Presentation layer
@HiltViewModel
class UserViewModel @Inject constructor(
    private val repository: UserRepository  // ✅ Presentation → Domain
) : ViewModel()
```
"""
```

### Guardian 3: Enforcer de SOLID Principles

```kotlin
// ❌ VIOLACIÓN: Single Responsibility

class UserManager @Inject constructor(
    private val api: UserApiService,
    private val database: AppDatabase,
    private val analytics: Analytics,
    private val preferences: SharedPreferences
) {
    // Gestión de usuarios
    suspend fun createUser(name: String) { ... }
    suspend fun deleteUser(id: String) { ... }
    
    // Analytics
    fun trackUserEvent(event: String) { ... }
    fun logUserActivity(activity: String) { ... }
    
    // Preferences
    fun saveUserSettings(settings: Settings) { ... }
    fun getUserTheme(): Theme { ... }
    
    // Validación
    fun validateEmail(email: String): Boolean { ... }
    fun validatePassword(password: String): Boolean { ... }
    
    // Networking
    suspend fun syncUserData() { ... }
    suspend fun uploadUserPhoto(photo: Bitmap) { ... }
}

// ✅ IA COMENTA:
"""
🚨 **SOLID Violation: Single Responsibility Principle**

UserManager tiene múltiples responsabilidades:
1. Gestión CRUD de usuarios
2. Analytics/Tracking
3. Preferences/Settings  
4. Validación
5. Sincronización de red

**Problemas:**
- Hard to test (muchas dependencias)
- Hard to maintain (cambios afectan múltiples áreas)
- High coupling
- Low cohesion

**Métrica:**
- Responsabilidades: 5
- Máximo recomendado: 1
- Líneas de código: ~300
- Dependencias: 4

**Refactoring a Clean Architecture:**

```kotlin
// 1. User Repository (CRUD)
interface UserRepository {
    suspend fun createUser(name: String): Result<User>
    suspend fun deleteUser(id: String): Result<Unit>
}

class UserRepositoryImpl @Inject constructor(
    private val apiService: UserApiService,
    private val userDao: UserDao
) : UserRepository { ... }

// 2. Analytics Service
interface AnalyticsService {
    fun trackEvent(event: String)
    fun logActivity(activity: String)
}

class AnalyticsServiceImpl @Inject constructor(
    private val analytics: Analytics
) : AnalyticsService { ... }

// 3. User Preferences
interface UserPreferences {
    suspend fun saveSettings(settings: Settings)
    suspend fun getTheme(): Theme
}

class UserPreferencesImpl @Inject constructor(
    private val dataStore: DataStore<Preferences>
) : UserPreferences { ... }

// 4. Validator
interface Validator {
    fun validateEmail(email: String): ValidationResult
    fun validatePassword(password: String): ValidationResult
}

class UserValidator @Inject constructor() : Validator { ... }

// 5. Sync Manager
interface SyncManager {
    suspend fun syncUserData(): Result<Unit>
    suspend fun uploadPhoto(photo: Bitmap): Result<String>
}

class UserSyncManager @Inject constructor(
    private val apiService: UserApiService,
    private val workManager: WorkManager
) : SyncManager { ... }

// Uso en ViewModel:
@HiltViewModel
class UserViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val analytics: AnalyticsService,
    private val preferences: UserPreferences,
    private val validator: Validator,
    private val syncManager: SyncManager
) : ViewModel() {
    // Cada operación delega a servicio especializado
}
```

**Beneficios del refactor:**
✅ Cada clase tiene una responsabilidad
✅ Fácil de testear (mock solo lo que necesitas)
✅ Fácil de extender
✅ Bajo coupling, alto cohesion
✅ Reusable en otros contextos
"""
```

## IA Generando Clean Architecture

### Prompt: Nueva Feature Completa

```
Prompt a IA:
"Genera una nueva feature 'User Profile' con Clean Architecture:

DOMAIN:
- Model: User (id, name, email, avatar, bio)
- Repository interface: UserProfileRepository
- Use cases: GetUserProfile, UpdateUserProfile, UploadAvatar

DATA:
- DTO: UserProfileDto
- Entity: UserProfileEntity  
- Remote data source con Retrofit
- Local data source con Room
- Repository implementation con cache-first

PRESENTATION:
- ViewModel: UserProfileViewModel
- UI States: Loading, Success, Error
- Composable: UserProfileScreen con edición

Siguiendo:
- Dependency Inversion
- Single Responsibility
- Tests para cada capa
- KDoc documentation
- Error handling con Result
"
```

**IA genera estructura completa:**

```kotlin
// ========== DOMAIN LAYER ==========

// Domain Model
package com.app.domain.model

data class User(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String?,
    val bio: String?
)

// Repository Interface
package com.app.domain.repository

interface UserProfileRepository {
    fun getUserProfile(userId: String): Flow<Result<User>>
    suspend fun updateUserProfile(user: User): Result<User>
    suspend fun uploadAvatar(userId: String, imageUri: Uri): Result<String>
}

// Use Cases
package com.app.domain.usecase

class GetUserProfileUseCase @Inject constructor(
    private val repository: UserProfileRepository
) {
    operator fun invoke(userId: String): Flow<Result<User>> {
        return repository.getUserProfile(userId)
    }
}

class UpdateUserProfileUseCase @Inject constructor(
    private val repository: UserProfileRepository
) {
    suspend operator fun invoke(user: User): Result<User> {
        return repository.updateUserProfile(user)
    }
}

class UploadAvatarUseCase @Inject constructor(
    private val repository: UserProfileRepository
) {
    suspend operator fun invoke(userId: String, imageUri: Uri): Result<String> {
        return repository.uploadAvatar(userId, imageUri)
    }
}

// ========== DATA LAYER ==========

// DTO
package com.app.data.remote.dto

data class UserProfileDto(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "email") val email: String,
    @Json(name = "avatar_url") val avatarUrl: String?,
    @Json(name = "bio") val bio: String?
)

fun UserProfileDto.toDomain(): User = User(
    id = id,
    name = name,
    email = email,
    avatarUrl = avatarUrl,
    bio = bio
)

// Entity
package com.app.data.local.entity

@Entity(tableName = "user_profiles")
data class UserProfileEntity(
    @PrimaryKey val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String?,
    val bio: String?,
    val updatedAt: Long = System.currentTimeMillis()
)

fun UserProfileEntity.toDomain(): User = User(
    id = id,
    name = name,
    email = email,
    avatarUrl = avatarUrl,
    bio = bio
)

fun User.toEntity(): UserProfileEntity = UserProfileEntity(
    id = id,
    name = name,
    email = email,
    avatarUrl = avatarUrl,
    bio = bio
)

// Data Sources
package com.app.data.remote

interface UserProfileRemoteDataSource {
    suspend fun getUserProfile(userId: String): UserProfileDto
    suspend fun updateUserProfile(userId: String, dto: UserProfileDto): UserProfileDto
    suspend fun uploadAvatar(userId: String, imageUri: Uri): String
}

class UserProfileRemoteDataSourceImpl @Inject constructor(
    private val apiService: UserApiService
) : UserProfileRemoteDataSource {
    
    override suspend fun getUserProfile(userId: String): UserProfileDto {
        val response = apiService.getUserProfile(userId)
        if (response.isSuccessful && response.body() != null) {
            return response.body()!!
        }
        throw ApiException(response.code(), response.message())
    }
    
    override suspend fun updateUserProfile(
        userId: String, 
        dto: UserProfileDto
    ): UserProfileDto {
        val response = apiService.updateUserProfile(userId, dto)
        if (response.isSuccessful && response.body() != null) {
            return response.body()!!
        }
        throw ApiException(response.code(), response.message())
    }
    
    override suspend fun uploadAvatar(userId: String, imageUri: Uri): String {
        // Implementación con Multipart
        val file = imageUri.toFile()
        val requestFile = file.asRequestBody("image/*".toMediaType())
        val body = MultipartBody.Part.createFormData("avatar", file.name, requestFile)
        
        val response = apiService.uploadAvatar(userId, body)
        if (response.isSuccessful && response.body() != null) {
            return response.body()!!.avatarUrl
        }
        throw ApiException(response.code(), response.message())
    }
}

package com.app.data.local

interface UserProfileLocalDataSource {
    fun getUserProfile(userId: String): Flow<UserProfileEntity?>
    suspend fun saveUserProfile(entity: UserProfileEntity)
    suspend fun deleteUserProfile(userId: String)
}

class UserProfileLocalDataSourceImpl @Inject constructor(
    private val userProfileDao: UserProfileDao
) : UserProfileLocalDataSource {
    
    override fun getUserProfile(userId: String): Flow<UserProfileEntity?> {
        return userProfileDao.getUserProfile(userId)
    }
    
    override suspend fun saveUserProfile(entity: UserProfileEntity) {
        userProfileDao.upsertUserProfile(entity)
    }
    
    override suspend fun deleteUserProfile(userId: String) {
        userProfileDao.deleteUserProfile(userId)
    }
}

// Repository Implementation
package com.app.data.repository

class UserProfileRepositoryImpl @Inject constructor(
    private val remoteDataSource: UserProfileRemoteDataSource,
    private val localDataSource: UserProfileLocalDataSource,
    private val networkMonitor: NetworkMonitor
) : UserProfileRepository {
    
    override fun getUserProfile(userId: String): Flow<Result<User>> = flow {
        // 1. Emit cached first
        localDataSource.getUserProfile(userId)
            .first()
            ?.let { entity ->
                emit(Result.success(entity.toDomain()))
            }
        
        // 2. Fetch from network if available
        if (networkMonitor.isOnline.first()) {
            try {
                val dto = remoteDataSource.getUserProfile(userId)
                val user = dto.toDomain()
                
                // Update cache
                localDataSource.saveUserProfile(user.toEntity())
                
                emit(Result.success(user))
            } catch (e: Exception) {
                // If we have cache, don't emit error
                val cached = localDataSource.getUserProfile(userId).first()
                if (cached == null) {
                    emit(Result.failure(e))
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override suspend fun updateUserProfile(user: User): Result<User> {
        return try {
            val dto = UserProfileDto(
                id = user.id,
                name = user.name,
                email = user.email,
                avatarUrl = user.avatarUrl,
                bio = user.bio
            )
            
            val updated = remoteDataSource.updateUserProfile(user.id, dto)
            val domainUser = updated.toDomain()
            
            // Update cache
            localDataSource.saveUserProfile(domainUser.toEntity())
            
            Result.success(domainUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    override suspend fun uploadAvatar(userId: String, imageUri: Uri): Result<String> {
        return try {
            val avatarUrl = remoteDataSource.uploadAvatar(userId, imageUri)
            
            // Update cached user with new avatar
            localDataSource.getUserProfile(userId).first()?.let { cached ->
                val updated = cached.copy(avatarUrl = avatarUrl)
                localDataSource.saveUserProfile(updated)
            }
            
            Result.success(avatarUrl)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// ========== PRESENTATION LAYER ==========

// UI State
package com.app.presentation.profile

sealed interface UserProfileUiState {
    object Loading : UserProfileUiState
    data class Success(val user: User, val isEditing: Boolean = false) : UserProfileUiState
    data class Error(val message: String) : UserProfileUiState
}

// ViewModel
@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val getUserProfileUseCase: GetUserProfileUseCase,
    private val updateUserProfileUseCase: UpdateUserProfileUseCase,
    private val uploadAvatarUseCase: UploadAvatarUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val userId: String = checkNotNull(savedStateHandle["userId"])
    
    private val _uiState = MutableStateFlow<UserProfileUiState>(UserProfileUiState.Loading)
    val uiState: StateFlow<UserProfileUiState> = _uiState.asStateFlow()
    
    init {
        loadUserProfile()
    }
    
    private fun loadUserProfile() {
        viewModelScope.launch {
            getUserProfileUseCase(userId)
                .catch { error ->
                    _uiState.value = UserProfileUiState.Error(
                        error.localizedMessage ?: "Unknown error"
                    )
                }
                .collect { result ->
                    _uiState.value = when (result) {
                        is Result.Success -> UserProfileUiState.Success(result.data)
                        is Result.Failure -> UserProfileUiState.Error(result.exception.message)
                    }
                }
        }
    }
    
    fun startEditing() {
        val current = _uiState.value
        if (current is UserProfileUiState.Success) {
            _uiState.value = current.copy(isEditing = true)
        }
    }
    
    fun cancelEditing() {
        val current = _uiState.value
        if (current is UserProfileUiState.Success) {
            _uiState.value = current.copy(isEditing = false)
        }
    }
    
    fun updateProfile(user: User) {
        viewModelScope.launch {
            _uiState.value = UserProfileUiState.Loading
            
            when (val result = updateUserProfileUseCase(user)) {
                is Result.Success -> {
                    _uiState.value = UserProfileUiState.Success(result.data, isEditing = false)
                }
                is Result.Failure -> {
                    _uiState.value = UserProfileUiState.Error(result.exception.message)
                }
            }
        }
    }
    
    fun uploadAvatar(imageUri: Uri) {
        viewModelScope.launch {
            when (val result = uploadAvatarUseCase(userId, imageUri)) {
                is Result.Success -> {
                    // Profile will auto-update via Flow
                }
                is Result.Failure -> {
                    _uiState.value = UserProfileUiState.Error("Failed to upload avatar")
                }
            }
        }
    }
}

// Composable UI
@Composable
fun UserProfileScreen(
    userId: String,
    viewModel: UserProfileViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        }
    ) { padding ->
        when (val state = uiState) {
            is UserProfileUiState.Loading -> LoadingIndicator()
            is UserProfileUiState.Success -> UserProfileContent(
                user = state.user,
                isEditing = state.isEditing,
                onEditClick = viewModel::startEditing,
                onCancelClick = viewModel::cancelEditing,
                onSaveClick = viewModel::updateProfile,
                onAvatarClick = { /* Open image picker */ },
                modifier = Modifier.padding(padding)
            )
            is UserProfileUiState.Error -> ErrorMessage(
                message = state.message,
                onRetry = { /* Retry */ }
            )
        }
    }
}

// ========== TESTS ==========

@ExperimentalCoroutinesApi
class GetUserProfileUseCaseTest {
    
    private lateinit var useCase: GetUserProfileUseCase
    private val mockRepository = mockk<UserProfileRepository>()
    
    @Before
    fun setup() {
        useCase = GetUserProfileUseCase(mockRepository)
    }
    
    @Test
    fun `should return user from repository`() = runTest {
        // Arrange
        val expectedUser = User("1", "John", "john@example.com", null, null)
        coEvery { mockRepository.getUserProfile("1") } returns flowOf(Result.success(expectedUser))
        
        // Act
        val result = useCase("1").first()
        
        // Assert
        assertTrue(result.isSuccess)
        assertEquals(expectedUser, result.getOrNull())
    }
}
```

## Manteniendo Clean Architecture

### CI/CD con Validación de Arquitectura

```yaml
# .github/workflows/architecture-validation.yml
name: Validate Clean Architecture

on: [push, pull_request]

jobs:
  validate-architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup JDK
        uses: actions/setup-java@v4
        with:
          java-version: '17'
      
      - name: Run Architecture Tests
        run: ./gradlew :app:testDebugUnitTest --tests "*ArchitectureTest"
      
      - name: AI Architecture Review
        uses: ai-architecture-validator@v1
        with:
          rules: |
            - domain-no-android-imports
            - domain-no-framework-deps
            - data-implements-domain
            - presentation-depends-on-domain
            - no-circular-dependencies
```

### Architecture Tests

```kotlin
// Test automático de reglas de arquitectura
@Test
fun `domain layer should not depend on android framework`() {
    val domainPackage = "com.app.domain"
    
    val androidImports = findAndroidImports(domainPackage)
    
    assertThat(androidImports)
        .describedAs("Domain layer debe ser pure Kotlin sin Android dependencies")
        .isEmpty()
}

@Test
fun `domain layer should not import from data or presentation`() {
    val domainFiles = findKotlinFiles("com/app/domain")
    
    domainFiles.forEach { file ->
        val imports = extractImports(file)
        val violations = imports.filter { 
            it.startsWith("com.app.data") || it.startsWith("com.app.presentation")
        }
        
        assertThat(violations)
            .describedAs("$file viola dependency rule")
            .isEmpty()
    }
}

@Test
fun `presentation ViewModels should only depend on use cases not repositories`() {
    val viewModels = findClassesExtending("ViewModel")
    
    viewModels.forEach { viewModel ->
        val dependencies = getDependencies(viewModel)
        val repositoryDeps = dependencies.filter { it.contains("Repository") }
        
        assertThat(repositoryDeps)
            .describedAs("$viewModel debe usar UseCases, no Repositories directamente")
            .isEmpty()
    }
}
```

## Mejores Prácticas

### 1. agents.md con Reglas de Arquitectura

```markdown
# Clean Architecture Guidelines

## Layer Structure
```
domain/
  ├── model/       # Domain entities (pure Kotlin)
  ├── repository/  # Repository interfaces
  └── usecase/     # Use cases (business logic)

data/
  ├── local/       # Room (Entity, DAO)
  ├── remote/      # Retrofit (DTO, ApiService)
  └── repository/  # Repository implementations

presentation/
  ├── ui/          # Composables
  ├── viewmodel/   # ViewModels
  └── navigation/  # Navigation
```

## Dependency Rules
1. Presentation → Domain → Data
2. Domain is pure Kotlin (no Android/Framework)
3. Data implements Domain interfaces
4. Use cases contain business logic
5. ViewModels use use cases (not repositories)

## Code Generation Checklist
When creating new feature:
- [ ] Domain models (pure Kotlin data classes)
- [ ] Repository interface (in domain)
- [ ] Use cases (one per operation)
- [ ] DTOs and Entities (in data)
- [ ] Repository implementation (in data)
- [ ] ViewModel (in presentation)
- [ ] UI Composables (in presentation)
- [ ] Tests for each layer
```

### 2. Templates con IA

```kotlin
// Crea templates y IA los sigue automáticamente

// Template: Nueva Feature
/*
Feature: [FeatureName]

Generate with Clean Architecture:

DOMAIN:
- Model: [Name] with properties [list]
- Repository interface: [Name]Repository
- Use cases: [List of operations]

DATA:
- DTO: [Name]Dto
- Entity: [Name]Entity
- Remote data source
- Local data source  
- Repository implementation

PRESENTATION:
- ViewModel: [Name]ViewModel
- UI State: sealed interface
- Screen: [Name]Screen composable
- Navigation integration

TESTS:
- Unit tests for use cases
- Repository tests with fakes
- ViewModel tests with MockK
*/
```

### 3. Continuous Validation

```kotlin
// Pre-commit hook valida arquitectura
#!/bin/bash

echo "Validating Clean Architecture..."

# Check domain layer
if grep -r "import android\." domain/; then
    echo "❌ Domain layer has Android imports!"
    exit 1
fi

# Check dependencies
./gradlew :domain:dependencies | grep -E "(retrofit|room|compose)" && {
    echo "❌ Domain has framework dependencies!"
    exit 1
}

# Run architecture tests
./gradlew :app:testDebugUnitTest --tests "*ArchitectureTest" || {
    echo "❌ Architecture tests failed!"
    exit 1
}

echo "✅ Clean Architecture validated"
```

## Conclusión

**Clean Architecture con IA** transforma un ideal difícil de alcanzar en realidad práctica:

- 🤖 **IA genera** código siguiendo arquitectura correcta
- 🛡️ **IA valida** que no haya violaciones
- 📚 **IA educa** sobre principios y patterns
- 🔄 **IA refactoriza** código legacy a clean architecture
- ✅ **IA mantiene** estándares consistentemente

**Resultado:**
- Código más mantenible
- Testing más fácil
- Features más rápidos
- Menos bugs
- Team alineado

**Tu siguiente paso:**
1. Define tus reglas de arquitectura en agents.md
2. Configura validación automática en CI/CD
3. Usa IA para generar nuevas features
4. Valida continuamente con architecture tests
5. Refactoriza legacy code con ayuda de IA

Clean Architecture ya no es un ideal lejano, es una realidad alcanzable con asistencia de IA.
