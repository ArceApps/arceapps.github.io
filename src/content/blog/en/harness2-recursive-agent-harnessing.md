---
title: "Harness²: agents that improve their own harness"
description: "Understand Harness² from Google Research: recursive harness optimization, benchmark results, security limitations, and practical lessons for coding agents."
pubDate: 2026-10-22
lastmod: 2026-10-22
author: "ArceApps"
keywords: ["Harness²","recursive agent harnessing","Google Research","harness engineering","Codex"]
canonical: "https://arceapps.com/blog/harness2-recursive-agent-harnessing/"
heroImage: "/images/harness2-recursive-agent-harnessing.svg"
tags: ["AI Agents", "Harness", "Research", "Open Source"]
reference_id: "4c66a8a7-891c-4bf1-b6e6-0bf65d298a3d"
---

The model matters, but it does not work alone. An agent also depends on instructions, tools, memory, permissions, and evaluation. Together these pieces form its **harness**. What if, instead of tweaking that system manually, we could improve it using evidence from the agent's own executions?

[Harness²: Recursive Agent Harnessing for an Open World](https://arxiv.org/abs/2610.14224), submitted to arXiv on October 9, 2026 by Ruiyao Xu and colleagues, studies this possibility. The implementation lives at [google-research/harness2](https://github.com/google-research/harness2) under Apache 2.0. Although it appears in Google's research organization, the repository explicitly states that it is **not an officially supported Google product**.

In [Harness Engineering: the wrapper wins](/blog/harness-engineering-wrapper-gana/) I explored why an agent is more than its model. This paper asks a follow-up question: how can we demonstrate that changing the harness genuinely helps? And can evidence from one task improve the next without retraining the LLM?

## A harness is not just a larger prompt

The project names eight editable components: system prompt, guardrails, memory, tool guidance, subagents, skills, scripts, and plugins. They play different roles. Instructions guide decisions. Tools enable actions. Guardrails constrain them. Skills and scripts package procedures. Memory recovers information. Subagents distribute work.

A prompt change may do little if the model lacks the right tool. A skill that recommends running tests is useless without dependencies. Shell access without isolation may make an otherwise sensible agent dangerous.

In an indie project these problems are familiar. We adjust an instruction file, add a new check, or change the work sequence and hope the agent stops making the same mistake. The challenge is distinguishing real improvement from randomness or from several simultaneous changes.

## Open-world tasks are hard to score

Automated improvement often depends on clear rewards: a passing test, a correct answer, or a game score. Agents, however, encounter tasks nobody anticipated while designing their harness. A task may require fixing UI, reviewing documentation, navigating a web app, or coordinating unfamiliar tools.

Harness² addresses two problems. First, improve the harness for **the current task**, even without a ground-truth verifier. Second, extract lessons that can help on future tasks. It does this with **two connected recursions**.

## Task-level recursion: Propose–Probe–Compose

The task-level cycle is called **Propose–Probe–Compose**. The system proposes changes to the execution harness, probes those variants on the **same task**, and composes a revised harness based on observed behavioral contrasts.

~~~text
                  New task
                     |
                 Base harness
                     |
                   Propose
                /     |     \
           Variant A   B      C
                \     |     /
                    Probe
            compare executions
                     |
                   Compose
                     |
              Refined harness
~~~

This is more structured than simply asking an agent to reflect on a failure. Variants produce observable differences, which can guide revisions even without a perfect answer key.

Yet comparing behavior is not the same as proving correctness. One agent may sound more confident while remaining wrong. Another may finish faster by skipping a check. Independent evaluation remains vital.

The method supports **parallel** exploration, where several variants are tried, and **sequential** refinement, where the next revision builds on the previous one. More recursion can improve performance, but every extra attempt costs tokens, time, and tool executions.

## Harnessing-level recursion: persistent improvement

After each task, the second recursion updates a persistent **improvement harness** with adopted harnesses and evidence-supported lessons. The goal is to avoid starting from zero when a new task arrives.

~~~text
Task A -> candidates -> evaluations -> lesson A
                                         |
                                         v
                             Improvement harness
                                         |
Task B -> apply evidence -> new lessons
                                         |
                                         v
                             Persistent improvement
~~~

The interesting distinction is between *remembering that something worked once* and *turning it into a universal rule*. A strict file restriction may be helpful for one local bug and harmful when a fix requires editing a shared component.

That is why I would store **context, conditions, evidence, and a rollback path** with every adopted lesson. A plain sentence saying "always restrict edits" is not enough. We need to know which problem justified it and what competing options failed.

## What the benchmarks report

The authors report gains of up to **11.5 points on WorkBuddy-Bench**, **4.5 points on JobBench**, and **11.8 percentage points on LAB's partial pass rate** compared with base harnesses. The experiments include four model-harness configurations using **GLM-5** and **Gemini 3.5 Flash**.

"Up to" matters. These improvements are not guaranteed for every model or workload. More experiments also mean more expense: a higher score does not necessarily imply lower total cost.

The intriguing result is that performance reportedly improves **while model weights stay fixed**. For developers using hosted models, improving the environment is far more accessible than training a new model.

Benchmarks are still only part of the story. Maintaining software over time introduces regressions, historical state, and difficult trade-offs that do not always appear in a single evaluation.

## What you can actually run

The release supports **OpenCode and Codex** executors. Its local demonstration uses deterministic editors and real Python executions without model credentials. According to the README, the basic requirements include Linux, Python 3.12, and uv. The documented startup sequence is:

~~~bash
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install -e '.[render]'
harness2-demo --output runs/demo --k 2
~~~

These are upstream instructions, **not a claim that I personally executed the installation**. The demo illustrates the mechanics, not the full model-backed benchmark results. Those experiments need additional setup and dependencies depending on the suite.

The repository also documents parallel and sequential modes, using Codex as an alternative executor, and storing task summaries, adopted harnesses, reflections, and evaluations. All of that can support auditing, provided the surrounding environment is well configured.

## A critical security warning

The README states that **executor network access is unrestricted and the documented Codex executor runs with its sandbox disabled**. It also warns that publicly available grading rubrics could be reachable by the agent and contaminate benchmark results.

I would never point this setup directly at a private repository containing real secrets or deployment credentials. I would use a disposable directory, synthetic data, restricted networking, and explicit tool permissions.

Research environments exist to make experiments possible, not to provide a production-grade isolation guarantee. The ability to improve a harness should not include the uncontrolled ability to change the rules that supervise it.

## A small experiment worth running

Imagine maintaining a small web app with existing tests and CI. We want the agent to avoid unnecessary edits and catch responsive problems before opening a PR.

I would select four familiar tasks, each with a fixed starting commit. Then I would compare three harnesses: the current one, a version with tighter scope instructions, and a version with an additional visual verification step. Every run would use the same model, tools, and limits.

I would measure:

- whether the task actually meets acceptance criteria;
- how many regressions independent tests detect;
- how many unnecessary files are modified;
- total time, cost, and tool calls;
- sensitive actions attempted and how easy the diff is to review.

Adoption would be decided **outside** the agent. A harness that finishes sooner because it skips tests is not better. A more expensive version that writes prettier explanations is not necessarily better either.

## A responsive bug as an example

Suppose an agent must fix a header that wraps to two lines on mobile. One harness demands unit tests only. Another adds visual checks. A third forbids edits outside the initially suspected component.

If the second succeeds without regressions and the third fails because the actual issue lies in a shared container, the lesson is not "always use harness B". It is **verify layouts visually and choose edit boundaries based on the actual dependency structure**.

Store that lesson with its evidence. When a database bug appears, a screenshot rule may be irrelevant. Real improvement requires learning **when not to generalize**, too.

## The danger of optimizing the wrong score

Any optimizer can learn shortcuts that improve a metric while damaging the real outcome. A coding agent may pass a narrow test with brittle code, skip an expensive check, or exploit details of a public benchmark.

The defense is an **independent verifier**, held-out tasks, and a history of failed as well as successful attempts. The harness being optimized should not be able to rewrite the definition of success.

For a solo developer, a regression can waste an entire evening. I do not need an agent that congratulates itself. I need one that leaves the repository measurably better.

## How this differs from DeepSeek Harness

[DeepSeek Harness](/blog/deepseek-harness-everything-plugin/) is a runtime built around interchangeable plugins. That makes agent components flexible. Harness² investigates how to **search, test, and select** better combinations of those components.

One supplies the configuration space; the other supplies an optimization approach. Neither removes the need for external tests, bounded permissions, and human review.

The same applies to [DeepSeek Harness Desktop](/blog/deepseek-harness-desktop/): a good interface improves usability, but it does not identify the best tool and memory policy for a particular task.

## When the complexity is not justified

I would not use recursive optimization for a minor instruction change that a single test can validate. Nor would I introduce it into a project without measurable acceptance criteria.

Running candidates takes resources, and automatically edited instructions can become more confusing than the original problem. Before building infrastructure, ask whether a better skill, one CI check, or a small checklist would solve most of the issue. If so, choose that simpler route.

## Separate execution, optimization, and evaluation

Automatic improvement needs a strong boundary between roles. The **execution agent** solves a task inside a constrained environment. The **optimizer** proposes changes to instructions or harness configuration. The **evaluator** holds criteria and tests that neither of those agents should be able to edit during the experiment.

This division does not guarantee correctness, but it prevents a common failure mode: letting the system that generates a solution quietly redefine what counts as success. If a candidate decides to skip a costly regression test and declares itself the winner, the evaluation tells us little about software quality.

In a real project, the independent layer can include contract tests, unit tests, broken-link checks, accessibility checks, and a final diff review. Qualitative judgments can be part of the process too, but their criteria should be defined before seeing which candidate produced which output.

I would record every execution under stable identifiers: starting commit, harness version, model and effort setting, available tools, and complete outcome. Without those records, it becomes impossible to explain months later why an instruction was adopted.

## Prevent a memory full of contradictory rules

A persistent improvement harness creates a less obvious problem: it accumulates lessons that were useful in different circumstances. One says “explore fewer files”; another says “inspect every dependency before editing”. Either can make sense. Applied together without context, they may conflict.

I would store lessons as **conditional hypotheses**, not timeless commands. Every entry should identify the task type, initial conditions, tested modification, observed evidence, and possible negative side effects. Dates and tool versions matter because a recommendation that worked with one release can become obsolete.

The system should also detect conflicts. If two lessons recommend opposite actions, simply concatenating both into a system prompt is not a solution. We need to determine which one applies to the current task and which has stronger evidence from comparable situations.

And we need deletion. A memory that only grows can consume context, introduce contradictions, and increase costs. An optimizer should be able to propose retiring obsolete instructions, subject to the same independent verification as adding new ones.

## A concrete case: a database migration

Imagine a small app that stores preferences in a local database. The task is to introduce a new column while preserving installations created with earlier versions. The original harness describes schema editing but does not explicitly request testing a migration from old data.

Candidate A adds generic advice: “verify migrations.” Candidate B adds a specific testing procedure to create an older database and run the new migration against it. Candidate C proposes reorganizing the persistence layer to make future migrations easier.

Perhaps B discovers a regression the others miss. C may produce cleaner long-term architecture but touch too many files for the scope. The evaluation should consider not just whether the last test passes, but diff size, risk, time, and whether existing user data survives.

A useful reusable lesson would be: when a database schema changes, run a **migration test from an actual previous state**. That insight does not require adopting a complicated recursive system. It requires connecting a documented failure mode to a verifiable safeguard.

This is where Harness² can inspire a more grounded practice than generic prompt guidelines: each instruction should address a class of errors we can identify and measure.

## Exploration versus exploitation

Optimization systems face a classic trade-off. **Exploration** means trying novel approaches that might be better. **Exploitation** means using what already works. Harness² encounters that tension in its parallel and sequential recursion and in the way it carries lessons forward.

Exploring every possible variant for every tiny fix would be wasteful. Always reusing the historic best harness might prevent meaningful improvements from being discovered. For a solo project, I would choose a straightforward policy: very few variants for routine tasks, more experimentation only when a problem is recurring or sufficiently important.

Budgets should be defined upfront. Time, tool calls, monetary expense, and candidate count all need limits. If one configuration requires ten times as many resources for a marginal gain, it might not be a sensible default.

A flexible optimization system must not become an excuse to keep running until a flattering result finally appears.

## Keep internal experimentation separate from public assets

A private development repository may contain harness documentation, candidate prompts, execution logs, benchmark results, and notes on failed attempts. A public website should not automatically receive that material just because an agent created it.

A safe publishing workflow produces a clean public artifact from the private source. The optimizer's internal memory and experimental outputs stay private; only intended content and assets move to the public mirror.

The list of excluded files should itself be a protected configuration. An optimizer should not be able to change publication rules casually. Improving an agent's score while leaking internal documentation would be a catastrophic regression, regardless of the benchmark outcome.

This is an example of a constraint that belongs outside the harness optimization space. Privacy and release controls should not be editable simply because the agent is trying to perform better.

## What would convince me to adopt it?

I would compare three approaches on identical real tasks: a carefully tuned static harness, manual refinement by a developer, and recursively assisted optimization. The primary metric should be **total cost to reach a verified change**, not the score from the final winning probe alone.

I would count human effort as well. Preparing evaluations, reviewing proposed edits, and maintaining the optimization infrastructure all take time. A framework that saves tokens while doubling operational overhead may not help someone maintaining their own apps.

Finally, I would study performance over weeks. Do improvements from week one still help in week four? Do old lessons create regressions as the codebase changes? Can a poor rule be rolled back without losing the good evidence?

That longitudinal question separates an exciting proof of concept from a tool I would trust as part of my daily development environment.

## A harness improvement needs an expiration policy

One concern rarely appears on benchmark leaderboards: useful instructions can go stale. A tool's interface changes. A framework deprecates a command. A project's architecture evolves. An agent that remembers a formerly successful rule can start producing worse patches because the conditions that justified it no longer exist.

I would therefore attach a lightweight lifecycle to every reusable lesson. The record should include when it was observed, the repository revision, the relevant tool versions, the task class, and the evidence that supported adoption. When a major dependency changes, affected lessons should be re-evaluated rather than silently carried forward.

This does not require a complicated knowledge system. For a small repository, a short structured document and a few repeatable tasks may be enough. What matters is being able to answer, “Why is this instruction here, and is it still true?”

A useful optimizer should also be allowed to propose deletion. Removing an obsolete rule may improve performance more than adding yet another sentence to a crowded system prompt. Without pruning, recursive improvement risks producing an ever-larger harness whose components contradict one another.

## Goodhart's law in practical agent experiments

A process that repeatedly optimizes against the same set of checks can learn quirks of those checks. If a harness candidate learns that a particular output phrase earns a favorable evaluation, it might repeat that phrase without improving the underlying work. If the benchmark contains predictable files, a capable agent could exploit those details.

This is why I would maintain two different groups of tasks: **development examples** that the optimizer can study and **held-out acceptance examples** it does not inspect during optimization. I would also rotate in new problems based on actual regressions. A claimed improvement must survive outside the environment where it was discovered.

The independent evaluator should inspect outputs rather than merely trusting self-reported success. For code changes, that means executing tests from a clean environment and reviewing the diff. For documents, it means checking cited sources and concrete requirements. For UI changes, it may require rendering rather than accepting a screenshot description.

An honest result can be mixed. Perhaps the optimized harness succeeds more often but costs twice as much. Perhaps it improves routine tasks and degrades tricky migrations. Those are not failures of evaluation; they are the findings that make the evaluation useful.

## The operational budget belongs in the experiment design

Running multiple probes can consume substantial resources. Before any experiment, I would set a maximum number of candidates, tool calls, elapsed time, and cost. The run should stop when those limits are reached, even if an optimizer argues that just one more candidate might be better.

I would also include the time needed for a human to inspect the result. A configuration that wins a benchmark but produces difficult-to-review changes may not improve a solo developer's actual workflow.

This is especially important when experiments use an external coding model and a live tool environment. Every additional probe can make real requests, execute commands, and create files. The cost is not abstract. Controlled budgets and cleanup rules keep the search process proportionate to the task at hand.

The right question is not “How many times can a recursive agent improve itself?” It is “What is the smallest experiment that can demonstrate a useful improvement with acceptable risk?”

## The takeaway

Harness² does not prove that agents should govern their own instructions without supervision. It makes a narrower and more useful case: **harnesses can be measured and improved through contrasting executions and evidence-backed memory**.

I am more interested in the method than the promise of autonomy. Version the harness. Try controlled changes. Preserve the results. Evaluate independently. Revert failures. That discipline can make coding agents better even before adopting recursive optimization.

### References

- [Harness² paper on arXiv](https://arxiv.org/abs/2610.14224).
- [Official Harness² repository](https://github.com/google-research/harness2).
- [Harness Engineering: the wrapper wins](/blog/harness-engineering-wrapper-gana/).
- [DeepSeek Harness: everything is a plugin](/blog/deepseek-harness-everything-plugin/).
- [DeepSeek Harness Desktop](/blog/deepseek-harness-desktop/).

What is the first improvement you would measure in your harness? I would start with a failure that has already cost me time rather than with the most ambitious-sounding feature.