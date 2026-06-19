---
title: "MVVM Model: La Capa de Datos Invisible pero Vital"
description: "El 'Model' en MVVM es mucho más que clases de datos. Aprende a diseñar una capa de modelo robusta que sobreviva a cambios de UI y backend."
pubDate: 2025-10-02
lastmod: 2025-10-02
author: ArceApps
keywords:
  - "MVVM Model"
  - "Capa de Datos"
  - "Invisible"
  - "Modelo"
  - "Android"
canonical: "https://arceapps.com/es/blog/mvvm-model/"
heroImage: "/images/placeholder-article-model-layer.svg"
tags: ["Android", "MVVM", "Architecture", "Data Layer", "Clean Code"]
reference_id: "83cba2ba-03c4-4134-9fd0-9325d395ea17"
---


## 🏗️ Teoría: ¿Qué es el "Model" realmente?

En discusiones sobre MVVM, la gente se obsesiona con el ViewModel y la View, y el **Model** queda relegado a "un par de data classes". Esto es un error grave.

El **Model** representa el **Dominio del Problema**. Es la realidad de tu negocio, independientemente de si tienes una App Android, una Web o un CLI.

### Responsabilidades del Model
1.  **Abstracción de Datos**: Ocultar si los datos vienen de RAM, Disco o Nube.
2.  **Reglas de Negocio**: "Un usuario no puede tener saldo negativo".
3.  **Integridad de Datos**: Garantizar que los objetos siempre estén en un estado válido.

## 🧱 Componentes del Model Moderno

En una arquitectura profesional (Clean + MVVM), el "Model" no es una sola capa, sino un conjunto de capas colaborativas.

### 1. Entidades de Dominio (Domain Entities)
Son objetos puros de Kotlin. Sin anotaciones de Gson, sin `@Entity` de Room, sin `Parcelable` de Android.

```kotlin
// ✅ Pura, Inmutable, Validada
data class Product(
    val id: String,
    val price: BigDecimal,
    val stock: Int
) {
    init {
        require(price >= BigDecimal.ZERO) { "Price cannot be negative" }
        require(stock >= 0) { "Stock cannot be negative" }
    }
    
    val isAvailable: Boolean get() = stock > 0
}
```

### 2. Data Transfer Objects (DTOs)
Son los contratos con el mundo exterior (API). Estos SÍ tienen anotaciones.

```kotlin
// ❌ No usar esto en la UI directamente
@JsonClass(generateAdapter = true)
data class NetworkProduct(
    @Json(name = "p_id") val id: String?, // Las APIs mienten, todo puede ser null
    @Json(name = "cost") val cost: Double?
)
```

### 3. Mappers (The Translators)
El componente más infravalorado. Traduce DTOs sucios a Entidades limpias. Es la barrera de contención contra el caos del backend.

```kotlin
fun NetworkProduct.toDomain(): Product {
    return Product(
        id = this.id ?: throw InvalidDataException("Missing ID"),
        price = BigDecimal.valueOf(this.cost ?: 0.0),
        stock = 0 // Default seguro
    )
}
```

### 4. Repositories (The Single Source of Truth)
El ViewModel nunca debe saber si llamas a Retrofit o a Room. El Repository decide.

> **Patrón Estratégico**: "Offline-First". El Repository siempre devuelve datos de la base de datos local (rápido) y actualiza en segundo plano desde la red.

## 🔄 Flujo de Datos Reactivo

El Model moderno no es pasivo ("dame datos"). Es **Reactivo** ("aquí tienes actualizaciones de datos").

```kotlin
interface StockRepository {
    // ❌ Imperativo (Pull)
    suspend fun getStock(): Int
    
    // ✅ Reactivo (Push)
    fun getStockStream(): Flow<Int>
}
```

Al exponer un `Flow`, el Model informa al ViewModel de cambios en tiempo real (ej. llegó una push notification, u otro proceso actualizó la DB), y la UI se actualiza "gratis".

## 🛡️ Rich Model vs Anemic Model

### Modelo Anémico (Anti-patrón común)
Clases de datos vacías y toda la lógica en "Manager Classes" o ViewModels.

```kotlin
data class Cart(val items: MutableList<Item>) // Solo datos

class CartManager {
    fun calculateTotal(cart: Cart): Double { ... } // Lógica separada
}
```

### Modelo Rico (DDD Style)
Los objetos contienen datos Y comportamiento.

```kotlin
data class Cart(private val _items: MutableList<Item>) {
    val total: Double
        get() = _items.sumOf { it.price }
        
    fun addItem(item: Item) {
        if (item.isExpired) throw DomainException("Item expired")
        _items.add(item)
    }
}
```

El Modelo Rico es superior porque **encapsula invariantes**. Es imposible poner un Cart en un estado inválido si el propio objeto valida sus operaciones.

## 🎯 Conclusión

El Model es el corazón de tu aplicación. Si el Model es sólido, puedes cambiar la UI de XML a Compose, o cambiar el framework de inyección de dependencias, y tu aplicación seguirá funcionando correctamente. Trátalo con el respeto que se merece.
