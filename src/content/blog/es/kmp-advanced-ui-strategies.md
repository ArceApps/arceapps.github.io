---
title: "KMP Avanzado: Estrategias de Compartición de UI con Compose Multiplatform"
description: "Explorando patrones de navegación complejos y gestión de estado entre Android e iOS utilizando Kotlin Multiplatform en 2026."
pubDate: 2026-02-06
lastmod: 2026-07-18
author: ArceApps
keywords:
  - "KMP Avanzado"
  - "Estrategias UI"
  - "Compartición"
  - "Kotlin Multiplatform"
  - "UI"
canonical: "https://arceapps.com/es/blog/kmp-advanced-ui-strategies/"
heroImage: "/images/tech-kmp-ui-sync.svg"
tags: ["Kotlin Multiplatform", "KMP", "Compose Multiplatform", "iOS", "Android", "Arquitectura"]
---



Kotlin Multiplatform (KMP) ha madurado significativamente. Como comentamos en mi artículo sobre el [Estado de KMP 2025](/es/blog/kmp-2025-state), compartir la lógica de negocio es ahora una práctica estándar. Sin embargo, con el lanzamiento de **Compose Multiplatform 1.8**, el debate se ha desplazado a la capa de UI: *¿Cuánta interfaz de usuario deberíamos realmente compartir?*

En este artículo, profundizaremos en estrategias avanzadas para compartir código UI entre Android e iOS sin sacrificar la sensación "nativa" que esperan los usuarios. Es la versión expandida del original de febrero 2026: he añadido una tercera estrategia (Selective Compose), una tabla de decisión completa, y un caso de estudio de migración real.

## Estrategia 1: El Enfoque "Híbrido"

En este modelo, compartes las **Pantallas de Feature** pero mantienes la **Navegación** nativa. Esta es a menudo la apuesta más segura para aplicaciones existentes que migran a KMP.

- **Android:** Usa Jetpack Navigation (o Type-Safe Navigation).
- **iOS:** Usa SwiftUI `NavigationStack` o Coordinators de `UIKit`.
- **Shared:** El contenido de las pantallas (Composables).

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
- Gestos de navegación nativos perfectos (swipe-back en iOS).
- Fácil integración en bases de código existentes.

**Contras:**
- Lógica de navegación duplicada.

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
- Escribe una vez, ejecuta en todas partes.
- Lógica de deep-linking centralizada.

**Contras:**
- Requiere una fuerte inversión en librerías específicas.
- Las transiciones específicas de la plataforma pueden ser difíciles de acertar.

## Estrategia 3: El Enfoque "Selective Compose" (nuevo en 2026)

Ni todo compartido ni todo nativo. **Selective Compose** es la estrategia pragmática que ha ganado tracción en 2026: compartes **componentes hoja** (hojas de la UI tree, sin estado de navegación) pero mantienes las pantallas en cada plataforma.

```kotlin
// shared/ui/components/UserAvatar.kt
@Composable
fun UserAvatar(
    url: String,
    size: Dp = 48.dp
) {
    AsyncImage(
        model = url,
        contentDescription = null,
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
    )
}

// shared/ui/components/StatBadge.kt
@Composable
fun StatBadge(
    label: String,
    value: String,
    color: Color = MaterialTheme.colorScheme.primary
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = color.copy(alpha = 0.1f),
        modifier = Modifier.padding(2.dp)
    ) {
        Column(Modifier.padding(8.dp)) {
            Text(value, style = MaterialTheme.typography.titleMedium)
            Text(label, style = MaterialTheme.typography.labelSmall)
        }
    }
}
```

**Pros:**
- 0 dependencias de navegación cross-platform.
- Componentes pequeños son muy fáciles de testear.
- Las pantallas nativas pueden integrar componentes compartidos sin fricción.

**Contras:**
- Requiere disciplina: cada componente necesita ser revisado para "¿es compartible o no?".
- Temas: cada plataforma puede querer colores propios, lo que requiere `expect/actual` en `MaterialTheme`.

## 📊 Tabla de decisión: ¿qué comparto?

Esta es la tabla que uso en workshops cuando alguien pregunta "¿qué parte de mi UI debería compartir?". Las decisiones se basan en la lógica del componente, no en la tecnología:

| Componente | ¿Compartir? | Por qué |
|---|---|---|
| Botones, inputs, cards | ✅ Sí | Sin estado de navegación, idénticos visualmente. |
| Listas con scroll | ✅ Sí | `LazyColumn` funciona igual en ambas plataformas. |
| Formularios complejos | ✅ Sí | Validación compartible. |
| Modales / Dialogs | ✅ Sí | Sin comportamientos específicos de plataforma. |
| Barra de navegación inferior | ⚠️ Depende | Si necesitas gestos nativos de iOS, no. Si solo es visual, sí. |
| Splash screen | ❌ No | Cada plataforma tiene su convención (LaunchScreen en iOS, theme en Android). |
| Push notification UI | ❌ No | APIs específicas de plataforma, sin valor en compartir. |
| Integración con cámara | ❌ No | UI 100% nativa, lógica puede ser shared via `expect/actual`. |
| WebView embebido | ⚠️ Depende | `UIKitView`/`AndroidView` requieren cuidado, pero el contenedor compartido funciona. |

## Caso de estudio: migrando "Auth" y dejando "Camera" nativos

Un ejemplo real que hemos aplicado en proyectos recientes. La feature `Auth` (login, registro, recuperación) es **puramente formulario**: inputs, validaciones, llamada a API. Cero dependencia de UI nativa. Migración completa a `shared/` con Compose Multiplatform. Resultado: ~80% del código compartido entre plataformas.

La feature `Camera` (captura de foto, preview en vivo, integración con QR) es **100% nativa**: usa `CameraX` en Android y `AVFoundation` en iOS. No tiene sentido compartir UI porque las APIs son radicalmente distintas. Lo que SÍ compartimos es la **lógica de procesado de imagen** (decodificación, análisis) en `shared/`. Resultado: ~30% compartido (la lógica), 70% nativo (la UI).

El porcentaje de código compartido en una app KMP bien diseñada suele caer entre 30% y 70%. Si te dicen que comparten 95%, te están mintiendo o su app es trivial.

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

### El truco del `Modifier.platformSemantics()` (2026)

Para accesibilidad, hay sutilezas que solo aparecen en producción. iOS lee `contentDescription` con VoiceOver, Android lo lee con TalkBack. Si quieres un mensaje personalizado por plataforma, usa:

```kotlin
@Composable
expect fun Modifier.platformSemantics(label: String): Modifier

// Android: usa contentDescription
// iOS: usa accessibilityLabel directamente al componente
```

Esto evita el anti-patrón de tener `if (Platform.isIos)` por todos lados en el código compartido.

## iOS gotchas que me costó semanas aprender

Cuando compartes UI con Compose Multiplatform en iOS, hay tres problemas recurrentes que merece la pena conocer antes de empezar:

### 1. SwiftUI bindings vs `MutableState`

Compose usa `MutableState<T>` que internamente es un `StateFlow`. En iOS, el bridge a SwiftUI requiere `@StateObject` o `@ObservedObject`. El bridge no es automático; necesitas un `SKIE` (SKIE: Swift Kotlin Interop Enhanced) o un wrapper manual para que SwiftUI observe cambios.

```swift
// iOS side
struct ProfileScreenView: View {
    @StateObject var viewModel: ProfileViewModel = ProfileViewModel()

    var body: some View {
        ComposeView { ProfileScreen(viewModel.state, viewModel::onEditClick) }
    }
}
```

### 2. Lifecycle: `viewModelScope` vs SwiftUI lifecycle

En Android, `viewModelScope` se cancela con el ViewModel. En iOS, cuando SwiftUI descarta la vista (rotación, sheet cerrado), el scope de Kotlin NO se cancela automáticamente. Necesitas un hook explícito:

```kotlin
@Composable
fun rememberLifecycleScope(): CoroutineScope {
    val scope = rememberCoroutineScope()
    DisposableEffect(Unit) {
        onDispose { scope.cancel() }
    }
    return scope
}
```

### 3. Gestos: swipe-back vs predictive-back

El gesto de swipe-back de iOS es nativo del sistema. Compose Multiplatform no lo maneja por defecto. Para preservarlo en iOS necesitas `UINavigationController` wrapping o usar `BackHandler` de Compose con detección de plataforma. Es uno de los puntos donde el "All-In" se vuelve más caro.

## 📐 Migrar app existente a KMP en 4 pasos

Si tienes una app Android existente y quieres empezar a migrar a KMP sin reescribir todo, este es el orden que ha funcionado:

1. **Identifica la capa de red.** Es lo más fácil de compartir (cliente HTTP, modelos serializados). Empieza por ahí para validar el pipeline CI/CD.
2. **Mueve la lógica de negocio a `shared/`.** Use Cases, validadores, formateadores. Cero impacto en UI.
3. **Migra DAOs y Repositorios.** Room tiene soporte KMP experimental desde 2024; SQLDelight es la opción estable. Esto te da acceso a la misma DB desde iOS eventualmente.
4. **Empieza con "Selective Compose".** Elige 3-5 componentes hoja de tu UI Android. Compártelos. Itera.

El error más caro es empezar por la UI. Empieza por la lógica y deja UI para cuando tengas confianza en el pipeline.

## Conclusión

No existe una "talla única". Para aplicaciones brownfield (existentes), el **Enfoque Híbrido** o **Selective Compose** minimiza el riesgo. Para proyectos greenfield (nuevos) en 2026, las herramientas alrededor del **Enfoque All-In** son lo suficientemente maduras como para ser un competidor viable de Flutter, con el beneficio añadido del rendimiento nativo.

Mi recomendación por defecto para 2026: **Selective Compose + capa de red compartida**. Es el sweet spot entre ROI y riesgo. Cuando tengas confianza, evalúa el All-In.

## Bibliografía y Referencias

1. [Documentación de Compose Multiplatform](https://www.jetbrains.com/lp/compose-multiplatform/)
2. [Librería Decompose](https://arkivanov.github.io/Decompose/)
3. [Estado de KMP 2025](/es/blog/kmp-2025-state)
4. [Now in Android — Architecture](https://github.com/android/nowinandroid) — El proyecto open source de Google. Aunque es solo Android, los patrones se transladan bien a KMP.
5. [SKIE: Swift Kotlin Interop Enhanced](https://skie.touchlab.co/) — Si vas a usar SwiftUI con KMP, esta librería te salva meses de fricción.
6. [Touchlab: KMP Production Case Studies](https://touchlab.co/) — Casos reales de migración. Algunos posts requieren registro pero el contenido es oro.
