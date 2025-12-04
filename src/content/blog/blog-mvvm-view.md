---
title: "Capa View en MVVM Android: UI Reactiva y Declarativa"
description: "Construye interfaces dinámicas para PuzzleQuest con Jetpack Compose y View Binding, implementando observación reactiva del ViewModel y UX fluida para el juego de puzzles."
pubDate: "2025-07-20"
heroImage: "/images/placeholder-article-view-layer.svg"
tags: ["Android", "MVVM", "Jetpack Compose", "UI/UX", "Kotlin", "View Layer"]
---

## 📱 ¿Qué es la Capa View en MVVM?

La capa View es donde la magia se hace visible. En PuzzleQuest, esta capa transforma el estado del ViewModel en una interfaz interactiva y atractiva. Es responsable de **renderizar la UI**, **capturar eventos del usuario** y **reaccionar a cambios de estado** sin conocer la lógica de negocio subyacente.

### 🎯 Responsabilidades de la Capa View
- **Renderizado UI**: Muestra datos del ViewModel en elementos visuales.
- **Eventos Usuario**: Captura interacciones y las envía al ViewModel.
- **Observación Reactiva**: Se actualiza automáticamente cuando cambia el estado.
- **Navegación**: Maneja transiciones entre pantallas.

## 🏗️ Arquitectura de View en PuzzleQuest

### 📊 Componentes de la Capa View
1. **UI Framework**: Jetpack Compose, View System, Navigation.
2. **Screen Components**: Fragments/Activities, Composables, Custom Views.
3. **State Observation**: collectAsState(), Observer Pattern, Data Binding.

## 🎮 Game Screen con Jetpack Compose

Implementemos la pantalla principal del juego usando Compose:

```kotlin
@Composable
fun GameScreen(
    viewModel: GameViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit,
    onNavigateToCompletion: (PuzzleCompletionResult) -> Unit
) {
    // ========== State Collection ==========
    val uiState by viewModel.uiState.collectAsState()
    val gameState by viewModel.gameState.collectAsState()
    
    // ========== Event Handling ==========
    LaunchedEffect(viewModel) {
        viewModel.uiEvents.collect { event ->
            when (event) {
                is GameUiEvent.PuzzleCompleted -> onNavigateToCompletion(event.result)
                // Handle other events...
            }
        }
    }
    
    // ========== UI Structure ==========
    Box(modifier = Modifier.fillMaxSize()) {
        if (uiState.isLoading) {
            LoadingIndicator(modifier = Modifier.align(Alignment.Center))
        } else {
            GameContent(
                puzzle = uiState.puzzle,
                gameState = gameState,
                onPieceClick = viewModel::onPieceClicked
            )
        }
    }
}
```

### 🧩 Componente del Grid de Puzzle

```kotlin
@Composable
fun PuzzleGrid(
    pieces: List<PuzzlePiece>,
    gridSize: GridSize,
    onPieceClick: (PieceId) -> Unit
) {
    Box(modifier = Modifier.aspectRatio(1f)) {
        pieces.forEach { piece ->
            PuzzlePieceComponent(
                piece = piece,
                onPieceClick = { onPieceClick(piece.id) }
            )
        }
    }
}
```

## 📋 Lista de Puzzles con LazyColumn

```kotlin
@Composable
fun PuzzleListScreen(
    viewModel: PuzzleListViewModel = hiltViewModel(),
    onPuzzleClick: (Puzzle) -> Unit
) {
    val puzzles by viewModel.puzzles.collectAsState()
    
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(items = puzzles, key = { it.id.value }) { puzzle ->
            PuzzleListItem(
                puzzle = puzzle,
                onClick = { onPuzzleClick(puzzle) }
            )
        }
    }
}
```
