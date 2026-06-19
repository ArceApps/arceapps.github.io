---
title: "Repository Pattern: La Verdadera Abstracción de Datos"
description: "Por qué el Repository es el patrón más importante en Clean Architecture. Estrategias de caché, manejo de errores y orquestación de fuentes de datos."
pubDate: 2025-10-18
lastmod: 2025-10-18
author: ArceApps
keywords:
  - "Repository Pattern"
  - "Abstracción"
  - "Datos"
  - "Android"
  - "Patrón"
canonical: "https://arceapps.com/es/blog/repository-pattern/"
heroImage: "/images/placeholder-article-repository.svg"
tags: ["Architecture", "Design Patterns", "Android", "Data Layer"]
reference_id: "e1498656-14e2-4b0b-9914-752ae17e6062"
---


## 🏛️ Teoría: El Guardián de los Datos

El **Repository Pattern** tiene un propósito simple pero vital: **Desacoplar la lógica de negocio de la procedencia de los datos.**

El Use Case (o ViewModel) pregunta: *"Dame los usuarios"*.
Al Use Case no le importa si los usuarios vienen de:
-   Una API REST (Retrofit)
-   Una base de datos local (Room)
-   Un archivo JSON en assets
-   Una caché en memoria

Esto permite cambiar la implementación de datos sin tocar ni una línea de la lógica de negocio.

## 🏗️ Anatomía de un Repositorio Moderno

### 1. La Interfaz (Dominio)
Define **qué** se puede hacer, no **cómo**.

```kotlin
interface ProductRepository {
    // Retorna Flow para actualizaciones en tiempo real
    fun getProducts(): Flow<Result<List<Product>>>

    // Funciones suspendidas para operaciones one-shot
    suspend fun refreshProducts(): Result<Unit>

    suspend fun getProductById(id: String): Result<Product>
}
```

### 2. La Implementación (Capa de Datos)
Aquí vive la lógica sucia de coordinación.

```kotlin
class ProductRepositoryImpl @Inject constructor(
    private val remote: ProductRemoteDataSource, // Retrofit
    private val local: ProductLocalDataSource,   // Room
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : ProductRepository { ... }
```

## 🔄 Estrategias de Sincronización

El valor real del repositorio está en cómo coordina Local y Remote.

### Estrategia: Single Source of Truth (SSOT)
La base de datos local es la ÚNICA verdad.

1.  La UI observa la DB (Room Flow).
2.  Cuando se piden datos, el Repo lanza una llamada a la API.
3.  Si la API responde, el Repo guarda en la DB.
4.  Room notifica automáticamente a la UI con los nuevos datos.

```kotlin
override fun getProducts(): Flow<Result<List<Product>>> {
    return local.getProducts() // Flow desde Room
        .map { Result.Success(it) }
        .onStart {
            // Trigger refresh lateral
            try {
                val remoteData = remote.fetch()
                local.save(remoteData)
            } catch (e: Exception) {
                emit(Result.Error(e))
            }
        }
}
```

Esta estrategia es robusta porque la app funciona **Offline-First** por defecto.

### Estrategia: Cache-Aside (Lectura con Fallback)
Útil para datos que cambian poco o no se guardan en DB.

1.  Busca en memoria/disco.
2.  Si no existe o expiró -> Llama a red.
3.  Retorna y guarda.

## ⚠️ Errores Comunes

1.  **Exponer DTOs**: El Repo debe devolver Modelos de Dominio, no `NetworkResponse<UserDto>`. Mapea siempre dentro del Repo.
2.  **Lógica de Negocio**: El Repo no debe decidir "si el usuario es VIP, dale descuento". Eso es del Use Case. El Repo solo almacena y recupera.
3.  **Manejo de Hilos**: El Repo debe ser "Main-Safe". Usa `withContext(Dispatchers.IO)` para asegurarte de que llamar al repo desde la UI nunca bloquee.

## 🎯 Conclusión

Un buen Repository es invisible. La capa de dominio confía ciegamente en él. Al centralizar el acceso a datos, ganas la capacidad de optimizar (añadir caché en memoria, cambiar de SQL a NoSQL) sin romper el resto de la app. Es la pieza clave de la mantenibilidad a largo plazo.
