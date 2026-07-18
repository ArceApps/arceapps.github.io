---
title: Native OpenCode Plugins for Persistent
description: "Comparative technical analysis of three native OpenCode plugins to give your AI agent persistent local memory: simple-memory (logfmt), Mnemosyne (offline Go binary), and true-mem (cognitive psychology)."
pubDate: 2026-06-16
heroImage: /images/opencode-memory-plugins-native.svg
tags: ["AI", "Agents", "Memory", "OpenCode", "Plugins", "MCP", "Indie Dev"]
category: ai-agents
reference_id: 8b4f9d3e-2f0c-5e6b-9d8f-4c7a3b0d5e2f
author: ArceApps
lastmod: 2026-06-16
canonical: "https://arceapps.com/blog/opencode-memory-plugins-native/"
keywords: ["AI", "Agents", "Memory", "OpenCode", "Plugins", "MCP", "Indie Dev"]
---

> If you have been working with coding agents for a while, you know the "amnesiac agent syndrome": every session starts from zero, you re-explain your architecture, your preferences, and the decisions you made yesterday. In [The Architecture of Persistent AI Agent Memory](/blog/ai-agent-memory-persistence-guide/) I already covered the theoretical framework (OpenClaw, QMD, Mem0, Cognee). Today we get hands-on with three real plugins you can install in [OpenCode](https://opencode.ai) right now.

---

## The Concrete Problem: Three Sessions, Three Different Agents

I work on Kotlin projects for Android, I maintain [this Astro site](https://github.com/arceapps/arceapps.github.io) and every now and then I pick up a Python script I left half-finished three weeks ago. My natural flow is to open OpenCode, write "continue where we left off with the Kotlin parser", and expect the agent to know what "the Kotlin parser" is, why I chose it over `kotlinx-parser`, and what architectural decisions I made last time.

The problem is that without persistent memory, I open a session and the agent is a polite stranger. It has the superpowers of the model, but zero context about me, my project, my quirks. I have to give the TED talk again about "this repo uses X, not Y, for reason Z".

That pushed me to seriously try the persistent memory plugin ecosystem for OpenCode. And here I bring the three that have served me best when **I want something native, local-first, and installable in five minutes**. In the [second article of this series](/blog/mcp-servers-memory-cross-agent) we will cover the heavier but more versatile MCP servers, and in the [third article](/blog/persistent-memory-stack-implementation) we go deep into day-to-day usage.

---

## Comparison Criteria

Before diving in, let us set the axes along which I will evaluate each plugin. This helps me not fool myself, and helps you understand why I reach the conclusions I reach:

1. **Persistence model**: plain text files, local SQLite, external binary, remote database? This determines auditability, portability, and infrastructure dependency.
2. **Installation curve**: required commands, system prerequisites, downloaded model size.
3. **Extraction model**: must you remember explicitly or does the plugin detect automatically? Does it support global vs. project scope?
4. **Search and retrieval**: simple token matching, BM25, vector search, hybrid. This matters when your memory grows to hundreds of notes.
5. **Multilingual and noise handling**: if you work in Spanish and mix code, you need the plugin not to go crazy with the agent's own meta-conversation.
6. **Maturity**: GitHub stars, commit frequency, open issues, current version.
7. **Compatibility with the rest of the OpenCode stack**: does it interfere with other plugins, compaction hooks, sub-agents?

With that in mind, let us dig in.

---

## 1. opencode-plugin-simple-memory: The Pragmatist of Logfmt Files

**Repository**: [github.com/ApplauseLab/opencode-plugin-simple-memory](https://github.com/ApplauseLab/opencode-plugin-simple-memory) (also published as `@knikolov/opencode-plugin-simple-memory` on npm).
**Author**: cnikolov / ApplauseLab.
**Stars**: ~124. **Active version**: regular releases.
**Language**: TypeScript 100%. **Persistence**: daily `logfmt` files.

### Design Philosophy

`simple-memory` is the plugin you write when you are fed up with complexity. Its data model is deliberately minimalist: every memory is a line in a `YYYY-MM-DD.logfmt` file under `.opencode/memory/`. No SQLite, no embeddings, no MCP server. Plain text with space-separated fields, easily parseable and, above all, **human-readable with `cat`**.

I love this approach because it fulfills the property I value most in a memory tool: **I can audit what my agent knows with a shell command**.

### Installation

The installation is the simplest of the three:

```json
// ~/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@knikolov/opencode-plugin-simple-memory"]
}
```

And optionally, to enable auto-load and auto-save:

```json
{
  "plugin": [
    [
      "@knikolov/opencode-plugin-simple-memory",
      {
        "autoLoad": true,
        "autoSave": true,
        "contextLimit": 5,
        "contextMaxChars": 1200
      }
    ]
  ]
}
```

However, there is an important detail few people mention: **OpenCode does not auto-update plugins**. If you install version 0.5 today and 0.6 comes out tomorrow with a bug fix that affects you, you have to clear the cache manually:

```bash
rm -rf ~/.cache/opencode/node_modules/@knikolov/opencode-plugin-simple-memory
opencode
```

This happened to me once and cost me twenty minutes wondering why a new feature did not show up.

### Memory Model

Each memory record is a logfmt line of this form:

```
ts=2026-05-28T10:00:00.000Z type=context scope=api content="Remember this" issue=#51 tags=backend,current
```

Supported fields:

- **`type`**: `decision`, `learning`, `preference`, `blocker`, `context`, `pattern`. Useful for categorizing without inventing a taxonomy.
- **`scope`**: free string, typically something like `user`, `project`, or a subsystem name (`api`, `tests`, `deploy/staging`).
- **`tags`**: comma-separated list for secondary filtering.
- **`content`**: the actual text.

Deleted memories are logged in `deletions.logfmt`, which is an audit detail I appreciate. No "memory was lost" without traceability.

### Tools Exposed to the Agent

The plugin registers nine tools: `memory_remember`, `memory_recall`, `memory_update`, `memory_forget`, `memory_list`, `memory_export`, `memory_import`, `memory_compact`, `memory_context`. The names are self-explanatory, and `memory_compact` can be run with `dryRun: true` to preview changes before applying them.

### The Good

- **Extreme auditability**: open any `.logfmt` file in `vim` and understand exactly what the agent knows.
- **Zero external dependencies**: no Python, no Go, no Docker, no internet connection required after installing the npm package.
- **Rich filters in `memory_recall`**: by scope, type, query, tags, date (`since`/`until`), matching mode (`contains`, `exact`, `prefix`). This partially compensates for the lack of semantic search.
- **Portable**: `logfmt` files are trivially versionable with Git. You can `git diff .opencode/memory/` and see what the agent learned this week.
- **Smooth migration**: the format is backwards compatible. Old entries without quotes remain readable.

### The Not-So-Good

- **No semantic search**: if you say "JWT" and previously saved "JSON Web Token", it will not relate them. Past a few hundred memories you will notice the limit.
- **No native multi-agent**: OpenCode only. If you migrate to Claude Code tomorrow, you have to migrate manually with `memory_export` / `memory_import` (which supports `jsonl`, `json` and `logfmt`).
- **Relevance scoring is word-matching**: `contextMinScore` is binary, not gradual. Automatic injections lose context when memories use different terminology.

### Verdict

`simple-memory` is the plugin I would recommend to someone who **wants to start today and does not want surprises**. If your project fits in a few hundred notes and you value auditability over sophistication, it is hard to beat.

I use it as a second layer: `basic-memory` (covered in the second article) handles my semantic project memory, and `simple-memory` handles the quick operational notes I do not want indexed vectorially.

---

## 2. opencode-mnemosyne: Total Offline with Go Binary and ONNX

**Repository**: [github.com/gandazgul/opencode-mnemosyne](https://github.com/gandazgul/opencode-mnemosyne).
**Author**: gandazgul.
**Stars**: ~13 (young project). **Active version**: v0.2.4 (April 2026).
**Plugin language**: TypeScript 100%. **Backend**: standalone Go binary at [github.com/gandazgul/mnemosyne](https://github.com/gandazgul/mnemosyne).
**Persistence**: SQLite with `sqlite-vec` for local vector search.

### Design Philosophy

Mnemosyne is for those who see a 500MB downloaded model binary and say "perfect, now we are talking". It is the only one of the three that **does not depend on any cloud service** for anything: neither for embeddings, nor for LLM, nor for storage. Everything runs on your machine.

They position it explicitly as "the local/offline alternative to opencode-supermemory". And they deliver.

### Installation

Here is where Mnemosyne starts to differentiate. It is not npm; it is a Go binary:

```bash
git clone https://github.com/gandazgul/mnemosyne.git
cd mnemosyne
task install
```

This requires:
- Go 1.21+
- GCC (to compile sqlite-vec with C bindings)
- `task` (the Go task runner)

Once the `mnemosyne` binary is installed (in `$PATH`), the OpenCode plugin is configured trivially:

```json
// ~/.config/opencode/opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-mnemosyne"]
}
```

The first time it runs, it automatically downloads the ML models (~500MB one-time, cached locally). This is a *showstopper* if you have limited bandwidth, but a *non-issue* if you always work from the same network.

### Memory Model

Mnemosyne operates with two scopes:

- **`project`**: collection named after the project directory. Persists across sessions of the same project.
- **`global`**: shared collection. Created on first `memory_store_global`.

And two criticality levels per scope:

- **Normal**: memories that can decay with context compaction.
- **`core`**: memories marked as critical that survive compaction and are always available. Documentation recommends using them sparingly.

The plugin recommends adding this block to the project's `AGENTS.md` so the agent uses memory proactively:

```markdown
## Memory (mnemosyne)

- At the start of a session, use memory_recall and memory_recall_global to search for context
  relevant to the user's first message.
- After significant decisions, use memory_store to save a concise summary.
- Delete contradicted memories with memory_delete before storing updated ones.
- Use memory_recall_global / memory_store_global for cross-project preferences.
- Mark critical, always-relevant context as core (core=true) — but use sparingly.
- When you are done with a session, store any memories that you think are relevant
  to the user and the project.
```

This is a pattern I really like: the plugin defines the usage contract via convention, not code. The agent decides when to save based on the instructions.

### Real Hybrid Search

Here is where Mnemosyne shines technically. It combines:

1. **Full-text search** via SQLite FTS5 with BM25 ranking.
2. **Vector search** via `sqlite-vec` with cosine similarity using the `snowflake-arctic-embed-m-v1.5` model.
3. **Reciprocal Rank Fusion (RRF)** to combine both rankings.

All ML inference runs locally via ONNX Runtime. Your memories never touch the network after the initial model download. For me, who often works from cafes with shared WiFi, this is pure gold.

### Compaction Hook

A very interesting detail: the plugin registers a hook on `experimental.session.compacting` that injects instructions about the memory tools into the compaction prompt. This means that **when OpenCode compacts the context, the agent knows it still has memory available** and can query before summarizing.

### The Good

- **Absolute privacy**: nothing leaves your machine. Not even embeddings.
- **Real hybrid search** without external services.
- **The compaction hook** is elegant: it integrates memory with the context lifecycle.
- **Clear documentation** on when to use `core` and when not to (with concrete example: "memories of a known critical bug").

### The Not-So-Good

- **Higher installation curve**: you need Go, GCC and task. If you come from pure Node (like me with many projects), there is a small initial friction.
- **Young project**: 13 stars is a small user base. If you find a bug, you may have to read the Go code yourself.
- **Limited multi-agent**: OpenCode only for now. The binary backend could integrate with other agents via MCP, but there is no official integration outside OpenCode.
- **500MB of model**: not huge, but on a laptop with a small SSD it matters.

### Verdict

Mnemosyne is what I would recommend to a privacy-paranoid user, someone working in air-gapped mode, or an indie dev who hates cloud dependencies. If your biggest fear when using `supermemory` is "who reads my memories?", Mnemosyne is your answer. The trade-off is a more frictionful installation and a smaller community.

---

## 3. true-mem: Cognitive Psychology Applied to AI Memories

**Repository**: [github.com/rizal72/true-mem](https://github.com/rizal72/true-mem).
**Author**: rizal72.
**Stars**: ~192. **Active version**: v1.4.1 (April 2026).
**Language**: TypeScript 100%. **Persistence**: SQLite via `bun:sqlite` (with fallback to `node:sqlite` for Node 22+).
**License**: MIT.

### Design Philosophy

`true-mem` is, conceptually, the most interesting of the three. While `simple-memory` bets on simplicity and `Mnemosyne` on offline privacy, `true-mem` bets on **modeling memory as if it were a human brain**.

Its author draws explicit inspiration from:

- **Ebbinghaus forgetting curve**: episodic memories fade over time (default 7 days), but preferences and decisions are permanent. Like your brain: you forget what you had for dinner last Tuesday but remember your favorite color.
- **7-feature scoring model**: every memory is scored by Recency, Frequency, Importance, Utility, Novelty, Confidence, and Interference. The scoring determines which memories get promoted from STM (short-term) to LTM (long-term).
- **STM/LTM dual-store architecture** with automatic promotion.
- **4-layer defense system** against false positives.
- **Reconsolidation**: when new information contradicts existing memories, the system intelligently decides whether to merge, keep them as complements, or resolve the conflict.

This makes it, technically, the most sophisticated of the three at the level of **computational psychology**.

### Installation

Installation is trivial, similar to `simple-memory`:

```json
// ~/.config/opencode/opencode.jsonc
{
  "plugin": ["true-mem"]
}
```

OpenCode automatically downloads the plugin from npm. On first run, it creates `~/.true-mem/` with the SQLite database and debug logs. You will see a toast notification confirming it is loaded.

The config file is created automatically at `~/.true-mem/config.jsonc`:

```jsonc
{
  // Storage location: "legacy" = ~/.true-mem/ (default), "opencode" = ~/.config/opencode/true-mem/
  "storageLocation": "legacy",
  // Injection mode: 0 = session start only (recommended), 1 = every prompt
  "injectionMode": 0,
  // Sub-agent mode: 0 = disabled, 1 = enabled (default)
  "subagentMode": 1,
  // Embeddings: 0 = Jaccard similarity only, 1 = hybrid (Jaccard + embeddings)
  "embeddingsEnabled": 0,
  // Maximum memories to inject per prompt (10-50 recommended)
  "maxMemories": 20
}
```

### Memory Model

`true-mem` automatically classifies extracted memories into:

| Type | Decay | Store | Scope | Example |
|---|---|---|---|---|
| `constraint` | Never | STM | Global | "Never use `var`" |
| `preference` | Never | STM | Global | "Prefers functional style" |
| `learning` | Never | LTM | Global | "Learned bun:sqlite API" |
| `procedural` | Never | STM | Global | "Run tests before commit" |
| `decision` | Never | LTM | Project | "Decided SQLite over Postgres" |
| `semantic` | Never | STM | Project | "API uses REST, not GraphQL" |
| `episodic` | Yes (7d) | STM | Project | "Yesterday we refactored auth" |

The key here is that **episodic memories are the only ones that fade**. This is exactly what human memory does: we remember what matters (preferences, decisions, technical knowledge) and forget the mundane (what we ate yesterday).

### Automatic Detection with Four Defense Layers

Where `true-mem` especially shines is in **what it decides to save and what it decides to discard**. Unlike `simple-memory` (which only saves when you say "remember") or `supermemory` (which detects keywords like "remember this"), `true-mem` runs a classifier with four layers:

1. **Question Detection**: filters questions before classifying. If you say "Do you remember this?", it does not get saved.
2. **Negative Patterns**: detects the AI's own meta-conversation ("Goal: The user is trying to..."), list selections ("I prefer option 3"), and first-person recall ("I remember when we fixed that"). Supports 10 languages.
3. **Multi-Keyword + Sentence-Level**: requires 2+ signals in the same sentence to consider storing.
4. **Confidence Threshold**: only saves if the confidence score is ≥ 0.6.

This is hugely important because it solves a real problem: **how do you prevent the agent from saving its own thoughts as if they were yours?** It is the classic problem of "the agent has learned it likes TypeScript" when you were really saying "I prefer TypeScript". The role-aware extraction (`role-patterns.ts`) explicitly separates Human vs Assistant messages.

### Real Multilingual

`true-mem` supports 15 languages: English, Italian, Spanish, French, German, Portuguese, Dutch, Polish, Turkish, Russian, and five more. I have tested it in conversations mixing Spanish and English, and classification works surprisingly well.

The global scope system is also multilingual: "siempre", "ovunque", "toujours", "immer", "sempre" — all these words trigger global scope in their respective languages.

### The Good

- **Most realistic memory model**: the combination of decay + scoring + dual-store reflects how human memory works. This is the only one of the three where I thought "this feels right".
- **Excellent noise filters**: meta-talk detection is something I have suffered with in other plugins and is elegantly solved here.
- **Truly multilingual**: not an afterthought. 15 languages with native patterns.
- **No native dependencies**: uses built-in `bun:sqlite` (or `node:sqlite`). You do not need to install external binaries.
- **Optional embeddings**: you can enable them if you want (`embeddingsEnabled: 1`), but by default uses Jaccard (faster and less resource-hungry).

### The Not-So-Good

- **OpenCode only**: just like `simple-memory` and `Mnemosyne`, no native integration with Claude Code, Cursor or Codex.
- **Default injections are at session start** (`injectionMode: 0`). This means new memories created during a long session do not appear until you restart. The option to inject on every prompt (`injectionMode: 1`) has a token cost.
- **Embeddings are experimental**: the docs are honest about this. They work, but Jaccard mode is the production-stable one.
- **Confidence threshold can be strict**: in my tests, the plugin sometimes discards valid preferences because they do not exceed 0.6. Adjustable, but you need to know it exists.

### Verdict

`true-mem` is what I recommend to anyone who **wants the most sophisticated memory model without sacrificing ease of use**. If you care about the agent not just storing, but **prioritizing** what it stores, and forgetting what it should forget (not what it should remember), this is your plugin.

I have it installed permanently. The difference between this and `simple-memory` is that with `true-mem` I rarely need to review what it saved, because the filtering system is good enough.

---

## Quick Comparison Table

| Feature | simple-memory | Mnemosyne | true-mem |
|---|---|---|---|
| **Stars** | ~124 | ~13 | ~192 |
| **Backend** | logfmt files | Go binary + SQLite | SQLite (bun:sqlite) |
| **Search** | Keyword matching | Hybrid FTS5 + vector (ONNX) | Jaccard / experimental embeddings |
| **Multi-agent** | No (OpenCode only) | No (OpenCode only) | No (OpenCode only) |
| **Installation** | Trivial (npm) | Medium (Go + GCC + task) | Trivial (npm) |
| **Auto detection** | Keyword only | By AGENTS.md convention | Automatic with 4 layers |
| **Privacy** | Total (local files) | Total (local binary) | Total (local SQLite) |
| **External dependency** | None | 500MB ONNX model | Optional (embeddings) |
| **Decay model** | No | No | Yes (Ebbinghaus) |
| **Learning curve** | Low | Medium | Low-medium |
| **Best for** | Auditability, Git-friendly | Total privacy, offline semantic search | Noise filtering, multilingual, cognitive model |

---

## When to Use Each One

If I had to pick one to start today, my honest answer is: **it depends on your developer personality**.

- **If you value radical transparency and want to read your memories with `cat`**: `simple-memory`.
- **If you work in air-gapped mode or with sensitive data**: `Mnemosyne`.
- **If you want the plugin to "think" for you about what to save and what to forget**: `true-mem`.

And if you want to try several (like me), know that **they can coexist** because each writes to different directories: `.opencode/memory/` (simple-memory), `<project>` or `global` of Mnemosyne, and `~/.true-mem/` (true-mem). I have not found conflicts, although obviously each plugin has its own knowledge base and they do not sync with each other.

---

## What Is Coming in the Next Article

These three plugins are fantastic, but they all share a common limitation: **they only work with OpenCode**. If tomorrow you decide to try Claude Code for a serious project, or Cursor for a quick refactor, or Codex CLI on the CI server, you will not be able to take the memory with you.

In the [second article of this series](/blog/mcp-servers-memory-cross-agent) we cover the three cross-agent MCP servers I have found most mature: **opencode-supermemory** (cloud-first with auto-compact), **basic-memory** (Markdown + knowledge graph), and **forgetful** (atomic Zettelkasten + entities + skills). These are more infrastructure, but the versatility pays off.

And in the [third article](/blog/persistent-memory-stack-implementation) I tell you exactly how I combine the best ones in my daily flow with real configuration examples for Claude Code, Codex and OpenCode.

---

## References and Further Reading

- [opencode-plugin-simple-memory repository](https://github.com/ApplauseLab/opencode-plugin-simple-memory)
- [OpenCode plugin documentation](https://opencode.ai/docs/config/)
- [opencode-mnemosyne on GitHub](https://github.com/gandazgul/opencode-mnemosyne)
- [Mnemosyne backend binary](https://github.com/gandazgul/mnemosyne)
- [true-mem on GitHub](https://github.com/rizal72/true-mem)
- [Ebbinghaus forgetting curve (Wikipedia)](https://en.wikipedia.org/wiki/Forgetting_curve)
- [A-MEM: Agentic Memory paper (arXiv)](https://arxiv.org/abs/2502.12110)
- [logfmt format documentation](https://brandur.org/logfmt)
- [SQLite FTS5 (official docs)](https://www.sqlite.org/fts5.html)
- [Reciprocal Rank Fusion (original paper)](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
- [Previous article: Architecture of Persistent AI Agent Memory](/blog/ai-agent-memory-persistence-guide/)
- [Previous article: OpenCode Subagents](/blog/opencode-subagents/)
