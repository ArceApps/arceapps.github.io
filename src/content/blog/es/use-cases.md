---
title: "Use Cases en Android: Lógica de Negocio Limpia y Reutilizable"
description: "Por qué los Use Cases (Interactors) son el componente secreto de una arquitectura escalable. Cómo diseñarlos, testearlos y reutilizarlos."
pubDate: 2025-10-10
lastmod: 2026-07-18
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
category: architecture
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

Esta guía es la versión completa del artículo corto que publiqué originalmente. Lo he reescrito tras meses de usarlo en proyectos reales, viendo dónde brillan los Use Cases y dónde se vuelven lastre. Si quieres entender cómo encajan con la capa de datos, mira también [Repository Pattern: La Verdadera Abstracción de Datos](/es/blog/repository-pattern) — son las dos caras de la misma moneda.

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

Tres elementos que merece la pena destacar:

1. **`@Inject constructor`** — la inyección de dependencias te permite testear el Use Case con un repositorio falso sin tocar Dagger/Hilt/Koin a mano.
2. **`operator fun invoke()`** — permite llamar a `useCase()` como si fuera una función. Esto es Kotlin aprovechando su naturaleza: el operador `invoke` se invoca cuando usas los paréntesis.
3. **Retorna `Flow<List<User>>`** — no retorna `List<User>` "completo y terminado". El Use Case es una **fuente de datos reactiva**, no una query one-shot. Esto es clave para vivir bien con Compose.

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

No necesitas leer código para entender las "features". Esto es brutal para onboarding de nuevos devs al equipo: en lugar de "lee 50 archivos y deduce qué hace la app", el paquete `usecases/` es el manual de usuario.

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

El test es lineal, sin coroutine gymnastics, sin LiveData observers. Tres líneas, una sola responsabilidad. Esto es lo que hace que un equipo pueda mantener tests con disciplina: tests que son placer escribir.

## 🧩 Variantes que he encontrado útiles

### Variante 1: Use Case con parámetros

Los Use Case del ejemplo son "sin parámetros" (los datos viven en el repo). Pero muchos casos reales sí los necesitan:

```kotlin
class TransferMoneyUseCase @Inject constructor(
    private val accountRepo: AccountRepository,
    private val transactionRepo: TransactionRepository
) {
    sealed class Result {
        data class Success(val transactionId: String) : Result()
        data class InsufficientFunds(val missing: BigDecimal) : Result()
        data class DailyLimitExceeded(val limit: BigDecimal) : Result()
    }

    suspend operator fun invoke(
        fromAccountId: String,
        toAccountId: String,
        amount: BigDecimal
    ): Result {
        // Validación
        val from = accountRepo.getAccount(fromAccountId)
            ?: return Result.InsufficientFunds(BigDecimal.ZERO)

        if (from.balance < amount) {
            return Result.InsufficientFunds(amount - from.balance)
        }

        // Límite diario (regla de negocio)
        val todayTotal = transactionRepo.sumToday(fromAccountId)
        if (todayTotal + amount > DAILY_LIMIT) {
            return Result.DailyLimitExceeded(DAILY_LIMIT - todayTotal)
        }

        // Ejecución
        val txId = transactionRepo.executeTransfer(
            from = fromAccountId,
            to = toAccountId,
            amount = amount
        )
        return Result.Success(txId)
    }
}
```

`sealed class Result` para los retornos es brutal: el caller tiene que manejar cada caso en `when`, y el compilador le avisa si se le olvida uno. Sin excepciones, sin callbacks, sin ambigüedad.

### Variante 2: Use Case que combina múltiples repositorios

```kotlin
class GetDashboardDataUseCase @Inject constructor(
    private val userRepo: UserRepository,
    private val statsRepo: StatsRepository,
    private val notificationsRepo: NotificationsRepository
) {
    operator fun invoke(): Flow<DashboardData> = combine(
        userRepo.observeCurrentUser(),
        statsRepo.observeDailyStats(),
        notificationsRepo.observeUnread()
    ) { user, stats, notifications ->
        DashboardData(user, stats, notifications)
    }
}
```

`combine` espera a que las tres fuentes hayan emitido al menos una vez, y luego emite un nuevo `DashboardData` cada vez que cualquiera cambia. Perfecto para pantallas que necesitan datos de N repositorios.

### Variante 3: Use Case con Input/Output explícitos

Para equipos grandes, definir input y output como data classes hace los contratos obvios:

```kotlin
class SearchProductsUseCase @Inject constructor(
    private val productRepo: ProductRepository
) {
    data class Input(
        val query: String,
        val minPrice: BigDecimal? = null,
        val maxPrice: BigDecimal? = null,
        val category: String? = null,
        val sortBy: SortBy = SortBy.RELEVANCE
    )

    sealed class Output {
        data class Success(val products: List<Product>) : Output()
        data class Empty(val reason: String) : Output()
        data class Error(val exception: Throwable) : Output()
    }

    operator fun invoke(input: Input): Flow<Output> { ... }
}
```

Más boilerplate, sí. Pero cuando el equipo crece, el código se vuelve auto-documentado. El contrato está en la firma del método. Los juniors no tienen que adivinar qué parámetros acepta cada Use Case.

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

**Recomendación**: En equipos grandes, sé purista (consistencia > brevedad). En proyectos pequeños, sé pragmático. Yo personalmente uso una regla de tres: si he llamado al repo desde tres sitios distintos con la misma lógica, lo extraigo a Use Case. Antes de eso, lo dejo inline.

## 🚫 Errores comunes que he cometido (y pagado)

**1. Use Case que sabe de UI.** Si tu Use Case importa `Context` o `View`, lo estás haciendo mal. Los Use Cases son UI-agnostic. Si necesitas mostrar un mensaje de error, devuélvelo como `Result.Error(message: String)` y deja que la UI lo pinte.

**2. Use Case que hace IO directamente.** Si tu Use Case hace `withContext(Dispatchers.IO)`, probablemente está mal inyectado. Los repositorios ya deberían ser Main-Safe. Poner el `withContext` en el Use Case duplica la responsabilidad.

**3. Use Case con efectos secundarios no declarados.** Un Use Case que "casualmente" hace logging, analytics, o escribe en DataStore es una bomba de tiempo. Esos efectos secundarios deben estar explícitos en la firma del método o ser un evento separado.

**4. Use Case de 300 líneas.** Si tu Use Case necesita scroll, son varios Use Cases vestidos de uno. Divide por **operación de negocio**, no por entidad de datos.

## 🧪 Testing avanzado

Más allá del test básico, hay tres patrones que uso con Use Cases:

### Tests con Turbine para Flows

```kotlin
@Test
fun `emits Loading then Success then Empty based on repo state`() = runTest {
    every { repo.getUsers() } returns flowOf(
        emptyList(),
        listOf(activeUser),
        listOf(activeUser, premiumUser)
    )

    useCase().test {
        assertEquals(UiState.Loading, awaitItem())
        assertEquals(UiState.Empty("Sin usuarios activos"), awaitItem())
        assertEquals(UiState.Success(listOf(activeUser, premiumUser)), awaitItem())
        awaitComplete()
    }
}
```

### Tests parametrizados con JUnit 5

```kotlin
@ParameterizedTest
@MethodSource("invalidEmails")
fun `rejects invalid emails`(email: String) {
    assertFalse(useCase(email))
}

companion object {
    @JvmStatic
    fun invalidEmails() = listOf(
        "", "no-at-sign.com", "two@@signs.com", "trailing@"
    )
}
```

### Tests de integración con repositorio real

Para Use Cases que combinan múltiples fuentes, un test unitario con mocks no es suficiente. Necesitas un test de integración que verifique que la composición de repos funciona:

```kotlin
@Test
fun `dashboard use case combines three real sources`() = runTest {
    val fakeUserRepo = FakeUserRepository(initialUser)
    val fakeStatsRepo = FakeStatsRepository(initialStats)
    val fakeNotificationsRepo = FakeNotificationsRepository(initialNotifications)

    val useCase = GetDashboardDataUseCase(
        fakeUserRepo, fakeStatsRepo, fakeNotificationsRepo
    )

    useCase().test {
        val initial = awaitItem()
        assertEquals(initialUser, initial.user)
        assertEquals(initialStats, initial.stats)

        // Simular cambio en una fuente
        fakeStatsRepo.update(newStats)
        val updated = awaitItem()
        assertEquals(newStats, updated.stats)

        cancelAndIgnoreRemainingEvents()
    }
}
```

## 🎯 Conclusión

Los Use Cases son la herramienta definitiva para encapsular la "Inteligencia" de tu aplicación. El ViewModel se convierte en un simple orquestador de UI, y el Repositorio en un simple almacén de datos. La magia real ocurre en el dominio.

Si tuviera que dejarte con un único consejo: **no crees Use Cases por crear**. Crea uno cuando tengas una razón concreta (reutilización real, complejidad que merece una clase, test aislado). El pragmatismo aquí es más importante que la pureza.

## Bibliografía y Referencias

- [Repository Pattern: La Verdadera Abstracción de Datos](/es/blog/repository-pattern) — El complemento natural. Use Cases y Repos son las dos caras de Clean Architecture.
- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) — El post original de Uncle Bob. Corto, fundamental, la base de todo lo demás.
- [Now in Android — Use Cases layer](https://github.com/android/nowinandroid) — El proyecto open source de Google que muestra Use Cases en producción. Vale más que cualquier tutorial.
- [Kotlin Coroutines: Flow Testing con Turbine](https://github.com/cashapp/turbine) — La librería que uso en todos los tests de Flow.
- *Domain-Driven Design* — Eric Evans. Si te interesa el "por qué" detrás de los Use Cases, este libro es la referencia. Denso pero transformador.
