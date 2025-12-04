---
title: "ViewModel en MVVM Android: El Puente Inteligente Entre UI y Lógica"
description: "Domina la capa ViewModel en PuzzleQuest: gestión de estado, comunicación reactiva, manejo del lifecycle y patterns avanzados para crear ViewModels robustos y escalables."
pubDate: "2025-07-25"
heroImage: "/images/placeholder-article-viewmodel.svg"
tags: ["Android", "MVVM", "ViewModel", "StateFlow", "Kotlin", "Architecture"]
---

## 🎭 ¿Qué es el ViewModel en MVVM?

El ViewModel es el **director de orquesta** en nuestra app PuzzleQuest. Actúa como intermediario inteligente entre la UI (Activities/Fragments) y la capa Model, gestionando el estado de la pantalla, coordinando llamadas a Use Cases, y exponiendo datos de forma reactiva. Es la pieza que hace que MVVM sea tan poderoso para Android.

### 🎯 Responsabilidades del ViewModel
- **Gestión de Estado**: Mantiene y gestiona el estado de la UI.
- **Orquestación**: Coordina Use Cases y transformaciones.
- **Comunicación Reactiva**: Expone streams de datos observables.
- **Lifecycle Awareness**: Sobrevive a cambios de configuración.

## 🏗️ Arquitectura del ViewModel en PuzzleQuest

### 📊 Flujo de Datos con ViewModel
1. **UI Layer**: Fragment/Activity, Compose UI.
2. **ViewModel Layer**: State Management, Event Handling, Data Transformation.
3. **Domain Layer**: Use Cases, Repository.

## 🎮 ViewModel para Juego de Puzzles: GameViewModel

Implementemos el ViewModel más complejo de PuzzleQuest - el que maneja la lógica del juego:

```kotlin
@HiltViewModel
class GameViewModel @Inject constructor(
    private val startPuzzleGameUseCase: StartPuzzleGameUseCase,
    private val movePuzzlePieceUseCase: MovePuzzlePieceUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    // ========== State Management ==========
    private val _uiState = MutableStateFlow(GameUiState())
    val uiState: StateFlow<GameUiState> = _uiState.asStateFlow()
    
    private val _gameState = MutableStateFlow<GameState?>(null)
    val gameState: StateFlow<GameState?> = _gameState.asStateFlow()
    
    // ========== Initialization ==========
    init {
        initializeGame()
    }
    
    private fun initializeGame() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            // Logic to start game...
        }
    }
    
    // ========== User Actions ==========
    fun onPieceClicked(pieceId: PieceId) {
        // Logic to handle piece click...
    }
}
```

## 📋 ViewModel para Lista de Puzzles: PuzzleListViewModel

Un ViewModel más simple que maneja la lista de puzzles disponibles:

```kotlin
@HiltViewModel
class PuzzleListViewModel @Inject constructor(
    private val getPuzzleListUseCase: GetPuzzleListUseCase
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(PuzzleListUiState())
    val uiState: StateFlow<PuzzleListUiState> = _uiState.asStateFlow()
    
    init {
        loadInitialData()
    }
    
    private fun loadInitialData() {
        // Logic to load puzzles...
    }
}
```
