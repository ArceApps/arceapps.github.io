---
title: "Effective Context: Feeding Your AI Agent"
description: "Learn strategies to provide the right context to your AI agents, from prompt files to dynamic context injection. Stop getting generic answers."
pubDate: 2025-06-05
heroImage: "/images/placeholder-article-context.svg"
tags: ["AI", "Prompt Engineering", "Context", "Productivity"]
reference_id: "4979c901-cec6-4aaa-ac52-ef833b0a0a1e"
---

The difference between a mediocre AI response and a brilliant one is almost always **Context**.
If you tell a Junior: "Make a login", they will ask "How? Which library? What design?".
If you tell an AI: "Make a login", it will guess. And it will probably guess wrong for your project.

## Strategy 1: The Global File (`AGENTS.md`)

As we saw in [Configuring Agents](configuring-ai-agents), having a central file with the "Rules of the Game" is essential. This is your static context.

### Strategy 2: Code Context (Semantic KDoc)

Document your base classes and key interfaces. Agents read comments to understand intent.

```kotlin
/**
 * Base Repository interface defining standard CRUD operations.
 * All repositories must implement this pattern.
 * Uses Result<T> wrapper for error handling.
 */
interface BaseRepository<T> {
    fun getAll(): Flow<Result<List<T>>>
    suspend fun getById(id: String): Result<T>
}

// Prompt: "Implement UserRepository following the BaseRepository pattern"
```

### Strategy 3: Dynamic Context with Promptfiles

Create `.prompt` files with reusable context:

```markdown
<!-- prompts/create-viewmodel.prompt -->

# Create ViewModel Template

## Context
Project: Android MVVM with Clean Architecture
Tech Stack: Kotlin, Hilt, Compose, Coroutines, StateFlow

## Instructions
Create a new ViewModel following project conventions:

### Structure
```kotlin
@HiltViewModel
class [Feature]ViewModel @Inject constructor(
    private val [useCases]: UseCases,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow<[Feature]UiState>([Feature]UiState.Loading)
    val uiState: StateFlow<[Feature]UiState> = _uiState.asStateFlow()

    init {
        // Initial load
    }
}
```

### UI State Pattern
```kotlin
sealed interface [Feature]UiState {
    object Loading : [Feature]UiState
    data class Success(val data: T) : [Feature]UiState
    data class Error(val message: String) : [Feature]UiState
}
```

### Requirements
- [ ] Use @HiltViewModel annotation
- [ ] Expose StateFlow (not MutableStateFlow)
- [ ] Use use cases (not repositories directly)
- [ ] Handle errors with sealed interface states
- [ ] Use viewModelScope for coroutines
- [ ] Include KDoc documentation
- [ ] Follow naming conventions
- [ ] Include example usage in KDoc

## Examples
See: ProfileViewModel.kt, SettingsViewModel.kt for reference
```

### Strategy 4: Context with Tests as Specification

Tests are executable specifications:

```kotlin
/**
 * AI PROMPT:
 * Implement UserViewModel so these tests pass.
 * The tests describe EXACTLY the expected behavior.
 */
@ExperimentalCoroutinesApi
class UserViewModelTest {

    @Test
    fun `should load users on init`() = runTest {
        // Arrange
        val expectedUsers = listOf(User("1", "John"), User("2", "Jane"))
        coEvery { getUsersUseCase() } returns flowOf(Result.success(expectedUsers))

        // Act
        val viewModel = UserViewModel(getUsersUseCase, SavedStateHandle())

        // Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf<UserUiState.Loading>()
            val success = awaitItem() as UserUiState.Success
            assertThat(success.users).isEqualTo(expectedUsers)
        }
    }
}
```

## Best Practices by Tool

### GitHub Copilot

```kotlin
// Copilot benefits from:
// 1. Descriptive comments BEFORE the code
// 2. Examples in the same file
// 3. Descriptive names

// Generate a ViewModel for users that:
// - Uses @HiltViewModel for DI
// - Exposes StateFlow<UserUiState>
// - Loads users with GetUsersUseCase
// - Allows searching by name
// - Handles Loading, Success, Error states

@HiltViewModel
class UserViewModel @Inject constructor(
    // Copilot will autocomplete following the pattern
```

### Gemini Code Assist

```kotlin
/*
Gemini Code Assist Prompt:

Project Context:
- Native Android App in Kotlin
- Architecture: Clean Architecture + MVVM
- DI: Hilt
- UI: Jetpack Compose
- Async: Coroutines + Flow
- State: StateFlow (no LiveData)

Task:
Create complete UserViewModel that:

1. Dependencies:
   - GetUsersUseCase
   - SearchUsersUseCase
   - SavedStateHandle

2. UI State:
   sealed interface UserUiState {
       object Loading
       data class Success(users: List<User>, searchQuery: String = "")
       data class Error(message: String)
   }

3. Public functions:
   - refresh(): Reloads users
   - search(query: String): Filters users by name
   - clearSearch(): Clears search and shows all

4. Behavior:
   - Initial automatic load in init
   - Search with 300ms debounce
   - User-friendly error handling
   - Appropriate Loading states

5. Testing:
   - Generate tests with JUnit5, MockK, Turbine
   - Cases: initial load, refresh, search, errors
   - Coverage > 90%

Reference examples:
- ProfileViewModel.kt (state pattern)
- SettingsViewModel.kt (error handling)

Generate code with complete KDoc documentation.
*/
```

## Context Anti-Patterns

### ❌ Vague Context
```
"Create a login system"
```
Problem: Too broad, no specs.

### ❌ Contradictory Context
```
"Use MVVM but put business logic in the ViewModel.
Also use Clean Architecture."
```
Problem: Contradictory instructions confuse the agent.

### ❌ Obsolete Context
```
"Follow the pattern we used before with LiveData"
```
Problem: Outdated context generates legacy code.

## Perfect Context: Checklist

Before asking an AI agent for code, verify that you have provided:

- [ ] **Architecture**: MVVM? Clean? MVI?
- [ ] **Tech Stack**: Key libraries used
- [ ] **Naming Conventions**: How to name classes, functions, variables
- [ ] **Code Patterns**: Examples of similar existing code
- [ ] **State Management**: How you structure UI states
- [ ] **Error Handling**: How you handle and present errors
- [ ] **Testing Strategy**: Frameworks and testing patterns
- [ ] **Documentation**: Level and style of expected documentation
- [ ] **Concrete Examples**: Reference code from the project
- [ ] **Edge Cases**: Special situations to consider

## Conclusion

Providing effective context to AI agents is a **critical skill** in modern development. It is not just about writing good prompts, it is about:

1. **Structuring your project** so context is discoverable
2. **Documenting conventions** in agents.md and code
3. **Maintaining examples** of quality code as reference
4. **Iterating and refining** based on results
5. **Training the agent** with continuous feedback

The time invested in establishing good context pays off exponentially:
- More precise generated code
- Fewer iterations needed
- Greater consistency
- Better overall quality

**Your next step:**
Review your next prompt for an AI agent and apply these techniques. Transform "Create a ViewModel" into a full-context prompt and see the difference in code quality.
