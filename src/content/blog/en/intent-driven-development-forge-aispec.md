---
title: "IDD: Intent-Driven Development with FORGE and AISpec"
description: "Intent-Driven Development shifts the question from 'how to build' to 'what result we want'. FORGE and AISpec turn your intent into verifiable software. Analysis with examples."
pubDate: 2026-08-10
lastmod: 2026-08-10
author: "ArceApps"
keywords:
  - "Intent-Driven Development"
  - "IDD"
  - "FORGE Framework"
  - "AISpec"
  - "Spec-Driven Development"
  - "AI Agents"
canonical: "https://arceapps.com/blog/intent-driven-development-forge-aispec/"
heroImage: "/images/intent-driven-development-forge-aispec-en.svg"
tags: ["Intent-Driven Development", "IDD", "FORGE", "AISpec", "AI Agents", "Indie Dev"]
reference_id: "c4f7e3d2-1a8b-4c6e-9f0d-5b2a7e8c1d34"
---

## 🎯 The day I stopped writing the wrong code fast

For weeks I had the same nagging feeling. My AI coding agent generated code at breakneck speed: full functions, tests, refactors. I reviewed, approved, moved on. And yet, every two or three iterations, I realized we had built *the wrong thing*. Not because the implementation failed — the code was correct, it compiled, the tests passed. Something more basic was wrong: what we had built wasn't what I wanted.

Scott Feltham, the creator of FORGE, nailed it in a sentence that hit me like cold water:

> "I just kept writing the wrong code fast. So I built FORGE." — [Scott Feltham](https://www.linkedin.com/posts/scottdfeltham_github-scottfelthamforge-framework-ai-driven-activity-7421880255805718528-uf33)

That crisis is what gave birth to a methodology that has been gaining traction: **Intent-Driven Development (IDD)**. The idea is simple to state and hard to practice: **stop obsessing over the *how* and learn to express the *what* with enough precision for the AI to implement it correctly on the first pass**.

This article is a practical analysis of IDD: what it really is, how two concrete frameworks (FORGE and AISpec) make it operable, what they promise, what they've shown, and — above all — where the traps are that nobody mentions in the hype posts. Because there's plenty of hype, and very little honest analysis.

> **Prior art note**: on this blog I've already covered [Spec-Driven Development](/blog/spec-driven-development-ai/), a deep analysis of [SDD frameworks like Spec Kit, OpenSpec and BMAD](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad/), the [Superpowers vs OpenSpec](/blog/superpowers-vs-openspec/) comparison, the [task-first approach with Beads and Taskmaster](/blog/lean-task-first-beads-leanspec-taskmaster/) and the autonomous extreme of the [dark factory](/blog/dark-factory-agentic-infrastructure/). IDD is the step *before* all of them: it doesn't specify *which files to change*, but *what outcome you want*. This article is the missing piece: an analysis of the intent layer, with the two frameworks that make it actionable.

---

## 🤔 The problem: a prompt is not a specification

To understand why IDD exists, you have to look honestly at how we work with coding agents today. The dominant pattern is still this: I ask the AI for something in natural language, the AI writes code, I review the result and tell it what to fix. We repeat until "roughly" it looks like what I wanted.

This workflow has had a name since 2025: **vibe coding**. And it's not an insult — it's a legitimate phase everyone goes through. The problem is when it becomes the *only* way of working. Addy Osmani, engineer at Google and a reference author on web performance, put it with uncomfortable clarity:

> "Vibe coding is not the same as AI-Assisted engineering... On Reddit and Hacker News, threads... The overall mood: high skepticism of using un-reviewed AI code in serious projects, mixed with some optimism for limited use cases." — [Addy Osmani](https://medium.com/@addyosmani/vibe-coding-is-not-the-same-as-ai-assisted-engineering-3f81088d5b98)

The underlying critique is devastating and true: *just because an AI can spit out code quickly doesn't mean that code is any good*. But there's a subtler version of the same problem that almost nobody diagnoses. It's not that AI generates bad code — it's that **it generates correct code for a problem that isn't yours**.

Think about it this way: when you tell an LLM "write authentication code," its token space contains thousands of possible implementations of "authentication." Without constraints, the AI samples the most probable one, which is likely the most generic: email/password login, in-memory sessions, zero consideration of rate limiting, token expiry or hashing. If you wanted OAuth with refresh tokens and a lockout after five failed attempts, the AI gave you the *right answer to the wrong question*.

The problem, in one sentence: **the solution space of a vague prompt is huge, and an LLM's sampling tends toward the center of that space — the most generic solution possible**.

Two schools of thought have emerged in response. The first is what I've already covered on this blog: **SDD (Spec-Driven Development)** — writing a structured specification before the AI touches any code. The second, newer and less covered, is **IDD (Intent-Driven Development)**: instead of specifying the *how* (files, functions, interfaces), specify the *what* (outcome, boundaries, success criteria) and let the AI — with the right structure — decide the how within those bounds.

---

## 🧭 What exactly is Intent-Driven Development

The canonical definition comes from the FORGE framework itself:

> "Intent-Driven Development (IDD) is a methodology where you focus on expressing what you want and why, while AI handles the how. Instead of writing code line by line, you define clear intent through structured phases, and AI implements it correctly." — [FORGE Framework](https://scottfeltham.github.io/forge-framework/)

And the key insight, which sums up the whole philosophy in two sentences:

> "The key insight: AI can write code. Humans should define intent." — [FORGE Framework](https://scottfeltham.github.io/forge-framework/)

There's a reassignment of responsibilities here worth savoring. In the classic model (and in vibe coding), the human keeps the worst part: implementation details — syntax, APIs, edge cases, configuration — which are precisely where LLMs shine. In the IDD model, the human steps up a level: they keep the part LLMs still do poorly — deciding what's *actually* wanted, separating the essential from the incidental, and defining what counts as "done."

This isn't a theoretical whim. It's a hypothesis about where the real bottleneck of AI-assisted productivity lies:

> "The bottleneck in AI-assisted development isn't code generation. It's expressing intent clearly enough for AI to implement correctly." — [FORGE Framework](https://scottfeltham.github.io/forge-framework/)

If that hypothesis is correct — and I keep gathering evidence that it is — then all the time we spend polishing prompts, reviewing diffs and correcting iterations is *time wasted at the wrong layer*. The well-spent time would be learning to express intent with surgical precision.

### IDD vs SDD vs Dark Factory: the spectrum

To keep the proliferating terminology from confusing us, let's place these on a spectrum of *who decides the how*:

![Paradigm spectrum: from vibe coding to dark factory](/images/idd-paradigm-spectrum-en.svg)

| Paradigm | Who decides the WHAT | Who decides the HOW | Autonomy level |
|---|---|---|---|
| Vibe coding | Human (vaguely) | AI (free) | Low — full review |
| SDD | Human (detailed spec) | AI (within the spec) | Medium — test validation |
| **IDD** | **Human (intent + boundaries + success)** | **AI (structured implementation)** | **Medium-high — validated phases** |
| Dark factory | Human (objectives) | AI (everything, no review) | Extreme — full autonomy |

The subtle difference between SDD and IDD is the *grain* of the specification. In SDD you write a spec describing the system: files, contracts, interfaces, changes. In IDD you write an intent declaration: what outcome you want, within which limits, and what counts as success. SDD says "create the `auth.ts` file with these functions and these tests." IDD says "users must be able to log in securely; max 5 attempts per hour; response under 200ms."

One describes the *path*. The other describes the *destination*, and lets the system find the path — as long as the destination is defined precisely enough that any valid path is recognizable.

---

## 🔨 FORGE: the 5-phase cycle that won't let you skip steps

FORGE (an acronym of its five phases) is a framework created by Scott Feltham, originally released as a CLI and evolved into a Claude Code skill and an MCP server. Its thesis: intent isn't declared all at once — **it's refined in phases, and each phase has a validation gate that prevents moving forward while intent is still blurry**.

The five phases are:

| Phase | Purpose | Output |
|---|---|---|
| **F**ocus | Define what & why | Problem statement, success criteria |
| **O**rchestrate | Plan the architecture | C4 diagrams, task breakdown |
| **R**efine | Specify "done" before code | Acceptance criteria, interfaces |
| **G**enerate | AI writes code via TDD | Tested, working implementation |
| **E**valuate | Verify intent was met | Accepted or revision needed |

The framework's golden rule: *you can't skip ahead without completing the requirements of each phase*. That sounds like bureaucracy, but it's exactly the opposite: it's a **safeguard against the worst habit of the AI-assisted developer** — starting to generate code while intent is still a blur.

![FORGE cycle: the 5 phases of IDD](/images/idd-forge-cycle-en.svg)

### What it looks like in practice

The example the framework itself gives is payment processing. With the Claude Code skill, the flow goes like this:

```
You: /forge new "payment processing"

Claude: Starting Focus phase. Let me ask some questions:
  - What payment providers do you need?
  - What are your success criteria?
  - Any security requirements?

You: Stripe only. Success = charge cards and handle failures gracefully.

Claude: Got it. Moving to Orchestrate phase...
  [Creates architecture diagram]
  [Breaks into session-sized tasks]

Claude: Ready for Refine. Writing acceptance criteria...
  Given a valid card, when charged, then return success
  Given an invalid card, when charged, then return error with code

Claude: Acceptance criteria approved. Starting Generate phase...
  [Writes failing test first — RED]
  [Implements minimal code — GREEN]
  [Refactors — REFACTOR]

Claude: All tests passing. Ready for Evaluate phase.
  Does this match your intent?
```

Notice what's happening here, because it's the key to the whole article. **Before a single line of production code is written, there's already**: a problem statement, an architecture, a task breakdown, and acceptance criteria in Given/When/Then form. Code is the *last* step, arriving after intent has been validated three times at different levels.

This completely inverts the vibe coding flow. In vibe coding, code is the first artifact and everything else (tests, docs, criteria) gets reconstructed afterward if you're lucky. In FORGE, code is the final artifact of an intent-refinement process.

### How to install it

FORGE offers three ways to use it, from most to least integrated:

1. **Claude Code skill** (recommended by the author): clone the skill repo and use `/forge new`, `/forge status`, `/forge phase next` commands directly in Claude Code. No server required.
2. **MCP server**: for IDE integrations (VS Code, Cursor) and multi-tool workflows. Add the `@neoforge/forge-mcp` server to your MCP config.
3. **CLI (legacy)**: `npm install -g @neoforge/forge-framework`, for non-Claude workflows.

Installing the skill also auto-configures specialized subagents: architect, developer, tester, DevOps and reviewer — each with its own domain expertise.

---

## 📐 AISpec: intent as a declarative format

If FORGE is the process, **AISpec is the language**. Created by Chris Bora (first proposed in December 2024), AISpec is a declarative format for defining software features in a way that's both human-readable and AI-parseable. Its official definition:

> "AISpec is a specification language for AI-first development that shifts focus from implementation to intent through structured solution space reduction." — [cbora/aispec](https://github.com/cbora/aispec)

The core idea is a framework called **WBS — What-Boundaries-Success**. Three sections, three questions, zero ambiguity:

| Section | Question | What it holds |
|---|---|---|
| **What** | What do we want? | Clear action items, each executable |
| **Boundaries** | Within which limits? | Performance limits, resource constraints, business rules |
| **Success** | How do we know it's right? | Measurable outcomes, clear metrics, expected behavior |

The basic format is almost ridiculously simple:

```
Feature: UserAuth {
  What:
    - "Handle user login"
    - "Issue JWT token"
    - "Track attempts"

  Boundaries:
    - "Max 5 attempts/hour"
    - "Token expires 24h"
    - "Passwords hashed"

  Success:
    - "Valid users login"
    - "Invalid blocked"
    - "Response < 200ms"
}
```

That example is verbatim from the project's README, and if it feels trivial, you're getting the point. The power isn't in the syntax — it's in the **effect it has on the LLM's solution space**:

> "Traditional prompt: 'Write authentication code' — Solution space: 1000s of possible implementations. AISpec format: ... — Solution space: Reduced to few viable implementations." — [cbora/aispec](https://github.com/cbora/aispec)

![WBS: solution space reduction with AISpec](/images/idd-aispec-wbs-en.svg)

### Why it works: the probabilistic intuition

The AISpec README includes an explanation of why WBS works with LLMs that I think is the project's most interesting contribution — beyond the format itself:

> "LLMs fundamentally work by sampling the next token based on probability distributions over their vocabulary. What-Boundaries-Success framework as a prompting framework works because: What: Defines the initial high-probability region in the LLM's token space. Boundaries: Act as 'soft constraints' that shift probability mass AWAY from tokens that would lead to invalid solutions. Success: Creates 'peaks' in the probability landscape that guide sampling toward desired end states." — [cbora/aispec](https://github.com/cbora/aispec)

Translation: the *What* places the AI in the right region of token space (the topic). The *Boundaries* create "valleys" in probability that push sampling away from invalid solutions (you can't do X, don't exceed Y). And the *Success* creates "peaks" that sampling is drawn toward (this is exactly what finishing means). Each constraint eliminates a set of invalid solutions — and since they compose, the reduction is multiplicative.

That's why the project's meta-prompt insists on constraints that "compound with each other" and that "solution space reduction must be multiplicative": one constraint alone reduces little; ten well-chosen constraints can shrink the space from thousands of implementations to a handful.

### The extended format

For complex features, AISpec allows additional sections: `Technical` (framework, database, patterns), `Dependencies` (required and optional packages) and `Security` (auth, encryption, rate limits). The format stays declarative — it describes *what* to use, not *how* to wire it together.

There's also a **meta-prompt** you can paste into any assistant's system prompt so the assistant itself converts natural-language requirements into AISpec format before implementing. It's an interesting "recursive spec-ing" pattern: you use AISpec to define how AISpec itself should behave.

---

## 🔬 The theory behind it: Bora's Law and the scale of intent

I can't talk about AISpec without mentioning the most controversial part of the project: the theory that comes with it. Chris Bora proposes a formula, **I = Bi(C²)**, claiming that effective intelligence (I) scales with base intelligence (Bi) times the *square of constraint clarity* (C²) — not with compute.

> "This formula says that when you have enough base intelligence (Bi), intelligence (I) scales exponentially with clarity of constraints (C²), not compute." — [cbora/aispec](https://github.com/cbora/aispec)

The claim is bold: if the bottleneck isn't the model but constraint clarity, then two intent engineers with a generic LLM could achieve what a team of sixty developers with five million dollars does. The README says it literally:

> "Traditional: 60 developers, $5M, 1 year. Intent Engineering: 2 intent engineers, minimal capital, fraction of time." — [cbora/aispec](https://github.com/cbora/aispec)

This is where honest analysis has to slam the brakes. **That claim is marketing, not a demonstrated result.** There's no controlled study backing it; there's a flashy analogy (one person drives one car vs. one person drives a million cars via constraints) and a formula that isn't formally defined — what units does C have? How do you measure "effective intelligence"? Where does the square come from?

That said, dismissing the whole theory would be just as big a mistake. The *direction* of the hypothesis has weak empirical support: each well-formed constraint you add to a prompt measurably reduces the variability of an LLM's responses. Anyone can verify that in five minutes with a sampling experiment. What's unsupported is the *magnitude* — that the reduction is exponential in the square of clarity, and that it can replace entire teams and budgets.

My read: **Bora's Law is a working hypothesis dressed up as a law of physics**. Useful as a heuristic (clear constraints → better results), dangerous as dogma (if results don't come, you "weren't clear enough"). IDD benefits from the heuristic; it doesn't need the dogma.

---

## ⚖️ The comparison that matters: IDD vs what you already use

To decide whether IDD deserves a place in your workflow, the comparison isn't against the hype — it's against what you actually do today. Here's my practical assessment:

### IDD vs direct prompting (vibe coding)

- **IDD wins on**: consistency between what's asked and what's delivered, iteration cost (fewer round trips), traceability (the phases stay documented).
- **Direct prompting wins on**: startup speed for trivial tasks, zero process overhead.
- **Verdict**: for single-function tasks, direct prompting is right. For any feature with more than one design decision, IDD pays for itself with the first iteration it avoids.

### IDD vs SDD (spec-driven)

- **IDD wins on**: writing speed (you declare intent, not implementation details), adaptability (the AI decides the how within the limits).
- **SDD wins on**: fine-grained control, predictability for systems with a decided architecture, compatibility with teams that need to review the plan before executing.
- **Verdict**: they're not enemies, they're layers. The real workflow I see working is SDD *for the contract* (which files, which interfaces) + IDD *for the intent* (what outcome, what limits, what success). FORGE actually combines both: the Orchestrate phase produces the breakdown and the Refine phase the acceptance criteria.

### IDD vs dark factory

- **IDD wins on**: human oversight at every phase gate, lower drift risk.
- **Dark factory wins on**: full autonomy, maximum throughput.
- **Verdict**: the dark factory is the far end of the spectrum where IDD gets automated to the point of removing human validation. If the dark factory gives you vertigo — and it should — IDD is the defensible middle ground: autonomy in the how, control over the what.

---

## 🧪 An honest experiment: IDD on a real project

Theory is fine, but what convinced me was trying it. Here's the experiment I ran with a small feature of a personal project: a notification system with priorities.

**Vibe coding approach (my baseline):** direct prompt — "add a notification system with priorities to the project." Result: the AI implemented notifications with *numeric* priorities displayed in a flat list. It worked, but it wasn't what I wanted — I wanted priorities *by type* (error > warning > info) with suppression rules (no more than 3 notifications of the same type per hour). Two correction iterations later, the code was a patch on a patch. Total time: ~45 minutes. Result: it works, but I hate it.

**IDD approach (same feature, AISpec + FORGE phases):**

```
Feature: NotificationSystem {
  What:
    - "Show user notifications with priority levels"
    - "Group by type: error > warning > info"
    - "Suppress repeats: max 3/hour per type"

  Boundaries:
    - "No external notification service"
    - "Store in local database"
    - "UI stays in existing component tree"

  Success:
    - "Error notifications always visible"
    - "Warning hidden after 3 per hour"
    - "Info collapsible by default"
    - "All rules unit-tested"
}
```

With that declaration, the agent implemented exactly that: priority by type, hourly suppression, rules in tests. One iteration, twenty minutes. The difference wasn't the model — it was that this time the AI knew *what finishing meant* before starting.

The experiment isn't a scientific study, but it is illustrative: **the same model, the same codebase, the same feature — and the outcome went from "it works but I hate it" to "it works and it's what I asked for."** The only change was how intent was expressed.

---

## ⚠️ The traps nobody mentions

No methodology comes without costs. These are the ones I've hit in practice, and you won't see them in the launch posts:

**1. Writing intent is hard too.** IDD's premise is that expressing the *what* is easier than the *how*. True — but only up to a point. Expressing *measurable* success criteria for something that doesn't exist yet requires a level of mental clarity most projects don't have at the start. IDD doesn't give you that clarity: it demands it. If you don't know what you want, no methodology fixes that — though FORGE will make you discover it in the Focus phase before wasting tokens on code.

**2. The fake-specification risk.** AISpec success criteria ("Response < 200ms", "Valid users login") look objective, but they're claims nobody has verified. An LLM receiving them as "spec" can produce code that *appears* to meet them without tests proving it. The gap between "the spec says so" and "the tests demonstrate it" is the difference between IDD done well and done badly. **Without tests, IDD is just a prompt with pretty formatting.**

**3. The phase-gate confirmation bias.** In FORGE, the agent asks you "does this match your intent?" at Evaluate. The temptation is to say yes just to finish. The validation gate only works if the human is honest — and tired humans aren't. If you use IDD, budget time for the "no" at Evaluate.

**4. Bora's Law isn't a law.** I've said it already, but it bears repeating: the I = Bi(C²) formula is an attractive hypothesis with no formal validation. Don't design your process assuming it's physics.

**5. Overhead for small tasks.** For "change the button color," the full IDD cycle is ridiculous bureaucracy. The discipline of a good IDD practitioner is knowing *when not* to apply it. The signal: if you can write the full intent in one unambiguous sentence, you don't need phases — you need a prompt.

---

## 🛠️ How to start without overhauling your workflow

If IDD interests you, you don't need to adopt a full framework on day one. My recommendation is a three-step incremental path:

**Step 1 — Adopt the WBS format, no new tools.** The next feature you ask your agent for, write it as AISpec: a What section (concrete actions), a Boundaries section (constraints), a Success section (measurable criteria). Copy the UserAuth example, adapt the names, paste the block into your prompt. That alone changes output quality — it's the experiment from this article, which required zero installation.

**Step 2 — Add FORGE's gates manually.** Before your agent writes code, demand (manually, from yourself) three artifacts: a one-sentence problem statement, a three-line architecture, and three acceptance criteria. If you can't write them, you're not ready for code. That's FORGE without installing it.

**Step 3 — If the flow convinces you, install the skill.** `git clone https://github.com/scottfeltham/forge-skill.git ~/.claude/skills/forge`, then try `/forge new` on your next real feature. If you use MCP, `@neoforge/forge-mcp` is the way. Start with a small project where the gates won't frustrate you.

One final piece of advice: **measure before and after**. Count the iterations a typical feature needs today (direct prompting) and what it needs with WBS/FORGE. If the number doesn't drop, the methodology isn't for your case — and knowing that is as valuable as it working.

---

## 📚 References

- [FORGE Framework — Intent-Driven Development](https://scottfeltham.github.io/forge-framework/) — official framework documentation.
- [Getting Started | FORGE Framework](https://scottfeltham.github.io/forge-framework/getting-started) — skill and MCP installation.
- [GitHub — scottfeltham/forge-framework](https://github.com/scottfeltham/forge-framework) — original framework repository.
- [GitHub — scottfeltham/forge-skill](https://github.com/scottfeltham/forge-skill) — Claude Code skill.
- [GitHub — cbora/aispec](https://github.com/cbora/aispec) — AISpec, WBS and Bora's Law (primary source).
- [Intent-Driven Development for AI Coding — intent-driven.dev](https://intent-driven.dev/knowledge/intent-driven-development/) — reference resource on IDD, Context Engineering and Harness Engineering.
- [Vibe coding is not the same as AI-Assisted engineering — Addy Osmani](https://medium.com/@addyosmani/vibe-coding-is-not-the-same-as-ai-assisted-engineering-3f81088d5b98) — the honest critique of vibe coding.
- [Being a Responsible Developer in the Age of AI Hype — InfoQ](https://www.infoq.com/articles/responsible-developer-ai-hype/) — on skepticism and independent verification.
- Related posts on this blog: [SDD](/blog/spec-driven-development-ai/), [SDD Frameworks](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad/), [Superpowers vs OpenSpec](/blog/superpowers-vs-openspec/), [Task-first](/blog/lean-task-first-beads-leanspec-taskmaster/), [Dark Factory](/blog/dark-factory-agentic-infrastructure/).

---

## 🏁 Closing

Intent-Driven Development isn't the answer to everything — it's the answer to one specific question: *why do I keep correcting my AI when the AI isn't getting the code wrong, but the objective?*

The mindset shift is small in appearance and huge in practice: **stop writing the code (or the prompts that generate it) and start writing the destination.** FORGE gives you the process to refine that intent in five validated phases; AISpec gives you the format to declare it without ambiguity. Neither replaces your judgment — quite the opposite, they make it the primary artifact of development.

Feltham's sentence — "I just kept writing the wrong code fast" — captures better than any analysis the experience of anyone who has worked with coding agents without structure. IDD is, at its core, the discipline of stopping writing the wrong code fast. And in 2026, with agents generating code at industrial speed, that discipline is worth more than ever.

If you try it, let me know how it goes. And if your experience contradicts anything in this article, tell me too — honest analysis needs both sides. 🚀
