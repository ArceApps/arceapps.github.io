---
title: "Contexto Efectivo para IA en Android: El Arte del Prompt Engineering Técnico"
description: "Domina el arte de proporcionar contexto efectivo a agentes de IA para obtener código Android de calidad superior, consistente y sin alucinaciones."
pubDate: 2025-12-15
heroImage: "/images/placeholder-article-ai-context.svg"
tags: ["IA", "Android", "Prompt Engineering", "Contexto", "Productividad", "GitHub Copilot", "Gemini"]
reference_id: "0f3f40cf-3a5d-481d-b211-b372ac4a2298"
---
## 🧠 ¿Por qué el Contexto es Rey?

Imagina a un desarrollador Senior que te ayuda a codear por primera vez en tu repositorio. Si le dices: "Haz la pantalla de login", probablemente te hará mil preguntas o asumirá cosas incorrectas. Pero si le dices: "Haz la pantalla de login usando nuestro `AuthViewModel` base, siguiendo el diseño de `LoginScreen.kt` existente y reutilizando `PrimaryButton`", el resultado será mucho mejor.

Los agentes de IA (LLMs) funcionan igual. No leen tu mente; leen el **contexto** que les proporcionas. La calidad de la salida (código generado) es directamente proporcional a la calidad de la entrada (contexto proporcionado).

En el desarrollo de software, y específicamente en Android, el contexto no es solo texto; es arquitectura, dependencias, convenciones y patrones.

## 🏗️ Los 4 Pilares del Contexto Efectivo

Para obtener resultados de nivel Senior de una IA, necesitas proporcionarle cuatro tipos de contexto:

### 1. Contexto Arquitectónico (The Blueprint)
El agente debe saber **cómo** construyes software.
- ¿Usas Clean Architecture?
- ¿MVVM o MVI?
- ¿Dónde van los DTOs vs Domain Models?
- ¿Cómo manejas la inyección de dependencias (Hilt/Koin)?

**Ejemplo de Prompt:**
> "Estamos usando Clean Architecture con MVVM. La capa de dominio es pura Kotlin. La capa de datos usa el patrón Repository con una estrategia cache-first."

### 2. Contexto Tecnológico (The Stack)
El agente debe conocer tu **caja de herramientas**.
- ¿Jetpack Compose o XML?
- ¿Coroutines o RxJava?
- ¿Retrofit o Ktor?
- ¿Room o Realm?

**Ejemplo de Prompt:**
> "Usa Jetpack Compose para UI (Material3), Hilt para DI, y Coroutines/Flow para asincronía. No uses LiveData, usa StateFlow."

### 3. Contexto de Convenciones (The Style)
El agente debe imitar tu **estilo de codificación**.
- ¿Cómo nombras tus ViewModels?
- ¿Dónde pones los modifiers en Compose?
- ¿Cómo manejas los estados de error?

**Ejemplo de Prompt:**
> "Los ViewModels deben exponer un único `uiState` como `StateFlow`. Los errores se manejan con una sealed interface `UiState`. Los tests usan el patrón `should...when...`."

### 4. Contexto de Negocio (The Domain)
El agente debe entender **qué** estás construyendo.
- ¿Qué es un "Usuario" en tu sistema?
- ¿Qué reglas de validación aplican?

**Ejemplo de Prompt:**
> "Un Usuario tiene un ID único y un email. El email debe ser único en el sistema. Los usuarios premium tienen acceso a features beta."

## 🛠️ Estrategias para Inyectar Contexto

### Estrategia 1: El Archivo `agents.md` (Contexto Estático)

La forma más efectiva de mantener contexto persistente es usar un archivo `agents.md` en la raíz de tu proyecto. (Ver artículo completo sobre [agents.md](blog-agents-md-estandar.md)).

```markdown
# agents.md
## Architecture
- Clean Architecture (Domain, Data, UI)
- MVVM pattern
- Repository pattern

## Tech Stack
- Kotlin, Coroutines, Flow
- Jetpack Compose, Material3
- Hilt, Retrofit, Room
- JUnit5, MockK, Turbine

## Conventions
- Use StateFlow, not LiveData
- ViewModels expose strict UiState
- Composable functions are stateless
```

### Estrategia 2: Contexto en el Código (KDoc Semántico)

Documenta tus clases base y interfaces clave. Los agentes leen los comentarios para entender la intención.

```kotlin
/**
 * Base Repository interface defining standard CRUD operations.
 * All repositories must implement this pattern.
 * Uses Result<T> wrapper for error handling.
 */
interface BaseRepository<T> {
    fun getAll(): Flow<Result<List<T>>>
    suspend fun getById(id: String): Result<T>
}

// Prompt: "Implementa UserRepository siguiendo el patrón de BaseRepository"
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
