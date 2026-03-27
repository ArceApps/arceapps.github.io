---
title: "hmem: Hierarchical SQLite Memory for AI Agents That Actually Persists"
description: "A technical deep-dive into hmem (Humanlike Memory), an MCP server that models human memory in five lazy-loaded levels backed by SQLite + FTS5. How Fibonacci decay, logarithmic aging, and a curator agent solve the context window problem across sessions and machines."
pubDate: 2026-03-27
heroImage: "/images/blog-hmem-sqlite-memoria-jerarquica.svg"
tags: ["AI", "Memory", "Agents", "MCP", "SQLite", "FTS5", "Architecture", "Open Source"]
reference_id: "c7d4e2f1-8b3a-4c9e-a5f7-2d1e8c6b4a3f"
---

> This article joins the ongoing memory series on this blog. If you want the broad landscape first, start with [The Architecture of Persistent AI Agent Memory](/blog/ai-agent-memory-persistence-guide). For the security angle, read [Agentic Memory: Security, Privacy, and the Future of the AI Second Brain](/blog/memory-security-privacy-agentic). For Microsoft Research's task-agnostic approach, check out [PlugMem: Microsoft Research's Task-Agnostic Memory Plugin](/blog/plugmem-microsoft-agent-memory). This article covers hmem, an open-source MCP server that takes a different and very pragmatic approach: model human memory as a five-level lazy hierarchy backed by plain SQLite.

---

## The Same Problem, A Different Angle

The problem is always the same: AI agents are amnesiac by default. Every session starts from zero. Every machine is a blank slate. If you work across multiple IDEs, on different computers, or simply return to a project after a week, your agent has no idea what it did before.

The solutions we have discussed so far — PlugMem's knowledge graph, the PARA method's file hierarchy, Mem0's vector store — all solve this from different architectural angles. hmem (Humanlike Memory) approaches it from a deliberately human-inspired angle: model the five levels of detail that human memory uses, and let the agent decide how deep it needs to go at each moment.

It sounds obvious in retrospect. Humans do not replay full verbatim memories when making a decision. We start with a coarse summary ("I worked on authentication last week") and only drill down to specifics when the task actually requires it ("I remember I used bcrypt with a cost factor of 12"). hmem applies this same lazy-loading logic to agent context.

---

## What hmem Is

hmem is an MCP (Model Context Protocol) server built by Bumblebiber that provides persistent, hierarchical memory for AI agents. It stores its data in `.hmem` files (actually SQLite databases), making the memory portable: take the file with you, and your agent's memory follows.

The "Humanlike Memory" name is not marketing fluff. The design decisions throughout the system are explicitly modeled on cognitive science concepts: hierarchical recall, recency and frequency scoring, decay over time, and active curation.

The project is currently at v2.0+ with stable APIs, available under an open-source license, and works with every major AI coding tool: Claude Code, Gemini CLI, Cursor, Windsurf, and OpenCode.

**Installation is a single command:**

```bash
npx hmem-mcp init
```

That command sets up the MCP server and generates the skill files (slash commands) for your configured tools.

---

## The Five-Level Architecture

The core of hmem is its five-level lazy-loading hierarchy. Each level is progressively more detailed, and agents load only the levels they actually need.

### Level 1: Gross Summary (Always Loaded at Startup)

This is the lightest layer, always present in context from the first message. Think of it as the "what is this agent/project about" level: who the agent is, what its primary role is, and the broadest strokes of accumulated knowledge.

Loading only this level costs minimal tokens. For most conversational turns, it is enough. The agent knows where it is without needing to know everything it has ever done.

### Level 2: More Detail

When the task requires a bit more background, the agent loads Level 2. This adds categorized summaries and thematic clusters. Not individual facts, but groups of related knowledge that provide orientation without overwhelming the context.

### Level 3: Deep Context

Level 3 is where patterns, learned behaviors, and recurring relationships live. If the agent has discovered that you always prefer a certain code style, or that a particular library is off-limits in this project, that kind of contextual rule-of-thumb lives here.

### Level 4: Granular Specifics

This is where specific facts, decisions, and details accumulate. "The authentication module was refactored on March 15th to use JWTs instead of sessions." "The CI pipeline was failing because of a missing environment variable." The granular record of what actually happened.

### Level 5: Full Verbatim Detail

The deepest level. Raw, verbatim transcripts, complete code diffs, exact error messages. Loaded only when the task genuinely requires reconstructing exactly what was done, not just what happened at a high level.

The practical result of this hierarchy: in most sessions, the agent operates efficiently on Levels 1–3, and only drills into Level 4–5 when genuinely needed. This dramatically reduces token consumption compared to systems that inject all memory into every context window.

---

## The Search Engine Under the Hood: SQLite + FTS5

The backend for hmem is SQLite using the FTS5 (Full Text Search 5) extension. This is an interesting architectural choice compared to the vector-store approach that most memory systems default to.

**Why FTS5 instead of embeddings?**

Vector stores with embeddings are powerful for semantic similarity, but they have real costs:
- Embedding generation requires either API calls (money) or a local model (compute).
- Vector databases add operational complexity.
- Semantic similarity can return plausible but contextually wrong results.

FTS5 does something different: lexical full-text search with sophisticated ranking. The queries are exact (no "similar") but the ranking is nuanced (frequency, recency, relationships). For the kind of information agents store — code, commands, decisions, facts — this is often more precise than semantic search.

FTS5 also enables the specific ranking algorithms hmem uses, which we will cover next.

---

## Decay Algorithms: Fibonacci and Logarithmic Aging

Two decay mechanisms work together to keep memory useful without flooding the agent with stale information.

### Session Cache: Fibonacci Decay

Within a single session, hmem uses a Fibonacci decay function to suppress memories that have already been surfaced. The first time a memory entry is retrieved, it scores at full value. Subsequent retrievals within the same session are penalized according to the Fibonacci sequence — ensuring the agent surfaces fresh, relevant information rather than cycling through the same cached results repeatedly.

The Fibonacci choice is non-obvious and worth noting. The sequence grows fast enough to strongly suppress repeated entries but not so aggressively that a legitimately important memory becomes inaccessible if needed multiple times in a session.

### Cross-Session: Logarithmic Age Decay

For entries accessed across multiple sessions, hmem applies logarithmic decay by age. Memories become less prominently scored as they age, but they never fully disappear (logarithm never reaches zero). This mirrors how human long-term memory works: old experiences become less readily available but are not erased — they can be retrieved with explicit effort.

Together, these two mechanisms ensure that:
1. Within a session, variety is maintained (Fibonacci prevents repetition).
2. Across sessions, recency is rewarded (logarithmic aging promotes fresh knowledge).

---

## Organization Beyond Search: Bookmarks, Tags, and Hashtags

hmem adds a curation layer on top of the core search. Memory entries can be:

- **Bookmarked (Favorites)**: Mark specific entries as especially important. These receive a scoring boost in retrieval.
- **Pinned**: Force entries to always appear in context, regardless of relevance scoring.
- **Marked as Obsolete**: Signal that an entry is outdated without deleting it. Useful for tracking decisions that were changed and why.
- **Marked as Secret**: Entries that should not be surfaced in shared contexts (useful when an hmem file is shared across a team but some information is role-specific).
- **Hashtags**: Free-form thematic grouping, enabling recall by category (e.g., `#architecture`, `#performance`, `#todo`).

This is more organizational richness than most agent memory systems provide. The typical vector store gives you "retrieve similar things." hmem gives you a taxonomy of memory management that resembles a personal knowledge management system.

---

## The Curator Agent

One of the most interesting features of hmem is the curator agent concept. Memory systems accumulate noise: redundant entries, outdated facts, contradictions, low-value noise from routine conversations. Without maintenance, memory degrades.

The hmem curator is an agent whose job is maintaining memory health. It runs as a separate process (or on-demand) and performs:

- **Deduplication**: Merging entries that capture the same information redundantly.
- **Obsolescence marking**: Identifying entries that have been superseded by newer information.
- **Consolidation**: Combining multiple granular Level 4 entries into a coherent Level 3 pattern.
- **Tagging**: Improving the categorical organization of accumulated entries.

This concept — a dedicated curator maintaining memory quality — solves a real problem that most memory systems ignore: the long-term accumulation of garbage. It is analogous to how human memory performs consolidation during sleep: not just storing new experiences but reorganizing and pruning the existing store.

For an indie developer running agents over months on a project, this is the difference between memory that improves over time and memory that slowly becomes less useful.

---

## Environment Variables and Configuration

hmem uses three key environment variables to configure agent identity:

```bash
HMEM_PROJECT_DIR=/path/to/your/project/.hmem
HMEM_AGENT_ID=my-unique-agent-identifier
HMEM_AGENT_ROLE=developer  # or reviewer, tester, architect, etc.
```

The `HMEM_AGENT_ROLE` is used by the retrieval and curation systems to filter entries that are relevant to the agent's current role. A developer agent and an architect agent working on the same project can share an hmem file but retrieve different views of it.

### Slash Commands (Skill Files)

After running `npx hmem-mcp init`, hmem generates skill files for each configured tool. These become slash commands inside your IDE or CLI:

- `/hmem-read`: Load memory for the current context.
- `/hmem-write`: Explicitly save a fact or decision to memory.
- `/hmem-search`: Direct full-text search against the memory store.
- `/hmem-curate`: Trigger the curator agent to clean up memory.
- `/hmem-status`: Show current memory stats (entries, levels, decay scores).

The pattern is consistent with the [Agent Skills and dynamic context](/blog/ai-agent-skills-dynamic-context) approach we have explored on this blog. Memory operations become explicit commands the agent can invoke, rather than opaque automatic processes.

---

## Multi-Tool Compatibility

hmem runs as an MCP server, which means it integrates with any tool that speaks the Model Context Protocol. The supported list currently includes:

- **Claude Code** (Anthropic's CLI agent)
- **Gemini CLI** (Google's agent CLI)
- **Cursor** (AI-first code editor)
- **Windsurf** (Codeium's IDE)
- **OpenCode** (open-source coding agent)

Because the memory is stored in a portable `.hmem` SQLite file, you can switch tools mid-project without losing accumulated memory. Start a task in Cursor, continue it in Claude Code, and the agent picks up exactly where it left off. For someone who works across tools (and most developers do), this is genuinely useful.

---

## Honest Assessment: What hmem Does Well and Where It Falls Short

**Where hmem excels:**

- **Token efficiency**: The five-level lazy loading is the most thoughtful approach to token management I have seen in a memory system. It forces you to think about what granularity the current task actually needs.
- **Portability**: SQLite files are universally understood. You can inspect your memory with any SQLite browser, back it up with `cp`, and move it across machines without special tooling.
- **Pragmatic design**: The combination of FTS5 + decay algorithms is a well-reasoned alternative to the vector store default. It is simpler to operate, cheaper to run, and often more precise for structured knowledge.
- **Curation concept**: The curator agent addresses the long-term quality problem that most memory systems ignore.

**Where to be cautious:**

- **Young project**: With 9 stars on GitHub (at the time of writing), hmem is early-stage. The API may stabilize, but community support and ecosystem tooling are still limited.
- **FTS5 limits**: Full-text search with decay is powerful for factual memory, but it does not perform well for genuinely semantic queries. If your use case requires "find something conceptually similar even if no keywords match," you will miss vector search.
- **Curator maturity**: The curator agent is a compelling concept, but in a young project, automated memory curation can also introduce errors. Manual review of curation actions is prudent until you have confidence in its behavior.
- **Documentation**: Like many early open-source projects, the documentation is functional but sparse. Expect to read the source code to understand edge cases.

---

## Where hmem Fits in the Memory Ecosystem

After covering PlugMem, PARA, Mem0, and now hmem, the memory landscape for AI agents is beginning to look like a proper ecosystem rather than a collection of ad-hoc solutions.

Each system has a distinct philosophy:

| System | Philosophy | Backend | Best for |
|--------|-----------|---------|---------|
| PlugMem | Propositional + prescriptive knowledge graph | Custom | Research; multi-agent knowledge sharing |
| Mem0 | Semantic vector retrieval | Vector DB | Apps requiring semantic similarity |
| PARA method | File-based hierarchy | Markdown | Developer workflows, human-readable |
| **hmem** | **Hierarchical lazy-loading, FTS + decay** | **SQLite** | **Multi-tool agent workflows, token efficiency** |

hmem occupies a useful niche: it is more structured than raw file-based approaches, simpler to operate than vector stores, and more portable than framework-specific solutions.

---

## Practical Takeaway for Indie Developers

If you work with AI coding agents across multiple tools or machines, hmem is worth experimenting with. The `npx hmem-mcp init` setup is low-friction, the SQLite backend imposes zero operational overhead, and the five-level architecture will make you think more carefully about how much memory context your agent actually needs at each step.

The key insight hmem encodes — that not all memory needs to be fully loaded all the time — is applicable beyond hmem itself. Whether you adopt this specific tool or not, designing memory around lazy granularity levels is a pattern worth internalizing.

For a project at 9 GitHub stars, hmem is surprisingly thoughtful in its design. It is worth watching, worth experimenting with on non-critical agent workflows, and worth following as the project matures.

---

## References

1. **hmem — GitHub Repository** — Bumblebiber (2025). The hmem MCP server implementing hierarchical humanlike memory with SQLite + FTS5.
   - [https://github.com/Bumblebiber/hmem](https://github.com/Bumblebiber/hmem)

2. **r/vibecoding — "My agent knows exactly what it did a week ago"** — Reddit (2025). Original community discussion introducing hmem and the motivation behind its design.
   - [https://www.reddit.com/r/vibecoding/comments/1rjlki3/my_agent_knows_exactly_what_it_did_a_week_ago/](https://www.reddit.com/r/vibecoding/comments/1rjlki3/my_agent_knows_exactly_what_it_did_a_week_ago/)

3. **The Architecture of Persistent AI Agent Memory** — ArceApps Blog (2026). Broad analysis of agentic memory frameworks including Mem0, Cognee, and OpenClaw.
   - [/blog/ai-agent-memory-persistence-guide](/blog/ai-agent-memory-persistence-guide)

4. **Agentic Memory: Security, Privacy, and the Future of the AI Second Brain** — ArceApps Blog (2026). Analysis of security and privacy risks in persistent agent memory.
   - [/blog/memory-security-privacy-agentic](/blog/memory-security-privacy-agentic)

5. **PlugMem: Microsoft Research's Task-Agnostic Memory Plugin** — ArceApps Blog (2026). Deep-dive into PlugMem's propositional and prescriptive knowledge graph architecture.
   - [/blog/plugmem-microsoft-agent-memory](/blog/plugmem-microsoft-agent-memory)

6. **The PARA Method and File-Based AI Memory** — ArceApps Blog (2026). Exploration of the local file-based memory approach using Markdown and the PARA method.
   - [/blog/para-method-file-based-ai-memory](/blog/para-method-file-based-ai-memory)

7. **Agent Skills and Dynamic Context** — ArceApps Blog (2026). How to use skill files and slash commands to give agents structured, on-demand context.
   - [/blog/ai-agent-skills-dynamic-context](/blog/ai-agent-skills-dynamic-context)
