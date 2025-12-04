---
title: "Capa Model en MVVM Android: Fundamentos de una Arquitectura Sólida"
description: "Descubre cómo construir la capa Model perfecta para PuzzleQuest, integrando modelos de dominio, repositorios y use cases en una arquitectura limpia y escalable."
pubDate: "2025-07-15"
heroImage: "/images/placeholder-article-model-layer.svg"
tags: ["Android", "MVVM", "Clean Architecture", "Model Layer", "Kotlin", "Domain Driven Design"]
---

## 🏗️ ¿Qué es la Capa Model en MVVM?

La capa Model es el **corazón de tu aplicación**. En PuzzleQuest, esta capa no solo representa los datos (puzzles, piezas, puntuaciones), sino que también encapsula toda la lógica de negocio, las reglas del juego y la gestión del estado de la aplicación. Es la capa más importante porque define *qué hace tu app*, independientemente de cómo se muestra al usuario.

### 🎯 Responsabilidades de la Capa Model
- **Modelos de Dominio**: Define las entidades core del negocio.
- **Repositorios**: Abstrae el acceso a fuentes de datos.
- **Use Cases**: Encapsula lógica de negocio específica.
- **Servicios**: Proporciona funcionalidades transversales.

## 🧩 Arquitectura de la Capa Model en PuzzleQuest

### 📊 Estructura de la Capa Model
1. **Domain Layer (Núcleo)**: Entities, Use Cases, Repository Interfaces.
2. **Data Layer (Implementación)**: Repository Impl, Data Sources, Mappers.
3. **Infrastructure Layer**: Room DB, Retrofit API, SharedPrefs.

## 🎲 Modelos de Dominio: Las Entidades de PuzzleQuest

### 1. Modelo Principal: Puzzle

```kotlin
data class Puzzle(
    val id: PuzzleId,
    val metadata: PuzzleMetadata,
    val gameConfiguration: GameConfiguration,
    val progress: PuzzleProgress,
    val statistics: PuzzleStatistics
) {
    fun canBeStarted(): Boolean {
        return metadata.isActive && 
               gameConfiguration.isValid() && 
               !progress.isCompleted
    }
}
```

### 2. Modelo de Piezas del Puzzle

```kotlin
data class PuzzlePiece(
    val id: PieceId,
    val puzzleId: PuzzleId,
    val position: Position,
    val currentPosition: Position,
    val visualData: PieceVisualData,
    val state: PieceState = PieceState.NORMAL
) {
    fun isInCorrectPosition(): Boolean = position == currentPosition
    
    fun canMoveTo(targetPosition: Position, gridSize: GridSize): Boolean {
        return targetPosition.isValid(gridSize) && 
               currentPosition.isAdjacentTo(targetPosition)
    }
}
```

### 3. Enums y Value Objects del Dominio

```kotlin
enum class GridSize(val rows: Int, val columns: Int) {
    SMALL_3X3(3, 3),
    MEDIUM_4X4(4, 4),
    LARGE_5X5(5, 5),
    EXPERT_6X6(6, 6);
    
    fun isSupported(): Boolean = this in supportedSizes
}

enum class DifficultyLevel(val value: Int, val displayName: String) {
    BEGINNER(1, "Principiante"),
    EASY(2, "Fácil"),
    MEDIUM(3, "Medio"),
    HARD(4, "Difícil"),
    EXPERT(5, "Experto");
}
```

## 🎯 Domain Services: Lógica de Negocio Compleja

Los Domain Services encapsulan lógica de negocio que no pertenece naturalmente a una entidad específica:

```kotlin
interface PuzzleGameEngine {
    fun validateMove(currentState: GameState, move: PuzzleMove): MoveValidationResult
    fun applyMove(currentState: GameState, move: PuzzleMove): GameState
    fun isPuzzleCompleted(gameState: GameState): Boolean
    fun calculateScore(gameState: GameState): GameScore
}
```

## 🏪 Repository Pattern en la Capa Model

Los repositories definen contratos que la capa de datos debe implementar:

```kotlin
interface PuzzleRepository {
    fun getAllPuzzles(): Flow<List<Puzzle>>
    suspend fun getPuzzleById(id: PuzzleId): Puzzle?
    suspend fun saveProgress(puzzleId: PuzzleId, progress: PuzzleProgress)
}
```
