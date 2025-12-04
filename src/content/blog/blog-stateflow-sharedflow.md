---
title: "StateFlow y SharedFlow: Gestión Avanzada de Estado y Eventos"
description: "Domina las diferencias críticas, casos de uso, configuración de búfer y políticas de repetición para construir aplicaciones reactivas robustas y libres de memory leaks."
pubDate: "2025-11-15"
heroImage: "/images/placeholder-article-stateflow-sharedflow.svg"
tags: ["Android", "Kotlin", "StateFlow", "SharedFlow", "Coroutines", "Reactive Programming"]
---

## 🎯 ¿Por qué Este Artículo es Para Expertos?

Si ya dominas **Kotlin Coroutines** y **Flow**, pero has tenido dolores de cabeza con memory leaks, pérdida de estado o comportamientos inesperados en la UI al usar flujos reactivos, este artículo es tu salvavidas. 🚨

StateFlow y SharedFlow no son simplemente "otra versión de LiveData" - son herramientas poderosas con comportamientos específicos que, mal utilizadas, pueden hundir tu app en un océano de bugs sutiles.

## 🌊 StateFlow vs SharedFlow: El Duelo Definitivo

Aunque ambos son **hot streams**, sus comportamientos y casos de uso son fundamentalmente diferentes:

### 🗃️ StateFlow: El Guardián del Estado
- **Propósito:** Mantener y emitir estado actual
- **Replay:** Siempre 1 (último valor)
- **Valor inicial:** Requerido obligatoriamente
- **Emisión:** Solo cuando el valor cambia (.value != previousValue)

### 📡 SharedFlow: El Mensajero de Eventos
- **Propósito:** Emitir eventos y notificaciones
- **Replay:** Configurable (0 por defecto)
- **Valor inicial:** No requerido
- **Emisión:** Cada emit() genera una emisión

## 🔬 StateFlow: Anatomía del Estado Perfecto

StateFlow es tu mejor amigo para manejar estado de UI. Es como un LiveData con esteroides, pero con superpoderes de Flow:

```kotlin
@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {
    
    // ✅ StateFlow para estado de UI complejo
    private val _uiState = MutableStateFlow(UserProfileUiState.Loading)
    val uiState: StateFlow<UserProfileUiState> = _uiState.asStateFlow()
    
    fun loadUserProfile(userId: String) {
        viewModelScope.launch {
            _uiState.value = UserProfileUiState.Loading
            try {
                val user = userRepository.getUserProfile(userId)
                _uiState.value = UserProfileUiState.Success(user)
            } catch (e: Exception) {
                _uiState.value = UserProfileUiState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
```

### 🎯 Cuándo usar StateFlow
- Estado de UI (loading, error, success)
- Configuraciones del usuario
- Estado de autenticación
- Contadores, progreso, cualquier valor "actual"

## 🚀 SharedFlow: El Maestro de los Eventos

SharedFlow es la herramienta perfecta para eventos que necesitan ser recibidos por múltiples collectors, pero no representan un "estado actual":

```kotlin
@HiltViewModel
class GameEventsViewModel @Inject constructor() : ViewModel() {
    
    // ✅ SharedFlow para eventos de UI one-time
    private val _uiEvents = MutableSharedFlow<GameUiEvent>(
        replay = 0,    // No replay - eventos one-time
        extraBufferCapacity = 64,  // Buffer para evitar suspend
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val uiEvents: SharedFlow<GameUiEvent> = _uiEvents.asSharedFlow()
    
    fun onPlayerMove(move: GameMove) {
        viewModelScope.launch {
            if (move.isWinning) {
                _uiEvents.emit(GameUiEvent.ShowVictoryDialog)
            }
        }
    }
}
```

## ⚠️ Trampas Comunes y Memory Leaks

### 1. SharingStarted: La Configuración Mortal

```kotlin
// ❌ MEMORY LEAK GARANTIZADO
val userData = flow.stateIn(scope, SharingStarted.Eagerly, null)

// ✅ PERFECTO: Se detiene automáticamente cuando no hay subscribers
val userData = flow.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = null
)
```

### 2. SharedFlow Replay: El Arma de Doble Filo

```kotlin
// ❌ PELIGROSO: Replay alto puede causar comportamientos inesperados
private val _events = MutableSharedFlow<Event>(replay = 10)

// ✅ CORRECTO: Para eventos one-time
private val _events = MutableSharedFlow<Event>(replay = 0)
```

## 🎨 Patterns en Jetpack Compose

Con Compose, el consumo de StateFlow y SharedFlow tiene sus propias mejores prácticas:

```kotlin
@Composable
fun ChatScreen(viewModel: ChatViewModel) {
    // ✅ StateFlow se convierte automáticamente en State
    val chatState by viewModel.chatState.collectAsState()
    
    // ✅ SharedFlow para eventos side-effect
    LaunchedEffect(viewModel) {
        viewModel.chatEvents.collect { event ->
            // Handle event
        }
    }
}
```

## 🚀 Migración desde LiveData

| LiveData Pattern | StateFlow Equivalent |
|------------------|----------------------|
| `MutableLiveData<T>` | `MutableStateFlow<T>` |
| `LiveData<T>` | `StateFlow<T>` |
| `SingleLiveEvent` | `SharedFlow(replay=0)` |

## 🎯 Conclusiones

StateFlow y SharedFlow no son simplemente "mejores versiones" de LiveData - son herramientas especializadas que requieren comprensión profunda de sus comportamientos y trade-offs.

- **Usa StateFlow** para "datos" y estado actual.
- **Usa SharedFlow** para "eventos" y notificaciones.
- **Configura buffers** generosamente pero monitorea memory usage.
- **Usa SharingStarted.WhileSubscribed()** para evitar leaks.
