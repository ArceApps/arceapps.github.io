---
title: "Dominando las Colecciones y Secuencias en Kotlin: Rendimiento y Optimización"
description: "¿Map o Sequence? Aprende a optimizar tus listas en Kotlin para Android, evitando overhead de memoria con Lazy Evaluation y dominando las operaciones funcionales."
pubDate: "2025-10-05"
heroImage: "/images/placeholder-article-collections.svg"
tags: ["Kotlin", "Performance", "Collections", "Functional Programming", "Android"]
---

## 🧐 El Dilema del Rendimiento en Listas

En el desarrollo Android moderno, manipulamos listas constantemente: respuestas de API, listas de contactos, items de un carrito de compras. Kotlin nos ofrece una API de colecciones rica y expresiva (`map`, `filter`, `groupBy`), pero un uso ingenuo puede disparar el consumo de memoria y CPU.

La pregunta clave es: **¿Cuándo debo usar una `List` estándar (Iterable) y cuándo una `Sequence`?**

### Eager vs Lazy Evaluation

Para entender la diferencia, debemos mirar cómo se ejecutan las operaciones.

#### Collections (Iterable): Evaluación Ansiosa (Eager)
Cada operación crea una colección intermedia **completa**.

```kotlin
val list = listOf(1, 2, 3, 4, 5)

val result = list
    .map { it * 2 }    // Crea una nueva lista temporal: [2, 4, 6, 8, 10]
    .filter { it > 5 } // Crea OTRA lista temporal: [6, 8, 10]
    .first()           // Devuelve 6
```

En este ejemplo simple no es grave. Pero si la lista tuviera 1 millón de elementos, estarías creando dos listas de 1 millón de enteros en memoria solo para obtener el primer resultado. 💥

#### Sequences: Evaluación Perezosa (Lazy)
Las operaciones no se ejecutan hasta que se solicita el resultado final (operación terminal). Además, procesan elemento por elemento.

```kotlin
val result = list.asSequence()
    .map { it * 2 }
    .filter { it > 5 }
    .first()
```

**Flujo de ejecución:**
1. Toma el `1` -> `map(1*2=2)` -> `filter(2 > 5? No)` -> Descartado.
2. Toma el `2` -> `map(2*2=4)` -> `filter(4 > 5? No)` -> Descartado.
3. Toma el `3` -> `map(3*2=6)` -> `filter(6 > 5? Si)` -> `first()` lo toma y **termina**.

¡No se procesan el 4 ni el 5! Y lo más importante: **No se crearon listas intermedias.**

## 🛠️ Cuándo usar Sequences en Android

No uses `Sequence` para todo. Tienen un overhead de creación de objetos wrapper.

**Regla de Oro:**
Usa `Sequence` si:
1. La lista es grande (decenas de miles de elementos).
2. Tienes múltiples pasos encadenados (`map` + `filter` + `sorted`...).
3. Usas operaciones de "cortocircuito" como `first`, `take`, `any`, donde no necesitas procesar toda la lista.

Si la lista es pequeña (ej. 100 elementos de un RecyclerView), la `List` estándar es más rápida debido al menor overhead.

## ⚡ Operaciones Funcionales Clave

Más allá de `map` y `filter`, dominar estas operaciones limpia tu código:

### 1. `fold` y `reduce`
Para acumular un resultado a partir de una lista.

```kotlin
data class Product(val price: Double, val quantity: Int)

val cart = listOf(Product(10.0, 2), Product(5.0, 3))

// Reduce: El acumulador empieza con el primer elemento (puede lanzar excepción si está vacía)
// Fold: Tú defines el valor inicial del acumulador (más seguro)

val total = cart.fold(0.0) { acc, product ->
    acc + (product.price * product.quantity)
}
// Resultado: 35.0
```

### 2. `associateBy` y `groupBy`
Vitales para optimizar búsquedas. Convertir una Lista a un Mapa reduce la complejidad de búsqueda de O(N) a O(1).

```kotlin
// Ineficiente: Búsqueda O(N^2)
val users = getUsers() // List<User>
val orders = getOrders() // List<Order> (tiene userId)

orders.forEach { order ->
    val user = users.find { it.id == order.userId } // Recorre toda la lista de usuarios por cada orden
    // ...
}

// Eficiente: Búsqueda O(N)
val userMap = users.associateBy { it.id } // Map<String, User>

orders.forEach { order ->
    val user = userMap[order.userId] // Lookup instantáneo
    // ...
}
```

### 3. `zip`
Combina dos listas par a par.

```kotlin
val names = listOf("Alice", "Bob")
val scores = listOf(95, 80)

val results = names.zip(scores) { name, score ->
    "$name scored $score"
}
// ["Alice scored 95", "Bob scored 80"]
```

## 🚫 Anti-Patrones Comunes

### 1. Ordenar (`sorted`) innecesariamente en Sequences
La operación `sorted` es un "stateful intermediate operation". Para ordenar, la secuencia **DEBE** procesar todos los elementos y cargarlos en memoria, anulando gran parte del beneficio del lazy evaluation.

Si vas a ordenar, hazlo al final o evalúa si realmente necesitas una secuencia.

### 2. Romper la cadena de Secuencias
```kotlin
list.asSequence()
    .map { ... }
    .toList() // ❌ Materializa la lista
    .filter { ... } // ❌ Vuelve a crear otra lista
    .first()
```
Mantén la secuencia (`asSequence`) hasta la operación terminal final.

## 🎯 Conclusión

Las Colecciones en Kotlin son poderosas, pero entender su implementación interna distingue a un desarrollador Junior de un Senior.

- **Listas pequeñas y operaciones simples**: Usa `List` estándar.
- **Listas grandes, encadenamientos largos o cortocircuitos**: Usa `asSequence()`.
- **Búsquedas frecuentes**: Convierte a `Map` con `associateBy`.

Optimizar el uso de memoria en Android no solo evita `OutOfMemoryError`, sino que reduce la frecuencia del Garbage Collector, resultando en una UI más fluida (menos "jank").
