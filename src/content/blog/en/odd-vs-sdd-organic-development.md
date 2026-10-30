---
title: "ODD vs SDD: less ceremony, better decisions"
description: "Explore how Gentle-AI's ODD differs from SDD, scales planning to risk, preserves intent and verifies coding-agent changes without needless ceremony."
pubDate: 2026-10-30
lastmod: 2026-10-30
author: "ArceApps"
keywords: ["ODD", "Organic Driven Development", "SDD", "Gentle-AI", "AI coding agents", "software workflow"]
canonical: "https://arceapps.com/blog/odd-vs-sdd-organic-development/"
heroImage: "/images/odd-vs-sdd-organic-development.svg"
tags: ["ODD", "SDD", "AI Agents", "Software Engineering", "Workflow"]
reference_id: "c34d078a-734b-424b-ad44-c60e09675114"
---

> **Previously on ArceApps:** [Spec-Driven Development with AI](/blog/spec-driven-development-ai/), [SDD + TDD as an acceptance loop](/blog/sdd-tdd-acceptance-loop/), and [the Grill Me approach to specifications](/blog/grill-me-sdd-adversarial-workflow-comparison/). This article addresses a different question: how does an agent decide how much process a change needs before writing code? The companion [ODD Android laboratory](/blog/odd-android-kotlin-lab/) puts that decision into practice.

## The hidden cost of over-organizing small changes

Some tasks deserve an afternoon of deliberate design. Others should be solved after reading three files, writing a regression test and reviewing a small diff. If both go through an identical planning machine, the process is not responding to risk. It is responding to habit. Changing the calculation of a persisted score may demand exact rules and migration tests; correcting the spacing of a button normally does not justify a proposal, a design dossier, a task register and three approval rounds.

AI-assisted development made specification-first workflows popular for good reasons. A coding agent can move fast while hallucinating requirements, forgetting constraints and producing changes that are hard to review. Spec-Driven Development, or SDD, places an explicit contract between the request and the code. That can be enormously valuable. The trap appears when a workflow meant to preserve intent becomes mandatory ceremony regardless of the size and consequence of the change.

Organic Driven Development, or ODD, asks a different question: what must the agent understand before acting, what must be saved to resume the work after an interruption, and what evidence would establish that the implementation is right? The goal is not zero planning. It is proportional planning. A small, well-understood fix should stay small; an ambiguous, consequential feature should carry durable context and strong checks.

That distinction matters to independent developers. We cannot afford to become full-time administrators of our own agents. We also cannot afford software whose correctness rests on an assistant confidently saying it tested something. A useful process has to reduce unnecessary hand-offs while increasing the reliability of the changes that genuinely matter.

## Defining ODD precisely

The letters ODD are overloaded. Depending on the source, they can stand for Outcomes-Driven Development, Observability-Driven Development and several other ideas. Here, ODD means **Organic Driven Development**, specifically the approach documented by the open-source [Gentle-AI project](https://github.com/Gentleman-Programming/gentle-ai). We should not mix its claims with those of unrelated frameworks that happen to use the same initials.

Gentle-AI's [usage documentation](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md) describes ODD as the default behavior of a configured coding agent. It is not a new command that the developer must remember to invoke for a particular ticket. The agent still explores, implements and performs relevant checks. What varies is the depth of investigation, the amount of durable tracking and the weight of the verification.

This point needs a freshness warning. The project's documentation on the main branch explicitly says it may include unreleased changes. It is therefore a description of the upstream protocol as published, not proof that a particular tagged release or user installation implements every detail. This article is a reading of the primary source and an engineering analysis; it is not a measured productivity study of Gentle-AI installations.

SDD is not one frozen recipe either. GitHub Spec Kit, OpenSpec and agent-specific harnesses organize specs, designs and tasks differently. An earlier Gentle-AI flow was often summarized as eight steps, from exploring through archiving. Other current documentation exposes additional initialization and checking operations. Treating every SDD implementation as exactly eight unavoidable gates would create an unfair contrast. The meaningful difference is who chooses the degree of formality, and how that choice is made.

Under ODD, proportionality is part of the always-on protocol. Under formal SDD, the specification becomes the central artifact for a change and the workflow may be explicitly selected. Both approaches still require sound requirements, competent engineering, testable outcomes and an honest account of what actually ran.

## The seven responsibilities of an ODD agent

The official ODD protocol contains seven named steps. Calling them steps does not mean the human must fill in seven forms. They are responsibilities that guide the agent's decisions without requiring a separate artifact for every responsibility. Understanding that distinction is essential; otherwise the supposed alternative to bureaucracy simply becomes a new style of bureaucracy.

**Authorize.** A request to explain a bug or review a design is not permission to change source files. The agent first establishes whether the developer authorized implementation. Investigation-only requests remain read-only. This protects an important boundary: curiosity must not silently become a commit, a database mutation or an altered public artifact.

**Explore.** Before proposing modifications, inspect relevant code and requirements. Exploration should be selective rather than ceremonial. A function that already normalizes shared data is more important than a tour of every directory. The agent should locate existing behavior, adjacent tests, established conventions and constraints that the new code must preserve.

**Resolve uncertainty.** Research should address an identified uncertainty, not produce a wall of generic questions. A real unresolved product decision can justify one focused question. Facts that are obvious from the repository should not be pushed back onto the developer. For high-consequence assumptions, a focused challenge may be appropriate, but the process should not turn straightforward implementation into endless architecture debates.

**Classify.** This is the central move. The current protocol calls work small when it is understood, its risk is contained, and a new session could recover it from the original request plus the Git diff. Substantial work is the kind that fails that recovery test. File counts, line counts, command counts and the mere presence of a requested task list do not determine the category.

**Track before the first write.** Substantial authorized work gets a single recoverable feature document. In the Gentle-AI model it lives under odd/tasks, with a mirrored memory entry in Engram when the integration is available. The document contains specs, tasks and a log of corrections and evidence. Small, understood work does not require this durable task artifact.

**Implement task by task.** Work units use relevant checks and a test-first policy where deterministic tests with clear expected results make sense. Reviewable commits preserve each unit's rationale and evidence. The documentation mentions a roughly 400-line heuristic for authored changes, but explicitly warns against treating it as a hard limit or splitting coherent work solely to satisfy a counter.

**Close.** Report the verified outcome, every failed or pending check, and what remains. A checked box is not proof. Nor is a model-generated statement that everything is fine. Delivery and approval remain subject to repository rules and any separately configured review process. The ability to commit a slice does not automatically authorize merging or publishing it.

The practical sequence is authorization, focused exploration, targeted clarification, risk-aware classification, selective durable tracking, checked implementation, and truthful closure. That is an appealing default because it makes evidence part of ordinary work while reserving heavy documentation for cases that need it.

![ODD branches into lightweight and tracked work](/images/odd-sdd-workflow-en.svg)

*Author-drawn overview. Both paths explore and verify; only work that cannot be safely recovered from the request and diff gets durable task tracking. This diagram explains intent rather than measured performance.*

## ODD versus SDD: a useful comparison

| Dimension | ODD in Gentle-AI | Formal SDD workflows |
| --- | --- | --- |
| Starting question | Is action authorized, and what is uncertain? | What behavior and constraints must be specified? |
| Activation | Default behavior in a configured agent | Usually explicitly selected or prescribed by project policy |
| Small changes | No permanent task document when understood and contained | May use a lighter or more formal artifact, depending on implementation |
| Substantial changes | One live feature record with specs, tasks and evidence | Proposal, specs, design, tasks and checks, with framework-specific variants |
| Primary emphasis | Proportionality, continuity and evidence | Explicit contract and traceability from requirement to implementation |
| Human decisions | Only material unresolved product or risk decisions | More up-front definition of scope, architecture and acceptance |
| Testing | Proportional; test-first when suitable | Tests derived from scenarios and acceptance criteria |
| Common failure | Underestimating hidden risk | Overproducing paperwork for simple work |

These are tendencies, not laws of nature. A lean SDD setup may look practically identical to good ODD. An ODD agent operating in a high-risk domain might need documentation and verification as rigorous as any fully specified feature. A framework label does not establish quality. Concrete instructions, authorization boundaries, tests and delivery gates do.

Another way to see the distinction is to ask what each approach prioritizes. SDD is especially strong at answering what correct behavior means before implementation begins. ODD explicitly addresses how much process is justified to discover, preserve and verify that answer. That makes the two compatible. An agent can operate under ODD by default and enter a formal SDD workflow for a substantial or sensitive feature.

I would hesitate to let an agent decide every safety requirement autonomously. Security-sensitive changes, personal data, payment flows, schema migrations and public publishing rules benefit from non-negotiable repository policies. Even an agent that classifies a change as small should still satisfy those gates. Proportionality is useful inside known boundaries; it must not erase the boundaries themselves.

## The recovery test is better than counting lines

Imagine closing your laptop halfway through a task. The following morning you open a new agent session in the same repository. Could a competent agent recover the intention, the current state and the safe next action from the original request and the Git diff alone? If yes, and there is no special risk, a large document might add little. If no, the project needs durable context before the first significant write.

This simple thought experiment changes what counts as complexity. A one-line modification to request signing can have major security implications. A mechanical rename across fifty files might be easy to review and revert. Neither the number of edited files nor the sheer amount of generated code expresses the actual consequence, uncertainty or interruption cost.

The recovery test should remain a heuristic rather than a magical classifier. An agent may believe something is obvious while overlooking a product rule the developer considers fundamental. That is why I would complement it with fixed triggers: changing a public contract, authentication, persistent user data, schema migration, an irreversible operation or the publishing pipeline warrants elevated scrutiny.

There is another benefit to separating durable tracking from durable evidence. A small bug fix can be remembered by its regression test and the commit that explains the root cause. It does not necessarily need a second document repeating the test name, expected result and patch description. The codebase already offers useful memory if we write meaningful tests and commits.

For larger tasks, however, a good feature record becomes the bridge between sessions. It says why the change exists, what the user actually asked, which decisions were settled, which examples define success, what was verified and which tasks still need work. Saving every chat message is not necessary. Saving the information that lets someone resume correctly is.

## Three fictional changes and their appropriate process

### Example one: a clipped label

A small Android screen has a button whose translated text is clipped at a narrow viewport. The agent checks the Composable, string resources and any current UI checks. The desired behavior is unambiguous, the change is reversible, and no persistent state is involved. A focused layout fix and visual checks may be enough. This is a good candidate for lightweight ODD.

Even here, «lightweight» is not synonymous with «careless». An ellipsis might hide the very meaning the user needs. Large font sizes and other languages might expose a new layout defect. A targeted check should use the relevant configurations and confirm that the screen stays accessible. What disappears is duplicate project-management paperwork, not engineering responsibility.

### Example two: idempotent retries

A mobile app retries an action after a connection interruption. The operation must not be recorded twice. The code change may be tiny, yet the product behavior hides many questions. Where does the idempotency key come from? What is its lifetime? Does a second process share the same state? What happens if the first request succeeds but its response is lost? What gets persisted?

A fresh agent session cannot reconstruct those product decisions from a few changed lines. This is substantial work. A compact feature document with exact examples, checks and a task log provides real value. Unit tests can verify a state transition, but integration tests are needed to establish that the chosen persistence mechanism survives realistic retries.

### Example three: migrating user storage

An Android app changes a Room schema while preserving data from existing installations. The implementation must cover upgrade paths, historical versions, offline state, interruptions and possibly rollback. An empty new database passing tests says almost nothing about whether users' existing data survives the migration.

ODD can still serve as the entry point, but formal SDD specifications and targeted migration tests are appropriate. This is not over-engineering. It is recognizing that the cost of a broken migration exceeds the cost of preparing and executing meaningful checks. The independent human decision might concern acceptable compatibility or rollback behavior; the agent should not invent those policies.

Together the examples show why «small» cannot mean «few lines». The better questions are whether the outcome is understood, what can break, how easily work can be resumed and what evidence is necessary to trust the result.

## Anatomy of a recoverable ODD feature record

Gentle-AI describes one document with three sections: Specs, Tasks and Log. Specs contain stable requirement identifiers and acceptance checks. Tasks reference those requirements and retain their work-unit evidence. The log preserves the original request and later corrections. The approach prevents a checklist from becoming detached from the reasons it was created.

A deliberately simplified fictional fragment could look like this:

    # Feature: prevent duplicate local saves
    ## Specs
    S1. Repeating a request with the same key creates no extra item.
    Acceptance: two identical attempts produce one persisted record.
    S2. A distinct key permits a distinct operation.
    Acceptance: two valid distinct keys produce two records.
    ## Tasks
    T1 -> S1/S2: regression tests and write adapter.
    T2 -> S1/S2: persistence verification after process restart.
    ## Log
    L1. Original request and explicitly authorized scope.
    L2. Observed checks, pending checks, commit and changes.

The exact punctuation is not the core idea. The core idea is that a future session can read one durable source, understand the user intent, identify unfinished work and inspect the evidence behind completed items. Exact strings matter when they are themselves part of the requested contract. A later change should update affected specs and reopen the corresponding tasks rather than silently overwrite history.

Engram is a feature of the Gentle-AI ecosystem, not a universal dependency of the philosophy. A project using Git and a Markdown file can preserve the same continuity principles. What I would avoid is copying every requirement into an issue, a project board, three files and an agent memory with no documented authority hierarchy. That creates a synchronization problem disguised as better organization.

Nor should we trust a prompt to enforce the entire protocol without evaluation. A model can produce an excellent-looking task file while forgetting authorization or inventing verification evidence. The upstream documentation itself distinguishes prescribed behavior from what its instruction tests can establish. A reliable installation needs observable tests of its own workflows.

## Tests, continuous integration and independent review

ODD does not replace Test-Driven Development. ODD directs the engineering workflow; TDD guides a particular kind of implementation when a deterministic test can describe the desired behavior. The Gentle-AI protocol says test-first should be the default where an applicable runner and clear expected result exist. Observe RED, implement GREEN and refactor while preserving GREEN. That gives the agent something sturdier than its own confidence.

Acceptance checks must target outputs, not an implementation selected in advance. «Two retries result in one record» is a useful observable rule. «Use a particular Set inside the ViewModel» is an implementation suggestion. A test that inspects the existence of that Set could pass while a duplicate record is still written. Tests of public behavior and persistent effects give us better evidence than tests of internal wiring.

CI changes the meaning of done. A successful build and unit suite lower uncertainty, but they do not automatically validate every visual layout, accessibility behavior, publishing permission or data-protection promise. If a runner failed to execute, the closure should say so. If UI behavior was only inspected manually, it should be described as such. If the app was not built, no narrative flourish can turn that into a successful build.

Independent review also benefits from a narrow target. Reviewing a bounded commit or PR slice is easier than repeatedly examining a growing feature branch after every checked box. Gentle-AI's optional Receipt-Driven Development component, RDD, remains a distinct review process; ODD does not silently enable it or confer delivery authorization. That separation helps prevent «the agent finished the task» from being confused with «the user approved publication».

For a private-to-public portfolio pipeline, another invariant takes precedence: private notes, secrets and internal files must never cross the publishing boundary. The task may be editorial, but the release process is still software. It needs an explicit allowlist or equivalent filtering, passing CI and confirmation that the actual public site serves the intended content.

## Where ODD can fail

**Misclassification** is the most obvious failure mode. An agent may categorize a change as easy because the diff is short, missing a business rule hidden in a nearby module. The remedy is not a universal thirty-page spec. It is a better risk policy and purposeful exploration of the interfaces and tests surrounding the change.

**False memory** is subtler. Durable notes can preserve a wrong conclusion as efficiently as a correct one. Keeping exact requirements, the correction history and evidence locations makes later verification possible, but persistence alone is not truth. Every critical claim should remain traceable to a test, source or actual repository state.

**Paperwork theater** can occur under ODD too. A feature document, checked tasks, nicely formatted commit summaries and a confident final message can all coexist with broken behavior. A real close-out lists observed checks and unsatisfied acceptance criteria. When nothing has run, the honest state is that verification remains pending.

**Inconsistent routing** can make behavior unpredictable between sessions. One model may choose a short path while another constructs a formal specification for the same request. Repository-level rules for privacy, compatibility, persistence, security and merging reduce this variance. The protocol can then flex without violating immovable constraints.

**Human interruption fatigue** remains a risk. Asking for confirmation on every detail already visible in code does not preserve the developer's control; it wastes it. The distinction between a genuine product choice and a question the agent could resolve by reading is one of ODD's strongest ideas. It still depends on judgment, so observing unnecessary pauses is worth doing.

Finally, **false efficiency metrics** can make a methodology look better than it is. Fewer generated documents or lower token usage do not prove higher code quality. We need to examine regressions, restartability, review cost and the quality of executable acceptance evidence. A faster agent that produces more silent mistakes is not an improvement.

## Adopting ODD without throwing away SDD

I would not begin by replacing every existing project instruction. I would inspect what already works: tests, Git workflows, content conventions, security rules and any dependable release checks. Then I would make the recovery question explicit, identify hard risk triggers and remove redundant paperwork where it creates no useful memory. Only after that would I evaluate whether a persistent memory product adds enough value to warrant integration.

A compact project contract might read: explore before editing; distinguish read-only work from authorized changes; reuse existing helpers; ask only for decisions that cannot reasonably be inferred; record substantial changes before writing; prove observable behavior; preserve failing and pending checks; and close with an accurate report. This can fit into a clear repository instruction file rather than an elaborate toolchain.

SDD should remain available for features whose requirements, contracts or migration consequences need deliberate upfront agreement. When a specification is warranted, write one with real cases and boundaries, not a document created merely to fill a folder. When it is not, a strong regression test and descriptive commit may convey everything the next session needs.

To evaluate whether the new workflow helps, measure meaningful outcomes across comparable tasks: time spent reconstructing context, number of irrelevant questions, defects discovered after the patch, ability to resume interrupted work, review burden and coverage of requirements by actual checks. Do not claim an improvement based on one attractive demonstration. Good engineering methods earn their place through repeated observable results.

There is also no need to install Gentle-AI just to try the principle. Any developer working with an agent can ask whether a change is authorized, what is actually uncertain, whether the task is recoverable and what proof of correctness is available. The upstream ecosystem automates those decisions; the underlying judgment is useful even without its tooling.

## Conclusion: less ritual, not less engineering

ODD does not show that specifications were a mistake. It points out that forcing every task through the same intensity of ceremony is a mistake. SDD is valuable when consequences and ambiguity demand a stable contract. ODD offers a disciplined way to choose a lighter path for work that is already understood, while retaining durable records and stronger checks for consequential changes.

The question I would bring into every repository is: what information and evidence will the next developer or agent need to understand this change tomorrow? Sometimes the answer is a test and a commit. Sometimes it is a specification, migration fixtures, review receipts and a release gate. The real failure is choosing blindly.

The companion [ODD Android case study](/blog/odd-android-kotlin-lab/) follows a fictional habit-tracking app through a focused bug fix and a more complex persistence requirement. It includes Kotlin code and concrete test cases, and clearly separates reproducible examples from checks that would still require a real Android project.

## References and further reading

- [Gentle-AI official repository](https://github.com/Gentleman-Programming/gentle-ai): scope, ecosystem components and original source.
- [Gentle-AI usage documentation, ODD protocol](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md): seven responsibilities, size classification, tracking, tests and closure. The main branch may include unreleased changes.
- [Gentle-AI SDD documentation](https://docs-gentle-ai.netlify.app/es/): formal planning flow and relationship to organic routing; check the version displayed on the site.
- [Android Developers, testing coroutines](https://developer.android.com/kotlin/coroutines/test): practical testing reference for the Android example.
- [ArceApps, SDD + TDD acceptance loop](https://arceapps.com/blog/sdd-tdd-acceptance-loop/): previous discussion of specification and executable acceptance.
- [ArceApps, Spec-Driven Development](https://arceapps.com/blog/spec-driven-development-ai/): background on specification-first workflows.

*The appeal of ODD is not that it comes with a new label. It is the possibility of writing fewer redundant documents while keeping the decisions and test evidence that really matter. If you experiment with it, the most useful feedback is where its classification rule gets a difficult change wrong.*