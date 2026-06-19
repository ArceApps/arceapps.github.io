---
title: "Use Cases en Android: Lógica de Negocio Limpia y Reutilizable"
description: "Por qué los Use Cases (Interactors) son el componente secreto de una arquitectura escalable. Cómo diseñarlos, testearlos y reutilizarlos."
pubDate: 2025-10-10
lastmod: 2025-10-10
author: ArceApps
keywords:
  - "Use Cases"
  - "Android"
  - "Lógica de Negocio"
  - "Clean Architecture"
  - "Patrón"
canonical: "https://arceapps.com/es/blog/use-cases/"
heroImage: "/images/placeholder-article-use-cases.svg"
tags: ["Architecture", "Clean Architecture", "Android", "Best Practices"]
reference_id: "2eddc21e-4c8f-4f39-859d-e4c1fc1066bc"
---


## 🏛️ Teoría: Single Responsibility a Nivel de Clase

En MVVM básico, el ViewModel suele acumular demasiada lógica.
- Llama al repositorio.
- Filtra los datos.
- Combina dos fuentes.
- Valida reglas de negocio.

El **Use Case** extrae esa lógica a una clase pequeña, enfocada y reutilizable.

> **Regla**: Un Use Case hace UNA sola cosa. Su nombre debe ser un verbo. `GetUserProfile`, `BuyItem`, `LogOut`.

## 🏗️ Anatomía de un Use Case

Un Use Case puro en Kotlin aprovecha el operador `invoke` para parecer una función.

```kotlin
class GetActiveUsersUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    // El operador invoke permite llamar a la clase como funcion: useCase()
    operator fun invoke(): Flow<List<User>> {
        return userRepository.getUsers()
            .map { list ->
                // Lógica de Negocio: Filtrar inactivos
                list.filter { it.isActive && it.lastLogin > yesterday }
            }
    }
}
```

## 🔄 ¿Por qué son útiles?

### 1. Reutilización
Imagina que necesitas la lista de usuarios activos en la pantalla de "Dashboard" y en la de "Admin".
- **Sin Use Case**: Duplicas el filtro `.filter { ... }` en dos ViewModels. Si la regla cambia ("ahora activo significa login hoy"), tienes que cambiar dos sitios.
- **Con Use Case**: Ambos ViewModels inyectan `GetActiveUsersUseCase`. Cambias un sitio, arreglas todo.

### 2. Screaming Architecture
Al abrir tu paquete `domain/usecases`, deberías poder gritar qué hace tu app solo leyendo los nombres de los archivos:
- `LoginUser.kt`
- `GetTransferHistory.kt`
- `MakeTransfer.kt`

No necesitas leer código para entender las "features".

### 3. Testing Simplificado
Testear un ViewModel es fácil, pero testear un Use Case es trivial. No hay `LiveData`, no hay `ViewModelScope`, solo lógica pura.

```kotlin
@Test
fun `should return only active users`() = runTest {
    // Arrange
    val users = listOf(activeUser, inactiveUser)
    every { repo.getUsers() } returns flowOf(users)
    
    // Act
    val result = useCase().first()

    // Assert
    assertEquals(1, result.size)
    assertEquals(activeUser, result[0])
}
```

## ⚠️ ¿Debo crear Use Cases para todo?

Es la pregunta del millón. ¿Qué pasa con un Use Case que solo llama al repositorio?

```kotlin
class GetUser(val repo: Repo) {
    operator fun invoke(id: String) = repo.getUser(id)
}
```

Esto se llama "Pasamanos" (Proxy).
- **Puristas**: SÍ. Mantén la consistencia arquitectónica. Protege contra cambios futuros.
- **Pragmáticos**: NO. Si solo es un proxy, llama al Repo desde el ViewModel. Crea el Use Case solo cuando añadas lógica real.

**Recomendación**: En equipos grandes, sé purista (consistencia > brevedad). En proyectos pequeños, sé pragmático.

## 🎯 Conclusión

Los Use Cases son la herramienta definitiva para encapsular la "Inteligencia" de tu aplicación. El ViewModel se convierte en un simple orquestador de UI, y el Repositorio en un simple almacén de datos. La magia real ocurre en el dominio.
