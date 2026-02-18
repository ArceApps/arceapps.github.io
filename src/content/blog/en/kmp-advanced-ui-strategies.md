---
title: "Advanced KMP: UI Sharing Strategies with Compose Multiplatform 1.8"
description: "Exploring complex navigation patterns and state management across Android and iOS using Kotlin Multiplatform in 2026."
pubDate: 2026-02-06
heroImage: "/images/tech-kmp-ui-sync.svg"
tags: ["Kotlin Multiplatform", "KMP", "Compose Multiplatform", "iOS", "Android", "Architecture"]
---

Kotlin Multiplatform (KMP) has matured significantly. As discussed in my [State of KMP 2025](/blog/kmp-2025-state) article, sharing business logic is now standard practice. However, with the release of **Compose Multiplatform 1.8**, the debate has shifted to the UI layer: *How much UI should we actually share?*

In this article, we'll dive into advanced strategies for sharing UI code between Android and iOS without sacrificing the native "feel" that users expect.

## Strategy 1: The "Hybrid" Approach

In this model, you share **Feature Screens** but keep the **Navigation** native. This is often the safest bet for existing apps migrating to KMP.

*   **Android:** Uses Jetpack Navigation (or Type-Safe Navigation).
*   **iOS:** Uses SwiftUI `NavigationStack` or `UIKit` Coordinators.
*   **Shared:** The content of the screens (Composables).

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
            Text("Edit Profile")
        }
    }
}
```

**Pros:**
*   Perfect native navigation gestures (swipe-back on iOS).
*   Easy integration into existing codebases.

**Cons:**
*   Duplicated navigation logic.

## Strategy 2: The "All-In" Approach (Decompose / Voyager)

With libraries like **Decompose** or **Voyager**, you can share the entire navigation stack. This effectively turns your app into a Single Activity (Android) / Single Root View (iOS) application.

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

    // ... configuration logic
}
```

**Pros:**
*   Write once, run everywhere.
*   Centralized deep-linking logic.

**Cons:**
*   Requires heavy investment in specific libraries.
*   Platform-specific transitions can be tricky to get right.

## Handling Platform Specifics in UI

Even when sharing UI, you often need platform-specific tweaks. **Compose Multiplatform 1.8** introduces better support for `expect/actual` within Composable scope.

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

## Conclusion

There is no "one size fits all". For brownfield apps, the **Hybrid Approach** minimizes risk. For greenfield projects in 2026, the tooling around the **All-In Approach** is mature enough to be a viable competitor to Flutter, with the added benefit of native performance.

## References

1.  [Compose Multiplatform Documentation](https://www.jetbrains.com/lp/compose-multiplatform/)
2.  [Decompose Library](https://arkivanov.github.io/Decompose/)
3.  [State of KMP 2025](/blog/kmp-2025-state)
