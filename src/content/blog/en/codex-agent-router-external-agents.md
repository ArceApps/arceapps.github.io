---
title: "Codex Agent Router: Orchestrating External Agents"
description: "Configure Codex Agent Router to delegate to native subagents or route work to OpenCode, MiniMax, Big Pickle, and Antigravity from one interface."
pubDate: 2026-09-10
lastmod: 2026-09-10
author: "ArceApps"
keywords:
  - "Codex"
  - "Agent Router"
  - "OpenCode"
  - "MiniMax M3"
  - "Antigravity"
  - "AI Coding Agents"
canonical: "https://arceapps.com/blog/codex-agent-router-external-agents/"
heroImage: "/images/codex-agent-router-external-agents.svg"
tags: ["Codex", "AI Agents", "OpenCode", "MiniMax", "Antigravity", "Indie Dev"]
draft: false
reference_id: "2d1d7d0e-a5df-4d6b-9c0f-2f77bc4a5cc2"
---

## From choosing models to building an agent switchboard

A few weeks ago I wrote about [model routing for coding subagents](/blog/model-routing-subagents-coding-agents/): instead of sending every task to the same model, choose the engine that fits the cost, speed, and difficulty of the work. That solved one part of the problem, but it left a more practical question unanswered. Picking a model is one thing. Making several AI coding systems cooperate without turning my desktop into a mess of terminals, browser tabs, dashboards, and half-forgotten processes is something else entirely.

My actual requirement was specific. I already use Codex as the main place where I work. I also wanted to take advantage of Antigravity and its `agy` CLI, OpenCode, several models available through OpenCode, and the option of using a MiniMax plan. I did not want to replace Codex. I did not want to manually open another tool, copy a task, paste context, wait, switch back, explain what happened, and then reconcile the changes. I wanted to write something close to “route this task” and let Codex choose an external worker, remain the control point, and verify the result when that worker finished.

That led me to build a small orchestration layer around Codex Skills. The final system has five pieces: `agent-opencode`, `agent-minimax`, `agent-free`, `agent-agy`, and a fifth skill called `agent-router` that decides how work should move. The interesting part is not the naming. The interesting part is the distinction we ended up making between **delegating** and **routing**.

In my workflow, “delegate” means: use a native Codex subagent. “Route” means: send the work to an external agent, but run that external process from a Codex host subagent so the execution still has a visible thread, a clear place to observe progress, and a defined return path to the parent agent.

That vocabulary choice looks small. In practice it resolved most of the architectural ambiguity we kept finding.

This article documents the whole process: what I tried first, why I changed it, how the four external workers are separated, what `agent-router` actually does, how permissions and unattended execution are handled, why streaming and logs matter, what I deliberately did not build, and which advantages and drawbacks remain.

![Final architecture: Codex distinguishes native delegation from external routing.](/images/codex-agent-router-architecture-en.svg)

## The goal: one place from which to send work

The idea started with something that already worked in Antigravity. `agy` can run Antigravity non-interactively from the command line. Once a tool can receive a prompt, operate on a repository, and return machine-readable output, Codex can treat it as an external process.

The first conceptual jump was simple: if Codex can execute commands, why not turn Antigravity into a worker that Codex can launch for a complete engineering task?

Then came the obvious follow-up question: if it works with `agy`, why not do the same thing with OpenCode?

OpenCode has a mode designed for automation:

```bash
opencode run \
  --model "provider/model" \
  --dir "/path/to/repository" \
  --auto \
  "Implement the task described here"
```

The examples in this article intentionally contain no private information. Paths are generic. There are no personal usernames, machine names, private hosts, IP addresses, tokens, credentials, or real secrets in any snippet.

`opencode run` made OpenCode a natural second backend. More importantly, OpenCode can choose the model with `--model`. My setup exposed several provider/model combinations, which gave me two possible designs: one giant OpenCode skill that accepted aliases, or several small skills with fixed identities.

I chose the second option.

The first worker would run OpenCode with DeepSeek V4 Flash. The second would be a free worker using Big Pickle. The third would run MiniMax M3 through OpenCode as the harness. The fourth would remain Antigravity through `agy`.

At that point the design looked like this:

```text
Codex
├── agent-opencode -> OpenCode -> DeepSeek V4 Flash
├── agent-free     -> OpenCode -> Big Pickle
├── agent-minimax  -> OpenCode -> MiniMax M3
└── agent-agy      -> agy      -> Antigravity
```

That was enough to launch work, but it was not yet a real routing system. Two things were missing: a way to choose the right worker without manually remembering the policy every time, and a way to see what external workers were doing while they ran.

## Why I did not build one giant OpenCode skill

The tempting version was a single `$opencode` skill with a model alias:

```text
$opencode deepseek fix the bug
$opencode free review the tests
$opencode minimax migrate this module
```

That works technically. Operationally, I disliked it.

A Codex Skill is more than a shell alias. Its `description` helps Codex decide when the skill applies, and its `SKILL.md` can define behavior specific to the backend. A free worker should have a visible rule about avoiding secrets. Antigravity needs explicit guidance around unrestricted tool permissions. MiniMax needs to stay pinned to the MiniMax plan provider rather than silently switching to another model with a similar name. The general OpenCode worker needs neither of those special cases.

If all of this lives in one mega-skill, every invocation carries rules for several providers and several execution models. The orchestrator has to reason about model choice, permissions, cost, routing, sessions, and provider identity at once.

Separating the workers reduces context and reduces accidental coupling.

The four worker skills are primitives. `agent-router` is policy.

That split also gives me a clean maintenance boundary. If Big Pickle stops being free, I update `agent-free`. If MiniMax changes a model identifier, I update `agent-minimax`. If `agy` adds a better streaming option, I update `agent-agy`. The router does not need to know the command-line details.

This is just composition applied to agent infrastructure: small adapters at the edge, one small routing layer in the middle.

## Worker 1: agent-opencode as the default external coder

The model chosen for the general external worker is:

```text
opencode-go/deepseek-v4-flash
```

I did not choose it because I believe one model can be crowned “best” in a vacuum. I chose it because I wanted a fast, capable external path for the kind of work I most often want to unload from Codex: bounded feature implementation, debugging, moderate refactors, tests, and well-specified multi-file changes.

The skill pins the model. I do not want a worker named `agent-opencode` to silently jump to some unrelated provider because a model lookup failed. Predictability matters more than clever fallback in the primitive skill.

Its runner is conceptually simple:

```bash
opencode run \
  --model "opencode-go/deepseek-v4-flash" \
  --dir "$REPOSITORY" \
  --auto \
  --format json \
  "$TASK"
```

`--auto` is a key detail. OpenCode permissions can be allowed, denied, or configured to ask. An unattended process that pauses for an interactive approval defeats the point of routing. In the current CLI, `--auto` auto-approves permissions that are not explicitly denied; an explicit deny stays denied.

That raised an important design question around Git. Should I hard-deny `git push`, merges, branch deletion, and similar actions?

I decided not to encode those as unconditional CLI denies. Instead, every worker receives a behavioral rule: do not commit, push, merge, rebase shared history, delete branches, publish releases, or perform equivalent publishing operations unless the original task explicitly authorizes them.

The reason is practical. If `git push` is always denied in the tool policy, then a task that explicitly says “fix this, commit, and push” still cannot complete. `--auto` does not override `deny`.

The resulting safety model is layered rather than magical: normal tool configuration, skill instructions, repository scope, explicit user authorization, and final verification by Codex. No single line of prompt text is treated as a sandbox.

## Worker 2: agent-free and the value of a cheap lane

The second worker uses:

```text
opencode/big-pickle
```

The point is not “one more model.” The point is to create a route for work that does not deserve the expensive lanes.

A surprising amount of software work is mechanically useful rather than intellectually difficult: inspect a small directory, draft documentation, perform a repetitive rename, generate obvious tests, review a handful of files, or produce a first hypothesis for a straightforward bug.

That is what `agent-free` is for.

Its existence also forces the router to acknowledge a dimension that is easy to ignore: **cost is a routing constraint**, just like complexity, latency, tool access, or context size.

The skill includes a stronger privacy reminder than the others. It should not deliberately receive credentials, API keys, tokens, `.env` contents, or similar secrets. In reality, that discipline should be applied to every third-party provider. I keep it especially visible here because “free” can tempt people to treat a backend as disposable and forget that data routing is still data routing.

The user can also choose it directly:

```text
$agent-router route this task using the free worker
```

No classifier needs to debate the request. Explicit choice wins.

There is an obvious downside. A task that looked trivial can become difficult during execution. I do not want the primitive skill to swap models behind my back when that happens. It should finish what it safely can, report the blocker, and let the parent decide whether to escalate to `agent-opencode`.

That keeps routing decisions observable.

## Worker 3: MiniMax M3 without adding another harness

MiniMax introduced a more interesting choice. I could try to integrate a separate MiniMax coding frontend, or I could keep OpenCode as the harness and select MiniMax as the provider/model behind it.

I chose the latter.

The model identifier used by the worker is:

```text
minimax-coding-plan/MiniMax-M3
```

The architectural benefit is bigger than the convenience. Codex does not need to learn a fifth execution protocol. `agent-minimax` behaves like the other OpenCode-backed skills: same repository handling, same unattended execution pattern, same session capabilities, and the same structured output mechanism.

It also makes the distinction between **harness** and **model** explicit. OpenCode is the agent framework running tools and maintaining the session. MiniMax M3 is the model driving the decisions.

MiniMax's Token Plan is built for long-running text and code workloads and can be used through compatible external tooling. That fits the role I assigned to this worker: large implementations, migrations, broad refactors, repetitive changes, and tasks likely to spend a long time iterating across many files.

I deliberately did not define `agent-minimax` as “the difficult-task model.” Difficulty is too vague to route on.

A problem can be extremely difficult but affect twenty lines of code. Another can be conceptually easy but require a mechanical migration across hundreds of files. The second is a better fit for a long-running external worker.

There is also a quota advantage. Work routed to the MiniMax plan does not have to consume the same inference budget as my main Codex work or my OpenCode Go worker. For a solo developer, that separation matters.

## Worker 4: agent-agy and the autonomy of Antigravity

Antigravity was the original inspiration and remains the most different worker.

`agy` has a headless mode that lets me send one prompt and receive output without opening an interactive interface:

```bash
agy \
  -p "$TASK" \
  --effort high \
  --output-format stream-json \
  --dangerously-skip-permissions \
  --print-timeout 30m
```

There are two deliberate choices in that command.

The first is `--dangerously-skip-permissions`. The name is accurate. In headless mode it auto-approves tool calls, including file writes and command execution. That is exactly what I want from this specific worker because its job is to handle highly agentic loops: investigate, run the build, modify code, test, inspect the failure, fix it, and continue without asking me every few minutes.

That does **not** mean the agent receives unlimited authorization at the intent layer. The skill still says that publishing or destructive Git operations require explicit authorization from the original task. The flag removes interactive friction; it does not erase the contract.

The second choice is `stream-json`. Antigravity can emit NDJSON events during the run: initialization, step changes, tool calls, response deltas, usage information, and the terminal result. That is far more useful for orchestration than a single blob of text appearing after twenty minutes.

I also increased the timeout. The default headless timeout is reasonable for short prompts but not for real repository work. Thirty minutes is my default ceiling, and the wrapper can override it when a task is known to need more or less.

This worker is both the most powerful and the one I treat most carefully. A loosely specified prompt plus broad tool permissions can generate a lot of wrong work quickly. That is why `agent-agy` is not the default external route.

## Which CLI options I exposed, and which ones I left alone

Another small design choice was not to turn each skill into a copy of `--help`.

OpenCode exposes more options than I need on every run. If the wrapper accepted everything as part of the routing logic and the router tried to choose every flag, the context would become bloated again. Instead, I kept a small optional surface that Codex may use when it materially improves a task:

```text
--continue
--session <id>
--fork
--file <path>
--variant <variant>
--attach <url>
--thinking
```

`--continue` and `--session` are for resuming earlier context when I really want the same worker to continue a previous conversation. `--fork` can branch from an existing session. `--file` attaches a specific file to the message. `--variant` lets the provider select a supported reasoning variant. `--attach` can connect the runner to an already running OpenCode server. `--thinking` asks OpenCode to surface whatever reasoning blocks the provider is willing to expose.

None of these are enabled just because they exist. The default runner should stay predictable: pinned model, current repository, `--auto`, JSON output, and the task. Codex adds an option only when it has a reason.

I also considered keeping OpenCode running permanently as a server and making all three OpenCode-backed workers use `--attach`. That can be a useful optimization because it avoids restarting parts of the infrastructure between jobs, but I did not make it a requirement for version one. I prefer a skill that can still work with a plain `opencode run` when no daemon is running.

`agy` follows the same philosophy. The wrapper exposes effort, conversation continuation, explicit model or agent selection, and timeout, but the normal profile is intentionally opinionated: high effort, `stream-json`, unrestricted tool approval, and a timeout long enough for real repository work.

The general rule became: **the skills know the useful CLI capabilities, but the user should not have to program the CLI just to delegate a task**. If asking another agent for help requires me to remember seven flags, I have not built a router. I have built another terminal with extra steps.

## From four workers to the fifth component: agent-router

With the four worker skills in place I could already write:

```text
$agent-opencode fix this bug
$agent-minimax perform this migration
$agent-free document this module
$agent-agy investigate, build, and keep fixing until it passes
```

But I still had to choose manually.

The fifth skill was created to solve that problem. Its final name became `agent-router`.

The first draft of its `SKILL.md` was much longer. It tried to describe OpenCode flags, `agy` permissions, Git policy, fallbacks, concurrency, sessions, verification, and a large catalog of examples.

It was comprehensive. It was also bad architecture.

A router should not duplicate the manuals of its workers. Every duplicated rule increases context cost and gives two places where behavior can drift.

So I cut it down to the responsibilities that actually belong in the router:

1. understand whether the user wants native delegation or external routing;
2. select an external worker when needed;
3. prepare a self-contained handoff;
4. create the right host or subagent;
5. return ownership of final verification to the parent Codex agent.

That reduction is not merely aesthetic. It is context engineering. The router should spend tokens deciding routes, not relearning every backend.

![Decision matrix used by Agent Router for native and external work.](/images/codex-agent-router-routing-en.svg)

## The vocabulary decision that simplified everything

The most annoying ambiguity was linguistic.

If I say “delegate this,” do I mean “give this to a Codex subagent” or “send this outside Codex to OpenCode”? In ordinary English, both are delegation.

Instead of asking the model to infer my intent every time, I created a tiny vocabulary convention.

**Delegate** means native Codex subagents.

**Route** means an external agent.

So:

```text
$agent-router delegate the algorithm and test review
```

means native Codex workers.

While:

```text
$agent-router route the implementation of this task
```

means one of the external workers should do the actual work.

If I also name a destination, the explicit destination wins:

```text
$agent-router route this to MiniMax
```

or:

```text
$agent-router route this with Antigravity
```

The router should never try to be smarter than a direct instruction.

And if I invoke `$agent-router` without either keyword, then it may choose automatically between the main Codex agent, native subagents, or an external worker.

The convention is intentionally human. I do not need to remember provider identifiers or CLI flags to express the architectural decision I care about.

## What a native Codex subagent is in this system

The word “agent” is overloaded enough that this distinction deserves its own section.

A native Codex subagent is created through Codex's own multi-agent capability. It inherits the current model by default and runs inside Codex's agent infrastructure. It is particularly useful when a task decomposes into independent pieces: inspect two modules, review implementation and tests separately, investigate several possible bug causes, or explore different parts of a repository in parallel.

That is not the same thing as launching OpenCode or `agy`.

The rule is:

```text
delegate -> Codex subagent -> the subagent performs the work
```

By contrast:

```text
route -> external agent -> the external agent performs the work
```

Originally, I imagined the external path as a child process directly owned by the main Codex agent. Then I ran into the observability problem.

## The unattended-worker problem: what is it doing right now?

An external worker may run for ten, twenty, or thirty minutes. If the only visible fact is “the process is still alive,” the workflow becomes uncomfortable quickly.

I could open OpenCode Web, attach a TUI, switch to another terminal, or tail a log. All of those are valid. None satisfy the original goal of keeping Codex as the main control surface.

The better idea was to use a **native Codex subagent as a host for the external process**.

That is a subtle but important distinction. The host subagent does not implement the task. It does not compete with the external worker. It launches the selected skill, keeps the process attached, observes its output, and returns the result to the parent.

The flow becomes:

```text
Main Codex
    |
    +-- host subagent "OpenCode · task"
            |
            +-- agent-opencode
                    |
                    +-- opencode run
                            |
                            +-- DeepSeek V4 Flash
```

For Antigravity:

```text
Main Codex
    |
    +-- host subagent "AGY · task"
            |
            +-- agent-agy
                    |
                    +-- agy --output-format stream-json
                            |
                            +-- Antigravity
```

Now “route” still means external execution, but each external run has a Codex thread associated with it. From the user interface, it is easier to see which worker belongs to which task.

## The host must not touch the implementation

As soon as I introduced a Codex host, another risk appeared: the host reads the task and decides to “help.”

That would be a mess.

Two agents writing into the same working tree at the same time can overwrite assumptions, rewrite files under each other, and create a diff whose authorship is impossible to reason about. The host therefore receives an explicit rule: **do not independently implement the delegated task**.

Its responsibilities are intentionally boring:

```text
1. launch the external worker;
2. pass the complete task;
3. observe execution;
4. keep useful output visible;
5. wait for completion;
6. return result and status to the parent.
```

Nothing more.

That turns the host into infrastructure rather than another coder.

It also preserves the mental model. A thread named “AGY · build fix” means Antigravity is the writer. A normal subagent created after “delegate” means that Codex subagent is a real worker.

## Streaming and logs: two layers of observability

The CLIs expose different output models.

OpenCode can run with:

```bash
--format json
```

to emit raw JSON events.

Antigravity can run with:

```bash
--output-format stream-json
```

which is explicitly intended for observing progress, tool calls, and usage as execution proceeds.

The wrappers leave this output visible on `stdout`, so the Codex host can observe it while the process runs. But I did not want the whole architecture to depend on how one version of the Codex UI renders child-process output.

Multi-agent interfaces evolve. A useful raw event can exist without being surfaced beautifully in a panel.

So I added a second channel: persistent logs.

Conceptually:

```text
~/.codex/agent-runs/
├── current-agent-opencode.log
├── current-agent-minimax.log
├── current-agent-free.log
└── current-agent-agy.log
```

The `~` notation is generic and intentionally avoids exposing any real home path or machine identity.

Every execution creates a timestamped log and updates a `current-*` symlink. If I need to inspect the raw process independently from the UI:

```bash
tail -f ~/.codex/agent-runs/current-agent-agy.log
```

I can.

For application data I generally want one source of truth. For observability, a primary UI plus raw logs is exactly the kind of redundancy I like.

## How agent-router picks an external worker

When I say “route” without naming a destination, the router uses a deliberately simple policy.

`agent-opencode` is the default. If there is no strong reason to choose something else, the task goes to the OpenCode/DeepSeek V4 Flash worker.

`agent-minimax` is for long-running work: migrations, broad repository changes, repetitive implementation, large refactors, or tasks where iteration volume matters more than an immediate response.

`agent-free` is for simple, low-risk tasks or when I explicitly say I want to preserve paid quota.

`agent-agy` is for highly autonomous work that benefits from extensive tool use and repeated build-debug-fix loops.

This is not a research-grade classifier. It is a practical policy.

That simplicity is a feature. Routers can become sophisticated enough that nobody understands why a task landed on a particular model. I would rather have a slightly less clever router whose behavior I can predict.

Explicit user choice always overrides the heuristic.

## What happens when I simply say “delegate”

The internal branch has different rules.

When I write:

```text
$agent-router delegate this investigation
```

the router uses native Codex subagents. It may send the whole task to one worker or split the work if there are genuinely independent pieces.

I set a default limit of three concurrent subagents. Not because Codex cannot create more, but because agent expansion has diminishing returns. Every new worker adds context, coordination, waiting, integration, and the possibility of duplicated effort.

I also instruct child agents not to recursively spawn more children unless I explicitly ask for nested delegation.

For my workflow, native subagents are especially useful for parallel read-heavy work and independent review:

```text
Main Codex
├── subagent A -> inspect algorithm
├── subagent B -> inspect tests
└── subagent C -> inspect performance
```

The parent integrates the findings.

That is different from external routing, where I usually want to hand off a complete bounded job and let another provider spend the bulk of the execution budget.

## The handoff is the least glamorous and most important part

A router can choose the perfect model and still fail if it sends a poor prompt.

That is why `agent-router` has one important responsibility before execution: turn my request into a self-contained worker task.

It should preserve the objective, relevant repository or module, constraints, expected behavior, verification requirements, and any explicit authorization for Git publishing operations.

It should **not** copy the entire conversation.

If the session has covered several projects over an hour, the worker does not need all of that history. Sending unrelated context is expensive, distracting, and potentially a privacy problem.

The skill therefore acts as a context boundary.

I also made privacy part of the handoff design. None of the code examples in this article include personal paths, private IP addresses, hostnames, credentials, API keys, or tokens. In actual use, the same principle applies: only send an external provider the information required for the task.

Agent routing is also data routing.

## What I deliberately rejected: interactive approvals for unattended workers

OpenCode can operate with permissions that ask for confirmation. Antigravity also has workflows where some tools require approval.

That is useful in an interactive human session. It can be a trap in a nested agent workflow.

The failure mode I wanted to avoid is:

```text
Codex launches external worker
-> external worker asks permission
-> external worker waits
-> host waits
-> parent waits
-> I do not know what is blocking
```

It is absolutely possible to build a more sophisticated bridge. OpenCode exposes session and permission concepts, and Antigravity can continue conversations or maintain a streaming input session. A host could detect a question, ask the parent Codex agent, let Codex answer when possible, and escalate to me only when a human decision is required.

I did not build that version first.

The current external workers are **unattended**. Routine implementation decisions should not stop execution. Minor ambiguity is resolved conservatively and reported later. If there is a major product decision that cannot safely be inferred, the worker leaves that part unchanged, completes independent work, and returns a blocker.

I prefer a partially completed task with a clear decision point over an invisible process waiting indefinitely.

## What I deliberately rejected: agent-ollama, for now

I also checked whether it made sense to add an Ollama Cloud worker without running local models.

Technically, yes. Ollama's free plan includes a small monthly starter allowance for selected cloud models, so local inference is not required. Its cloud catalog includes models that are interesting for coding.

I still decided not to add `agent-ollama`.

The reason is stability of semantics. A worker named “free” should remain predictably free. The exact set of starter models can change, and the fact that a model appears in a cloud catalog does not guarantee that it will remain in the free starter set.

I already had `agent-free` backed by a model that was explicitly exposed as a free OpenCode option at the time I configured the system.

Adding another worker just to increase the number of choices would make the router more complicated without solving a new problem.

This is a reversible decision. If Ollama later offers a stable free lane that provides a genuinely different capability, the architecture makes it easy to add another primitive skill.

## The practical advantages

The first advantage is obvious: **one mental interface**. Codex remains the place where I describe work, inspect results, and make decisions.

The second is quota separation. Different workers can consume different providers. Long work can go to MiniMax, simple work can go to the free lane, and tool-heavy loops can go to Antigravity instead of spending every task against one primary model budget.

The third is specialization without locking the orchestrator to provider APIs. `agent-router` knows skills, not vendor-specific HTTP calls. Each skill encapsulates its CLI.

The fourth is observability. Host subagents, structured process output, and persistent logs provide several ways to understand execution.

The fifth is semantic control. “Delegate” and “route” are ordinary words, but in this environment they express a precise architectural choice. I do not need to remember an OpenCode session flag just to say that I want an external worker.

The sixth is graceful recovery. If a worker fails, Codex still exists as the parent and can decide what happens next. The whole system is not a brittle pipeline owned by one provider.

The seventh matters a lot for an indie workflow: the strongest or most expensive model can be reserved for the work where it actually contributes value.

## Drawbacks and risks that remain

There is no free orchestration.

The first cost is **extra context and extra processes**. A host subagent consumes Codex resources while the external worker consumes its own provider quota. I accept that overhead in exchange for visibility and organization, but it is not the cheapest possible path.

The second problem is concurrent writes. If the main Codex agent, an internal subagent, and two external workers modify the same files simultaneously, I have not built orchestration; I have built a race condition. Parallel writing needs disjoint scopes or isolated worktrees.

The third risk is `--dangerously-skip-permissions`. Antigravity's flag does exactly what its name says. A badly scoped prompt can perform operations that an interactive session might have stopped. Skill instructions reduce risk but do not turn unrestricted tool approval into a sandbox.

The fourth cost is maintenance. CLIs evolve. Flags, model identifiers, output schemas, and authentication flows can change. The skill boundary localizes this volatility, but somebody still has to update it.

The fifth is privacy. Routing code to an external agent means that code is sent to another provider. The correct worker is not only the worker with the right benchmark score. It is also one that is allowed to receive the data.

The sixth is routing quality. A heuristic can misclassify. A task that looks easy can become complex, and a huge migration can contain one small but sensitive design decision that should stay in Codex. The answer is not to pretend the router is infallible; it is to make routing predictable and easy to override.

The seventh is UI visibility. A host subagent improves the experience, but it does not magically turn Codex into a perfect third-party-agent dashboard. Raw logs remain useful.

## A possible next step: routing with execution feedback

The current router mostly decides from the prompt.

A future version could incorporate execution data: typical duration per worker, success rate, retry count, cost, diff size, test failures, and perhaps available quota.

Then the policy could become more evidence-based:

```text
if task is small and free-worker success rate is high -> free
if migration touches many files -> minimax
if repeated build/fix loops are expected -> agy
if external worker failed once -> opencode
if area is sensitive -> keep inside Codex
```

The interactive bridge I postponed is another possible evolution. OpenCode and Antigravity both expose mechanisms for continuing sessions. A host could detect that a worker needs a decision, attempt to resolve it from Codex context, and ask the human only when necessary.

At that point the host becomes more than a monitor. It becomes a protocol adapter between agents.

I do not need that complexity yet.

One of the most useful lessons from this experiment was to avoid building the most impressive orchestration system before I know which friction is real.

## The final architecture

After all of those iterations, the system is:

```text
                         Main Codex
                             |
                       $agent-router
                             |
             +---------------+----------------+
             |                                |
         "delegate"                         "route"
             |                                |
      Codex subagent                  Codex host subagent
      performs work                   supervises only
                                              |
                    +-------------------------+----------------------+
                    |             |            |                     |
             agent-opencode  agent-minimax  agent-free           agent-agy
                    |             |            |                     |
                 OpenCode      OpenCode      OpenCode                  agy
                    |             |            |                     |
              DeepSeek V4      MiniMax M3    Big Pickle          Antigravity
                  Flash
```

The parent Codex agent never disappears from the model. It receives the original request, chooses or respects a route, integrates results, and verifies the final state.

The native subagent is an actual Codex worker.

The external host is not an implementation worker. It is a supervision capsule.

The four external skills encapsulate their tools and their provider-specific details.

And `agent-router` only contains routing policy. It does not need to know how `--print-timeout` works or how a provider authenticates.

That information belongs at the edge.

## What this system actually solved

The problem was never simply “how do I run OpenCode from Codex?” That is one shell command.

The real problem was:

**How can I keep Codex as my primary working interface while taking advantage of other agents, models, subscriptions, and quotas in a way that remains understandable, observable, and controllable?**

The answer ended up having several layers because the problem had several layers.

Skills solved encapsulation.

Runners solved unattended execution.

Pinned models gave each worker a stable identity.

`agent-router` solved selection.

The “delegate/route” vocabulary solved human ambiguity.

Host subagents solved much of the observability problem.

Streaming output and logs created a fallback when the UI was not enough.

Git and privacy rules constrained the blast radius.

And separating the main Codex agent, native subagents, and external workers kept the mental model small enough to use.

The best automation is not always the one that eliminates every decision. Sometimes it is the one that compresses twenty annoying decisions into two meaningful ones.

## References

- [OpenAI — Codex](https://openai.com/codex/)
- [OpenAI — Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [OpenAI Codex source — multi-agent `spawn_agent`](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs)
- [OpenCode — CLI documentation](https://opencode.ai/docs/cli/)
- [Google Antigravity — AGY headless mode](https://antigravity.google/docs/cli/headless/)
- [Google Antigravity — Using AGY CLI](https://antigravity.google/docs/cli/using/)
- [MiniMax — Token Plan](https://platform.minimax.io/subscribe/token-plan)
- [Ollama — Pricing](https://ollama.com/pricing)
- [Ollama — Transparent pricing](https://ollama.com/blog/transparent-pricing)

## Closing thoughts

I do not think I have built “the ultimate orchestrator.” I have built something I value more: a system I can explain from memory.

I can say “delegate” and know I am creating native Codex capacity.

I can say “route” and know the work is leaving for an external worker.

I can name MiniMax, Antigravity, OpenCode, or the free agent when I want direct control.

I can observe the external run from a host thread and fall back to the raw log when I need more detail.

And when the worker is done, Codex becomes responsible again for looking at the diff and deciding whether the result is actually good.

For an indie workflow, where tools change every few months and quotas matter almost as much as model quality, that combination of flexibility and simplicity is more useful to me than a giant orchestration framework.

The goal is not to have many agents.

The goal is to make the agents I already have behave like one system.
