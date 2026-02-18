---
title: "KMP Avanzado: Estrategias de Compartición de UI con Compose Multiplatform 1.8"
description: "Explorando patrones de navegación complejos y gestión de estado entre Android e iOS utilizando Kotlin Multiplatform en 2026."
pubDate: 2026-02-06
heroImage: "/images/tech-kmp-ui-sync.svg"
tags: ["Kotlin Multiplatform", "KMP", "Compose Multiplatform", "iOS", "Android", "Arquitectura"]
---

Kotlin Multiplatform (KMP) ha madurado significativamente. Como comentamos en mi artículo sobre el [Estado de KMP 2025](/es/blog/kmp-2025-state), compartir la lógica de negocio es ahora una práctica estándar. Sin embargo, con el lanzamiento de **Compose Multiplatform 1.8**, el debate se ha desplazado a la capa de UI: *¿Cuánta interfaz de usuario deberíamos realmente compartir?*

En este artículo, profundizaremos en estrategias avanzadas para compartir código UI entre Android e iOS sin sacrificar la sensación "nativa" que esperan los usuarios.

## Estrategia 1: El Enfoque "Híbrido"

En este modelo, compartes las **Pantallas de Feature** pero mantienes la **Navegación** nativa. Esta es a menudo la apuesta más segura para aplicaciones existentes que migran a KMP.

*   **Android:** Usa Jetpack Navigation (o Type-Safe Navigation).
*   **iOS:** Usa SwiftUI `NavigationStack` o Coordinators de `UIKit`.
*   **Shared:** El contenido de las pantallas (Composables).

```kotlin
// shared/ui/ProfileScreen.kt
@Composable
fun ProfileScreen(
    state: ProfileState,
    onEditClick: () -> Unit
) {
    Column {
        UserAvatar(state.avatarUrl)
        Text(text = state.name, style = MaterialTheme.typography.h4)
        Button(onClick = onEditClick) {
            Text("Editar Perfil")
        }
    }
}
```

**Pros:**
*   Gestos de navegación nativos perfectos (swipe-back en iOS).
*   Fácil integración en bases de código existentes.

**Contras:**
*   Lógica de navegación duplicada.

## Estrategia 2: El Enfoque "All-In" (Decompose / Voyager)

Con librerías como **Decompose** o **Voyager**, puedes compartir la pila de navegación completa. Esto convierte efectivamente tu app en una aplicación de Single Activity (Android) / Single Root View (iOS).

```kotlin
// shared/navigation/RootComponent.kt
class RootComponent(
    componentContext: ComponentContext
) : ComponentContext by componentContext {

    private val navigation = StackNavigation<Config>()

    val childStack = childStack(
        source = navigation,
        initialConfiguration = Config.Home,
        handleBackButton = true,
        childFactory = ::createChild
    )

    // ... lógica de configuración
}
```

**Pros:**
*   Escribe una vez, ejecuta en todas partes.
*   Lógica de deep-linking centralizada.

**Contras:**
*   Requiere una fuerte inversión en librerías específicas.
*   Las transiciones específicas de la plataforma pueden ser difíciles de acertar.

## Manejo de Especificidades de la Plataforma en UI

Incluso al compartir UI, a menudo necesitas ajustes específicos de la plataforma. **Compose Multiplatform 1.8** introduce un mejor soporte para `expect/actual` dentro del ámbito Composable.

```kotlin
// shared/ui/PlatformView.kt
@Composable
expect fun PlatformSpecificWebView(url: String)

// androidMain
@Composable
actual fun PlatformSpecificWebView(url: String) {
    AndroidView(factory = { WebView(it).apply { loadUrl(url) } })
}

// iosMain
@Composable
actual fun PlatformSpecificWebView(url: String) {
    UIKitView(factory = { WKWebView() }, update = { it.loadRequest(NSURLRequest(NSURL(string = url))) })
}
```

## Conclusión

No existe una "talla única". Para aplicaciones brownfield (existentes), el **Enfoque Híbrido** minimiza el riesgo. Para proyectos greenfield (nuevos) en 2026, las herramientas alrededor del **Enfoque All-In** son lo suficientemente maduras como para ser un competidor viable de Flutter, con el beneficio añadido del rendimiento nativo.

## Bibliografía y Referencias

1.  [Documentación de Compose Multiplatform](https://www.jetbrains.com/lp/compose-multiplatform/)
2.  [Librería Decompose](https://arkivanov.github.io/Decompose/)
3.  [Estado de KMP 2025](/es/blog/kmp-2025-state)
