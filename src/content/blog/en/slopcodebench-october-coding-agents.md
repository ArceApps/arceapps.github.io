---
title: "SlopCodeBench: coding agents still break old code"
description: "Examine October 2026 SlopCodeBench results: Astra and Opus scores, XHigh costs, regressions, and practical changes for agent-assisted development."
pubDate: 2026-10-26
lastmod: 2026-10-26
author: "ArceApps"
keywords: ["SlopCodeBench","GPT-6 Astra","Opus 5.5","coding agents","regression testing"]
canonical: "https://arceapps.com/blog/slopcodebench-october-coding-agents/"
heroImage: "/images/slopcodebench-october-coding-agents.svg"
tags: ["AI Agents", "Benchmark", "Software Quality", "Coding"]
reference_id: "c3efaf9a-61fc-4766-bc59-7c18da8c90de"
---

A coding agent can solve an isolated task and still be a poor partner for maintaining software over time. The hard test is not adding one function to a fresh project. It is modifying a program that already works, meeting new requirements, and preserving everything that came before. That is where regressions, brittle patches, and unnecessary abstractions emerge.

[SlopCodeBench](https://arxiv.org/abs/2603.24755) exists to measure precisely that kind of degradation. On October 15, 2026, Dex Horthy published [an updated evaluation](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/benchmarking-new-models-on-slop-code-bench.md) of recent coding-agent configurations. Its headline is deliberately provocative: **GPT-6 Astra leads strict passes, Opus 5.5 behaves differently across effort settings, and XHigh does not always improve on Medium**.

The interesting conclusion is not a leaderboard for its own sake. It is that agents still struggle to maintain prior guarantees as requirements evolve. That is a concrete problem for anyone building and maintaining their own applications.

## What SlopCodeBench actually measures

The original paper, [*SlopCodeBench: Benchmarking How Coding Agents Degrade Over Long-Horizon Iterative Tasks*](https://arxiv.org/abs/2603.24755), was submitted in March 2026 by Gabriel Orlanski and colleagues and revised in May. It contains **36 problems and 196 checkpoints**. Each problem evolves: the agent writes a solution, receives new requirements, and modifies the same code repeatedly.

This setup addresses a blind spot in many coding benchmarks. A one-shot task does not reveal whether early architecture choices make later changes easier or harder. SlopCodeBench allows agents to choose their own internal structure, so maintenance problems have room to emerge.

The benchmark checks functional behavior and studies signals of **structural erosion** and **verbosity**. Structural erosion concentrates complexity in difficult-to-maintain areas; verbosity adds redundant code. Neither measure is a complete definition of code quality, but together they reveal more than an isolated snapshot of passing tests.

## The software-maintenance problem in miniature

Imagine a puzzle app with a board generator. First it must generate valid puzzles. Next we add difficulty settings. Later we require deterministic seeds. Finally, the daily challenge must be identical for every player.

Each new feature can pass its immediate tests while breaking something older: a board has no solution, a seed is no longer stable, or a configuration violates a previously guaranteed invariant.

A single-shot benchmark may celebrate the last requested change. SlopCodeBench asks whether **the promises made at earlier checkpoints still hold**.

That distinction reflects real development. Software is rarely written once and forgotten. It is extended, adapted, localized, fixed, and maintained. An implementation that looks impressive on day one but collapses under the third change is not a good foundation.

## Core success and Strict success are different

The October update reports two kinds of passing outcomes. **Core** requires the tests in a nonempty core category to pass. **Strict** requires all relevant categories, including **regression tests**, to pass.

This explains how the same model can achieve something like a 70% Core rate while remaining near 15% Strict. It may implement the latest requirement correctly yet break behavior from earlier stages.

Across the ten completed configurations in the report, Strict passes range from **24 to 32 out of 196 checkpoints**. Core rates fall roughly between **65.8% and 74.0%**.

The uncomfortable result is that meeting today's feature request and leaving the evolving program healthy are not the same achievement.

## The October 2026 snapshot

Here is a selection of figures **reported by HumanLayer**. The estimated costs refer to the **entire benchmark campaign**, not a subscription price or the price of a single coding task.

| Configuration | Strict | Strict rate | Estimated cost |
| --- | ---: | ---: | ---: |
| GPT-6 Astra XHigh | 32/196 | 16.33% | $758.62 |
| GPT-6 SOL Medium | 30/196 | 15.31% | $245.69 |
| GPT-6 Astra Medium | 29/196 | 14.80% | $261.05 |
| GPT-6.1 SOL Medium | 29/196 | 14.80% | $178.51 |
| Opus 5.5 Medium | 28/196 | 14.29% | $193.47 |
| Opus 5.5 XHigh | 25/196 | 12.76% | $817.04 |

This is an intentionally partial table. The [original report](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/benchmarking-new-models-on-slop-code-bench.md) includes Fable 5.1, GLM 5.3, and additional SOL settings.

Astra XHigh records the highest Strict count in this campaign: **32 of 196**, or **16.33%**. That is above the **14.8%** best-agent figure reported in the earlier original study, but it does not imply that autonomous software maintenance is a solved problem.

## Does XHigh really make coding worse?

The original update uses the phrase “xhigh considered harmful”. The underlying analysis is much more careful. In completed Medium-to-XHigh pairs, the author reports:

| Model | Strict Medium → XHigh | Estimated cost multiplier |
| --- | --- | --- |
| Opus 5.5 | 28 → 25 | 4.22x |
| GPT-6 SOL | 30 → 26 | 2.11x |
| GPT-6 Astra | 29 → 32 | 2.91x |

For **Opus 5.5** and **GPT-6 SOL**, XHigh produces fewer strict successes than Medium in this snapshot. For **GPT-6 Astra**, it produces more. Estimated cost rises in all three comparisons.

The responsible interpretation is **“more effort did not reliably buy more strict passes in these runs”**, not “thinking harder makes code worse.” The author ran **one campaign per model and setting**. That cannot distinguish the causal effect of effort from run-to-run variation.

It also means we should not overinterpret small rank differences. Two or three checkpoints are a narrow margin, especially when the benchmark is a single observed run.

## Methodology matters as much as the ranking

The report documents the pinned v1.0 task catalog, the standard *just-solve* prompt, seed 42, the *any-case* runner pass policy, and a Docker environment with Python 3.12 and uv. Each checkpoint builds on the code generated at the previous stages. Some problems have more checkpoints than others, and all checkpoints count equally.

Earlier write-ups used smaller subsets of three or six problems, so their headline scores cannot be compared directly with the complete 36-problem campaign.

Repetition is another limitation. Agents can be sensitive to minor differences in tool responses, retrieval, and generated plans. A single result per setting is useful exploratory evidence, but it is not a stable causal estimate.

If I were choosing an effort setting for a real project, I would want repeated runs on tasks resembling my own work rather than treating this table as universal proof.

## The most worrying result is about final software

The October analysis also looks at each problem's **final checkpoint**. For Astra XHigh it reports **3 fully strict final checkpoints out of 36**, plus **1,435 failed test cases** in the final-state evaluations, of which **1,178** are regression-category failures.

Those failed test cases are **not 1,435 independent bugs**. Multiple tests can point to one underlying problem, and the report explicitly cautions against that interpretation. Even so, the broad pattern matters: getting some intermediate checkpoints right does not mean the completed software remains functional.

In development, I care about the program that is left behind. An agent that builds today's screen while silently breaking yesterday's navigation has not finished the job.

## Messy code is part of the deliverable

One unusually useful choice in the report is to count much of the temporary and scratch code agents leave behind. If the agent pollutes the repository, that is part of the result a developer must maintain or remove.

The code-quality analysis covers **28 common problems**, not all 36, because the scanner could not fully measure files in eight problems. That boundary is essential when interpreting its numbers.

The scanner flags patterns and repeated code, then reports the share of source lines touched by at least one rule. Multiple flags on the same line are counted once. This is a **pattern-presence measure, not a universal score of good or bad code**.

Under this methodology, Opus 5.5 XHigh has **77.75%** of lines touched by slop rules, versus **94.25%** for Opus Medium. Both numbers are substantial, but they depend on the scanning rules.

They do **not** mean that 94% of the program is unusable. Some rules flag an entire function, and the researchers acknowledge that newer models may produce maintainability problems not represented by existing checks. We need to interpret the indicator rather than turn it into a moral judgment about every line.

## Lower complexity is not automatically better

The report also studies code size and complexity. An agent can lower mean cyclomatic complexity by splitting logic into many tiny helpers, even if the result becomes harder to navigate.

Fewer lines are not always better either. A compressed but cryptic function may be less maintainable than a pair of clear routines. Removing tests simply to reduce code volume would obviously harm the project.

For real maintenance, I would measure change effort, regression rates, duplicated decisions, understandable names, and alignment with the existing architecture. Linters provide useful signals, but they cannot replace contextual engineering judgment.

## How I would change my coding-agent workflow

My first takeaway is simple: **do not default to maximum reasoning effort and do not accept a feature merely because its new tests pass**.

For small fixes I would start with a medium setting, precise instructions, and existing checks. For complex refactors I might justify more reasoning, but I would validate its effect rather than assume it helps. In both cases, preserving previous behavior remains non-negotiable.

I would also ask the agent to review the final diff for irrelevant edits, scratch files, dead code, and abstractions introduced without a clear need. Cleanup is not cosmetic. Every unnecessary file becomes future maintenance work.

Most importantly, an agent's own final explanation should not be the verifier. Existing tests, independent CI, and focused visual checks should determine whether the result is acceptable.

## Building a small benchmark from real bugs

I do not need to reproduce all 36 problems to learn something valuable. I can pick three bugs from past applications and turn each into a sequence of evolving requirements.

Take a responsive component. First fix overflow. Then support longer translations. Next improve keyboard navigation. Finally ensure it still works across small mobile and desktop widths. Every new step must preserve previous acceptance criteria.

I would compare Medium and XHigh using the same harness and starting commit, then repeat the sequence several times. I would record diffs, costs, total time, tests, and regressions. Repetition is crucial: one run per setting cannot establish a robust trend.

If XHigh reliably improves final correctness for this kind of complex task, use it there. If it only costs more without improving outcomes, choose Medium. Let the actual workload decide.

## The harness belongs in the comparison

In [Harness Engineering: the wrapper wins](/blog/harness-engineering-wrapper-gana/) I explored how context and tools can change results as much as the model. [Harness²](/blog/harness2-recursive-agent-harnessing/) goes further by attempting to optimize the harness from evidence.

SlopCodeBench reminds us that these are not models acting in a vacuum. Results come from **complete configurations**: model, effort, prompt, runner, tools, and environment. A different verification policy can change regression behavior even when model weights stay the same.

That is why I do not treat the table as an intelligence ranking. I treat it as evidence that we need better agent evaluations and better protections against accumulated regressions.

## What this means for an indie developer

The promise of coding agents is saved time. But a hard-to-debug regression, an accidentally committed scratch file, or a needless abstraction can return that time debt with interest.

A good agent must both implement the change **and leave the code maintainable**. These are distinct goals. The October numbers also suggest that spending more on reasoning is not a substitute for sound testing and review.

The important choice is not finding a permanent winner among models. It is creating a development process that notices when the resulting code is no longer trustworthy.

## Why regressions happen even when the patch looks reasonable

A regression does not always come from an obviously foolish decision. Often, a local edit seems correct because the agent does not preserve a complete picture of previous contracts. It reuses a helper, changes a condition, and solves the new case while overlooking an exception that depended on the older behavior.

Architecture matters as well. If evolving requirements accumulate in one large function, each addition introduces another branch and increases the number of possible interactions. If each change creates another abstraction without removing previous duplication, the repository develops several competing sources of truth.

An iterative benchmark is valuable because it exposes these weaknesses over time. An agent may pass the first stage with an implementation that looks elegant, only to discover later that the next feature requires substantial restructuring.

The fix is not simply telling the model to “write cleaner code.” We need explicit invariants, tests that represent them, and an understanding that every change modifies an existing system of contracts. Better harness instructions can help, but independent verification remains necessary.

## Regression tests as durable project knowledge

Before changing a feature, I would record the existing behaviors that must stay stable. For a file-export tool, that could include fixtures for international characters, empty files, and edge cases. When adding a new export format, the tests should still exercise the old formats.

Every real bug should leave behind a regression test when practical. If the program once mishandled a date or lost a character, fixing the implementation without adding coverage means we may pay for the same failure twice.

Verification should also have layers. Unit tests check isolated logic. Integration tests expose incompatibilities between components. End-to-end tests verify complete workflows. Visual checks catch user-interface regressions that can be invisible to functional tests.

That does not mean rerunning the most expensive suite after every one-line edit. It does mean the **final acceptance process** must cover the guarantees connected to the change. The exact policy depends on the repository's existing automation and the risk of each feature.

## Total cost includes fixing the result

HumanLayer reports estimated costs for benchmark campaigns. In my own work, the total economic cost has additional components. A cheap run may require hours of human correction. An expensive run may be worthwhile if it reliably avoids regressions—or it may simply consume more resources without improving anything.

A useful mental model is:

~~~text
cost of verified task =
  agent execution cost
+ verification cost
+ human review time
+ correction of introduced defects
~~~

I do not need to assign an exact hourly rate to use this concept. Recording how long it takes to reach an acceptable result is already more informative than timing the model's first response.

This is why the gap between Core and Strict matters. A system can appear productive while transferring the cost of broken previous behavior to the developer who reviews and repairs its output.

## Stop conditions are part of agent quality

A coding agent may say “done” after running one favorable test. A real task needs an explicit completion condition: the requested behavior works, relevant checks pass, the diff has been reviewed, and no unrelated files changed.

When a check fails, the agent should not simply declare it unrelated. It should establish whether the failure predates the change, reproduce it where possible, and document what remains uncertain. Known failures require conscious decisions, not optimistic wording.

The ability to **stop honestly** is a quality feature too. I would rather receive “the migration appears correct, but upgrade from the oldest database version remains untested” than a confident claim of completion based on two successful unit tests.

SlopCodeBench supplies quantitative reasons for this caution. The final program can contain accumulated defects that are invisible in a quick description of the latest feature.

## Model effort should be workload-specific

Some coding tasks benefit from deeper planning. Others are simple enough that additional reasoning becomes overhead. Medium versus XHigh behavior may vary with language, project size, tool configuration, and the nature of the requirements.

I would therefore define task profiles rather than a permanent ranking of model brands. A tiny CSS fix, a large architectural migration, and the investigation of an intermittent failure may deserve different execution budgets.

Before switching to a more expensive model, I would check whether the agent has sufficient project access, coherent instructions, and useful verifiers. Otherwise, a smarter model may make the same class of mistake with greater confidence.

Benchmarks are partial maps of a much larger landscape. They help identify weaknesses and frame better questions. Final decisions should come from evaluations that reflect the actual risks of the software we maintain.

## What independent review can catch that tests miss

Tests are essential, but they are not perfect. A patch can pass the current suite while introducing an unnecessary dependency, changing a public interface silently, or making a future modification harder.

A final diff review should consider the scope of modifications, dependency changes, generated files, public API compatibility, documentation accuracy, and whether the new implementation reuses existing components. These are things an automated agent may overlook while concentrating on a benchmark's formal requirements.

For UI projects, I would add responsive and accessibility review. For databases, migration and data-integrity checks. For public websites, build output and privacy checks. The goal is not to maximize the number of checks but to protect properties that matter in that project.

If a coding agent completes the task with all checks green but leaves a tangled design, that is still important feedback. It should inform the next task's instructions and, eventually, the harness evaluation.

This is why I appreciate SlopCodeBench's attempt to study structural erosion. It invites us to look beyond whether the latest test passes and to ask what kind of codebase the agent leaves behind.

## A benchmark should change behavior, not merely opinions

The most productive response to these numbers is not to memorize the order of models in the table. It is to identify a failure mode and add a guard against it. If an agent repeatedly breaks existing behavior when new requirements arrive, the project needs better regression coverage and clearer final acceptance criteria.

I would also preserve examples of unsuccessful patches. A failed change often teaches more than a polished success story, especially if it reveals an assumption the agent made about a shared component. Those examples can become small evaluation tasks for the next model or harness configuration.

If the benchmark is revisited in a few months, I would compare results only after checking that the task set, scoring rules, runner, and effort definitions still align. Otherwise, a dramatic apparent improvement could reflect changed measurement rather than better maintenance performance.

A ranking is a snapshot. An engineering process is something we use repeatedly. The latter is where benchmark evidence earns its value: by helping us choose when to spend more reasoning effort, what to verify, and when to refuse to call a task complete.

## Conclusion

The October SlopCodeBench update provides interesting signals about Astra, Opus, and reasoning effort. Its deeper result is less glamorous: **accumulating regression risk remains a major weakness of coding agents**.

I would not turn “XHigh is harmful” into a universal rule. I would use these results to question automatic maximum-effort spending and to reinforce independent checks that protect earlier behavior.

### References

- [HumanLayer — October 2026 SlopCodeBench update](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/benchmarking-new-models-on-slop-code-bench.md).
- [Orlanski et al. — original SlopCodeBench paper](https://arxiv.org/abs/2603.24755).
- [SlopCodeBench website](https://www.scbench.ai/).
- [Harness Engineering: the wrapper wins](/blog/harness-engineering-wrapper-gana/).
- [Harness²: recursive agent harnessing](/blog/harness2-recursive-agent-harnessing/).

In software, victory is not the moment an agent says “done.” It is being able to return tomorrow without discovering that yesterday's fix quietly broke three other things.