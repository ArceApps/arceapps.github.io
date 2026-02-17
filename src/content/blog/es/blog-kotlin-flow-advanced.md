---
title: "Kotlin Flow a Fondo: Operadores y Patrones Avanzados"
description: "Pasa de nivel con Kotlin Flow. Domina operadores como combine, zip, flatMapLatest y aprende a manejar streams reactivos complejos en Android."
pubDate: 2025-10-15
heroImage: "/images/placeholder-article-flow-advanced.svg"
tags: ["Kotlin", "Flow", "Reactive Programming", "Android", "Coroutines"]
reference_id: "bbab8f8a-8eba-4227-988a-15f5c7ec0ad4"
---
## 🌊 Más allá del `collect` básico

Si ya usas `StateFlow` y `SharedFlow`, estás en el buen camino. Pero el verdadero poder de Kotlin Flow reside en sus operadores de transformación y combinación. Estos te permiten modelar flujos de datos complejos de forma declarativa, eliminando "callback hells" y variables de estado mutables dispersas.

## 🔀 Combinando Flujos (Streams)

En Android, es común que una vista dependa de múltiples fuentes de datos (ej. datos de usuario + configuración + estado de red).

### `combine` vs `zip`

Esta es una pregunta de entrevista clásica.

#### `zip`: Sincronización Estricta
Espera a que **ambos** flujos emitan un nuevo valor para combinarlos. Es como una cremallera.

```kotlin
val flowA = flowOf(1, 2, 3)
val flowB = flowOf("A", "B", "C")

flowA.zip(flowB) { a, b -> "$a$b" }
// Emisiones: "1A", "2B", "3C"
```
Si `flowB` tarda en emitir "B", `zip` espera. No avanza.

#### `combine`: El último estado conocido
Emite un nuevo valor cada vez que **cualquiera** de los flujos emite, usando el último valor conocido del otro.

```kotlin
val userFlow = repository.getUser() // Emite User
val settingsFlow = repository.getSettings() // Emite Settings

userFlow.combine(settingsFlow) { user, settings ->
    ProfileUiState(user, settings)
}.collect { state -> updateUi(state) }
```
Si `settingsFlow` cambia, se re-calcula el estado usando el último `user` emitido. Esto es ideal para **UI State**.

## ⚡ Operadores de Aplanamiento (Flattening)

Cuando un Flow emite *otros* Flows (ej. una búsqueda que dispara una petición de red por cada tecla), necesitas "aplanarlos".

### El Rey: `flatMapLatest`

Es el operador más útil para búsquedas en Android. Cuando llega una nueva emisión (nueva letra escrita), cancela el flujo anterior (búsqueda anterior) y empieza el nuevo.

```kotlin
searchQueryStateFlow
    .debounce(300) // Espera 300ms de inactividad
    .flatMapLatest { query ->
        if (query.isEmpty()) {
            flowOf(emptyList())
        } else {
            apiService.searchProducts(query).asFlow()
        }
    }
    .collect { results -> showResults(results) }
```
Esto ahorra ancho de banda y asegura que solo muestres los resultados de la *última* búsqueda.

### Otros Sabores
- **`flatMapConcat`**: Procesa secuencialmente. Espera a que termine el flujo A para empezar el B.
- **`flatMapMerge`**: Procesa en paralelo. ¡Cuidado con el orden!

## 🛡️ Manejo de Errores Robusto

En Flow, las excepciones se propagan hacia abajo.

```kotlin
flow {
    emit(1)
    throw RuntimeException("Boom")
}
.catch { e ->
    // Captura la excepción de arriba
    emit(-1) // Podemos emitir un valor de error o fallback
}
.collect { ... }
```

**Importante:** `catch` solo atrapa errores que ocurren *aguas arriba* (upstream). No atrapa errores que ocurran en el `collect` o en operadores *aguas abajo*.

## ⏱️ Operadores de Tiempo

- **`debounce(ms)`**: Filtra emisiones rápidas. Vital para SearchViews y botones (evitar doble click).
- **`sample(ms)`**: Toma una muestra cada X tiempo. Útil para actualizaciones de UI muy rápidas (ej. progreso de descarga) para no saturar el Main Thread.

## 🎯 Patrón: MVI Parcial con `scan`

El operador `scan` es como `reduce`, pero emite cada paso intermedio. Es perfecto para manejar estado acumulativo (Redux-style).

```kotlin
sealed class Intent {
    data class Add(val n: Int) : Intent()
    data class Subtract(val n: Int) : Intent()
}

intentFlow
    .scan(0) { total, intent ->
        when (intent) {
            is Intent.Add -> total + intent.n
            is Intent.Subtract -> total - intent.n
        }
    }
    .collect { total -> render(total) }
```

## 🧠 Conclusión

Dominar los operadores de Flow te permite escribir lógica de negocio compleja que es:
1.  **Declarativa**: Dices *qué* hacer, no *cómo*.
2.  **Reactiva**: La UI siempre refleja el estado actual.
3.  **Eficiente**: Cancelación automática y manejo de backpressure.

No te quedes solo con `collect`. Explora la caja de herramientas.
