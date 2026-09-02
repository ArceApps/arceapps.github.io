---
title: "RTK vs Caveman: real token savings in AI agents"
description: "RTK and Caveman promise 60-90% token cuts in agents. I measure both with real data: JetBrains' 8.5% finding, a 614M-token replay and the output-vs-prose gap."
pubDate: 2026-07-15
lastmod: 2026-07-15
author: ArceApps
keywords:
  - "RTK"
  - "Caveman"
  - "AI Agents"
  - "Token Savings"
  - "CLI Proxy"
  - "Prompt Caching"
  - "Cost Optimization"
canonical: "https://arceapps.com/blog/rtk-vs-caveman-token-savings/"
heroImage: "/images/rtk-vs-caveman-token-savings/en/cover.png"
tags: ["RTK", "Caveman", "AI Agents", "Tokens", "Cost Optimization", "Claude Code", "CLI", "Indie Dev"]
category: ai-agents
reference_id: "795ac6e1-8883-4831-874e-d1e35d3d4e1c"
---

> **Related reading on the blog:** Two weeks ago I shared the [full token-savings playbook](/blog/ai-token-savings-strategies/) (prompt caching, model routing, LLMLingua) and months ago I analyzed [Caveman](/blog/caveman-skill-token-compression) and [Headroom](/blog/headroom-compression-layer) separately. This article is the next step: not the optimistic version. It's what happens when you put the two viral tools of summer 2026 against each other, with data on the table.

![Article cover RTK vs Caveman — two philosophies, two numbers, two futures for your token bill](/images/rtk-vs-caveman-token-savings/en/cover.png)

## The bill that was already fine, and the one that bit me again

I have a recurring problem with my agents: I ask for something, they give me more than I asked for. An email validator turns into a 27-line class wrapped in six paragraphs of courtesy. A regression test turns into a narrative that justifies every line of the framework I already take for granted. And all of that goes on my credit card, at home, with no one asking my permission.

A while back I sat down and did the math. That math became the playbook article: prompt caching at 88%, model routing at 60-95%, LLMLingua at 73%, combined pipeline at 95-99%. I published it optimistic. So optimistic that, reread a month later, it sounds like the typical "10 tricks to save on your bill" stuff that circulates on LinkedIn. And here I am to amend it a little.

Not to dismantle it, mind you. The playbook figures are still true in their context: each technique delivers what it promises. The trouble is that, in those July days, I stumbled onto two projects that have gone viral with bolder claims. One is called **RTK (Rust Token Killer)**. The other, you already know if you read this blog, is called **Caveman**. Each promises 60-90% cuts. Each has tens of thousands of stars. And each has decided to spend its marketing credibility on a metric which, looked at carefully, measures something different from what you think you're reading.

This article is an **honest contrast, with data**. Not a review. Not a partisan take. It's the answer to a concrete question: *"How much am I going to save, tomorrow, if I install RTK and/or Caveman in my setup?"*. The short answer: it depends. The long answer is what follows.

> **Honesty note:** every figure in this article is verified at its primary source as of July 2026. RTK (71.2k stars when I'm writing this) and Caveman (89.8k stars) are live projects: numbers move every week. What doesn't move is the mechanics, the published benchmarks and the criticism I quote. When I doubt, I say so.

## Why token savings matter in 2026

Token cost has dropped since 2024. GPT-4o at $5 per million output tokens was a standard; now frontier models run $15-75 per million, but mini and nano run $0.15-$1.50. That's a 10x improvement in some cases. Problem: the **number of tokens consumed per session has multiplied faster than prices have dropped**. Modern agents (Claude Code, Codex CLI, Cursor Agent, Aider, opencode, Cline, Windsurf, Hermes) are no longer chats. They're multi-step loops. Each turn re-sends the accumulated context to the model, and that gets billed on every call.

A few figures worth keeping in mind before continuing:

- **Per-turn cost grows triangularly, not linearly.** In an agent with N turns, the total cost approaches N·(N+1)/2, because each turn re-pays every previous token. Waxell.ai documents that teams modeling cost as "turns × average cost" underestimate real cost by 3x to 5x.
- **The system prompt is always re-sent.** A 4,000-token system prompt on a 20-turn agent eats 80,000 tokens just in structural overhead. That's, per Waxell, around 16% of the bill on a 500k-token workflow, not counting reasoning.
- **Agentic output is not prose: it's code, diffs, tool calls and logs.** JetBrains measured this in their A/B benchmark on SkillsBench running Claude Code: only the "narration between tool calls" is compressible. The bulk of the output is preserved by technical necessity.
- **"Lost in the middle" punishes long context.** Liu et al. and the Chroma technical report (July 2025, 18 models) show that attention decays non-linearly: beyond 10k-50k tokens some models degrade "catastrophically", not gradually. Mem0 measured on LoCoMo 2026 that moving to a hierarchical memory architecture went from 72.9% to 91.6% accuracy, with 4x fewer tokens.

Bottom line: putting less noise in the context window is not aesthetics, it's margin to reason better, spend less, and not degrade quality. That's why in 2026 so many tools have appeared promising 60-90% cuts. The question is which ones deliver what they promise and which ones live off marketing.

## The two philosophies: compress the output vs. shorten the prose

Before getting into RTK and Caveman, you need the frame. In an agentic loop, the tokens that pay the bill distribute, broadly speaking, like this:

| Token origin | Approximate weight in an agentic session | Compression candidate? |
|---|---|---|
| Tool output (`cargo test`, `git status`, `ls`, `grep`, logs, API JSON) | 40-60% of total tokens consumed | **Yes, lots of room.** |
| Code, diffs and tool calls the model writes | 20-30% | **Little or none:** altering this alters the work. |
| System prompt + memory + persisted context | 10-15% | **Medium room.** |
| Narration / prose between tool calls | 5-15% | **Yes, but the ceiling is low.** |

This table is the key piece of the article. Re-read it. **The tokens that dominate an agent's bill are the ones coming from the tools, not the prose the model writes around them**. And here is where RTK and Caveman diverge:

- **RTK** attacks row 1: tool output. It filters, groups, truncates, deduplicates the noise from `git status`, `cargo test`, `pytest`, `ls`, `grep`... before it reaches the model.
- **Caveman** attacks row 4: prose. It tells the model to write like a caveman ("Auth middleware bug. Session tokens expire early. Fix: check expiry logic." instead of a paragraph). It's a system prompt hack.

The conceptual difference is huge. One compresses the bulk of the tokens. The other compresses a small fraction, and on top of that, not the most expensive one.

![Comparative infographic RTK vs Caveman — where each one points in the agentic flow, what techniques they use, and what they advertise vs. what they actually measure](/images/rtk-vs-caveman-token-savings/en/infographic-comparison.png)

## RTK (Rust Token Killer): the tool that's on the right track

### What it is and how it works

**RTK** is a CLI proxy written in Rust (single binary, no dependencies, <10ms of overhead per command) that sits between your shell and your AI agent. When your agent runs `git status`, RTK rewrites it internally to `rtk git status`, runs the command, receives the raw output, compresses it, and returns to the model a drastically shorter version with the same signal.

Its creator documents having measured **89% average noise reduction** across more than 2,900 real commands accumulated in their own use (10.3M tokens saved over 11.6M of input, per the README). The official site ([rtk-ai.app](https://www.rtk-ai.app/)) speaks of "3x longer sessions" and aggregated savings around 60-90% per command. The aggregated benchmarks the project shows, on medium TypeScript/Rust projects, are these:

- `cargo test`: -91.8%
- `pytest` / `jest` / `vitest`: -90%
- `go test`: -90%
- `git status`: -80.8%
- `git diff`: -75%
- `git log`: -80%
- `git add` / `commit` / `push`: -92%
- `find`: -78.3%
- `grep` / `rg`: -49.5%
- `ls` / `tree`: -80%
- `cat` / `read`: -70%
- `docker ps`: -80%
- `ruff check`: -80%

On a typical 30-minute session on a medium TypeScript/Rust project, the README estimates 118,000 tokens of tool output dropping to 23,900. Aggregated reduction of ~80%. Important: these numbers are **RTK against raw output**, not against your total bill. Distinguishing that is what hurts later with Caveman.

### The four strategies it applies

What RTK does isn't magic, it's four well-known log processing techniques, applied with a per-command specific parser:

1. **Smart filtering.** Removes comments, blank lines, boilerplate code, progress lines, ANSI color codes, repeated prefixes. What doesn't affect the model's judgment goes away.
2. **Grouping.** Groups similar items. Files by directory, errors by type, linter warnings by rule. Reduces the visual noise the model has to parse.
3. **Truncation with context.** Keeps the first and last lines (where the bulk of the signal is) and cuts the middle when there's redundancy. A test that fails 200 times in a row deserves "200 identical failures in test_login.py line 42" instead of 200 lines.
4. **Deduplication.** Collapses repeated lines with a counter. 47 identical lines → `... 47 identical lines ...`.

The result, in the README's own words: *"The agent receives compact output without needing to call `rtk` explicitly."* The hook makes it transparent.

### Integration: one install, fourteen agents

RTK supports fourteen agents: Claude Code, Cursor, Aider, Gemini CLI, OpenAI Codex, Cline, Roo Code, Kilo Code, Windsurf, GitHub Copilot, Pi, Hermes, Antigravity and Kilocode. The install is one line:

```bash
brew install rtk
# or
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
# or
cargo install --git https://github.com/rtk-ai/rtk
```

And the hook activates with one of these:

```bash
rtk init -g                 # Claude Code / Copilot (default)
rtk init -g --gemini        # Gemini CLI
rtk init -g --codex         # Codex (OpenAI)
rtk init -g --agent cursor  # Cursor
rtk init --agent cline
rtk init --agent kilocode
rtk init -g --agent hermes  # Hermes
```

The hook rewrites Bash commands before execution, so adoption is 100% without you changing a single workflow.

### Telemetry: `rtk gain` and `rtk discover`

Another important piece that few mention: RTK doesn't ask you to trust it. It includes its own analytics command:

```bash
rtk gain              # summary of saved tokens
rtk gain --graph      # ASCII graph for the last 30 days
rtk gain --history    # recent history
rtk gain --daily      # daily breakdown
rtk gain --all --format json   # export for dashboards
rtk discover          # missed savings opportunities
rtk session           # RTK adoption in recent sessions
```

This is relevant for two reasons. First, **you can verify the saving without trusting the README**. Second, it's one of the few tools in this space that ships a built-in audit mechanism. When someone promises you "60-90% savings", being able to run a command and see the exact number in your own workload is the difference between a mature project and a marketing benchmark.

### Why it's on the right track

RTK gets the important things right:

- **It attacks where the tokens are.** Tool output is, per the table above, the dominant component of the agentic bill. RTK operates exactly there.
- **It's deterministic.** Compressing logs isn't a model decision: it's regex + heuristics + fallback to raw output if the heuristic fails. You don't introduce variability in the agent's behavior.
- **It's transparent.** The hook rewrites before execution. The agent doesn't have to learn to call RTK: the CLI itself does it.
- **It's auditable.** `rtk gain` tells you exactly how much you saved and on which commands. You can optimize your workflow by looking at the data.
- **It's compatible with everything.** Supports 14 agents, 100+ commands, macOS, Linux, Windows, WSL. Adoption cost is ~5 minutes.
- **It doesn't touch reasoning.** Doesn't change the system prompt, doesn't ask the model to write differently, doesn't introduce a weird mode. The agent's "brain" stays the same. The saving comes from not paying 1,000 tokens of filler for 100 that are worth it.
- **Low overhead.** <10ms per command per published benchmarks. Imperceptible in practice.
- **OSS and portable.** Apache 2.0, Rust binary, no mandatory telemetry, no accounts. 71.2k stars on GitHub when I write this, growing.

And the most important thing: **when behavior needs to change, there are real levers**. If a new `cargo test` version changes its format, the parser gets updated; the system degrades to raw output fallback if the parser fails. That's conventional software engineering, not a magic trick.

### The honest criticism you should also read

RTK isn't perfect. It has real limitations worth mentioning, so I'm not selling smoke:

- **Cache invalidation.** Bent Collins (AI Code Watch) measured in their benchmark suite that, when adding RTK, total consumption sometimes **went up** rather than down, precisely because rewriting output can invalidate the prompt cache. In aggressive prompt caching architectures (like what we covered in the [savings playbook](/blog/ai-token-savings-strategies/), prompt caching delivers up to 88% on repetitive calls), you have to measure. JetBrains also points out that a single trial with a task crossing the long-context pricing threshold can erase months of savings (in their benchmark, one task cost $8.29 vs. $0.33 by crossing the 200k tier).
- **Fragility against format changes.** Parsers are tied to textual tool output. If `git`, `cargo`, `npm` or `grep` change their format in a release, the filter can break. The mitigation (raw output fallback) is well-designed, but it's there.
- **What the README says vs. what your repo gives you.** README numbers are estimates on medium TypeScript/Rust projects. Very large projects (VS Code, ~10k files) or very small ones (a script) are not the same workload. Pachaar reported 73% fewer tokens and 72% fewer tool calls on VS Code; on a small project you might see smaller or even neutral savings.
- **It doesn't compress everything.** Unsupported commands pass through raw. The coverage (100+ commands) is wide, but not universal.
- **Hook vs. plugin.** The hook rewrites Bash commands, but Claude Code's native tools (Read, Grep, Glob) **don't pass through the Bash hook**. If your agent uses its native tools for those operations, RTK doesn't intercept them. That's a nuance the README itself clarifies and many users miss.

Even so, RTK is the best open source tool in its category in 2026. Having room for improvement doesn't take its spot away; it takes the arrogance off the benchmark.

## Caveman: the trendy skill that doesn't solve the real problem

### What it is and why it went viral

I already covered Caveman in depth weeks ago ([full article here](/blog/caveman-skill-token-compression/)). Today I'll squeeze it into one section, but you need to understand this before continuing: **Caveman was already on this blog, I analyzed it separately, and the conclusion was lukewarm but decent**. What changed in July 2026 is that we have third-party data that nuances what we only intuited then.

**Caveman** ([github.com/JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)) is a skill/plugin for Claude Code, Codex, Gemini, Cursor, Windsurf, Cline, GitHub Copilot and "30+ more" that tells the agent to speak "like a caveman". Literally: instead of "I've analyzed the code and identified a potential issue with the authentication middleware that could cause session tokens to expire prematurely", the agent writes "auth middleware bug. session tokens expire early. fix: check expiry logic".

The repo slogan is memorable and very well marketed:

> *Why use many token when few do trick.*

The repo claims **an average 65% reduction in output tokens** (range 22-87%) on 10 prompts measured against Claude's real API. The mechanism is instructive: a system prompt hack that removes articles (a, an, the), filler (just, really, actually, simply), pleasantries (sure, certainly, happy to), hedges (might be worth considering), and forces short synonyms. Four intensity levels: lite, full (default), ultra, and 文言 (classical Chinese). It also ships sub-skills like `caveman-commit`, `caveman-review` and `caveman-compress` (which rewrites `CLAUDE.md` in caveman-speak to reduce input tokens).

When it came out, it went viral: **89,826 GitHub stars** when I'm writing this, memes, Reddit threads, YouTube videos, articles on developer blogs. The framing was irresistible: a solution simple enough to fit in a system prompt, fun, with a big number (65%) and a catchy name.

### The benchmark nobody wanted to read: JetBrains, 86 paired tasks

In July 2026, JetBrains published an A/B benchmark with 86 real SkillsBench tasks running on Claude Code. The method was rigorous:

- **Paired:** each task was run twice, once with Caveman forced on every reply and once without.
- **Auto-grading:** each task graded by its own tests on a 0-1 scale.
- **Forced activation:** Caveman is user-activated, but JetBrains forced it always on. Important: the number they measured is the **absolute ceiling**, not the typical case. In real use, where the agent decides when to activate the mode, saving is equal or worse.
- **Honest sample size.** They started with 10 tasks and saw 29.5% saving. When they scaled to 86, saving fell to 8.5%. Their own takeaway: *"Never trust a k=1 eval"*.

The results:

| Metric | Result |
|---|---|
| **Output token saving (with Caveman forced)** | **~8.5%** |
| **Cost saving (estimate)** | **~10%** (canceled out by trial-to-trial variance) |
| **Quality degradation** | Undetectable: 8 tasks better, 10 worse, 64 tied; mean score gap 0.015 on 0-1 scale, p=0.82 |
| **Aggregated total cost** | The Caveman arm came out **11.6% more expensive in absolute terms** ($40.60 vs. $36.39), because one dependency-audit trial crossed the long-context tier and billed $8.29 vs. $0.33. |

The JetBrains team summarizes clearly:

> *The advertised 65% belongs to chat-style Q&A, not to coding agents. The bulk of token consumption in agentic coding workflows comes from reading project files, reasoning through tasks, invoking tools and generating code, limiting the overall savings from trimming conversational language alone.*

In plain English: the 65% applies to chat-style conversational Q&A, where prose is almost all the output. In an agent, prose is the minority. The majority is tool calls, code, diffs and logs, which Caveman deliberately leaves alone.

### The 614 million token replay: the demolition number

If the JetBrains benchmark was already uncomfortable, codepointer's independent replay (Substack, June 2026) is demolition. Replay over **614 million tokens of their own real Claude Code sessions, equivalent to $926 of spend**, with all three most popular tools (RTK, Headroom and Caveman) installed at once:

| Tool | Advertised saving | Real saving (replay) |
|---|---|---|
| Headroom | 60-95% | 2.8% of spend |
| **RTK** | 60-90% per recognized command | **0.5% of spend** |
| **Caveman** | "halves prose" | **0.4% of spend** |
| **All three combined** | — | **3.7%** of spend |

The author's key observation: *"The advertised numbers are not exaggerated. Each measures a different thing on a different workload, and three layers separate a fewer-tokens claim from a lower bill."* In other words, the marketing percentages aren't false in the strict sense, but **they measure different things from what the average developer understands by "saving"**. When a repo says "65% saving on output tokens", it's not telling you "your bill drops 65%". It's telling you "the subset of tokens that is compressible prose drops 65%". That subset turns out to be a small subset of the total you pay.

And here's the nuance almost nobody tells you: in an agent, the model **rereads the full context every turn**. If you reduce the output of turn N, turns N+1…N+k inherit the reduced context, yes, but you also pay input again. The marginal saving in output gets diluted in the accumulated input. That's why 8.5% in output becomes ~10% of cost, and why three combined tools in a real session only save 3.7% of total spend.

### The viral pattern: "system prompt hack" + big number

Caveman isn't unique. It's a recurring pattern: someone publishes a repo with a well-written prompt, a big number (65%, 75%, "halves tokens"), a catchy slogan, and a README full of visual before/after comparisons. It goes viral because:

- The promise is simple to explain in a tweet.
- The before/after is photogenic: 69 tokens vs. 19 tokens.
- The install is trivial: one line, copy-paste into system prompt.
- The big number is irresistible to share.

The problem is that **it measures the favorable segment of the metric**. Caveman measures output tokens, not total cost. RTK measures tool output tokens, not total cost. Headroom measures something else. And the three mix units. When you measure the same thing in the same session (which codepointer did), the combined saving is 3.7%. And even so, you have to factor in the cache invalidation nuance: compression tools can invalidate the prompt cache, which is a silent cost multiplier.

This doesn't make Caveman a scam. Its README is explicit about what it measures and what it doesn't. **The problem is the distance between what a developer reads ("65% fewer tokens") and what that means in their real agentic session (8.5% less output, ~10% less cost, with variance that can null it out)**.

### What Caveman does get right (for fairness)

In all honesty, Caveman isn't useless. It has legitimate uses:

- **Reduces prose in purely conversational responses.** If your main use is Claude in chat (not agentic), the 65% is closer to reality.
- **Makes the model faster for the human reader.** Responses are shorter, more direct, less filler. That's nice to read.
- **Doesn't degrade quality** (p=0.82 in JetBrains' benchmark). It's safe to turn on.
- **It's fun.** The slogan is catchy, the style is memorable, and using it produces answers that are a pleasure to read. Not a bug, a social feature.
- **`caveman-compress` rewrites `CLAUDE.md` with 46% fewer input tokens.** That has value: compressing the agent's persisted memory translates into cheaper input every turn. It's the only piece of Caveman that attacks row 3 of our table (system prompt + memory), and probably the most useful.

The problem isn't Caveman. The problem is presenting it as "the solution to agent token cost". It isn't.

## The comparison with data: what independent evidence says

Let's put it all in a table and look it in the face. The gap between marketing and reality shows in five lines.

### RTK vs. Caveman: same task, different approach

| Dimension | RTK | Caveman |
|---|---|---|
| **What it compresses** | CLI tool output | Model prose |
| **How it compresses** | Deterministic parsers (regex + heuristics + fallback) | System prompt hack + style change |
| **Advertised saving (best case)** | 80-90% per command, 89% aggregated | 65% in output, 75-80% in ultra |
| **Measured saving in real agentic** | 35% per session (Pachaar) up to 73% in large repos | **8.5% output, ~10% cost** (JetBrains, 86 tasks) |
| **In realistic replay ($926, 614M tokens)** | 0.5% of spend | 0.4% of spend |
| **Saving in conversational chat** | N/A (doesn't apply) | ~65% (their benchmark) |
| **Quality degradation** | None (doesn't change model behavior) | Undetectable (p=0.82, JetBrains) |
| **Cache invalidation** | Low risk, only changes tool output | Low risk, only changes style |
| **Coverage** | 100+ commands, 14 agents | 30+ agents (any with system prompt) |
| **Auditable** | Yes (`rtk gain`) | No |
| **Adoption cost** | 1 line + 1 hook (~5 min) | Paste system prompt or install skill |
| **Fragility risk** | Medium: parsers tied to tool formats | Low: it's a prompt, not a parser |
| **Business model** | OSS Apache 2.0 | OSS MIT |
| **GitHub stars (Jul 2026)** | 71.2k | 89.8k |

![Benchmark table JetBrains + codepointer — real figures to the right of advertised claims on the left. 8.5% is not 65%](/images/rtk-vs-caveman-token-savings/en/benchmark-chart.png)

### What a developer should expect, honestly

If you install RTK tomorrow on a medium project (TypeScript or Rust, ~20-50k LOC, tests running, active git), on a normal workday you'll see:

- Between **35% and 80% fewer tool output tokens** in your session, depending on how much you use tests and git. The `rtk gain --daily` command confirms it.
- **Sessions 1.5x to 3x longer before hitting the context limit or rate cap** (the README cites "3x longer sessions").
- **API cost 30% to 70% lower** in that session, assuming you don't cross the long-context tier (where cache invalidation can eat the saving, as JetBrains demonstrated with an $8.29 vs. $0.33 case).

If you activate Caveman in the same session, you'll see:

- **~8.5% fewer output tokens in agentic** (ceiling, with forced activation; in normal use, less).
- **~10% expected cost reduction** (ceiling), with variance that can turn it neutral or slightly negative in individual trials.
- **0.4-2.8% real spend saving in real sessions**, per codepointer's replay.

If you combine all three tools (RTK + Headroom + Caveman) in an aggressive setup:

- **3.7% combined spend saving**, per the same replay. Not a typo: three projects with 60-90% advertised saving, combined, save 3.7% in a real session. You have to read this twice to believe it.

### Why the gap between marketing and reality

Three technical reasons worth understanding:

1. **Input dominates in long sessions.** An agent re-sends the full context every turn. If you reduce the output of turn N, you reduce marginally the input of turns N+1…N+k, but accumulated input is still the bulk of the bill. This is what Waxell calls "context cost growth ~ n(n+1)/2": cost grows triangularly with turns.
2. **Agentic output is not mostly prose.** JetBrains measured it directly: code, tool calls and logs are the majority. Only the narration between tool calls is compressible, and there isn't much of it.
3. **The prompt cache is a silent multiplier.** If your agent uses prompt caching (Anthropic, OpenAI, Google all offer it), most of the input gets billed at cache price (10% of input price at Anthropic, 5-hour TTL). Any tool that invalidates the cache can wipe out a month of savings in a day. That's why, before installing a "free" tool that rewrites context, you have to look at the cache hit rate.

## My recommendation (with data, not faith)

If I had to choose what to install tomorrow, the order would be:

1. **Install RTK.** It's the only thing in this space that attacks the bulk of the tokens, it's verifiable (`rtk gain`), it's mature open source, supports your agent and installs in 5 minutes. The worst face of the coin is "modest saving" on small projects, and that's already better than status quo.
2. **Measure with `rtk gain --graph` for a week.** Don't trust either this article or the README. Look at your own numbers.
3. **Mind the prompt cache.** If your agent uses caching and you notice sessions with RTK on are more expensive, cache invalidation is the culprit. Turn it off on projects where the saving doesn't pay off, or measure with and without caching before generalizing.
4. **Caveman: use it if it amuses you, not to save.** If you want shorter, more direct answers in Claude chat, `npx skills add JuliusBrussee/caveman` and go. If you want to lower your agent's bill, it isn't the tool. **JetBrains' 8.5% doesn't repay the mental energy of maintaining a caveman-style prompt in production.**
5. **`caveman-compress` does pay off.** It's the only piece of Caveman that compresses input tokens (row 3 of the table: system prompt + memory). If you have a long `CLAUDE.md`, rewriting it in caveman-speak is one of the few input optimizations that doesn't require changing models.
6. **Don't combine tools "just in case".** Each compression layer adds a place where you can invalidate the cache or introduce a bug. RTK already covers row 1. Adding Headroom or Caveman on top gives 1-3% additional in the best case and cache invalidation risk in the worst. Measure before stacking.
7. **Invest in what actually moves the needle.** If your agent is expensive, the real saving comes from: memory architecture (Mem0 documents 4x fewer tokens and +18.7pp accuracy with hierarchical memory), RAG with good chunking, summarization at 70% of the window, and per-task model selection. Compression tools are the icing, not the cake.

## What this small war of tools teaches us

RTK and Caveman are two answers to the same question: how do I pay less for tokens? They represent two philosophies:

- **RTK** says: "The problem is in tool output. Let's do serious software engineering on it: parsers, heuristics, fallback, telemetry. If it works, it's verifiable."
- **Caveman** says: "The problem is in model prose. Let's change how it talks. It's free, it's fun, and the number is big."

RTK is on the right track because **it attacks the cause, not the symptom**. The cause of cost in agents is tool noise in the context window. The symptom is verbose model prose. Treating the symptom is making yourself feel like you're doing something. Treating the cause is actually doing it.

Caveman is a fad because **it fits GitHub's hype cycle**: simple idea, catchy prompt, big number, viral on Twitter, memes, trivial install. It's, at best, a fun curiosity. At worst, a distraction that makes you believe you're optimizing when 91.5% of agentic output passes through your context window untouched.

And JetBrains' benchmark, with 86 paired tasks and p=0.82, says it without mercy: **Caveman's 65% is only real where it doesn't matter (conversational chat), and 8.5% where it does (agentic)**. The exact inverse of what an average developer would assume reading the README.

In 2026, the discipline of measuring (with `rtk gain`, with your own benchmark, with Anthropic or OpenAI logs) is worth more than any viral skill. And that, paradoxically, is what makes RTK great: it doesn't ask you to trust it.

---

## Appendix: sources and data

All data in this article is verified at the following sources (consulted July 15, 2026):

- **RTK — repo and benchmarks**: [github.com/rtk-ai/rtk](https://github.com/rtk-ai/rtk), [rtk-ai.app](https://www.rtk-ai.app/)
- **Caveman — repo**: [github.com/JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- **JetBrains — Caveman benchmark (8.5% real)**: ["Does Speaking to Agents Like Cavemen Really Save 65% of Tokens?" — blog.jetbrains.com/ai, July 6, 2026](https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/)
- **InfoWorld — coverage of JetBrains' benchmark**: ["'Talk like a caveman' prompts save tokens, but far less than promised"](https://www.infoworld.com/article/4193775/talk-like-a-caveman-prompts-save-tokens-but-far-less-than-promised.html)
- **Codepointer — 614M tokens replay**: ["Cutting LLM Token Costs with rtk, headroom, and caveman"](https://codepointer.substack.com/p/cutting-llm-token-costs-with-rtk)
- **Bent Collins / AI Code Watch — criticism of RTK and Headroom**: LinkedIn post on cache invalidation
- **Waxell — real cost of the context window**: ["AI Agent Context Window Cost: Why Bills Multiply"](https://waxell.ai/blog/ai-agent-context-window-cost)
- **Mem0 — LoCoMo benchmark 2026 (memory vs. context)**: [mem0.ai/blog/context-window-is-ram-not-storage](https://mem0.ai/blog/context-window-is-ram-not-storage-why-most-agent-failures-happen-how-to-fix-them-in-2026)
- **Chroma — context rot 18 models (July 2025)**: cited in ["The Context Window Trap"](https://www.rockcybermusings.com/p/the-context-window-trap-why-1m-tokens)
- **Reddit — user experience with RTK (10M tokens saved)**: [reddit.com/r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1r2tt7q/i_saved_10m_tokens_89_on_my_claude_code_sessions/)
- **Pachaar — RTK on large repos (73% saving on VS Code)**: LinkedIn post by Akshay Pachaar
- **YouTube — combined RTK + caveman benchmark (38%)**: ["Cut your LLM token bill in half with these 2 simple tricks"](https://www.youtube.com/watch?v=R1na--yxl1s)

> **A note on figures:** RTK benchmarks in its README are estimates on medium TypeScript/Rust projects; exact numbers in your session may vary. The definitive metric in any case is `rtk gain` running on your own workload. JetBrains' benchmark (8.5% Caveman) uses 86 paired tasks on SkillsBench running Claude Code with the skill forced; in real use, the saving is equal or lower. Codepointer's replay covers 614M tokens and $926 of spend on real sessions. GitHub stars consulted July 15, 2026: RTK 71,209, Caveman 89,826.
