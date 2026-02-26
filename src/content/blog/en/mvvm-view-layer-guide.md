---
title: "MVVM: The View Layer Guide"
description: "How to implement the View layer in MVVM with Jetpack Compose. State collection, error handling, and separation of concerns."
pubDate: 2025-10-15
heroImage: "/images/placeholder-article-mvvm-view.svg"
tags: ["MVVM", "View", "Android", "Jetpack Compose", "Architecture", "Clean Code"]
reference_id: "0b7b5c3e-9982-4ee9-a47d-02edb4be618d"
---
## 🖼️ The Role of the View

In MVVM, the View (Activity, Fragment, or Composable) is responsible **only** for rendering the UI and capturing user interactions. It should contain **zero** business logic.

### Responsibilities
1.  **Render State**: Display data from the ViewModel.
2.  **Capture Events**: Click listeners, text input.
3.  **Navigate**: Handle navigation actions (though logic often resides in ViewModel).

## ⚡ The Pattern: Unidirectional Data Flow (UDF)

1.  **State flows down**: ViewModel -> View.
2.  **Events flow up**: View -> ViewModel.

### Example: Collecting State in Compose

```kotlin
@Composable
fun UserScreen(
    viewModel: UserViewModel = hiltViewModel()
) {
    // Collect state safely with lifecycle awareness
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is UserUiState.Loading -> LoadingScreen()
        is UserUiState.Success -> UserList(state.users)
        is UserUiState.Error -> ErrorScreen(state.message)
    }
}
```

## ⚠️ Common Anti-Patterns

### 1. Logic in UI
**Wrong**: Calculating list filters inside `lazyColumn`.
**Right**: Filter in ViewModel, expose the filtered list.

### 2. State Hoisting Failures
**Wrong**: Passing `UserViewModel` deep down the widget tree.
**Right**: Pass only data (`List<User>`) and lambdas (`onUserClick: (String) -> Unit`) to child composables. This makes them reusable and testable.

```kotlin
// Reusable Component - Knows nothing about ViewModel
@Composable
fun UserList(
    users: List<User>,
    onUserClick: (String) -> Unit
) { ... }
```

### 3. Ignoring Lifecycle
**Wrong**: Launching coroutines in `LaunchedEffect(Unit)` without considering screen rotation or backgrounding.
**Right**: Rely on ViewModel's scope or `lifecycleScope`.

## 🔄 Handling One-Time Events (Navigation, Toasts)

This is tricky in Compose. The recommended approach is to model events as part of the state or use a separate `SharedFlow` / `Channel`.

### Using Effect
```kotlin
val event = viewModel.eventFlow.collectAsStateWithLifecycle(initialValue = null)

LaunchedEffect(event.value) {
    event.value?.let { e ->
        when(e) {
            is UiEvent.ShowToast -> context.toast(e.message)
            is UiEvent.Navigate -> navController.navigate(e.route)
        }
        viewModel.onEventConsumed() // Clear event to avoid re-trigger on rotation
    }
}
```

## 🏁 Conclusion

A clean View layer is dumb. It blindly reflects the state provided by the ViewModel. This makes UI tests trivial and ensures consistency.
