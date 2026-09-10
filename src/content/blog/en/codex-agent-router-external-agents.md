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

My actual requirement was specific. I already use Codex as the main place where I work. I also wanted to take advantage of Antigravity and its `agy` CLI, OpenCode, several models exposed through OpenCode, and the option of using a MiniMax plan. I did not want to replace Codex. I did not want to manually open another tool, copy a task, paste context, wait, switch back, explain what happened, and reconcile the changes. I wanted to write something close to “route this task” and let Codex choose an external worker, remain the control point, and verify the result when that worker finished.

That led me to build a small orchestration layer around Codex Skills. The system has five pieces: `agent-opencode`, `agent-minimax`, `agent-free`, `agent-agy`, and a fifth skill called `agent-router` that decides how work should move. The interesting part is not the naming. The interesting part is the distinction we ended up making between **delegating** and **routing**.

In my workflow, “delegate” means: use a native Codex subagent. “Route” means: send the work to an external agent, but run that external process from a Codex host subagent so the execution still has a visible thread, a clear place to observe progress, and a defined return path to the parent agent.

That vocabulary choice looks small. In practice it resolved most of the architectural ambiguity we kept finding.

The architecture kept evolving after the first version. Real runs made it obvious that being able to launch an external agent was not enough. The system also needed to control process lifetime, avoid accidentally reusing persistent sessions, distinguish launcher failures from model failures, preserve the real exit code, expose retries, and design logging for parallel execution from the start.

The current result is much more robust than the first prototype: **every normal external route is a fresh, ephemeral execution**, every worker gets a unique run log, Codex remains responsible for parallel orchestration, and the host is explicitly required to surface meaningful worker actions instead of reducing them to vague summaries.

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

`opencode run` made OpenCode a natural second backend. More importantly, OpenCode can choose the provider and model with `--model`. My setup exposed several useful combinations, which gave me two possible designs: one giant OpenCode skill that accepted aliases, or several small skills with fixed identities.

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

A Codex Skill is more than a shell alias. Its `description` helps Codex decide when the skill applies, and its `SKILL.md` can define behavior specific to the backend. A free worker should have a visible rule about avoiding secrets. Antigravity needs explicit guidance around unrestricted tool permissions. MiniMax needs to stay pinned to the MiniMax plan provider rather than silently switching to another model with a similar name. The general OpenCode worker needs none of those special cases.

If all of this lives in one mega-skill, every invocation carries rules for several providers and several execution models. The orchestrator has to reason about model choice, permissions, cost, routing, sessions, and provider identity at once.

Separating the workers reduces context and reduces accidental coupling.

The four worker skills are primitives. `agent-router` is policy.

That split also gives me a clean maintenance boundary. If Big Pickle stops being free, I update `agent-free`. If MiniMax changes a model identifier, I update `agent-minimax`. If `agy` adds a better streaming option, I update `agent-agy`. The router does not need to know the command-line details.

This is composition applied to agent infrastructure: small adapters at the edge, one routing layer in the middle.

## Worker 1: agent-opencode as the default external coder

The model chosen for the general external worker is:

```text
opencode-go/deepseek-v4-flash
```

I did not choose it because I believe one model can be crowned “best” in a vacuum. I chose it because I wanted a fast, capable external path for the kind of work I most often want to unload from Codex: bounded feature implementation, debugging, moderate refactors, tests, and well-specified multi-file changes.

The skill pins the model. I do not want a worker named `agent-opencode` to silently jump to some unrelated provider because a model lookup failed. Predictability matters more than clever fallback in the primitive skill.

The current runner is no longer just a minimal `opencode run`. It now follows the same execution and observability contract as the other OpenCode-backed workers:

```bash
stdbuf -oL -eL \
  opencode \
    --print-logs \
    --log-level INFO \
    run \
    --model "opencode-go/deepseek-v4-flash" \
    --dir "$REPOSITORY" \
    --auto \
    --format json \
    --title "Codex agent-opencode $RUN_ID" \
    "$TASK" \
    2>&1 | tee "$LOG"

STATUS=${PIPESTATUS[0]}
```

Several details matter here.

`--auto` remains essential. OpenCode permissions can be allowed, denied, or configured to ask. An unattended process that pauses for interactive approval defeats the point of routing. `--auto` approves permissions that are not explicitly denied; a real `deny` remains a wall.

`--print-logs` and `--log-level INFO` improve what the supervising host can observe. `stdbuf -oL -eL` reduces buffering on stdout and stderr so progress appears while the worker is running. `tee` keeps a copy of the stream without hiding it from Codex.

And `PIPESTATUS[0]` avoids a classic shell mistake. If OpenCode exits with status 1 while `tee` exits successfully with status 0, the wrapper must not report the whole run as a success. The exit code that matters is the first process in the pipeline.

This little line:

```bash
STATUS=${PIPESTATUS[0]}
```

is one of those boring details that separates an automation demo from reliable infrastructure.

## Worker 2: agent-free and the value of a cheap lane

The second worker uses:

```text
opencode/big-pickle
```

The point is not “one more model.” The point is to create a route for work that does not deserve the expensive lanes.

A surprising amount of software work is mechanically useful rather than intellectually difficult: inspect a small directory, draft documentation, perform a repetitive rename, generate obvious tests, review a handful of files, or produce a first hypothesis for a straightforward bug.

That is what `agent-free` is for.

Its existence also forces the router to acknowledge a dimension that is easy to ignore: **cost is a routing constraint**, just like complexity, latency, tool access, or context size.

The skill includes a stronger privacy reminder than the others. It should not deliberately receive credentials, passwords, API keys, tokens, `.env` contents, private keys, authentication cookies, or similar secrets. In reality, that discipline should be applied to every third-party provider. I keep it especially visible here because “free” can tempt people to treat a backend as disposable and forget that data routing is still data routing.

The user can also choose it directly:

```text
$agent-router route this task using the free worker
```

No classifier needs to debate the request. Explicit choice wins.

There is an obvious downside. A task that looked trivial can become difficult during execution. I do not want the primitive skill to swap models behind my back. It should return the blocker and let the parent decide whether another route is appropriate.

That is important: **workers do not silently escalate themselves to another provider**. Routing decisions return to Codex.

## Worker 3: MiniMax M3 without adding another harness

MiniMax introduced a more interesting choice. I could try to integrate a separate MiniMax coding frontend, or I could keep OpenCode as the harness and select MiniMax as the provider/model behind it.

I chose the latter.

The model identifier used by the worker is:

```text
minimax-coding-plan/MiniMax-M3
```

The architectural benefit is bigger than the convenience. Codex does not need to learn a fifth execution protocol. `agent-minimax` behaves like the other OpenCode-backed skills: same repository handling, same unattended execution pattern, same logging contract, same structured output, and the same final status markers.

It also makes the distinction between **harness** and **model** explicit. OpenCode is the agent framework running tools and maintaining execution context. MiniMax M3 is the model driving the decisions.

MiniMax became the **long and broad work worker**: migrations, large refactors, extended implementations, repetitive changes, and jobs likely to touch many files or require many iterations.

I deliberately did not define it as “the difficult-task model.” Difficulty is too vague to route on. A problem can be intellectually hard but tiny, while another can be conceptually simple and still require a hundred mechanical edits. Duration and execution volume matter.

The latest real tests also demonstrated something I wanted from the start: the external worker can hit an environment problem, diagnose it, recover, and continue. In one run MiniMax encountered a `JAVA_HOME` issue, found an available JDK, retried validation, and eventually finished with the focused test and full suite passing.

The recovery itself was good. The visibility was not. The host initially summarized the event as “MiniMax retried with the available JDK” without exposing enough of the concrete commands.

That experience produced one of the latest architectural changes: **observability must be a contract of both the host and the worker, not an accident of the UI**.

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

The first is `--dangerously-skip-permissions`. The name is accurate. It auto-approves tool calls, including file writes and command execution. That is exactly what I want from this specific worker because its job is to handle highly agentic loops: investigate, run the build, modify code, test, inspect the failure, fix it, and continue without asking me every few minutes.

That does **not** mean the agent receives unlimited authorization at the intent layer. The skill still says that publishing or destructive Git operations require explicit authorization from the original task. The flag removes interactive friction; it does not erase the contract.

The second choice is `stream-json`. Antigravity emits events during execution and that gives the host something useful to observe rather than one final text blob after a long wait.

The AGY wrapper is now aligned with the other three workers everywhere alignment makes sense: fresh process, unique `RUN_ID`, one log per execution, `tee`, real exit-code preservation, and standard start/result markers.

What I do not do is pretend AGY and OpenCode are the same CLI. Each worker skill keeps the flags that actually belong to its tool.

## The process-lifetime decision: one task, one process

One of the most important corrections came from looking at OpenCode sessions that remained open.

OpenCode supports persisted sessions, `--continue`, `--session`, `--fork`, and attaching to existing processes with `--attach`. Those are useful capabilities, but they should not be the normal routing path.

The current contract is simpler:

```text
1 route = 1 host = 1 external worker = 1 ephemeral process
```

For OpenCode-backed workers, a normal task starts a fresh `opencode run`. When the task finishes, that process finishes. OpenCode may still persist a session record internally, but a persisted session is not the same thing as a running process.

That distinction between **stored session** and **live process** matters.

An OpenCode TUI I started manually does not belong to the router. The host must not attach to it, reuse it, close it, or kill it. Likewise, a new route does not use `--continue`, `--session`, or `--attach` unless the task explicitly requests continuation of an earlier execution.

That removes invisible state from the default path and makes parallelism, cleanup, and debugging much easier to reason about.

AGY follows the same principle. A normal route starts a new process. `--continue` and `--conversation` remain available only for deliberate continuation.

## The most useful bug: `ln: Read-only file system`

The first tests of the new routing path produced an error that initially looked like an external-agent sandbox problem:

```text
ln: Read-only file system
```

The obvious interpretation was that MiniMax could not write, OpenCode lacked permissions, or the Codex host was trapped in a read-only filesystem.

Following the execution chain revealed something much more useful.

MiniMax had not started yet.

OpenCode was not the process calling `ln` either.

The failing command lived in **our own wrapper**:

```bash
CURRENT="$LOG_DIR/current-${AGENT_NAME}.log"
ln -sfn "$LOG" "$CURRENT"
```

The first logging design stored files under a Codex-related directory and updated a `current-agent-*.log` symlink for convenient `tail -f` access. That was handy, but it introduced an extra write in a location whose behavior could differ inside the host.

More importantly, the symlink was unnecessary for the final architecture and was awkward for parallel execution. If two MiniMax workers start at the same time, they both compete for the same `current-agent-minimax.log` target.

The solution was not “add even more permissions.” It was **remove complexity that no longer earned its keep**.

The `current-*` link disappeared and routing logs moved to a configurable ephemeral location:

```bash
LOG_DIR="${AGENT_ROUTER_LOG_DIR:-${TMPDIR:-/tmp}/codex-agent-router}"
```

Every execution now gets its own identifier:

```bash
STAMP="$(date '+%Y%m%d-%H%M%S')"
RUN_ID="${STAMP}-$$-${RANDOM}"
LOG="$LOG_DIR/${AGENT_NAME}-${RUN_ID}.log"
```

The result looks like:

```text
/tmp/codex-agent-router/
├── agent-opencode-20260910-132501-41021-17542.log
├── agent-minimax-20260910-132503-41034-23811.log
├── agent-free-20260910-132504-41045-9812.log
└── agent-agy-20260910-132506-41058-30115.log
```

No shared symlink. No filename collision. No dependency on `~/.codex` being an appropriate runtime-data directory. And the exact log path can be returned to the host at the end of the run.

That bug changed how I classify failures in this system: before blaming an external model, I need to know **which layer actually failed**.

## Infrastructure failure is not worker failure

From that point on I made the distinction explicit in all four worker skills.

Errors such as:

```text
read-only filesystem
missing executable
cannot create log directory
launcher cannot access a required runtime file
external CLI never actually starts
```

are **launcher or infrastructure failures**.

Errors such as:

```text
implementation does not compile
a test fails
the worker misunderstands the task
a tool fails during execution
the model cannot complete the requested change
```

are **worker or task failures**.

The distinction is operational, not academic.

If an infrastructure problem can be safely corrected while keeping the same requested worker and the same task semantics, the host can fix it and retry. But the first error and the recovery must remain visible. I do not want a final report that says “MiniMax completed successfully” when the real story involved two failed launches and an environment repair.

Conversely, if MiniMax starts, works on the repository, and fails to implement the feature correctly, the Codex host must not suddenly become the coder and silently finish the task itself. It returns the blocker to the parent. Routing policy belongs to the parent.

That improves both debugging and attribution.

## From four workers to the fifth component: agent-router

With four worker skills in place I could already write:

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

The current router focuses on a small set of responsibilities: interpret “delegate” and “route”, select a worker, prepare a self-contained handoff, create a visible host, coordinate parallelism, and return final verification ownership to the parent Codex agent.

The details of `opencode run`, `--dangerously-skip-permissions`, logging, and fixed model identifiers remain in the worker-specific skills.

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

## The visible host is not another coder

On an external route, Codex creates a host subagent. That host is deliberately different from a normal subagent created through “delegate.”

The flow is:

```text
Main Codex
    |
    +-- host "MiniMax · task"
            |
            +-- agent-minimax
                    |
                    +-- opencode run
                            |
                            +-- MiniMax M3
```

The host does not implement the task. It does not “make itself useful” by editing another part of the file. It does not replace the external worker if that worker takes a while. Its job is to launch, observe, expose progress, wait, and return result plus status.

That restriction matters. Without it, two capable agents can write into the same working tree without coordination.

The parent keeps integration and final verification. A worker returning `exit_code=0` is useful evidence, not proof that the diff is correct.

## Observability: I do not want a summary, I want to know what happened

This was another correction driven by real execution.

In one MiniMax run the worker completed the requested change, ran a focused test, ran the full suite, and finished successfully. It also recovered from an initial `JAVA_HOME` problem.

The host report was essentially: MiniMax found the available JDK, retried, and passed.

That was correct but not sufficient.

If the external worker repairs its environment, I want to be able to recover:

```text
1. the command that failed;
2. the relevant error;
3. the environment change or corrective action;
4. the retry command;
5. the retry result.
```

The same principle applies to builds, tests, Git inspection, and tool failures.

I do not need the model's private chain of thought. I need **operational telemetry**.

The `agent-router` contract and the worker skills now require the host to surface relevant commands, errors, retries, and environment changes such as `JAVA_HOME`, `PATH`, SDK, Node, Gradle, or XDG configuration when that information exists in the worker output.

The host can summarize noise. It should not compress a meaningful recovery into one vague sentence if the concrete evidence is available.

There is also an important negative rule: never invent a command. If the external tool only emits a semantic summary and does not preserve a concrete shell invocation, the host should say so rather than reconstructing a plausible command from context.

## Two observability layers: live stream and one log per run

The host thread is the first layer. The wrappers keep stdout and stderr visible and use structured output where the CLI supports it.

OpenCode runs with:

```text
--format json
--print-logs
--log-level INFO
```

AGY keeps:

```text
--output-format stream-json
```

The second layer is the per-run log:

```text
/tmp/codex-agent-router/agent-minimax-<run-id>.log
```

`tee` provides both at once: the host sees the stream and the same data is persisted for later inspection.

Unlike the original design, there is no global `current-agent-minimax.log` symlink. The log path is part of the run result, so the host can inspect the exact file that belongs to the task if the UI summarized something too aggressively.

I also standardized two simple markers.

At startup:

```text
AGENT_ROUTER_START
worker=agent-minimax
run_id=...
repository=...
log=...
```

At completion:

```text
AGENT_ROUTER_RESULT
worker=agent-minimax
exit_code=0
log=/tmp/codex-agent-router/agent-minimax-<run-id>.log
status=success
```

I am not trying to turn Bash into an enterprise event bus. I just want the host to identify the beginning, end, log, and real status of an external execution reliably.

## The parent must be able to grant the host enough authority

Another lesson from the early failures was that a subagent is not a privilege-escalation trick.

If the parent Codex session is restricted, creating a host and asking that host for full access does not magically make a read-only filesystem writable. The host must receive enough authority from the session that creates it.

This matters because the host launches the external CLI. Before OpenCode or AGY can apply their own tool-permission policies, the outer process needs to start, read the repository, write to the allowed workspace, and create whatever temporary runtime files are required.

I now think of this as two distinct layers:

```text
Codex / host
    -> authority of the outer process

OpenCode or AGY
    -> the worker's own tool permission policy
```

`--auto` operates inside OpenCode. `--dangerously-skip-permissions` operates inside AGY. Neither flag repairs a restriction that prevents the outer process from starting correctly.

That distinction stopped me from trying to fix the wrong layer when the problem was actually in my launcher.

## Parallelism: Codex coordinates, workers execute

Once every route is ephemeral and every run has its own log, running several external workers at the same time becomes much more reasonable.

But read parallelism and write parallelism are not the same thing.

For read-only work:

```text
Codex
├── Host A -> MiniMax inspects architecture
├── Host B -> DeepSeek reviews tests
└── Host C -> Big Pickle reviews documentation
```

There is no special coordination problem beyond normal resource usage.

For writes, the dangerous shared resource is not OpenCode. It is the working tree.

Two models editing the same file concurrently can produce the same kind of race condition any two ordinary processes can produce. The router therefore has a simple rule: parallel writes are only safe when scopes are clearly disjoint or when every worker receives an isolated Git worktree.

The shape I want for larger jobs is:

```text
Codex
├── Host A -> MiniMax  -> worktree A
├── Host B -> DeepSeek -> worktree B
└── Host C -> AGY      -> worktree C
```

Codex keeps global context, receives the results, and decides how to integrate them.

I do not need to hide primary parallelism inside OpenCode. I prefer the main orchestrator to know exactly how many external workers exist and where they are operating.

## The handoff is still the least glamorous and most important part

A router can choose the perfect model and still fail if it sends a poor prompt.

That is why `agent-router` has one important responsibility before execution: turn my request into a self-contained worker task.

It should preserve the objective, relevant repository or module, constraints, expected behavior, verification requirements, write scope, forbidden files, pre-existing modifications, and any explicit authorization for Git publishing operations.

It should **not** copy the entire conversation.

If the session has covered several projects over an hour, the worker does not need all of that history. Sending unrelated context is expensive, distracting, and potentially a privacy problem.

The skill therefore acts as a context boundary.

Agent routing is also data routing.

## Git: autonomy does not mean automatic publishing

All four workers may use Git for ordinary inspection:

```text
git status
git diff
git log
git show
```

They may also modify working-tree files required by the delegated task.

What they do not do without explicit authorization is commit, push, merge, force-push, destructive reset, branch deletion, or publication.

That remains true even for AGY with `--dangerously-skip-permissions`. Technical capability is not the same thing as product authorization.

The latest version also includes a practical attribution rule: the host and parent should distinguish pre-existing working-tree changes from changes made by the routed worker. A dirty repository does not become entirely “MiniMax's diff” just because MiniMax was the last thing to run.

## Which advanced options remain available

OpenCode still exposes:

```text
--continue
--session <id>
--fork
--file <path>
--variant <variant>
--attach <url>
--thinking
```

I did not remove those capabilities. I changed the **default**.

A normal route does not reuse a session. `--continue`, `--session`, `--fork`, or `--attach` are only used when the handoff explicitly asks for continuation or attachment to existing context.

AGY follows the same rule for `--continue` and `--conversation`.

Advanced continuation remains possible. Hidden state is simply no longer the default.

## How agent-router picks an external worker

When I say “route” without naming a destination, the router uses a deliberately simple policy.

`agent-opencode` is the default. If there is no strong reason to choose something else, the task goes to the OpenCode/DeepSeek V4 Flash worker.

`agent-minimax` is for long-running work: migrations, broad repository changes, repetitive implementation, large refactors, or tasks where iteration volume matters more than an immediate response.

`agent-free` is for simple, low-risk tasks or when I explicitly say I want to preserve paid quota.

`agent-agy` is for highly autonomous work that benefits from extensive tool use and repeated build-debug-fix loops.

This is not a research-grade classifier. It is a practical and predictable policy.

Explicit user choice always wins.

## The current architecture

After the latest iterations, the real shape is no longer just “Codex calls four CLIs.” It is this:

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
               fresh process  fresh process fresh process       fresh process
                    |             |            |                     |
                 OpenCode      OpenCode      OpenCode                  agy
                    |             |            |                     |
              DeepSeek V4      MiniMax M3    Big Pickle          Antigravity
                  Flash
                    |             |            |                     |
                   unique run log + real exit code + result
```

When the process ends, the host returns the result and also finishes.

It does not reuse a manually opened TUI. It does not leave an OpenCode routing process running accidentally. It does not share a `current-*` symlink with other workers. And it does not let `tee` hide a failing external process behind exit code 0.

That makes every route a much cleaner unit of work.

## The practical advantages

The first advantage is obvious: **one mental interface**. Codex remains the place where I describe work, inspect results, and make decisions.

The second is quota separation. Different workers can consume different providers. Long work can go to MiniMax, simple work can go to the free lane, and tool-heavy loops can go to Antigravity.

The third is specialization without locking the orchestrator to provider APIs. `agent-router` knows skills, not vendor-specific HTTP calls.

The fourth is observability. Execution no longer reduces to “the process is alive”: there is a stream, a unique run log, start/end markers, and an explicit recovery-reporting contract.

The fifth is reproducibility. A new task starts from a new process unless continuation is explicitly requested.

The sixth is controlled parallelism. Unique run IDs and separate logs remove infrastructure collisions while the worktree policy protects concurrent writes.

The seventh is error attribution. I can distinguish whether the wrapper, environment, OpenCode, AGY, model, build, or tests actually failed.

And the eighth matters a lot for an indie workflow: I can reserve the most valuable model and quota for the work where they actually contribute value.

## Drawbacks and risks that remain

There is no free orchestration.

A host consumes Codex resources while the external provider consumes its own quota. I accept that overhead because visibility and control are worth it, not because this is the cheapest possible path.

Parallelism still needs discipline. Separate logs do not stop three workers from damaging the same file if they write into the same working tree.

`--dangerously-skip-permissions` remains powerful and risky when a task is poorly scoped.

CLIs evolve. Flags, model identifiers, output schemas, and runtime paths need maintenance.

Privacy is still part of routing. Sending code to an external worker means sending it to another provider.

And the Codex UI can still summarize more aggressively than I would like. That is exactly why the logging and observability contracts now matter more.

## What I would build next

The next natural evolution is better worktree automation for parallel write tasks.

I want to be able to say:

```text
route these three tasks in parallel
```

and have the router decide whether they are read-only, whether their scopes are truly independent, or whether isolated worktrees should be created before the hosts are launched.

Another useful improvement would be execution metrics: duration, exit code, retry count, diff size, tests run, and success rate by worker. With enough history, routing could evolve from a hand-written heuristic toward a policy informed by real experience.

There is also the interactive bridge I deliberately postponed. A host could eventually detect that an external worker needs a decision, try to answer from Codex context, and ask the human only when a real product choice is required.

I do not want to build that until repeated friction justifies it. The purpose of this system is to reduce ceremony, not to build an agent platform for its own sake.

## What this system actually solved

The problem was never simply “how do I run OpenCode from Codex?” That is one shell command.

The real problem was:

**How can I keep Codex as my primary working interface while taking advantage of other agents, models, subscriptions, and quotas in a way that remains understandable, observable, and controllable?**

Skills solved encapsulation.

Runners solved unattended execution.

Ephemeral processes solved lifecycle management.

Unique `RUN_ID`s and per-run logs solved collisions and improved traceability.

`PIPESTATUS[0]` made the result belong to the actual worker rather than `tee`.

Removing `ln -sfn` eliminated unnecessary complexity and a real infrastructure failure.

`agent-router` solved selection.

The “delegate/route” vocabulary solved human ambiguity.

Host subagents solved much of the observability problem.

Streaming output and logs provided a second channel when the UI was not enough.

Recovery-reporting rules make environment fixes and retries auditable.

And Codex remains the component that integrates, verifies, and decides whether the work is actually done.

The best automation is not always the one that eliminates every decision. Sometimes it is the one that compresses twenty annoying decisions into two meaningful ones while leaving enough evidence to understand what happened when something goes wrong.

## References

- [OpenAI — Codex](https://openai.com/codex/)
- [OpenAI — Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [OpenAI Codex source — multi-agent `spawn_agent`](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs)
- [OpenCode — CLI documentation](https://opencode.ai/docs/cli/)
- [Google Antigravity — AGY headless mode](https://antigravity.google/docs/cli/headless/)
- [Google Antigravity — Using AGY CLI](https://antigravity.google/docs/cli/using/)
- [MiniMax — Token Plan](https://platform.minimax.io/subscribe/token-plan)

## Closing thoughts

I do not think I have built “the ultimate orchestrator.” I have built something I value more: a system I can explain from memory and, now, debug layer by layer.

I can say “delegate” and know I am creating native Codex capacity.

I can say “route” and know the work is leaving for an external worker inside a visible host.

I can name MiniMax, Antigravity, OpenCode, or the free worker when I want direct control.

I know every normal route starts a fresh process and that process should disappear when the task is done.

I know where to find its exact log without relying on a global symlink.

I know an `exit_code=0` belongs to the real worker.

And if the agent recovers from a `JAVA_HOME`, build, or environment problem, the contract now requires enough evidence to understand how that recovery happened.

When the worker is done, Codex becomes responsible again for looking at the diff and deciding whether the result is actually good.

For an indie workflow, where tools change every few months and quotas matter almost as much as model quality, that combination of flexibility, observability, and simplicity is more useful to me than a giant orchestration framework.

The goal is not to have many agents.

The goal is to make the agents I already have behave like one system.
