---
title: "DeepSeek Harness vs OpenCode, Codex and Claude Code: head to head"
description: "Honest comparison of DeepSeek Harness (dsh), OpenCode, Codex CLI and Claude Code. Philosophy, plugin model, sandbox, ecosystem and who wins each in 2026."
pubDate: 2026-08-19
lastmod: 2026-08-19
author: "ArceApps"
keywords:
  - "DeepSeek Harness"
  - "OpenCode"
  - "Codex CLI"
  - "Claude Code"
  - "Coding Agent Comparison"
canonical: "https://arceapps.com/blog/deepseek-harness-vs-opencode-codex-claude-code/"
heroImage: "/images/deepseek-harness-vs-opencode-codex-claude-code-en.svg"
tags: ["DeepSeek", "AI Agents", "OpenCode", "Codex", "Claude Code", "Indie Dev"]
reference_id: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"
---

## Why this comparison matters now

On August 13, 2026, DeepSeek published `deepseek-harness` (`dsh`) under
MIT and in 48 hours it accumulated 95,386 stars and 8,826 forks on
GitHub. An adoption curve like that does not stand on hype alone:
there is something in the design that is touching a nerve. But "dsh
is better" or "dsh is worse" are empty sentences until measured
against the agents people are already using: **Claude Code** (Anthropic),
**Codex CLI** (OpenAI) and **OpenCode** (the open-source option that
has served as common ground for countless posts on this blog, including
[Subagents and Superpowers](/blog/opencode-subagents/) and [Awesome
OpenCode Ecosystem](/blog/awesome-opencode-ecosystem/)).

This article closes the triangle opened by [DeepSeek Harness: the
runtime where everything is a plugin](/blog/deepseek-harness-everything-plugin/)
and [Harness Engineering: The Wrapper Wins](/blog/harness-engineering-wrapper-gana/).
The first was the technical deep-dive into `dsh`; this one looks from
the outside, comparing how each of the four agents tackles the same
operational questions: how do you mount a plugin? how do you audit a
session? how much does it cost in tokens? how mature is the ecosystem?
The goal is to give you an honest decision matrix — including the
points where my opinion will annoy fans of any of the four camps.

> **Prior art note.** There are already separate posts about each
> tool on this blog: the visual frontends comparison for OpenCode
> covers CodeNomad and OpenChamber; Claude Code and Codex have
> individual coverage. This article does **not** re-enter those
> points: it focuses on the terminal/runtime agent as a product, not
> on its skin.

## The four philosophies in one sentence each

Before diving into matrices, a synthesis that holds up on its own
through the rest of the article:

- **DeepSeek Harness**: the runtime. An open-source MIT framework
  where *everything* — model, tools, session, sandbox, loop — is a
  Cordis-registrable plugin. Designed for teams building agent
  infrastructure, not for indies wanting to write code tomorrow.
- **Claude Code**: the product. Source-available, polished user
  experience, the most complete extension ecosystem on the market
  (CLAUDE.md, Skills, Subagents, Hooks, MCP, Plugins, Agent Teams).
  Think macOS: closed on the surface, open at the right points.
- **Codex CLI**: the safety-first. Rust + kernel-level sandbox,
  Apache 2.0, declarative plugin model (a folder on disk, never
  entering the harness process). Think OpenBSD: opinionated about
  what matters and discreet about the rest.
- **OpenCode**: the open minimalist. MIT, terminal or web, 197k
  stars, no vendor lock-in or closed surface. Think Linux before
  systemd: does its job, lets you choose how.

The difference between the four is not "who has more features," it is
**what kind of question they prioritize**. `dsh` prioritizes "can I
rewire my runtime." Claude Code prioritizes "how much friction is
there between my idea and a reviewable diff." Codex prioritizes "how
narrow is the blast radius of an agent command." OpenCode prioritizes
"can I run any model anywhere without asking anyone for permission."

## Master table: five dimensions

The five dimensions that matter most when choosing a terminal agent
in production: **extension philosophy**, **sandbox**, **audit /
traceability**, **token efficiency** and **plugin ecosystem maturity**.
Star and version data is current as of August 15, 2026 (the `dsh`
release was still hot) and cross-checked against what each team
announces in their official documentation.

| Dimension | DeepSeek Harness | Claude Code | Codex CLI | OpenCode |
|---|---|---|---|---|
| **License** | MIT (full code) | Source-available, non-standard license | Apache 2.0 | MIT |
| **Runtime language** | TypeScript (~500k LoC) + C11 sandbox | TypeScript/Node | Rust | Go |
| **Extension philosophy** | Imperative Cordis plugin (state, hooks, events) | Skills + Subagents + Hooks + MCP + Plugins + Agent Teams | Folder = plugin (declarative, outside process) | Provider/model via config; no plugin system |
| **Default model** | DeepSeek, but any OpenAI-compatible | Claude (Sonnet/Opus/Haiku) | OpenAI (GPT-5/Codex) | Anyone via provider (Anthropic, OpenAI, Google, Ollama) |
| **Sandbox** | bwrap+Landlock (Linux), Seatbelt (macOS), ACL (Win); plugins in-process | Yes, mature built-in, configurable | Yes, kernel-level, considered the safety leader | Child process with configurable perms |
| **Traceability** | Append-only log, *model-visible means logged* invariant | Sessions with transcripts; reasoning partially encrypted | Logs + replay; sandbox snapshots | Logs per session; fork/resume; no formal invariant |
| **Token efficiency** | High overhead (~10x Pi, ~3x others); double-AGENTS.md bug | Good; short system prompt | Good; code mode collapses N tool calls into 1 | Good; no framework overhead |
| **Adoption curve** | Steep (profiles, bundles, patch layers) | Smooth, extensive commercial docs | Moderate, opinionated | Smooth, Unix mental model |
| **Stars (15-Aug)** | ~93k | ~141k | ~106k | ~197k |
| **State** | Developer preview, breaking changes | Stable, commercial | Stable, commercial + cloud | Stable, open |
| **Best for** | Teams building agent infrastructure | Individuals and teams wanting immediate productivity | Teams where blast radius matters | Individuals prioritizing model neutrality |

## The extension model: four ways to say "I can extend this"

This is the dimension where the four diverge most deeply, and it
deserves its own section.

### DeepSeek Harness: imperative plugins with state

Already covered in detail in [the runtime article](/blog/deepseek-harness-everything-plugin/),
but the operational summary: a plugin is a TypeScript file that
exports `apply(ctx)`. On mount it registers services, events and
tools in a shared context. The model lives at `ctx.llm`, the toolset
at `ctx.tools`, the sandbox at `ctx.sandbox`. Plugins run inside the
harness process (with all the risk that implies) and may hold mutable
state. This enables things like **subagents delegated to `claude-code`
or `codex`** via the `ctx.subagents` backend, something without
precedent in the rest of the market.

Trade-off: maximum flexibility, minimum control over what a malicious
plugin can do. Installing a plugin is, today, an act of trust.

### Claude Code: the complete extension stack

Claude Code is the only one of the four that offers **seven**
different extension points in a single product, and each solves a
different problem:

- **CLAUDE.md**: always-on context loaded every turn. It is your
  project's persistent memory.
- **Skills**: on-demand knowledge + repeatable workflows. Loaded by
  the model when it detects a match.
- **Subagents**: isolation. Each subagent has its own context,
  permissions and system prompt.
- **Agent Teams**: launched February 5, 2026 alongside Opus 4.6.
  Multiple subagents collaborating, not just reporting to a boss.
- **MCP servers**: connection to external tools via Model Context
  Protocol.
- **Hooks**: automation based on lifecycle events (PreToolUse,
  PostToolUse, Stop, SubagentStop).
- **Plugins**: packages that combine several of the above into a
  distributable bundle.

The consequence: Claude Code can be a code editor, a researcher, a
DevOps agent or a multi-agent team depending on which combination of
extensions you activate. It is the most "polymorphic" framework on
the market in terms of what it can become.

Trade-off: the surface to learn is large. Extensive commercial
documentation helps, but time-to-first-value is still higher than
Codex or OpenCode.

### Codex CLI: the folder is the plugin

Codex inverts the convention. Instead of a plugin that enters the
harness process, Codex defines a plugin as **a folder on disk**
containing static files: a skill Markdown, an MCP config, a shell
script. Those files never enter the Codex process; the harness reads
them when needed and reloads them in 2-3 seconds when they change.

Developer `grapeot`, who read both codebases line by line, sums up
the difference with a perfect analogy: **Codex hands you a finished
apartment with a pegboard wall where you can hang anything; hang the
wrong thing, take it down, hang something else. `dsh` hands you a
house where you can rework a load-bearing wall without cutting the
water or power**. The question is: how often do you actually need to
rework a load-bearing wall?

Trade-off: the simplicity is real. The barrier to entry is close to
zero, runtime overhead is minimal, and the blast radius of a faulty
plugin is bounded by the kernel sandbox. The price: if you want
dynamic behavior, plugins with state, or event composition between
plugins, Codex does not give it without modifying its Rust core.

### OpenCode: extension by configuration, not by code

OpenCode does not have a plugin system per se. Its extensibility is
**declarative configuration**: providers, models, permissions and
themes via config files. The consequence: flexibility lives in the
**model**, not in the harness. You can switch from Anthropic to
OpenAI to Google to Ollama without touching code, and the agent
adapts. This makes it the "model-agnostic by default" of the market,
even above `dsh`, which while model-agnostic needs an adapter plugin
per new model.

Trade-off: if you want specific behaviors (a new tool, a pre-commit
hook, a Linear integration), you need to contribute to the project or
live with what is there. Model freedom partially compensates, but it
is not an extension system in the formal sense.

## Sandbox and blast radius: where each draws the line

Sandbox is not a detail; it is the "what can go wrong?" question
made operational. The four resolve this in substantially different
ways.

**Codex CLI** is, by community consensus, the safety leader of the
group. Kernel-level sandbox on Linux (namespaces + seccomp), optional
network, optional filesystem, granular per-command decisions. The
default is "you cannot do anything that breaks my host without
asking"; opt-in is explicit. It is the posture closest to the OpenBSD
philosophy: secure by construction, not by configuration.

**DeepSeek Harness** uses `bwrap` + Landlock on Linux with a
fail-closed C launcher, Seatbelt on macOS, restricted ACL tokens on
Windows. The approval model is a closed enumeration and anomalies are
rejected as "unavailable" rather than silently allowed. It is strict
— but, as 36Kr pointed out in its hands-on, **plugins run inside the
harness process**, so a plugin can directly reach shell and
filesystem. The real blast radius of a malicious plugin is the whole
process.

**Claude Code** offers a mature built-in sandbox, configurable by the
user, with sensible defaults. macOS integration is notably good
(Sandbox-exec), on Linux it depends on the available kernel. The
risk: the Skills and MCP third-party ecosystem introduces attack
surface, and the quality of those Skills' sandboxes varies.

**OpenCode** runs the agent in a child process with user-configurable
permissions. It is a model closer to Unix: the user decides which
permissions to grant, without opinionated pre-loaded policies. It
works well for technical users; it can be a shock for those coming
from Codex expecting pre-thought permissions.

For teams in regulated domains (finance, healthcare, defense), Codex
is the safest option by construction. For teams where auditing
matters more than blast radius (being able to reconstruct what the
model saw, not necessarily containing it), `dsh` is the only one of
the four with that architectural guarantee.

## Traceability and auditing: the one feature where `dsh` has no rival

Sandbox tells you what could have happened; traceability tells you
what happened. Here DeepSeek Harness has an advantage that, at the
time of writing, has no equal in the market:

> **Invariant**: *"model-visible means logged"*. Everything that
> reaches a model request must be reconstructable from the append-only
> session log. It is not a configuration option; it is an invariant
> enforced at runtime.

The log captures system prompts, reasoning, tool calls and results,
subagent scheduling and every context injection. The Trajectory view
lets you inspect those records by source, and resume, fork, search
and replay all operate on the same event stream. Context compaction
is wrapped in three log events, so a crash mid-compaction is
reconstructable.

Codex CLI has logs + replay with sandbox snapshots, but does not
enforce the "everything the model saw is reconstructable" invariant.
Claude Code has session transcripts but its reasoning is partially
encrypted by commercial design — something several Hacker News
commenters criticized on the `dsh` launch thread. OpenCode has logs
per session and fork/resume, but without the same architectural
guarantee.

If you work in a domain where "what did the model see" cannot be a
mystery (financial, healthcare, legal, defense, research), `dsh` is
the only option of the four that guarantees you that property by
construction.

## Token efficiency: where the real cost sits

Here the ranking is clear, and it hurts `dsh` fans:

- **OpenCode** and **Codex CLI** are the most efficient. Their system
  prompts are short, their sessions have little overhead, and they do
  not load heavy frameworks every turn.
- **Claude Code** sits in the middle. Its Skills and Subagents add
  tokens to the system prompt, but the framework has been optimized
  aggressively by Anthropic.
- **DeepSeek Harness** sits at the end, by a worrying margin.
  Preliminary tests on the same model report ~4.5k uncached input
  tokens for Pi vs ~47.6k for `dsh` — an order of magnitude. And
  there is a confirmed bug: `dsh` reads `CLAUDE.md` and `AGENTS.md`
  from the project, and if the content is identical (common for
  cross-tool compatibility), the system prompt gets injected twice.

If your model is billed per token, this difference matters. A day of
work with `dsh` can consume 3-10x what it would with OpenCode or
Codex on the same workload. The `dsh` team is aware of the problem
and the architecture allows future optimizations (aggressive caching,
lazy plugin loading, early summarization), but at the time of this
writing there is no official fix for the double-AGENTS.md bug.

## Ecosystem maturity: the factor nobody wants to admit

GitHub stars are a vanity metric, but the 2x difference between `dsh`
(93k after two days) and Claude Code (141k accumulated over months)
says something: hype does not hold up without critical mass of
working plugins. And there, the picture as of August 15 is:

- **Claude Code** has the broadest and most mature ecosystem.
  Commercial Skills, MCP servers for almost any service (Linear,
  Notion, Slack, AWS, GCP, Figma, GitHub...), documented Hooks, Agent
  Teams with examples, and an informal third-party plugin marketplace.
- **Codex CLI** has a smaller but more curated ecosystem. The
  declarative philosophy makes each plugin trivial to audit.
- **OpenCode** has providers for everything (Anthropic, OpenAI,
  Google, Bedrock, Vertex, Ollama, OpenRouter...) and a solid tool
  set, but no formal marketplace.
- **DeepSeek Harness** has 316 plugins under the `dsh-plugin` topic
  after 48 hours, with only 41 marked as validated on the official
  compatibility list. Quantity without quality.

The `dsh` team knows this. The documentation itself notes that 219
plugins are flagged as "needs attention or further investigation",
and 36Kr's hands-on test reported that all 5 third-party tools it
tried failed outright. The release is day-two; the ecosystem will
mature, but not today.

## Trade-offs summarized in three questions

If we had to reduce the decision to three questions, they would be:

**Which model does your project prioritize?**
- Claude (Anthropic) → Claude Code is the obvious choice; `dsh` and
  OpenCode work via compatible endpoint with setup cost.
- OpenAI / GPT-5 → Codex CLI; `dsh` and OpenCode also.
- Mixed / local (Ollama, vLLM) → OpenCode or `dsh` with adapter.
- DeepSeek → `dsh` (native) or any other with compatible endpoint.

**What is your operational priority?**
- Complete auditing by invariant → `dsh`.
- Minimum safety blast radius → Codex CLI.
- Maximum extension flexibility → Claude Code.
- Model neutrality, simplicity → OpenCode.

**How much time do you have for onboarding?**
- 30 minutes → OpenCode.
- 1-2 hours → Codex CLI or Claude Code.
- Half a day → Claude Code with all extensions.
- 1-2 days → `dsh`, learning profiles/bundles/patches.

## What no table tells you: the team factor

Tables do not capture the human factor. In my experience with all
four, what weighs most is not the feature list but the cultural fit:

- **Claude Code** wins where there is a team that wants to invest in
  their own Skills, train the model on the repo convention, and
  maintain an internal plugin marketplace. It is the "Apple" path:
  comfortable if you live inside, expensive if you want out.
- **Codex CLI** wins where there is a team operating under strict
  security policies and needs sensible defaults without configuring
  them. It is the "OpenBSD" path: opinionated but predictable.
- **OpenCode** wins where there is a small team or an indie that
  wants to switch models without asking anyone for permission, and is
  comfortable configuring providers by hand. It is the "Linux" path:
  flexible if you know what you are doing, frustrating if you do not.
- **DeepSeek Harness** wins where there is a team building agent
  infrastructure and is willing to pay the token cost and the
  adoption curve in exchange for architectural auditability and
  self-evolution. It is the "PostgreSQL" path: infra for people who
  know what they are doing with infra.

## Verdict: who wins for whom

There is no universal winner. There are four winners for four
contexts:

- **If your priority is writing productive code today**, without
  worrying about extreme auditing, **Claude Code** is the most
  polished and complete option.
- **If your priority is security by construction and a minimum blast
  radius**, **Codex CLI** is the safety leader of the group.
- **If your priority is model neutrality, simplicity and zero vendor
  lock-in**, **OpenCode** is the most honest option.
- **If your priority is architectural auditability, self-evolution or
  building agent infrastructure that other teams will consume**,
  **DeepSeek Harness** is the only option that already has those
  guarantees built in.

My practical recommendation for an indie: start with **OpenCode** or
**Codex CLI**, learn what you need from the agent, and only jump to
**Claude Code** or **DeepSeek Harness** when your concrete
constraints — model, security, auditability — justify the extra
adoption cost. Premature "agent-hopping" is the most expensive
anti-pattern of 2026.

## Bibliography

- [DeepSeek Harness: the runtime where everything is a plugin — ArceApps](/blog/deepseek-harness-everything-plugin/) —
  in-depth technical analysis of the runtime, Cordis and the
  architecture.
- [Harness Engineering: The Wrapper Wins — ArceApps](/blog/harness-engineering-wrapper-gana/) —
  why the harness (tools, memory, guardrails) makes the model
  productive.
- [OpenCode Subagents: Workflows and Superpowers — ArceApps](/blog/opencode-subagents/) —
  workflows on top of OpenCode, its subagents model and superpowers.
- [Awesome OpenCode Ecosystem — ArceApps](/blog/awesome-opencode-ecosystem/) —
  curated catalog of the OpenCode ecosystem.
- [DeepSeek Harness developer preview](https://deepseek.com/harness/en/) —
  official page with the "Everything is a plugin" promise.
- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) —
  MIT repository, `0.1.0-rc.5` at time of writing.
- [A Programming Paradigm for Spatiotemporal Composability](https://github.com/cordiverse/paper) —
  Cordis paper, theoretical basis of `dsh`.
- [Claude Code — Extend documentation](https://code.claude.com/docs/en/features-overview) —
  official documentation of the 7 extension surfaces.
- [Codex CLI — OpenAI](https://github.com/openai/codex) —
  official repository of the OpenAI CLI.
- [OpenCode — github](https://github.com/opencode-ai/opencode) —
  repository of the open-source model-agnostic agent.
- [DeepSeek Harness In Depth — Justin3Go](https://justin3go.com/en/posts/2026/08/15-deepseek-harness-review) —
  line-by-line technical analysis with comparison against the four
  protagonists.
- [5 Best DeepSeek Harness Alternatives — deepseek-code.com](https://deepseek-code.com/hub/best-coding-harness-for-deepseek) —
  workflow ranking Pi / Claude Code / OpenCode / Codex / Cline.
- [DeepSeek Harness: Why 95,000 GitHub Stars in 2 Days — Flowtivity](https://flowtivity.ai/blog/deepseek-harness-open-source-agent-explained/) —
  hands-on with adoption metrics and V4-Pro benchmarks.
- [DeepSeek Harness developer preview — Hacker News](https://news.ycombinator.com/item?id=49285244) —
  launch thread with 727 points and author team response.
