---
title: "OpenRouter: control cost and routing across agents"
description: "Learn to combine OpenRouter and OpenCode with per-task budgets, model routing, local inference, cost metrics, and safe fallback policies."
pubDate: "2026-11-17"
lastmod: "2026-11-17"
author: "ArceApps"
keywords: ["OpenRouter","model routing","agentes IA","cost control","OpenCode","fallback"]
canonical: "https://arceapps.com/blog/multi-agent-routing-cost-control/"
heroImage: "/images/multi-agent-routing-cost-control.webp"
tags: ["IA","Agentes","OpenRouter","Costes","OpenCode"]
category: "ai-agents"
reference_id: "30ba592f-4b9f-42da-8cf1-348a593f6f26"
---

> **“Agent orchestration without vendor lock-in” series, part 5 of 5.** We mapped the system from [ChatGPT Desktop](/blog/chatgpt-desktop-agent-orchestration/) and [Claude Desktop](/blog/claude-desktop-external-coding-agents/), distinguished [MCP, ACP, and A2A](/blog/mcp-acp-a2a-agent-protocols/), and designed a [multiagent workflow ending in a PR](/blog/multi-provider-coding-agent-workflow/). One essential question remains: **what does all this cost, and when should each executor be used?**

## Multiagent systems can cost more and behave worse

The usual promise sounds simple: an inexpensive model classifies work, another writes code, a stronger one reviews it, and a fallback provider handles failures. The diagram is attractive. Reality includes tools that repeatedly ingest context, reviewers that find no new problems, retries that duplicate token spend, and models that answer quickly but struggle with tool use. Without measurement and constraints, orchestration can multiply cost and uncertainty.

My starting point would be to avoid automatic routing for the first few days. Configure one default path, record each task, and define conditions that justify escalation. If we do not know the baseline cost of a simple task, we cannot show that a five-model architecture is more efficient. Published provider prices change; this article teaches a comparison method rather than offering a price table that will be stale next month.

We must also separate three decisions. **Executor selection** decides which coding agent carries out the task: OpenCode, Claude Code, or another program. **Model selection** chooses the inference system used by that agent. **Provider or endpoint selection** decides where a request to a model is served, for example through OpenRouter's routing controls. One task can involve all three decisions. Compressing them into a single “cheapest model” rule is dangerous.

## A router is not an orchestrator

OpenRouter offers a model access layer and documented routing controls across providers, including preference, price, availability, and fallback. This helps select where inference takes place. It does not, by itself, create a Git branch, wait for CI, or preserve the task semantics of work delegated to OpenCode. Job orchestration needs another component.

OpenCode supports multiple model providers, including OpenRouter. It can use different models for different needs when configured appropriately and when the required capabilities exist. Model choice affects tool compatibility, context size, quality, latency, and cost. Two models with similar prices do not necessarily behave identically in a long coding-agent loop.

In our design, the coordinator selects a **work profile**, the executor maps that profile onto an allowed model, and OpenRouter may choose which provider serves the request under its policy. This separation makes debugging possible: a tool failure is not automatically a provider outage; a context-size problem is not necessarily an executor bug.

## Begin with three profiles, not fifty models

I would not start with a catalog of fifty model names. Three profiles are sufficient: \`analysis\` for read-only exploration, \`implementation\` for code changes, and \`review\` for inspecting diffs. Each profile defines an allowed executor, an actual model selected from the current catalog, cost limits, and a permissions policy. Profile names stay stable even when model identifiers change.

~~~yaml
profiles:
  analysis:
    executor: opencode
    tools: read-only
    max_attempts: 1
  implementation:
    executor: opencode
    tools: propose-patch
    max_attempts: 1
  review:
    executor: claude-code
    tools: read-only
    max_attempts: 1
~~~

This YAML is **conceptual coordinator configuration**, not a valid OpenCode or OpenRouter settings file. Real models, provider credentials, and budgets belong in separately authorized configuration. The goal is to prevent a conversational client from inventing a high-cost destination in plain text.

Profiles should capture operational constraints rather than only naming a model. A review needs read access to a specific commit, implementation requires an isolated branch, and research may need web access without filesystem writes. The cheapest route that violates any required capability is not an acceptable alternative.

## Configuring OpenRouter in OpenCode

Current OpenCode documentation describes connecting to OpenRouter and selecting models from a catalog. Follow that procedure and verify model IDs currently available, rather than copying outdated provider syntax from a different release of OpenCode.

~~~text
OpenCode
  /connect  →  OpenRouter  →  credentials stored outside Git
  /models   →  choose an available model
~~~

An initial test should create a read-only task with a known model, identify the provider when reported, and record observed usage on the relevant platform. Then check whether the model supports the tool calls required by the agent. Being able to answer chat questions is not proof that a model can complete a long coding workflow with shell and file tools.

Never paste an OpenRouter key into a chat transcript, versioned file, or public frontend. Secrets should live in the executor environment with appropriate rotation and scope. The orchestrator can report “provider configured” without returning the credential.

## The minimum cost formula

A basic estimate separates input and output tokens, multiplied by their corresponding prices. Context-cache usage, images, externally billed tools, and special rates need separate treatment. When pricing is quoted per million tokens, the general formula is:

~~~text
model_cost = (input_tokens × input_price +
              output_tokens × output_price) / 1,000,000
~~~

Other costs belong in the full calculation: executor infrastructure, storage, paid tools, human time, and repeated calls after failures or reviews. The cost of one model response is not the cost of the job. A task may include twenty agent turns even if the user submitted only one line of instructions.

I would not treat usage reported in a model answer as definitive billing data without checking available provider records. Caching, reasoning tokens, and other categories may be represented differently. A fair comparison normalizes categories and acknowledges measurements that are unavailable.

## Set budgets per task, not only monthly limits

A monthly cap helps, but it cannot guarantee one runaway task will not consume most of the allowance. We need a **per-job budget** and a reserve for operations already under way. The coordinator should assign a maximum, account for observed usage, and decide whether another attempt is affordable or requires approval.

Budget checks happen before the next call, while final billing information may arrive later. A limit based on observed spend is therefore not always a mathematically exact spending ceiling. For sensitive budgets, complement accounting with provider-level limits, maximum iteration counts, and conservative stop conditions.

I would not let an agent endlessly review its own patch and send it back for another rewrite. Set one implementation round, one independent review, and perhaps one bounded automatic correction before requiring human intervention. That constrains both token usage and the risk of drifting away from the goal.

## Model routing is different from provider routing

OpenRouter documents provider selection within a model, including strategies based on price, latency, availability, and fallbacks. There may also be options for alternate models. These are different decisions. Using a second provider that serves the same model is not necessarily equivalent to selecting a different model family, and operational behavior may vary.

Default routing can select endpoints according to provider health and cost; explicit configuration can prioritize or restrict destinations. For private source code, an allowed provider's data-handling requirements must take precedence over marginal savings. “Cheapest” should not be the sole criterion when a service may retain information that must remain private.

I would also keep inference routing separate from switching executors. An OpenCode session hitting a temporary provider error may safely retry within the same session in some circumstances. Migrating the task to Claude Code means transferring state and artifacts. We cannot assume another agent will see exactly the same context automatically.

## A fallback must not duplicate code changes

A naive fallback sees a timeout and launches another session that repeats the task. If the first session was still alive, we now have two processes potentially editing files. For reading, that may be tolerable. For implementation, it creates conflicts and extra cost. The correct rule is **reconcile before retrying**.

The coordinator queries the job state, checks the branch and executor process, and only then decides whether a retry is safe. If the failure was a transient provider request error and the agent retains state, another request might suffice. If the session is unusable, recover the last confirmed artifact and restart from a known point.

I would not enable endless provider fallback. Set a maximum attempt count and a list of recoverable errors. Authorization failures should not trigger a new model. Context-limit errors require summarization or task splitting. A failed test requires correcting the code, not swapping endpoints and hoping for better luck.

## Cache, reuse, and shorter handoffs

Lower costs do not always require a weaker model. Workflows repeatedly sending the same instructions, documents, files, or project context may benefit from provider-supported caching. But cache hits and discounts are not guaranteed; policies, retention windows, and pricing evolve. Measure actual savings from usage records.

Handoffs between agents also matter. Giving a reviewer the diff, contract, and test results is often cheaper and more precise than copying the implementer's complete conversation. It also reduces data exposure. A disciplined architecture may save more than an elaborate automatic model-selection rule.

Ask whether another agent is required at all. A tiny task may not need a separate planner. A risky change may justify a second reviewer despite the extra cost. The objective is deliberate spending, not treating every action as a mandatory multi-model ceremony.

## Local models have costs too

Running a model locally may reduce per-request API charges, but it consumes electricity, RAM, maintenance effort, inference time, and potentially quality. If a local model is too slow or unreliable with tools, apparent monetary savings may turn into supervision overhead. Before adding it to an automatic route, verify that the chosen agent and model can complete representative tasks.

Privacy changes too. Local inference can help keep data on the developer's machine, but only if the complete workflow—tools, logs, telemetry, and dependencies—respects that boundary. A local model connected to tools that upload content to external services does not make the system private by default.

I would first test small local models on reading and classification tasks. More complicated code changes should go through models with verified tool behavior, regardless of whether they are local or remote. This is not prejudice against small models; writing code has side effects and therefore needs reliability.

## An auditable usage record

For every task, store an ID, profile, executor, model, chosen provider if the API reports it, timestamps, retry count, reported tokens, estimated or billed cost, and outcome. Clearly distinguish \`estimated_cost\` from \`billed_cost\` and record the source of each measurement. If a provider does not report something, leave the field unknown instead of inventing a value.

~~~json
{
  "task_id": "task-042",
  "profile": "review",
  "executor": "claude-code",
  "model": "configured_model",
  "attempts": 1,
  "input_tokens_reported": null,
  "output_tokens_reported": null,
  "estimated_cost": null,
  "billed_cost": null,
  "result": "awaiting_review"
}
~~~

These are **example fields, not measurement results**. A real dashboard would also record duration, errors, and artifact references. I would not retain full prompts or files without a clear requirement; categorized errors and authorized internal references are often enough to troubleshoot.

This distinction prevents misleading comparisons. Two tasks with the same token spend may produce very different outcomes: one delivers a correct patch; another exhausts retries without solving the problem. Cost per accepted task, combined with quality and human supervision, is more meaningful than the price of a single reply.

## Design a fair benchmark

Use a small set of tasks with known difficulty: analyze a function, fix a bug with a regression test, review a diff, and perform a bounded refactor. Each run starts from the same base commit and uses identical acceptance criteria. When comparing models, record configuration differences and keep tool access consistent.

Compare three strategies: one agent with one model, one agent using model routing, and a workflow with an independent reviewer. Evaluate accepted-task rate, actual spend, duration, defects found by CI, and time spent supervising. Repeat tasks when feasible, because model runs are not deterministic.

I would not publish a table of numbers before running that benchmark. This post supplies the experimental design, not invented results. Real conclusions need recorded versions, accessible task definitions, artifacts, and an explanation of sample limitations.

## Put quality policy before savings

An analysis task can have a modest budget when errors are reversible. A database migration or a change involving payments deserves stronger safeguards, perhaps mandatory human review and integration tests. Task risk should influence routing as much as difficulty.

A more expensive model is not a guarantee of safety. It can hallucinate test results, ignore constraints, or propose an incorrect patch. A cheaper model may perform brilliantly on narrow tasks. The way to choose is not a permanent popularity ranking; it is evaluation against our own code and controls that do not rely only on model promises.

The best policy is likely hybrid: automatic decisions within safe bounds and explicit escalation when uncertainty rises. That keeps agents as development tools rather than operators with unrestricted authority.

## When fallback should stop

If a task fails because of permissions, do not try a more persuasive model. If it lacks context, ask for the missing information. If changes fall outside scope, block and return evidence. If CI fails, investigate the cause; identical blind retries only burn budget.

Stop when the attempt limit is reached or a new call would exceed the remaining budget. A useful response is a report: what was attempted, what worked, what failed, what was spent, and what decision is needed. A well-documented failed job is better than a system unable to stop.

For a small coordinator, these rules can be implemented with a state machine, limits table, and typed errors. We do not need an elaborate policy engine until real requirements justify it.

## What I would build for a solo project

In the first week I would use OpenCode with one configured provider and collect basic metrics. In the second, if task volume justified it, I would separate read-only analysis from implementation profiles. Only with enough reliable observations would I add an independent reviewer and explicit fallback rules. Every change would face the same acceptance tasks, not only subjective impressions.

I would avoid building a giant dashboard on day one. A CSV or SQLite table recording duration, state, estimated spend, and Git references may be sufficient. The best optimizations often come from recurring failures, repetitive tasks, and unnecessary context, not from adding a second router.

Financial cost is also not the same as value. An extra review that prevents a deployment mistake can be worth far more than its token price. A cheap agent that creates a regression may be costly in repair time.

## Lessons from all five installments

This series began with a tempting idea: control agents from different providers through ChatGPT or Claude Desktop. We learned that the client, protocol, executor, and model are different pieces. MCP does not create agents; ACP integrates clients and coding agents; A2A enables collaboration between independent systems. An executor's SDK can be simpler than a new protocol when we need only one known integration.

Then we carried the architecture into Git: plan, implement, review, pass CI, and never confuse finishing an agent task with publishing a change. Now we add one more rule: orchestrating without measuring and limiting spend means losing control even when all components are technically functioning.

I do not need ten agents to be busy to consider the system valuable. I need to start a task, recover it later, cancel it when safe, inspect its diff, understand what it cost, and decide whether to publish. That is my definition of useful autonomy.


## A measurable escalation policy

My first automatic router would not claim to identify the “best model” for every problem. It would use observable task properties. Read-only work goes to the analysis profile. Code modification requires an isolated branch and tests. Changes involving authentication, data, deployment, or security require an additional review or explicit human approval. The risk of the operation governs the policy before the input-token price does.

Escalation needs a written limit. If an initial attempt fails to produce a verifiable artifact, the coordinator returns a typed failure. If a provider request failed transiently and the budget allows it, one retry may be reasonable. A failed test should lead to a bounded code correction rather than a blind model change. Once the budget or scope is exhausted, the service must stop and request a human decision.

I would measure cost per *accepted* task, not merely inference cost per call. Accepted means the original criteria are satisfied: a valid diff, relevant tests, and review where required. A cheap route with repeated attempts may cost more overall than an expensive route that succeeds once. Human supervision belongs in the measurement too.

Every routing policy should have a rollback path. If a new model or provider combination behaves poorly, reverting to the previous executor configuration must be straightforward. Otherwise a minor optimization turns into an architectural migration. Budgets should help us make decisions, not lock us into a fragile configuration.

## The difference between estimated and invoiced spend

In an agent loop, the orchestrator may receive model usage reports before the provider's final accounting is available. Input, output, reasoning, and cache token categories can differ by service. A robust dashboard should show the source of every figure and distinguish the best current estimate from the eventual billed amount. Pretending they are equivalent makes a budget look more precise than it really is.

I would keep a ledger of attempts, not merely one total attached to the final task. For each request: time, model, routing profile, provider if known, error category, usage fields, and cost source. That allows me to answer whether money was spent on useful implementation, repeated context transfer, independent review, or retries after errors. The ledger can omit confidential prompt text and still provide useful diagnostics.

This also helps compare local models. A local call might report zero external API charge, but it occupies hardware and time. If a slow local review prevents timely deployment or requires repeated manual inspection, zero API tokens billed is not zero cost. Estimate electricity and hardware only when those values are actually known rather than assigning fictional savings.

Finally, separate an operational dashboard from an optimization engine. The first can be a simple table showing what happened. The second changes future behavior. I would trust the dashboard first, gather enough evidence, and only then let it influence model selection. Otherwise incorrect metrics could automatically route more work toward a poor choice and amplify the original error.

## References and related articles

- [OpenCode: providers and OpenRouter integration](https://opencode.ai/docs/providers)
- [OpenCode: configuration of models and tools](https://opencode.ai/docs/config)
- [OpenRouter: provider routing strategies](https://openrouter.ai/blog/insights/model-routing/)
- [OpenRouter: API documentation](https://openrouter.ai/docs)
- [ArceApps: ChatGPT Desktop and OpenCode](/blog/chatgpt-desktop-agent-orchestration/)
- [ArceApps: Claude Desktop and external agents](/blog/claude-desktop-external-coding-agents/)
- [ArceApps: MCP, ACP, and A2A](/blog/mcp-acp-a2a-agent-protocols/)
- [ArceApps: workflow to a PR](/blog/multi-provider-coding-agent-workflow/)

**Series conclusion.** Start with a simple bridge, one permission-scoped agent, one reviewable artifact, and a clear budget. Everything else should earn its place through tests, not promises.
