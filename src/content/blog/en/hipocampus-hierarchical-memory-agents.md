---
title: "Hipocampus: Zero-Infrastructure Hierarchical Memory for AI Agents"
description: "A technical deep-dive into Hipocampus, a drop-in memory harness for AI agents that uses a 3-tier Hot/Warm/Cold architecture and a 5-level compaction tree. How ROOT.md enables constant-cost memory awareness and how it compares to hmem, Mem0, and Letta."
pubDate: 2026-03-27
heroImage: "/images/blog-hipocampus-memoria-jerarquica.svg"
tags: ["AI", "Memory", "Agents", "Architecture", "Open Source", "Context Window", "Markdown"]
reference_id: "d3f7a2b1-9c5e-4d8a-b2f6-1e3c7d5a8b4e"
---

> This article is part of the ongoing memory series on this blog. For the broad landscape of persistent agent memory, start with [The Architecture of Persistent AI Agent Memory](/blog/ai-agent-memory-persistence-guide). For the security and privacy angle, read [Agentic Memory: Security, Privacy, and the Future of the AI Second Brain](/blog/memory-security-privacy-agentic). For Microsoft Research's task-agnostic approach, check [PlugMem: Microsoft Research's Task-Agnostic Memory Plugin](/blog/plugmem-microsoft-agent-memory). For the SQLite + FTS5 approach with five lazy-loaded levels, see [hmem: Hierarchical SQLite Memory for AI Agents That Actually Persists](/blog/hmem-sqlite-hierarchical-memory-agents). This article covers Hipocampus, a markdown-only, zero-infrastructure memory harness with a genuinely novel solution to the "what does my agent know?" problem.

---

## The Amnesiac Agent Problem, Again

The story is always the same. Your AI agent helps you design an authentication module on Monday. On Tuesday you start a new session and it has no idea what bcrypt cost factor you chose, why you went with JWTs, or that you already decided not to use refresh tokens. You are back to re-explaining everything from scratch.

This is not a corner case. It is the default behavior of every major AI coding tool, and the main reason developers feel like they are constantly fighting their agents rather than being accelerated by them.

The solutions that have emerged over the past year approach this problem from radically different angles: vector stores with semantic retrieval (Mem0), graph-based knowledge representation (PlugMem), SQLite with five lazy-loaded levels (hmem), full-server infrastructure (Letta). Each is a legitimate approach. Each comes with tradeoffs in complexity, cost, and operational overhead.

Hipocampus takes a different bet: what if the entire problem can be solved with nothing but markdown files, organized thoughtfully, and a compaction algorithm that keeps the system from overflowing?

---

## What Hipocampus Is

Hipocampus is a "drop-in memory harness" for AI agents. Created by kevin-hs-sohn, it is available on GitHub under the MIT license and installs with a single command:

```bash
npx hipocampus init
```

That one command creates the directory structure, generates skill files for your configured tools, and sets up pre-compaction hooks. No Docker. No Postgres. No vector database. No API keys. Just a set of well-organized markdown files and a clear protocol for the agent to follow.

It is compatible with the current generation of AI coding tools: Claude Code, OpenCode, and OpenClaw. And its design reflects a specific philosophy: infrastructure you do not control is infrastructure that can fail, cost money, or lock you in. Markdown files are readable by humans, editable in any text editor, portable across machines, and version-controllable with standard git.

---

## The Architecture: 3-Tier Memory

Hipocampus organizes agent memory into three tiers, each with a different access pattern:

### Tier 1 — Hot (Always Loaded, ~500 Lines)

The hot tier is what the agent has in context at the start of every session. It is small by design — approximately 500 lines, which translates to around 3,000 tokens. This is what makes Hipocampus economical: instead of loading hundreds of thousands of tokens of accumulated history, every session starts with a curated, compact context.

The hot tier consists of six files:

- **`ROOT.md`**: The index of everything the agent knows (~100 lines). This is the most innovative part of the system, and we will cover it in detail below.
- **`SCRATCHPAD.md`**: Current work-in-progress thoughts.
- **`WORKING.md`**: Active tasks and their state.
- **`TASK-QUEUE.md`**: Queued work not yet started.
- **`MEMORY.md`**: Long-term memory summaries.
- **`USER.md`**: User preferences and profile.

### Tier 2 — Warm (Read on Demand)

The warm tier contains more detailed content that the agent reads when a task requires it, but not by default at session start:

- **`memory/YYYY-MM-DD.md`**: Structured daily logs.
- **`knowledge/*.md`**: Deep knowledge base organized by topic.
- **`plans/*.md`**: Task plans with context and decisions.

The agent knows these files exist (because ROOT.md indexes them) but does not load them into context unless the current task actually requires that specific knowledge. This is the lazy-loading principle applied to file-based memory.

### Tier 3 — Cold (Search + Compaction Tree)

The cold tier is the historical archive. It contains:

- **Compaction tree**: Raw session data that has been compressed up through progressively coarser summaries.
- **Hybrid search** (optional): Via `qmd`, which provides BM25 + vector search capabilities for querying the cold tier directly.

The cold tier is not normally loaded into context. The agent queries it explicitly when it needs to reconstruct a specific historical decision or trace the origin of a current approach.

---

## ROOT.md: The Innovation That Makes It Work

Most of the memory systems we have analyzed on this blog solve one problem: storing and retrieving knowledge. Hipocampus solves a different, more fundamental problem first: **how does the agent know what it knows?**

This distinction matters more than it might initially appear. A memory system that stores everything but gives the agent no map of its own knowledge forces one of two bad outcomes:

1. **Load everything**: The agent loads all memory into every context, which is expensive (100K+ tokens) and often still misses the right information.
2. **Query blindly**: The agent issues semantic search queries, but to query effectively, you need to know what you are looking for. If you do not know a decision was made, you will not search for it.

ROOT.md solves this with a deliberate design constraint: it is a ~100-line index of topics, projects, and key decisions that the agent has accumulated. It loads automatically at the cost of approximately 3,000 tokens — constant, predictable, session after session.

With ROOT.md in context, the agent can genuinely answer the question: "Do I know anything about this?" Before querying deep knowledge files or cold storage, the agent checks the index. If the topic is not in ROOT.md, it was never accumulated. If it is, the agent knows exactly which warm or cold file to load to get the details.

This is the conceptual leap that separates Hipocampus from simpler file-based approaches. It is not just organizing files well. It is giving the agent a mental model of its own knowledge graph at minimal token cost.

---

## The 5-Level Compaction Tree

The compaction tree is how Hipocampus avoids the overflow problem that plagues simpler file-based memory systems. Without compaction, memory files grow indefinitely and eventually the system becomes unmanageable.

The compaction tree has five levels, each progressively coarser:

| Level | Content | Update frequency |
|-------|---------|-----------------|
| **raw** | Verbatim session logs | Every session |
| **daily** | Daily summary of key decisions and work | End of each day |
| **weekly** | Weekly synthesis of themes and progress | End of each week |
| **monthly** | Monthly high-level summary | End of each month |
| **root** | The persistent ROOT.md index | Updated incrementally |

The compaction algorithm moves data upward through the tree: raw session data gets distilled into daily summaries; daily summaries are periodically synthesized into weekly summaries; weekly into monthly; and the most durable knowledge from monthly summaries gets incorporated into ROOT.md.

The critical property of this tree is **temporal drill-down**. At any point, the agent (or a human reviewing the memory) can navigate from a topic in ROOT.md down through monthly → weekly → daily → raw to reconstruct exactly what happened and when. This is memory that is both compressed and traversable.

The practical implication: the system can run indefinitely without overflowing. Memory grows, compacts, and self-organizes. ROOT.md stays constant in size because compaction handles the accumulation.

---

## Pre-Compaction Hooks

One of the less-discussed but practically important features of Hipocampus is its pre-compaction hooks. These hooks run before the compaction algorithm processes a level, allowing preservation of information that would otherwise be lost in the summarization.

For an indie developer, this is what you use to ensure that specific decisions, architectural rationale, or unusual edge cases survive the compaction from raw → daily → weekly. Without hooks, compaction is lossy by design. With hooks, you can mark entries as "never compress below this level" or trigger custom preservation logic before the summarization runs.

This is a nuanced but important feature. Any system that compresses memory will lose information. The question is whether it loses the right information. Pre-compaction hooks give you control over that boundary.

---

## How It Compares

After analyzing multiple memory systems on this blog, a direct comparison is in order:

| Solution | Setup | Infrastructure | Cost | Memory awareness | Temporal drill-down |
|----------|-------|----------------|------|-----------------|---------------------|
| **Hipocampus** | `npx hipocampus init` | None (markdown only) | Free (MIT) | ROOT.md (constant ~3K tokens) | Yes (compaction tree) |
| hmem | `npx hmem-mcp init` | .hmem SQLite file | Free (open source) | ~20 tokens (L1 summary) | Manual hierarchy |
| Mem0 | pip + API key + vector DB | Server or cloud | $19–249/mo | Query-dependent (RAG) | No |
| Letta | Docker + Postgres + ADE | Server required | Cloud pricing | Query-dependent | No |

The standout characteristic of Hipocampus in this comparison is the intersection of **zero infrastructure** and **genuine memory awareness**. hmem also avoids server infrastructure (SQLite is a file), but its L1 summary is a coarser awareness signal than ROOT.md. Mem0 and Letta both require operational infrastructure and their memory awareness is retrieval-dependent — the agent only knows what it knows if it issues the right query.

---

## Honest Assessment: Strengths and Weaknesses

**Where Hipocampus excels:**

- **Zero operational overhead**: Markdown files require no maintenance, no running servers, and no dependency on external APIs. The system works offline, on any machine, indefinitely.
- **ROOT.md awareness**: The idea that an agent should have a constantly-loaded index of its own knowledge is genuinely novel and practically valuable. It solves the "query blindly" problem that plagues RAG-based systems.
- **Temporal drill-down**: The 5-level compaction tree enables a type of memory navigation that other systems do not provide. You can trace any current knowledge back to its origin in a raw session log.
- **Token economics**: The ~3K token constant cost per session is an order of magnitude better than loading full memory. For a developer paying per token, this changes the daily economics of running agents.
- **Human-readable**: Every piece of memory is a markdown file you can read, edit, and version-control with git. Memory is not trapped in a proprietary database.

**Where to be cautious:**

- **Early stage**: At the time of writing, Hipocampus is a recent project. Expect rough edges in the tooling, potential changes to the directory structure, and limited community ecosystem.
- **Manual discipline required**: Unlike Mem0 or hmem which handle structuring automatically, Hipocampus relies on the agent following a protocol for what to write and where. The quality of memory depends on the quality of protocol adherence.
- **No semantic search (by default)**: The hybrid search (BM25 + vector via `qmd`) is optional. Without it, querying cold storage is keyword-based. This is fine for most structured knowledge but less powerful for fuzzy or semantic queries.
- **Compaction quality depends on summarization**: The compaction tree is only as good as the LLM's ability to summarize accurately. Poor compaction summaries will pollute higher levels of the tree with imprecise or incomplete information.

---

## Where Hipocampus Fits in the Memory Ecosystem

Each memory system we have analyzed operates from a different philosophy about where intelligence should live:

- **PlugMem** assumes the intelligence lives in the structuring and retrieval algorithm (propositions + prescriptions).
- **hmem** assumes it lives in the decay scoring and lazy loading hierarchy.
- **Mem0** assumes it lives in the semantic embedding space.
- **Hipocampus** assumes it lives in the agent itself, guided by a well-organized structure and a constant-cost awareness signal.

This last approach is the most "indie" in spirit. It trusts the agent's reasoning capability rather than offloading intelligence to a database query or embedding similarity function. ROOT.md is essentially a hand-written table of contents that the agent updates and consults. The compaction tree is a journal that organizes itself over time.

For a developer who values transparency and control over their agent's memory, this philosophy is deeply appealing. You can open any file and understand exactly what your agent knows and why. There are no opaque embeddings, no proprietary storage formats, no server-side state that you cannot inspect.

---

## Practical Takeaway for Indie Developers

If you work with AI coding agents and have been frustrated by their amnesia, Hipocampus is the lowest-friction entry point into persistent memory. The `npx hipocampus init` setup is a single command, the files it creates are immediately human-readable, and the ROOT.md concept will reframe how you think about agent memory design regardless of whether you ultimately stick with this specific tool.

The key insight to take away even if you never use Hipocampus directly: **an agent that knows what it knows is fundamentally different from an agent that can be queried about what it knows**. ROOT.md at ~3K tokens is not a compromise; it is the right architectural choice for awareness that must be always present without eating the context budget.

For a developer working on a long-running project with AI agents, the economics are compelling. The difference between 3K tokens of constant awareness and 100K+ tokens of brute-force context loading is real money at current API pricing. And the temporal drill-down capability means no knowledge is ever truly lost — it is just compressed, navigably, through the compaction tree.

---

## References

1. **Hipocampus — GitHub Repository** — kevin-hs-sohn (2025). The Hipocampus memory harness implementing 3-tier Hot/Warm/Cold architecture with compaction tree and ROOT.md awareness.
   - [https://github.com/kevin-hs-sohn/hipocampus](https://github.com/kevin-hs-sohn/hipocampus)

2. **Hipocampus Technical Specification** — kevin-hs-sohn (2025). Detailed spec covering the compaction tree, ROOT.md protocol, and integration with Claude Code and OpenCode.
   - [https://github.com/kevin-hs-sohn/hipocampus/tree/main/spec](https://github.com/kevin-hs-sohn/hipocampus/tree/main/spec)

3. **"I built a persistent memory system for AI agents"** — Reddit r/SideProject (2025). Original community announcement of Hipocampus with discussion of the design rationale.
   - [https://www.reddit.com/r/SideProject/comments/1ryq2iq/i_built_a_persistent_memory_system_for_ai_agents/](https://www.reddit.com/r/SideProject/comments/1ryq2iq/i_built_a_persistent_memory_system_for_ai_agents/)

4. **The Architecture of Persistent AI Agent Memory** — ArceApps Blog (2026). Broad analysis of agentic memory frameworks including Mem0, Cognee, and OpenClaw.
   - [/blog/ai-agent-memory-persistence-guide](/blog/ai-agent-memory-persistence-guide)

5. **Agentic Memory: Security, Privacy, and the Future of the AI Second Brain** — ArceApps Blog (2026). Analysis of security and privacy risks in persistent agent memory systems.
   - [/blog/memory-security-privacy-agentic](/blog/memory-security-privacy-agentic)

6. **PlugMem: Microsoft Research's Task-Agnostic Memory Plugin** — ArceApps Blog (2026). Deep-dive into PlugMem's propositional and prescriptive knowledge graph architecture.
   - [/blog/plugmem-microsoft-agent-memory](/blog/plugmem-microsoft-agent-memory)

7. **hmem: Hierarchical SQLite Memory for AI Agents That Actually Persists** — ArceApps Blog (2026). Analysis of hmem's five-level lazy-loading hierarchy, Fibonacci decay, and SQLite + FTS5 backend.
   - [/blog/hmem-sqlite-hierarchical-memory-agents](/blog/hmem-sqlite-hierarchical-memory-agents)

8. **The PARA Method and File-Based AI Memory** — ArceApps Blog (2026). Exploration of the local file-based memory approach using Markdown and the PARA method.
   - [/blog/para-method-file-based-ai-memory](/blog/para-method-file-based-ai-memory)
