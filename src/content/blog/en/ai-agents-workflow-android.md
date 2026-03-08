---
title: "Asynchronous Pair Programming with Agents: Sentinel, Bolt, and Palette in Action"
description: "Real Android development cases where delegating to specialized agents beats any standard AI chat. Security, Performance, and UX."
pubDate: 2025-05-22
tags: ["AI", "Kotlin", "Workflow", "Use Cases", "Android"]
heroImage: "/images/placeholder-article-ai-workflow.svg"
reference_id: "0ce33761-8899-4d89-aff7-39579c3bca46"
---

You already have the [theory](/blog/ai-agents-android-theory) and you have the [configuration](/blog/configuring-ai-agents). Now let's see the magic in action. We are going to simulate real Android development scenarios and see how **Sentinel**, **Bolt**, and **Palette** solve problems that a generalist "chatbot" would likely ignore or solve poorly.

But before diving into the success stories, I want to take a **Building in Public** approach and share with you not just the pretty parts, but also the headaches, configuration errors, and real frustrations I've experienced implementing these agents in my projects over the last few months of 2026. Artificial Intelligence is not magic; it's a tool, and like any tool, you need to learn how to use it, sharpen it, and sometimes, cut yourself a bit to understand its limits.

## Building in Public: My Journey (and Stumbles) with Autonomous Agents

When I started integrating autonomous agents into my daily Android workflow, my expectation was naive: "I'll give the AI access to my repo, tell it to 'make the app faster,' and go grab a coffee." The reality was a direct hit to the ego.

The first attempt with **Sentinel** (my security agent) was a monumental disaster. I configured it with overly broad permissions in my CI/CD pipeline. The result? In its first autonomous run, Sentinel scanned my codebase, found a legacy Google Play Services dependency it deemed "vulnerable" (even though it was necessary to support Android 9), and unilaterally decided to remove it from my `build.gradle.kts`. This broke the production build for two hours while I was in a meeting, and I had to apply an emergency *hotfix*.

That's where I learned my first big *Building in Public* lesson: **Agents need strict boundaries and hyper-specific context.** They are not senior developers who understand the business decisions behind technical debt; they are execution machines that follow their *system prompts* to the letter.

With **Bolt** (my performance agent), the story was different but equally frustrating at the beginning. I asked it to optimize the memory usage of a messaging app I was developing. Bolt, in its zeal to shave off milliseconds of garbage collection, rewrote my entire Kotlin Flows-based architecture into traditional Java callbacks, arguing that coroutine instantiation had unacceptable overhead. Technically, it was right in a micro-benchmarking environment, but it ruined the readability of the project. I had to revert 45 commits and redefine its rules in the `AGENTS.md` file, explicitly specifying: *"Any performance optimization MUST respect idiomatic Kotlin usage and keep the Coroutines/Flows architecture intact."*

And finally **Palette** (my UI/UX agent). At first, Palette was a bit too "creative." I would give it a Figma design and ask it to create the *Composables*. Its code was functional, but it had a bad habit of hardcoding colors (`Color(0xFFE5E5E5)`) instead of using my `MaterialTheme.colorScheme`. I spent weeks fighting rejected PRs until I learned to feed it my design tokens as initial context in every prompt.

Today, these three agents are a fundamental part of my team. We understand each other. I provide precise context, and they execute deep analyses. I no longer expect magic; I expect computational rigor. And that is exactly what they are giving me. Let's see then, with this fine-tuned setup, how they behave in real-world cases.

## Case 1: Sentinel vs. The Insecure AndroidManifest 🛡️

**Scenario:** You have an application that requires uploading photos to a server. In the initial development phase, you added permissions "just in case" and fast network configurations to bypass local environment restrictions and focus on functionality. This is a classic sin we've all committed, and in a team without strict reviews, it can end up in the Play Store.

In a traditional workflow, you might ask a generalist AI like the old ChatGPT or early versions of Gemini: "Review my code for errors." Generally, they will tell you the syntax is correct and congratulate you on your indentation. But a specialized agent with deep security context and configured to act as a "Red Teamer" does something very different.

**Prompt to Sentinel Agent:**
> "Sentinel, assume the role of Security Auditor. Review the Android configuration files in the `/app/src/main/` directory focusing on network vulnerabilities, excessive permissions, and improper component exportation for an upcoming production release for version 1.2.0."

**Sentinel's Response (based on its Strict Security System Prompt):**

```markdown
**SECURITY ANALYSIS - SENTINEL v2.4 (Auditor Mode)**

I have scanned the specified directory. I have detected 3 vulnerabilities that violate our policies defined in `AGENTS.md` and Android 16 security guidelines.

**[CRITICAL] Cleartext Traffic Enabled**
*   **File:** `AndroidManifest.xml` (Line 14)
*   **Problem:** `android:usesCleartextTraffic="true"` detected in the `<application>` tag.
*   **Risk:** Allows unencrypted HTTP traffic. Any attacker on a public Wi-Fi network (Man-in-the-Middle attack) can intercept session tokens, credentials, or user data.
*   **Mandatory Solution:** Remove the attribute (the default is `false` since Android 9) or explicitly set it to `false`. If you require HTTP for local testing or debug, you must use a `network_security_config.xml` configured exclusively for the debug variant. Would you like me to generate this file for you?

**[HIGH] Excessive Storage Privileges**
*   **File:** `AndroidManifest.xml` (Lines 5 and 6)
*   **Problem:** `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` permissions requested without version conditionals.
*   **Risk:** Massive over-privileging. In Android 13+ (API 33+), these permissions are deprecated for media. In Android 14+ you can face direct rejections on Google Play if you don't justify the usage.
*   **Mandatory Solution:** Your app only needs photos. You must migrate to the Android **Photo Picker**, which requires no permissions. If you must maintain backward compatibility or direct access, you must use `READ_MEDIA_IMAGES` conditioned to `android:maxSdkVersion`.

**[MEDIUM] Open Attack Surface on Activities**
*   **File:** `AndroidManifest.xml` (Line 42)
*   **Problem:** Activity `DeepLinkHandlerActivity` explicitly exported (`android:exported="true"`) without restrictions or permissions.
*   **Risk:** Intent Spoofing Vulnerability. Any malicious application installed on the user's device can launch this activity, passing manipulated extras and potentially tricking the app into executing unauthorized actions.
*   **Mandatory Solution:** If this activity should only be launched by notifications or internal components, change to `android:exported="false"`. If it requires being launched externally, rigorously validate the Intent in the `onCreate` method or protect it with a `signature` level permission.
```

*The difference?* Sentinel doesn't just validate XML; it applies a real threat model. It acts proactively, not reactively.

## Case 2: Bolt vs. The Jank in the RecyclerView (and Compose LazyColumn) ⚡

**Scenario:** You have a complex list of items (products in a catalog) that stutters (jank) when scrolling. Whether you are using the trusty old `RecyclerView` or the modern `LazyColumn` in Jetpack Compose, you are dropping frames and the app feels heavy, especially on mid-to-low tier devices.

This is a scenario where chatbots fail miserably. If you tell them "my list is slow," they will give you a generic list of 10 Google Developers tips from four years ago. But Bolt, having access to your entire source code and profiling tools (if provided in its pipeline), looks for micro-optimizations that destroy rendering loop performance.

**Prompt to Bolt Agent:**
> "Bolt, the `ProductCatalogList` is reporting 15% dropped frames in Firebase Performance logs. Analyze the item rendering code and propose micro-architecture level optimizations. The goal is to maintain a constant 60fps."

**Bolt's Response (after cloning and analyzing the repository):**

```markdown
**PERFORMANCE ANALYSIS - BOLT v1.8 (Rendering Optimization Mode)**

I have analyzed the `ProductItem.kt` file and identified multiple causes of "GC Churn" (rapid allocation and garbage collection) and unnecessary recompositions.

**Problem 1: Object Allocation in Rendering Cycles (Critical)**
In your `LazyColumn`, inside the content block of each item, you are doing this:

```kotlin
val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
val displayDate = item.creationDate.format(formatter)
```

**Impact:** `DateTimeFormatter.ofPattern()` is extremely expensive to initialize. By placing it inside the scope of each item's Composable, you are forcing the JVM to instantiate this object hundreds of times per second during fast scrolling. This quickly fills up memory (Heap), triggering the Garbage Collector, which pauses the main execution thread and causes the dreaded *jank*.

**Solution Implemented by Bolt (PR #142):**
I have moved the initialization to a static level or at least outside the composition phase.

```kotlin
// Outside the Composable, as a top-level static constant
private val DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")

@Composable
fun ProductItem(item: Product) {
    // ...
    // Only the format method is called, using the in-memory singleton
    val displayDate = remember(item.creationDate) { item.creationDate.format(DATE_FORMATTER) }
    // ...
}
```

**Problem 2: Model Instability in Compose (High)**
I have detected that your data class `Product` contains a `List<String>` for categories:
`data class Product(val id: String, val categories: List<String>)`

**Impact:** In Jetpack Compose, `List` (the standard Kotlin interface) is considered "Unstable" because the compiler cannot guarantee that its contents will not change by mutating the original list underneath. As a result, Compose cannot Skip the recomposition of the list items even if the data hasn't changed, destroying the performance of the `LazyColumn`.

**Solution Implemented by Bolt (PR #142):**
I have modified the data model to use `ImmutableList` from the `kotlinx.collections.immutable` library.

```kotlin
import kotlinx.collections.immutable.ImmutableList
import kotlinx.collections.immutable.toImmutableList

// Compose now considers this parameter "Stable"
data class Product(val id: String, val categories: ImmutableList<String>)
```
```

*The difference?* Bolt understands how the Android virtual machine and the Compose compiler work on an intimate level.

## Case 3: Palette vs. The "Invisible" Button and Forgotten Accessibility 🎨

**Scenario:** You have created a beautiful custom component in Jetpack Compose. Visually it's perfect, fits the design and color palette. But when you push it to a testing environment, QA and beta users complain that "the button doesn't work" or "it's really hard to hit." Also, you haven't thought about TalkBack.

**Prompt to Palette Agent:**
> "Palette, review the components in `ui/components/buttons/`. Our QA report indicates touch usability issues and warnings in the accessibility scanner. Adapt the components to Material Design 3 standards."

**Palette's Response:**

```markdown
**UX/UI AND ACCESSIBILITY REVIEW - PALETTE v3.0**

I have reviewed your `CustomActionButton.kt`. Visually it complies with the design tokens in `AGENTS.md`, but it presents severe structural deficiencies in terms of human interaction and accessibility.

**Structural Observation:**
Your `Icon` has a defined size of 24.dp and the wrapping `Box` that handles the click event is tightly wrapped to the content using `wrapContentSize`.

**1. Touch Target Issue:**
The actual interactive area is exactly 24x24dp. Android and Material Design 3 accessibility guidelines strictly require a minimum touch target size of **48x48dp** for any interactive element. Users with small devices, large fingers, or motor impairments will have immense difficulty interacting with this button, leading to the reported frustration ("hard to hit").

**2. Semantics Issue (TalkBack):**
The button uses the standard `clickable` modifier without providing additional semantics, and the `Icon` has its `contentDescription` set to `null`. A visually impaired user using TalkBack will only hear "Button, double tap to activate" with no idea what the button does.

**Refactored Solution:**

```kotlin
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

@Composable
fun CustomActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            // 1. We internally expand the touch area without affecting visual design
            .minimumInteractiveComponentSize()
            .clickable(
                onClick = onClick,
                // 2. Explicitly define the role for accessibility services
                role = Role.Button
            )
            // 3. Add clear description for TalkBack
            .semantics {
                contentDescription = "Add a new product to the shopping cart"
            },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Default.AddShoppingCart,
            contentDescription = null, // Description is already on the container
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp) // Visual size remains 24dp
        )
    }
}
```
```

Palette doesn't just fix code; it teaches about digital empathy and standards compliance that we often overlook in the rush of a sprint.

## Case 4: Legacy Architecture Refactoring with Sentinel and Bolt Teaming Up 🔄

**Scenario:** You have a 5-year-old project. At the core of the application lies a monolith named `UserManager.java`, a 3500-line singleton full of business logic, database calls on poorly managed background threads, and extreme coupling. Touching this file is terrifying. You want to migrate it to Kotlin and apply Clean Architecture (separating into a Repository and a Use Case), but doing it manually would take weeks of risk and interruptions.

This is where agent workflows truly shine. In my "Building in Public" experience, I discovered that orchestrating agents is the real superpower.

**Orchestrator Prompt:**
> "Bolt, Sentinel: We need to dismantle `UserManager.java`. Bolt, I want you to analyze the file's dependencies and extract the data fetching logic into a `UserRepository.kt` using Coroutines. Sentinel, while Bolt does this, make sure that none of the authentication or token handling logic that gets moved introduces memory exposure vulnerabilities."

The result of this asynchronous operation is amazing to witness in a PR:

1.  **Phase 1 (Analysis):** The agents read the file and build an internal dependency graph. Bolt identifies that `UserManager` talks to Retrofit and Room simultaneously.
2.  **Phase 2 (Bolt's Refactoring):** Bolt generates a `UserRepository` interface, creates the `UserRepositoryImpl` implementation injecting dependencies via Hilt/Dagger, and wraps asynchronous calls in `suspend functions` with `withContext(Dispatchers.IO)`. All in idiomatic Kotlin.
3.  **Phase 3 (Sentinel's Audit):** Sentinel reviews Bolt's PR before it even reaches me. It detects that when migrating to Kotlin, a sensitive token ended up in a `data class` which, by default, implements a `toString()` method that exposes all its fields. Sentinel injects an additional commit on top of Bolt's, overriding the `toString()` to obfuscate the token: `override fun toString() = "UserToken(token=***)"`.

I, as a senior developer, open GitHub the next morning, review the combined Pull Request from my two agents, verify the tests pass, and click *Merge*. What used to be a monthly headache is now a morning review task.

## Case 5: The Safety Net of Automated Tests 🧪

**Scenario:** The business team requests a critical new feature (a new payment flow) for Friday. You develop it, it works perfectly, but you haven't had time to write a single unit test. Pushing code to production without tests is like driving blindfolded at 200 km/h.

This is where the "Slave Mode" of agents comes in (and I say this with the utmost respect for AI). Creating exhaustive unit tests is time-consuming and often repetitive.

**Prompt to General Testing Agent:**
> "Agent, read the new `PaymentProcessorUseCase.kt` file. Use JUnit5 and MockK. Generate a unit test suite that covers 100% of the logical paths of this class: success, network failure, insufficient balance, and server deserialization errors. Use descriptive function names according to our GIVEN-WHEN-THEN standard defined in `AGENTS.md`."

The agent analyzes the use case and in minutes generates hundreds of lines of testing code. It sets up the mocks (`mockk<PaymentRepository>()`), defines the fake responses (`coEvery { repo.process(any()) } returns Result.success()`), and establishes the precise assertions (`coVerify(exactly = 1) { analytics.track("payment_success") }`).

Again, I don't trust blindly. I review the generated tests. Sometimes the agent hallucinates a path that doesn't exist or assumes an incorrect mock. I correct a couple of assertions, run `pnpm test` or `./gradlew test` and voilà. 100% coverage in 15 minutes instead of 4 hours.

## Recurring Tasks: How to set up a "Cron Job" for your Jules Agent (Gemini) ⏰

Until now we've talked about interacting with agents on demand: "Do this now." But the true power of automation arrives when your agent works autonomously and recurrently while you sleep. I call this "Preventive Code Maintenance."

In 2026, Google's autonomous coding agent for the Gemini ecosystem is called **Jules**. Jules operates asynchronously: it clones your repository into a secure virtual machine (VM) in the cloud, installs dependencies, does the work, and sends you a Pull Request.

Although Jules has a web interface, the real magic happens in the terminal using **Jules Tools** (the Jules CLI) integrated with the Gemini extension.

To configure Jules to act as a tireless employee that reviews your code every weekend recurrently (an AI Cron Job), this is the actual workflow I've implemented in my repositories:

### Step 1: Tool Installation

First, you need to install the Jules extension for the Gemini CLI, or the standalone Jules Tools. According to the latest updates from Google Developers, you can do this in your terminal:

```bash
# Option A: Via npm (Standalone Jules Tools)
npm install -g @google/jules

# Option B: As a Gemini CLI extension
gemini extensions install https://github.com/gemini-cli-extensions/jules --auto-update
```

Make sure you have connected your GitHub repository to your account at `jules.google.com`.

### Step 2: Creating the Task Script

Jules Tools allows creating remote sessions via the command line. Let's create a simple bash script called `jules_weekend_audit.sh` on our CI server or local machine:

```bash
#!/bin/bash
# jules_weekend_audit.sh

# Ensure we are in the right directory
cd /path/to/my/android/repo

echo "Starting weekend audit with Jules..."

# Command for Jules Tools (npm)
jules remote new --repo my-user/my-android-repo --session "Review all dependencies in the build.gradle.kts files. If there are minor or patch updates available, update them. Additionally, run a deep linting analysis and fix any warnings about deprecated code. Run the tests, and if everything passes, create a PR with the title '[Jules] Weekend Audit'."

echo "Task successfully sent to Jules VM."
```

### Step 3: Configuring the Cron Job (Linux/macOS)

Now, we just have to tell our operating system (or GitHub Actions server) to run this script periodically. If you use a Unix-based system, open the cron editor:

```bash
crontab -e
```

And add the following line to run it **every Friday at 11:00 PM**:

```cron
0 23 * * 5 /bin/bash /absolute/path/to/your/script/jules_weekend_audit.sh >> /var/log/jules_cron.log 2>&1
```

### Modern Alternative: Using GitHub Actions as "Cron"

If you don't want to rely on a local machine, the best *Building in Public* practice is to use GitHub Actions to trigger Jules. Create a file in your repository: `.github/workflows/jules-cron.yml`:

```yaml
name: Jules Weekly Audit
on:
  schedule:
    # Runs at 00:00 every Saturday
    - cron: "0 0 * * 6"
  workflow_dispatch: # Allows manual execution

jobs:
  jules_audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install Jules
        run: npm install -g @google/jules

      - name: Trigger Jules Agent
        env:
          JULES_API_KEY: ${{ secrets.JULES_API_KEY }}
        run: |
          jules remote new --repo ${{ github.repository }}           --session "Weekend dependency audit and minor refactoring. Update libraries and fix warnings. Generate a PR."
```

With this configuration, every Monday morning I arrive at the office, open GitHub, and Jules (powered by Gemini 3) has left me a clean, tested PR ready to review, with all the tedious dependency updates and minor cleanups already resolved. That is true asynchronous delegation.

## Final Conclusion: The Augmented Engineer Mindset

Integrating AI agents like **Sentinel**, **Bolt**, **Palette** and automating with **Jules** does not mean the role of the Android developer is going to disappear. On the contrary. Our role is mutating.

We are no longer simply "code writers" who translate business requirements into Kotlin. We are becoming **Orchestra Conductors** or **Augmented Systems Engineers**.

These agents act as a team of tireless junior specialists. They never get bored, they always remember obscure security rules, they are obsessed with frames per second, and they know WCAG accessibility by heart. But they lack business context, they don't understand why sometimes "ugly code" is preferable if it allows hitting the market on time, and they have no real empathy for the end user.

That is your job. Your job is to define the general architecture, ensure product quality, understand business needs, and now, direct your agents with surgical precision.

Building in public and showing these workflows has taught me that the future is not AI replacing programmers. The future is developers who use AI overwhelmingly outperforming developers who refuse to use it. Start today. Create your `agents/` folder, define your `AGENTS.md`, set up your first Cron Job with Jules, and start leading your own artificial intelligence team.
