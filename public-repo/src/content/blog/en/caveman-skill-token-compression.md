---
title: "Caveman: The Skill That Teaches AI Agents to Shut Up"
description: "Caveman teaches AI agents to talk like cavemen. Julius Brussee's viral skill claims 75% fewer tokens — real Reddit measurements and the brutal verdict."
pubDate: 2026-06-20
lastmod: 2026-06-20
author: ArceApps
keywords:
  - "Caveman"
  - "AI Agents"
  - "Tokens"
  - "Skill"
  - "Compression"
  - "Claude Code"
canonical: "https://arceapps.com/blog/caveman-skill-token-compression/"
heroImage: "/images/caveman-skill-token-compression.svg"
tags: ["AI Agents", "Skills", "Tokens", "Caveman", "Claude Code", "Compression", "Indie"]
category: ai-agents
reference_id: "f9e0f666-5787-498c-8c04-c1f9531b88d5"
---


> **Related reads on the blog:** [Ponytail: The Viral Skill That Teaches Your Agents to Be Lazy Seniors](/blog/ponytail-lazy-senior-dev-skill) · [Matt Pocock Skills: The Swiss Army Knife of Small Skills](/blog/mattpocock-skills) · [AI Agents Coding: From Copilot to Autonomous Agents](/blog/coding-with-ai-agents) · [Effective Context for AI: Prompt Engineering](/blog/effective-context-ai)

## "Brain still big. Mouth small."

In late 2025 someone posted a thread on r/LocalLLaMA titled *"Make your AI talk like a caveman and decrease token usage"*. It pulled 651 upvotes and 142 comments in a week. The premise was so absurd it read as a meme: strip the LLM of articles, connectors, filler words and pleasantries. Teach it to speak like a caveman. Watch each response carry the same technical substance in way fewer tokens.

The instinct was right. LLMs are absurdly good at filling in predictable grammar. Hand them the context and the intent, and they'll reconstruct "the", "a", "therefore" and "I'd be happy to help" without blinking. Removing that load doesn't lose information — it loses noise. And noise, in an agent burning five dollars an hour, is money on fire.

Eleven months later, that meme is called **[caveman](https://github.com/JuliusBrussee/caveman)**. It is a single `SKILL.md` file that installs into Claude Code, Codex, OpenCode, Cursor, Windsurf, Cline, GitHub Copilot, and thirty-something other agents. It has **75,100 stars**, **4,200 forks**, an MIT license, and an ecosystem of five sibling repos that cover everything from prose compression to a full terminal agent and a fine-tuned model. The tagline is still the same: *"Brain still big. Mouth small."* And its main claim: **~75% fewer output tokens**.

Sounds too good. Let's open it up.

## The context: why agents burn tokens talking

If you've been coding with Claude Code, Codex or Cursor for a while, you know the scene. You ask the agent for an email validator and get a 27-line class wrapped in three paragraphs of pleasantries. You ask for a counter and it builds you a dashboard. You ask for a cache and it constructs an architecture with TTL, eviction policy and concurrency tests. You wanted `lru_cache`. It gave you a whitepaper.

It's not a bug. It's the default behavior of models trained to please. We already analysed this in [AI Agents Coding: From Copilot to Autonomous Agents](/blog/coding-with-ai-agents): the gap between suggesting and acting changed the developer's role, but it also blew up the number of tokens burned per interaction. Every prompt triggers a "more is better" bias the model is unlikely to correct on its own.

And then there's **context drift**. You pasted "be concise" at the start of the session. The agent respected it for the first three turns. By the eighth, it's back to "I'd be happy to help" because the original instruction got buried under forty thousand tokens of context. One-shots don't survive long sessions. And that, on a Pro/Max/20x plan where each session costs dollars, hurts.

> **Honesty note:** all the technical information in this article was verified against the GitHub API and the raw files of the repository as of June 21, 2026. The numbers move fast (several hundred stars a day); what doesn't move is the mechanics of the skill, the published benchmarks and the critiques I cite. Where I doubt, I'll say so.

## What caveman actually is

Caveman is a skill, not a library or a framework. It's a `SKILL.md` file that defines style rules for the agent's prose. The rules, in their simplest form, are these:

```markdown
Respond terse like smart caveman. All technical substance stay.
Only fluff die.

Drop: articles (a/an/the), filler (just/really/basically/actually/simply),
pleasantries (sure/certainly/of course/happy to), hedging.
Fragments OK. Code blocks unchanged. Errors quoted exact.

Pattern: `[thing] [action] [reason]. [next step].`
```

That's the core. The skill ships with six intensity levels triggered by the command `/caveman [level]`:

| Level | Behavior | Example |
|---|---|---|
| `lite` | No filler, full sentences | "Your component re-renders because you create a new object reference each render. Wrap it in `useMemo`." |
| `full` (default) | Fragments OK, no articles | "New object ref each render. Inline object prop = new ref = re-render. Wrap in `useMemo`." |
| `ultra` | Arrow-style abbreviation | "Inline obj prop → new ref → re-render. `useMemo`." |
| `wenyan-lite` | Classical Chinese, full sentences | "組件頻重繪，以每繪新生對象參照故。以 useMemo 包之。" |
| `wenyan-full` | Classical Chinese, fragments | "每繪新生對象參照，故重繪；以 useMemo 包之則免。" |
| `wenyan-ultra` | Classical Chinese, ultra-short | "新參照→重繪。useMemo Wrap。" |

What does NOT change: code, paths, exact errors, identifiers, CLI commands, commit messages, API names. Caveman compresses prose, not technical content. That's exactly what its tagline promises: the brain stays big, only the mouth shrinks.

The classic example, lifted literally from the `SKILL.md`:

> **Before (default):** "Sure! I'd be happy to help you with that. The issue you're experiencing is most likely caused by your authentication middleware not properly validating the token expiry. Let me take a look and suggest a fix."
>
> **After (caveman):** "Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:"

Same information. Eleven fewer lines. And the model still understands everything perfectly because the technical context (auth middleware, token expiry, `<` vs `<=`) stays intact.

## The real technical innovation: hooks, not prompts

What most articles don't tell you is what makes caveman **genuinely** interesting. The `SKILL.md` by itself is just a prompt. Anyone can write "respond like a caveman" in their `CLAUDE.md`. The difference is that caveman installs a **persistent hook** that re-injects itself every turn.

In Claude Code, the plugin lives in `.claude-plugin/` and registers two hooks:

1. `SessionStart`: reads the `SKILL.md` and injects it as a hidden system prompt on the first turn.
2. `UserPromptSubmit`: re-injects a short version of the system every time you send a message.

The second one is the key. When the conversation grows and compaction starts erasing the original instructions, caveman re-asserts them with every prompt. The context drift that plagues a one-shot pasted at the start is gone. The agent **never forgets** it has to talk short because the reminder arrives with every prompt.

The hook code, simplified, looks like this:

```javascript
// src/hooks/caveman-mode-tracker.js (abbreviated)
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: "CAVEMAN MODE ACTIVE (" + activeMode + "). " +
      "Drop articles/filler/pleasantries/hedging. Fragments OK. " +
      "Code/commits/security: write normal."
  }
}));
```

That's the innovation. It's not a better prompt. It's a **persistence mechanism**. And that's what a user on r/ClaudeCode ([zvoque_](https://old.reddit.com/r/ClaudeCode/comments/1u7grb0/)) identified clearly: *"The trick isn't a better prompt. It's a hook. caveman re-injects its instruction on every turn, so there's nothing to drift away from, it gets reasserted each message. That's the part a plain prompt can't do."*

## The ecosystem: five rocks, one philosophy

Caveman doesn't live alone. JuliusBrussee has packaged the same philosophy into five repos that form a coherent stack:

| Repo | Function | Stars |
|---|---|---|
| [caveman](https://github.com/JuliusBrussee/caveman) | Prose compression skill (this article) | 75.1k |
| [caveman-code](https://github.com/JuliusBrussee/caveman-code) | Full terminal agent with 4 simultaneous compression layers | 557 |
| [cavemem](https://github.com/JuliusBrussee/cavemem) | Cross-agent persistent memory with caveman grammar | 552 |
| [cavekit](https://github.com/JuliusBrussee/cavekit) | Minimalist spec-driven build loop | 1k |
| [finetune-caveman](https://github.com/JuliusBrussee/finetune-caveman) | Gemma 4 31B QLoRA fine-tune, trained for ~$5 | 57 |

And before Julius, **[wilpel/caveman-compression](https://github.com/wilpel/caveman-compression)** had already laid the groundwork: a Python library with three backends (spaCy, RoBERTa, OpenAI) that compressed texts for RAG. The difference is that wilpel left it as an offline tool; Julius pushed it inside the agent.

In the broader niche, caveman is best understood alongside [rtk](https://github.com/rtk-ai/rtk) (64.2k stars, a CLI wrapper that intercepts commands and compacts stdout) and [headroom](https://github.com/chopratejas/headroom) (41.8k stars, an API proxy that compresses context before it reaches the LLM). Together the three form what the community calls "the trinity of token compression": caveman for output, rtk for tool output, headroom for input.

## The critical view: does it actually work?

A 75% claim is too pretty. And when something is too pretty, you have to check the numbers. Two independent analyses have subjected caveman to blind benchmarking. Both reach uncomfortable conclusions.

### Ties Petersen's benchmark

[SkillBenchmark](https://github.com/TiesPetersen/SkillBenchmark) is a tool that measures whether a Claude Code skill **actually** improves output quality. Ties_P ran it on caveman with 3 judges and 5 runs per task. The results:

- **Commit messages**: caveman 93.5±1.5 vs no skill 89.9±2.3 → delta +3.6±2.8 (overlapping, not significant).
- **Explaining a Python bug**: 99.5±0.5 vs 100.0±0.0 → delta -0.5±0.5 (no difference).
- **User-facing error message**: 89.7±3.2 vs 87.7±2.5 → delta +2.0±4.0 (no difference).

The author's literal conclusion: *"All confidence intervals overlap, no statistically confirmed quality improvement on any task. The skill also doubled or quadrupled token cost on every run due to the system prompt injection."*

In other words: caveman doesn't improve quality (measurably), and on top of that it **doubles or quadruples** the token cost due to the `SKILL.md` injection as a system prompt. Before you jump to "so it's useless", read the next analysis.

### The noninertialframe96 analysis

[yvgude on r/LocalLLaMA](https://old.reddit.com/r/LocalLLaMA/comments/1u9anzk/cutting_llm_token_costs_with_rtk_headroom_and/) measured the real savings over **614 million tokens** and **$926** of real spend over three months. Caveman's result:

- **0.4% bill savings ($3.58)**.

Why so little? Because caveman only compresses prose, not thinking tokens, not code, not `cache_create`. And the typical structure of a modern bill is: 42% in cache creation, 29% in output, 18% in input, 11% in cache reads. Caveman touches a fraction of that 29%. The rest, untouched.

The full analysis, with graphs, is at [Cutting LLM Token Costs with rtk, headroom, and caveman](https://codepointer.substack.com/p/cutting-llm-token-costs-with-rtk).

### The flip side: the Hakim paper

And yet, there's a recent paper —[Hakim, "Brevity Constraints Reverse Performance Hierarchies in Language Models", arXiv:2604.00025](https://arxiv.org/abs/2604.00025), March 2026— that demonstrates the opposite. 31 models evaluated, 1,485 problems, brevity constraint: **+26 percentage points of accuracy**. Large models beat small ones in math and scientific reasoning when forced into brevity. It's not just a cost optimization — it's a quality optimization too.

What's going on? Probably both things are true at the same time:

1. Caveman **saves tokens in output**, and that's real and reproducible.
2. Caveman **doesn't save what it claims to save** on total bill, because the bill isn't dominated by output.
3. Caveman **does improve quality** on tasks where conciseness forces the model to structure the response better, especially on large models.

The 75% claim is misleading if you read it as "75% of your bill". It's honest if you read it as "75% of the prose output". The README itself clarifies it, in its style: *"Caveman no make brain smaller. Caveman make mouth smaller."*

## When to use it, when not to

After reading the code, the critiques and the benchmarks, here's what I take away:

| Situation | Use caveman? | Why |
|---|---|---|
| Iterative debugging in long sessions | **Yes** | Dense prose gets in the way more than it helps. |
| Quick code review (500-line PRs) | **Yes** | You want the summary, not the essay. |
| Pair programming on counted-bill sessions | **Yes** | Every token counts, and the conversation is between you and the agent. |
| Sessions with weekly context cap (20x plan) | **Yes** | Anti-rate-limit more than anti-cost. |
| User-facing content (error messages, marketing) | **NO** | The skill auto-disables in these cases, and rightly so. |
| Legal or medical documentation | **NO** | Precision matters more than brevity. |
| Small local models (3B-7B) | **NO** | The skill assumes instruction-following; Ollama + llama3.2 fails. |
| Heavy reasoning mode (thinking tokens) | **NO** | Doesn't touch thinking tokens; savings are marginal. |
| Combined with 5+ heavy skills | **NO** | Each skill injects system prompt; the cache evaporates. |
| Human audit of long sessions | **NO** | Overly dense prose is hard to review after the fact. |

## How it fits with what this blog already covers

If you've been around here a while, this will ring a bell. Two days ago we published [Ponytail: The Viral Skill That Teaches Your Agents to Be Lazy Seniors](/blog/ponytail-lazy-senior-dev-skill). Ponytail attacks the amount of **code**. Caveman attacks the amount of **prose**. In Ponytail's benchmark, caveman landed in the middle because it only affects explanations. They're orthogonal — Ponytail's own `SKILL.md` says so: *"Ponytail governs what you build, not how you talk (pair with Caveman for terse prose)."*

And a month ago, [Matt Pocock Skills: The Swiss Army Knife of Small Skills](/blog/mattpocock-skills) presented caveman as an example of a skill that's a single `.md` file with disproportionate effect. Caveman is the living proof of Pocock's thesis: a small, composable, portable skill that fits in any toolbox.

Together, the three form an interesting stack:

- **grill-me** (Pocock): helps you ask the right **questions**.
- **ponytail** (Gebert): helps your agent build **minimally**.
- **caveman** (Brussee): helps your agent **answer short**.

The three skills together can reduce agent output between 80% and 94%, depending on the task. But watch out: stacking system prompts has a cost. Caveman's `SKILL.md` injects ~950 tokens. Ponytail's, another ~5KB. Add grill-me and a couple more and you can blow past 10KB of system prompt consuming cache you could have used for code.

The lazy senior rule is: turn one on, measure, and only then turn the next one on.

## Closing

Caveman is the meme that became infrastructure. It started as a half-joking Reddit post and now has an ecosystem of five repos, 75k stars, a fine-tune and an academic paper backing it. And yet its core message is the same as Ponytail's: **less is more**.

What I like most about caveman, and why I'm testing it, is the honesty. Its author gives away the largest repo in the ecosystem to convince you to use fewer words. If your agent needed to say more, it should say more. But it almost never does.

My recommendation: try it on `/caveman lite` for an afternoon, no commitments. If you notice the agent responds just as clearly but faster, you stick with `lite`. If you want more, go up to `full`. If you reach `ultra`, go back to `full` — `ultra` is cool on Twitter but tiresome in a four-hour session.

And when you combine it with Ponytail, measure first. The full stack is powerful but not free.

*"Brain still big. Mouth small."* I'm getting it tattooed.

---

## Bibliography and References

### Main repositories

- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) — Main skill, 75.1k stars, MIT.
- [JuliusBrussee/caveman-code](https://github.com/JuliusBrussee/caveman-code) — Full terminal agent with 4 compression layers.
- [JuliusBrussee/cavemem](https://github.com/JuliusBrussee/cavemem) — Cross-agent persistent memory.
- [JuliusBrussee/cavekit](https://github.com/JuliusBrussee/cavekit) — Spec-driven build loop.
- [JuliusBrussee/finetune-caveman](https://github.com/JuliusBrussee/finetune-caveman) — Cavegemma, Gemma 4 31B fine-tune.
- [wilpel/caveman-compression](https://github.com/wilpel/caveman-compression) — Original library version (November 2025).

### Compression ecosystem companions

- [rtk-ai/rtk](https://github.com/rtk-ai/rtk) — CLI wrapper for tool output, 64.2k stars.
- [chopratejas/headroom](https://github.com/chopratejas/headroom) — API proxy for input compression, 41.8k stars.

### Independent analyses

- [SkillBenchmark by TiesPetersen](https://github.com/TiesPetersen/SkillBenchmark) — Blind benchmark of Caveman. Zero statistically confirmed quality improvement.
- [r/ClaudeCode: "I built a tool that measures whether a Claude Code skill actually improves output quality, and tested it on Caveman"](https://old.reddit.com/r/ClaudeCode/comments/1tohl1n/) by u/Ties_P.
- [r/LocalLLaMA: "Cutting LLM Token Costs with rtk, headroom, and caveman"](https://old.reddit.com/r/LocalLLaMA/comments/1u9anzk/) by u/noninertialframe96.
- [Cutting LLM Token Costs with rtk, headroom, and caveman — CodePointer Substack](https://codepointer.substack.com/p/cutting-llm-token-costs-with-rtk) by Yongkyun Lee, June 18, 2026. 614M tokens analyzed.

### Academic paper

- Hakim, MD Azizul. ["Brevity Constraints Reverse Performance Hierarchies in Language Models"](https://arxiv.org/abs/2604.00025). arXiv:2604.00025, March 11, 2026. +26 points of accuracy under brevity constraints.

### Relevant Reddit threads

- [r/LocalLLaMA: "Make your AI talk like a caveman and decrease token usage"](https://old.reddit.com/r/LocalLLaMA/comments/1p0lnlo/) by u/RegionCareful7282 — origin of the meme, 651 upvotes.
- [r/ClaudeCode: "Claude was using 400 tokens to say what 80 tokens could"](https://old.reddit.com/r/ClaudeCode/comments/1sczass/) by u/VeryVexxy, 116 upvotes.
- [r/LocalLLaMA: "GPT 5.5 'secret sauce' is just having the thinking be some stupid caveman mode?"](https://old.reddit.com/r/LocalLLaMA/comments/1tljrtk/) by u/JustFinishedBSG, 263 upvotes.
- [r/ClaudeCode: "here's how the caveman plugin taught me to stop retyping 'you are an expert X' every session"](https://old.reddit.com/r/ClaudeCode/comments/1u7grb0/) by u/zvoque_.

### Blog reads

- [Ponytail: The Viral Skill That Teaches Your Agents to Be Lazy Seniors](/blog/ponytail-lazy-senior-dev-skill) — caveman mentioned as orthogonal (line 192).
- [Matt Pocock Skills: The Swiss Army Knife of Small Skills](/blog/mattpocock-skills) — "The Caveman Skill" section (lines 166-183).
- [AI Agents Coding: From Copilot to Autonomous Agents](/blog/coding-with-ai-agents) — why agents over-engineer by default.
- [Effective Context for AI: Prompt Engineering](/blog/effective-context-ai) — the 4 C's of context.
