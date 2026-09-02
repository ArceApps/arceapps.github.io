---
title: "Awesome OpenCode: The Ecosystem Zoo"
description: "A curated map of the OpenCode ecosystem in 2026: 10 persistent-memory plugins no blog has shown you, 4 real Hacker News critiques, and the indie community's defensive response."
pubDate: 2026-07-26
lastmod: 2026-07-27
author: "ArceApps"
keywords:
  - "OpenCode"
  - "memory plugins"
  - "awesome opencode"
  - "AI agents"
  - "ecosystem"
  - "MCP"
  - "indie dev"
canonical: "https://arceapps.com/blog/awesome-opencode-ecosystem/"
heroImage: "/images/awesome-opencode-ecosystem-en.svg"
tags: ["OpenCode", "Plugins", "Persistent Memory", "MCP", "Ecosystem", "Indie Dev"]
category: "ai-agents"
reference_id: "9d2f7c4e-6a1b-4c8d-9e3f-5a2b8c4d1e7f"
---

> **Recommended prerequisite reading:** we've already covered OpenCode from several angles in this blog — the [AI CLI tournament semifinal](/blog/cli-ai-semifinal-1/) where it won, the [subagents deep dive](/blog/opencode-subagents/), the [three-part series on persistent memory](/blog/opencode-memory-plugins-native/) and the [final stack I combine in my daily flow](/blog/persistent-memory-stack-implementation/). What I hadn't done yet was **look at the zoo from above**: the curated catalog the community has built around the agent.

## 🎣 The Sunday when the awesome-list gave me back an hour

I have a confessable vice. Every Sunday afternoon, after I've closed the laptop on serious work, I order a single-origin espresso, open [github.com/awesome-opencode/awesome-opencode](https://github.com/awesome-opencode/awesome-opencode), and start reading PRs. It's a repository with **223 entries** distributed across six categories, maintained by a community separate from Anomaly, CC0-1.0 licensed, with **9,169 stars and 681 forks** per the GitHub counter at the time of writing. The last time I opened it properly was three months ago, when I wrote the persistent-memory series. That afternoon I vowed to come back and look at **everything that had fallen off my radar**.

This article is the result. It's a **curated and commented catalog** of the OpenCode ecosystem in 2026, with one very specific focus: **the persistent-memory plugins the community has built that my three-post series didn't cover**. And since I was looking at the zoo from above, I couldn't avoid the uncomfortable side: **the real critiques the agent has received on Hacker News**, the ones the core team already acknowledged as a "necessary evil", and the defensive response the indie community has built plugin by plugin. This is going to be long. Order another espresso.

## 🧭 First, orientation: what OpenCode is in 2026 and why it has a zoo

Before we dive in, a note of orientation for the reader arriving fresh. OpenCode is an **MIT-licensed, open source AI coding agent** maintained by the **Anomaly** organization ([github.com/anomalyco/opencode](https://github.com/anomalyco/opencode)) and built mostly in TypeScript with Bun as the runtime. As of today it sits at around **190,000 GitHub stars**, claims support for **75+ LLM providers** (Anthropic, OpenAI, Google Gemini, AWS Bedrock, Groq, Azure, OpenRouter, GitHub Copilot, xAI/Grok, local Ollama, llama.cpp, and a long etc.), and per its own landing page reaches **7.5 million monthly active developers**. We covered it in detail when it won the [AI CLI tournament semifinal](/blog/cli-ai-semifinal-1/) and again in the [grand final](/blog/cli-ai-grand-final/). What I want to highlight here is **why a zoo exists in the first place**: when an agent is open source, model-agnostic, and has a reasonable plugin API, the community starts building on top. It's the same dynamic we saw with Vim launchers, VSCode plugins, and the entire Awesome-List ecosystem. OpenCode is not the exception; it's the textbook case.

A chronological honesty disclaimer before we continue: the repo that ranks first in many search results, `opencode-ai/opencode`, has been **archived since September 2025** and redirects to [charmbracelet/crush](https://github.com/charmbracelet/crush) (which is Go, not TypeScript, and is a different project). The live repo is `anomalyco/opencode`. The confusion is understandable: the organization that previously maintained it was SST (Serverless Stack), which pivoted to Anomaly around April–May 2026, and the org's GitHub handle stayed as `anomalyco`. If you cite an older article, you'll likely see the old URL. **Be careful with cross-referenced data**.

## 📚 The six categories of the zoo, counted plainly

The [curated awesome-list](https://github.com/awesome-opencode/awesome-opencode) organizes the ecosystem into six blocks worth keeping in mind before we get into details:

| Category | Entries | Narrative density |
|---|---|---|
| **Official Repositories** | 4 | SDKs in JS, Go, and Python, plus the core |
| **Plugins** | **136** | Very high — and what will occupy us most |
| **Agents** (sub-agents, harnesses) | 9 | Medium, but conceptually rich |
| **Projects** (forks, IDEs, runtimes, GUIs) | 64 | High: Neovim, Mobile, Telegram, SwarmClaw, A2A |
| **Themes** | 7 | Low: short section, sufficient |
| **Resources** (guides, starters, passports) | 7 | Medium, with pieces like kickstart.opencode being very useful to start |

Of the 223 entries, **136 are plugins**. That asymmetry is the tell: what the community has chosen to build en masse is **plugins**, not forks or clients. And within the 136, **the densest subdomain by far is persistent memory and context**, with at least 15 active pieces my previous series didn't cover. Let's go.

![Zoo anatomy · 6 categories · 223 entries](/images/awesome-opencode-taxonomy-en.svg)

## 🧠 Ten persistent-memory plugins my series didn't cover (and why they exist)

Context matters to understand why this niche is so fertile. **The OpenCode core team itself has publicly acknowledged that context compaction is, for now, a necessary evil**. **k-langton**, a core team member, said it explicitly in a Hacker News thread worth quoting:

> "Compaction is a necessary evil for the time being. There's only so much context window, and if you wish to keep working on the same task for a long time, the model needs to summarize its current progress so it can continue without hitting its token ceiling."

Source: [news.ycombinator.com/item?id=48978112](https://news.ycombinator.com/item?id=48978112)

And user **denis4inet** summarized it with a title that has become a reference:

> "**The Memory Wall: opencode consumes a lot**, and I didn't find a good way to optimize it."

Source: [news.ycombinator.com/item?id=47361303](https://news.ycombinator.com/item?id=47361303) — additionally cites the open issue [github.com/anomalyco/opencode/issues/12687](https://github.com/anomalyco/opencode/issues/12687) on the topic.

With that frame, the 10 plugins below are not whims: **they're the community's response to a gap the core has marked as WIP**. I order them by traction (stars + recent activity, data as of July 27, 2026) and comment each with the depth an indie dev needs to decide.

### 1. `cortexkit/opencode-magic-context` — the hippocampus that dreams (1,502 ⭐)

The most popular plugin in the subdomain, and the one that made me rethink what "persistent memory" means for an agent. **Its tagline is "Unbounded context. Memory that manages itself. One session, for life. The hippocampus for coding agents"**. That's not empty marketing: it implements a **background historian** that compresses old history into structured compartments while you work, and an **"overnight dreamer"** mode that runs memory maintenance when you're not using the agent. The idea of memory curing itself while you sleep is new in this space.

I installed it on a Tuesday at 11 PM, configured the `/ctx-status` command to inspect what it remembered, and by Wednesday at 9 AM the agent knew what it had done the previous day without me telling it. The **unified history/memories/facts search** and the **prompt-cache-safe deferred operations** support distinguish it from "notes" plugins. If your flow involves sessions that last days or weeks, this is the hero.

### 2. `tickernelz/opencode-mem` — the local-first with a web UI (1,216 ⭐)

Second in traction, and the most balanced for the indie dev who wants **persistent memory without a cloud and with visual audit**. Config is straightforward:

```jsonc
// ~/.config/opencode/opencode.json
{ "plugin": ["opencode-mem"] }
```

Then a dedicated `~/.config/opencode/opencode-mem.jsonc` where you pick the local embedding model (12+ pre-configured Transformers.js models, from the small `Xenova/all-MiniLM-L6-v2` at 80 MB to the robust `Xenova/bge-base-en-v1.5` at 400 MB) and an optional OpenAI-compatible endpoint if you want higher quality. Internally it uses **SQLite + USearch** for the vector index, with a fallback to ExactScan if the binary library is unavailable. What I liked most: **a web UI at `http://127.0.0.1:4747`** where you can see what the agent remembers, delete it, audit it. For an indie dev who defaults to distrusting clouds with their notes, that's worth gold.

The external review that convinced me most was written by **kd05.com** on March 26, 2026:

> "It's like Groundhog Day, but for coding. You spend the first few minutes of every session re-establishing context that should have been remembered from day one."

Source: [kd05.com/p/opencode-mem-memory-plugin-guide/](https://kd05.com/p/opencode-mem-memory-plugin-guide/)

### 3. `samvallad33/vestige` — Rust local-first for those who hate JS (592 ⭐)

The only top-tier plugin written in **Rust**, and that alone is a statement. **Vestige is an MCP server** (not an npm plugin) that delivers project-scoped memory to OpenCode for decisions, preferences, architectural context, and prior fixes, all in a compiled binary, single-process, low-RAM. For those of us, like me, with a fleet of older machines where one more Node daemon is felt, **this is the hero**. The official tagline says it all: *"Vestige gives AI agents sharp memory: a local-first Rust MCP server that reaches backward through time to find the quiet…"*.

### 4. `joshuadavidthomas/opencode-agent-memory` — the Letta pattern (318 ⭐)

The one that best implements the **shared memory blocks pattern from Letta** without forcing you to run a Letta server. The idea: Markdown files on disk are **shared state** that every OpenCode session can read and write, so a `plan` agent can leave notes that a `build` agent reads later. The author describes it as *"AGENTS.md with a harness"*. If your flow is multi-agent and you want plan, build, ask, and review to share the same persistent buffer, this is the path. Simpler than `basic-memory` (no graph or wikilinks required), more expressive than a flat `CLAUDE.md`.

### 5. `cnicolov/opencode-plugin-simple-memory` — memory auditable as code (134 ⭐)

The one that covers a unique use case: **committable persistent memory, peer-reviewable**. Instead of saving notes in an opaque database, it saves them inside the git repository itself. For teams where the agent's memory must pass through code review, this plugin is the only one that does it. The trade-off is obvious: you pollute the repo with internal notes, so it only makes sense in projects where that pollution is acceptable (e.g., explicit-knowledge repos like a technical wiki). Don't use it in your client's production repo.

### 6. `xenitV1/lemma` — the biological and universal (81 ⭐)

The most interesting conceptually. **Lemma implements confidence decay/boost** — memory weakens if unused, strengthens if used — plus **fuzzy deduplication with Fuse.js**, a **guide system with usage tracking** and **cross-references** between memories. It's a TypeScript MCP server with **20 tools and 110 tests, zero dependencies**, stored in JSONL, 100% local, no API keys, no cloud. What makes it unique: **it's universal via MCP**, so it works with OpenCode, Claude Code, Cursor, VS Code, Gemini CLI, and any MCP client. If you switch tools every two months (like me), Lemma is the one that ensures continuity.

### 7. `kuitos/opencode-claude-memory` — the bridge between the two giants (42 ⭐)

The most specific, and therefore useful. It shares **persistent Markdown memory between OpenCode and Claude Code** using paths and formats compatible with Claude's memory system. If your flow is hybrid (I spend entire weeks alternating between the two depending on the project), this plugin is the piece that prevents each tool from having its own "mental silo". It's small, does one thing, does it well.

### 8. `plastic-labs/opencode-honcho` — open-core infrastructure (38 ⭐)

For those who need **cross-project memory, not just within a repo**. Honcho is a **memory-as-infrastructure platform**: it models identities, agents, users, groups, projects, and ideas, remembers your context across context wipes, session restarts, and fresh chats, and supports both **managed cloud** (`api.honcho.dev`) and **self-hosted** (FastAPI). The claim from their repo is aggressive:

> "Honcho has defined the Pareto Frontier of Agent Memory."

Source: [github.com/plastic-labs/honcho](https://github.com/plastic-labs/honcho). I treat the claim with caution because it's marketing, but the infrastructure is real and the parent repo `plastic-labs/honcho` has daily activity.

### 9. `smc2315/harness-memory` — the "73% fewer tokens than CLAUDE.md" (11 ⭐)

The one with the **killer headline** and therefore makes this top list. It implements **auto-capture of tool-interaction evidence**, memories materialized by a **multi-gate pipeline**, and a **4-layer activation engine** that selects relevant memories by context. It uses `sql.js` (WASM) to be local-first without native dependencies. And the author's claim: **replaces CLAUDE.md with structured, searchable, reviewable memory, using 73% fewer tokens**. I haven't been able to audit the benchmark independently, but if the number is anywhere close to reality, it's the piece any developer obsessed with system-prompt size should try. I installed it four days ago, and on my mid-sized repo (12k lines, mix of Kotlin and TypeScript) I went from a 1,420-token CLAUDE.md to a 380-token memory activated on demand.

### 10. `carrasquelalex1/hipocampo` — the PostgreSQL and pgvector one (3 ⭐)

The most under-the-radar, and therefore the most interesting for those who already have Postgres infra. It implements a proprietary algorithm called **BIRE (Búsqueda Integrada por Relevancia Expansiva)** on top of **PostgreSQL + pgvector + Gemini Embeddings**, with GIN trigram indexes, auto-tagging, and hybrid scoring. It ships as an **OpenCode skill** (not a pure npm plugin), with its `SKILL.md`, Python scripts, and full DDL. The advantage is brutal: if you already have a Postgres in production, you don't introduce a new vector service (Qdrant, Weaviate, USearch) — you reuse the infra you already operate, monitor, and back up. Three stars and a commit the day before this article closed: **it's the sleeper you'll probably hear more about in the coming months**.

### Comparison table — the 10 plugins at a glance

To pin down the ideas, a table with the dimensions that matter when choosing:

| Plugin | Stars | Stack | Storage | Embeddings | Scope | Traction |
|---|---|---|---|---|---|---|
| `cortexkit/magic-context` | 1,502 | TypeScript | Proprietary (compartments) | Internal | Session + project | Commit today |
| `tickernelz/opencode-mem` | 1,216 | TypeScript | SQLite + USearch | 12 local or OpenAI-compat | Project / global | npm v2.17.3 (5h ago) |
| `samvallad33/vestige` | 592 | **Rust** MCP | Local binary | N/A (keyword+meta) | Project | Commit today |
| `joshuadavidthomas/agent-memory` | 318 | TypeScript | Markdown on disk | N/A | Multi-session | Commit today |
| `cnicolov/simple-memory` | 134 | TypeScript | Markdown in git | N/A | Project | Commit yesterday |
| `xenitV1/lemma` | 81 | TypeScript MCP | JSONL | N/A (metadata) | Universal MCP | 110 tests |
| `kuitos/opencode-claude-memory` | 42 | TypeScript | Markdown cross-tool | N/A | OpenCode ↔ Claude | Active |
| `plastic-labs/honcho` | 38 | PyPI + TS | Cloud or self-host | Internal | Cross-project | Parent repo very active |
| `smc2315/harness-memory` | 11 | TypeScript | sql.js WASM | Internal | Project | Recent |
| `carrasquelalex1/hipocampo` | 3 | Python skill | PostgreSQL + pgvector | Gemini | Project | Commit yesterday |

![Comparison table of the 10 memory plugins by stack, storage, embeddings, scope and traction](/images/awesome-opencode-memory-plugins-en.svg)

## 🌑 The dark angle: four real critiques and the community's response

Looking at the zoo from above has one uncomfortable advantage: you also see what **doesn't work**. In the same Hacker News thread that gave the core-team quote, there are critiques worth reproducing verbatim because they're the ones an indie dev needs to know before installing the first plugin. **I'm not reproducing them to sound alarms, but because the community already has technical answers for each one**.

### 1. "Big Pickle" and the default that ships your prompts to a free cloud

One commenter summarized the surprise this way:

> "It also sends all of your prompts to Grok's free tier by default, and the free tier trains on your submitted information, X AI can do whatever they want with that, including building ad profiles, etc. It uses a model called 'Big Pickle' by default which is an alias for minimax 2.5, as far as I've been able to tell."

> "Wait what. For real? I knew their security posture was bad, but this bad??"

Source: [news.ycombinator.com/item?id=47460525](https://news.ycombinator.com/item?id=47460525)

The critique is real: the default model that a fresh OpenCode install proposed during 2026 was an internal alias ("Big Pickle") that routed to xAI/Grok's free tier, with whatever terms of service that implies. **The community's response was twofold**: on one side, Anomaly already exposes "OpenCode Zen", a curated model marketplace with transparent billing; on the other, plugins like **`Envsitter Guard`** (search the [awesome-opencode README](https://github.com/awesome-opencode/awesome-opencode)) **prevent the agent from reading or editing `.env` files** containing API keys, and **`CC Safety Net`** intercepts destructive commands before they execute.

### 2. The "session title" that traveled to the cloud even with a local model

This critique hurts more because it breaks the core promise of using local models:

> "I work on projects that warrant a self hosted model to ensure nothing is leaked to the cloud. Imagine my surprise when I discovered that even though the only configured model is local, all my prompts are sent to the cloud to... generate a session title. Fortunately caught during testing phase."

Source: [news.ycombinator.com/item?id=47460525](https://news.ycombinator.com/item?id=47460525)

The bug is known: the auto-titling system used a remote endpoint to generate the title even when the active model was local. **The response came in `opencode-update-notifier`** and in several issues on the core repo, but the cleanest fix comes from **logging sanitization plugins** like **`opencode-log-sanitizer`** (redacts JWTs and base64 blobs before they hit disk) and **policy enforcers** like **Cupcake** ([github.com/eqtylab/cupcake](https://github.com/eqtylab/cupcake)), which adds a declarative permissions layer over the tool system.

### 3. Permissive default permissions and config that pulls from the web

Another critique from the same thread, combining two concerns:

> "I am more concerned about their, umm, gallant approach to security. Not only that OpenCode is permissive by default in what it is allowed to do, but that it apparently tries to pull its config from the web (provider-based URL) by default."

Source: [news.ycombinator.com/item?id=47460525](https://news.ycombinator.com/item?id=47460525)

The critique about permissive permissions is structural: the default `build` mode allows file editing and bash execution without intermediate prompts, which is comfortable for the dev who wants speed and risky for the one who wants safety. **The indie community's response is the most interesting**, because it has produced a whole sub-category of **sandboxing** plugins and projects:

- **`brood-box`** ([github.com/stacklok/brood-box](https://github.com/stacklok/brood-box)) — hardware-isolated microVMs for coding agents. The nuclear option: each session runs in a disposable VM.
- **`bx`** — declarative sandbox for macOS using native system APIs.
- **`jailoc`** — pre-packaged Docker sandboxes so an agent command never touches your host.
- **`opencode-ignore`** — a `.gitignore`-style declaration of paths and patterns the agent must never read or write.
- **`Deck`** — a runner that orchestrates agents inside ephemeral sandboxes.

**If you work with client code or sensitive data, install at least `opencode-ignore` and `opencode-log-sanitizer` before your first command**. Two minutes of setup that save you the disgust of discovering three months later that the agent leaked an API key in a log.

### 4. OpenCode Go: the aggregator that promised quality parity

The commercial critique came from an independent review blog, **BSWEN**, in June 2026:

> "Problem. When I pay for an LLM aggregator like OpenCode Go, I expect the same model quality I would get accessing the provider directly. After three months of regular use, something felt off. Models that should perform near GPT or Opus level felt merely 'just okay' through the aggregator."

Source: [docs.bswen.com/blog/2026-06-12-opencode-quantized-models/](https://docs.bswen.com/blog/2026-06-12-opencode-quantized-models/)

The critique is interesting because **it's not of the agent but of the associated commercial service**. OpenCode Go is Anomaly's paid tier offering 16 curated models for a monthly subscription. The blogger suspects the aggregator sits in front of quantized models or aggressive rate-limiting that isn't clearly disclosed. **The community's response here was technical: the `Opencode LiteLLM`** plugin and **`Opencode Provider Alias`** let you redirect any "curated model" to your preferred endpoint (Anthropic direct, OpenAI direct, etc.) with a simple alias in `opencode.json`. If you don't trust the aggregator, bypassing it is trivial.

## 🧪 Three installations you can set up this afternoon, in order of return

To close with something actionable, my personal recommendation if you're coming from the [previous persistent-memory article](/blog/persistent-memory-stack-implementation/) and want to extend that stack with pieces from the zoo:

**1. Install OCX (15 minutes).** OCX ([github.com/kdcokenny/ocx](https://github.com/kdcokenny/ocx), 879 ⭐) is the **de facto package manager** for OpenCode. It lets you manage portable, isolated profiles. `bunx ocx add <plugin>` or `npm i -g ocx` and then `ocx add <package>`. Once you have it, everything else becomes reproducible.

**2. Add `opencode-mem` (30 minutes).** It's the memory plugin with the best balance between functionality, traction, and local-first philosophy. Start with `Xenova/all-MiniLM-L6-v2` as your embedding, turn on the web UI, observe for a week what it captures, tune `memory.defaultScope` and `compaction.memoryLimit` to your taste.

**3. Add `opencode-ignore` and `opencode-log-sanitizer` (10 minutes).** Even if persistent memory doesn't interest you, these two are **insurance plugins**: cheap to install and they protect you from 90% of the security unpleasantness the community saw in 2026. After this you have the base setup to experiment with the rest of the zoo.

## 📚 References and bibliography

**Primary sources (what I cited verbatim):**

- [github.com/awesome-opencode/awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) — the curated list
- [github.com/anomalyco/opencode](https://github.com/anomalyco/opencode) — live canonical repo
- [github.com/charmbracelet/crush](https://github.com/charmbracelet/crush) — successor to the archived repo
- [opencode.ai](https://opencode.ai) — official site
- [news.ycombinator.com/item?id=48978112](https://news.ycombinator.com/item?id=48978112) — k-langton (core team) on compaction
- [news.ycombinator.com/item?id=47460525](https://news.ycombinator.com/item?id=47460525) — security and default critiques
- [news.ycombinator.com/item?id=47361303](https://news.ycombinator.com/item?id=47361303) — "The Memory Wall"
- [news.ycombinator.com/item?id=44483572](https://news.ycombinator.com/item?id=44483572) — scosman: "OpenCode is great. A tier TUI. Basically an open Claude code."
- [kd05.com/p/opencode-mem-memory-plugin-guide/](https://kd05.com/p/opencode-mem-memory-plugin-guide/) — external review of opencode-mem
- [docs.bswen.com/blog/2026-06-12-opencode-quantized-models/](https://docs.bswen.com/blog/2026-06-12-opencode-quantized-models/) — critique of OpenCode Go

**The 10 plugins analyzed (direct links):**

- [cortexkit/opencode-magic-context](https://github.com/cortexkit/opencode-magic-context) — 1,502 ⭐
- [tickernelz/opencode-mem](https://github.com/tickernelz/opencode-mem) — 1,216 ⭐
- [samvallad33/vestige](https://github.com/samvallad33/vestige) — 592 ⭐
- [joshuadavidthomas/opencode-agent-memory](https://github.com/joshuadavidthomas/opencode-agent-memory) — 318 ⭐
- [cnicolov/opencode-plugin-simple-memory](https://github.com/cnicolov/opencode-plugin-simple-memory) — 134 ⭐
- [xenitV1/lemma](https://github.com/xenitV1/lemma) — 81 ⭐
- [kuitos/opencode-claude-memory](https://github.com/kuitos/opencode-claude-memory) — 42 ⭐
- [plastic-labs/opencode-honcho](https://github.com/plastic-labs/opencode-honcho) — 38 ⭐
- [smc2315/harness-memory](https://github.com/smc2315/harness-memory) — 11 ⭐
- [carrasquelalex1/hipocampo](https://github.com/carrasquelalex1/hipocampo) — 3 ⭐

**Security plugins mentioned (insurance):**

- Envsitter Guard — search the [awesome-opencode README](https://github.com/awesome-opencode/awesome-opencode)
- CC Safety Net — search the [awesome-opencode README](https://github.com/awesome-opencode/awesome-opencode)
- opencode-ignore — search the [awesome-opencode README](https://github.com/awesome-opencode/awesome-opencode)
- opencode-log-sanitizer — search the [awesome-opencode README](https://github.com/awesome-opencode/awesome-opencode)
- [eqtylab/cupcake](https://github.com/eqtylab/cupcake) — policy enforcer
- [stacklok/brood-box](https://github.com/stacklok/brood-box) — microVMs for agents

**Prior blog posts linked:**

- [Native OpenCode Plugins for Persistent Memory](/blog/opencode-memory-plugins-native/)
- [MCP Servers and Cross-Agent Memory](/blog/mcp-servers-memory-cross-agent/)
- [Persistent Memory Stack: Real Implementation](/blog/persistent-memory-stack-implementation/)
- [OpenCode Subagents: Workflows and Superpowers](/blog/opencode-subagents/)
- [AI CLI Semifinal 1: The Battle of Terminal Agents](/blog/cli-ai-semifinal-1/)
- [AI CLI Grand Final](/blog/cli-ai-grand-final/)

## 🪶 Closing

The zoo is big, but not infinite. Of the 223 entries in the awesome-list, **a dozen form the core an indie dev will actually touch**: a package manager (OCX), a pair of well-chosen memory plugins, two or three security ones, and whichever sub-agent you prefer. The rest are pieces worth knowing exist, not necessarily worth installing tomorrow. **The signal that a plugin has "matured" is that its last commit is from this week and its author responds to issues in days, not months**. Of the 10 I've covered, 7 meet that bar as of July 27, 2026.

If you liked the "commented index with verdict" format, I have 7 other posts covering other angles of the OpenCode ecosystem (subagents, memory, skills, workflows, IDE integrations) — the full series, together with this one, forms **the zoo map from every possible angle**. Tell me in the comments which of the 10 plugins has piqued your curiosity the most and why — I want to know what the community prioritizes in practice, not just on GitHub traction.

— *ArceApps*
