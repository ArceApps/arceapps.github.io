---
title: "MVVM View: The Dumbest Component (And Why That's Good)"
description: "The 'View' in MVVM (Activities, Fragments, Composables) should be dumb. Learn how to keep logic out of your UI to ensure testability and stability."
pubDate: 2025-10-03
heroImage: "/images/placeholder-article-view-layer.svg"
tags: ["Android", "MVVM", "Architecture", "UI Layer", "Clean Code"]
reference_id: "5818f331-41ee-42ad-8f7d-6e6f9f8fd5af"
---
## 🎭 The Role of the View

In MVVM, the View (Activity, Fragment, or Composable) has a single responsibility: **Render the State**.

The View should contain **zero business logic**.
-   ❌ "If the user is admin, show button." (Logic)
-   ✅ "Show button if `state.isAdminButtonVisible` is true." (Rendering)

### Why "Dumb" is Better?
1.  **Testability**: Testing UI is slow and flaky (Espresso). Testing Logic in ViewModel is fast (JUnit). The less logic in the UI, the less you need Espresso.
2.  **Scalability**: Logic mixed with layout code creates spaghetti that breaks when you change the design.
3.  **Portability**: If your logic is in the View, you can't easily migrate from XML to Compose.

## 🎨 View in Jetpack Compose

Compose forces you to think in terms of "State -> UI", which is perfect for MVVM.

```kotlin
@Composable
fun UserScreen(viewModel: UserViewModel = hiltViewModel()) {
    // 1. Observe State
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    // 2. Pass State Down
    UserContent(
        state = state,
        // 3. Pass Events Up
        onRefresh = { viewModel.onRefresh() }
    )
}
```

The `UserScreen` acts as a connector. `UserContent` is a pure, stateless component that just renders data.

## ⚠️ Common "Smart View" Mistakes

### 1. Formatting Data
**Bad:**
```kotlin
// In Composable
Text(text = "Price: ${product.price * 1.21}")
```
**Good:**
The ViewModel should expose `displayPrice` formatted string. The View just shows strings.

### 2. Handling Navigation Logic
**Bad:**
```kotlin
onClick = {
    if (user.isLoggedIn) navController.navigate("home")
    else navController.navigate("login")
}
```
**Good:**
The ViewModel decides where to go. The View just listens to a "Navigation Event".

### 3. Managing Resources Conditionals
**Bad:**
```kotlin
val color = if (state.isError) Color.Red else Color.Green
```
**Good:**
This is borderline. UI logic (colors, animations) belongs in the View. Business logic (is this an error?) belongs in the ViewModel. This example is actually acceptable, but could also be `state.statusColor`.

## 🎯 Conclusion

Make your Views dumb. Keep them passive. Their only job is to reflect what the ViewModel tells them. If you find yourself writing `if` statements in your Fragment/Composable regarding data rules, move it to the ViewModel.
