---
title: "SOLID en Android: Clean Architecture para Apps Modernas"
description: "Descubre cómo aplicar los principios SOLID en tu app de puzzles Android para crear una arquitectura robusta, escalable y mantenible."
pubDate: 2025-06-15
heroImage: "/images/placeholder-article-solid.svg"
tags: ["Android", "SOLID", "Architecture", "Design Patterns", "Clean Code"]
reference_id: "23245d12-f1a0-4c90-a479-5054040d07f3"
---
## 🏗️ Introducción a SOLID en Android

Los principios SOLID son la base de la programación orientada a objetos moderna y son cruciales para el desarrollo de apps Android escalables como **PuzzleQuest**.

- **S** - Single Responsibility Principle (SRP)
- **O** - Open/Closed Principle (OCP)
- **L** - Liskov Substitution Principle (LSP)
- **I** - Interface Segregation Principle (ISP)
- **D** - Dependency Inversion Principle (DIP)

Aplicar estos principios en Android nos ayuda a evitar el temido "Spaghetti Code" y nos facilita el mantenimiento y testing de nuestra app.

## 🎯 Single Responsibility Principle (SRP)

> "Una clase debe tener una, y solo una, razón para cambiar."

En nuestra app de puzzles, evitamos las "God Activities" que hacen todo.

### ❌ Violación de SRP

```kotlin
class GameActivity : AppCompatActivity() {
    private val puzzleData = mutableListOf<Piece>()

    // ❌ Lógica de UI mezclada con lógica de datos y red
    fun loadPuzzle() {
        // Llamada a API
        // Parseo de JSON
        // Lógica de juego
        // Actualización de UI
    }
}
```

### ✅ Aplicación de SRP

Separamos responsabilidades en clases dedicadas:

```kotlin
// Responsabilidad: Orquestar UI y ViewModel
class GameActivity : AppCompatActivity() {
    private val viewModel: GameViewModel by viewModels()
    // Solo código de UI
}

// Responsabilidad: Gestionar estado y lógica de presentación
class GameViewModel(
    private val getPuzzleUseCase: GetPuzzleUseCase
) : ViewModel()

// Responsabilidad: Lógica de negocio pura del juego
class PuzzleGameEngine {
    fun calculateMove(currentBoard: Board, move: Move): BoardResult
}

// Responsabilidad: Obtención de datos
class PuzzleRepository(
    private val api: PuzzleApi,
    private val db: PuzzleDao
)
```

## 🔓 Open/Closed Principle (OCP)

> "Las entidades de software deben estar abiertas para extensión, pero cerradas para modificación."

Queremos añadir nuevos tipos de puzzles sin modificar el código existente.

### ❌ Violación de OCP

```kotlin
class PuzzleRenderer {
    fun render(puzzle: Puzzle) {
        if (puzzle.type == "SUDOKU") {
            // Renderizar Sudoku
        } else if (puzzle.type == "CROSSWORD") {
            // Renderizar Crucigrama
        }
        // Cada nuevo tipo requiere modificar esta clase
    }
}
```

### ✅ Aplicación de OCP

Usamos polimorfismo para extender funcionalidad:

```kotlin
interface PuzzleRenderer {
    fun render(puzzle: Puzzle)
}

class SudokuRenderer : PuzzleRenderer {
    override fun render(puzzle: Puzzle) { /* Lógica Sudoku */ }
}

class CrosswordRenderer : PuzzleRenderer {
    override fun render(puzzle: Puzzle) { /* Lógica Crucigrama */ }
}

// Factoría o Inyección de Dependencias provee el renderer adecuado
class GameRenderer(private val renderer: PuzzleRenderer) {
    fun draw(puzzle: Puzzle) {
        renderer.render(puzzle) // No sabe ni le importa qué tipo es
    }
}
```

## 🔄 Liskov Substitution Principle (LSP)

> "Las clases derivadas deben poder sustituirse por sus clases base."

Si tenemos una jerarquía de clases de `Puzzle`, cualquier subclase debe comportarse correctamente como un `Puzzle`.

### ❌ Violación de LSP

```kotlin
open class Puzzle {
    open fun shufflePieces() { /* ... */ }
}

class StaticPuzzle : Puzzle() {
    override fun shufflePieces() {
        throw UnsupportedOperationException("Static puzzles cannot be shuffled!")
    }
}
```

Esto rompe LSP porque `StaticPuzzle` no se comporta como un `Puzzle` esperado.

### ✅ Aplicación de LSP

Refactorizamos la jerarquía para reflejar capacidades reales:

```kotlin
interface Puzzle {
    val id: String
    val name: String
}

interface ShufflablePuzzle : Puzzle {
    fun shufflePieces()
}

class JigsawPuzzle : ShufflablePuzzle {
    override fun shufflePieces() { /* ... */ }
}

class StaticPuzzle : Puzzle {
    // No implementa ShufflablePuzzle, no tiene método shufflePieces()
}
```

## ✂️ Interface Segregation Principle (ISP)

> "Los clientes no deben depender de interfaces que no usan."

Evitamos interfaces gigantes ("Fat Interfaces") en nuestros Listeners o Callbacks.

### ❌ Violación de ISP

```kotlin
interface GameEventListener {
    fun onGameStarted()
    fun onPieceMoved()
    fun onScoreUpdated()
    fun onTimerTick()
    fun onGameOver()
    fun onPause()
}

// Una vista de solo puntuación no necesita saber sobre movimiento de piezas
class ScoreView : GameEventListener {
    override fun onScoreUpdated() { updateScore() }
    override fun onPieceMoved() { /* Vacío - No me importa */ }
    // ... muchos métodos vacíos
}
```

### ✅ Aplicación de ISP

Dividimos en interfaces más específicas:

```kotlin
interface GameStateListener {
    fun onGameStarted()
    fun onGameOver()
}

interface ScoreListener {
    fun onScoreUpdated(newScore: Int)
}

interface MoveListener {
    fun onPieceMoved(move: Move)
}

class ScoreView : ScoreListener {
    override fun onScoreUpdated(newScore: Int) { updateScore() }
}
```

## 🔌 Dependency Inversion Principle (DIP)

> "Depende de abstracciones, no de concreciones."

Este es el corazón de la Clean Architecture y la Inyección de Dependencias.

### ❌ Violación de DIP

```kotlin
class PuzzleRepository {
    // Dependencia directa de una implementación concreta (SQLite)
    private val database = SQLiteDatabase()

    fun getPuzzle(id: String) {
        database.query(...)
    }
}
```

### ✅ Aplicación de DIP

Usamos interfaces para invertir la dependencia:

```kotlin
// Abstracción (Domain Layer)
interface PuzzleDataSource {
    fun getPuzzle(id: String): Puzzle
}

// Implementación Concreta (Data Layer)
class RoomPuzzleDataSource : PuzzleDataSource {
    override fun getPuzzle(id: String): Puzzle { /* Room implementation */ }
}

class FirebasePuzzleDataSource : PuzzleDataSource {
    override fun getPuzzle(id: String): Puzzle { /* Firebase implementation */ }
}

// Consumidor (Domain/Data Layer)
class PuzzleRepository(
    private val dataSource: PuzzleDataSource // Depende de la abstracción
) {
    fun getPuzzle(id: String) = dataSource.getPuzzle(id)
}
```

Ahora podemos cambiar `Room` por `Firebase` o un `Mock` para testing sin tocar el `PuzzleRepository`.

## 🚀 Conclusión

Aplicar SOLID en el desarrollo Android requiere disciplina, pero los beneficios son inmensos:

1. **Testabilidad**: Código desacoplado es fácil de testear.
2. **Mantenibilidad**: Cambios en un módulo no rompen otros.
3. **Escalabilidad**: Fácil añadir nuevas features (como nuevos tipos de puzzles).
4. **Legibilidad**: Clases pequeñas y enfocadas son más fáciles de entender.

En **PuzzleQuest**, estos principios nos permiten construir una base sólida sobre la cual podemos iterar y mejorar nuestro juego continuamente.
