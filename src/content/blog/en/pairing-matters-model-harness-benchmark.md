---
title: "Pairing Matters: why the harness changes results"
description: "Explore Pairing Matters and its 1,800 coding-agent runs: compare models and harnesses, understand failure modes, and measure useful token efficiency."
pubDate: 2026-10-24
lastmod: 2026-10-28
author: "ArceApps"
keywords: ["Pairing Matters", "harness engineering", "SWE-bench Verified", "coding agents", "Qwen3-Coder", "OpenHands"]
canonical: "https://arceapps.com/blog/pairing-matters-model-harness-benchmark/"
heroImage: "/images/pairing-matters-model-harness-benchmark.svg"
tags: ["AI Agents", "Harness Engineering", "Benchmarks", "Open Source", "Coding Agents"]
category: ai-agents
reference_id: "a7d3e4b2-6f9c-4a01-8bd2-0ef61b734c98"
---

When a coding agent fails, replacing the model feels like the obvious next step. It searches the wrong files, edits the wrong function, repeats a command until the budget runs out, or confidently declares victory while the tests remain red. The usual reaction is to buy a smarter model, increase the context window, or raise the token budget. But one variable receives surprisingly little scrutiny: **the execution environment that decides what the model sees, what it can do, and when its work is finished**.

[*Pairing Matters: Performance, Failures, and Efficiency in Lightweight Coding Agents*](https://arxiv.org/abs/2610.32131), a research preprint by Lu Zhao, Christopher M. Poskitt, and David Lo released on **October 23, 2026**, puts that question to an unusually systematic test. The authors combine six open-source agent harnesses with three lightweight open-weight coding models on one hundred SWE-bench Verified issues. That produces **18 pairings and 1,800 graded runs**. Holding the model fixed, the difference between harnesses reaches **44 percentage points**. The paper goes beyond pass rates to examine *how* unsuccessful attempts fail and how much inference is spent per resolved task.

This is not another introduction to harness engineering. I already covered the basic architecture in [*Harness Engineering: The Wrapper Wins*](/blog/harness-engineering-wrapper-gana/). I also examined the idea of improving a harness recursively in [*Harness²: Agents That Improve Their Own Harness*](/blog/harness2-recursive-agent-harnessing/). The new question is more uncomfortable: **can we meaningfully call a coding model good without naming its harness, its workload, and its execution budget?**

![Pairing Matters results matrix: six harnesses, three models, and the number of resolved tasks in each of the eighteen combinations. Original visualization based on Table III of the paper.](/images/pairing-matters-model-harness-matrix-en.svg)

## A coding agent is not a model invocation

A language model consumes messages and returns output. A coding agent has a longer job: inspect a repository, find relevant context, run commands, modify files, read errors, revise a patch, and deliver something that can be verified. Between the original request and the final diff sits a sequence of decisions. Some belong to the model; many belong to the software surrounding it.

That surrounding system is the **harness**. It includes more than a system prompt. It defines the tools exposed to the model, the format of observations, execution limits, retries, state persistence, context management, sandbox boundaries, and completion criteria. Two harnesses can use identical model weights and still lead to radically different behaviors. One encourages careful search; another makes editing immediately convenient. One exposes structured tool errors; another gives the model a confusing terminal transcript. One detects repeated ineffective actions; another allows the same mistake until the budget expires.

For an independent developer, the implication is practical rather than philosophical. A model catalog does not tell you which agent will work best on your repository. The real unit of deployment is a **model–harness pairing**, together with its versions, configuration, tools, and task distribution. A leaderboard result is a property of that entire arrangement.

The contribution of *Pairing Matters* is not the claim that harnesses matter; previous studies and practical experiences had already made that point. Its contribution is to evaluate **every selected combination on the same task set**, retain the trajectories, and compare correctness, failure mechanisms, and efficiency.

## The experimental grid: six harnesses, three models, one hundred tasks

The harnesses are **OpenCode, OpenHands, mini-SWE-agent, SWE-agent, AutoCodeRover, and Agentless**. They do not implement six interchangeable user interfaces. The first four operate primarily through model-directed action–observation loops. AutoCodeRover uses structured retrieval and repair phases. Agentless follows a more predefined localization and patch-generation pipeline.

Their interfaces differ in consequential ways. mini-SWE-agent gives the model a Bash-centered environment. OpenHands uses a persistent execution sandbox with command and file-editing capabilities. OpenCode exposes structured tools for search, file reading, shell commands, and edits. SWE-agent has its own agent–computer interaction design. A model that has learned to issue certain kinds of tool calls may behave very differently depending on which interface it receives.

The evaluated models are **Qwen3-Coder-Next**, a mixture-of-experts model with 80 billion total parameters and roughly 3 billion active; **GLM-4.7-Flash**, with 30 billion total and approximately 3 billion active; and **Devstral-Small**, a dense 24-billion-parameter model. The study enabled explicit thinking for GLM and used non-thinking configurations for the other two. The authors wanted architectural diversity rather than a claim that one model represents all local inference.

The task set is a fixed **100-task subset of SWE-bench Verified**, a benchmark built from real Python repository issues and human-reviewed to reduce evaluation defects. The complete Verified dataset has 500 tasks. The authors sampled by repository and official difficulty category, using documented seeds and replacement procedures where needed. The sample deliberately gives smaller repositories more representation than the original benchmark distribution. Django accounts for 33 tasks; other projects contribute much smaller groups.

Six harnesses multiplied by three models multiplied by one hundred tasks gives **1,800 attempts**. Each pairing attempts each task once in the final analyzed dataset. That is a large, useful matrix, but it is not a repeated-seed experiment that can directly quantify run-to-run variance.

## What was controlled, and what was not

The researchers built a common runtime for preparing repositories, invoking harnesses, serving models, collecting patches, and grading outcomes. Models were served sequentially with **vLLM** on a single **NVIDIA H100 NVL** GPU; harnesses ran on a separate CPU host. All harnesses used an OpenAI-compatible endpoint. A shared proxy recorded model exchanges and token consumption. Candidate patches were evaluated with the official SWE-bench Docker grader.

The common completion-token threshold was **262,144 generated tokens per run**, accumulated across model calls. It was not a limit on the sum of prompt and completion tokens. That distinction becomes important later, because the efficiency metric includes both. Missing or empty patches counted as failures, and patches were filtered to exclude certain test and auxiliary file changes before grading.

These controls make the comparison far more useful than a casual collection of leaderboard screenshots. But **controlled does not mean identical in every respect**. Some harness-specific timeouts and execution limits were adjusted to make the study computationally feasible. The authors explicitly say those limits were not directly equivalent across harnesses. Lightweight adapters connected each harness to the serving endpoint while preserving its normal workflow.

There are also configuration-specific caveats. The evaluated AutoCodeRover configuration omitted a dedicated regression-testing phase, and the evaluated Agentless configuration generated a single patch candidate without internal test-based validation. The common external grader still judged the resulting patches. The scores therefore characterize **the evaluated deployments**, not every possible installation or later release of those projects.

That is a recurring theme of this article: a benchmark can establish that one particular pairing achieved a result without proving that its design will always be better.

## The full result matrix

Table III of the paper reports the number of resolved tasks out of one hundred for each pairing. Because the denominator is exactly one hundred, each number is also the resolution percentage on this subset.

| Harness | Qwen3-Coder-Next | GLM-4.7-Flash | Devstral-Small |
| --- | ---: | ---: | ---: |
| OpenCode | 61 | **51** | 44 |
| OpenHands | **63** | 42 | **54** |
| mini-SWE-agent | 57 | 49 | 22 |
| SWE-agent | 22 | **51** | 31 |
| AutoCodeRover | 19 | 28 | 27 |
| Agentless | 39 | 23 | 17 |
| **Solved by any harness** | **79** | **62** | **64** |

Source: [Table III in the original paper](https://arxiv.org/pdf/2610.32131), page 5. Bold values in the first six rows mark the highest score for each model; GLM has a tie.

The most striking comparison is Qwen with OpenHands versus AutoCodeRover: **63 versus 19**, a **44-percentage-point** gap. GLM ranges from 51 with OpenCode or SWE-agent to 23 with Agentless: **28 points**. Devstral ranges from 54 with OpenHands to 17 with Agentless: **37 points**.

These are **percentage points**, not relative percentage increases. A jump from 19% to 63% is a 44-point difference, not a 44% relative improvement. The distinction matters whenever research results are turned into headlines.

The ranking also changes. OpenHands leads for Qwen and Devstral, but not for GLM. SWE-agent resolves only 22 tasks with Qwen and 51 with GLM. Evaluating SWE-agent only with Qwen could make it look weak; evaluating it only with GLM would tell a different story. Neither observation is false. Both are incomplete.

This does **not** establish OpenHands as the best coding harness in general. It establishes the relative results of six selected harnesses, three selected models, and one hundred selected tasks under the specified conditions. The best observed single pairing resolves 63 tasks, not 63% of every software task a developer might encounter.

## The row no individual harness can claim

The last row is not a seventh harness. It is the **union** of tasks resolved by at least one of the six harnesses for a fixed model. Qwen's union reaches **79**, even though its strongest individual pairing resolves 63. GLM's union is 62 against a best individual result of 51. Devstral's is 64 against 54.

That tells us the harnesses do not succeed and fail on exactly the same issues. But it is easy to overinterpret. The union includes **six attempts per task**, one per harness. It does not prove that using six different harnesses is better than making six independent attempts with one harness. The paper explicitly acknowledges that run-to-run variability and harness complementarity cannot be separated by this design.

A second distinction is between **coverage** and **consistency**. Qwen has the broadest union at 79 tasks, yet only five tasks are solved by all six harnesses. GLM has a smaller union of 62, but fifteen tasks are solved by every harness. Devstral has 64 tasks in its union, including sixteen solved by exactly one harness. A broad union is not the same thing as stable behavior across environments.

For a solo developer, the cautious takeaway is that a **fallback harness might add value** when the default pairing gets stuck. It does not follow that every issue should be sent through six agents. The useful question is which failure signals justify escalation, how much the second attempt costs, and whether it resolves genuinely different cases.

## Why pass rates alone hide the interesting failures

The authors analyzed **1,100 unsuccessful runs** and assigned each to one of five evidence-based failure categories. The labels are applied in a defined priority order, using trajectories, patches, logs, and grading results. The result is not simply a sentiment analysis of model output.

The largest category is **no-progress loops or budget exhaustion**, with **386 failures (35.1%)**. Next are **wrong or incomplete fixes**, **362 (32.9%)**. **Insufficient validation** accounts for **141 (12.8%)**. **Fault mislocalization** accounts for **129 (11.7%)**. Finally, **exchange breakdowns** account for **82 (7.5%)**. These figures sum to 1,100, and the percentages refer to **unsuccessful attempts**, not to all 1,800 runs.

The distinction matters because two pairings with identical success rates can require entirely different interventions. One may waste its budget searching the same files. Another may locate the right function, produce a plausible patch, and fail the reference tests. A third may never submit a patch because a tool exchange breaks. The end result is identical—unresolved—but the engineering work needed to improve it is not.

The taxonomy also has limits. A failure can have multiple contributing causes, yet the method assigns one primary label according to ordered criteria. The authors document review and adjudication procedures but acknowledge interpretive uncertainty, particularly when distinguishing insufficient validation from an incorrect fix. Treat these labels as structured diagnostic evidence, not a perfect causal explanation.

## Five failure types, five engineering responses

An **exchange breakdown** occurs when an unrecovered interaction or environment problem prevents a valid repair from being completed or submitted. The model may request a tool that never answers, the sandbox may fail, or a completed patch may be lost. Before buying a better model, inspect the tool contract, response format, permissions, retries, and artifact handling.

A **no-progress loop** happens when execution stalls, repeats ineffective actions, or runs out of steps or tokens before finalizing a repair. Useful questions include whether the agent can recognize repeated commands, whether it knows what changed, and whether the harness has a meaningful stop-or-switch policy. Increasing the budget can simply buy a longer loop.

**Fault mislocalization** means the submitted patch does not modify any file modified by the reference patch. That is a coarse but useful signal that the agent worked in the wrong place. Better repository navigation and structural retrieval may help, although no retrieval system can rescue every poor hypothesis.

**Insufficient validation** describes a repair presented as successful without checks that adequately support the claim, or despite contradictory evidence. This suggests independent acceptance tests, a clear verification contract, and honest reporting of failures. A prompt that says “run tests” is not enough if the tools cannot run them or the harness does not enforce the result.

A **wrong or incomplete fix** is a finalized patch that reaches at least one reference file but still fails the benchmark tests. Here the model may lack understanding of the behavior, overlook edge cases, or produce an incomplete implementation. A different harness might help, but some failures really do require stronger reasoning or human review.

The lesson is to diagnose before optimizing. Five distinct failure mechanisms should not be treated with the same generic instruction to “try harder.”

## One model, radically different failure profiles

The clearest example involves Qwen3-Coder-Next. Among **failed SWE-agent runs with Qwen**, **95%** were classified as no-progress loops or budget exhaustion. Under AutoCodeRover, the share was **64%**; under OpenCode, **51%**; under OpenHands, **32%**. The same model's dominant failure mechanism becomes much more or less prominent depending on the harness.

The relationship works in the opposite direction too. Hold SWE-agent fixed and switch models: the loop-or-budget category accounts for 95% of Qwen's failures, **35%** of GLM's, and **25%** of Devstral's. A claim that “SWE-agent always loops” would be as misleading as “Qwen always loops.” The specific pairing matters.

Model-level aggregates provide additional context. For Qwen, **193 of 339 failures**, roughly **57%**, are progress-related. For GLM, wrong or incomplete fixes lead with **128 of 356 failures**, about **36%**. Devstral's **405 failures** are spread more broadly, including 141 wrong or incomplete fixes, 82 insufficiently validated attempts, and 77 localization errors. These tendencies are real within the dataset, but the harness changes their relative weight.

Always inspect the denominator. Saying “95% of failures are loops” does **not** mean “95% of tasks fail because of loops.” It means that, among the attempts that already failed for that pairing, nearly all received that label. Without the number of successful attempts, a failure-profile percentage can be badly misread.

## Tokens per resolved task: count the unsuccessful attempts too

The paper's third research question concerns inference efficiency. The authors add up **prompt and completion tokens across all attempts for a pairing**, successful and unsuccessful, and divide by the number of tasks resolved. They call the result *charged tokens per resolved task*.

~~~text
tokens_per_resolved_task =
    sum(prompt_tokens + completion_tokens for ALL attempts)
    / number_of_resolved_tasks
~~~

The word **all** is the important part. If an agent cheaply solves ten issues but spends enormous amounts of inference on ninety failures, averaging token use only across its successful runs hides the real expenditure. Counting failures makes the metric a more realistic description of what it takes to obtain a verified success.

For Qwen, among iterative harnesses, the figure ranges from **4.8 million tokens per resolved task with AutoCodeRover** to **87.8 million with SWE-agent**. OpenHands records 15.6 million and OpenCode 26.3 million. The difference is dramatic, but AutoCodeRover solves only 19 tasks while SWE-agent solves 22. The lowest tokens-per-success value is not automatically the best option when resolution coverage and task importance also matter.

Agentless reports much smaller values, around 0.1–0.2 million tokens per resolved task, because its workflow uses a fundamentally different, fixed pipeline with very few model calls. The paper separates the analysis of iterative harnesses for a reason. Comparing a fixed patch-generation procedure with a long interactive loop as though they were identical processes can be misleading.

This is **token volume, not money**. Provider prices, caching, local GPU utilization, quantization, electricity, and infrastructure all affect monetary cost. A local model may not incur a per-token invoice while still occupying scarce compute and time.

## Fewer model calls do not guarantee fewer tokens

The study also measures median model calls per run. With mini-SWE-agent, Devstral needs a median of **62 calls**, versus **92 for GLM**. Yet Devstral consumes **9.9 million tokens per resolved task**, while GLM consumes **6.2 million**. A smaller call count can coincide with worse token efficiency because calls vary in context length and because failed attempts contribute to the denominator-based metric.

Across the five iterative harnesses, Devstral has the lowest median number of calls in all five. Qwen has the highest in four. These are useful tendencies, not a substitute for measuring the actual pairing. The same model can have different context growth, tool-use patterns, and retry behavior depending on the environment.

For practical instrumentation, counting API requests is therefore insufficient. A meaningful trace should record prompt tokens, completion tokens, cached tokens where available, elapsed time, reason for termination, patch status, and validation results. Without those signals, you cannot tell whether a long execution was productively exploring alternatives or merely repeating itself.

The paper also includes two external frontier-model reference points, using OpenHands on the same hundred tasks. Their token counts are **estimated from public trajectories**, whereas the 18 lightweight pairings use proxy-metered values. The authors warn that those estimates and deployment differences limit the comparison. It would be misleading to turn the chart into a definitive monetary-cost ranking.

## What the experiment cannot establish

The first limitation is **no repeated runs** for the same pairing and task in the analyzed dataset. That prevents direct estimation of stochastic run-to-run variance. Small score differences may not be stable; large ones deserve attention but should still be replicated before guiding an expensive decision.

The second limitation is **sampling**. The one hundred tasks were selected from the 500-task SWE-bench Verified dataset, with a distribution designed for repository coverage rather than a perfect miniature of the full benchmark. Their percentages are results on this subset, not estimates of the complete benchmark's leaderboard scores.

Third, the **domain is narrow**. These are Python repository issues. The study does not measure Kotlin, Android UI, frontend accessibility, database migrations, documentation editing, or ongoing product maintenance. A pairing that excels at localized Python patches might be poor at a multi-module mobile feature.

Fourth, **harness-specific execution limits and timeouts** are not equivalent. Some observed differences could be affected by those limits rather than the conceptual design alone. Fifth, the **serving setup** uses vLLM and an H100 NVL with model-specific parsing and sampling. Results may change with consumer GPUs, aggressive quantization, smaller context windows, different tool parsers, or higher latency.

Sixth, **benchmark success is not software quality in the broad sense**. Passing reference tests does not certify maintainability, readability, security, or the appropriateness of a change for a real product. The paper explicitly discusses these threats to validity. A benchmark can be useful without being a complete definition of good engineering.

Finally, the study is a **preprint**, not an immutable industry standard. Its released artifacts make it inspectable, but its results still need replication across more models, tasks, hardware, and versions.

## A small evaluation for a real indie project

I would not try to reproduce 1,800 runs on a personal machine. I would build a compact evaluation set from the kinds of work that actually occur in a project: a UI regression, a logic bug, a dependency update, a failing test, and a change spanning several modules. The goal would be to choose a productive pairing for **my repository**, not to publish a universal ranking.

The first step is to freeze conditions: initial commit, issue statement, model version, harness version, tools, permissions, sampling settings, token budget, timeout, and network policy. If one harness can search external documentation and another cannot, the comparison is no longer about the harness alone.

The second step is to define **independent acceptance criteria** before running anything. They might include existing tests, a visual check for UI changes, a diff review, no unrelated file edits, and a ban on modifying tests to manufacture a passing result. Acceptance must not depend on how confidently the agent describes its work.

The third step is repetition. If resources allow, run each task several times per pairing. This does not remove all uncertainty, but it begins to separate stochastic variation from systematic differences. Five representative tasks with repeats can be more informative than one hundred unrelated tasks.

I would record **success rate, tokens per resolved task, elapsed time, unnecessary edits, failure category, and human review effort**. That last variable is often absent from public benchmarks, yet it determines whether the agent actually saves a solo developer time. A patch that technically passes tests but requires an hour of cleanup may be a poor result.

## A minimal record format

You do not need a heavyweight observability stack to start. One JSONL record per attempt can capture the essential fields. This is an **illustrative schema**, not a real OpenCode API or a reproduction of the authors' software:

~~~json
{
  "task_id": "bug-014",
  "repo_commit": "initial-state-sha",
  "model": "model-and-version",
  "harness": "harness-and-version",
  "seed": 2,
  "resolved": false,
  "failure_type": "no_progress",
  "model_calls": 41,
  "prompt_tokens": 182400,
  "completion_tokens": 24100,
  "wall_seconds": 740,
  "patch_sha256": "patch-hash",
  "validation": "failed"
}
~~~

With records like these, tokens spent on failures can no longer disappear from the efficiency calculation. A short Python function demonstrates the definition:

~~~python
def tokens_per_resolved_task(runs):
    resolved = sum(bool(run["resolved"]) for run in runs)
    if resolved == 0:
        return None  # No meaningful denominator.
    total = sum(
        run["prompt_tokens"] + run["completion_tokens"]
        for run in runs
    )
    return total / resolved
~~~

This example **has not been executed against an ArceApps repository** and is not presented as an original experiment. It simply makes the metric auditable. A real implementation should validate its input schema, account for retries, distinguish cached tokens, preserve configuration versions, and avoid publishing private code or secrets in telemetry.

I would also store the **stop reason**. “Unresolved” is not an actionable diagnosis. A timeout, a malformed tool response, and a wrong patch require different fixes. If the harness cannot expose these distinctions, its lack of observability is already a meaningful operational limitation.

## Diagnosing a loop instead of paying for a longer one

Imagine an agent that has spent fifteen minutes opening the same files, modifying the same condition, and rerunning a test that fails in exactly the same way. Two easy reactions are to increase the token limit or tell it to think harder. Neither is guaranteed to help. The study suggests inspecting the trajectory rather than relying only on the final outcome.

Start with observable signals: repeated tool calls with nearly identical arguments, no useful diff changes, no new test outcomes, or growing token use without a new hypothesis. A progress detector could interrupt the attempt and request a concise, verifiable account of what has been tried. If nothing changes, the harness can stop the attempt and classify it rather than continuing indefinitely.

Then ask whether the underlying issue belongs to the **model** or the **tool contract**. Is a tool returning ambiguous errors? Is the output truncated? Is the model missing a way to run a necessary test? Has context become saturated with repeated terminal output? Correcting a concrete defect is better than adding ten generic warnings to a system prompt.

Finally, change **one thing at a time**: search tools, no-progress thresholds, state summaries, or independent verification. If you change every component simultaneously and performance improves, you will not know why. [Harness²](/blog/harness2-recursive-agent-harnessing/) studies structured harness adaptation; *Pairing Matters* provides a reminder that improvement must be measured on the **specific pairing**.

## Choosing between accuracy and efficiency

A difficult decision appears when one pairing resolves more tasks but spends far more inference. Consider two hypothetical configurations: A solves seven out of ten issues using 900,000 tokens; B solves six using 300,000. A has a higher success rate; B uses fewer tokens per success. Neither automatically wins.

For critical tasks with expensive human review, A might be worthwhile. For routine fixes, B could offer a better balance. If A and B solve different issues, **selective escalation** might outperform either alone. But that strategy has its own cost: detecting when to escalate, managing multiple workspaces, and reviewing the combined output.

The paper does not settle this product decision. It provides a better way to frame it. **More tokens are not evidence of more useful work**, and fewer tokens are not proof of a better engineering outcome. Resolution, coverage, failure type, review burden, and deployment cost all matter.

In a personal development workflow, the scarcest resource may be **attention**. A cheap execution that produces a fragile, hard-to-review patch can be worse than a more expensive one with a clear diff and trustworthy tests. No figure in the paper directly measures that burden. This is why I would resist publishing a simple “best harness” leaderboard from its results.

## What about running models locally?

The paper is particularly relevant to people considering self-hosted coding agents. Qwen3-Coder-Next and GLM-4.7-Flash use sparse mixture-of-experts architectures, activating only part of their total parameters for each token. But **active parameters are not the same as stored weights**. A model with three billion active parameters does not necessarily fit in the memory footprint of a dense three-billion-parameter model. Devstral-Small is dense, which introduces a different hardware profile.

The authors used an **H100 NVL**, not a consumer GPU or a home mini PC. Their scores cannot be transplanted directly to heavily quantized inference, reduced context windows, or thermally constrained hardware. Latency can change how many steps fit before a timeout; a different tool-call parser can change error rates; memory limits can force different context-management policies.

The methodological lesson still travels well. Before dismissing a local model as incapable of coding, test whether the harness gives it a usable environment. Before trusting an impressive benchmark, ask which tool interface, version, budget, and hardware produced it.

A sensible home experiment might begin with **two harnesses, one model, and five tasks**. If the differences justify further investigation, add another model and repeated attempts. Starting with all eighteen combinations may cost more engineering time than the agent is supposed to save.

## The causal question remains open

*Pairing Matters* does **not** prove that changing a particular harness will always improve performance. It compares existing configurations. It does not prove that six different harnesses outperform six repeated attempts with one. It does not prove that Python benchmark rankings predict Android development performance. It does not prove that the most token-efficient pairing is the cheapest in euros, or that passing tests implies maintainable code.

Nor does it isolate which internal harness component causes each observed difference. Prompts, tools, retry policies, context selection, execution limits, and model-specific behavior can interact. Establishing causality would require **ablation studies**: change one component, hold the others fixed, and repeat the same tasks enough times to estimate variation. The authors explicitly identify systematic interaction diagnosis as a direction for future work.

That is not a flaw to hide. It is the boundary between **measuring an effect** and **explaining its mechanism**. The paper's strongest evidence concerns the existence and size of observed pairing differences, supported by a complete factorial matrix and released records. Its evidence is weaker for universal prescriptions about how to modify any arbitrary harness.

A responsible technical article should keep those two levels separate. Otherwise a nuanced experiment becomes a marketing slogan.

## A practical decision protocol

When an agent fails in my development workflow, I would preserve the diff, tests, termination reason, and available trajectory. I would classify the dominant symptom: exchange breakdown, no progress, mislocalization, insufficient validation, or incorrect repair. If a tool failed, I would fix the environment first. If the agent looped, I would test a progress detector. If it produced a wrong patch, I would consider another model or a human review.

Then I would rerun the same task with an alternative pairing **without changing the acceptance criteria**. I would compare the files touched, tests executed, context consumed, and termination path. One win would be a clue, not proof. I would repeat before turning the observation into a general rule, and I would document the versions and limits so that a future run can be compared fairly.

I would also prefer to **reuse existing CI and tests** rather than adding another agent to judge whether the first agent succeeded. A deterministic check that already works is often more trustworthy than a new layer of language-model judgment. If the new harness machinery requires more maintenance than the time it saves, it is not an improvement for an indie project.

This connects directly to [*SDD + TDD: From Requirement to Verifiable Acceptance*](/blog/sdd-tdd-acceptance-loop/). A task needs independent success criteria, and an execution should end with evidence rather than a confident statement. The harness can make that process smoother; it cannot replace the judgment of the developer responsible for the code.

## References and reproducibility

- **Primary paper:** Lu Zhao, Christopher M. Poskitt, and David Lo, [*Pairing Matters: Performance, Failures, and Efficiency in Lightweight Coding Agents*](https://arxiv.org/abs/2610.32131), arXiv:2610.32131, October 23, 2026. Tables III, IV, and V support the quantitative analysis above.
- **Authors' released materials:** [lisazhao-gz/pairing-matters](https://github.com/lisazhao-gz/pairing-matters). The paper reports that the repository contains the 1,800 graded runs, trajectories, patches, failure labels, configurations, and analysis scripts.
- **Benchmark context:** [SWE-bench](https://www.swebench.com/) and [the SWE-bench Verified methodology](https://openai.com/index/introducing-swe-bench-verified/), including the limits of test-based issue resolution.
- **Evaluated harnesses:** [OpenCode](https://github.com/anomalyco/opencode), [OpenHands](https://github.com/All-Hands-AI/OpenHands), [mini-SWE-agent](https://github.com/SWE-agent/mini-swe-agent), [SWE-agent](https://github.com/SWE-agent/SWE-agent), [AutoCodeRover](https://github.com/nus-apr/auto-code-rover), and [Agentless](https://github.com/OpenAutoCoder/Agentless).
- **Related ArceApps reading:** [Harness Engineering](/blog/harness-engineering-wrapper-gana/), [Harness²](/blog/harness2-recursive-agent-harnessing/), and [SDD + TDD](/blog/sdd-tdd-acceptance-loop/).

## The takeaway I will actually use

The tempting headline is “the harness matters more than the model.” **That is not what the research proves.** It shows something more useful: observed capability, failure behavior, and inference efficiency belong to the **pairing**, not to either component in isolation. The same model can perform very differently in another environment. A harness that leads with one model can fall behind with another. And an agent that solves more issues can still consume an unreasonable amount of inference.

The next time I see an impressive coding-agent score, I will look for the missing details: **which model, which harness, which tasks, which version, which limits, which costs, and what evidence?** Without those answers, I do not yet have an evaluation. I have a nice-looking number.

And when an agent gets stuck in my own workflow, before paying for more intelligence I will first ask whether the environment is helping it use the intelligence it already has.