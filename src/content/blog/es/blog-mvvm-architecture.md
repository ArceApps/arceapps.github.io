---
title: "Arquitectura MVVM en Android: Guía Completa desde Cero"
description: "Domina el patrón Model-View-ViewModel desde los conceptos básicos hasta implementaciones avanzadas con ejemplos prácticos de un juego de Buscaminas para Android."
pubDate: 2025-10-01
heroImage: "/images/placeholder-article-mvvm.svg"
tags: ["Android", "MVVM", "Architecture", "Kotlin", "Best Practices"]
reference_id: "4a17203c-115d-4548-bad9-4c67698de707"
---
## 🏛️ Teoría: La Evolución de las Arquitecturas de UI

Antes de entender MVVM (Model-View-ViewModel), debemos entender el problema que intenta resolver: el **acoplamiento entre la lógica de presentación y la interfaz gráfica**.

### Historia Breve
1.  **MVC (Model-View-Controller)**: Nacido en los 70 para interfaces de escritorio. En Android, las Activities solían actuar como "View" y "Controller" a la vez, creando "God Objects" imposibles de testear.
2.  **MVP (Model-View-Presenter)**: Popular en 2015. El Presenter no tenía referencias a Android (bueno para tests), pero tenía que actualizar la View manualmente (`view.showLoading()`, `view.hideLoading()`). Mucho boilerplate.
3.  **MVVM (Model-View-ViewModel)**: Creado por Microsoft para WPF en 2005 y adoptado por Google en 2017. La clave es el **Data Binding** y la **Observabilidad**.

### El Patrón Observer en MVVM
La diferencia fundamental de MVVM es que el ViewModel **no conoce a la View**. No hay `view.update()`.
En su lugar, el ViewModel expone un **Estado** observable (`StateFlow` o `LiveData`). La View se suscribe a este estado y "reacciona".

> **ViewModel**: "El estado ha cambiado a 'Cargando'".
> **View**: (Escucha el cambio) -> Muestra el ProgressBar.

Esto invierte la dependencia y desacopla totalmente la lógica de la UI.

## 🎯 Las Capas de MVVM: Anatomía Profunda

### 1. MODEL (La Verdad)
Es agnóstico a la UI. Contiene la lógica de negocio y los datos.
En Clean Architecture, esto se subdivide en:
-   **Data Source**: API, DB.
-   **Repository**: Fuente única de verdad.
-   **Use Cases**: Reglas de negocio.

### 2. VIEW (El Pintor)
Es tonta. Solo sabe pintar pixels y capturar toques.
-   **En XML**: Activities/Fragments.
-   **En Compose**: Funciones @Composable.
-   **Responsabilidad**: Observar el ViewModel y renderizarse a sí misma. **Nunca** toma decisiones lógicas.

### 3. VIEWMODEL (El Orquestador)
Es el puente. Transforma los datos del Modelo en "Estado de UI".
-   Sobrevive a cambios de configuración (rotación).
-   No tiene referencias a Views ni Contexts (para evitar Memory Leaks).
-   Expone flujos de datos (Streams).

## 🎮 Implementando MVVM: Ejemplo con Buscaminas

Para demostrar MVVM en acción, construiremos un **juego de Buscaminas**.

### 1. MODEL: Lógica Pura

```kotlin
// MinesweeperCell.kt - Entidad inmutable
data class MinesweeperCell(
    val row: Int,
    val col: Int,
    val isMine: Boolean = false,
    val isRevealed: Boolean = false,
    val isFlagged: Boolean = false
)

// Use Case: Lógica compleja de revelar celdas (Flood Fill)
class RevealCellUseCase @Inject constructor() {
    operator fun invoke(board: List<List<Cell>>, row: Int, col: Int): Board {
        // Algoritmo recursivo puro, fácil de testear
        // No sabe nada de Android, ni de ViewModels.
    }
}
```

### 2. VIEWMODEL: Gestión de Estado

```kotlin
// UI State: Representa la pantalla completa en un instante del tiempo
data class GameUiState(
    val board: List<List<MinesweeperCell>> = emptyList(),
    val gameState: GameStatus = GameStatus.PLAYING,
    val isLoading: Boolean = false
)

@HiltViewModel
class MinesweeperViewModel @Inject constructor(
    private val revealCellUseCase: RevealCellUseCase,
    private val repository: GameRepository
) : ViewModel() {
    
    // Backing property para encapsular estado mutable
    private val _uiState = MutableStateFlow(GameUiState())
    val uiState: StateFlow<GameUiState> = _uiState.asStateFlow()
    
    fun onCellClick(row: Int, col: Int) {
        // Lanzamos corrutina en el scope del ViewModel
        viewModelScope.launch {
            val currentBoard = _uiState.value.board
            val newBoard = revealCellUseCase(currentBoard, row, col)

            // Actualizamos el estado de forma inmutable
            _uiState.update { currentState ->
                currentState.copy(board = newBoard)
            }

            checkWinCondition()
        }
    }
}
```

### 3. VIEW (Compose): Reacción al Estado

```kotlin
@Composable
fun MinesweeperScreen(
    viewModel: MinesweeperViewModel = hiltViewModel()
) {
    // 1. Consumir el estado de forma segura con el ciclo de vida
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    
    // 2. Renderizar basado SOLO en el estado
    if (state.isLoading) {
        CircularProgressIndicator()
    } else {
        BoardGrid(
            board = state.board,
            // 3. Pasar eventos hacia arriba (Unidirectional Data Flow)
            onCellClick = { row, col -> viewModel.onCellClick(row, col) }
        )
    }
    
    // 4. Manejar efectos (One-off events) como Dialogs de Game Over
    if (state.gameState == GameStatus.LOST) {
        GameOverDialog()
    }
}
```

## 🔄 El Ciclo de Vida del ViewModel

Una de las mayores ventajas de usar la clase `ViewModel` de AndroidX es su integración con el ciclo de vida.

1.  **Creación**: Se crea cuando el Fragment/Activity se crea por primera vez.
2.  **Retención**: Si rotas la pantalla, la Activity se destruye y recrea, pero **la instancia del ViewModel se mantiene en memoria**. Esto evita tener que recargar datos de la red.
3.  **Limpieza**: Cuando sales de la pantalla (Back press), se llama a `onCleared()`, donde se cancelan automáticamente todas las corrutinas del `viewModelScope`.

## ⚠️ Errores Comunes en MVVM

1.  **Lógica en la UI**: `if (user.isAdmin) { showButton() }` en el Fragment.
    *   *Solución*: El ViewModel debería exponer `val showAdminButton: Boolean`.
2.  **Exponer objetos mutables**: Exponer `MutableStateFlow` o `MutableList`.
    *   *Solución*: Siempre exponer interfaces de solo lectura (`StateFlow`, `List`).
3.  **Pasar Context al ViewModel**: `ViewModel(context)`.
    *   *Riesgo*: Memory Leak masivo.
    *   *Solución*: Usar `AndroidViewModel(application)` si es estrictamente necesario (para Resources), pero preferiblemente inyectar un proveedor de recursos.

## 🎯 Conclusión

MVVM no es solo una forma de organizar código; es una estrategia defensiva. Defiende tu lógica de negocio del caos del ciclo de vida de Android. Defiende tu UI de la complejidad de los datos. Y sobre todo, hace que tu aplicación sea **robusta, testeable y mantenible**.
