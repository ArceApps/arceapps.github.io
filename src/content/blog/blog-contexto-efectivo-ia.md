---
title: "Contexto Efectivo para Agentes IA: El Arte de la Comunicación con IA"
description: "Aprende las mejores prácticas para proporcionar contexto a agentes de IA, maximizando la calidad y precisión del código generado en proyectos Android."
pubDate: "2025-12-29"
heroImage: "/images/placeholder-article-ai-context.svg"
tags: ["AI", "Android", "Desarrollo", "Context", "GitHub Copilot", "Gemini", "Mejores Prácticas"]
---

## El Problema del Contexto

Has notado que a veces le pides algo a GitHub Copilot o Gemini y el resultado es genérico, desconectado de tu proyecto, o simplemente incorrecto? El problema no es la IA, es el **contexto**.

Los agentes de IA son increíblemente poderosos, pero solo son tan buenos como el contexto que les proporcionas. Es como contratar a un desarrollador senior: si le das contexto completo del proyecto, convenciones, y objetivos claros, producirá código excelente. Si solo le dices "haz esto" sin contexto, el resultado será genérico.

## Los 5 Niveles de Contexto

### Nivel 1: Sin Contexto (❌ Malo)
```
Prompt: "Crea un ViewModel para usuarios"
```

El agente no sabe:
- ¿Qué arquitectura usas?
- ¿Qué librerías de DI?
- ¿LiveData o StateFlow?
- ¿Cómo manejas estados?

**Resultado**: Código genérico que no encaja en tu proyecto.

### Nivel 2: Contexto Básico (⚠️ Regular)
```
Prompt: "Crea un ViewModel para usuarios usando MVVM y Hilt"
```

Mejor, pero aún falta:
- ¿Cómo estructuras estados UI?
- ¿Cómo manejas errores?
- ¿Naming conventions?
- ¿Testing strategy?

**Resultado**: Código que compila pero no sigue tus convenciones.

### Nivel 3: Contexto Específico (✅ Bueno)
```
Prompt: "Crea un ViewModel para usuarios siguiendo:
- MVVM con Clean Architecture
- @HiltViewModel para DI
- StateFlow para estados UI (no LiveData)
- Sealed interface para UserUiState (Loading, Success, Error)
- Use cases para lógica de negocio
- Documentación KDoc"
```

**Resultado**: Código que encaja bien en tu proyecto.

### Nivel 4: Contexto Completo (🌟 Excelente)
```
Prompt: "Basándote en agents.md y siguiendo el patrón usado en 
ProfileViewModel.kt, crea un ViewModel para usuarios que:

1. Use GetUserUseCase y UpdateUserUseCase
2. Maneje estados con UserUiState (Loading, Success, Error)
3. Implemente validaciones inline
4. Use viewModelScope para coroutines
5. Incluya funciones: loadUser(), updateUser(), refresh()
6. Documente con KDoc igual que otros ViewModels
7. Siga naming conventions del proyecto

Ver ejemplos en:
- src/ui/viewmodel/ProfileViewModel.kt (patrón de estados)
- src/domain/usecase/user/ (use cases existentes)
"
```

**Resultado**: Código indistinguible del que escribirías tú mismo.

### Nivel 5: Contexto Inteligente (🚀 Maestro)
```
El agente tiene acceso a:
- agents.md (convenciones del proyecto)
- Archivos relevantes automáticamente
- Historial de decisiones
- Tests existentes como ejemplos
- Documentation standards

Prompt simple: "Crea UserViewModel"
```

**Resultado**: Código perfecto que sigue todas las convenciones automáticamente.

## Técnicas de Contexto para Android

### 1. Contexto Arquitectónico

**Proporciona la big picture:**

```markdown
# Contexto para el Agente IA

## Arquitectura del Proyecto
```
app/
├── data/        # Repositories, DTOs, Data Sources
├── domain/      # Models, Use Cases, Repository Interfaces
└── ui/          # ViewModels, Composables, Screens
```

## Flujo de Datos
UI (Composable) 
  ↓ events
ViewModel (MutableStateFlow)
  ↓ use case invocation
Use Case (Domain Logic)
  ↓ repository call
Repository (Data Source Abstraction)
  ↓ network/database
Data Sources (Retrofit/Room)

## Patrones Clave
- **ViewModel**: Expone StateFlow<UiState>, usa use cases
- **Use Case**: Una responsabilidad, retorna Flow<Result<T>>
- **Repository**: Implementa cache-first strategy
- **UiState**: Sealed interface con Loading, Success, Error
```

### 2. Contexto por Ejemplo

**El código habla más que las palabras:**

```kotlin
// Incluye esto en tu prompt:
/**
 * EJEMPLO DE VIEWMODEL QUE DEBES SEGUIR:
 */
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()
    
    init {
        loadProfile()
    }
    
    private fun loadProfile() {
        viewModelScope.launch {
            getUserUseCase(userId)
                .catch { error ->
                    _uiState.value = ProfileUiState.Error(error.message)
                }
                .collect { result ->
                    _uiState.value = when (result) {
                        is Result.Success -> ProfileUiState.Success(result.data)
                        is Result.Error -> ProfileUiState.Error(result.exception.message)
                    }
                }
        }
    }
}

/**
 * Crea UserViewModel siguiendo EXACTAMENTE este mismo patrón:
 * - Mismo estilo de inyección
 * - Mismo patrón de estados
 * - Mismo manejo de errores
 * - Misma estructura de funciones
 */
```

### 3. Contexto de Convenciones

**Define reglas claras:**

```kotlin
/*
 * CONVENCIONES DEL PROYECTO
 * 
 * NAMING:
 * - ViewModels: [Feature]ViewModel (ej: UserViewModel)
 * - States: [Feature]UiState (ej: UserUiState)
 * - Use Cases: [Action][Entity]UseCase (ej: GetUserUseCase)
 * - Repositories: [Entity]Repository (ej: UserRepository)
 * 
 * DI:
 * - Siempre usa @Inject constructor
 * - ViewModels con @HiltViewModel
 * - Repositories en singleton
 * 
 * ESTADOS:
 * sealed interface [Feature]UiState {
 *     object Loading : [Feature]UiState
 *     data class Success(val data: T) : [Feature]UiState
 *     data class Error(val message: String) : [Feature]UiState
 * }
 * 
 * ERROR HANDLING:
 * - Usa .catch {} en Flows
 * - Mensajes de error user-friendly
 * - Logging con Timber en catch blocks
 * 
 * COROUTINES:
 * - viewModelScope para ViewModels
 * - Dispatchers.IO para operaciones de I/O
 * - Structured concurrency siempre
 */
```

### 4. Contexto de Testing

**Muestra cómo quieres tests:**

```kotlin
/**
 * EJEMPLO DE TEST QUE DEBES GENERAR:
 */
@ExperimentalCoroutinesApi
class ProfileViewModelTest {
    
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()
    
    private lateinit var viewModel: ProfileViewModel
    private val mockUseCase = mockk<GetUserUseCase>()
    
    @Before
    fun setup() {
        viewModel = ProfileViewModel(mockUseCase, SavedStateHandle())
    }
    
    @Test
    fun `should emit loading state initially`() = runTest {
        // Assert
        assertThat(viewModel.uiState.value).isInstanceOf<ProfileUiState.Loading>()
    }
    
    @Test
    fun `should emit success when user loads correctly`() = runTest {
        // Arrange
        val expectedUser = User("1", "Test")
        coEvery { mockUseCase(any()) } returns flowOf(Result.success(expectedUser))
        
        // Act
        viewModel.loadProfile()
        
        // Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf<ProfileUiState.Loading>()
            val success = awaitItem() as ProfileUiState.Success
            assertThat(success.user).isEqualTo(expectedUser)
        }
    }
}

/**
 * Genera tests para UserViewModel siguiendo este EXACTO formato:
 * - Mismo setup con MainDispatcherRule
 * - MockK para dependencias
 * - Turbine para test de Flows
 * - Naming: `should [expected] when [condition]`
 * - Arrange-Act-Assert pattern
 */
```

### 5. Contexto Incremental

**Construye contexto paso a paso:**

```kotlin
// PASO 1: Contexto general
"Voy a crear un feature de gestión de usuarios en mi app Android"

// PASO 2: Arquitectura
"La app usa Clean Architecture con MVVM. 
Estructura: data/ → domain/ → ui/"

// PASO 3: Stack técnico
"Stack: Kotlin, Jetpack Compose, Hilt, Room, Retrofit, Coroutines, StateFlow"

// PASO 4: Convenciones
"Convenciones:
- ViewModels exponen StateFlow<UiState>
- Use cases retornan Flow<Result<T>>
- Repositories implementan cache-first
- Tests con JUnit5, MockK, Turbine"

// PASO 5: Request específico
"Ahora crea UserViewModel que:
1. Cargue lista de usuarios al iniciar
2. Permita refrescar datos
3. Permita buscar usuarios por nombre
4. Maneje estados Loading/Success/Error
5. Incluya tests completos"
```

## Estrategias Avanzadas de Contexto

### Estrategia 1: Contexto por Archivo

Estructura tus archivos para proveer contexto automático:

```kotlin
// src/ui/viewmodel/UserViewModel.kt

/**
 * ViewModel para gestión de usuarios.
 * 
 * CONTEXTO PARA IA:
 * Este ViewModel sigue el patrón estándar del proyecto:
 * - @HiltViewModel para DI
 * - StateFlow para estados UI
 * - Use cases para lógica de negocio
 * - viewModelScope para coroutines
 * 
 * DEPENDENCIES:
 * - GetUsersUseCase: Lista todos los usuarios
 * - GetUserByIdUseCase: Obtiene usuario específico
 * - UpdateUserUseCase: Actualiza datos de usuario
 * 
 * UI STATE:
 * - Loading: Cargando datos
 * - Success: Datos cargados exitosamente
 * - Error: Error al cargar (con mensaje user-friendly)
 * 
 * EJEMPLO DE USO:
 * ```
 * @Composable
 * fun UserScreen(viewModel: UserViewModel = hiltViewModel()) {
 *     val uiState by viewModel.uiState.collectAsStateWithLifecycle()
 *     
 *     when (uiState) {
 *         is UserUiState.Loading -> LoadingIndicator()
 *         is UserUiState.Success -> UserList(uiState.users)
 *         is UserUiState.Error -> ErrorMessage(uiState.message)
 *     }
 * }
 * ```
 */
@HiltViewModel
class UserViewModel @Inject constructor(
    private val getUsersUseCase: GetUsersUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    // Implementation...
}
```

### Estrategia 2: Contexto en Comentarios

Usa comentarios estratégicos:

```kotlin
class UserRepository @Inject constructor(
    private val apiService: UserApiService,
    private val userDao: UserDao
) {
    
    /**
     * Obtiene lista de usuarios con cache-first strategy.
     * 
     * FLOW:
     * 1. Emite datos cacheados inmediatamente (si existen)
     * 2. Hace request a API en paralelo
     * 3. Actualiza cache con datos frescos
     * 4. Emite datos actualizados
     * 
     * AI NOTE: Este patrón debe ser usado en TODOS los repositories
     * para garantizar UX responsive incluso sin conexión.
     */
    fun getUsers(): Flow<Result<List<User>>> = flow {
        // 1. Cache first
        val cachedUsers = userDao.getAllUsers()
        if (cachedUsers.isNotEmpty()) {
            emit(Result.success(cachedUsers.map { it.toModel() }))
        }
        
        // 2. Fetch from network
        try {
            val response = apiService.getUsers()
            if (response.isSuccessful && response.body() != null) {
                val users = response.body()!!.map { it.toEntity() }
                
                // 3. Update cache
                userDao.insertUsers(users)
                
                // 4. Emit fresh data
                emit(Result.success(users.map { it.toModel() }))
            }
        } catch (e: Exception) {
            // Si hay cache, no emitimos error
            if (cachedUsers.isEmpty()) {
                emit(Result.failure(e))
            }
        }
    }.flowOn(Dispatchers.IO)
}
```

### Estrategia 3: Contexto Dinámico con Promptfiles

Crea archivos `.prompt` con contexto reutilizable:

```markdown
<!-- prompts/create-viewmodel.prompt -->

# Create ViewModel Template

## Context
Project: Android MVVM with Clean Architecture
Tech Stack: Kotlin, Hilt, Compose, Coroutines, StateFlow

## Instructions
Create a new ViewModel following project conventions:

### Structure
```kotlin
@HiltViewModel
class [Feature]ViewModel @Inject constructor(
    private val [useCases]: UseCases,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<[Feature]UiState>([Feature]UiState.Loading)
    val uiState: StateFlow<[Feature]UiState> = _uiState.asStateFlow()
    
    init {
        // Initial load
    }
}
```

### UI State Pattern
```kotlin
sealed interface [Feature]UiState {
    object Loading : [Feature]UiState
    data class Success(val data: T) : [Feature]UiState
    data class Error(val message: String) : [Feature]UiState
}
```

### Requirements
- [ ] Use @HiltViewModel annotation
- [ ] Expose StateFlow (not MutableStateFlow)
- [ ] Use use cases (not repositories directly)
- [ ] Handle errors with sealed interface states
- [ ] Use viewModelScope for coroutines
- [ ] Include KDoc documentation
- [ ] Follow naming conventions
- [ ] Include example usage in KDoc

## Examples
See: ProfileViewModel.kt, SettingsViewModel.kt for reference
```

### Estrategia 4: Contexto con Tests como Especificación

Los tests son especificaciones ejecutables:

```kotlin
/**
 * AI PROMPT: 
 * Implementa UserViewModel para que estos tests pasen.
 * Los tests describen EXACTAMENTE el comportamiento esperado.
 */
@ExperimentalCoroutinesApi
class UserViewModelTest {
    
    @Test
    fun `should load users on init`() = runTest {
        // Arrange
        val expectedUsers = listOf(User("1", "John"), User("2", "Jane"))
        coEvery { getUsersUseCase() } returns flowOf(Result.success(expectedUsers))
        
        // Act
        val viewModel = UserViewModel(getUsersUseCase, SavedStateHandle())
        
        // Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf<UserUiState.Loading>()
            val success = awaitItem() as UserUiState.Success
            assertThat(success.users).isEqualTo(expectedUsers)
        }
    }
    
    @Test
    fun `should refresh users when refresh is called`() = runTest {
        // Arrange
        val initialUsers = listOf(User("1", "John"))
        val refreshedUsers = listOf(User("1", "John"), User("2", "Jane"))
        
        coEvery { getUsersUseCase() } returnsMany listOf(
            flowOf(Result.success(initialUsers)),
            flowOf(Result.success(refreshedUsers))
        )
        
        val viewModel = UserViewModel(getUsersUseCase, SavedStateHandle())
        viewModel.uiState.test {
            skipItems(2) // Skip Loading and initial Success
            
            // Act
            viewModel.refresh()
            
            // Assert
            assertThat(awaitItem()).isInstanceOf<UserUiState.Loading>()
            val success = awaitItem() as UserUiState.Success
            assertThat(success.users).hasSize(2)
        }
    }
    
    @Test
    fun `should filter users by search query`() = runTest {
        // Arrange
        val allUsers = listOf(
            User("1", "John Doe"),
            User("2", "Jane Smith"),
            User("3", "John Smith")
        )
        coEvery { getUsersUseCase() } returns flowOf(Result.success(allUsers))
        
        val viewModel = UserViewModel(getUsersUseCase, SavedStateHandle())
        viewModel.uiState.test {
            skipItems(2) // Skip Loading and initial Success
            
            // Act
            viewModel.search("John")
            
            // Assert
            val success = awaitItem() as UserUiState.Success
            assertThat(success.users).hasSize(2)
            assertThat(success.users).allMatch { it.name.contains("John") }
        }
    }
}

/**
 * AI: Ahora implementa UserViewModel que satisfaga estos tests.
 * Los tests ya definen:
 * - Comportamiento de init (carga automática)
 * - Función refresh() que recarga datos
 * - Función search(query) que filtra usuarios
 * - Manejo de estados Loading/Success/Error
 */
```

## Mejores Prácticas por Herramienta

### GitHub Copilot

```kotlin
// Copilot se beneficia de:
// 1. Comentarios descriptivos ANTES del código
// 2. Ejemplos en el mismo archivo
// 3. Nombres descriptivos

// Genera un ViewModel para usuarios que:
// - Use @HiltViewModel para DI
// - Exponga StateFlow<UserUiState>
// - Cargue usuarios con GetUsersUseCase
// - Permita búsqueda por nombre
// - Maneje Loading, Success, Error states

@HiltViewModel
class UserViewModel @Inject constructor(
    // Copilot completará automáticamente siguiendo el patrón
```

### Gemini Code Assist

```kotlin
/*
Gemini Code Assist Prompt:

Contexto del Proyecto:
- App Android nativa en Kotlin
- Arquitectura: Clean Architecture + MVVM
- DI: Hilt
- UI: Jetpack Compose
- Async: Coroutines + Flow
- State: StateFlow (no LiveData)

Tarea:
Crea UserViewModel completo que:

1. Dependencies:
   - GetUsersUseCase
   - SearchUsersUseCase
   - SavedStateHandle

2. Estado UI:
   sealed interface UserUiState {
       object Loading
       data class Success(users: List<User>, searchQuery: String = "")
       data class Error(message: String)
   }

3. Funciones públicas:
   - refresh(): Recarga usuarios
   - search(query: String): Filtra usuarios por nombre
   - clearSearch(): Limpia búsqueda y muestra todos

4. Comportamiento:
   - Carga inicial automática en init
   - Búsqueda con debounce de 300ms
   - Manejo de errores user-friendly
   - Loading states apropiados

5. Testing:
   - Genera tests con JUnit5, MockK, Turbine
   - Casos: carga inicial, refresh, búsqueda, errores
   - Cobertura > 90%

Ejemplos de referencia:
- ProfileViewModel.kt (patrón de estados)
- SettingsViewModel.kt (manejo de errores)

Genera código con documentación KDoc completa.
*/
```

### Cursor AI

```markdown
<!-- .cursor/rules.md -->

# Android Development Rules

## ViewModel Creation
When creating a ViewModel:
- Use @HiltViewModel annotation
- Inject dependencies via constructor
- Expose StateFlow<UiState> (not MutableStateFlow)
- Use use cases, not repositories directly
- viewModelScope for coroutines
- KDoc documentation required

Example:
```kotlin
@HiltViewModel
class [Feature]ViewModel @Inject constructor(
    private val [useCase]: UseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel()
```

## State Management
Use sealed interface for UI states:
```kotlin
sealed interface [Feature]UiState {
    object Loading : [Feature]UiState
    data class Success(val data: T) : [Feature]UiState
    data class Error(val message: String) : [Feature]UiState
}
```

## Error Handling
- Use .catch {} for Flow error handling
- User-friendly error messages
- Log errors with Timber
- Never expose exceptions to UI

## Testing
- JUnit5 + MockK + Turbine
- MainDispatcherRule for coroutines
- Test naming: `should [expected] when [condition]`
- Arrange-Act-Assert pattern
- Coverage > 80% required
```

## Anti-Patrones de Contexto

### ❌ Contexto Vago
```
"Crea un sistema de login"
```
Problema: Demasiado amplio, sin especificaciones.

### ❌ Contexto Contradictorio
```
"Usa MVVM pero pon la lógica de negocio en el ViewModel.
También usa Clean Architecture."
```
Problema: Instrucciones contradictorias confunden al agente.

### ❌ Contexto Obsoleto
```
"Sigue el patrón que usábamos antes con LiveData"
```
Problema: Contexto desactualizado genera código legacy.

### ❌ Sobre-Especificación
```
"Crea UserViewModel con exactamente 47 líneas, 
usando tabs de 4 espacios, con comentarios cada 3 líneas..."
```
Problema: Demasiados detalles irrelevantes.

## Contexto Perfecto: Checklist

Antes de pedir código a un agente IA, verifica que has proporcionado:

- [ ] **Arquitectura**: ¿MVVM? ¿Clean? ¿MVI?
- [ ] **Stack técnico**: Librerías clave que usa el proyecto
- [ ] **Convenciones de naming**: Cómo nombrar clases, funciones, variables
- [ ] **Patrones de código**: Ejemplos de código existente similar
- [ ] **Manejo de estados**: Cómo estructuras estados UI
- [ ] **Error handling**: Cómo manejas y presentas errores
- [ ] **Testing strategy**: Frameworks y patterns de testing
- [ ] **Documentation**: Nivel y estilo de documentación esperada
- [ ] **Ejemplos concretos**: Código de referencia del proyecto
- [ ] **Casos edge**: Situaciones especiales a considerar

## Conclusión

Proporcionar contexto efectivo a agentes de IA es un **skill crítico** en el desarrollo moderno. No es solo sobre escribir buenos prompts, es sobre:

1. **Estructurar tu proyecto** para que el contexto sea descubrible
2. **Documentar convenciones** en agents.md y código
3. **Mantener ejemplos** de código de calidad como referencia
4. **Iterar y refinar** basándote en resultados
5. **Entrenar al agente** con feedback continuo

El tiempo invertido en establecer buen contexto se recupera exponencialmente:
- Código generado más preciso
- Menos iteraciones necesarias
- Mayor consistencia
- Mejor calidad general

**Tu siguiente paso:**
Revisa tu próximo prompt para un agente de IA y aplica estas técnicas. Transforma "Crea un ViewModel" en un prompt con contexto completo y observa la diferencia en calidad del código generado.
