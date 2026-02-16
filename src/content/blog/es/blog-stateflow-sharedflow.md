---
title: "StateFlow vs SharedFlow: Guía Definitiva para Android"
description: "Deja de usar LiveData. Entiende las diferencias profundas entre StateFlow y SharedFlow, cuándo usar cada uno y cómo evitar trampas comunes."
pubDate: 2025-09-30
heroImage: "/images/placeholder-article-stateflow-sharedflow.svg"
tags: ["Kotlin", "Coroutines", "Flow", "Android", "State Management"]
---
## 🌊 Teoría: Hot Flows

Tanto `StateFlow` como `SharedFlow` son **Hot Flows**.
-   **Cold Flow (Flow normal)**: El código dentro del `flow { ... }` no se ejecuta hasta que alguien llama a `collect()`. Cada colector reinicia el flujo.
-   **Hot Flow**: El flujo está activo independientemente de si hay colectores. Los datos se emiten y si nadie escucha, se pierden (o se guardan en buffer).

## 📦 StateFlow: El Sucesor de LiveData

`StateFlow` es una especialización de `SharedFlow` diseñada para **mantener estado**.

### Características Clave
1.  **Siempre tiene valor**: Requiere un valor inicial. `state.value` siempre es seguro.
2.  **Conflated**: Solo emite el *último* valor. Si emites "A", "B", "C" muy rápido y el colector es lento, solo recibirá "C". "A" y "B" se pierden (conflation).
3.  **DistinctUntilChanged**: Si emites "A" y luego "A" otra vez, no notifica a los colectores.

**Uso Perfecto**: Estado de UI (`UiState`).

```kotlin
private val _uiState = MutableStateFlow(UiState.Loading)
val uiState = _uiState.asStateFlow()
```

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

## 🎯 Tabla Comparativa

| Característica | StateFlow | SharedFlow | LiveData |
|---|---|---|---|
| Valor Inicial | Obligatorio | Opcional | Opcional |
| Replay | 1 (Fijo) | Configurable | 1 (Último valor) |
| Conflation | Sí | Configurable | Sí |
| Distinct | Sí | No | No |
| Lifecycle Aware | No (requiere wrapper) | No | Sí |
| Threading | FlowOn / Context | FlowOn / Context | Main Thread Forzado |

## 🎯 Conclusión

La migración es clara:
-   `LiveData` -> `StateFlow` (Para Estado)
-   `SingleLiveEvent` -> `SharedFlow` (Para Eventos)

Dominar estos dos tipos de Flows te da control total sobre la reactividad de tu aplicación, permitiendo patrones potentes y seguros.
