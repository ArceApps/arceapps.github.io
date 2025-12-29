---
title: "agents.md: El Nuevo Estándar para Desarrollo con IA"
description: "Descubre por qué agents.md se ha convertido en el estándar de facto para configurar agentes de IA y cómo implementarlo efectivamente en proyectos Android."
pubDate: "2025-12-29"
heroImage: "/images/placeholder-article-agents-md.svg"
tags: ["AI", "agents.md", "Android", "Desarrollo", "GitHub Copilot", "Gemini"]
---

## El Nacimiento de un Estándar

En los últimos meses, hemos visto emerger un nuevo estándar en el desarrollo asistido por IA: el archivo **agents.md**. Similar a cómo `README.md` se convirtió en el estándar para documentar proyectos, `agents.md` se está estableciendo como el lugar estándar para definir cómo los agentes de IA deben interactuar con tu código.

**¿Por qué surgió este estándar?** Los equipos de desarrollo se dieron cuenta de que necesitaban una forma consistente de comunicar convenciones, arquitectura y mejores prácticas a los asistentes de IA. Lo que comenzó como documentación informal en distintos formatos convergió naturalmente hacia `agents.md`.

## ¿Qué es agents.md?

`agents.md` es un archivo Markdown en la raíz de tu proyecto que sirve como **"manual de instrucciones"** para agentes de IA como GitHub Copilot, Gemini, o cualquier otro asistente que trabaje con tu código. Piensa en él como la documentación que le darías a un nuevo desarrollador, pero optimizada para ser consumida por IA.

### Estructura Básica

```markdown
# Agents Guide - [Nombre del Proyecto]

## Project Overview
Breve descripción del proyecto, stack tecnológico y objetivo principal.

## Architecture
Arquitectura utilizada (MVVM, Clean Architecture, etc.) y estructura de carpetas.

## Coding Conventions
Estándares de código, naming conventions y mejores prácticas específicas.

## Testing Strategy
Approach de testing, frameworks utilizados y cobertura esperada.

## Common Tasks
Tareas frecuentes con ejemplos de cómo se deben implementar.

## Dependencies
Principales dependencias y cómo se utilizan en el proyecto.

## DO's and DON'Ts
Lista clara de prácticas recomendadas y prohibidas.
```

## agents.md para Proyectos Android

Veamos un ejemplo completo de `agents.md` para un proyecto Android moderno:

```markdown
# Android App - Agents Guide

## Project Overview
Aplicación Android nativa desarrollada en Kotlin que implementa [descripción].
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
- **Lenguaje**: Kotlin 1.9+
- **UI**: Jetpack Compose + Material3
- **Arquitectura**: Clean Architecture + MVVM

## Tech Stack
- **Dependency Injection**: Hilt
- **Networking**: Retrofit + OkHttp + Moshi
- **Database**: Room
- **Asynchrony**: Coroutines + Flow
- **Navigation**: Compose Navigation
- **Image Loading**: Coil
- **Testing**: JUnit5, MockK, Turbine

## Project Structure
```
app/
├── src/main/kotlin/com/example/app/
│   ├── di/              # Hilt modules
│   ├── data/
│   │   ├── local/       # Room database, DAOs
│   │   ├── remote/      # API services, DTOs
│   │   └── repository/  # Repository implementations
│   ├── domain/
│   │   ├── model/       # Domain models
│   │   ├── repository/  # Repository interfaces
│   │   └── usecase/     # Use cases
│   └── ui/
│       ├── screens/     # Composable screens
│       ├── components/  # Reusable components
│       ├── theme/       # Material3 theme
│       └── viewmodel/   # ViewModels
```

## Architecture Guidelines

### Data Layer
```kotlin
// Repository pattern with cache-first strategy
interface UserRepository {
    fun getUser(id: String): Flow<Result<User>>
    suspend fun refreshUser(id: String): Result<User>
}

class UserRepositoryImpl @Inject constructor(
    private val remoteDataSource: UserRemoteDataSource,
    private val localDataSource: UserLocalDataSource,
    private val networkMonitor: NetworkMonitor
) : UserRepository {
    
    override fun getUser(id: String): Flow<Result<User>> = flow {
        // Emit cached data first
        localDataSource.getUser(id)?.let {
            emit(Result.success(it))
        }
        
        // Fetch from network if connected
        if (networkMonitor.isConnected()) {
            try {
                val user = remoteDataSource.getUser(id)
                localDataSource.saveUser(user)
                emit(Result.success(user))
            } catch (e: Exception) {
                emit(Result.failure(e))
            }
        }
    }.flowOn(Dispatchers.IO)
}
```

### Domain Layer
```kotlin
// Use cases with single responsibility
class GetUserUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    operator fun invoke(userId: String): Flow<Result<User>> {
        return userRepository.getUser(userId)
    }
}
```

### Presentation Layer
```kotlin
// ViewModels with UiState pattern
@HiltViewModel
class UserViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    private val userId: String = checkNotNull(savedStateHandle["userId"])
    
    private val _uiState = MutableStateFlow<UserUiState>(UserUiState.Loading)
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()
    
    init {
        loadUser()
    }
    
    private fun loadUser() {
        viewModelScope.launch {
            getUserUseCase(userId)
                .catch { error ->
                    _uiState.value = UserUiState.Error(error.message ?: "Unknown error")
                }
                .collect { result ->
                    _uiState.value = when (result) {
                        is Result.Success -> UserUiState.Success(result.data)
                        is Result.Error -> UserUiState.Error(result.exception.message)
                    }
                }
        }
    }
}

sealed interface UserUiState {
    object Loading : UserUiState
    data class Success(val user: User) : UserUiState
    data class Error(val message: String) : UserUiState
}
```

## Coding Conventions

### Naming
- **Packages**: lowercase, sin underscore (`com.example.feature`)
- **Classes**: PascalCase (`UserViewModel`, `UserRepository`)
- **Functions**: camelCase (`loadUser`, `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Resources**: snake_case (`ic_user_profile`, `txt_welcome_message`)

### Composables
```kotlin
// Composables stateless siempre que sea posible
@Composable
fun UserProfile(
    user: User,
    onEditClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Implementation
}

// Hoisting de estado
@Composable
fun UserProfileScreen(
    viewModel: UserViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    UserProfileContent(
        uiState = uiState,
        onEditClick = viewModel::onEditClick
    )
}
```

### Error Handling
```kotlin
// Usar sealed classes para results
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

// Manejo de errores específicos
sealed class AppException(message: String) : Exception(message) {
    class NetworkException(message: String = "Network error") : AppException(message)
    class DatabaseException(message: String = "Database error") : AppException(message)
    class ValidationException(message: String) : AppException(message)
}
```

## Testing Guidelines

### Unit Tests
```kotlin
// Naming: should[ExpectedBehavior]When[Condition]
@Test
fun `should emit success state when user loads successfully`() = runTest {
    // Arrange
    val expectedUser = User("1", "Test User")
    coEvery { repository.getUser("1") } returns flowOf(Result.success(expectedUser))
    
    // Act
    viewModel.loadUser("1")
    
    // Assert
    viewModel.uiState.test {
        assertEquals(UserUiState.Loading, awaitItem())
        assertEquals(UserUiState.Success(expectedUser), awaitItem())
    }
}
```

### Integration Tests
- Usar TestApplicationComponent para Hilt
- In-memory database para Room tests
- MockWebServer para API tests

### UI Tests
```kotlin
@Test
fun userProfile_displaysUserInformation() {
    composeTestRule.setContent {
        UserProfile(
            user = testUser,
            onEditClick = {}
        )
    }
    
    composeTestRule
        .onNodeWithText(testUser.name)
        .assertIsDisplayed()
}
```

## Dependencies & Best Practices

### Hilt Modules
```kotlin
@Module
@InstallIn(SingletonComponent::class)
abstract class DataModule {
    
    @Binds
    abstract fun bindUserRepository(
        impl: UserRepositoryImpl
    ): UserRepository
}

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
    }
}
```

### Room Database
```kotlin
// Siempre usar suspend functions para operaciones de escritura
// Usar Flow para operaciones de lectura que necesitan observación
@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :userId")
    fun getUserFlow(userId: String): Flow<UserEntity?>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)
    
    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteUser(userId: String)
}
```

## DO's ✅

1. **Usa StateFlow en lugar de LiveData** para nuevo código
2. **Implementa UiState pattern** para manejar estados de UI
3. **Documenta con KDoc** todas las funciones públicas
4. **Escribe tests** para toda lógica de negocio
5. **Usa Hilt** para dependency injection
6. **Implementa cache-first strategy** en repositories
7. **Maneja errores explícitamente** con sealed classes
8. **Usa Composables sin estado** cuando sea posible
9. **Implementa ContentDescription** para accesibilidad
10. **Sigue Material3 guidelines** para diseño

## DON'Ts ❌

1. **No uses GlobalScope** - usa viewModelScope o lifecycleScope
2. **No hagas llamadas de red en el Main thread**
3. **No expongas mutable state** desde ViewModels
4. **No uses !! operator** - maneja nullability correctamente
5. **No ignores excepciones** - siempre maneja o propaga
6. **No uses magic numbers** - define constantes nombradas
7. **No hagas repositories con lógica de UI**
8. **No uses LiveData** para nuevo código (usa StateFlow)
9. **No copies código** - refactoriza a funciones reutilizables
10. **No commitees secrets** - usa BuildConfig o local.properties

## Common Prompts for AI Agents

### "Create a new feature"
Cuando crees una nueva feature, genera:
1. Domain model en `domain/model/`
2. Repository interface en `domain/repository/`
3. Repository implementation en `data/repository/`
4. Use case en `domain/usecase/`
5. ViewModel en `ui/viewmodel/`
6. Composable screens en `ui/screens/`
7. Tests para cada capa

### "Add network call"
Para nuevas llamadas de red:
1. Definir DTO en `data/remote/dto/`
2. Añadir función en ApiService
3. Implementar en RemoteDataSource
4. Actualizar Repository
5. Añadir mapping de DTO a domain model
6. Crear tests con MockWebServer

### "Refactor to Clean Architecture"
Cuando refactorices código existente:
1. Extraer modelos de dominio
2. Crear repository interface
3. Mover lógica de datos a repository impl
4. Crear use cases si hay lógica de negocio
5. Actualizar ViewModel para usar use cases
6. Mantener tests funcionando

## Code Review Checklist

Antes de marcar un PR como listo:
- [ ] Código sigue convenciones de naming
- [ ] Implementa arquitectura Clean
- [ ] Incluye tests unitarios (cobertura > 80%)
- [ ] KDoc en APIs públicas
- [ ] Manejo de errores apropiado
- [ ] Sin warnings de lint
- [ ] Accesibilidad implementada
- [ ] Revisión de seguridad (sin secrets)
- [ ] Rendimiento considerado
- [ ] Backward compatibility verificada

## Resources

- [Android Developers](https://developer.android.com)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Jetpack Compose Docs](https://developer.android.com/jetpack/compose)
- [Architecture Guide](https://developer.android.com/topic/architecture)
```

## Por Qué agents.md Funciona

### 1. **Consistencia Automática**
Con `agents.md`, cada vez que pides a un agente que genere código, sigue las mismas convenciones:

```kotlin
// Sin agents.md - código inconsistente:
class userRepo {  // naming incorrecto
    fun getuser(id: String) {  // camelCase inconsistente
        // LiveData cuando el proyecto usa StateFlow
        val user = MutableLiveData<User>()
    }
}

// Con agents.md - código consistente:
class UserRepository @Inject constructor(
    private val remoteDataSource: UserRemoteDataSource
) {
    fun getUser(id: String): Flow<Result<User>> {
        // Implementación siguiendo convenciones del proyecto
    }
}
```

### 2. **Onboarding Acelerado**
Nuevos miembros del equipo (humanos o IA) tienen una referencia clara:

```markdown
# Para nuevos desarrolladores
Antes de tu primer commit, lee agents.md para entender:
- Arquitectura del proyecto
- Convenciones de código
- Setup de desarrollo
- Workflow de testing
```

### 3. **Documentación Viva**
A diferencia de documentación tradicional, `agents.md` se mantiene actualizado porque:
- Se usa constantemente por los agentes
- Código desactualizado genera problemas inmediatos
- Es revisado en cada PR

## Mejores Prácticas para agents.md

### 1. Sé Específico y Concreto
```markdown
❌ MAL:
## Testing
Escribe tests para tu código.

✅ BIEN:
## Testing
- Usa JUnit5 para unit tests
- Naming: `should[ExpectedBehavior]When[Condition]`
- Cobertura mínima: 80%
- Ejemplo:
```kotlin
@Test
fun `should emit success when data loads correctly`() = runTest {
    // test implementation
}
```
```

### 2. Incluye Ejemplos de Código
Los agentes aprenden mejor de ejemplos concretos:

```markdown
## Dependency Injection

### Providing Dependencies
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    
    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app-database"
        ).build()
    }
}
```

### Injecting Dependencies
```kotlin
@HiltViewModel
class MyViewModel @Inject constructor(
    private val repository: MyRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel()
```
```

### 3. Mantén Secciones Organizadas
```markdown
# Estructura Recomendada

## 📋 Project Overview (qué es el proyecto)
## 🏗️ Architecture (cómo está estructurado)
## 📝 Coding Conventions (cómo escribir código)
## 🧪 Testing Strategy (cómo hacer tests)
## 🔧 Common Tasks (tareas frecuentes)
## 📦 Dependencies (librerías y uso)
## ✅ DO's (prácticas recomendadas)
## ❌ DON'Ts (prácticas prohibidas)
## 🤖 AI Prompts (prompts comunes para agentes)
```

### 4. Actualiza Regularmente
```markdown
## Changelog del agents.md

### 2025-12-29
- Añadida sección de Jetpack Compose guidelines
- Actualizado testing con Turbine para Flows
- Migración de LiveData a StateFlow documentada

### 2025-11-15
- Añadida arquitectura Clean
- Documentadas convenciones de naming
- Ejemplos de Hilt modules
```

## Integrando agents.md en tu Workflow

### Durante Desarrollo
```bash
# El agente lee agents.md automáticamente
$ gh copilot suggest "create user repository"

# GitHub Copilot:
# Basándome en agents.md, creo el repository siguiendo
# Clean Architecture con cache-first strategy...

interface UserRepository {
    fun getUser(id: String): Flow<Result<User>>
}

class UserRepositoryImpl @Inject constructor(...)
```

### Durante Code Review
```markdown
# En PR template
## Checklist
- [ ] Código sigue guidelines de agents.md
- [ ] Arquitectura consistente con agents.md
- [ ] Testing según estrategia en agents.md
- [ ] Naming conventions respetadas
```

### Durante Onboarding
```markdown
# Guía para nuevos desarrolladores

1. Lee README.md para entender el proyecto
2. Lee agents.md para entender cómo desarrollamos
3. Configura tu entorno según SETUP.md
4. Lee el código con el contexto de agents.md
```

## Herramientas que Soportan agents.md

### GitHub Copilot
```javascript
// .github/copilot-instructions.md
// GitHub Copilot lee automáticamente:
// - agents.md en la raíz
// - .github/copilot-instructions.md
// - README.md
```

### Gemini Code Assist
```markdown
# Gemini puede ser configurado para:
1. Leer agents.md al inicio de cada sesión
2. Referenciar agents.md en sugerencias
3. Validar código contra guidelines de agents.md
```

### Cursor IDE
```json
// .cursor/settings.json
{
  "cursor.aiContext": [
    "agents.md",
    "README.md",
    "ARCHITECTURE.md"
  ]
}
```

## Casos de Uso Avanzados

### agents.md Multi-Módulo
Para proyectos grandes con múltiples módulos:

```
project/
├── agents.md (general guidelines)
├── app/
│   └── agents.md (app-specific guidelines)
├── core/
│   └── agents.md (core-specific guidelines)
└── feature-user/
    └── agents.md (feature-specific guidelines)
```

### agents.md con Diferentes Roles
```markdown
# agents.md

## For Code Generation Agents
[Instrucciones para generar código nuevo]

## For Code Review Agents
[Criterios para revisar código]

## For Documentation Agents
[Guidelines para generar documentación]

## For Testing Agents
[Estrategia para generar tests]
```

## Conclusión

El archivo `agents.md` se ha convertido en un estándar porque resuelve un problema real: **comunicar efectivamente el contexto del proyecto a agentes de IA**. No es solo documentación; es una herramienta de productividad que:

- Mantiene consistencia en el código generado
- Acelera onboarding de nuevos desarrolladores
- Captura decisiones de arquitectura
- Facilita colaboración entre humanos y IA

**Para empezar:**
1. Crea `agents.md` en la raíz de tu proyecto
2. Documenta tu arquitectura y convenciones
3. Añade ejemplos concretos
4. Itera basándote en el uso real
5. Mantén actualizado con cada cambio arquitectónico

El futuro del desarrollo incluye colaboración estrecha con agentes de IA, y `agents.md` es tu forma de asegurar que esa colaboración sea productiva y consistente con tu visión del proyecto.
