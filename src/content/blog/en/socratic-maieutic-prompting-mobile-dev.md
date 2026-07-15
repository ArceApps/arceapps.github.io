---
title: "Socratic Prompting: Maieutic Reasoning in Mobile Dev"
description: "Avoid 'almost correct' code in Android & iOS. Master Socratic and Maieutic prompting with Gemini, Copilot, and Cursor using dialog flows and source code."
pubDate: 2026-07-13
lastmod: 2026-07-14
author: ArceApps
keywords:
  - "Socratic Prompting"
  - "Maieutic Prompting"
  - "Mobile Development"
  - "Android"
  - "iOS"
  - "AI Agents"
canonical: "https://arceapps.com/blog/socratic-maieutic-prompting-mobile-dev/"
heroImage: "/images/socratic-maieutic-prompting-mobile-hero-en.svg"
tags: ["AI", "Prompt Engineering", "Android", "iOS", "Kotlin", "Swift", "Maieutic Prompting"]
reference_id: "c87a5611-d102-475f-b52e-d815b83d3d76"
---

## 1. Executive Summary

Conversing with a Large Language Model (LLM) is not a simple search: it is a **clinical interview**. Unfortunately, the majority of mobile developers treat it as if it were a conventional Google search engine, sending flat, imperative prompts and expecting the AI to guess their application's architecture.

The Socratic method, adapted for LLM prompting by Edward Y. Chang in 2023 【1】, and its deeper logical extension, *Maieutic Prompting* by Jung et al. in 2022 【2】【3】, demonstrate that the accuracy of complex reasoning outputs increases by up to 20% when the dialogue is structured around clarifying questions, assumption verification, and recursive reasoning, instead of direct instructions.

This practical guide teaches Android and iOS developers how to apply this framework using the tools they already use daily (Gemini in Android Studio, GitHub Copilot for Xcode and VS Code, Cursor Composer, Claude Code, and JetBrains AI Assistant) to convert vague requirements into structured queries that the model can resolve with absolute precision.

---

## 2. The Problem with Direct Prompts in Mobile Development

Around 84% of professional developers already use AI tools in their daily workflow, and 51% use them every day 【4】. However, the same survey reveals an uncomfortable metric: 46% of developers do not trust the accuracy of what the AI produces, and 66% report spending more time **debugging "almost correct" code** than they saved by writing it in the first place 【4】.

In mobile development, this inefficiency is particularly expensive. An "almost correct" block of code inside an Android `LazyColumn` or an iOS `LazyVStack` containing 10,000 items may go unnoticed on a high-end development machine, but it will trigger memory consumption crashes and frame drops (jank) on a low-end user device in production.

The root of the issue is rarely the raw intelligence of the model itself. It is the prompt. Most prompts found in typical tutorials — such as *"write me a ViewModel in Kotlin using Hilt and Flow"* — are **incomplete instructions**. They fail to define what constraints exist, what minimum APIs are supported, what behavior is expected when the device loses network connectivity, or what architectural decisions have already been made in the project.

Instead of pausing to ask for the missing details, the language model **assumes** whatever is statistically most probable. This generates code that is inconsistent with your real architecture and leads to hidden bugs.

![Infographic: The 3 phases of the Socratic method for LLMs](/images/socratic-maieutic-prompting-mobile-fases-en.svg)

The Socratic method formalized by Chang in March 2023 【1】 starts from a fundamental observation: **you cannot extract precise knowledge from the inquirer if they are not willing to be questioned**. In prompting, this means structuring the conversation so that the model is forced to ask for specification before generating the codebase.

---

## 3. The Socratic Method Applied to LLMs

Edward Y. Chang identifies six Socratic techniques that map cleanly onto modern prompt engineering patterns 【1】:

1. **Definition**: Forcing the model to reformulate the problem in its own terms before acting. This is the foundation of the *Rephrase and Respond* (RaR) pattern 【5】.
2. **Elenchus (Refutation)**: Asking the model to find counterexamples to its own response and evaluate inconsistencies before delivering the final output.
3. **Dialectic**: Having the model simulate a debate with opposing views before deciding on a specific implementation path.
4. **Maieutics**: Drawing out latent knowledge from the model through successive questioning that breaks down logical complexity. This is the core of *Maieutic Prompting* 【2】.
5. **Generalization**: Elevating the level of abstraction to evaluate whether the solution holds in scenarios not initially considered.
6. **Counterfactual Reasoning**: Asking the model *"what if we used pattern Y instead of pattern X?"* to evaluate architectural trade-offs.

These techniques are not interchangeable. They target **specific failures** of direct reasoning: ambiguity, inconsistency, confirmation bias, and edge-case omission. Mixing all six without a clear structure degrades the quality of the inference, which is why it is vital to apply them modularly and in phases.

---

## 4. The Three Operational Phases

To implement the Socratic framework, the conversation with the LLM must be split into three distinct, sequential phases.

### Phase 1: Questions Only
Before generating any code, the model is strictly forbidden from writing classes or functions. Its only allowed output is a list of clarifying questions. Each question must be directly linked to a critical design or implementation decision.

### Phase 2: Assumption Verification
Once the developer answers the model's questions, the model must reformulate the problem in its own words and list the technical assumptions it will use for the final code generation.

### Phase 3: Response
Only after the developer approves the assumptions does the model deliver the final code. This response must include two additional elements:
*   A **brief reasoning** (2 to 3 sentences) explaining why that specific solution was chosen.
*   An **alternative framing** describing how the code would change if one of the initial requirements was modified.

---

## 5. Android Case Study: Compose, Room, and WorkManager

To illustrate this flow, we will design an onboarding screen in Android that requires persisting the user's progress and syncing it in the background with a remote server.

### Step 1: Phase 1 Prompt (Questions Only)
The developer inputs the following prompt into the IDE chat:

```text
ROLE: Senior Android Software Engineer.
TASK: Help me design an Onboarding feature using Jetpack Compose, Room, and WorkManager in Kotlin.
CRITICAL RULE: You are forbidden from writing code in this phase. Ask only the necessary questions to define the onboarding's architecture. Each question must directly impact the code you will generate later.
```

#### Model Response in Phase 1:
> To provide the best implementation, I need to clarify the following points:
> 1. How should the onboarding completion state be persisted? Should we save it in `Room` alongside the rest of the user data, or should we use `Jetpack DataStore Preferences` for simple I/O?
> 2. For navigation, is the onboarding flow the start destination (`startDestination`) of your `NavHost` controlled dynamically via an observable state, or are we performing an explicit redirect?
> 3. Regarding WorkManager, what exact data needs to be synchronized by the `SyncWorker` with the backend, and what network constraints and `BackoffPolicy` should we configure?
> 4. Do you need support for adaptive layouts (tablets and foldables), or is the design restricted to portrait-only phones?

---

### Step 2: Developer Input & Phase 2 (Assumption Verification)
The developer responds:

```text
1. We will use DataStore Preferences for the onboarding flag. Room will only be used to store user profile info entered in the final slide.
2. The NavHost will switch its startDestination based on a StateFlow exposed from the ViewModel.
3. The Worker will send the profile JSON to the API. It should run only on unmetered internet connection (WiFi) and apply an exponential backoff policy.
4. Portrait-only phones for now.
```

#### Model Response in Phase 2:
> Perfect. Based on your answers, I will proceed with the following assumptions:
> - We will use `androidx.datastore.preferences.core` with a boolean key `onboarding_completed`.
> - The `ViewModel` will read from a `DataStoreRepository` and expose a `StateFlow<OnboardingState>` containing `Loading`, `ShowOnboarding`, and `NavigateToHome`.
> - We will create a basic `ProfileDao` and `RoomDatabase` for the `UserProfile` entity.
> - We will design a `SyncProfileWorker` inheriting from `CoroutineWorker` that takes the profile ID as input, configured with `NetworkType.UNMETERED` and an exponential backoff policy.
>
> Please confirm if these assumptions are correct so I can proceed with Phase 3 code generation.

---

### Step 3: Approval & Phase 3 (Model Response)
The developer confirms: `"Correct, generate the code for Phase 3."`

#### Generated Production Code (Phase 3):

```kotlin
// 1. Room Entity for the Profile
package com.arceapps.socratic.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_profile")
data class UserProfile(
    @PrimaryKey val id: String,
    val username: String,
    val email: String
)

// 2. DataStore for onboarding persistence state
package com.arceapps.socratic.data.repository

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "settings")

class OnboardingRepository(private val context: Context) {
    private val ONBOARDING_KEY = booleanPreferencesKey("onboarding_completed")

    val isOnboardingCompleted: Flow<Boolean> = context.dataStore.data
        .map { preferences -> preferences[ONBOARDING_KEY] ?: false }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[ONBOARDING_KEY] = completed
        }
    }
}

// 3. SyncWorker for server synchronization
package com.arceapps.socratic.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.ListenableWorker.Result
import java.io.IOException

class SyncProfileWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val profileId = inputData.getString("profile_id") ?: return Result.failure()
        
        return try {
            // Simulated network call to Retrofit API
            val success = mockUploadProfileToServer(profileId)
            if (success) Result.success() else Result.retry()
        } catch (e: IOException) {
            Result.retry()
        } catch (e: Exception) {
            Result.failure()
        }
    }

    private suspend fun mockUploadProfileToServer(profileId: String): Boolean {
        // Simulated upload logic
        kotlinx.coroutines.delay(1000)
        return true
    }
}
```

#### Model Reasoning:
> The configuration persistence (`DataStore`) has been decoupled from relational profile data (`Room`) adhering to SOLID principles. The `SyncProfileWorker` encapsulates background operations, ensuring system robustness against unexpected network disconnects or process death.

#### Alternative Framing:
> If you need a dynamic onboarding flow (where slides and copy are fetched from a remote CMS in real-time), this static architecture would have to change. We would introduce an `OnboardingContentRepository` fetching data during the ViewModel initialization and exposing a loading state (`OnboardingState.LoadingContent`).

---

## 6. iOS Case Study: Secure Storage with Swift 6, SwiftUI, and Swift Concurrency

In iOS, securing sensitive data and managing correct thread safety under Swift 6's strict concurrency model are typical areas where LLMs generate data race warnings if they are not prompted Socratically.

### Step 1: Phase 1 Prompt (Questions Only)
The developer inputs the following in Xcode Copilot Chat:

```text
ROLE: Senior iOS Software Engineer.
TASK: Help me design a secure storage repository in Swift 6 using Keychain Services and SwiftUI.
CRITICAL RULE: DO NOT write code yet. Ask questions to define the architectural details. I want to avoid Swift 6 data races and SwiftUI lifecycle issues.
```

#### Model Response in Phase 1:
> I will formulate the critical questions to construct a robust implementation:
> 1. Will this repository be accessed from multiple tasks or threads? If so, should we isolate it using a Swift `actor` or keep it on the `@MainActor`?
> 2. How should we handle SwiftUI state observation? Do you target iOS 17+ where we can use the `@Observable` macro, or must we support older targets with `ObservableObject` and `@Published`?
> 3. What types of keys will you store, and do they require custom access control configurations (like biographical authentication requirement `kSecAttrAccessControl`)?
> 4. Are there unit tests planned? If so, should we implement a mockable protocol interface for the keychain wrapper?

---

### Step 2: Developer Input & Phase 2 (Assumption Verification)
The developer responds:

```text
1. It will be accessed from background network threads, so it must be isolated via a dedicated global Actor.
2. Target is iOS 17+. We will use the new @Observable macro.
3. Plain credentials (token string). No biometrics required for now.
4. Yes, we need a SecureRepositoryProtocol for dependency injection.
```

#### Model Response in Phase 2:
> Understood. Here are the assumptions for the Swift 6 implementation:
> - We will create a `SecureRepositoryProtocol` specifying asynchronous read/write methods.
> - We will implement a thread-safe `KeychainSecureRepository` isolated to a global `actor` to prevent data races.
> - The SwiftUI `ViewModel` will be isolated to the `@MainActor` and call the repository methods asynchronously.
> - We will use iOS 17's `@Observable` macro for reactive UI updates without blocking the main actor.
>
> Please confirm if I can proceed to write the Swift 6 code.

---

### Step 3: Approval & Phase 3 (Model Response)
The developer confirms: `"Yes, proceed with the implementation."`

#### Generated Production Code (Phase 3):

```swift
import Foundation
import Security

// 1. Mockable repository interface
protocol SecureRepositoryProtocol: Sendable {
    func save(key: String, value: String) async throws
    func fetch(key: String) async throws -> String?
    func delete(key: String) async throws
}

// 2. Swift 6 actor isolation for secure thread-safe keychain access
actor KeychainSecureRepository: SecureRepositoryProtocol {
    private let serviceName = "com.arceapps.socratic.keychain"

    func save(key: String, value: String) async throws {
        guard let data = value.data(using: .utf8) else {
            throw KeychainError.invalidData
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]

        // First remove existing item to avoid collisions
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.storageFailed(status)
        }
    }

    func fetch(key: String) async throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)

        guard status != errSecItemNotFound else { return nil }
        guard status == errSecSuccess, let data = dataTypeRef as? Data else {
            throw KeychainError.fetchFailed(status)
        }

        return String(data: data, encoding: .utf8)
    }

    func delete(key: String) async throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }
}

// Keychain errors
enum KeychainError: Error {
    case invalidData
    case storageFailed(OSStatus)
    case fetchFailed(OSStatus)
    case deleteFailed(OSStatus)
}

// 3. ViewModel isolated to the MainActor (iOS 17+)
@Observable
@MainActor
class SecuritySettingsViewModel {
    private let repository: SecureRepositoryProtocol
    var savedToken: String = ""
    var errorMessage: String? = nil

    init(repository: SecureRepositoryProtocol) {
        self.repository = repository
    }

    func saveToken(_ token: String) {
        Task {
            do {
                try await repository.save(key: "auth_token", value: token)
                self.savedToken = token
                self.errorMessage = nil
            } catch {
                self.errorMessage = "Failed to save: \(error.localizedDescription)"
            }
        }
    }
}
```

#### Model Reasoning:
> Using an `actor` for `KeychainSecureRepository` ensures all read and write Keychain operations are synchronized and non-blocking. This complies with Swift 6 Concurrency constraints, preventing data races in runtime without locking the UI main thread.

#### Alternative Framing:
> If you need to synchronize this keychain across devices using iCloud Keychain, we would mutate the query by adding `kSecAttrSynchronizable as String: kSecAttrSynchronizableAny` within the security query dictionary.

---

## 7. Maieutic Prompting and Abductive Depth

*Maieutic Prompting*, introduced by Jung et al. at EMNLP 2022 【2】, takes Chang's ideas to a formalized level of logical analysis: instead of relying on a single, linear response, **it forces the model to construct a tree of recursive explanations** and solves inference consistency using a logic solver.

![Infographic: Abductive tree in Maieutic Prompting](/images/socratic-maieutic-prompting-mobile-arbol-en.svg)

### The Structure of the Abductive Tree
To resolve a complex issue or an architectural conflict:
1. The model formulates a conceptual question Q.
2. From Q, it generates two opposing hypotheses with explanations:
   *   Hypothesis A: "Q is True, because..."
   *   Hypothesis B: "Q is False, because..."
3. For each branch, the model checks if the proposed arguments contradict rules or parameters established earlier in the project.
4. Branches showing logical inconsistencies are pruned.
5. The remaining branches are translated into Boolean clauses and resolved to find the path of least contradiction.

The results of this method on abstract reasoning benchmarks demonstrate massive accuracy gains over standard prompting and traditional *Chain-of-Thought* (CoT):

| Dataset          | Standard | CoT    | Self-Consistency | Maieutic | Gain over CoT |
|------------------|----------|--------|------------------|----------|---------------|
| Com2Sense        | 58.1     | 61.6   | 61.4             | **75.0** | +13.4%        |
| CSQA 2.0         | 54.1     | 59.6   | 60.8             | **69.5** | +9.9%         |
| CREAK            | 60.3     | 64.8   | 70.5             | **85.2** | +20.4%        |

In daily mobile development, running an external MAX-SAT solver is not practical. However, we can apply the **Self-Ask** pattern 【3】, which is a zero-shot variation of the explanation tree for chat interfaces. We instruct the model to formulate sub-questions and critique itself before writing any codebase.

---

## 8. High-Tension Mobile Use Cases

Maieutic prompting delivers its highest value in "high-tension" scenarios, where two critical constraints clash directly and the obvious choice has negative side effects:

*   **Data Pagination**: Deciding whether to implement Jetpack Paging 3's `PagingSource` or manage pagination manually in the repository to bypass the library's complexity while avoiding memory leaks.
*   **Caching Strategies**: Deciding if an API response should be persisted in a local database with encryption at rest for offline access, or kept in memory due to disk-size constraints.
*   **Lifecycle Management**: Retaining state in the ViewModel using `SavedStateHandle` against process death versus delegating persistence to a central repository.

---

## 9. Six Types of Socratic Questions (Paul's Taxonomy)

Richard Paul, founder of the *Foundation for Critical Thinking*, structured Socratic questions into six didactic categories 【6】【7】. Let's analyze how these apply operationally to mobile programming:

![Infographic: R.W. Paul's 6 types of Socratic questions](/images/socratic-maieutic-prompting-mobile-preguntas-en.svg)

### 1. Questions of Clarification
Aim to remove ambiguity from the requirements.
*   *Prompt Example:* `"What do you mean by 'immediate' synchronization? Should it execute in the foreground blocking the UI, or can it be queued in WorkManager?"`

### 2. Questions of Assumption
Challenge things taken for granted without empirical proof.
*   *Prompt Example:* `"You are assuming the device always has high bandwidth. What happens to this API call if the user is on a throttled 3G connection?"`

### 3. Questions of Evidence and Reasons
Demand data to back up architectural claims.
*   *Prompt Example:* `"What CPU performance metrics prove that using Room Flow is more efficient than executing direct suspended queries for this specific view?"`

### 4. Questions of Perspectives and Points of View
Force alternative solutions and avoid familiarity bias.
*   *Prompt Example:* `"How would a backend engineer concerned with data integrity resolve this problem, rather than a frontend engineer focused on UI responsiveness?"`

### 5. Questions of Implications and Consequences
Evaluate long-term effects of a choice on the codebase.
*   *Prompt Example:* `"If we choose Jetpack Compose Navigation instead of navigation via Compose Destinations, how does this affect our multi-module structure?"`

### 6. Meta-Questions about the Question
Reflect on the utility of the problem itself.
*   *Prompt Example:* `"Why are we trying to optimize the rendering performance of this component? Is this premature optimization, or does it address measured lag?"`

---

## 10. The Mobile AI Stack in 2025-2026

The evolution of AI coding assistants has transitioned from code autocomplete to autonomous agents. Structuring a Socratic dialogue is vital to maintaining control over multi-file edits.

| Tool | Individual Price | Main IDE | Agent Mode | Mobile Native Support |
| :--- | :--- | :--- | :--- | :--- |
| **GitHub Copilot** | $10 / $39 per month 【8】 | VS Code, Xcode | Yes (Copilot Agent Mode) 【9】 | GitHub Mobile App 【10】 |
| **Cursor** | $20 to $200 per month 【11】 | Cursor (VS Code Fork) | Yes (Composer) | Dedicated iOS App 【12】 |
| **Claude Code** | Included in Pro ($20+) | CLI / Terminal | Yes (Autonomous Agent) | iOS App Research Preview 【13】 |
| **Gemini in Android Studio** | Free / Paid API | Android Studio | Yes (Agent Mode) 【14】 | Integrated natively 【14】 |
| **JetBrains AI Assistant** | $10 per month 【15】 | IntelliJ, Android Studio | Yes (Junie Agent) | Web and Desktop support 【15】 |

---

## 11. Technique Selection: Socratic, Few-shot, CoT, or Maieutic

Not all daily tasks justify the same complexity in prompting. Choosing the right technique is a balance between requirement ambiguity and token budget:

![Infographic: When to use each prompting technique](/images/socratic-maieutic-prompting-mobile-cuando-en.svg)

*   **Zero-shot (1x Tokens)**: Best for direct tasks, syntax translation, or formatting where there is no ambiguity.
*   **Few-shot (2-5x Tokens)**: Ideal when the output must match a strict design pattern and you have codebase examples.
*   **Chain-of-Thought (1.5-3x Tokens)**: Required in models without native reasoning capabilities to break down logic step-by-step. *Note: In modern reasoning models like Gemini Thinking, this is redundant.*
*   **Socratic (2-4x Tokens)**: Mandatory when starting new features with vague requirements or complex mobile lifecycle dependencies.
*   **Maieutic (5-10x Tokens)**: Recommended for debugging complex concurrency races or conflicting design constraints.

---

## 12. Advanced Patterns for Mobile Programmers

### Pattern 1: The Living Specification
Attaching design documentation as permanent context. Forcing the model to evaluate it Socratically prevents outdated assumptions from making their way into your code.

```text
[Context: docs/architecture-rules.md]
Read the architecture rules before responding. Ask me about any contradictions between this task and the current architecture.
```

### Pattern 2: The Socratic Reviewer
Used in Pull Request reviews. Instead of asking for automatic fixes, force the model to critique its own code searching for platform-specific leaks.

```text
Act as a code reviewer obsessed with Android memory leaks. Analyze this diff and explain what happens to context retention during configuration changes.
```

---

## 13. Limitations and the Trust Crisis

Despite their logical reasoning advantages, Socratic and Maieutic prompting have limitations:

*   **Token Cost and Latency**: Requiring multiple conversation turns before getting final code increases API costs and execution time. It is not suitable for quick, real-time typing corrections.
*   **Domain Knowledge**: The quality of the questions depends on the model's training data. On proprietary SDKs or closed APIs, the model might hallucinate assumptions.
*   **Developer Diligence**: The developer must have enough seniority to determine if the model's questions are valid or nonsense.

---

## 14. The Horizon: Dialectical Agents and Formal Verification

The future of mobile development assistance lies in automating these workflows using multi-agent dialectical systems. Setups like Princeton's *SocraticAI* 【20】 show that agents in open debate solve optimization tasks more successfully than a single model.

The next step is integrating **formal verifiers** into the inference loop. This will allow Socratic agents to test generated code against actual compilers and linters in a sandbox, pruning invalid branches before presenting a Pull Request.

---

## 15. Conclusion & CTA

Socratic prompting is not just an instruction pattern: it is a **shift in the distribution of technical responsibility**. In direct prompting, the developer bears the burden of specifying context perfectly. In Socratic prompting, that burden is shared: the AI questions, the developer validates, and only then is the codebase generated.

For mobile developers seeking to escape the cycle of debugging "almost correct" AI code, this framework is the only way to guarantee stability and quality in Android and iOS.

---

## 16. References

*   【1】 Chang, E. Y. (2023). *Prompting Large Language Models With the Socratic Method*. IEEE Computing and Communication Workshop and Conference (CCWC), March 2023. https://arxiv.org/abs/2303.08769
*   【2】 Jung, J., Qin, L., Welleck, S., Brahman, F., Bhagavatula, C., Le Bras, R., & Choi, Y. (2022). *Maieutic Prompting: Logically Consistent Reasoning with Recursive Explanations*. EMNLP 2022. https://arxiv.org/abs/2205.11822
*   【3】 Emergent Mind. *Self-Ask: Zero-Shot Maieutic Prompting*. https://www.emergentmind.com/topics/self-ask-zero-shot-maieutic-prompting
*   【4】 Stack Overflow. (2025). *2025 Developer Survey — AI Section*. https://survey.stackoverflow.co/2025/ai
*   【5】 Rewire IT. (2024). *Socrates Was a Terrible Prompt Engineer (That's the Point)*. https://rewire.it/blog/socrates-was-a-terrible-prompt-engineer/
*   【6】 Paul, R. & Elder, L. *The Thinker's Guide to Socratic Questioning*. Foundation for Critical Thinking. https://www.criticalthinking.org/store/products/the-thinkers-guide-to-socratic-questioning/231
*   【7】 1000 Ventures. *Socratic Questions: Enhancing Your Critical Thinking Skills*. https://www.1000ventures.com/business_guide/crosscuttings/questions_socratic.html
*   【8】 GitHub. *Plans & Pricing — GitHub Copilot*. https://github.com/features/copilot/plans
*   【9】 GitHub Blog. (2025). *Copilot code review: Generally available in Xcode and new admin control*. August 27, 2025. https://github.blog/changelog/2025-08-27-copilot-code-review-generally-available-in-xcode-and-new-admin-control/
*   【10】 GitHub. *CopilotForXcode — AI coding assistant for Xcode*. https://github.com/github/CopilotForXcode
*   【11】 Cursor. *Pricing*. https://cursor.com/pricing
*   【12】 IT之家. (2025). *AI 编程工具 Cursor 推出 mobile application, mobile phone can control agent*. June 30, 2025. https://www.ithome.com/0/970/555.htm
*   【13】 9to5Mac. (2025). *Claude Code comes to iOS and web as research preview*. October 20, 2025. https://9to5mac.com/2025/10/20/claude-code-preview-ios-iphone/
*   【14】 Google Android Developers Blog. (2025). *Google I/O 2025: What's new in Android development tools*. May 20, 2025. https://android-developers.googleblog.com/2025/05/google-io-2025-whats-new-in-android-development-tools.html
*   【15】 JetBrains Blog. (2025). *AI Assistant Comes to Kotlin Developers in Android Studio*. March 2025. https://blog.jetbrains.com/ai/2025/03/ai-assistant-comes-to-kotlin-developers-in-android-studio/
*   【16】 Dechive. (2025). *Few-shot & CoT – Are These Techniques Still Effective in 2025?*. https://dechive.dev/en/archive/prompt-few-shot-cot
*   【17】 White, J. et al. *A Prompt Pattern Catalog to Enhance Prompt Engineering with ChatGPT*. https://www.dre.vanderbilt.edu/~schmidt/PDF/prompt-patterns-book-chapter.pdf
*   【18】 Chidambaram, S. et al. (2024). *Socratic Human Feedback (SoHF): Expert Steering Strategies for LLM Code Generation*. Amazon Science. https://assets.amazon.science/bf/d7/04e34cc14e11b03e798dfec53e5a/socratic-human-feedback-sohf-expert-steering-strategies-for-llm-code-generation.pdf
*   【19】 TechnoTalkative. (2025). *Which AI Coding Tool Actually Works for Mobile Developers?*. https://technotalkative.com/copilot-cursor-claude-code-ai-coding-tools-mobile-developers/
*   【20】 Princeton NLP. *SocraticAI — The Socratic Method for Self-Discovery in Large Language Models*. https://princeton-nlp.github.io/SocraticAI/
*   【21】 *SocraticLM: Exploring Socratic Personalized Teaching with Large Language Models*. NeurIPS 2024. https://neurips.cc/virtual/2024/poster/93477
