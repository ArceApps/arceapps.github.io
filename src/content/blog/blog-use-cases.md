---
title: "Use Cases en Android: Lógica de Negocio Limpia y Reutilizable"
description: "Aprende a implementar Use Cases (Interactors) en tu app de puzzles para encapsular la lógica de negocio, mantener ViewModels ligeros y crear código altamente testeable."
pubDate: "2025-07-10"
heroImage: "/images/placeholder-article-use-cases.svg"
tags: ["Android", "Use Cases", "Clean Architecture", "Kotlin", "Testing"]
---

## 🎯 ¿Qué son los Use Cases?

Los Use Cases, también conocidos como **Interactors**, son clases que encapsulan una única funcionalidad de negocio. En nuestra app **PuzzleQuest**, cada acción importante del usuario se convierte en un Use Case específico: "Iniciar Puzzle", "Guardar Progreso", "Calcular Puntuación", etc.

Un Use Case representa una **intención del usuario** en el sistema. Es la traducción de "¿qué quiere hacer el usuario?" a código ejecutable, manteniendo toda la lógica de negocio separada de la UI y las fuentes de datos.

## 🏗️ Arquitectura con Use Cases en PuzzleQuest

### 📊 Flujo de Datos con Use Cases
1. **UI Layer** (User Action)
2. **ViewModel** (Calls Use Case)
3. **Use Cases** (Business Logic)
4. **Repository** (Data Operations)
5. **Data Sources** (Local DB / Remote API)

## 🎮 Use Cases en PuzzleQuest: Casos Reales

Identifiquemos las principales acciones de usuario en nuestra app:

### 🧩 Gestión de Puzzles
- **GetPuzzleListUseCase** - Obtener lista de puzzles disponibles
- **GetPuzzleByIdUseCase** - Cargar un puzzle específico
- **SearchPuzzlesUseCase** - Buscar puzzles por criterios

### 🎯 Gameplay
- **StartPuzzleGameUseCase** - Inicializar una partida
- **MovePuzzlePieceUseCase** - Mover pieza del puzzle
- **SaveGameProgressUseCase** - Guardar progreso de partida

## 🔧 Implementación: Base Use Case

Primero, creemos una base común para todos nuestros Use Cases:

```kotlin
abstract class UseCase<in P, R> {
    abstract suspend operator fun invoke(params: P): Result<R>
    
    open fun asFlow(params: P): Flow<Result<R>> = flow {
        emit(invoke(params))
    }
}
```

## 🎯 Use Case Específico: StartPuzzleGameUseCase

Implementemos el Use Case más complejo - iniciar una partida de puzzle:

```kotlin
@Singleton
class StartPuzzleGameUseCase @Inject constructor(
    private val puzzleRepository: PuzzleRepository,
    private val gameSessionRepository: GameSessionRepository,
    private val analyticsTracker: AnalyticsTracker
) : UseCase<StartPuzzleGameUseCase.Params, GameSession>() {
    
    override suspend operator fun invoke(params: Params): Result<GameSession> {
        return try {
            // 1. Validar puzzle existe
            val puzzle = puzzleRepository.getPuzzleById(params.puzzleId)
                ?: return Result.failure(PuzzleNotFoundException(params.puzzleId))
            
            // 2. Verificar si ya hay una sesión activa
            val existingSession = gameSessionRepository.getActiveSession(params.puzzleId)
            if (existingSession != null && !params.forceRestart) {
                return Result.success(existingSession)
            }
            
            // 3. Crear nueva sesión de juego
            val gameSession = createNewGameSession(puzzle, params)
            gameSessionRepository.saveGameSession(gameSession)
            
            Result.success(gameSession)
        } catch (e: Exception) {
            Result.failure(GameStartException("Error al iniciar puzzle: ${e.message}", e))
        }
    }
}
```

## 🎯 Use Case Simple: MovePuzzlePieceUseCase

Un ejemplo más sencillo para mover piezas del puzzle:

```kotlin
@Singleton
class MovePuzzlePieceUseCase @Inject constructor(
    private val gameSessionRepository: GameSessionRepository,
    private val gameRulesValidator: GameRulesValidator
) : UseCase<MovePuzzlePieceUseCase.Params, MoveResult>() {
    
    override suspend operator fun invoke(params: Params): Result<MoveResult> {
        return try {
            val currentSession = gameSessionRepository.getActiveSession(params.puzzleId)
                ?: return Result.failure(NoActiveSessionException())
            
            val validationResult = gameRulesValidator.validateMove(
                currentSession.currentPieces, params.fromPosition, params.toPosition
            )
            
            if (!validationResult.isValid) {
                return Result.success(MoveResult.Invalid(validationResult.reason))
            }
            
            // Aplicar movimiento y actualizar sesión...
            // ...
            
            Result.success(MoveResult.ValidMove(updatedSession))
        } catch (e: Exception) {
            Result.failure(MoveException("Error al mover pieza", e))
        }
    }
}
```

## 📊 Use Case con Flow: GetPuzzleListUseCase

Para casos que necesitan observar cambios de datos:

```kotlin
@Singleton
class GetPuzzleListUseCase @Inject constructor(
    private val puzzleRepository: PuzzleRepository,
    private val userPreferencesRepository: UserPreferencesRepository
) : FlowUseCase<GetPuzzleListUseCase.Params, List<Puzzle>>() {
    
    override operator fun invoke(params: Params): Flow<Result<List<Puzzle>>> {
        return flow {
            combine(
                puzzleRepository.getAllPuzzles(),
                userPreferencesRepository.getUserPreferences()
            ) { puzzles, preferences ->
                filterAndSortPuzzles(puzzles, params, preferences)
            }.collect { processedPuzzles ->
                emit(Result.success(processedPuzzles))
            }
        }
    }
}
```

## 🧪 Testing de Use Cases

Los Use Cases son extremadamente fáciles de testear:

```kotlin
@Test
fun `when puzzle exists and no active session, should create new game session`() = runTest {
    // Given
    val puzzleId = "test-puzzle-1"
    val params = StartPuzzleGameUseCase.Params(puzzleId)
    
    coEvery { mockPuzzleRepository.getPuzzleById(puzzleId) } returns createTestPuzzle(puzzleId)
    coEvery { mockGameSessionRepository.getActiveSession(puzzleId) } returns null
    
    // When
    val result = useCase(params)
    
    // Then
    assertTrue(result.isSuccess)
    coVerify { mockGameSessionRepository.saveGameSession(any()) }
}
```

## 🎭 Integración con ViewModel

Así es como los ViewModels consumen Use Cases:

```kotlin
@HiltViewModel
class GameViewModel @Inject constructor(
    private val startPuzzleGameUseCase: StartPuzzleGameUseCase
) : ViewModel() {
    
    fun startGame(puzzleId: String) {
        viewModelScope.launch {
            startPuzzleGameUseCase(StartPuzzleGameUseCase.Params(puzzleId))
                .onSuccess { session -> _uiState.update { it.copy(gameSession = session) } }
                .onFailure { error -> _uiState.update { it.copy(errorMessage = error.message) } }
        }
    }
}
```
