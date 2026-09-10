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

The naming also leaves room to grow without turning the skills directory into a pile of one-off experiments.

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

And this is where a “small helper script” started turning into the kind of rabbit hole that makes software development entertaining and mildly ridiculous.

OpenCode can ask for permission before some actions. That is great when I am sitting in front of the terminal. It is terrible if the whole point of the worker is to run unattended.

If OpenCode stops to ask and it is nested inside Codex, I get a Russian doll of waiting: OpenCode waits, Codex waits, I assume everyone is busy, and twenty minutes later I discover the entire operation was blocked on a routine confirmation.

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

That distinction mattered because I was mixing two separate concepts: behavioral instructions and an interactive permission protocol.

A skill can tell a worker not to push unless the original task authorizes it. That does not magically create a conversation bridge from OpenCode to Codex to me and back again.

We could build such a bridge. OpenCode has sessions and permission primitives. `agy` also supports continued conversations. But that was exactly the moment when simplifying the design became more valuable than maximizing capability.

We decided the external workers should be **unattended workers**.

Routine decisions: make them.

Minor ambiguity: choose the conservative option and report it later.

Major product decision that cannot be safely inferred: leave that part alone, finish the independent work, and return the blocker.

I do not want a twenty-minute worker to become a twenty-question permission interview.

I also chose not to encode Git publishing operations as unconditional CLI denies. If I explicitly write “fix this, commit it, and push it,” I want the agent to be able to do that. The original prompt is where that authorization should come from.

## agent-free: a worker I do not feel guilty spending

The next skill was `agent-free`.

Its model is:

```text
opencode/big-pickle
```

A dedicated “free worker” can sound like unnecessary optimization, but it solves a very real behavior problem.

Some software tasks are useful and mechanically easy. A first-pass analysis. A small test suite. Documentation. Repetitive edits. A basic review. A quick hypothesis about a straightforward bug.

If every one of those jobs consumes the same model and quota I want to reserve for harder work, I eventually start optimizing my behavior around quota instead of around engineering.

The free worker creates a separate economic lane.

It also made me think harder about privacy. Its skill explicitly says not to deliberately send credentials, API keys, tokens, `.env` contents, or similarly sensitive information.

That rule should really exist mentally for every external provider, but “free” is exactly where it is easiest to forget that routing models also means routing data.

Every example in this article and devlog is intentionally generic. No personal paths. No real hostnames. No IP addresses. No tokens. No private configuration copied from my machines.

Boring examples are good examples when secrets are involved.

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

In an imaginary world with infinite tokens, that would not matter.

I do not live in that world.

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
```

and later added:

```bash
--output-format stream-json
```

The timeout change was obvious. Five minutes may be enough for an answer, but not for a real coding loop that needs to inspect a project, run a build, diagnose a failure, edit code, and try again.

The reason for streaming appeared later and ended up shaping the whole system.

Before that, though, I still needed something to choose the worker.

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

Cutting the router down was probably the best improvement I made to the configuration.

Agent systems create a strong temptation to equate more instructions with more control. Past a certain point, more instructions mean more context, more duplication, and more ways for secondary rules to drown the main intent.

## The “delegate” versus “route” moment

Even with the router simplified, one ridiculous human problem remained.

I would say “delegate this task.”

To whom?

A Codex subagent?

OpenCode?

Antigravity?

Technically all of those are agents receiving delegated work.

I could have made `agent-router` infer the intended destination from the rest of the prompt. But then the everyday word “delegate” would have no stable meaning.

So we did something much better: we invented a small vocabulary convention.

**Delegate** = native Codex agents.

**Route** = external agents.

I like this far more than I expected.

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

I can be more specific:

```text
route to MiniMax
route with Antigravity
route using the free worker
```

and the explicit destination wins.

If I use neither word, the router is allowed to decide automatically.

![How Agent Router interprets native delegation and external routing.](/images/codex-agent-router-routing-en.svg)

## Then the external workers disappeared behind their processes

At this stage the system could execute work.

And I immediately wanted to see it.

I do not need access to the model's private chain of thought. That is not what matters. I want to know whether the worker is reading files, running tests, changing code, stuck, or finished.

OpenCode could expose a web interface. It could attach to a TUI. Logs were possible.

Antigravity had an especially useful option: `stream-json`.

But the more side dashboards I opened, the more I betrayed the original idea of keeping Codex as the center of the workflow.

So the question changed:

Can an external agent appear **inside** the Codex subagent workflow?

Not by pretending it is a native Codex subagent. It is not.

Instead, by using a Codex subagent as a **host**.

That is when the architecture clicked.

## The host subagent: a supervisor explicitly forbidden to help

The host is a native Codex subagent with a deliberately unglamorous job.

It does not code.

It does not fix things.

It does not decide to “use the time” by changing another file.

It launches the external skill, observes the process, keeps useful output visible, and returns the result.

For example:

```text
Main Codex
    |
    +-- host "AGY · fix build"
            |
            +-- agent-agy
                    |
                    +-- agy
                            |
                            +-- Antigravity does the work
```

Or:

```text
Main Codex
    |
    +-- host "OpenCode · refactor"
            |
            +-- agent-opencode
                    |
                    +-- OpenCode
                            |
                            +-- DeepSeek does the work
```

The instruction “do not implement the task yourself” is essential.

It sounds absurd to create a capable Codex agent and then tell it not to help, but that is exactly what prevents two agents from writing into the same working tree at the same time.

The host is observability infrastructure.

And suddenly the “delegate/route” vocabulary became even cleaner.

“Delegate” creates a Codex subagent that **does the work**.

“Route” creates a Codex host subagent that **supervises the thing doing the work**.

That is easy enough to explain that I can actually trust myself to remember it.

## Streaming: turning the terminal from a black box into telemetry

For the host to be useful, the runners need to expose progress.

OpenCode can emit raw JSON events:

```bash
opencode run \
  --format json \
  ...
```

Antigravity can emit:

```bash
agy \
  --output-format stream-json \
  ...
```

With `agy`, the stream includes initialization, steps, tool activity, and a final result. The host can therefore receive observable activity as the run progresses.

This is not the model's private reasoning, and I am not trying to obtain that.

It is something much more useful in engineering: telemetry.

Did it invoke a tool?

Is it still alive?

Did the build fail?

Did it finish?

What status did it return?

The wrappers use line-buffered output and `tee` so progress is less likely to sit inside a pipe waiting for a buffer to fill.

And then I added one more safety net: persistent logs.

## current-agent-*.log, because I do not entrust everything to one UI

The host approach is useful, but multi-agent user interfaces are still evolving. I did not want the whole system's observability to depend on whether one version of Codex chooses to render a child process event nicely.

So every runner writes a log too.

Conceptually:

```text
~/.codex/agent-runs/
├── current-agent-opencode.log
├── current-agent-minimax.log
├── current-agent-free.log
└── current-agent-agy.log
```

Each real run uses a timestamped file and updates the corresponding `current-*` pointer.

If something is not visible enough in the UI:

```bash
tail -f ~/.codex/agent-runs/current-agent-agy.log
```

and I still have the raw stream.

The `~` path is intentionally generic; no actual machine username or private filesystem path is exposed here.

At one point this felt redundant.

Then I remembered how many beautiful dashboards I have used that somehow manage to hide the one line I need.

The logs stayed.

## What agent-router does when I do not name the destination

The final policy is intentionally boring.

`agent-opencode` is the default external route.

`agent-free` is for simple work or when I want to preserve paid quota.

`agent-minimax` is for long, broad, or repetitive jobs.

`agent-agy` is for highly agentic tasks with lots of tool use and repeated build-debug-fix loops.

If I say “route,” the router chooses among those four.

If I name one, my choice wins.

If I say “delegate,” those four are not considered; the work stays with native Codex subagents.

If I simply invoke `$agent-router` with a task, I let it choose between the main Codex agent, internal subagents, or an external route.

I like having both automatic and explicit modes. Automation is useful. Predictability is useful too.

## A small rule that prevents a huge subagent party

I also capped native delegation.

Three concurrent subagents by default.

And child agents should not create more child agents unless I explicitly ask for nested delegation.

This may sound conservative in a year when every AI demo seems to involve twenty little agent icons running around a canvas.

But twenty agents are much less impressive when six of them investigate the same thing and three edit the same file.

Subagents are excellent when tasks are genuinely independent:

```text
subagent A -> algorithm
subagent B -> tests
subagent C -> performance
```

Great.

This is less great:

```text
subagent A -> change class X
subagent B -> change class X
subagent C -> refactor class X while the others are changing it
```

That is not orchestration.

That is three people trying to use the same keyboard.

## The invisible part: creating a good handoff

By now I had names, routing, hosts, and streaming.

It would have been easy to declare victory.

But great models still fail when handed vague tasks.

`agent-router` needs to transform the conversation into a self-contained handoff.

Not copy everything.

Not paste an hour of chat.

Extract the goal, constraints, relevant module, expected behavior, verification requirements, and any explicit authorization for publishing operations.

This reduces token waste and reduces confusion.

It is also a privacy boundary. If the conversation contains details from other projects, the external worker should not receive them unless they matter.

A good agent architecture decides not only where code runs.

It decides what context crosses each boundary.

## Ollama walked into the design and left without a skill

I also checked Ollama.

I did not want to run local models yet, but Ollama Cloud offers remote inference and its free plan includes a small starter allowance for selected models.

Technically, another worker was possible.

I did not add it.

This is the kind of decision that disappears from polished write-ups, which is why I want it in the devlog.

We already had a free worker.

Adding `agent-ollama` just because it was technically possible would create another route, another availability policy, another moving model list, and another thing to maintain.

The question was: what new problem does this solve?

At that moment, none.

So it stayed out.

It can come back later.

## One last rule: call each thing what it actually is

There was another correction during the design that turned out to matter more than expected: stop calling everything Codex launches a “Codex subagent.”

If Codex creates a native worker through its multi-agent mechanism, that is a **Codex subagent**. It runs inside Codex's own multi-agent system and performs a delegated task.

If Codex executes OpenCode, MiniMax through OpenCode, Big Pickle, or `agy`, that is an **external agent**. Even when that process is launched from a Codex host subagent and appears under a Codex thread, the actual engineering work is being done by another tool and potentially another provider.

This may sound pedantic. It prevents bad assumptions.

When I say a task stays “internal,” that also says something about context and provider boundaries. When I say work is routed outside, I know I need to think about authentication, quota, data policy, and the behavior of another CLI.

The host does not erase the boundary. It only makes the boundary easier to supervise.

This week reminded me of a very basic engineering rule: architecture becomes manageable when names stop lying. If everything is called agent, worker, subagent, and delegated task interchangeably, you end up writing huge instruction files to compensate for a bad taxonomy. With four reasonably clear concepts — main Codex, native subagent, host, and external agent — the diagram almost explains itself.

And if the diagram explains itself, the skill can be shorter.

Fewer instructions mean fewer tokens spent remembering infrastructure every time I just want to fix a button.

## The good part: why I like the result

The first gain is continuity.

I do not “leave Codex to use another agent.” I tell Codex that another system should perform part of the work.

The second gain is resource separation. Long jobs can go to MiniMax, cheap jobs to the free worker, tool-heavy loops to Antigravity, and ordinary external work to OpenCode/DeepSeek.

The third is that names have meaning.

`agent-opencode` is not a random box.

`agent-minimax` does not silently become another provider.

`agent-free` represents a cost goal.

`agent-agy` represents high autonomy and tool access.

`agent-router` represents policy.

The fourth is observability.

The host gives me a thread.

The stream gives me activity.

The log gives me a fallback.

The fifth is replaceability. If the model behind `agent-opencode` changes six months from now, the router does not need to care.

And the sixth is less visible but probably the feature I will use most: vocabulary.

“Delegate” and “route” may be the best part of the whole system.

## The bad part: because of course there is a bill

The first bill is tokens.

A Codex host waiting on an external worker is not free. I am spending some Codex capacity in order to gain visibility and organization.

The second bill is operational complexity.

Five skills are more than zero skills. There are scripts. CLIs. Authentication. Versions.

The third is the working tree.

If I get excited and launch three workers that all write the same files, that is not an AI problem. That is my problem.

Serious parallel writing will need worktrees or clearly separated write scopes.

The fourth is Antigravity with unrestricted tool approval.

`--dangerously-skip-permissions` is useful for exactly the reason it is dangerous. I do not want to euphemize that.

The fifth is privacy.

Every external provider is a boundary. Convenience does not remove the need to decide what code is allowed to cross it.

The sixth is that `agent-router` is not omniscient.

It can route a task to the wrong worker. That is why explicit routing exists.

And the seventh is UI visibility. A host subagent helps, but Codex is not required to render every external event exactly the way I imagine. The logs exist for a reason.

## What we actually solved this week

At the beginning I thought I was building “a way to use OpenCode from Codex.”

That would have been a very poor description of where I ended up.

What emerged is a small orchestration layer.

Before:

```text
me -> tool A
me -> tool B
me -> tool C
me -> reconcile everything
```

After:

```text
me -> Codex -> router -> worker
                  |
                  +-> Codex verifies
```

And when I need native parallelism:

```text
me -> Codex -> delegate -> Codex subagents
```

The keyword is not “agents.”

It is **flow**.

I have reduced human context switches. That is the value.

I do not care much whether four models, six processes, and twelve JSON event types exist underneath if I can keep one coherent conversation with the orchestrator.

## What I would build next

There are several obvious improvements.

One is to collect worker metrics: duration, exit status, file count, test results, perhaps cost where providers expose it. The router could then rely less on static heuristics and more on actual history.

Another is to create worktrees automatically when multiple routed tasks need to write in parallel.

Another is to improve the host so that if an external worker returns an important question, Codex can evaluate it and answer without killing the entire execution. That would require more persistent session handling.

And another is a small dashboard over the logs.

Ironically, I do not need that dashboard yet because I just spent all week trying to avoid needing another interface.

The temptation will be to add everything.

I will try to resist it.

## Technical references from this week

- [OpenAI — Codex](https://openai.com/codex/)
- [OpenAI — Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [OpenAI Codex — `spawn_agent` implementation](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs)
- [OpenCode — CLI documentation](https://opencode.ai/docs/cli/)
- [Google Antigravity — AGY headless mode](https://antigravity.google/docs/cli/headless/)
- [MiniMax — Token Plan](https://platform.minimax.io/subscribe/token-plan)
- [Ollama — pricing](https://ollama.com/pricing)

## Closing: a small switchboard beats five telephones

Some weeks end with a visible feature. A new screen. A button. Something you can point at.

This week ended with five skill directories and several scripts.

Not especially photogenic.

But it changes how I want to work.

The part I like most is that I did not try to replace one tool with another. I accepted that different tools have different strengths and gave them a small hierarchy.

Codex is in charge.

Its native subagents help when I say “delegate.”

External agents work when I say “route.”

A host watches them.

Logs remember what happened.

And I try not to launch three agents against the same file at two in the morning.

That last part is not automated yet.

Give me another week.
