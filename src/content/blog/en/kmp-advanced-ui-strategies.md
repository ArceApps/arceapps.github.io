---
title: "Advanced KMP: UI Sharing Strategies with Compose Multiplatform"
description: "Exploring complex navigation patterns and state management between Android and iOS using Kotlin Multiplatform in 2026."
pubDate: 2026-02-06
lastmod: 2026-07-18
author: ArceApps
keywords:
  - "Advanced KMP"
  - "UI Strategies"
  - "Sharing"
  - "Kotlin Multiplatform"
  - "UI"
canonical: "https://arceapps.com/blog/kmp-advanced-ui-strategies/"
heroImage: "/images/tech-kmp-ui-sync.svg"
tags: ["Kotlin Multiplatform", "KMP", "Compose Multiplatform", "iOS", "Android", "Architecture"]
---



Kotlin Multiplatform (KMP) has matured significantly. As I discussed in my article on [State of KMP 2025](/blog/kmp-2025-state), sharing business logic is now standard practice. However, with the release of **Compose Multiplatform 1.8**, the debate has shifted to the UI layer: *How much user interface should we really share?*

In this article, we'll dive into advanced strategies for sharing UI code between Android and iOS without sacrificing the "native" feel users expect. This is the expanded version of the original from February 2026: I've added a third strategy (Selective Compose), a complete decision table, and a real migration case study.

## Strategy 1: The "Hybrid" Approach

In this model, you share **Feature Screens** but keep **Navigation** native. This is often the safest bet for existing applications migrating to KMP.

- **Android:** Use Jetpack Navigation (or Type-Safe Navigation).
- **iOS:** Use SwiftUI `NavigationStack` or Coordinators from `UIKit`.
- **Shared:** The screen content (Composables).

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
- Perfect native navigation gestures (swipe-back on iOS).
- Easy integration into existing codebases.

**Cons:**
- Duplicated navigation logic.

## Strategy 2: The "All-In" Approach (Decompose / Voyager)

With libraries like **Decompose** or **Voyager**, you can share the entire navigation stack. This effectively turns your app into a Single Activity application (Android) / Single Root View (iOS).

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
- Write once, run everywhere.
- Centralized deep-linking logic.

**Cons:**
- Requires strong investment in specific libraries.
- Platform-specific transitions can be hard to get right.

## Strategy 3: The "Selective Compose" Approach (New in 2026)

Neither fully shared nor fully native. **Selective Compose** is the pragmatic strategy that has gained traction in 2026: share **leaf components** (leaves of the UI tree, no navigation state) but keep screens on each platform.

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
- 0 dependencies on cross-platform navigation.
- Small components are very easy to test.
- Native screens can integrate shared components without friction.

**Cons:**
- Requires discipline: each component needs to be reviewed for "is it shareable or not?".
- Theming: each platform may want its own colors, requiring `expect/actual` on `MaterialTheme`.

## 📊 Decision Table: What Do I Share?

This is the table I use in workshops when someone asks "what part of my UI should I share?". Decisions are based on component logic, not technology:

| Component | Share? | Why |
|---|---|---|
| Buttons, inputs, cards | ✅ Yes | No navigation state, visually identical. |
| Scrollable lists | ✅ Yes | `LazyColumn` works the same on both platforms. |
| Complex forms | ✅ Yes | Validation is shareable. |
| Modals / Dialogs | ✅ Yes | No platform-specific behaviors. |
| Bottom navigation bar | ⚠️ Depends | If you need native iOS gestures, no. If only visual, yes. |
| Splash screen | ❌ No | Each platform has its own convention (LaunchScreen on iOS, theme on Android). |
| Push notification UI | ❌ No | Platform-specific APIs, no value in sharing. |
| Camera integration | ❌ No | 100% native UI, logic can be shared via `expect/actual`. |
| Embedded WebView | ⚠️ Depends | `UIKitView`/`AndroidView` requires care, but the shared container works. |

## Case Study: Migrating "Auth" and Leaving "Camera" Native

A real example we've applied in recent projects. The `Auth` feature (login, signup, recovery) is **purely form**: inputs, validations, API calls. Zero native UI dependency. Full migration to `shared/` with Compose Multiplatform. Result: ~80% of code shared between platforms.

The `Camera` feature (photo capture, live preview, QR integration) is **100% native**: uses `CameraX` on Android and `AVFoundation` on iOS. It doesn't make sense to share UI because the APIs are radically different. What we DO share is the **image processing logic** (decoding, analysis) in `shared/`. Result: ~30% shared (logic), 70% native (UI).

The percentage of shared code in a well-designed KMP app usually falls between 30% and 70%. If someone tells you they share 95%, they're either lying or their app is trivial.

## Handling Platform Specifics in UI

Even when sharing UI, you often need platform-specific tweaks. **Compose Multiplatform 1.8** introduces better support for `expect/actual` inside the Composable scope.

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

### The `Modifier.platformSemantics()` Trick (2026)

For accessibility, there are subtleties that only show up in production. iOS reads `contentDescription` with VoiceOver, Android reads it with TalkBack. If you want a platform-customized message, use:

```kotlin
@Composable
expect fun Modifier.platformSemantics(label: String): Modifier

// Android: uses contentDescription
// iOS: uses accessibilityLabel directly on the component
```

This avoids the anti-pattern of having `if (Platform.isIos)` everywhere in shared code.

## iOS Gotchas That Cost Me Weeks to Learn

When you share UI with Compose Multiplatform on iOS, there are three recurring problems worth knowing before starting:

### 1. SwiftUI bindings vs `MutableState`

Compose uses `MutableState<T>` which internally is a `StateFlow`. On iOS, bridging to SwiftUI requires `@StateObject` or `@ObservedObject`. The bridge isn't automatic; you need an `SKIE` (Swift Kotlin Interop Enhanced) or a manual wrapper to make SwiftUI observe changes.

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

On Android, `viewModelScope` cancels with the ViewModel. On iOS, when SwiftUI discards the view (rotation, sheet closed), the Kotlin scope does NOT cancel automatically. You need an explicit hook:

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

### 3. Gestures: swipe-back vs predictive-back

iOS's swipe-back gesture is system-native. Compose Multiplatform doesn't handle it by default. To preserve it on iOS you need `UINavigationController` wrapping or use Compose's `BackHandler` with platform detection. This is one of the spots where "All-In" gets more expensive.

## 🧪 Cross-Platform Testing: What Changes

One thing that surprises teams moving to KMP: the testing strategy changes. Tests run on the JVM for unit tests (fast), but you also need to verify behavior on each target platform.

### Unit tests (shared, JVM-based)

The classic test pyramid still applies, with one twist: tests in `shared/src/commonTest/` run on JVM, super fast:

```kotlin
// shared/src/commonTest/kotlin/AuthValidatorTest.kt
class AuthValidatorTest {
    @Test
    fun `rejects empty email`() {
        assertEquals(ValidationResult.Invalid("Empty"), AuthValidator.validateEmail(""))
    }

    @Test
    fun `accepts valid email`() {
        assertEquals(ValidationResult.Valid, AuthValidator.validateEmail("user@example.com"))
    }
}
```

These tests run in milliseconds. Run them on every commit, no excuses.

### Platform-specific tests (when needed)

If you have `expect/actual` declarations, you need tests on both platforms:

```kotlin
// shared/src/androidTest/kotlin/PlatformWebViewTest.kt
class PlatformWebViewTest {
    @Test
    fun `renders url on Android`() {
        // Uses AndroidJUnit4 runner, has access to Android context
        val view = PlatformSpecificWebView("https://example.com")
        assertNotNull(view)
    }
}

// iosTest requires Xcode and a simulator
```

The honest truth: **90% of your tests should be `commonTest`**. Platform-specific tests are only for code that genuinely behaves differently per platform (e.g. WebView rendering quirks, native permissions, OS-specific APIs).

### Snapshot tests for UI components

For shared Composables, `roborazzi` (Robolectric-based snapshot testing) lets you render components on JVM and capture screenshots:

```kotlin
@Test
fun `UserAvatar renders correctly`() {
    composeRule.setContent {
        UserAvatar(url = "https://example.com/avatar.jpg", size = 64.dp)
    }

    onNodeWithTag("user-avatar").captureToImage().writeToFile("user-avatar.png")
}
```

Run the test, eyeball the screenshot, approve. This catches regressions that pure unit tests miss (alignment, padding, color).

### The rule of thumb

- **Logic**: 100% tested on JVM, shared between platforms.
- **Composables**: snapshot-tested on JVM (covers 80% of visual regressions).
- **Native UI wrappers**: tested on each platform manually or via instrumented tests.

If your team is spending more than 20% of test time on platform-specific tests, you're either over-testing or under-sharing.

## 📐 Migrating Existing App to KMP in 4 Steps

If you have an existing Android app and want to start migrating to KMP without rewriting everything, here's the order that has worked:

1. **Identify the network layer.** It's the easiest to share (HTTP client, serialized models). Start there to validate the CI/CD pipeline.
2. **Move business logic to `shared/`.** Use Cases, validators, formatters. Zero UI impact.
3. **Migrate DAOs and Repositories.** Room has experimental KMP support since 2024; SQLDelight is the stable option. This gives you access to the same DB from iOS eventually.
4. **Start with "Selective Compose".** Pick 3-5 leaf components from your Android UI. Share them. Iterate.

The most expensive mistake is starting with UI. Start with logic and leave UI for when you have confidence in the pipeline.

## Conclusion

There's no "one size fits all". For brownfield (existing) applications, the **Hybrid** or **Selective Compose** approach minimizes risk. For greenfield (new) projects in 2026, the tools around the **All-In** approach are mature enough to be a viable competitor to Flutter, with the added benefit of native performance.

My default recommendation for 2026: **Selective Compose + shared network layer**. It's the sweet spot between ROI and risk. When you have confidence, evaluate All-In.

## Bibliography and References

1. [Compose Multiplatform documentation](https://www.jetbrains.com/lp/compose-multiplatform/)
2. [Decompose library](https://arkivanov.github.io/Decompose/)
3. [State of KMP 2025](/blog/kmp-2025-state)
4. [Now in Android — Architecture](https://github.com/android/nowinandroid) — Google's open source project. Although Android-only, the patterns translate well to KMP.
5. [SKIE: Swift Kotlin Interop Enhanced](https://skie.touchlab.co/) — If you'll use SwiftUI with KMP, this library saves you months of friction.
6. [Touchlab: KMP Production Case Studies](https://touchlab.co/) — Real migration cases. Some posts require registration but the content is gold.
