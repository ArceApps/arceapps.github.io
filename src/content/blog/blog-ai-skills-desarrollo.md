---
title: "AI Skills en el Desarrollo: Potencia Tu Flujo de Trabajo Android"
description: "Descubre cómo los AI Skills transforman el desarrollo moderno, automatizando tareas complejas y mejorando la productividad en proyectos Android."
pubDate: "2025-12-29"
heroImage: "/images/placeholder-article-ai-skills.svg"
tags: ["AI", "Android", "Desarrollo", "Skills", "Gemini", "GitHub Copilot"]
---

## ¿Qué son los AI Skills?

Los **AI Skills** son capacidades especializadas que podemos configurar en asistentes de IA como Gemini o GitHub Copilot para realizar tareas específicas en nuestro flujo de desarrollo. A diferencia de simples prompts, los skills son configuraciones persistentes que entienden el contexto de tu proyecto y pueden ejecutar acciones complejas de manera consistente.

Piensa en ellos como "expertos especializados" que conocen tu proyecto, tus convenciones de código y tus herramientas favoritas. En el contexto de Android, esto significa tener asistentes que entienden Material Design, arquitectura MVVM, Jetpack Compose y las mejores prácticas de la plataforma.

### Diferencia entre Skills y Prompts Simples

```kotlin
// Prompt simple: "Crea una función para validar emails"
// Resultado: Código genérico sin contexto

// AI Skill configurado: "Android Email Validator"
// Resultado: Código que sigue tus convenciones:
class EmailValidator @Inject constructor() {
    /**
     * Valida un email siguiendo RFC 5322.
     * @param email String a validar
     * @return Result<Boolean> indicando validez o error específico
     */
    fun validate(email: String): Result<Boolean> {
        if (email.isBlank()) {
            return Result.failure(ValidationException("Email no puede estar vacío"))
        }
        
        val emailPattern = android.util.Patterns.EMAIL_ADDRESS
        return if (emailPattern.matcher(email).matches()) {
            Result.success(true)
        } else {
            Result.failure(ValidationException("Formato de email inválido"))
        }
    }
}
```

## Configurando Skills para Android Development

### 1. Skill de Arquitectura MVVM

Este skill asegura que todo código generado siga la arquitectura MVVM y las mejores prácticas de Android:

**Configuración en GitHub Copilot:**
```markdown
# Android MVVM Architecture Skill

Cuando generes código Android:
- Usa arquitectura MVVM (Model-View-ViewModel)
- ViewModels con StateFlow para estados UI
- Repository pattern para acceso a datos
- Dependency injection con Hilt
- Coroutines para operaciones asíncronas
- Manejo de errores con sealed classes
- Documentación KDoc para APIs públicas

Ejemplo de ViewModel:
```kotlin
@HiltViewModel
class UserViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<UserUiState>(UserUiState.Loading)
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()
    
    fun loadUser(userId: String) {
        viewModelScope.launch {
            _uiState.value = UserUiState.Loading
            userRepository.getUserById(userId)
                .collect { result ->
                    _uiState.value = when(result) {
                        is Result.Success -> UserUiState.Success(result.data)
                        is Result.Error -> UserUiState.Error(result.exception)
                    }
                }
        }
    }
}

sealed interface UserUiState {
    object Loading : UserUiState
    data class Success(val user: User) : UserUiState
    data class Error(val error: Throwable) : UserUiState
}
```
```

### 2. Skill de Testing Completo

Este skill genera tests siguiendo las mejores prácticas:

**Configuración en Gemini:**
```markdown
# Android Testing Skill

Para testing en Android:
- Unit tests con JUnit5 y MockK
- Tests de ViewModels con Turbine para Flows
- Tests de Repositories con fakes
- Naming: `should[ExpectedBehavior]When[Condition]`
- Arrange-Act-Assert pattern
- @Before para setup común
- Cobertura mínima 80%

Ejemplo de test de ViewModel:
```kotlin
@ExperimentalCoroutinesApi
class UserViewModelTest {
    
    private lateinit var viewModel: UserViewModel
    private lateinit var userRepository: FakeUserRepository
    
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()
    
    @Before
    fun setup() {
        userRepository = FakeUserRepository()
        viewModel = UserViewModel(userRepository)
    }
    
    @Test
    fun `should emit success state when user is loaded successfully`() = runTest {
        // Arrange
        val expectedUser = User("1", "Test User", "test@example.com")
        userRepository.setUser(expectedUser)
        
        // Act
        viewModel.loadUser("1")
        
        // Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf<UserUiState.Loading>()
            val successState = awaitItem() as UserUiState.Success
            assertThat(successState.user).isEqualTo(expectedUser)
        }
    }
}
```
```

### 3. Skill de Jetpack Compose

Para desarrollo moderno con Compose:

```markdown
# Jetpack Compose Skill

Al crear UI con Compose:
- Composables sin estado (stateless) siempre que sea posible
- Hoisting de estado al nivel apropiado
- Remember para estado local
- LaunchedEffect para side effects
- Material3 components
- Previews con @Preview y datos de ejemplo
- Accessibility (contentDescription, semantics)

Ejemplo:
```kotlin
@Composable
fun UserProfile(
    user: User,
    onEditClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .semantics { contentDescription = "Perfil de ${user.name}" }
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = user.name,
                style = MaterialTheme.typography.titleLarge
            )
            Text(
                text = user.email,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Button(
                onClick = onEditClick,
                modifier = Modifier.align(Alignment.End)
            ) {
                Icon(Icons.Default.Edit, contentDescription = "Editar perfil")
                Spacer(Modifier.width(8.dp))
                Text("Editar")
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun UserProfilePreview() {
    MaterialTheme {
        UserProfile(
            user = User("1", "John Doe", "john@example.com"),
            onEditClick = {}
        )
    }
}
```
```

## Skills Prácticos para Android

### Skill: Generación de API Clients

```kotlin
// Prompt con skill: "Crea un API client para usuarios"
// El skill genera automáticamente:

interface UserApiService {
    @GET("users/{id}")
    suspend fun getUserById(@Path("id") String): Response<UserDto>
    
    @GET("users")
    suspend fun getUsers(
        @Query("page") page: Int = 0,
        @Query("size") size: Int = 20
    ): Response<List<UserDto>>
    
    @POST("users")
    suspend fun createUser(@Body user: CreateUserRequest): Response<UserDto>
    
    @PUT("users/{id}")
    suspend fun updateUser(
        @Path("id") String,
        @Body user: UpdateUserRequest
    ): Response<UserDto>
    
    @DELETE("users/{id}")
    suspend fun deleteUser(@Path("id") String): Response<Unit>
}

// Y el Repository correspondiente:
class UserRepositoryImpl @Inject constructor(
    private val apiService: UserApiService,
    private val userDao: UserDao,
    private val networkMonitor: NetworkMonitor
) : UserRepository {
    
    override fun getUserById(id: String): Flow<Result<User>> = flow {
        // Cache-first strategy
        userDao.getUserById(id)?.let { cachedUser ->
            emit(Result.success(cachedUser.toModel()))
        }
        
        if (networkMonitor.isConnected()) {
            try {
                val response = apiService.getUserById(id)
                if (response.isSuccessful && response.body() != null) {
                    val user = response.body()!!.toEntity()
                    userDao.insertUser(user)
                    emit(Result.success(user.toModel()))
                } else {
                    emit(Result.failure(ApiException(response.code())))
                }
            } catch (e: Exception) {
                emit(Result.failure(e))
            }
        }
    }.flowOn(Dispatchers.IO)
}
```

### Skill: Database con Room

```kotlin
// Skill configura el skill para generar código Room optimizado

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    @ColumnInfo(name = "user_id")
    val id: String,
    
    @ColumnInfo(name = "name")
    val name: String,
    
    @ColumnInfo(name = "email")
    val email: String,
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),
    
    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE user_id = :userId")
    suspend fun getUserById(userId: String): UserEntity?
    
    @Query("SELECT * FROM users ORDER BY name ASC")
    fun getAllUsersFlow(): Flow<List<UserEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsers(users: List<UserEntity>)
    
    @Update
    suspend fun updateUser(user: UserEntity)
    
    @Delete
    suspend fun deleteUser(user: UserEntity)
    
    @Query("DELETE FROM users WHERE user_id = :userId")
    suspend fun deleteUserById(userId: String)
    
    @Query("DELETE FROM users")
    suspend fun deleteAllUsers()
}

@Database(
    entities = [UserEntity::class],
    version = 1,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

## Mejores Prácticas para Skills

### 1. Mantén Skills Específicos y Focalizados
No intentes que un skill haga todo. Crea skills especializados:
- `android-viewmodel`: Solo para ViewModels
- `android-compose-ui`: Solo para Compose UI
- `android-testing`: Solo para tests
- `android-repository`: Solo para repositories

### 2. Documenta Tus Skills
Cada skill debe tener:
- **Propósito**: Qué hace el skill
- **Contexto**: Cuándo usarlo
- **Ejemplos**: Código de referencia
- **Excepciones**: Casos especiales

### 3. Itera y Mejora
Los skills mejoran con el uso:
```markdown
# Changelog del Skill

v1.2:
- Añadido soporte para paginación en repositories
- Mejorado manejo de errores con sealed classes
- Añadidos ejemplos de testing

v1.1:
- Integración con Hilt para DI
- Uso de StateFlow en lugar de LiveData
- Documentación KDoc mejorada

v1.0:
- Versión inicial con MVVM básico
```

### 4. Comparte Skills con el Equipo
Los skills son activos del equipo:
- Almacena en repositorio compartido
- Versiona cambios
- Documenta decisiones de diseño
- Recolecta feedback del equipo

## Skills Avanzados: Integración con CI/CD

### Skill para Análisis de Código

```kotlin
// Este skill se puede invocar en pre-commit hooks o CI

/**
 * Skill: Android Code Analyzer
 * Revisa código antes de commit
 */
class CodeAnalyzerSkill {
    fun analyze(file: File): List<CodeIssue> {
        val issues = mutableListOf<CodeIssue>()
        
        // Verifica ViewModels
        if (file.path.contains("ViewModel")) {
            if (!file.readText().contains("@HiltViewModel")) {
                issues.add(
                    CodeIssue.Warning(
                        "ViewModel should use @HiltViewModel annotation",
                        file.name
                    )
                )
            }
            if (file.readText().contains("LiveData")) {
                issues.add(
                    CodeIssue.Suggestion(
                        "Consider using StateFlow instead of LiveData",
                        file.name
                    )
                )
            }
        }
        
        // Verifica Composables
        if (file.readText().contains("@Composable")) {
            if (!file.readText().contains("@Preview")) {
                issues.add(
                    CodeIssue.Warning(
                        "Composable should have @Preview for development",
                        file.name
                    )
                )
            }
        }
        
        return issues
    }
}

sealed class CodeIssue(val message: String, val file: String) {
    class Error(message: String, file: String) : CodeIssue(message, file)
    class Warning(message: String, file: String) : CodeIssue(message, file)
    class Suggestion(message: String, file: String) : CodeIssue(message, file)
}
```

## Casos de Uso Reales

### Caso 1: Migración de LiveData a StateFlow

Con un skill configurado, puedes pedirle a la IA:
"Migra este ViewModel de LiveData a StateFlow"

```kotlin
// ANTES (LiveData)
class UserViewModel @Inject constructor(
    private val repository: UserRepository
) : ViewModel() {
    
    private val _user = MutableLiveData<User>()
    val user: LiveData<User> = _user
    
    fun loadUser(id: String) {
        viewModelScope.launch {
            repository.getUser(id).collect {
                _user.value = it
            }
        }
    }
}

// DESPUÉS (StateFlow) - Generado por el skill
@HiltViewModel
class UserViewModel @Inject constructor(
    private val repository: UserRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<UserUiState>(UserUiState.Loading)
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()
    
    fun loadUser(id: String) {
        viewModelScope.launch {
            _uiState.value = UserUiState.Loading
            repository.getUser(id)
                .catch { error ->
                    _uiState.value = UserUiState.Error(error)
                }
                .collect { user ->
                    _uiState.value = UserUiState.Success(user)
                }
        }
    }
}

sealed interface UserUiState {
    object Loading : UserUiState
    data class Success(val user: User) : UserUiState
    data class Error(val error: Throwable) : UserUiState
}
```

### Caso 2: Generación de Tests Completos

"Genera tests completos para este ViewModel"

```kotlin
@ExperimentalCoroutinesApi
class UserViewModelTest {
    
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()
    
    private lateinit var viewModel: UserViewModel
    private val mockRepository = mockk<UserRepository>()
    
    @Before
    fun setup() {
        viewModel = UserViewModel(mockRepository)
    }
    
    @Test
    fun `should emit loading state initially`() = runTest {
        // Assert
        assertThat(viewModel.uiState.value).isInstanceOf<UserUiState.Loading>()
    }
    
    @Test
    fun `should emit success state when user loads successfully`() = runTest {
        // Arrange
        val expectedUser = User("1", "Test", "test@example.com")
        coEvery { mockRepository.getUser("1") } returns flowOf(expectedUser)
        
        // Act
        viewModel.loadUser("1")
        
        // Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf<UserUiState.Loading>()
            val success = awaitItem() as UserUiState.Success
            assertThat(success.user).isEqualTo(expectedUser)
        }
    }
    
    @Test
    fun `should emit error state when repository throws exception`() = runTest {
        // Arrange
        val expectedException = IOException("Network error")
        coEvery { mockRepository.getUser("1") } returns flow {
            throw expectedException
        }
        
        // Act
        viewModel.loadUser("1")
        
        // Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf<UserUiState.Loading>()
            val error = awaitItem() as UserUiState.Error
            assertThat(error.error).isEqualTo(expectedException)
        }
    }
}
```

## Conclusión

Los AI Skills transforman la manera en que desarrollamos aplicaciones Android. Al configurar skills específicos y bien documentados, convertimos a nuestros asistentes de IA en verdaderos compañeros de desarrollo que entienden nuestras convenciones, arquitectura y mejores prácticas.

**Claves para el éxito:**
- Crea skills específicos y focalizados
- Documenta exhaustivamente cada skill
- Itera basándote en resultados reales
- Comparte knowledge con tu equipo
- Mantén skills actualizados con evolución del proyecto

La inversión inicial en configurar skills de calidad se paga rápidamente en productividad, consistencia de código y reducción de bugs. Empieza con uno o dos skills básicos y expande tu biblioteca según las necesidades de tu proyecto.
