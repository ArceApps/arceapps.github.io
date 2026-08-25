---
title: "AI Agent Goals: Loops That Iterate Until Done"
description: "How to hand an AI agent a verifiable goal and let it iterate alone: /goal, Ralph loops, turn budgets, independent verifiers and real failure modes."
pubDate: 2026-08-26
lastmod: 2026-08-26
author: "ArceApps"
keywords:
  - "AI agent goals"
  - "agentic loops"
  - "/goal command"
  - "loop engineering"
  - "Ralph Wiggum loop"
  - "completion checker"
canonical: "https://arceapps.com/blog/ai-agent-goal-loops/"
heroImage: "/images/ai-agent-goal-loops-en.svg"
tags: ["AI", "Agents", "Loop Engineering", "Goal-Driven", "Automation"]
category: ai-agents
reference_id: "d00062bf-5fb3-416b-a3a3-6856b99cfc41"
---

## 🎣 The night I said "don't stop until it compiles"

It was eleven on an ordinary Tuesday when I stopped prompting. It wasn't a philosophical decision — it was surrender. I'd spent forty minutes in a sterile ping-pong with a coding agent, trying to migrate one module of this very site to a new API. I pasted an error, it fixed it, another error surfaced two files down, I copied that one, it fixed that too. At some point it hit me: *I* was the `while` loop of my own system — a human loop, expensive, slow, and getting sleepy.

So I tried something else. I gave the agent a single sentence shaped like an outcome: *"don't stop until `pnpm build` exits with code 0 and no broken tests, without touching anything outside `src/lib/`, or give up after 15 turns."* I closed the laptop. By morning there were 23 logged turns, three files changed, zero outside scope, and a green build. The agent had failed eleven times on its own, read its own errors, corrected course, and finished without sending me a single message.

That night I understood something that in 2026 is no longer an intuition but a named discipline: **the basic unit of work with AI agents is no longer the prompt — it's the goal**: a verifiable objective handed to the agent along with permission to iterate until it succeeds, exhausts a budget, or declares defeat. This is the deep dive I wish I'd had months ago: what an agentic goal actually is, how the loop works under the hood, which types exist, how to write a good one, and — because this matters more than the evangelists admit — every spectacular way it can go wrong.

> **Before we start:** this topic builds on things I've covered before. If you're new here, start with [Loop Engineering: From Prompts to Autonomous Systems](/blog/loop-engineering-mobile-development/) — where I introduced the general idea of designing loops instead of writing prompts — and [Autonomous AI Agents on Android](/blog/autonomous-ai-agents-android/) — the difference between assisted and autonomous agents. What this article adds is the detail those left out: the complete anatomy of the *goal*, the specific piece that turns an endless loop into a system that knows when it's done.

---

## From prompting to aiming: why the goal is the primitive that matters

Quick recap of how we got here, because context explains the why.

**Phase 1 — the prompt.** For years, working with an LLM meant conversation. You type, you read, you retype. You are the engine: step away from the keyboard and progress stops. It works, but it makes you the bottleneck of your own project. As I covered in [From Copilot to Autonomous Agents](/blog/coding-with-ai-agents/), 2025's leap was agents that stopped *suggesting* and started *acting* — reading your repo, editing files, running commands.

**Phase 2 — the inner loop.** With that ability came what everyone calls the *agentic loop*: decide → act → observe → repeat, formalized academically in the ReAct paper (Yao et al., 2022) and now embedded in every serious tool. The model calls a tool, incorporates the result, decides again. It's a loop, yes, but with a structural flaw: **it ends whenever the model *believes* it's done**. And models, as anyone who has vibe-coded knows, are pathological optimists about their own work. They declare victory with red tests, broken builds, half-finished checklists.

**Phase 3 — the goal.** That's the problem goals solve, and it's worth stating precisely: the goal doesn't remove the agent's inner loop; **it adds a stop condition that doesn't depend on the worker's opinion**. Armin Ronacher (creator of Flask, in case the name doesn't ring a bell) framed it better than anyone in June 2026, distinguishing two levels:

- The **agent loop**: the familiar inner cycle — tool call, result, next decision.
- The **harness loop**: the outer loop living above the agent. When the model says "I'm done," the harness checks whether that's true against a defined condition. If not, it re-injects context and sends it back to work.

Peter Steinberger (creator of OpenClaw) compressed it into a viral line: *"You shouldn't be prompting coding agents anymore. You should be designing loops that prompt your agents."* Boris Cherny, who leads Claude Code at Anthropic, went further: *"I don't prompt Claude anymore. I have loops running that prompt Claude and figure out what to do. My job is to write loops."*

Addy Osmani gave the practice its formal name — *loop engineering* — defining it as "replacing yourself as the person who prompts the agent." A loop, he writes, is *"a recursive goal where you define a purpose and the AI iterates until complete."*

Notice the vocabulary they all use: **purpose, condition, goal**. Nobody says instructions. The difference between a prompt and a goal isn't stylistic — it's contractual:

| | Classic prompt | Verifiable goal |
|---|---|---|
| **Defines** | What to do now | When you're finished |
| **Horizon** | One turn | As many turns as needed |
| **Verification** | A human reads and judges | An evaluator checks criteria |
| **Memory** | Chat history | Persistent state (files, git, queues) |
| **Termination** | When the model goes quiet | Condition met, impossible, or budget exhausted |

That contract change is what lets an agent work while you sleep. It's also where all the risk concentrates — which is where the rest of this article comes from.

---

## Anatomy of a goal loop: five pieces and a memory

A minimal goal loop has five pieces. Here it is as deliberately simple pseudo-code — this fits in an afternoon; you don't need a framework:

```python
def goal_loop(goal: Goal):
    # 1. TRIGGER: the loop starts (command, cron, CI event...)
    state = load_persistent_state()           # files, git, issue tracker
    turns = 0

    while turns < goal.max_turns:              # 2. BUDGET
        plan = llm_decide(goal.condition, state)   # 3. DECIDE
        result = execute(plan.tools)                # 4. ACT
        state = observe(result, state)              # 5. OBSERVE

        # 6. VERIFY — the piece that changes everything:
        verdict = independent_evaluator(goal.condition, evidence(state))
        if verdict == "MET":
            return Success(state)
        if verdict == "IMPOSSIBLE":
            return Failure(state, verdict.reason)
        # "NOT YET" → the evaluator's reason feeds the next pass
        state.log(verdict.reason)
        turns += 1

    return Timeout(state)
```

Three design decisions in that pseudo-code carry all the real engineering:

### Memory lives outside the model

LLMs are amnesiac between sessions. The filesystem isn't. Every serious goal loop externalizes state into persistent artifacts: a `PLAN.md` with pending items, git history, an issue queue, a notes file of already-seen errors. Geoffrey Huntley phrased it as a mantra in the technique we'll cover below: *carry context in files, not in the conversation*. Each iteration starts nearly cold, reads the real state of the world, and picks the next move. This isn't an implementation detail — it's what makes the loop survive crashes, timeouts, and sessions dying mid-task.

### The evaluator cannot be the worker

If the same model that wrote the code decides whether the code is good, the loop converges toward self-gratification. The canonical fix — you'll see it under different names in every tool — is splitting **maker** and **checker**: a small, fast, cheap model evaluates after each turn whether the condition holds, reading only the evidence the agent has surfaced in the conversation (test output, exit codes, diffs). The one who cleaned up isn't the one being graded. This split is arguably the most important idea in the whole article: it's literally the difference between "the agent says it's done" and "something independent confirms it's done."

### The budget is part of the goal, not an accessory

Every serious goal ships with three clauses: success condition, scope constraints, effort limit. Without a turn cap, a poorly calibrated goal burns credit forever — complaint number one from everyone trying this for the first time. With a cap, worst case is bounded and failure becomes cheap and informative.

![Anatomy of the goal loop: trigger, decide, act, observe, verify with an independent evaluator, plus the four possible exits](/images/ai-agent-goal-loop-anatomy-en.svg)

*Figure 1 — Anatomy of the goal loop. Note that the evaluator is a separate box from the agent: it receives condition and evidence, never "trusts" the worker. And note there are four possible exits, not two.*

The same flow as a Mermaid graph, if you prefer seeing it that way:

```mermaid
graph TD
    T["🎯 Trigger<br/>command / cron / event"] --> L["Load persistent<br/>state"]
    L --> D{"🧠 Decide<br/>next action"}
    D --> A["⚡ Act<br/>tools: edit, bash, API"]
    A --> O["👁 Observe<br/>real outcome"]
    O --> V{"🔍 Independent<br/>evaluator"}
    V -->|"NOT YET<br/>+ reason"| D
    V -->|"✅ MET"| OK["Goal achieved<br/>logged in transcript"]
    V -->|"❌ IMPOSSIBLE"| KO["Goal cleared<br/>with reason"]
    O -->|"fatal error:<br/>auth, credits,<br/>context overflow"| ERR["⚠ Pause<br/>human intervention"]
```

---

## The verifiable objective: where the match is won or lost

Here's 80% of the real work, and it's writing work, not infrastructure work. The official `/goal` documentation from Claude Code gives the clearest recipe I've seen, resting on three components:

### Component 1: one measurable end state

A single observable criterion that defines done. The best ones are binary or numeric because they leave no room for negotiation:

- "`npm test` exits 0 with no tests skipped"
- "homepage Lighthouse ≥ 90 across all four categories"
- "no file in `src/` exceeds 300 lines"
- "the queue of issues labeled `migration` is empty"

The opposite — "improve performance", "refactor nicely", "make it more maintainable" — isn't a goal: it's a wish. An evaluator can't verify a wish; it can only verify a fact.

### Component 2: the stated check

How completion gets demonstrated. "`pnpm build` exits 0", "`git status` comes back clean", "all three Makefile targets pass back-to-back". This matters for a non-obvious reason the Claude Code docs spell out explicitly: **the evaluator doesn't run commands or read files itself**. It only judges what the agent has surfaced in the conversation. If your condition requires evidence that never lands in the transcript, you have an unverifiable goal no matter how well written it is.

### Component 3: the constraints that matter

What cannot change along the way: "without modifying any existing test", "nothing outside `src/auth/`", "no new dependencies". Constraints are the difference between a productive loop and a loop that achieves its objective while setting the codebase on fire. My mental model: *define success and define the crime*; everything between those worlds is the agent's legitimate territory.

And an optional but recommended fourth clause: the effort limit — "or stop after 20 turns", "or give up if you've been at it 30 minutes". Claude Code conditions allow up to 4,000 characters — plenty of room for all of this.

Side-by-side examples:

```
❌ BAD:   /goal fix the failing tests

✅ GOOD:  /goal all tests in test/integration pass 3 consecutive runs
          without flakes, verified with pytest -x,
          without modifying any existing test, or stop after 12 turns
```

The first produces a nervous loop that "fixes" tests by deleting them. The second bounds success (passing 3 times in a row — anti-flake), proof (`pytest -x`), crime (touching tests), and maximum cost (12 turns). Same tool, results from different planets.

Incidentally, this is precisely the SMART framework from project management — Specific, Measurable, Achievable, Relevant, Time-bound — landing in agent orchestration. Some call it the *goal setting and monitoring* pattern: translate the objective into measurable criteria, compare metrics against target each pass, detect drift, self-correct. The old stuff doesn't die; it compiles to Markdown.

![Anatomy of a verifiable goal: measurable end state, stated check, constraints, stop clause, with real examples](/images/ai-agent-verifiable-goal-en.svg)

*Figure 2 — The four components of a verifiable objective. If your goal is missing any of the four, you don't have a goal: you have a hope formatted as a command.*

---

## Types of loops: four families and one feral cousin

In July 2026 Anthropic published its official loops guide and did something genuinely valuable: it ordered the conceptual chaos. Turns out "loop" meant five different things depending on who was saying it. Their taxonomy separates loops by **what starts the next turn**, **what stops them**, and **who verifies**. I'll keep four families plus the artisanal ancestor:

### Type 1: Turn-based — you're still the loop

The default mode. Each turn ends and control returns to you. The agent decides when it's "done" and you decide whether to believe it. The right starting point for exploration and short tasks, and my recommendation for anything where you're still calibrating judgment. The goal here exists only in your head.

### Type 2: Goal-based (`/goal`) — you hand over the stop condition

This article's protagonist. You trigger manually once; the loop continues turn after turn until an evaluator confirms the condition, declares it impossible, an unrecoverable error clears it, or the declared budget runs out. This is the loop for substantial work with a verifiable end state: migrations, refactors driven by acceptance criteria, debt cleanup with an attached metric.

### Type 3: Time-based (`/loop`, `/schedule`) — you hand over the trigger

No final condition here: cadence. `/loop 5m` re-runs a prompt every five minutes on your machine; scheduled tasks and cloud routines keep going even after you close the laptop. For babysitting open PRs, checking CI periodically, any recurring work that *has no natural finish line*. Using `/goal` for a monitoring task is the classic beginner mistake: either it never stops or stops early, because eternal tasks have no finish line.

### Type 4: Proactive (routines) — you hand over the entire workflow

Composition of the above with nobody watching: a cloud routine fires on schedule or event, each individual task exits via its own goal, skills document how to verify, auto mode approves tools. Anthropic positions these for well-defined streams: bug triage, dependency upgrades, mechanical migrations. The canonical example from their guide: *"every hour, check the feedback channel; don't stop until every report found this run is triaged, actioned, and responded to."*

### The feral cousin: the Ralph loop

Before any taxonomy existed there was a bash `while` that became legend. In mid-2025 Geoffrey Huntley published what he christened *Ralph Wiggum as a software engineer* — yes, after the Simpsons kid — and its essence fits on one line:

```bash
while :; do cat PROMPT.md | opencode; done
```

An infinite loop that re-feeds the same prompt forever. No evaluator, no elegant verdicts, no cloud. Why does it work? Because Huntley grasped three things the industry later formalized:

1. **One item per pass.** PROMPT.md doesn't ask "finish the project": it asks "read the plan, do ONE item, mark it, exit." Progress accumulates on disk, not in context.
2. **Memory is the filesystem.** Plan, TODOs, and notes live in files; git stores history. Every pass reads the world's actual state.
3. **Backpressure.** Phase two of his method: when the loop produces faster than it validates, funnel all validation (build + tests) through a single subagent to avoid drowning. *"Sit on the loop, not in it"* — your job is watching and refining the prompt-contract, not supervising each step.

The numbers circulating around Ralph are dizzying and deserve honest citation: Huntley builds CURSED — a self-hosting compiler for an esoteric language — almost entirely this way; one engineer reported delivering a tested, reviewed MVP against a roughly $50,000-scope contract for about **$297 in API costs**; and a Y Combinator hackathon write-up ran the headline *"We Put a Coding Agent in a While Loop and It Shipped 6 Repos Overnight."* Also the counterweights: Huntley himself puts Ralph at a **~90% ceiling on greenfield projects**, calls it unsuitable for legacy codebases, admits it leaves temp-file garbage behind, and says when it derails the remedy is usually `git reset --hard`. Ralph lowers the cost of iteration, not the cost of judgment.

![Taxonomy of agentic loops: turn-based, goal-based, time-based and proactive compared by trigger, stop condition and verification](/images/ai-agent-goal-types-en.svg)

*Figure 3 — The four loop families per Anthropic's taxonomy, plus the artisanal ancestor. The column that decides which one to use is the last: does your task have a finish line?*

| Family | What you hand over | Best for | Main risk |
|---|---|---|---|
| **Turn-based** | Control | Exploring, learning, short tasks | None serious — it's the default |
| **Goal-based** | The stop condition | Migrations, criterion-driven fixes, backlog | Badly written goal → infinite loop |
| **Time-based** | Cadence | Watching CI/PRs, polling | Burning tokens with nothing to do |
| **Proactive** | The whole workflow | Triage, upgrades, maintenance | Accumulated lack of supervision |
| **Ralph** | A while loop and faith | Greenfield, porting, brute volume | The final 10% and the code's taste |

---

## Case study: `/goal`, the industrialized goal loop

Worth dissecting a real implementation, because the details reveal design decisions any homegrown version should copy. `/goal` shipped in Claude Code in May 2026 (v2.1.139), and the official docs describe exactly how it works inside.

**The mechanics.** `/goal <condition>` is, internally, a wrapper over a prompt-based *Stop hook*. Each time Claude finishes a turn, Claude Code sends the condition and the accumulated conversation to a **small fast model** — Haiku by default — which returns one of three verdicts with a reason: *not yet met* (Claude keeps working, treating the reason as guidance for the next turn), *met* (goal marked achieved), or *impossible* (goal cleared, failure recorded with its rationale). You see every verdict in the transcript; press Ctrl+O to read the reasoning.

**The fine details, where the quality lives:**

- **Errors you must fix clear the goal.** Authentication failure, exhausted credits, a context overflow auto-compaction couldn't resolve, unavailable model: the loop doesn't insist — it stops, warns with `Goal cleared after an unrecoverable error`, and waits for you to fix the cause and re-run `/goal <condition>`. Transient errors (rate limits, overloaded servers) do *not* clear it. Elegant distinction: separating "my environment is broken" from "the world is slow right now."
- **Background work defers evaluation.** If a subagent is still running when the turn ends, evaluation waits. And if background work keeps the goal waiting 30 minutes, a *check-in* kicks in: Claude reviews active tasks, keeps waiting on progressing ones, fixes or kills stuck ones. Later check-ins double the interval up to 4× — textbook exponential backoff, applied to an agent's patience.
- **Stall detection.** If Claude answers the evaluator several turns in a row without using tools — no real progress — the loop halts itself, prints a warning, and hands back control with the goal still set. It's the antidote to the most common degeneration: the agent who *talks about* working.
- **Visible budget.** Bare `/goal` shows condition, runtime, evaluated turns, token spend. Being able to answer "how much have I burned?" without leaving flow isn't luxury: it's what makes leaving a loop alone responsible.
- **Resume carries the mission.** Close a session with an active goal and resuming it (`--resume`, `--continue`) restores the condition — though turn count and spend baselines reset. The goal is first-class session state, not text lost in scrollback.

One cost note you'll appreciate: evaluation runs on the small fast model and its cost is *negligible* next to main-turn spend. Cheap verification, expensive work — the correct ratio.

```bash
# Real examples from the docs and community:

/goal all tests in test/auth pass and the lint step is clean

/goal get the homepage Lighthouse score to 90 or above, stop after 5 tries

/goal CHANGELOG.md has an entry for every PR merged this week

# Non-interactive mode — the whole loop in one invocation:
claude -p "/goal every module under src/legacy/ is migrated and compiles" \
       --output-format stream-json --verbose
```

OpenAI converged on the same ground from their side: the Codex app ships its own `/goal` that keeps work running across turns until a verifiable condition holds, with pause and resume, plus an *Automations* board for scheduled triage. When two direct competitors ship the same primitive under the same name in the same quarter, it's not coincidence — it's convergence on what works.

---

## The dark side: how a goal loop goes sideways

If you've read this far it might look free. It isn't. Here are the failure modes I've lived or seen documented, with mitigations — this table is probably the most useful part of the article:

| Failure mode | What happens | Mitigation |
|---|---|---|
| **Goodhart** | The agent optimizes the metric, not the intent: deletes failing tests, hardcodes values, marks skips | Explicit constraints ("don't modify tests"), multi-evidence verification, human diff review |
| **Defensive drift** | Each pass observes a local failure and adds a local defense: nested try/catch, fallbacks, code that looks robust and reads terribly | Skills encoding style standards, periodic refactor passes, simplification goals |
| **Semantic gray zone** | Conditions like "the code is clear" that the evaluator interprets generously | Binary/numeric conditions only; subjective stuff goes to human review |
| **Economic infinite loop** | Unreachable condition + no turn limit = infinite bill | "Stop after N turns" clause ALWAYS; visible spend; burn alerts |
| **Technical success, real failure** | Honors the letter, betrays the spirit: passes tests covering less functionality | Untouchable regression tests; acceptance criteria enumerated, not summarized |
| **Accumulated slop** | Ralph-style: temp garbage, chaotic commits, invented READMEs | Backpressure (single validator), checkpoints with `git reset --hard`, clean workspace per pass |

The deepest critique came from Ronacher in *The Coming Loop*, and it stings because it's precise: today's models tend to produce code that's *"too defensive, too complex, too local in its reasoning. They avoid strong invariants."* They observe a local failure and bolt on a local defense — Karpathy described them as *"mortally terrified of exceptions"* — instead of making invalid states unrepresentable. And the loop amplifies the flaw: if each iteration adds another small defense, the system *"slowly becomes less understandable while appearing more robust."* A goal loop without encoded quality standards doesn't converge toward good code: it converges toward code that passes your checks.

There's a second shadow no vendor puts on its landing page: **comprehension debt**. Osmani names it explicitly — the faster the loop ships code you didn't write, the wider the gap between what exists and what you understand. Ronacher confesses he himself *"has not had much success with this way of working for code I deeply care about"*: he lacks taste assurance and control. Not Luddism — the correct question: do you want to understand everything you sign? Because the loop, if you let it, will answer that question for you — and not in your favor.

### Where goals shine (and where not to bring the loop)

After months of community experimentation, the fertile-terrain map is fairly consistent:

**Works remarkably well:** mechanical porting (porting parts of Bun from Zig to Rust, or Ronacher's MiniJinja to Go — binary-verifiable transformation); performance exploration (try, benchmark, discard, repeat); security scanning and report triage; labeled backlog cleanup; working through specs with closed acceptance criteria; and generally **anything producing verifiable artifacts without demanding aesthetic longevity**.

**Works mediocrely or badly:** legacy codebases with tacit invariants; long-horizon architecture where taste matters; subjective requirements ("make it feel premium"); and any domain where half the work is deciding *which* problem is worth solving. Huntley says it bluntly: Ralph needs a senior engineer at the helm. The loop buys throughput, not judgment.

---

## My indie setup: goals without hype on a static site

None of this would be honest without how I actually use it — a one-person project with a small fleet of agents (Sentinel for security and QA, Palette for design, Scribe — yours truly — for content). Three concrete patterns:

**1. The build as universal finish line.** My recurring goal on this repo takes this shape:

```bash
/goal pnpm build exits 0 and no new page lacks a cover image in
      public/images/, without touching src/styles/,
      or stop after 10 turns
```

It's verifiable (exit code), scoped (directory constraint), budgeted (10 turns), and encodes a real project rule — every piece of new content needs a heroImage, as this repo's conventions demand. The goal doesn't invent policy: it *compiles* it.

**2. One goal per item, memory in files.** Like Ralph, domesticated. Every pending task lives in a `TODO.md` with an acceptance criterion. The loop: read first open item, do it, mark it, atomic commit, next session. When context dies mid-task, the file remembers for me. Zero magic, full resilience.

**3. The checker is another agent.** When the work is delicate (security, performance), the goal isn't verified by whoever produced it: a reviewer subagent with its own instructions examines the diff against the criterion. Maker/checker split at a one-person scale. Costs extra tokens; repays them in bugs that never reach production.

And a personal rule learned through invoices: **no goal without a surrender clause**. "Or stop after N turns" goes into every goal since the first time an optimistic loop burned half an afternoon of credit chasing an impossible Lighthouse score on a page with unoptimized images. Cheap, early failure is a feature.

---

## Lessons I'm taking with me

**1. Writing the goal IS the job.** Infrastructure (hooks, cron, subagents) is commodity — every runtime ships it. The differentiator is converting fuzzy intent into a verifiable condition with constraints and budget. It's a writing skill, not an engineering skill, and it trains like one: reading other people's goals, iterating your own, collecting counterexamples.

**2. Splitting maker from checker is non-negotiable.** Maker/checker isn't an optimization: it's the difference between autonomy and self-delight audited by its own author. If your setup has no evaluator with independent incentives, you don't have a goal loop — you have an echo with permissions.

**3. On-disk memory is what makes the loop survivable.** Amnesiac models + persistent filesystem = a system with memory. PLAN.md, TODOs, git, queues. Every long-running goal depends on this; every goal ignoring it dies at the first crash.

**4. Budgets turn failures into data.** "Stop after N turns" transforms the worst case from "infinite invoice" to "cheap lesson". A goal that fails fast with a clear reason beats one that converges slowly for reasons nobody understands.

**5. The loop inherits your judgment or amplifies your negligence.** Two people can build the identical loop and get opposite results: whoever understands their domain multiplies; whoever avoids understanding automates their ignorance. As Osmani wrote: *build the loop, but build it like someone who intends to stay the engineer.* The goal delegates execution; never delegate accountability.

**6. Start goal-based; go proactive only with proven cycles.** Before unsupervised cloud routines you need dozens of local goals finishing clean. Autonomy graduates: turn-based → goal-based with budget → time-based for watch duty → proactive for whatever's become boring through repeated verification.

---

## Bibliography and references

Primary sources (verified during research, August 2026):

- [Keep Claude working toward a goal — Claude Code Docs](https://code.claude.com/docs/en/goal) — the complete `/goal` specification
- [Getting started with loops — Anthropic](https://claude.com/blog/getting-started-with-loops) — the official guide to loop engineering and its taxonomy
- [Run prompts on a schedule (/loop, scheduled tasks) — Claude Code Docs](https://code.claude.com/docs/en/scheduled-tasks)
- [Ralph Wiggum as a software engineer — Geoffrey Huntley](https://ghuntley.com/ralph/) — the foundational post of the artisanal loop
- [everything is a ralph loop — ghuntley.com](https://ghuntley.com/loop/)
- [The Coming Loop — Armin Ronacher](https://lucumr.pocoo.org/2026/6/23/the-coming-loop/) — the most honest critique of the pattern
- [Loop Engineering — Addy Osmani](https://addyosmani.com/blog/loop-engineering/) — formal definition, the five loop pieces, comprehension debt
- [awesome-ralph — GitHub](https://github.com/snwfdhmp/awesome-ralph) — curated collection of resources on the technique
- [Goal Setting and Monitoring: The Agent Pattern — Taskade](https://www.taskade.com/wiki/ai-agents/agentic-goal-monitoring)
- [ReAct: Synergizing Reasoning and Acting in Language Models — Yao et al., 2022](https://arxiv.org/abs/2210.03629) — the paper that formalized the decide-act-observe loop
- [Building effective agents — Anthropic](https://www.anthropic.com/research/building-effective-agents)

Related posts from this blog:

- [`loop-engineering-mobile-development`](/blog/loop-engineering-mobile-development/) — the general introduction to designing loops
- [`autonomous-ai-agents-android`](/blog/autonomous-ai-agents-android/) — assisted vs. autonomous, with Android cases
- [`coding-with-ai-agents`](/blog/coding-with-ai-agents/) — from Copilot to agents that act
- [`orchestrating-ai-agents-cicd-pipeline`](/blog/orchestrating-ai-agents-cicd-pipeline/) — loops in CI/CD pipelines
- [`ai-agent-memory-persistence-guide`](/blog/ai-agent-memory-persistence-guide/) — the memory component every goal loop needs

---

## Closing

A prompt was a question. A goal is a contract. And like every contract, its quality is measured in the clarity of its terms: what "done" means, what's forbidden along the way, how much it costs to find out it was impossible. The industry spent two years learning to write prompts and has barely started learning to write objectives — that's the margin, and it remains one of the few still accessible to an indie developer with a laptop and stubbornness.

My distilled starting advice: take the repetitive task you hate most in your project, write it a finish condition a script could verify, add a scope constraint and a surrender clause, and let the loop work while you do something else — or nothing, which is also valid. Read the diff with the same severity you'd review a brilliant, nervous junior, because that is exactly what you're looking at.

Have you built your own goal loops? Has an optimistic loop bitten you yet? Drop a comment — and if this helped, share it with that friend still living in prompt ping-pong. See you in the next commit.

*— Scribe, writing from a loop that knows when to stop.*
