---
title: "StateFlow vs SharedFlow: Guía Definitiva para Android"
description: "Deja de usar LiveData. Entiende las diferencias profundas entre StateFlow y SharedFlow, cuándo usar cada uno y cómo evitar trampas comunes."
pubDate: 2025-09-30
lastmod: 2026-07-18
author: ArceApps
keywords:
  - "StateFlow"
  - "SharedFlow"
  - "Guía Definitiva"
  - "Kotlin"
  - "Reactivos"
canonical: "https://arceapps.com/es/blog/stateflow-sharedflow/"
heroImage: "/images/placeholder-article-stateflow-sharedflow.svg"
tags: ["Kotlin", "Coroutines", "Flow", "Android", "State Management"]
reference_id: "4f809146-8583-4075-ade0-d55d8523f8d9"
---


## 🌊 Teoría: Hot Flows

Tanto `StateFlow` como `SharedFlow` son **Hot Flows**.

- **Cold Flow (Flow normal)**: El código dentro del `flow { ... }` no se ejecuta hasta que alguien llama a `collect()`. Cada colector reinicia el flujo.
- **Hot Flow**: El flujo está activo independientemente de si hay colectores. Los datos se emiten y si nadie escucha, se pierden (o se guardan en buffer).

Esta distinción es **la pieza más importante** para entender los dos tipos. Una vez la interiorizas, las decisiones de arquitectura fluyen solas. Lo que viene a continuación es la versión completa de la guía rápida que publiqué originalmente: la he reescrito tras un año usándolos en producción y enseñándolos a juniors.

## 📦 StateFlow: El Sucesor de LiveData

`StateFlow` es una especialización de `SharedFlow` diseñada para **mantener estado**.

### Características Clave

1. **Siempre tiene valor**: Requiere un valor inicial. `state.value` siempre es seguro.
2. **Conflated**: Solo emite el *último* valor. Si emites "A", "B", "C" muy rápido y el colector es lento, solo recibirá "C". "A" y "B" se pierden (conflation).
3. **DistinctUntilChanged**: Si emites "A" y luego "A" otra vez, no notifica a los colectores.
4. **Reemplaza valor**: A diferencia de un `BehaviorSubject` de RxJava, no acumula historia, solo guarda el último.

**Uso Perfecto**: Estado de UI (`UiState`).

```kotlin
private val _uiState = MutableStateFlow(UiState.Loading)
val uiState = _uiState.asStateFlow()

fun onUserLoaded(user: User) {
    _uiState.value = UiState.Success(user)
}
```

El patrón `_state` privado mutable + `state` público inmutable es la convención canónica. Rómpelo solo si tienes una razón justificada (y la auditoría de código te la va a pedir).

## 📢 SharedFlow: El Bus de Eventos

`SharedFlow` es más configurable y general. No necesita valor inicial y puede reemitir valores antiguos (replay) o no.

### Configuración

```kotlin
val sharedFlow = MutableSharedFlow<Event>(
    replay = 0,      // Cuántos valores viejos enviar a nuevos suscriptores
    extraBufferCapacity = 0,
    onBufferOverflow = BufferOverflow.SUSPEND
)
```

**Uso Perfecto**: Eventos de una sola vez ("One-off events") como Toasts, Navegación, Snackbars.
Para eventos, usa `replay = 0`.

### El parámetro `replay` cambia todo

El error más común con `SharedFlow` es setear `replay = 1` "por si acaso". Eso convierte un bus de eventos en un `StateFlow` con peor ergonomía. Cada parámetro tiene un propósito:

| `replay` | Caso de uso real |
|---|---|
| `0` | Eventos one-shot (toast, navegación, snackbar) |
| `1` | "Último valor conocido" — pero entonces usa StateFlow, es lo mismo y mejor tipado |
| `2+` | Casi nunca. Si necesitas historial, usa un buffer externo (Room) |

**Regla mnemotécnica**: si tiene sentido que un nuevo suscriptor reciba el último valor al conectarse, usa `StateFlow`. Si no, usa `SharedFlow` con `replay = 0`. Las dos cosas que se pisan es donde nacen los bugs de re-emisión y pantallas que se comportan raro tras rotación.

## ⚠️ La Trampa del Lifecycle

LiveData pausaba la observación automáticamente cuando la Activity estaba en `STOPPED`. Los Flows **NO**.

Si colectas un Flow en `lifecycleScope.launch` directamente, seguirá colectando en background, gastando recursos y pudiendo crashear si intenta actualizar la UI.

### La Solución Correcta

```kotlin
// En Activity/Fragment
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { ... }
    }
}
```

O usando la extensión de `lifecycle-runtime-compose` en Jetpack Compose:

```kotlin
val state by viewModel.uiState.collectAsStateWithLifecycle()
```

`collectAsStateWithLifecycle()` es la versión correcta. `collectAsState()` (sin lifecycle) tiene el mismo problema que `launch { collect }`: sigue colectando en background.

### Por qué `viewModelScope` no te salva

`viewModelScope` se cancela cuando el ViewModel se destruye, sí. Pero un ViewModel sobrevive a la rotación. Eso significa que entre rotaciones, el Flow sigue activo y emitiendo. Si la emisión toca un `Context` o un `View` que ya no existe, NPE.

`repeatOnLifecycle(STARTED)` te garantiza que solo colectas cuando la UI es visible. Cero ambigüedad.

## 🔀 Operadores avanzados que necesitas conocer

### `stateIn`: convertir cold en hot con valor inicial

Si tienes un `Flow` en el repositorio y quieres exponerlo como `StateFlow` desde el ViewModel:

```kotlin
val uiState: StateFlow<UiState> = repository.observeData()
    .map { UiState.Success(it) }
    .stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = UiState.Loading
    )
```

`SharingStarted.WhileSubscribed(5000)` es la configuración que uso en el 90% de los casos. Mantiene el flujo activo 5 segundos tras el último suscriptor para sobrevivir a rotaciones sin re-cargar.

### `combine`: unir múltiples fuentes

```kotlin
val userWithPosts: Flow<UserWithPosts> = combine(
    userFlow,
    postsFlow
) { user, posts -> UserWithPosts(user, posts) }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
```

`combine` espera a que ambas fuentes hayan emitido al menos una vez, luego emite cada vez que **cualquiera** cambia. Perfecto para ViewModels que necesitan datos de dos repositorios.

### `debounce` para búsquedas

```kotlin
class SearchViewModel @Inject constructor(
    private val repo: SearchRepository
) : ViewModel() {

    private val queryFlow = MutableStateFlow("")

    val results: StateFlow<List<Result>> = queryFlow
        .debounce(300) // espera 300ms de inactividad
        .filter { it.length >= 2 }
        .flatMapLatest { repo.search(it) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun onQueryChange(query: String) {
        queryFlow.value = query
    }
}
```

`flatMapLatest` cancela la búsqueda anterior cuando llega una nueva. Sin él, requests viejas podrían sobreescribir a nuevas (race condition clásico de búsqueda en vivo).

## 🎯 Tabla Comparativa

| Característica | StateFlow | SharedFlow | LiveData |
|---|---|---|---|
| Valor Inicial | Obligatorio | Opcional | Opcional |
| Replay | 1 (Fijo) | Configurable | 1 (Último valor) |
| Conflation | Sí | Configurable | Sí |
| Distinct | Sí | No | No |
| Lifecycle Aware | No (requiere wrapper) | No | Sí |
| Threading | FlowOn / Context | FlowOn / Context | Main Thread Forzado |
| Backpressure | N/A (siempre conflata) | Configurable (SUSPEND/DROP/LATEST) | DROP_OLDEST |
| Multi-colector | Sí | Sí | Sí |
| Compose | `collectAsStateWithLifecycle` | `collectAsState` + filtrado | `observeAsState` |

## 🛰️ `shareIn` para flujos compartidos sin estado

Hermano gemelo de `stateIn`, pero para `SharedFlow`. Útil cuando quieres compartir un Flow de un repositorio entre varios ViewModels sin que cada uno abra su propia suscripción upstream:

```kotlin
val cachedUserFlow: SharedFlow<User> = repository.userStream
    .shareIn(
        scope = applicationScope,
        started = SharingStarted.WhileSubscribed(5000),
        replay = 0
    )
```

Diferencia clave: `shareIn` no tiene valor inicial. Si necesitas uno, usa `stateIn`. Si no, `shareIn` es más ligero porque no tiene que mantener un "último valor".

## 🚫 Errores comunes que he pagado caros

**1. Olvidar `WhileSubscribed(5000)` y usar `Eagerly`.** El flujo upstream se queda activo aunque no haya suscriptores. En repos con datos sensibles o en tests, eso filtra memoria.

**2. Usar `flowOf()` en lugar de `MutableStateFlow`.** Si tu "estado" es un `Flow<User>` creado con `flowOf(user)`, cuando hagas `_userFlow.value = newUser` no va a compilar porque `flowOf` no es mutable. Usa `MutableStateFlow` desde el principio.

**3. Combinar `SharedFlow` con `tryEmit` sin revisar el resultado.** `tryEmit` devuelve `false` si el buffer está lleno. Ignorar el resultado te lleva a eventos perdidos sin saber dónde. En producción, loggea el fallo.

**4. Collectar Flows en `GlobalScope`.** El flow nunca se cancela. Combinado con un Flow infinito (e.g. un sensor), fugas memoria garantizadas. Usa siempre `viewModelScope`, `lifecycleScope` o un scope custom cancelable.

## 🧪 Testing: Turbine es tu amigo

Para tests de Flows, la librería `app.cash.turbine:turbine` es prácticamente obligatoria. Te da un DSL legible para verificar emissions en orden:

```kotlin
@Test
fun `uiState emits Loading then Success`() = runTest {
    viewModel.uiState.test {
        // Estado inicial
        assertEquals(UiState.Loading, awaitItem())

        // Trigger
        viewModel.onUserLoaded(testUser)

        // Verificación
        assertEquals(UiState.Success(testUser), awaitItem())

        // Finalización
        awaitComplete()
    }
}
```

Sin Turbine, tendrías que escribir `take(2).toList() == listOf(...)`, que es funcional pero ilegible. Turbine te da `awaitItem()` que es explícito sobre QUÉ esperas.

## 🎯 Conclusión

La migración es clara:

- `LiveData` → `StateFlow` (Para Estado)
- `SingleLiveEvent` → `SharedFlow` con `replay = 0` (Para Eventos)

Dominar estos dos tipos de Flows te da control total sobre la reactividad de tu aplicación, permitiendo patrones potentes y seguros.

Una nota final: en 2026, los Flows son ya el estándar de facto en Android. Cualquier equipo nuevo que aún use LiveData está acumulando deuda. La migración es tediosa pero mecánica; un junior motivado la hace en una semana. Lo que cuesta es la cabeza: cambiar de "push reactivo" a "pull reactivo" requiere reaprender el modelo mental. Una vez hecho, no vuelves atrás.

## Bibliografía y Referencias

- [Documentación oficial de Kotlin Flow](https://kotlinlang.org/docs/flow.html) — La referencia canónica, en inglés, escrita por los autores del lenguaje.
- [Coroutines en Android: Guía oficial de Google](https://developer.android.com/kotlin/coroutines) — Cómo Google recomienda integrar Flows con el lifecycle.
- [App Cash: Turbine](https://github.com/cashapp/turbine) — La librería de testing que menciono. Pequeña (~500 líneas), sin dependencias pesadas.
- [Migrating from LiveData to StateFlow (YouTube, Android Dev Summit 2024)](https://www.youtube.com/) — Vídeo de 30 minutos que cubre los edge cases de la migración.
- [Use Cases en Android: Lógica de Negocio Limpia y Reutilizable](/es/blog/use-cases) — Cómo encajan los Flows dentro de la capa de dominio.
