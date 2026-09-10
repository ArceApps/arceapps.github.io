---
title: "2026 W37: Codex Learns to Route Work (Agent Router)"
description: "A building-in-public account of turning Codex into a control hub for native subagents and external OpenCode, MiniMax, Big Pickle, and Antigravity workers."
pubDate: 2026-09-10
lastmod: 2026-09-10
author: "ArceApps"
keywords: ["ArceApps", "Codex", "Agent Router", "OpenCode", "Antigravity"]
canonical: "https://arceapps.com/devlog/2026-W37-codex-agent-router/"
heroImage: "/images/devlog-codex-agent-router.svg"
tags: ["devlog", "building-in-public", "codex", "ai-agents", "opencode", "antigravity"]
draft: false
---

## The week when “delegate” stopped meaning everything

There are words in software that should come with a tiny lawyer attached. “Service.” “Process.” “Agent.” And, after this week, “delegate.”

I had been using Codex as my main working surface while collecting other tools around it for different reasons: OpenCode, Antigravity, several models exposed through different providers, and the possibility of sending long-running work to MiniMax. Getting each tool to work on its own was not the hard part. That part was surprisingly easy.

The real problem was that they all worked **too separately**.

Open one tool, copy a task, paste context, wait, switch windows, inspect changes, try to remember which agent touched which file, then return to the original conversation. It is a very 2026 way of manually recreating a telephone switchboard from 1950.

This week I wanted to stop doing that.

I wanted to keep talking to Codex. I wanted Codex to remain the place where I think through a feature, investigate a bug, and decide what to do with a repository. But I also wanted to be able to say: send this part to another agent. Not “write me a prompt I can copy.” Not “open another program.” **You send it.**

And while I was at it, I did not want every external agent to be treated as interchangeable. A trivial task does not deserve the same route as a repository-wide migration. A task that needs to run, compile, fail, fix, and repeat is not the same as drafting documentation. A free model is useful for some work and the wrong choice for other work.

That idea ended up becoming five skills: `agent-opencode`, `agent-free`, `agent-minimax`, `agent-agy`, and `agent-router`.

The technical article for this week explains the architecture in a more structured way: [Codex Agent Router: Orchestrating External Agents](/blog/codex-agent-router-external-agents/). This devlog is the kitchen version: how the design changed while I was making it, what I rejected, and why the word “route” turned out to be one of the most useful pieces.

There is one important difference from the first version of this entry: after writing the architecture down, I started running it for real. Things broke. Some failures looked like sandbox problems, others looked like OpenCode problems, and one of the most annoying errors eventually turned out to come from a Bash line I had written myself. That was useful. The system is better because it failed early enough to expose the weak assumptions.

![The architecture I ended up building.](/images/codex-agent-router-architecture-en.svg)

## Starting point: if agy can do it, why not everything else?

It started with Antigravity.

I already knew `agy` could launch Antigravity from the command line. That changes the nature of a tool. A graphical application can be excellent, but from an automation perspective it lives behind a door that a human normally opens. A non-interactive CLI becomes something another process can invoke.

Codex can invoke processes.

So the first version of the idea was almost embarrassingly simple:

```text
Codex -> agy -> Antigravity
```

If I can type:

```bash
agy -p "Review this module"
```

Codex can type it too.

The next question arrived immediately: OpenCode also has a CLI. Not a token “yes, technically there is a command” CLI, but a proper `run` mode suitable for automation.

The diagram became:

```text
Codex
├── agy -> Antigravity
└── opencode run -> external model
```

That is when the idea stopped being a fun experiment and started looking like infrastructure. OpenCode could be a common harness for several models, so I would not need a completely different integration for every provider.

I reviewed the models available in my setup and focused on three OpenCode-backed routes: DeepSeek V4 Flash as the general worker, Big Pickle as the free worker, and MiniMax M3 for long jobs through the MiniMax plan.

The fourth route would remain Antigravity through `agy`.

On paper, that already looked useful. In practice, almost every interesting design decision was still ahead.

## First debate: one skill or four?

My first question was perfectly reasonable: do I really need four skills? Why not make one OpenCode skill and pass the model name?

Yes, I could.

For a few minutes it looked cleaner:

```text
$opencode deepseek ...
$opencode minimax ...
$opencode free ...
```

But the closer I looked, the less I liked it.

I did not want Big Pickle to be merely a different string. I wanted the free worker to carry its own rule about sensitive information. I did not want Antigravity to share OpenCode's permission assumptions because the CLIs behave differently. I did not want MiniMax to silently fall back to another provider if something failed. And I wanted the general OpenCode worker to have a stable identity.

So I settled on a consistent naming scheme:

```text
agent-opencode
agent-free
agent-minimax
agent-agy
```

The funny part is that splitting the skills did not make the system harder to think about. It made it easier.

Each skill knows one thing.

The question of **which one to use** would be solved at another layer.

## agent-opencode: the general-purpose worker

For `agent-opencode` I pinned:

```text
opencode-go/deepseek-v4-flash
```

The point was not to crown a universal benchmark champion. I wanted a fast external worker for the kind of tasks I regularly want to unload from Codex: a bounded bug, a fairly clear implementation, tests, moderate refactoring, or a well-defined multi-file change.

The base command became:

```bash
opencode run \
  --model "opencode-go/deepseek-v4-flash" \
  --dir "$REPOSITORY" \
  --auto \
  "$TASK"
```

That was the easy part.

Then permissions entered the room.

OpenCode can ask for permission before some actions. That is great when I am sitting in front of the terminal. It is terrible if the whole point of the worker is to run unattended.

If OpenCode stops to ask while nested inside Codex, I get a Russian doll of waiting: OpenCode waits, Codex waits, I assume everyone is busy, and twenty minutes later I discover the entire operation was blocked on a routine confirmation.

So I chose `--auto`.

The important detail is that it auto-approves things that are not explicitly denied. A real `deny` remains a wall.

That immediately led to the next question: Git.

## The small drama of “can it push?”

At one point the skill said something like:

```text
Do not commit, push, merge or delete branches unless explicitly requested.
```

Reasonable sentence.

Then the next question was: if the model needs permission for one of those actions, can it stop, ask the orchestrator, wait for me, receive the answer, and continue?

Not automatically.

That distinction mattered because I was mixing two concepts: behavioral instructions and an interactive permission protocol.

A skill can tell a worker not to push unless the original task authorizes it. That does not magically create a conversation bridge from OpenCode to Codex to me and back again.

We could build such a bridge. OpenCode has sessions and continuation primitives. `agy` does too. But that was exactly the moment when simplifying the design became more valuable than maximizing capability.

The external workers would be **unattended workers**.

Routine decisions: make them.

Minor ambiguity: choose the conservative option and report it later.

Major product decision that cannot be safely inferred: leave that part alone, finish independent work, and return the blocker.

I do not want a twenty-minute worker to become a twenty-question permission interview.

## agent-free: a worker I do not feel guilty spending

The next skill was `agent-free`.

Its model is:

```text
opencode/big-pickle
```

A dedicated “free worker” can sound like unnecessary optimization, but it solves a real behavior problem.

Some software tasks are useful and mechanically easy. A first-pass analysis. A small test suite. Documentation. Repetitive edits. A basic review. A quick hypothesis about a straightforward bug.

If every one of those jobs consumes the same model and quota I want to reserve for harder work, I eventually start optimizing my behavior around quota instead of around engineering.

The free worker creates a separate economic lane.

It also forced a stronger privacy contract. Its skill explicitly says not to deliberately send credentials, passwords, API keys, tokens, `.env` contents, private keys, authentication cookies, or similarly sensitive information.

That rule belongs mentally around every external provider, but “free” is exactly where it is easiest to forget that routing models also means routing data.

## agent-minimax: another model without another harness

MiniMax presented a different choice because I could have added an entirely separate coding frontend.

But OpenCode was already there.

If OpenCode could use MiniMax as the provider, the question became: do I want another harness, or do I want one harness with another model behind it?

I chose the latter.

`agent-minimax` pins:

```text
minimax-coding-plan/MiniMax-M3
```

That gives me the same conceptual runner as `agent-opencode`.

What changes is the role.

I explicitly did **not** build a silly ladder like:

```text
easy -> free
medium -> DeepSeek
hard -> MiniMax
very hard -> Antigravity
```

That looks neat and does not match real work.

Some difficult problems are tiny. Some easy changes are enormous.

MiniMax became the **long-job worker**: migrations, repetitive implementation, broad refactors, changes across many files, and work where the number of iterations matters more than an immediate response.

There is also a quota benefit. Work can consume the MiniMax plan instead of always drawing from the same main pool.

## agent-agy: “all permissions” means all permissions

Antigravity was the case where I had a very explicit requirement: I wanted the worker to operate without stopping for tool confirmations.

`agy` provides:

```bash
--dangerously-skip-permissions
```

There is not much ambiguity in that flag name.

I chose it deliberately.

I also set:

```bash
--effort high
--print-timeout 30m
--output-format stream-json
```

The timeout change was obvious. Five minutes may be enough for an answer, but not for a real coding loop that needs to inspect a project, run a build, diagnose a failure, edit code, and try again.

The reason for streaming ended up shaping the whole system: if Codex is going to supervise an external worker, it needs observable activity while that worker is operating.

## agent-router is born, and initially carries far too much luggage

Once the four workers existed, the next problem was predictable.

Would I remember the policy for all four every time?

Probably for a week.

Then I would send almost everything to `agent-opencode` because that would be the name my fingers remembered.

So I created `agent-router`.

The first draft was enormous. It contained permission rules, models, Git policy, session behavior, fallback logic, concurrency rules, verification, and examples for almost every situation.

It was thorough.

It was also a bad router.

We stopped and asked what the skill actually needed to know.

It did not need to know how `agy` handles timeout.

It did not need to know every OpenCode flag.

It did not need to duplicate the privacy policy of `agent-free`.

It needed to answer one question:

**Where should this task go?**

Everything else belongs to the worker skill.

## The “delegate” versus “route” moment

Even with the router simplified, one ridiculous human problem remained.

I would say “delegate this task.”

To whom?

A Codex subagent?

OpenCode?

Antigravity?

Technically all of those are agents receiving delegated work.

I could have made `agent-router` infer the intended destination from context. But then the everyday word “delegate” would have no stable meaning.

So we did something much better: we invented a small vocabulary convention.

**Delegate** = native Codex agents.

**Route** = external agents.

If I write:

```text
$agent-router delegate the test review
```

I want a Codex subagent.

If I write:

```text
$agent-router route the test review
```

I want the actual work to leave Codex and go to an external worker.

And I can be more specific:

```text
route to MiniMax
route with Antigravity
route using the free worker
```

without losing control.

![How Agent Router interprets native delegation and external routing.](/images/codex-agent-router-routing-en.svg)

## The host subagent: a supervisor explicitly forbidden to help

When I wanted to see what the external worker was actually doing, the host idea appeared.

The host is a native Codex subagent with a deliberately unglamorous job.

It does not code.

It does not fix things.

It does not “use the time” by editing another file.

It launches the external skill, observes the process, keeps useful output available, and returns the result.

For example:

```text
Main Codex
    |
    +-- host "MiniMax · refactor"
            |
            +-- agent-minimax
                    |
                    +-- opencode run
                            |
                            +-- MiniMax does the work
```

The instruction “do not implement the task yourself” is essential.

It sounds strange to create a capable Codex agent and then tell it not to help, but that is exactly what prevents two agents from writing into the same working tree at the same time.

The host is observability infrastructure.

“Delegate” creates a subagent that **does the work**.

“Route” creates a subagent that **supervises the thing doing the work**.

That distinction became more useful every time the system broke.

## First contact with reality: `ln: Read-only file system`

The architecture looked great in diagrams. Then a real MiniMax route produced:

```text
ln: Read-only file system
```

The immediate interpretation was permissions.

The host is restricted. OpenCode cannot write. MiniMax cannot even start. Something about the sandbox must be wrong.

The outer permission layer did matter. A child host cannot simply invent authority that the parent session does not have. I adjusted the execution context so the host process had the access required to launch the external CLI.

The next attempt got farther.

But the best part came when I traced the exact `ln` command.

MiniMax was not running it.

OpenCode was not running it either.

**My own wrapper was.**

The original `scripts/run.sh` contained:

```bash
CURRENT="$LOG_DIR/current-${AGENT_NAME}.log"
ln -sfn "$LOG" "$CURRENT"
```

I had created a `current-agent-minimax.log` symlink so tailing the latest execution would be convenient. Perfectly reasonable. Also unnecessary for the final design.

The error that looked like proof that the external agent lacked permission was actually my launcher failing before the external agent existed.

That was one of the best bugs of the week because it forced me to separate the layers properly.

## The fix was deleting complexity, not adding more permission

Instead of trying to make the symlink work in every host environment, I removed it.

Logs stopped being shared “current state” and became unique execution artifacts:

```bash
LOG_DIR="${AGENT_ROUTER_LOG_DIR:-${TMPDIR:-/tmp}/codex-agent-router}"
STAMP="$(date '+%Y%m%d-%H%M%S')"
RUN_ID="${STAMP}-$$-${RANDOM}"
LOG="$LOG_DIR/${AGENT_NAME}-${RUN_ID}.log"
```

Now several runs can coexist cleanly:

```text
/tmp/codex-agent-router/
├── agent-minimax-20260910-130501-12345-9123.log
├── agent-minimax-20260910-130502-12347-1221.log
├── agent-opencode-20260910-130504-12351-18003.log
└── agent-agy-20260910-130507-12360-22114.log
```

Two MiniMax workers no longer fight over `current-agent-minimax.log`.

The wrapper no longer needs to write under `~/.codex` just to store telemetry.

And the host receives the exact log path for the execution it owns.

One deleted symlink improved permissions, parallelism, and observability at the same time.

## Then `opencode.log` appeared and made everything suspicious again

The next run advanced farther and failed while opening:

```text
~/.local/share/opencode/log/opencode.log
```

Again, it smelled like permissions.

This time I tried to avoid guessing and tested the layers separately.

From the same Codex context I could create and remove a file in that directory. Unix ownership and mode looked correct. The user was the expected user. The long-running interactive OpenCode process had the same `HOME` and identity.

There was also an OpenCode session that had been alive for hours, which made it tempting to blame a persistent process.

But `lsof` did not show that process holding the newly created log, and a normal Linux log file does not become exclusive simply because another OpenCode process exists.

The more useful lesson was different: **a persisted OpenCode session and a live OpenCode process are not the same thing**.

That led directly to a lifecycle rule I now consider fundamental.

## One task, one process

Every normal route is now ephemeral.

```text
one task
    -> one Codex host
        -> one opencode run or one agy process
            -> process ends
        -> host returns the result
    -> host ends
```

The router does not reuse an OpenCode TUI I happen to have open.

It does not attach to an existing server or session by default.

It does not use `--continue` or `--session` unless the task explicitly says to continue an earlier execution.

It does not kill my manually opened sessions either. Those are unrelated user processes.

I like this rule because it makes the default path reproducible. Two independent routes start as two independent processes.

OpenCode can still keep session history after a run exits. That is useful and harmless. Persisted history is not a background worker.

The distinction is tiny in wording and huge in operational clarity.

## MiniMax finally worked, and then I discovered I was not seeing enough

Once the launcher problems were out of the way, MiniMax actually completed a real coding task.

It modified only the authorized test file.

It ran the focused test.

It passed.

It ran the full suite.

That passed too.

`git diff --check` was clean.

Exit code 0.

That was exactly what I wanted.

But something more interesting had happened during the run: the first test attempt failed because of `JAVA_HOME`. MiniMax found an available JDK, adjusted the environment, and retried successfully.

The host summarized it roughly like this:

```text
The first attempt failed because of JAVA_HOME; MiniMax retried with the available JDK and passed.
```

Correct.

And completely insufficient for the system I want.

Which command failed?

What `JAVA_HOME` value did it use next?

What exact command did it retry?

Was the environment change scoped to the process, or did it modify persistent configuration?

I do not want the model's private chain of thought. I want to know what happened on my machine.

That distinction became another explicit part of the worker contract.

## Observability is not merely seeing that “something is working”

The current contract says that, when the information exists, the host should expose:

```text
- relevant shell commands;
- builds;
- tests;
- Git operations;
- environment changes;
- errors;
- retries;
- recovery actions;
- important modified files.
```

If a command fails and the worker recovers, the ideal sequence is:

```text
1. original command;
2. relevant error;
3. corrective action;
4. retry command;
5. result.
```

The final summary can still say “MiniMax fixed JAVA_HOME.” It simply should not be the only evidence available.

I also added the opposite rule: never invent commands that were not actually present in the external output. If the CLI only emits a semantic summary, Codex should admit that limitation instead of reconstructing a plausible shell command.

Useful observability is preserving evidence, not manufacturing detail.

## `--print-logs`, `tee`, and an exit code that cannot lie

The OpenCode wrappers now share the same execution shape:

```bash
stdbuf -oL -eL \
  opencode \
    --print-logs \
    --log-level INFO \
    run \
    --model "$MODEL" \
    --dir "$REPO" \
    --auto \
    --format json \
    --title "Codex ${AGENT_NAME} ${RUN_ID}" \
    "$TASK" \
    2>&1 | tee "$LOG"

STATUS=${PIPESTATUS[0]}
```

`PIPESTATUS[0]` deserves special appreciation.

A shell pipeline can make it very easy to accidentally observe the exit status of `tee`. And `tee` can succeed perfectly even when OpenCode failed.

I did not want this:

```text
OpenCode -> exit 1
tee      -> exit 0
router   -> “success”
```

The final status now belongs to the actual worker process.

AGY keeps its own `stream-json` and `--dangerously-skip-permissions`, but follows the same outer contract: unique run, unique log, `tee`, real exit status, and process termination.

## Tiny markers so the host does not have to interpret prose

I also standardized two basic markers.

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
log=/tmp/codex-agent-router/agent-minimax-....log
status=success
```

This is not an attempt to invent a giant protocol.

I just do not want the host to infer from prose whether a process ended, which log belongs to it, or which exit code matters.

The less interpretation the infrastructure needs, the better.

## Parallelism: yes, but Codex should know it is happening

Once every route is its own process, the next question becomes obvious: why not launch several at once?

Yes.

But I want Codex to control the parallelism rather than hiding it inside one persistent OpenCode session.

For read-only work, great:

```text
Codex
├── host A -> MiniMax inspects architecture
├── host B -> DeepSeek reviews tests
└── host C -> Big Pickle reviews documentation
```

For writes, caution.

Three agents editing the same file are not “multi-agent engineering.” They are three processes competing for a shared resource.

The current policy is simple:

- read-only work: parallelize when useful;
- writes with clearly separate scopes: possible;
- overlapping writes: no;
- large parallel write tasks: separate Git worktrees.

The architecture I want to automate next is:

```text
Codex
├── host A -> MiniMax  -> worktree A
├── host B -> DeepSeek -> worktree B
└── host C -> AGY      -> worktree C
```

Then Codex integrates.

I prefer that over hiding the primary concurrency inside OpenCode because it keeps the work map at the same level where I am already supervising the project.

## A small rule that prevents an enormous subagent party

Native delegation also has limits.

By default, I cap it at three concurrent Codex subagents.

And I tell them not to create more children unless I explicitly ask.

That may sound conservative in 2026, when every AI product wants to show an animation with twenty agents moving cards around a screen.

My experience is that twenty agents look much better in a diagram than they do when five investigate the same thing and three edit the same file.

Subagents are excellent when the units of work are independent.

For example:

```text
subagent A -> algorithm
subagent B -> tests
subagent C -> performance
```

Great.

```text
subagent A -> edit class X
subagent B -> edit class X
subagent C -> refactor class X at the same time
```

That is not multi-agent engineering. It is three people trying to type on the same keyboard.

## The invisible part: preparing a good handoff

By this point I had names, routing, hosts, streaming, and lifecycle rules.

It would have been easy to declare victory.

But vague tasks kill better agent systems than this one.

`agent-router` needs to turn the conversation into a self-contained handoff.

Not copy everything.

Not paste thirty minutes of chat history.

Extract objective, constraints, relevant module, expected behavior, validation, write scope, pre-existing changes that must be preserved, and Git authorization if any exists.

That reduces tokens and reduces errors.

It is also a privacy boundary. Context from another project does not need to travel to an external provider just because both projects happened to be discussed in the same conversation.

A good agent architecture decides not only where code executes, but which context crosses each boundary.

## What I like about the result

The first thing I gain is continuity.

I do not leave Codex to “use another agent.” From Codex I decide that another tool should perform a piece of work.

The second is resource separation. Long tasks can go to MiniMax, cheap tasks to the free worker, tool-heavy loops to Antigravity, and normal external coding to OpenCode/DeepSeek.

The third is that names mean something.

`agent-opencode` is not a random backend.

`agent-minimax` does not silently change providers.

`agent-free` represents a cost objective and carries stricter secret-handling rules.

`agent-agy` represents autonomy and aggressive tool use.

`agent-router` represents policy.

The fourth is that each normal route is now a clean unit of work: new process, new log, new result.

The fifth is observability. The host gives me a thread, the stream gives me activity, and the log gives me evidence when the UI summarizes too much.

The sixth is failure attribution. A broken `ln` in my wrapper is not a MiniMax failure. A test broken by MiniMax's implementation is.

The seventh is replaceability. If the preferred model behind `agent-opencode` changes in six months, the router does not need to care.

And the eighth is still my favorite: I have a vocabulary. “Delegate” and “route” may be the feature I use most often.

## The bill, because there is always a bill

The first bill is tokens.

A Codex host waiting for an external worker is not free. I am spending an extra layer to gain visibility.

The second is operational complexity.

Five skills are more than zero skills. There are scripts. CLIs. Authentication. Versions.

The third is the working tree.

If I get excited and launch three writing workers against the same files, the problem is not artificial intelligence. The problem is me.

Serious parallel writing needs worktrees or clearly isolated scopes.

The fourth is Antigravity with unrestricted tool approval.

`--dangerously-skip-permissions` is useful precisely because it is dangerous. There is no point pretending otherwise.

The fifth is privacy.

Every external provider is a boundary. A convenient router does not remove the responsibility to decide what code may cross it.

The sixth is that `agent-router` is not omniscient.

It can choose the wrong worker. Explicit routing exists for a reason.

And the seventh is that observability still does not mean perfect visibility. CLIs and UIs can summarize. The log gives me a fallback, but there is still room to improve the presentation layer.

## What we actually solved this week

At the beginning I thought I was building a way to “use OpenCode from Codex.”

That would have been an incomplete description.

What appeared instead is a small orchestration layer.

Before:

```text
me -> tool A
me -> tool B
me -> tool C
me -> reconcile everything
```

Now:

```text
me -> Codex -> router -> host -> external worker
                  |               |
                  |               +-> log + exit code
                  |
                  +-> Codex verifies
```

And when I need internal parallelism:

```text
me -> Codex -> delegate -> Codex subagents
```

The important word is not “agents.”

It is **flow**.

I reduced the number of human context switches. That is the real value.

I do not care very much whether the lower layers contain four models, six processes, or twelve JSON event types if I can maintain one coherent conversation with an orchestrator.

## What I would build next

The clearest next improvement is automatic worktree management for parallel write routing.

I want Codex to inspect three tasks, recognize overlapping scopes, and isolate them before launching external workers.

I also want metrics: duration, exit code, files touched, tests run, retry count, and perhaps cost when providers expose it cleanly. That would let routing become less intuition-driven and more evidence-driven.

Another improvement is presentation of the structured stream. I do not need every byte of JSON in the UI. I do want tools, commands, retries, and important environment changes to appear clearly.

And the interactive bridge remains possible. If an external agent reaches a real product decision, Codex could eventually try to resolve it from context and escalate to me only when necessary.

I do not want to build that yet.

The temptation will be to add everything.

I will try to resist it.

## One last rule: call things what they are

One correction ended up mattering more than I expected: stop calling everything Codex launches a “Codex subagent.”

If Codex creates a native agent through its multi-agent mechanism, that is a **Codex subagent**.

If Codex launches OpenCode, MiniMax through OpenCode, Big Pickle, or `agy`, that is an **external agent**.

If a Codex subagent exists only to keep that external process visible and supervised, that is a **host**.

And if OpenCode keeps a session record after the process exits, that is **persisted history**, not a live process.

This sounds like terminology obsession, but it prevents bad design decisions. “Internal” and “external” also describe context boundaries and provider boundaries. The host makes an external worker easier to supervise; it does not turn that worker into a native Codex agent.

This week reminded me of something basic: architectures become manageable when their names stop lying.

## Technical references from this week

- [OpenAI — Codex](https://openai.com/codex/)
- [OpenAI — Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [OpenAI Codex — `spawn_agent` implementation](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs)
- [OpenCode — CLI documentation](https://opencode.ai/docs/cli/)
- [Google Antigravity — AGY headless mode](https://antigravity.google/docs/cli/headless/)
- [MiniMax — Token Plan](https://platform.minimax.io/subscribe/token-plan)

## Closing: a small switchboard beats five phones

Some weeks end with a visible feature. A new button. A screen. Something you can point at.

This week ended with five skill directories, several scripts, and a surprising number of opinions about Bash process lifetime.

It is not especially photogenic.

But it changes how I want to work.

The part I like most is that I did not try to replace one tool with another. I accepted that several tools have things I want and gave them a simple hierarchy.

Codex is in charge.

Its subagents help when I say “delegate.”

External agents work when I say “route.”

A host watches them.

Every normal route starts clean and ends when its process ends.

Logs tell me what happened without competing for a global symlink.

The exit code belongs to the worker, not `tee`.

And if MiniMax repairs `JAVA_HOME` on the way, I want enough evidence to know how.

The funniest part is that several of these rules did not come from architecture diagrams. They came from concrete failures. First it looked like we had a permission problem. Then it looked like OpenCode could not use its log. Then I discovered part of the problem was my own `ln`. Later MiniMax finally worked and the new problem became that I could not see enough detail about what it had done.

That is probably the best thing that can happen to a small piece of infrastructure: fail early, in front of you, in ways you can trace.

The system does not just work better now.

I also know much better where to look when it stops working again.
