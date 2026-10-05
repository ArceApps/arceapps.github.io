---
title: "RadioHub: a release does not ship until its SHA passes every gate"
description: "How RadioHub turned CHANGELOG, Roborazzi and GitHub Actions into a self-contained gate that validates the exact commit headed to Google Play."
pubDate: 2026-09-19
lastmod: 2026-10-05
author: "ArceApps"
keywords: ["RadioHub", "GitHub Actions", "Android", "Roborazzi", "release"]
heroImage: "/images/devlog/radiohub-release-gate.svg"
tags: ["Android", "CI/CD", "GitHub Actions", "testing", "devlog"]
draft: false
---

An Android release can fail in a particularly awkward way: not because the AAB refuses to compile, but because it successfully compiles something that should not have been published. The wrong version, release notes that belong to another build, a stale visual baseline, or a commit different from the one that passed CI can all coexist with a perfectly valid bundle.

On September 19, RadioHub accumulated several changes around publishing. Seen separately, they looked like unrelated maintenance: fix Roborazzi, expose release notes inside the app, validate `versionName`, and harden the release workflow. Seen together, they told a more useful engineering story: make publishing an operation that can prove which code it is releasing and which checks that exact code has passed.

The work landed through PRs [#8](https://github.com/ArceApps/RadioHub/pull/8), [#9](https://github.com/ArceApps/RadioHub/pull/9), [#10](https://github.com/ArceApps/RadioHub/pull/10), and [#11](https://github.com/ArceApps/RadioHub/pull/11). The final decision gave the previous ones a common shape: the release workflow does not merely wait for another workflow to say that things look healthy. It reruns the mandatory gates against the exact SHA it intends to publish.

That changes the question. It is no longer “is there a green CI run somewhere near this release?” It becomes “can this pipeline demonstrate that this SHA, with these metadata and these checks, is the one going to Google Play?”

## Two kinds of screenshots, two different contracts

Roborazzi was already part of RadioHub. The project used screenshot tests to detect visual regressions, while it also generated screenshots intended for store marketing. Both workflows produce PNG files and both can be driven from tests, which makes it tempting to treat them as one problem.

They are not.

A visual-regression baseline is an expectation about the product. CI should be able to compare the current UI against that reference and fail when an unaccepted difference appears. A marketing screenshot is an editorial artifact: it is generated when store material is being prepared and should not accidentally become a requirement for every automated verification run.

PR #8 separated those responsibilities. `MarketingScreenshotTest` stopped writing to an absolute path tied to one developer machine and moved to a repository-relative output directory. More importantly, generation was put behind the explicit `radiohub.generateMarketingScreenshots` system property. If that property is not enabled, the test is skipped.

That turns marketing capture into an explicitly invoked tool rather than an accidental CI obligation. Promotional screenshots are generated when requested; Roborazzi baselines, by contrast, remain part of the verification contract.

The same PR added missing references for several `RecordingsScreen` states: content, empty, error, and loading, across light and dark themes and English and Spanish variants. The important point was not simply “make CI green.” A visual test without its versioned baseline has no stable expectation to compare against. The baseline is part of the test.

The reusable rule is simple: artifacts that verify the product belong to the gate; artifacts that promote the product belong to a separate, explicit workflow.

## The changelog was also trying to do two jobs

The next problem had the same shape, only in text.

A `CHANGELOG.md` can easily degrade into a transcription of commits: internal migrations, dependency updates, refactors, CI changes, and implementation details that matter to maintainers but tell a user almost nothing about the update they just installed.

PR #9 deliberately changed that contract. The file now states that it documents user-visible changes, and it adds an explicit rule: internal refactors, CI-only work, tests, and documentation do not require changelog entries unless they affect the shipped application.

That mattered because the same file started feeding a new “What's new” screen inside RadioHub.

Instead of maintaining two authoritative copies—repository release notes and another manually copied set inside Android—Gradle generates an asset from the root `CHANGELOG.md`. A `GenerateChangelogAsset` task declares the changelog as input and a generated directory as output. Android's variant configuration then adds that directory to the app assets.

The data flow is deliberately boring:

~~~text
CHANGELOG.md
    |
    | Gradle generated asset
    v
assets/CHANGELOG.md
    |
    | ChangelogParser
    v
What's new
~~~

There is no second authoritative file to remember to edit.

The parser understands release headings and sections but excludes `Unreleased` from the visible list. Work for the next version can therefore remain in the same source document without exposing unreleased features to people running the current app.

A test named `packaged changelog asset exactly matches repository source of truth` closes the loop. It reads the packaged asset, reads the repository file, normalizes line endings, and requires the contents to match.

“CHANGELOG is the source of truth” stops being a convention and becomes a testable property.

## A source of truth only matters when divergence is prevented

It is easy to write in documentation that a file is authoritative. If another manually maintained copy can silently diverge, that statement is mostly aspirational.

RadioHub ended up with three layers of verification around this source. First, the build generates the asset rather than maintaining it manually. Second, a test compares the generated/package-visible content with the repository source. Third, the UI is tested using that asset and verifies that a released version is shown while `Unreleased` is absent.

There is also navigation coverage from Settings to “What's new.” The contract does not stop at the parser; it reaches the entry point a user actually taps.

That pattern is more interesting than the screen itself. When the same information needs to appear in the repository, the application, and the release process, the robust answer is usually not “synchronize three copies more carefully.” It is to reduce the number of authoritative copies.

## The first metadata gate was too narrow

PR #9 added a direct release-workflow check: the current application version needed a dated section in `CHANGELOG.md`.

That was already an improvement. An AAB could compile successfully while having no release notes corresponding to its version. Failing before publication was better than discovering that mismatch afterward.

But “a line containing this version exists” does not cover every inconsistent state.

PR #10 moved the rule into a reusable validator: `scripts/validate-release-metadata.sh`.

The script extracts `versionName` and `versionCode` from `app/build.gradle.kts`, requires a strict `MAJOR.MINOR.PATCH` form, computes the expected numeric code, and validates the changelog structure.

The mapping is:

~~~text
versionCode = major * 100000 + minor * 1000 + patch
~~~

For `1.7.4`, the expected result is `107004`.

The validator also constrains the minor and patch ranges so the mapping cannot silently collide, requires exactly one `Unreleased` section, exactly one dated section for the current version, and at least one user-facing item inside that release.

When the workflow runs from a `v*` tag, the tag must also match `versionName`.

The pipeline is no longer checking one isolated string. It is checking a relationship between Gradle metadata, the changelog, and the Git reference.

## Test the validator that is allowed to stop a release

Once a script can block publication, another question appears: who validates the validator?

PR #10 added `scripts/test-validate-release-metadata.sh`, a compact set of positive and negative cases using temporary files.

There is a valid case and several intentionally invalid ones: a `versionCode` that does not correspond to `versionName`, unsupported SemVer formatting, a missing `Unreleased` section, a duplicate release section, an empty release, and a tag whose version disagrees with the application version.

This kind of test is inexpensive and disproportionately useful because the script is executable policy. If somebody later changes the regular expression or version formula, a real release is the wrong place to discover that the gate accepts invalid states or rejects valid ones.

It also avoids a common workflow problem: burying too much policy inside YAML. The reusable logic lives in a script that can be tested independently; the workflow invokes it at the appropriate point.

## Green CI does not necessarily answer which SHA is being published

PR #11 was the architectural change.

RadioHub already had CI with builds, tests, and Roborazzi verification. One possible design would have made the release workflow query CI status and publish only when it found a green result.

The final design deliberately does not rely on that.

The workflow documents that release reruns every mandatory gate on the exact SHA being published, and warns against replacing those checks with an asynchronous lookup of another CI run. The stated goal is for publication to remain self-contained and free of a race between workflows.

The issue is temporal identity. Imagine `main` advances from commit A to commit B. CI for A finishes green. A release for B starts afterward. If the release process asks an imprecise question such as “is CI green?”, there is a conceptual risk of treating evidence about A as evidence about B.

GitHub can support more sophisticated designs around checks associated with exact commits. RadioHub chose a simpler property to reason about: the publishing job executes its gates on its own checkout.

That duplicates some compute. In exchange, it reduces coupling between workflows and removes coordination between “CI finished” and “release started.”

## First prove what was checked out

Before Gradle runs, PR #11 added `Verify release source`.

The job obtains `git rev-parse HEAD` and compares it with `GITHUB_SHA`. A mismatch fails the job.

Manual executions add another restriction: publication is allowed only from `main` or an existing `v*` tag. An arbitrary branch cannot become a release simply because somebody triggered `workflow_dispatch`.

This check is intentionally simple. `actions/checkout` is already designed to check out the event reference, but the identity of released code is important enough here to become an explicit pipeline invariant.

The log can state exactly which commit the release gate is validating.

## Gate ordering is part of the design

After establishing the SHA, the workflow does not immediately prepare signing material or build the signed AAB.

It starts with the cheaper checks:

~~~text
1. verify SHA/ref
2. validate version + changelog
3. testDebugUnitTest
4. assembleDebug
5. verifyRoborazziDebug
6. prepare signing material
7. bundleRelease
8. verify AAB exists
9. tag / publish
~~~

This ordering has two advantages.

The first is efficiency. If release metadata is inconsistent, there is no reason to pay the cost of a signed build.

The second is minimizing unnecessary handling of sensitive publishing material. Signing configuration is prepared only after the preceding gates have passed. The rule is straightforward: do not prepare release resources before they are needed.

Finally, the workflow checks that an AAB exists in the expected directory before continuing to tagging and publication.

## A debug build inside release is deliberate duplication

`assembleDebug` may already have run in normal CI. Running it again during release looks redundant.

It is redundant, but deliberately so.

PR #11 describes the release process as a self-contained gate. The goal is not to eliminate every duplicated CPU cycle; it is to create a chain of evidence about one SHA.

`testDebugUnitTest` answers whether the unit-test suite passes. `assembleDebug` answers whether the debug configuration builds. `verifyRoborazziDebug` answers whether covered UI output still matches accepted visual references. `bundleRelease` answers whether the release artifact can be produced.

Those are different questions. Running them inside the publication job gives the final result stronger semantics: the artifact did not reach the publishing stage because another workflow happened to be green, delayed, canceled, or evaluating a different revision.

## Roborazzi becomes part of the release definition

PR #8 prepared the ground and PR #11 completed the idea.

Before the separation, baseline problems could make Roborazzi feel like CI friction. Once marketing captures were isolated and missing references were versioned, `verifyRoborazziDebug` could occupy a clear place in the release gate.

That changes the meaning of a visual difference.

If a UI change is intentional, the baseline is updated consciously and that change becomes part of Git history. If it is not intentional, publication stops.

This does not mean screenshot testing can prove all visual correctness in an Android app. Device differences, API levels, fonts, animation, and runtime states still require other forms of testing. For the covered screens, however, the baseline is a reviewable and versioned expectation.

The important part is that it is not confused with Play Store imagery. A promotional image can change because of editorial composition without indicating a UI regression; a baseline changes because the team accepts a different product output.

## The changelog becomes an interface between development, app, and release

PRs #9 and #10 create another consequence: `CHANGELOG.md` is no longer passive documentation.

It participates in three systems.

For development, `Unreleased` collects user-visible changes intended for the next version. For the application, the same document feeds “What's new.” For release, its structure must agree with `versionName` before publication proceeds.

That forces the file to be written differently. An entry such as “refactor repository X” can be technically accurate while being poor material for an in-app release-notes screen. The changelog was therefore oriented toward changes a person can recognize after updating.

Technical detail is not lost; this devlog exists precisely to preserve it. It is separated by audience.

The changelog explains what changed for users. The devlog explains why the pipeline changed, which trade-offs it introduced, and what can be learned from it. Commits preserve granular history.

One format does not need to perform all three jobs.

## The workflow stops trusting coincidences

Put the pieces together and a chain of invariants appears:

~~~text
GITHUB_SHA == checkout HEAD
versionName <-> versionCode
versionName <-> CHANGELOG release
tag <-> versionName
CHANGELOG source == packaged asset
UI released notes != Unreleased
Roborazzi current UI == accepted baselines
release AAB exists
~~~

Each arrow represents a place where two facts could previously diverge and where correctness might have depended on manual discipline.

This does not eliminate every possible release mistake. The metadata validator cannot decide whether a changelog entry is well written. Roborazzi cannot know whether a complex interaction works on real hardware. The existence of an AAB does not guarantee Google Play will accept it.

But the pipeline stops accepting several classes of mechanical inconsistency that software can detect reliably.

That is a useful automation boundary: machines enforce deterministic relationships; human review handles semantics, UX, and real-world behavior.

## Release documentation had to move with the code

`docs/RELEASING.md` was updated to describe the new contract.

The documented sequence now includes source-SHA verification, SemVer/`versionCode`/changelog validation, tests, debug build, Roborazzi verification, and only then the release AAB.

That may look secondary compared with workflow YAML, but it prevents another form of drift: the automation doing one thing while the operating guide still describes another.

Releases happen less frequently than day-to-day development. That is exactly why documentation matters. Decisions that feel obvious on the day a workflow is written are much less obvious weeks later.

The workflow comment records why mandatory gates are rerun. `RELEASING.md` records what the person publishing should expect. The tests record which invariants are executable.

Those are three different layers of documentation.

## What this architecture does not try to solve

The gate is strong within its scope, but it should not be oversold.

It does not replace testing on real devices. RadioHub contains behavior—audio playback, alarms, foreground services, lock-screen behavior—whose results depend on Android system behavior and hardware. An Ubuntu workflow cannot prove that entire experience.

It does not make semantic versioning an automatic product decision either. The script checks that the version has the supported shape and that `versionCode` corresponds to it. It does not decide whether a change deserves a major, minor, or patch increment.

Nor does it evaluate changelog writing quality. It verifies structure and the existence of user-facing items, not whether those items are clear or complete.

Automation is useful here precisely because its scope is concrete. A gate that claimed to “guarantee a perfect release” would be making a false promise. This gate guarantees specific relationships before publication is allowed to proceed.

## Cost: repeat work to buy traceability

The most debatable choice is also the most interesting one: rerunning tests and the debug build inside the release job.

In a very large project, duplicating an expensive suite might be unacceptable. A different design could make release depend on required checks associated with exactly the target SHA and reuse verifiable artifacts.

RadioHub did not choose that complexity here.

The self-contained solution is easier to inspect. Open one release run and the mandatory checks protecting the AAB appear in order.

The cost is runner time. The benefit is simple semantics.

For an indie project, that trade can be favorable. Infrastructure has a cognitive cost too. Saving a few minutes by introducing cross-workflow coordination, check queries, artifact identity, and race handling is not automatically an optimization.

The key is not that rerunning everything is universally correct. The key is that the chosen model has an explicit property: all mandatory evidence is generated inside the release execution for the same SHA.

## Think of a release as an operation with preconditions

The resulting workflow resembles a transaction.

Publishing is the operation that is difficult—or at least expensive—to undo. Before reaching it, the pipeline checks preconditions: source identity, version consistency, release notes, tests, compilation, visual regression, and final artifact existence.

If any precondition fails, execution does not advance to publication.

The analogy is imperfect—GitHub Actions does not provide an ACID transaction over Google Play—but it helps with ordering. Checks should happen before the effect they protect.

It also explains why creating a tag after the gate is more meaningful than treating an early tag as proof that a release succeeded. In this model, the tag represents a release that crossed the gate rather than an intention that might still fail halfway through.

## What September 19 taught me

The first lesson is that a source of truth needs enforcement. Generating the changelog asset and comparing it against its repository origin is stronger than a written convention.

The second is that not every PNG produced by a test has the same semantics. Separating marketing screenshots from visual-regression references made Roborazzi suitable for a real release gate.

The third is that green CI is only useful evidence when it can be associated unambiguously with the code being published. RadioHub chose to guarantee that association by rerunning the mandatory gates on the release SHA.

The fourth is that cheap validation should happen before expensive or sensitive release operations.

The fifth is that user-facing documentation and technical documentation do not compete. The changelog can stay concise and user-oriented because the devlog, PRs, and commits preserve the engineering reasoning.

There is a sixth lesson hiding underneath the others: the best release automation is not the automation with the most steps. It is the one whose steps each protect a named invariant. Once a check cannot be connected to a failure mode, it becomes ceremony. Once a failure mode has a deterministic relationship that can be tested, leaving it to memory becomes unnecessary risk.

## Result

At the end of that cycle, RadioHub had a more explicit release process:

~~~text
commit/ref
   |
   v
verify exact SHA
   |
   v
validate version + changelog
   |
   v
unit tests
   |
   v
debug build
   |
   v
Roborazzi
   |
   v
release AAB
   |
   v
tag + publish
~~~

And the changelog was no longer a peripheral repository file:

~~~text
CHANGELOG.md
  |--> release metadata gate
  |--> generated Android asset
          |--> What's new
~~~

None of these changes is spectacular in isolation. Together they reduce the number of ambiguous states in which a release merely *looks* correct.

Release automation should not only make publishing faster. It should make publishing the wrong thing harder.

On September 19, RadioHub moved in exactly that direction.

## References

- [PR #8 — Fix Roborazzi CI and generate missing baselines](https://github.com/ArceApps/RadioHub/pull/8)
- [PR #9 — Add changelog-driven What's new screen](https://github.com/ArceApps/RadioHub/pull/9)
- [PR #10 — Stabilize changelog release validation](https://github.com/ArceApps/RadioHub/pull/10)
- [PR #11 — Enforce full pre-publish gate](https://github.com/ArceApps/RadioHub/pull/11)
- [GitHub Docs — Workflow syntax for GitHub Actions](https://docs.github.com/actions/writing-workflows/workflow-syntax-for-github-actions)
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)
- [Roborazzi](https://github.com/takahirom/roborazzi)
