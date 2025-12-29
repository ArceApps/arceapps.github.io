---
title: "Dependency Injection en Android: Hilt vs Koin vs Manual"
description: "Una comparativa profunda y técnica sobre inyección de dependencias en Android. ¿Cuándo usar Hilt? ¿Es Koin realmente inyección? ¿Qué hay de la inyección manual?"
pubDate: "2025-10-05"
heroImage: "/images/placeholder-article-dependency-injection.svg"
tags: ["Android", "Dependency Injection", "Hilt", "Koin", "Dagger", "Architecture"]
---

## 💉 Teoría: El Principio de Inversión de Dependencias (DIP)

La Inyección de Dependencias (DI) es la implementación práctica del **Principio de Inversión de Dependencias** de SOLID.

> "Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones."

Sin DI:
```kotlin
class UserViewModel {
    // El ViewModel crea la dependencia. Fuerte acoplamiento.
    private val repository = UserRepository()
}
```

Con DI:
```kotlin
class UserViewModel(private val repository: UserRepository) {
    // El ViewModel recibe la dependencia. Inversión de control.
}
```

Esto permite:
1.  **Sustitución**: En tests, pasamos un `FakeRepository`.
2.  **Configuración**: `UserRepository` puede configurarse fuera del ViewModel (ej. URL de API).
3.  **Gestión de Vida**: Podemos compartir la misma instancia de `UserRepository` entre varios ViewModels (Singleton).

## 🥊 Los Contendientes

En Android, tenemos tres enfoques principales.

### 1. Dagger / Hilt (The Google Standard)
**Hilt** es un wrapper sobre **Dagger**, que es un framework de **generación de código en tiempo de compilación**.

-   **Cómo funciona**: Dagger analiza tus anotaciones (`@Inject`, `@Module`) y escribe código Java/Kotlin real que conecta las clases. Si te equivocas, el código no compila.
-   **Pros**:
    -   **Seguridad en compilación**: Imposible tener un `NullPointerException` por falta de dependencia en runtime.
    -   **Performance**: Cero reflexión. Es tan rápido como el código escrito a mano.
    -   **Integración Android**: Hilt sabe manejar el ciclo de vida de Activities y ViewModels automáticamente.
-   **Contras**:
    -   Tiempo de compilación más lento (kapt/ksp).
    -   Curva de aprendizaje empinada.

```kotlin
@HiltViewModel
class UserViewModel @Inject constructor(
    private val repository: UserRepository
) : ViewModel()
```

### 2. Koin (The Kotlin Pragmatist)
**Koin** es un **Service Locator** DSL ligero escrito en puro Kotlin.

-   **Cómo funciona**: Registras tus clases en un mapa (HashMap) al inicio de la app. Cuando pides una dependencia, Koin la busca en el mapa y te la da. Usa features de Kotlin como `reified` types.
-   **Pros**:
    -   **Súper simple**: Sin anotaciones, sin generación de código.
    -   **Rápido de compilar**: No afecta el build time.
    -   **Poderoso**: Soporta Scopes y Modules fácilmente.
-   **Contras**:
    -   **Seguridad en Runtime**: Si olvidas declarar una dependencia, la app crashea al abrir la pantalla (`KoinAppAlreadyStartedException` o similar).
    -   **Performance**: Ligero overhead en runtime al buscar en el mapa (despreciable en la mayoría de apps modernas).

```kotlin
val appModule = module {
    viewModel { UserViewModel(get()) }
    single { UserRepository(get()) }
}
```

### 3. Inyección Manual (The Purist)
Escribir tus propios contenedores de dependencias.

-   **Cómo funciona**: Creas una clase `AppContainer` que tiene las instancias.
-   **Pros**: Entendimiento total de cómo funciona tu app. Cero magia.
-   **Contras**: Mucho boilerplate. Manejar Scopes (como ActivityScope) a mano es doloroso y propenso a memory leaks.

## 🏆 Veredicto: ¿Cuál elegir?

### Usa Hilt si...
-   Estás en un equipo grande donde la seguridad en compilación es crítica.
-   Tu proyecto es una app empresarial a largo plazo.
-   Quieres seguir el estándar oficial de Google y Jetpack.

### Usa Koin si...
-   Quieres iterar rápido y odias los errores de compilación crípticos de Dagger.
-   Tu proyecto es 100% Kotlin (incluyendo Multiplatform - KMP).
-   Prefieres una sintaxis DSL legible.

### Usa Manual DI si...
-   Estás aprendiendo cómo funciona DI (fines educativos).
-   Tu app es extremadamente pequeña (una calculadora).

## 🧠 Clean Architecture & DI

Independientemente de la herramienta, tu capa de **Dominio** no debe saber nada de ella.
-   No pongas anotaciones `@Inject` de Dagger en tus Entidades de Dominio (si quieres ser purista).
-   No uses `KoinComponent` dentro de tus Use Cases.

La DI debe configurarse en la capa de "Framework" (o `app` module), inyectando las implementaciones de Data en los Use Cases, y los Use Cases en los ViewModels.

**Regla de Oro**: La herramienta de DI es un detalle de implementación. Tu lógica de negocio no debe casarse con ella.
