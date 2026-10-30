---
title: "ODD for Android: Kotlin tests and a practical lab"
description: "Apply ODD to a fictional Android app: build a Kotlin streak reducer, run five JVM checks and plan honest Room and Compose verification without fake results."
pubDate: 2026-10-30
lastmod: 2026-10-30
author: "ArceApps"
keywords: ["ODD", "Organic Driven Development", "Android", "Kotlin", "JUnit", "Room", "Jetpack Compose"]
canonical: "https://arceapps.com/blog/odd-android-kotlin-lab/"
heroImage: "/images/odd-android-kotlin-lab.webp"
tags: ["ODD", "Android", "Kotlin", "Testing", "Jetpack Compose", "Room"]
reference_id: "d7fab46b-e6d7-437e-94ea-402aacd1dd7c"
---

> **A teaching laboratory, not a shipped Android application.** The hypothetical app «Compass» and its project repository do not exist. The cover is an AI-generated conceptual illustration, not a screenshot from an existing app. The pure Kotlin component below **was compiled and executed in isolation** using Kotlin/JVM 1.9.0 and Java 21. The JUnit, Compose, Room and Android build examples describe checks to integrate into a real app; they are **not reported as executed**. Read [ODD versus SDD](/blog/odd-vs-sdd-organic-development/) first if you want the theory, or revisit [AI and TDD for Android](/blog/ia-tdd-android/) and [the SDD/TDD acceptance loop](/blog/sdd-tdd-acceptance-loop/) for context.

## A fictional Android app as an ODD laboratory

Picture a tiny habit-tracking application called **Compass**. Its main screen presents one card per habit, the current date, a count of consecutive completion days and a button to mark a habit done. There are no accounts, no backend, no advertising and no synchronization between devices. The goal is not to pitch a made-up product. It is to watch what happens when Organic Driven Development adjusts process to a concrete engineering request.

The apparent requirement is simple: tap «Complete today» and increment the streak. But even this small interaction raises familiar Android questions. What if the user taps twice? What if an Activity is recreated? What if the application is killed and reopened? What if the user skips a day, changes time zones or moves the device clock backwards? Can the action be applied while offline? A small feature can hide quite a lot of product meaning.

We will keep the example honest by dividing it into three layers. First is a **pure Kotlin domain function** that accepts a previous state and a day and returns an explicit result. We can compile and check that layer without an Android SDK. Second is a persistence boundary, for example Room, whose contract and proposed tests need a real project. Third is a Jetpack Compose interface, whose instrumented checks require a configured Android environment.

ODD does not mandate a particular architecture or Kotlin idiom. Its contribution is deciding when to inspect, when to document, when to ask for an unresolved product rule, and how to report the evidence behind a change. We are following the [Gentle-AI ODD protocol](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md): authorize, explore, resolve uncertainty, classify, track when needed, implement and close.

Every date in this laboratory is chosen to make a check reproducible. None is a production usage statistic. We will not claim that an illustrative Composable passed UI tests, nor that a proposed Room entity establishes crash-safe durability. The useful result of the article is a combination of executable domain behavior and a clear map of the evidence still needed.

## The first request and a surprisingly important uncertainty

Our fictional user says: «When I tap Complete today, increase the streak, but repeating the tap must not count twice. If I miss a day, the next streak starts at one». This is an implementation request, so ODD's authorization check succeeds. Had the user asked for options or an explanation, the same exploration should have remained read-only.

The next step would normally inspect an actual repository. Here none exists, so we must be explicit: the suggested structure is **hypothetical**, not something we discovered by looking at real source files. Imagine a domain folder for the rule, a data adapter for persistence and Compose UI code in the app module. These can live in one Gradle module. There is no reason to create multiple modules, generic repositories or a dependency injection framework solely to make a small demonstration look architecturally impressive.

Before coding, one real ambiguity emerges: what counts as «today»? It could be UTC, device-local time, the user's preferred time zone or the server's date. Because this is a strictly local app, we deliberately choose **the device-local date at the moment the operation begins**. The domain layer receives a resolved LocalDate; it does not read the clock itself. Tests can therefore describe precise days without changing the test machine's timezone.

A second decision concerns attempts to complete an earlier date than the last recorded day. In this exercise, the operation is rejected without changing state. We will not retroactively reconstruct a streak. That is a product choice for the imaginary app, not a universal behavior imposed by ODD. A real habit tracker might allow editing historical completions, and it would need a different data model.

Does the task require durable planning? Once those rules are agreed, the pure calculation is small, reversible and recoverable from the request and diff. ODD would normally keep it lightweight. However, the requirement to survive process death introduces storage and concurrency. Those decisions will not necessarily be recoverable from a tiny code diff, so we will treat persistence as a substantial follow-up with its own feature record.

## The lightweight path: a pure Kotlin reducer

The domain function deliberately has no dependency on Context, Room, ViewModel or coroutines. It receives a previous progress value and a LocalDate, then returns one of three meaningful results. A newly recorded completion updates the date and streak. A repeated completion does nothing. An attempt to move backwards returns an explicit rejection.

~~~kotlin
import java.time.LocalDate

data class HabitProgress(
    val lastCompletedDay: LocalDate? = null,
    val streak: Int = 0,
)

sealed interface CompletionResult {
    data class Recorded(val progress: HabitProgress) : CompletionResult
    data class AlreadyRecorded(val progress: HabitProgress) : CompletionResult
    data class RejectedPastDay(val progress: HabitProgress) : CompletionResult
}

object HabitStreak {
    fun record(progress: HabitProgress, day: LocalDate): CompletionResult {
        val last = progress.lastCompletedDay
        if (last == day) return CompletionResult.AlreadyRecorded(progress)
        if (last != null && day.isBefore(last)) {
            return CompletionResult.RejectedPastDay(progress)
        }
        val nextStreak = if (last != null && last.plusDays(1) == day) {
            progress.streak + 1
        } else {
            1
        }
        return CompletionResult.Recorded(
            progress.copy(lastCompletedDay = day, streak = nextStreak)
        )
    }
}
~~~

A sealed result is useful not because it is a fashionable Kotlin construct, but because it distinguishes why state did not change. The UI can present a suitable message, the caller can decide whether another attempt makes sense, and tests can assert an observable outcome. A boolean result would obscure whether the date was repeated or rejected for moving backwards.

This example intentionally assumes that the incoming state is valid: streak is not negative, the stored date corresponds to the persisted history and the caller passes a real LocalDate. A production data boundary should validate those invariants or make the domain model enforce them. That does not turn this function into a complete safeguard against corrupted storage or concurrent writes.

There is also an Android-specific compatibility consideration. LocalDate comes from java.time. If the app targets Android versions below API 26, review core library desugaring and the project's actual minSdk rather than assuming the code works on every device by default. This example compiles as JVM code, but that alone cannot settle Android compatibility.

Notice the restraint: we have no abstract base class, event bus, remote data source or speculative caching layer. We have a rule with clear inputs and outputs. ODD encourages this kind of focused implementation when the requirement and failure surface are understood. It does not demand unnecessary infrastructure to satisfy a methodology.

## Five rules expressed as checks

Before declaring the reducer complete, we need tests that describe the contract. The dates below are arbitrary examples selected to make the gap between consecutive and skipped days unambiguous.

| Scenario | Previous state | Operation | Expected outcome |
| --- | --- | --- | --- |
| First completion | No date, streak 0 | Complete Oct 27 | Streak 1, last day Oct 27 |
| Repeated completion | Oct 27, streak 1 | Complete Oct 27 | No change; AlreadyRecorded |
| Consecutive day | Oct 27, streak 1 | Complete Oct 28 | Streak 2 |
| Skipped day | Oct 27, streak 1 | Complete Oct 30 | Streak 1 |
| Earlier date | Oct 28, streak 2 | Complete Oct 27 | No change; RejectedPastDay |

A typical Android project can run these as local JVM unit tests using JUnit 4. The following class is **prepared sample code**. It has not been run through a project's Gradle JUnit task in this laboratory.

~~~kotlin
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HabitStreakTest {
    private val day1 = LocalDate.parse("2026-10-27")
    private val day2 = LocalDate.parse("2026-10-28")
    private val day4 = LocalDate.parse("2026-10-30")

    @Test fun firstCompletionStartsAtOne() {
        val result = HabitStreak.record(HabitProgress(), day1)
        assertEquals(1, (result as CompletionResult.Recorded).progress.streak)
    }

    @Test fun repeatedDayDoesNotIncrement() {
        val first = CompletionResult.Recorded(HabitProgress(day1, 1))
        val result = HabitStreak.record(first.progress, day1)
        assertEquals(first.progress,
            (result as CompletionResult.AlreadyRecorded).progress)
    }

    @Test fun consecutiveDayIncrements() {
        val result = HabitStreak.record(HabitProgress(day1, 1), day2)
        assertEquals(2, (result as CompletionResult.Recorded).progress.streak)
    }

    @Test fun skippedDayResets() {
        val result = HabitStreak.record(HabitProgress(day1, 5), day4)
        assertEquals(1, (result as CompletionResult.Recorded).progress.streak)
    }

    @Test fun pastDayIsRejected() {
        val old = HabitProgress(day2, 2)
        val result = HabitStreak.record(old, day1)
        assertEquals(old, (result as CompletionResult.RejectedPastDay).progress)
        assertTrue(result is CompletionResult.RejectedPastDay)
    }
}
~~~

The skipped-day test starts with a streak of five on purpose. If the algorithm accidentally reused the previous value when a gap occurs, the incorrect result would be more obvious. In the repeat and backwards cases, asserting that the returned state equals the original is stronger than merely observing a result class name.

Strict Test-Driven Development would begin with a failing test, implement the minimum necessary behavior, then refactor under passing tests. This is a good workflow for a deterministic rule. We are not claiming to have captured a JUnit RED-GREEN-REFACTOR history here. We are showing what the acceptance tests should express and separately validating the underlying function.

For an actual observed check, I compiled the identical reducer with Kotlin/JVM 1.9.0 on JRE 21, together with a small Check.kt harness containing five equivalent assertions using Kotlin's built-in check() function. The commands were:

~~~bash
kotlinc HabitStreak.kt Check.kt -include-runtime -d check.jar
java -jar check.jar
~~~

The **observed output** was:

~~~text
PASS: first, repeated, consecutive, skipped and past-day checks
~~~

That result supports a narrow but real claim: the isolated algorithm compiles and produces the expected five behaviors under the checked JVM environment. It does not establish Android Gradle build success, Room persistence, process restart survival, Compose rendering or correctness under concurrent writes. Any responsible agent closing this task should make exactly that distinction.

![The Android example separates executed domain checks from proposed integration checks](/images/odd-android-checks-en.svg)

*Original diagram of the laboratory's three verification layers. Only the pure Kotlin/JVM checks were observed in this exercise; persistence and UI checks remain to be executed in a real Android project.*

## A second request changes the risk profile

The fictional user adds: «Keep the streak after the app closes, including while offline, and do not record a double tap as two operations». The pure reducer still matters, but it no longer covers the full contract. We now need persistent state and a write path that remains consistent when operations overlap.

Consider two UI events arriving close together. Event A reads yesterday's streak and begins calculating the next value. Before it saves, event B reads the same previous value. Both can produce an identical next streak and write it. A single final counter may look correct, yet an append-only completion log could contain duplicates, or another side effect might run twice. Unit tests of the reducer do not exercise those failure modes.

This is where ODD's classification becomes useful. A future session cannot infer the intended uniqueness key, transaction policy and timezone semantics from a handful of changed lines. The task is substantial because its intent is not safely recoverable from the request and diff alone. It deserves a durable document with requirements and checks before the first storage modification.

The tempting alternative is to overbuild. An agent might introduce Retrofit for a backend that does not exist, generic domain abstractions, reactive adapters and multiple Gradle modules. Nothing in the request requires those. Offline operation can be implemented locally using the project's existing storage system. If Room is already in use, extending it carefully is preferable to inventing a second persistence mechanism.

The opposite temptation is worse: treating a unique key in an illustrative entity as proof that the whole operation is atomic. The storage implementation still needs an explicit conflict strategy, transactional boundaries and tests that examine persisted effects. Naming a good design pattern does not mean that the pattern was correctly implemented.

## A feature record worth keeping

The Gentle-AI ODD convention uses one document with Specs, Tasks and Log sections. Specs preserve exact user strings and observable acceptance conditions. Tasks link stable work units to those specs. The log records the original request, changes, rationale and evidence. This is a simplified imaginary record, not a file taken from an existing Android repository.

~~~markdown
# Feature: persistent habit streaks without duplicates

## Specs
S1. "The streak is unchanged when I reopen the app."
Acceptance: write one completion, recreate the repository,
and read the same last day and streak.

S2. "A repeated tap does not count twice."
Acceptance: two attempts for the same habit and day
leave one persisted completion.

S3. "It works offline."
Acceptance: save with networking disabled and recover
the local state after the process restarts.

S4. The device-local date is captured once per operation.
Acceptance: the same operation never changes its day
between the read and the write.

## Tasks
T1 -> S1/S3: persistence adapter and reopen test.
T2 -> S2: unique constraint and repeated-attempt test.
T3 -> S4: injected clock and day-boundary test.
T4 -> S1/S2/S3/S4: UI checks and final diff review.

## Log
L1. Original request and authorized scope.
L2. Decision: device-local day; no server or cloud sync.
L3. Pending: Android integration and migration checks.
~~~

This document is valuable because it preserves decisions that are not obvious from code. Why use the local date? Why is there no server synchronization? Why must the date be captured once rather than called repeatedly during a write? If the developer revisits the issue later, those answers stop the agent from accidentally broadening scope or undoing an established rule.

Acceptance statements are about outcomes rather than class names. If the app already has a transaction helper, a good agent should reuse it. If an earlier version stores completions differently, the implementation must adapt to that schema. ODD is not a license to impose a template on an existing codebase. Exploration remains the first step.

T1 deserves a test that writes, closes or recreates the relevant persistence components, and reads the result back. T2 deserves repeated and concurrent operations, with the number of persisted completion records as the observable result. T3 deserves a controlled Clock and ZoneId; tests around midnight should not depend on the wall clock of the machine running CI.

Timezones are still a real product decision. Traveling across zones can make an apparent calendar day behave differently than the developer expected. A local-only habit tracker may reasonably adopt device-local dates, but a synchronized app needs to define ownership and reconciliation of those days. An agent should not invent cross-device policy simply to make a demonstration seem more complete.

If persistence uses suspending functions, the [official Android coroutine testing guide](https://developer.android.com/kotlin/coroutines/test) explains runTest and TestDispatcher for controlled scheduling. That solves a testing concern, not the atomicity of a database transaction. Both need attention when their respective behaviors are part of the contract.

## A Room design sketch—and the evidence it still needs

One possible storage model is a completion row keyed by habit and local day. That gives the database an opportunity to reject duplicate completions for the same pair. Dates can be stored in a stable ISO representation, with conversion centralized at the repository boundary. A separate materialized streak would introduce additional consistency requirements; calculating it from the completion history is another design option worth evaluating against actual product needs.

The following Room entity illustrates the uniqueness rule:

~~~kotlin
import androidx.room.Entity

@Entity(
    tableName = "habit_completions",
    primaryKeys = ["habitId", "localDay"]
)
data class HabitCompletionEntity(
    val habitId: String,
    val localDay: String, // ISO-8601: yyyy-MM-dd
)
~~~

This is **not a full verified Room implementation**. It does not include DAO code, conflict policy, a completed repository transaction, schema migration or instrumentation results. A primary key is useful, but it does not by itself define how callers handle a conflict or how any derived streak gets updated consistently.

The first integration check should insert the same habit/day twice and assert that only one completion is persisted. The next should issue overlapping operations and assert the state of both the completion table and any derived model. Another should rebuild the storage access layer after the write and confirm that it still reads the same value. These are tests of persisted behavior, not merely of a mocked DAO.

If the hypothetical app had previous installations, migrations would become a separate acceptance criterion. The [Android Developers Room testing documentation](https://developer.android.com/training/data-storage/room/testing-db) emphasizes testing migrations because schema mistakes can break access to user data. A test that starts from an empty new database is insufficient. We need representative fixtures of historical schemas and verification of the upgraded records.

There is an architectural boundary worth keeping even in a single-module app. The UI should send a completion intent to the repository through its state holder; it should not compute streaks by mutating a local Compose value. A recreation of the Activity should observe persisted data rather than trigger a new completion merely because recomposition occurred. That separation is about predictable behavior, not architectural fashion.

## Compose tests are a separate kind of evidence

For the UI, imagine a simple state carrying the habit name, streak and whether the current day has already been completed. The button is disabled when the habit is already complete. The Composable does not need to know how the date was stored, how Room handles conflicts or whether a test runner has network access.

~~~kotlin
data class HabitUiState(
    val name: String,
    val streak: Int,
    val completedToday: Boolean,
)

@Composable
fun HabitCard(state: HabitUiState, onComplete: () -> Unit) {
    Column {
        Text(state.name)
        Text("Streak: " + state.streak)
        Button(
            onClick = onComplete,
            enabled = !state.completedToday,
            modifier = Modifier.testTag("complete-button"),
        ) {
            Text("Complete today")
        }
    }
}
~~~

This is an illustrative fragment requiring the appropriate Compose and Material imports. A production application should move display strings to localized resources, handle plural forms and account for accessibility. We are deliberately keeping the example focused on state flow rather than presenting a polished UI that supposedly exists.

A proposed instrumented test would assert the disabled state for a completed habit:

~~~kotlin
@get:Rule
val composeRule = createComposeRule()

@Test
fun completedHabitDisablesAction() {
    composeRule.setContent {
        HabitCard(
            state = HabitUiState("Read", 4, completedToday = true),
            onComplete = {},
        )
    }
    composeRule.onNodeWithTag("complete-button").assertIsNotEnabled()
}
~~~

The [official Compose testing guide](https://developer.android.com/develop/ui/compose/testing) describes test rules, semantics and synchronization. This code requires a configured Android project and test environment; it was **not executed** in this exercise. Even after execution, the assertion would establish only a UI property. It would not prove that the underlying database rejects duplicate writes.

Manual verification has its place too. We would inspect narrow screens, large font scales, rotation, theme changes and translations. If the application presents errors when a past day is rejected, those messages need correct semantics and localization. ODD should route each concern to the smallest meaningful check rather than relying on a single build command as universal proof.

## How the ODD close-out should read

Imagine we are closing the domain work unit. The precise report is: the immutable Kotlin state reducer has been implemented, compiled with Kotlin/JVM 1.9.0, and checked against five scenarios. The observed executable reports success for first completion, duplicate day, consecutive day, skipped day and backwards day. The JUnit example has not run through Gradle, and no Android APK has been built.

Now consider closing the persistence feature. We cannot honestly mark it done. The Room example shows a possible schema constraint but contains no complete transaction. Persistence across process restart, concurrent operations, historical migrations and Compose behavior all remain to be verified in a real project. A useful close-out lists those gaps rather than hiding them under a high confidence score.

This is central to the Gentle-AI protocol: the final message reports observed checks and pending checks, and distinguishes the candidate change from its delivery approval. A checked task does not authorize merging. A unit test that passes does not authorize publishing sensitive repository content. An AI agent can automate the work it has been permitted to do without silently expanding that permission.

In a real repository, I would first inspect which checks GitHub Actions already runs. If CI reliably builds Android, executes unit tests or captures screen states, the sensible approach is to observe those results rather than rerun every command merely for ceremony. Manual review can focus on product behavior, visual quality and release constraints that CI does not fully cover.

Git history should support the same philosophy. A domain change and its regression tests can form a coherent work-unit commit. Persistence and migration behavior can form another when its acceptance checks are met. Splitting an atomic change just to reach a line-count heuristic is counterproductive. Conversely, merging a massive speculative architecture into one unreviewable commit undermines the benefit of controlled work units.

## What this exercise actually teaches

The first lesson is that ODD does not replace Android engineering. A pure function is valuable whether an agent wrote it or not. A database uniqueness rule remains a database responsibility. A migration test remains necessary when historical user data is at risk. The methodology's job is to help decide which tools and records a task merits without forcing every small fix through a formal sequence.

The second lesson is that classification is revisable. A simple streak rule may remain small, but adding persistence and overlapping writes creates a feature whose design choices need to survive the session. ODD's purpose is not to label a task once and defend that label. It is to update tracking when uncertainty or consequences become more substantial.

The third is that tests communicate product intent. Five short scenarios explain the streak policy more clearly than a paragraph promising «proper habit tracking». They specify exactly what happens when a completion is repeated, when a day is consecutive and when a day is skipped. That clarity makes the implementation smaller, rather than larger.

The fourth is that evidence has levels. A JVM compilation is not an Android build. A prepared JUnit class is not a passed test. A Room entity is not a durability proof. A disabled Compose button is not proof that the database is idempotent. Treating each result according to the actual check performed is a habit worth cultivating in every AI-assisted workflow.

The fifth is that persistent documentation should preserve knowledge, not duplicate it. The pure reducer can be understood through its request, tests and diff. The storage feature needs to remember the chosen definition of day, unique key semantics, concurrency strategy and pending integration checks. A single compact feature record can carry those decisions without creating a sprawling specification bureaucracy.

The sixth is that human ownership does not disappear. If the fictional user later wants to edit past completions, synchronize devices or reconstruct streaks after timezone changes, the current model is not enough. An agent should surface the changed requirements, offer the simplest consistent alternatives and wait only for genuine product decisions. It should not add a synchronization engine because it can imagine one.

## A practical roadmap for a real Android implementation

If I were turning this into an actual small Android app, I would begin by creating or inspecting the existing Kotlin/Compose project. I would integrate the pure HabitProgress, CompletionResult and HabitStreak model, configure the project's unit test runner, then execute the JUnit cases. Any failing acceptance test would lead to a focused correction before broader development.

For persistence, I would add a feature record before the first write. I would inspect the storage already present and build on it rather than create parallel infrastructure. The write path would define its uniqueness behavior and transaction boundary. Integration checks would cover repeated attempts, overlapping operations, reopening the storage layer and, where necessary, migration from previous schema versions.

The UI would observe the repository state through its state holder and send completion commands only on user action, never as a side effect of recomposition. UI checks would verify enabled and disabled states. Manual inspection would cover accessibility, locale, large text, theme and screen size. A final diff review would look for redundant abstractions, stale code, unexpected dependencies and private data.

I would merge only after the repository's relevant automated checks passed and the remaining manual acceptance work was complete. If a test runner was unavailable, I would report it as a blocker or a pending check rather than label the feature done. Nothing in ODD overrides existing rules about permissions, branching, publication or user data.

This roadmap does not require ten new documents. It asks whether the next session can resume confidently and whether each requirement has evidence matching its risk. The method should disappear into normal engineering habits once those questions have reliable answers.

## References and related material

- [Gentle-AI, primary ODD documentation](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md): proportional classification, tracking, work units and accurate closure. The main branch may include unreleased changes.
- [Gentle-AI repository](https://github.com/Gentleman-Programming/gentle-ai): project context and source.
- [Android Developers, testing coroutines](https://developer.android.com/kotlin/coroutines/test): runTest, test dispatchers and controlled scheduling.
- [Android Developers, Compose testing](https://developer.android.com/develop/ui/compose/testing): test rules, semantics and assertions.
- [Android Developers, Room database testing](https://developer.android.com/training/data-storage/room/testing-db): storage behavior and migrations.
- [Android Developers, app architecture guide](https://developer.android.com/topic/architecture): state management and separation of concerns.
- [ArceApps, ODD versus SDD](/blog/odd-vs-sdd-organic-development/): the method and its risk classification.
- [ArceApps, SDD and TDD](/blog/sdd-tdd-acceptance-loop/): executable acceptance criteria and test-first reasoning.

## Closing thoughts

The most useful quality of ODD is that it allows a fix to remain a fix while still requiring evidence. It also recognizes when an apparently small feature has acquired durable decisions, storage semantics or concurrency hazards that deserve a feature record. The same «Complete today» button in our fictional app provided examples of both.

We did not ship an Android app or run instrumentation tests. We did specify testable outcomes and execute the isolated Kotlin reducer, with clear boundaries around what remains unverified. That distinction between saying «it works» and saying «these are the exact checks that passed» is one of the strongest habits an AI coding agent can acquire.

*Next time you build a small Android feature with an agent, ask whether tomorrow's session could recover it from the request and diff, what could go wrong and what observable check would establish correctness. When those questions have precise answers, much of the ritual takes care of itself.*