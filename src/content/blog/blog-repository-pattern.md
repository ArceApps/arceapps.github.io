---
title: "Patrón Repository en Android: La Base de una Arquitectura Sólida"
description: "Descubre cómo el patrón Repository transforma el manejo de datos en tu app de puzzles, creando una capa de abstracción que hace tu código más limpio, testeable y mantenible."
pubDate: "2025-07-05"
heroImage: "/images/placeholder-article-repository.svg"
tags: ["Android", "Repository Pattern", "Clean Architecture", "MVVM", "Room", "Retrofit", "Caching"]
---

## 🏛️ ¿Qué es el Patrón Repository?

Imagina que estás desarrollando **PuzzleQuest**, nuestra app de juegos de puzzles. Los datos de tus partidas pueden venir de múltiples fuentes: base de datos local, API remota, caché en memoria, o incluso archivos locales. El patrón Repository actúa como un **bibliotecario especializado** que sabe exactamente dónde encontrar cada dato que necesitas, sin que tu código de negocio tenga que preocuparse por los detalles.

El patrón Repository encapsula la lógica necesaria para acceder a fuentes de datos. Centraliza la funcionalidad común de acceso a datos, proporcionando mejor mantenibilidad y desacoplando la infraestructura o tecnología usada para acceder a bases de datos de la capa de modelo de dominio.

## 🎯 ¿Por qué necesitas Repository en tu app de puzzles?

- **Abstracción de Fuentes de Datos**: Tu ViewModel no necesita saber si los puzzles vienen de Room, Retrofit o SharedPreferences.
- **Testabilidad Superior**: Puedes crear implementaciones fake del repository para tests unitarios.
- **Cacheo Inteligente**: Implementa estrategias de caché transparentes para el resto de la aplicación.
- **Sincronización Offline/Online**: Maneja automáticamente cuándo usar datos locales vs remotos.

## 🏗️ Arquitectura del Repository en PuzzleQuest

### 📊 Flujo de Datos
1. **UI (Fragment/Activity)**
2. **ViewModel**
3. **Repository**
4. **Data Sources** (Room DB, Retrofit API, Memory Cache)

## 🔧 Implementación Práctica: PuzzleRepository

### 1. Definiendo el Modelo de Datos

```kotlin
@Entity(tableName = "puzzles")
data class Puzzle(
    @PrimaryKey
    val id: String,
    val title: String,
    val description: String,
    val difficulty: Int,
    val imageUrl: String,
    val gridSize: Int,
    val pieces: List<PuzzlePiece>,
    val isCompleted: Boolean = false
)
```

### 2. Interface del Repository

```kotlin
interface PuzzleRepository {
    suspend fun getAllPuzzles(): Flow<List<Puzzle>>
    suspend fun getPuzzleById(id: String): Puzzle?
    suspend fun updatePuzzleProgress(puzzleId: String, pieces: List<PuzzlePiece>)
    suspend fun syncPuzzlesFromRemote(): Result<Unit>
}
```

### 3. Implementación del Repository

```kotlin
@Singleton
class PuzzleRepositoryImpl @Inject constructor(
    private val localDataSource: PuzzleLocalDataSource,
    private val remoteDataSource: PuzzleRemoteDataSource,
    private val cacheDataSource: PuzzleCacheDataSource,
    private val networkMonitor: NetworkMonitor
) : PuzzleRepository {

    override suspend fun getAllPuzzles(): Flow<List<Puzzle>> {
        return flow {
            // 1. Emitir datos del caché si están disponibles
            val cachedPuzzles = cacheDataSource.getAllPuzzles()
            if (cachedPuzzles.isNotEmpty()) emit(cachedPuzzles)

            // 2. Obtener datos locales
            val localPuzzles = localDataSource.getAllPuzzles().first()
            emit(localPuzzles)

            // 3. Si hay conexión, sincronizar con remoto
            if (networkMonitor.isConnected()) {
                try {
                    val remotePuzzles = remoteDataSource.getAllPuzzles()
                    val mergedPuzzles = mergePuzzles(localPuzzles, remotePuzzles)
                    
                    cacheDataSource.savePuzzles(mergedPuzzles)
                    localDataSource.insertPuzzles(mergedPuzzles)
                    
                    emit(mergedPuzzles)
                } catch (e: Exception) {
                    Timber.w(e, "Error al sincronizar puzzles remotos")
                }
            }
        }.distinctUntilChanged()
    }
}
```

## 💾 Data Sources: Separando las Responsabilidades

### Local Data Source (Room)

```kotlin
@Singleton
class PuzzleLocalDataSource @Inject constructor(
    private val puzzleDao: PuzzleDao
) {
    fun getAllPuzzles(): Flow<List<Puzzle>> = puzzleDao.getAllPuzzles()
    suspend fun insertPuzzles(puzzles: List<Puzzle>) = puzzleDao.insertAll(puzzles)
}
```

### Remote Data Source (Retrofit)

```kotlin
@Singleton
class PuzzleRemoteDataSource @Inject constructor(
    private val puzzleApiService: PuzzleApiService
) {
    suspend fun getAllPuzzles(): List<Puzzle> {
        return puzzleApiService.getAllPuzzles().map { it.toDomain() }
    }
}
```

## 🧪 Testing del Repository

```kotlin
@Test
fun `when getAllPuzzles called with cache available, should emit cached data first`() = runTest {
    // Given
    val cachedPuzzles = listOf(createTestPuzzle("1"), createTestPuzzle("2"))
    val localPuzzles = listOf(createTestPuzzle("3"))
    
    every { mockCacheDataSource.getAllPuzzles() } returns cachedPuzzles
    every { mockLocalDataSource.getAllPuzzles() } returns flowOf(localPuzzles)
    
    // When
    val result = repository.getAllPuzzles().take(2).toList()
    
    // Then
    assertEquals(2, result.size)
    assertEquals(cachedPuzzles, result.first())
    assertEquals(localPuzzles, result[1])
}
```

## 🔗 Integración con ViewModel

```kotlin
@HiltViewModel
class PuzzleListViewModel @Inject constructor(
    private val puzzleRepository: PuzzleRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(PuzzleListUiState())
    val uiState: StateFlow<PuzzleListUiState> = _uiState.asStateFlow()
    
    init {
        loadPuzzles()
    }
    
    private fun loadPuzzles() {
        viewModelScope.launch {
            puzzleRepository.getAllPuzzles()
                .collect { puzzles ->
                    _uiState.update { it.copy(puzzles = puzzles) }
                }
        }
    }
}
```

## ⚡ Mejores Prácticas

- **Cache Strategy**: Implementa múltiples niveles de caché (memoria, disco, red).
- **Sync Strategy**: Sync en background usando WorkManager.
- **Offline-First**: Prioriza datos locales para mejor UX.
- **Testing Strategy**: Mock data sources individualmente.

## 🔧 Configuración con Dependency Injection

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    
    @Provides
    @Singleton
    fun providePuzzleRepository(
        localDataSource: PuzzleLocalDataSource,
        remoteDataSource: PuzzleRemoteDataSource,
        cacheDataSource: PuzzleCacheDataSource,
        networkMonitor: NetworkMonitor
    ): PuzzleRepository = PuzzleRepositoryImpl(
        localDataSource,
        remoteDataSource,
        cacheDataSource,
        networkMonitor
    )
}
```
