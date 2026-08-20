---
title: "DeepSeek Harness: the runtime where everything is a plugin"
description: "DeepSeek Harness (dsh) is an MIT open-source runtime where model, tools, session, sandbox and even the loop are plugins. Deep-dive into Cordis, runtime modes, append-only session log and self-evolution."
pubDate: 2026-08-20
lastmod: 2026-08-20
author: "ArceApps"
keywords:
  - "DeepSeek Harness"
  - "dsh"
  - "Cordis"
  - "Agent Harness"
  - "Plugin Architecture"
  - "Self-Evolving Agents"
canonical: "https://arceapps.com/blog/deepseek-harness-everything-plugin/"
heroImage: "/images/deepseek-harness-everything-plugin-en.svg"
tags: ["DeepSeek", "AI Agents", "Harness", "Open Source", "Indie Dev"]
reference_id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"
---

## The week DeepSeek changed the harness debate

On August 13, 2026, DeepSeek published the `deepseek-ai/deepseek-harness`
repository on GitHub under the MIT license. What would normally have been
another agent-infrastructure release became, in 48 hours, one of the
fastest adoption curves GitHub has ever recorded for a developer tool.
Per the GitHub API snapshot captured by Flowtivity on August 15, the
repository had accumulated 95,386 stars and 8,826 forks; journalist
Justin3Go, who had the clock running from minute one, reported 50,000
stars in 12 hours and ~92,000 by the close of day two. For reference,
the previous record-holder — OpenClaw — took 84 days to reach 200,000.

What does DeepSeek Harness (`dsh`) have to provoke that reaction? It is
not a new model: V4-Pro-0813 shipped the same day, but the publication
of the harness as auditable code is what separates this release from
previous ones. The central proposal is a single line the official page
repeats until you're tired of reading it:

> **Everything is a plugin.**

And they mean it. The model is a plugin. The tool registry is a plugin.
The sandbox is a plugin. The session log is a plugin. The web interface
is a plugin. And —here is the real twist— **the agent loop itself is
a plugin**. That last line changes what kind of framework `dsh` is:
it is not "another Claude Code with another name," it is a declaration
about how the agent runtime should be structured to eventually support
agents that modify themselves.

Before going further, two obligatory links to the blog's prior art:
this article builds on [Harness Engineering: The Wrapper Wins](/blog/harness-engineering-wrapper-gana/),
where I argued the harness (tools, memory, guardrails) makes the model
productive, and on [OpenCode Subagents: Workflows and Superpowers](/blog/opencode-subagents/),
where we saw how to mount a harness on top of a model without touching
its core. What `dsh` adds to the debate is the inverse question: what
if the harness itself were reconfigurable piece by piece, with no
restart needed? That is what we are going to unpack.

## Positioning: what `dsh` is and what it isn't

Read closely, the repository leaves little doubt about its intent. The
README opens with three lines: project name, organization and a link
to the Cordis framework; below, a section literally titled "Developer
preview" with the warning in caps **"THERE WILL BE COMPATIBILITY-BREAKING
CHANGES"**. The license is MIT, the stack is a TypeScript monorepo (57
package groups, ~500k lines) with ~300 lines of C11 underneath the Linux
sandbox, and the version in circulation as I write is `0.1.0-rc.5`.

The least publicized and most important detail: `dsh` is
**model-agnostic**. The model adapter lives at `ctx.llm`, and in the
documented integrations appear DeepSeek, OpenAI, Anthropic, Google, Kimi
and any endpoint compatible with the OpenAI format. Hooking up a new
one costs a few lines of YAML; switching providers on the fly, without
recompiling. This is why the official page describes `dsh` with the
formula:

> **Agent = Model + Harness**

The model is "the soul of an agent"; the harness is what lets it
understand its environment, use tools and keep working under real
conditions. It is a design declaration that separates, for the first
time in an operational way, the model layer from the execution layer.

A piece of backstory that helps explain day-one maturity: when DeepSeek
previously published DeepSWE benchmark numbers, part of the community
criticized them as "vendor-reported, unreproducible," and the team
committed to "open-source the harness used for evaluation." All signals
point to `dsh` being exactly that promise kept — the 22 initial
contributors, the bulk of code coming from commits with thousands of
contributions per author, the 100% test coverage per file required in
CI. It is the internal framework DeepSeek uses to run agentic benchmarks
against its own models. That is why it shipped day one with a level of
polish that usually takes six months to appear.

## Cordis: the plugin operating system you didn't know

The heart of `dsh` is called Cordis, and Cordis existed before DeepSeek
put it at the center of its product. It is a plugin meta-framework whose
design is formalized in an 88-page paper, *A Programming Paradigm for
Spatiotemporal Composability*, published the same August 13 by Yifan
Shi (Peking University and DeepSeek-AI), Wei Zhang (DeepSeek-AI) and
Tianyi Cui (Peking University). The paper takes two classic concepts
from type theory — **effects** and **coeffects** — and lifts them from
static compile-time analysis into runtime mechanisms.

- **Effects** describe how a program modifies its environment.
- **Coeffects** describe what the program requires from its environment.

The operational intuition: when a plugin mounts, it registers explicit
effects (context mutations with an inverse function). Those effects
stack in a LIFO stack; when the plugin unmounts, the runtime walks the
stack backwards and leaves the system in exactly the state it had
before mounting. This resolves the classic plugin problem — that
loading is easy but unloading cleanly is almost impossible — with a
single move.

The second axis, **reactive coeffects**, tackles dependency management.
Each component declares what it needs; the runtime keeps it inactive
until its dependency appears, and reconfiguring a provider reactivates
only those dependents whose resolution actually changed. There are no
hand-written dependency graphs; they are inferred from declarations.

The most interesting validation in the paper is not theoretical: it
cites the **Koishi** chatbot framework, which has been in production
for over four years with more than 4,000 community-contributed plugins,
all of them hot-swappable from a web console and re-applicable on save
without dropping caches or connections. It is an existence proof, not
a controlled benchmark, but for a team asking "will this scale in
production" it is the most relevant evidence you will find in 2026.

## What "everything is a plugin" looks like in code

What the official page tells you as a slogan, the repository proves
with the minimum shape of a plugin:

```ts
import type { Context } from '@deepseek-ai/cordis';

export const name = 'hello';

export function apply(ctx: Context) {
  console.log('hello from my first plugin');
}
```

`apply(ctx)` receives the shared context and registers whatever it
wants — services, events, tools. The YAML line that mounts it does not
enter the main process as a dependency; it is composed at boot:

```yaml
plugins:
  - hello
  - ./plugins/my-stack
  - github:my-org/my-plugin#v1
```

The monorepo has a package called `packages/core/agent-loop` that
defines the agent's main loop. It is **an ordinary package**, with no
special privilege; it can be swapped by configuration like any other
plugin. The minimum shape of the ReAct loop decomposes into public
events (`turn/start`, `agent/pre-step`, `step/start`,
`system-prompt/assemble`, `agent/request`, `llm/stream`,
`assistant/message`, `tools/pre-execute`, `tools/execute`,
`tools/post-execute`, `step/end`, `agent/turn-stopping`, `turn/end`).
Any plugin can rewrite messages at `agent/pre-step` or replace a tool's
result at `tools/post-execute`. The loop is not the framework's private
property; it is a public protocol every plugin gets to participate in.

The direct consequence, and the one that interests me most as an
author: **turning a single agent into a multi-agent architecture is
swapping the loop plugin**. No forking needed. Compared to Codex CLI,
where altering the main loop implies editing its Rust core, `dsh` gives
you that door without asking for the source.

## Four modes for four kinds of work

The official runtime ships with four preconfigured modes, described as
"assembly patterns" rather than closed products:

- **Standard mode**: the full coding agent. File editing, shell, file
  and web search, skills, planning, goals, subagents, workflows.
- **Code mode**: all Standard capabilities, but tools are exposed via
  an SDK so the model writes TypeScript that orchestrates multiple calls
  in a single program (this solves the "dozens of tool calls burning
  through the context window" problem at the root).
- **Minimal mode**: persistent shell + `str_replace_editor`. This is
  the mode DeepSeek used to run V4-Pro-0813 on Terminal Bench 2.1,
  Toolathlon-Verified and DSBench-FullStack.
- **Creator mode**: to inspect the current runtime and experiment with
  Cordis plugins in memory, ideal for authors of custom presets.

But these four are four among many. Beta tester Jiayuan Zhang sums it
up with a precise metaphor: `dsh` is like a **Lego car kit**, and the
official presets are just one recommended way to assemble it, printed
on the box. The profile and bundle system lets you compose layers
(`dsh-base` provides model adapters, tools, persistence, sandbox and
approval policy) and, on top, patch any configuration row with a patch
file without touching the framework's code.

To understand what each public event in the loop does, this diagram
summarizes the `turn → step → tools → result` flow with the
interceptable gates marked in orange:

![Cordis event loop: a turn wrapping one or more steps, each step a
single model request plus tool calls](/images/diagrams/dsh-event-loop-en.svg)

Read it twice. The first time to understand the main flow; the second
to notice that **almost every box is an interceptable event**. A plugin
can rewrite messages at `agent/pre-step`, suppress tool execution at
`tools/pre-execute`, or replace the result at `tools/post-execute`. The
loop is not the framework's private property; it is a public protocol
every plugin gets to participate in.

## The append-only log as a runtime invariant

The second technical pillar —and the most practical for teams that need
auditing— is the **append-only session log**. `dsh` imposes as a runtime
invariant a rule the documentation calls *"model-visible means logged"*:
everything that reaches a model request must be reconstructable from
the log. The log is an event stream: system prompts, reasoning, tool
calls and results, subagent scheduling and every context injection. The
Trajectory view lets you inspect those records by source, and resume,
fork, search and replay all operate on the same event stream.

This invariant is why several Hacker News commenters called it the
*killer feature* at a moment when US vendors are increasingly encrypting
reasoning traces and making them hard to audit. `dsh` turns "fully
traceable" into an architectural guarantee, not a nice-to-have.

Context compaction is not a black box cooked into the loop either: it
is an independent plugin. It first trims tool results that exceed
budget; if that is not enough, it generates a summary node that
replaces a chunk of history. The whole process is wrapped in three log
events, so even a crash mid-compaction is reconstructable from the log.

## Three things —per the critics— "nobody else has"

The Chinese-language technical analysis by Justin3Go identified three
runtime capabilities that, verified in code, do not appear together in
any competitor:

1. **Code mode (`run_code`)**. The model writes a TypeScript fragment
   that batch-calls tools via `await tools.name(args)`; only what gets
   printed or returned goes back to the model. A dozen round-trips
   collapse into one execution.
2. **Subagent delegated to a competitor**. The `ctx.subagents` backend
   supports multiple providers, and among them appear **`claude-code`**
   and **`codex`**. You can dispatch a subtask from inside `dsh` whose
   actual executor is Claude Code or Codex CLI. There is no precedent
   for such a "harness-agnostic" stance in commercial products.
3. **Self-modifying toolset (`cordis_*`)**. The agent can inspect its
   own plugin tree, write a new plugin on the fly and mount it. It is
   the seed of the "self-evolving agent" — with two important caveats:
   it is not enabled by default in any official preset, you have to
   turn it on explicitly, and a plugin written on the fly lives only
   in memory: it is lost on restart, with no persistence mechanism yet.

The third is the one that has generated the most ink. It is real, it is
in the code, but it is **overstated in the narrative**. That an agent
can modify its own toolset within a session is not equivalent to
"self-evolving agent" in the strong sense of the Cordis paper; for that
you need persistence, independent verification, and compensation
policies that the paper explicitly documents as "outside the core
metatheory".

## Sandboxing and permissions: strict where it should be

The `dsh` security design is not sloppy. Linux uses `bwrap` + Landlock
with a custom-built C launcher that is fail-closed; macOS uses
Seatbelt; Windows uses restricted ACL tokens. The approval model is a
closed enumeration, and any anomaly is rejected as "unavailable"
rather than silently allowed. The runtime is also honest about the
distinction between full and partial sandbox: Landlock on older
kernels only qualifies as partial, and does not falsely report itself
as full.

The important nuance, which 36Kr pointed out in its hands-on: **the
sandbox governs tool execution, but the plugins run inside the harness
process**. Today, any plugin can reach the shell and the filesystem.
The trust model for installing third-party plugins comes down, in
practice, to good faith. It is the first architectural crack that any
serious team should map before putting `dsh` into production.

## The detail that made me smile: building the harness with the harness

What struck me most was not the code itself but the **1,386 Agent
Notes** under `.agents/`: architectural decision records classified as
"implemented / rejected / archived / proposed", plus published
post-mortems. The internal documentation runs to roughly 170,000 lines,
almost on par with the main codebase, and the type snippets embedded
in the docs are auto-diffed against the source in CI to prevent drift;
100% test coverage per file is a hard gate.

These traces strongly suggest the repository itself was built with
intensive AI-agent participation — designing, reviewing and writing
post-mortems. `dsh` is the first user of its own philosophy. It is a
delicious irony, and for me the most honest argument of all: if a team
can use its own harness to build its own harness, something in the
design is right.

## What this means for those of us who already have a stack

`dsh` is not for everyone. It is a framework, not a product. As one
developer with a month of early access before launch put it: *"as a
coding agent to actually use, the experience genuinely isn't as
polished as Claude Code or Codex"*. The reality is that `dsh` is
closer to **PostgreSQL** than to **Notion**: it gives you infrastructure
pieces to compose, not a closed experience to consume.

To visualize how the four agent archetypes map to the four most common
team profiles, this matrix shows where the "winner" of each cell sits:

![Team-fit matrix: 4 agent archetypes crossed with 4 team
profiles](/images/diagrams/team-fit-matrix-en.svg)

The quick read: winners live on the **diagonal**. Claude Code wins for
"immediate productivity" (5 stars), Codex CLI for "strict security"
(kernel sandbox), `dsh` for "architectural auditability" (the only
option with the *"model-visible means logged"* invariant), OpenCode for
"model neutrality" (any provider, any model). If your priority is not
the diagonal of your profile, you have to accept a trade-off.

Three audiences that should look at it seriously:

- **Teams that already build agent infra** and are tired of every
  provider change implying a fork. With `dsh`, switching from OpenAI to
  Anthropic to a local Ollama model is one YAML line.
- **Teams that need real auditing** — financial, healthcare, defense,
  any domain where "what did the model see" cannot be a mystery. The
  *"model-visible means logged"* invariant is the only one on the
  market that is architectural, not documentary.
- **Self-evolving agents researchers** who need a base with proven
  rollback semantics. The Cordis paper is the only public reference
  with four years of production results.

Three audiences that should probably stay with Claude Code or Codex:

- **Indies who want immediate productivity**. The surface to learn
  (profiles, bundles, patch layers) is deeper than Codex CLI's, and
  the onboarding docs are thin.
- **Teams where token usage rules**. Preliminary tests show an order
  of magnitude more tokens consumed versus Pi on the same model, plus
  a confirmed bug: `dsh` reads `CLAUDE.md` and `AGENTS.md` from the
  project, and if the content is identical (common for cross-tool
  compatibility) the system prompt gets injected twice. No official
  fix as of this writing.
- **Teams that need plugin ecosystem maturity today**. The official
  compatibility list reports 41 validated integrations against 219
  flagged as "needs attention"; 36Kr's hands-on test found that all
  five third-party tools it tried failed outright.

## Honest criticism: what doesn't convince me

There are three things, read cold, that separate release-day marketing
from operational reality.

**"Everything is a plugin" as the answer to a question few ask.** The
Chinese comment from yage.ai sums it up well: for web search, restarting
an MCP server takes 2-3 seconds; for a plain-text skill, you don't need
framework-level hot reload. The "swap components without stopping the
runtime" capability is real, but it is a rare requirement for most use
cases. One beta tester observed that DeepSeek's own models often can't
figure out how to use a plugin correctly and just edit their own code
instead — *"faster, and about as effective anyway"*.

**The token cost**. The order-of-magnitude gap versus Pi (4.5K vs 47.6K
uncached input tokens, same model) is not justified by surface area
alone; some of the overhead comes from the double-injection of
`CLAUDE.md` + `AGENTS.md`, but I suspect more remains unexplained. If
your model is billed per token, `dsh` is not yet the efficient option.

**Benchmark opacity**. V4-Pro's SWE-bench Verified score has two
versions circulating — 80.6% self-reported versus 96.4% from external
evaluator Vals — a 16-point gap most likely explained by different
variants or methodologies, but with no authoritative explanation yet.
And the agent benchmarks (Terminal Bench 2.1, etc.) were measured in
minimal mode, which is **DeepSeek's own harness**, not only the model.
It is useful information, but it is not point-comparable with other
agents running in their own runtimes.

## The self-evolving bet and why it matters even if you don't adopt it

If everything above sounds like "interesting but not for me", the Cordis
paper is still worth an hour of your time. Its core argument is that
**revertible effects and reactive coeffects are the missing piece** for
agents to modify their own software safely. The paper is careful to
flag its limits: effects that cross the system boundary (bytes written
to a shared file, messages sent on the wire) are not revertible by the
runtime; the proposed solution is **compensation** — application-supplied
undo actions, composed in the same order as the inverses but not covered
by the core metatheory.

A concrete way to see it: imagine a plugin that registers a tool to
write to a log. The effect "register tool" is revertible — just
deregister it. But the effect "write line to log" crosses the system
boundary (the bytes are already in the file, another process may have
read them). The runtime cannot "un-write" the line; what it does is
ask the plugin for a compensation function, in this case something
like "truncate the file to the previous length". The paper proves
that compensation compositions follow the same LIFO order as pure
inverses, which gives an important operational property: the agent can
explore, fail and backtrack without having to reason explicitly about
how to undo each step.

One lateral consequence I did not expect: the paper forces you to think
about what information crosses the system boundary in each plugin. In
practice that enforces a design discipline — plugins get smaller, more
explicit about their effects, less prone to hiding mutable global state.
It is the kind of architectural pressure that usually appears in
projects that have spent years maturing (PostgreSQL, Erlang,
Kubernetes), not in a day-one release. That Cordis already brings it
in is, for me, the strongest signal that the team has been at this
longer than the GitHub counter suggests.

Three consequences that apply beyond DeepSeek:

1. **Self-evolving agents stop being science fiction** and become a
   systems engineering roadmap with published theory.
2. **Plugin ecosystems become safely mutable at runtime**: memory,
   tools and skills become hot-swappable, and the "plug and pray" era
   of restart-on-every-change ends.
3. **Reversibility becomes a general design principle**: any system that
   allows software to modify itself must ship undo semantics first.
   That pattern will spread far beyond DeepSeek, into every
   long-running agent host, including locally deployed setups that
   never touch Cordis.

If you build agent infra, read the paper. If you evaluate agent
platforms, ask whether the runtime can swap tools and skills live
without restarts. That capability just became a benchmark, not a
nice-to-have.

## How the model sees: prompt assembly, context injection and the adapter

One dimension that is easy to miss when talking about "everything is a
plugin" is how information actually reaches the model. `dsh` decomposes
that moment into several stages, each interceptable as an event. The
most interesting one is **`system-prompt/assemble`**: the moment the
runtime composes the agent's system prompt. Skill plugins, memory
plugins, policy plugins and UI plugins can register as "contributors"
to the prompt; each one adds its block in an order determined by
declared dependencies, not by load order. The result is a reproducible
system prompt: the same config in two runs produces the same prompt,
which gives an important property for benchmarks and debugging —
*"what the model saw" can be reconstructed bit by bit from the log*.

The second stage is the **model adapter** at `ctx.llm`. Unlike other
frameworks where the provider adapter is privileged internal code, here
it lives as just another plugin. The runtime ships adapters for
OpenAI, Anthropic, Google, Kimi, DeepSeek and any OpenAI-compatible
endpoint, and publishes them in a registry that tools can query. When
a tool needs to call the model — for example, a summarization plugin
generating a summary node for context compaction — it asks the registry
"give me the active adapter" instead of importing a hardcoded one.
Switching providers on the fly is reconfiguring the registry, not
recompiling the harness.

The third piece, less obvious but critical for consistency, is the
**context injection event waterfall**. Each time a plugin adds
information to the model's context (a tool result, a subagent message,
a sandbox observation), it fires an event that other plugins can
intercept to rewrite, annotate or suppress. It is an Express-style
middleware mechanism, but applied to the model's input chain. In
practice, that means a team can mount a **red-team safety** plugin
that rewrites any suspicious injection before it reaches the model, or
an **observability** plugin that annotates each message with a trace
ID and ships it to an external sink — without touching the framework
code.

Together, the three stages turn the system prompt into a composable
artifact, not an opaque string only the vendor controls. It is the
same philosophy Unix applied to pipes: each stage does one thing,
takes input from the previous one, and produces output for the next.
The model, in this simile, is the last consumer of a chain of plugins
that filter, annotate and shape the context before the agent "sees"
anything.

## FAQ

**Is `dsh` just DeepSeek's Claude Code with another name?**
No. Claude Code is a commercial product with a privileged extension
model (Skills, Subagents, Hooks live in an extension layer, not in
the runtime core). `dsh` is a framework where the extension layer *is*
the core: the model, the toolset, the sandbox, the log and the loop
are first-class plugins, swappable without recompiling. The
operational difference: you can replace the main loop with a plugin
of your own that implements a multi-agent architecture; you cannot do
that in Claude Code without forking the repo.

**Is it production-ready as of August 2026?**
No, not yet. The README itself carries the warning *"THERE WILL BE
COMPATIBILITY-BREAKING CHANGES"* in caps, and the release is
`0.1.0-rc.5` labeled "developer preview". What *is* ready is the
architecture: Cordis has been in production inside Koishi for four
years, and the revertible-effects design is validated at the system
level in that ecosystem. What is not ready is the public `dsh` API:
plugin contracts can change, official presets can be reorganized, and
the 316-plugin community ecosystem has only 41 marked as compatible.
Treat it as experimental infrastructure with serious theoretical
backing, not as a stable product.

**Why not just use OpenCode or Claude Code with a good prompt?**
If your workload fits in "read the repo, edit some files, run the
tests," either of them will give you a better result *today* with less
friction. `dsh` enters the equation when you need one of these:
complete architectural auditing (*"model-visible means logged"*),
hot-swapping providers at runtime, composing plugins with state across
sessions, or a sandbox where you can run model-generated code without
escape risk. For "indie building their app," `dsh` is overkill. For
"team building agent infrastructure that others will consume," it is
the only option on the market that already has those properties by
construction.

**How does `dsh` fit with the rest of an indie stack?**
Three real patterns I have seen in the first week since launch. (1)
**As a sandbox for evaluating models**: Minimal mode gives you shell +
str_replace_editor and nothing else, which lets you compare two
models under identical conditions without the framework injecting
divergent system prompts. (2) **As cross-project persistent memory**:
the append-only log can be mounted as the source of truth for a
memory system like [Hipocampus](/blog/hipocampus-hierarchical-memory-agents/)
or [PlugMem](/blog/plugmem-microsoft-agent-memory/), where each session
feeds a structured index. (3) **As an audit proxy for small teams
that cannot afford Datadog**: the Trajectory view + the exportable
log give you agentic observability without vendor lock-in.

**Is the Cordis paper worth reading even if I do not adopt `dsh`?**
Yes, without discussion. The paper *"A Programming Paradigm for
Spatiotemporal Composability"* is the only public reference with
formal theory + four years of production results on the problem of
safe self-modification in plugin systems. Even if you do not use
Cordis or `dsh`, the concepts of revertible effects and reactive
coeffects apply to any system where components arrive and leave at
runtime: from your own microservices framework to a Kubernetes cluster
with operators. It is one of those pieces of theory that, once read,
change how you see the rest of your stack.

## How to install and what to expect on day one

The official quickstart lives in a single line:

```sh
npx @deepseek-ai/dsh web
```

That starts the Web UI at `http://127.0.0.1:3080` and, unless you pass
`--no-open`, launches the default browser. The first `npx` is not
instant: the team reports several minutes of download even on
well-connected servers, because underneath sits a full TypeScript
monorepo with its build — not a lightweight script. It is the footprint
of an application, not a curl-sized utility. Anyone adopting it should
expect and budget for that in their evaluation flow.

For a reproducible install there are two more paths:

- **From the cloned repo**: `git clone`, `pnpm install`,
  `pnpm run build`, `pnpm dsh web`. Useful if you are going to modify
  the framework or mount private plugins against a pinned version.
- **Docker image**: the community has already started publishing
  unofficial images with the binary pre-packaged and an entrypoint
  that respects `--no-open`. Useful in environments where `npx` is not
  viable (CI, strict sandboxes).

Once the UI is open, the documented flow is: Settings → Models → paste
a DeepSeek API key → choose a workspace directory. Without restart, the
model route becomes usable; switching to Anthropic or OpenAI via a
compatible endpoint is another configuration row in the same screen.
A reasonable first command for a smoke test is *"Summarize this
repository and identify its main packages"* on a small repo: it
verifies that the agent reads, edits, runs and delegates, with approval
prompts for sensitive operations.

Headless mode ships as a separate profile for one-shot runs without a
server, and a **Python SDK** covers programmatic and benchmark use
through the `jsonrpc-agent` minimal variant. The latter is relevant if
you come from the evaluations world: the same harness you use
interactively is the one you invoke from your benchmark runner, closing
a gap many teams today patch with bash scripts over Claude Code.

## The plugin ecosystem: 316 on day two and rising

A signal that slipped under the radar in English-language coverage: in
48 hours from launch, GitHub's `dsh-plugin` topic was indexing 316
public tagged repositories, per the deepseek-code.com catalog. The
category distribution tells of a community that quickly spotted where
the friction points are:

- **Utilities (64)**: generic helpers, formatters, validators.
- **Development (51)**: editor integrations, LSPs, test runners.
- **Interface (46)**: themes, UI components, alternatives to the web UI.
- **AI & Agents (39)**: adapters for other providers, long-term memory,
  context compression, proactive scheduling.
- **Integrations (39)**: bridges to Linear, Notion, databases, CRMs.
- **Media & Vision (37)**: tooling to give a text-only agent "eyes"
  via OCR, visual Q&A or frontend UI restoration.
- **Knowledge (26)**: connectors to external RAG, indexers, parsers.
- **Workflow (14)**: long pipelines, schedulers, preset templates.

The ratio across categories suggests a community more interested in
"making my life easier with `dsh`" than in "researching new reasoning
modes." That feels healthy for a day-two release: utilities and
bridges are what any framework needs to become infrastructure, not
exotic plugins. The 2,000+ submissions figure Justin3Go reported by
day three confirms the trend — though as he warns, quantity is not
quality. The official compatibility list reports 41 validated
integrations against 219 flagged as "needs attention or further
investigation."

## Verdict: who it's for, in one line

`dsh` is not DeepSeek's version of Claude Code; it is a radical bet on
what an agent runtime should look like. It is not the right tool today
for most people who just want to write code, but the bet it is making
deserves a serious look from anyone building agent infrastructure. The
day you need hot provider swaps, complete auditing by architectural
invariant or plugins that live in memory without losing consistency,
`dsh` will be among the few options that already has the answer.

## Bibliography

- [DeepSeek Harness developer preview](https://deepseek.com/harness/en/) —
  the official page with the "Everything is a plugin" promise, the
  quick-start `npx @deepseek-ai/dsh web` and the four runtime modes.
- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) —
  the MIT repository, README with the *"THERE WILL BE
  COMPATIBILITY-BREAKING CHANGES"* warning, `0.1.0-rc.5` at time of
  writing.
- [A Programming Paradigm for Spatiotemporal Composability](https://github.com/cordiverse/paper) —
  88-page paper by Yifan Shi, Wei Zhang and Tianyi Cui (Peking
  University and DeepSeek-AI) formalizing revertible effects and
  reactive coeffects.
- [Cordis](https://github.com/cordiverse/cordis) — the plugin
  meta-framework `dsh` runs on, base of the Koishi chatbot framework
  that has been in production for over four years with 4,000+ plugins.
- [DeepSeek Harness In Depth: 90K Stars in Two Days — Justin3Go](https://justin3go.com/en/posts/2026/08/15-deepseek-harness-review) —
  line-by-line technical analysis, comparison with Pi / Codex CLI /
  Claude Code / OpenCode, and verification of the most repeated
  critiques.
- [DeepSeek's Blueprint for Self-Evolving AI Agents — Aoyii](https://www.aoyii.com/en/deepseek-cordis-self-evolving-agents/) —
  reading focused on the Cordis paper and the path toward agents that
  modify their own software.
- [DeepSeek Harness: Why 95,000 GitHub Stars in 2 Days — Flowtivity](https://flowtivity.ai/blog/deepseek-harness-open-source-agent-explained/) —
  hands-on with adoption metrics, V4-Pro benchmark numbers and the
  context of the August 16 peak/off-peak pricing change.
- [The Open-Sourcing of DeepSeek Harness — InfoQ](https://www.infoq.com/news/2026/08/deep-seek-harness/) —
  institutional coverage focused on the micro-kernel architecture and
  the shift toward modular, unbundled infra.
- [DeepSeek Harness developer preview — Hacker News](https://news.ycombinator.com/item?id=49285244) —
  launch thread with 727 points and 305 comments, including the
  author team's response to the most technical questions.
- [Harness Engineering: The Wrapper Wins — ArceApps](/blog/harness-engineering-wrapper-gana/) —
  blog prior art on the Model + Harness separation.
- [OpenCode Subagents: Workflows and Superpowers — ArceApps](/blog/opencode-subagents/) —
  how to mount a harness on top of a model without touching its core.
- [@deepseek-ai/dsh on npm](https://www.npmjs.com/package/@deepseek-ai/dsh) —
  the published package that serves the web UI at
  `http://127.0.0.1:3080`.
