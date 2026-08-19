---
title: "Addy Osmani's Agent Skills: 24 Skills for the Full Lifecycle"
description: "Deep tour of addyosmani/agent-skills: the 24 skills covering Define→Ship, the anatomy of a SKILL.md with anti-rationalizations and red flags, the three-tier eval framework, and an honest comparison with Superpowers, Spec-Kit and OpenSpec."
pubDate: 2026-08-07
lastmod: 2026-08-07
author: "ArceApps"
keywords:
  - "agent skills"
  - "addyosmani"
  - "spec driven development"
  - "superpowers vs agent skills"
  - "spec kit vs openspec"
canonical: "https://arceapps.com/blog/agent-skills-addyosmani-lifecycle-completo/"
heroImage: "/images/agent-skills-addyosmani-lifecycle-completo-en.svg"
tags: ["AI Agents", "Skills", "SDD", "Addy Osmani", "Spec-Driven Development"]
reference_id: "a7d9c2e3-8b4f-4a7d-9e6c-2f3a4b5c6d7e"
---

## Why this repository matters (and why now)

If you've been following how coding agents have moved from "glorified autocomplete" to something that plans, tests, and reviews code on its own, you know the noise. Every week a new framework lands, a "definitive methodology," a skill collection that promises to fix the chaos. Most die in their first month. Three are alive and growing at absurd speed: [obra/superpowers](https://github.com/obra/superpowers) (268k★), [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) (64k★), and [github/spec-kit](https://github.com/github/spec-kit) (GitHub's official attempt to standardize the spec-driven flow). And then there's [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), which at this moment is the one making the most silent noise: 24 skills covering the whole development cycle, an internal architecture obsessed with making sure the skills actually get *used* (and don't just sit in the repo), and an eval framework that runs in CI so no change silently breaks the routing.

This article is, above all, a **deep tour of that repository**. I'll open the hood, look at the guts of three concrete skills, explain the three-tier eval framework that is probably the most interesting piece of the whole project, and then dedicate the last section to an honest comparison with Superpowers, OpenSpec, and Spec-Kit — without cross-marketing, reading what each one says about itself and about the others.

If you've already read my previous posts on SDD, agent skills, or harness engineering, you know I've been on this beat for months: [`agentes-ia-skills`](/blog/building-ai-agent-skills/), [`agent-skills-contexto-dinamico`](/blog/ai-agent-skills-dynamic-context/), [`mattpocock-skills`](/blog/mattpocock-skills/), [`sdd-frameworks-spec-kit-openspec-bmad`](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad/), and [`superpowers-deep-dive`](/blog/superpowers-deep-dive/). What changes here is that Addy Osmani — Engineering Lead at Chrome, author of *Learning JavaScript Design Patterns* and one of the names that has shaped how web engineering is taught over the last decade — has decided to take a position in this market with something that isn't "a loose little skill" but a closed, opinionated system with measurements. It deserves a full article, not a three-paragraph mention.

---

## The repo in five minutes

Before getting into the technical details, a global picture of the project. Everything below comes directly from the [main README](https://github.com/addyosmani/agent-skills/blob/main/README.md), from [`docs/comparison.md`](https://github.com/addyosmani/agent-skills/blob/main/docs/comparison.md) (a document worth reading on its own — Addy is brutally honest about what his project does better and worse than the competition), and from the individual SKILL.md files.

**What it is.** A curated collection of 24 skills for coding agents. Each skill is a structured Markdown file (SKILL.md) with YAML frontmatter, `Overview`, `When to Use`, `Process`, `Rationalizations`, `Red Flags`, and `Verification` sections. Skills ship as plain text files and the agents that support them execute them via slash commands (`/spec`, `/plan`, `/build`, `/test`, `/review`, `/code-simplify`, `/ship`, `/webperf`) or via automatic invocation when the context requires it.

**What problem it tackles.** Coding agents default to the shortest path: skipping the spec phase, writing code before having tests, skipping review, deploying without verifying. agent-skills encodes the workflows a senior engineer would apply naturally — the processes you learn after burning yourself three times — and packages them as skills the agent *must* follow.

**The main flow.** Define → Plan → Build → Verify → Review → Ship. Each phase has its skill (or several), and a meta-skill (`using-agent-skills`) routes the user's request to the right skill depending on what they're trying to do. If you say "I'm going to add a new endpoint with auth," the router reads your request, sees you're in the Build phase but need a bit of Define and a lot of Test, and loads the relevant skills.

```
  DEFINE          PLAN           BUILD          VERIFY         REVIEW          SHIP
 ┌──────�      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
 │ Idea │ ───▶ │ Spec │ ───▶ │ Code │ ───▶ │ Test │ ───▶ │  QA  │      │  Go  │
 │Refine│      │  PRD │      │ Impl │      │Debug │      │ Gate │      │ Live │
 └──────┘      └──────┘      └──────┘      └──────┘      └──────�      └──────┘
  /spec          /plan          /build        /test         /review       /ship
```

**The numbers that matter.** 24 skills (23 lifecycle + 1 meta), 4 agent personas for review, 7 reusable reference checklists, 8 main slash commands, single-command install on 11 different agents (Claude Code, Cursor, Codex, Gemini CLI, Windsurf, OpenCode, Antigravity, Copilot, Kiro, Command Code, and the agent-agnostic `npx skills` CLI). The repo is TypeScript and shell with a heavy documentation component.

---

## The anatomy of a SKILL.md

If you go to install agent-skills, the first thing you find in any `skills/<name>/` folder is a file with this structure:

```markdown
---
name: name-in-kebab-case
description: One trigger sentence. When it should fire.
---

# Human Name

## Overview
What the skill does and why it exists.

## When to Use
Bullet list of situations where it applies. Bullet list of situations where it does NOT apply.

## Process (or Steps)
The step-by-step workflow. Usually with pseudo-code, concrete examples, and "if X then Y" rules.

## Common Rationalizations
Table with two columns: Rationalization (excuse the agent gives to skip a step) | Reality (dry, argued rebuttal). This is the most characteristic piece.

## Red Flags
Signals that something is going wrong and you should stop.

## Verification
What evidence you need to consider the skill complete.
```

What's interesting is that **every skill has the same shape**. This is not an accident. It's the only way an eval framework can inspect all 24 skills with consistent rules. But it also means that when you learn to read one, you understand them all. And when the agent loads them, it spends the same number of catalog tokens regardless of which it invokes.

### Anti-rationalizations: the secret weapon

This is probably the project's most original contribution. If you've ever watched a coding agent "rationalize" why this time it doesn't need to write a test, why the spec is obsolete so it doesn't matter following it, or why the lint failing is "just style," you know what I mean. LLMs are experts at finding plausible justifications for skipping processes.

Look at a real example from the [`test-driven-development`](https://github.com/addyosmani/agent-skills/blob/main/skills/test-driven-development/SKILL.md) skill:

| Rationalization | Reality |
|---|---|
| "The change is trivial, it doesn't need a test" | The most expensive bugs of my career have come from "trivial" changes. The test costs you 30 seconds; the bug costs you a week. |
| "I'll test it by hand later" | The manual test disappears in the next change. If it's not in the repo, it doesn't exist. |
| "Tests slow down development" | The test is what lets you go fast without breaking things. Without a test, every change is a bet. |
| "It's a refactor, behavior doesn't change" | Precisely why the test is *more* important: you're changing the form without changing the function, and you need the safety net to know the function is still intact. |

This isn't theory. It's a table the agent literally reads before writing code. If it tries to skip the step, the table reminds it why it shouldn't. And when the eval framework audits the skill, it checks that this table exists and has substance (not a skeleton of three rows).

### Red Flags: the stop signals

The other distinctive piece. While Rationalizations are "before acting, read this," Red Flags are "during the action, if you see this, stop and rethink." Examples pulled from several skills:

- "You're modifying the spec without updating the document: stop, update the spec, then implement."
- "The test passes without you having changed production code: either the test doesn't prove anything, or you're testing the wrong outcome. Either case needs attention."
- "You've written three files without a single test: you're doing implementation, not TDD. Go back to RED."
- "The user has said 'yes' but you haven't asked for explicit confirmation on the out-of-scope: half of disagreements are about what you're *not* building."

This combination of Rationalizations + Red Flags turns every skill into a workflow with teeth. It's not "I recommend you do this," it's "I know you're going to want not to; here's why you should."

---

## The 24 skills: the complete catalog

Before going deeper, a picture of the catalog grouped by phase. This comes from the README, so it's the official way Addy presents it.

### Meta: the router

| Skill | What it does | When |
|---|---|---|
| `using-agent-skills` | Decides which skill from the catalog applies to your request. The implicit entry point for everything else. | Session start, or when the task is ambiguous and you don't know which skill to load. |

### Define: clarifying what to build

| Skill | What it does | When |
|---|---|---|
| `interview-me` | One question at a time, with your best hypothesis attached, until ~95% confidence on what the user wants. | Underspecified request ("build me a dashboard"), or the user invokes "interview me" / "grill me". |
| `idea-refine` | Divergent/convergent thinking to turn vague ideas into concrete proposals. | You have a rough concept that needs exploration. |
| `spec-driven-development` | Write a PRD covering objectives, commands, structure, code style, testing, and boundaries *before* any code. | Starting a project, feature, or significant change. |

### Plan: breaking it down

| Skill | What it does | When |
|---|---|---|
| `planning-and-task-breakdown` | Decompose specs into small, verifiable tasks with acceptance criteria and dependency ordering. | You have a spec and need implementable units. |

### Build: writing the code

| Skill | What it does | When |
|---|---|---|
| `incremental-implementation` | Thin vertical slices — implement, test, verify, commit. Feature flags, safe defaults, rollback-friendly changes. | Any change touching more than one file. |
| `test-driven-development` | Red-Green-Refactor, test pyramid (80/15/5), Beyonce Rule, browser testing. | Implementing logic, fixing bugs, changing behavior. |
| `context-engineering` | Feed the agent the right information at the right time — rules files, context packing, MCP integrations. | Session start, switching tasks, output quality dropping. |
| `source-driven-development` | Every framework decision grounded in official documentation — verify, cite sources, flag what's unverified. | You want authoritative, source-cited code for any framework or library. |
| `doubt-driven-development` | Adversarial fresh-context review of every non-trivial decision in-flight — CLAIM → EXTRACT → DOUBT → RECONCILE → STOP, with optional user-authorized cross-model escalation. | Stakes are high (production, security, irreversible), unfamiliar code. |
| `frontend-ui-engineering` | Component architecture, design systems, state management, responsive, WCAG 2.1 AA. | Building or modifying UI. |
| `api-and-interface-design` | Contract-first, Hyrum's Law, One-Version Rule, error semantics, boundary validation. | Designing APIs or module boundaries. |

### Verify: proving it works

| Skill | What it does | When |
|---|---|---|
| `browser-testing-with-devtools` | Chrome DevTools MCP for live DOM, console, network, performance. | Building or debugging anything that runs in a browser. |
| `debugging-and-error-recovery` | Five-step triage: reproduce, localize, reduce, fix, guard. Stop-the-line rule, safe fallbacks. | Tests fail, builds break, unexpected behavior. |

### Review: quality gates before merge

| Skill | What it does | When |
|---|---|---|
| `code-review-and-quality` | Five-axis review (correctness, readability, architecture, security, performance). Change sizing (~100 lines), severity labels (Nit/Optional/FYI), review speed norms. | Before merging any change. |
| `code-simplification` | Chesterton's Fence, Rule of 500, reduce complexity preserving exact behavior. | Code works but is harder to read than it should be. |
| `security-and-hardening` | OWASP Top 10 prevention, auth patterns, secrets management, dependency auditing, three-tier boundary system. | Handling user input, auth, data storage, external integrations. |
| `performance-optimization` | Measure-first approach, Core Web Vitals targets, profiling workflows, bundle analysis, anti-pattern detection. | Performance requirements exist or you suspect regressions. |

### Ship: deploy with confidence

| Skill | What it does | When |
|---|---|---|
| `git-workflow-and-versioning` | Trunk-based, atomic commits, change sizing (~100 lines), commit-as-save-point pattern. | Making any code change (always). |
| `ci-cd-and-automation` | Shift Left, Faster is Safer, feature flags, quality gate pipelines, failure feedback loops. | Setting up or modifying build and deploy pipelines. |
| `deprecation-and-migration` | Code-as-liability mindset, compulsory vs advisory deprecation, migration patterns, zombie code removal. | Removing old systems, migrating users, sunsetting features. |
| `documentation-and-adrs` | Architecture Decision Records, API docs, inline documentation standards — document the *why*. | Architectural decisions, API changes, shipping features. |
| `observability-and-instrumentation` | Structured logging, RED metrics, OpenTelemetry tracing, symptom-based alerting — instrument as you build. | Adding telemetry, or shipping anything that runs in production. |
| `shipping-and-launch` | Pre-launch checklists, feature flag lifecycle, staged rollouts, rollback procedures, monitoring setup. | Preparing to deploy to production. |

Look at the catalog. It's not a random collection. Three things stand out:

1. **It covers the whole cycle to production.** Superpowers stays in the inner loop (TDD, debugging, planning, review). Spec-Kit and OpenSpec stay in the spec loop. agent-skills takes you all the way to rollback.
2. **Review skills are explicitly separate from Build skills.** Writing code is not the same as reviewing it, and the catalog treats them as distinct phases with distinct skills.
3. **There's an explicit skill for "doubt"** (`doubt-driven-development`). I haven't seen that in any other framework. The idea is that after making an important decision (not before), you switch to adversarial mode and question it. That's an anti-pattern against LLM premature confidence.

---

## Three skills in detail (what the repo actually teaches)

OK, the catalog is impressive. But what matters more is what it *feels like* using a skill. I read four complete SKILL.md files for this post: `interview-me`, `test-driven-development`, `spec-driven-development`, and `code-reviewer.md` (which is an agent persona, not a skill, but uses the same format). Let me highlight the three that taught me the most about the project's philosophy.

### 1. `interview-me` — the skill that changed how I work the most

The name already says a lot. It's not "ask the user a bunch of questions" or "spec-driven Q&A." It's a skill explicitly about **one question at a time, with your best hypothesis attached**.

The process, verbatim from the repo:

> **Step 1: Hypothesize, with a confidence number.** Before asking anything, write down your current best read of what the user wants in *one sentence*, plus an honest confidence number (0–100%). The number forces honesty. If you wrote down a high number but can't actually predict the user's reactions to the next three questions you'd ask, the number is wrong.

> **Step 2: Ask one question at a time, each with a guess attached.** Format: `Q: <one focused question> / GUESS: <your hypothesis for the answer, with the reasoning that produced it>`. Wait for the user to react before asking the next question.

> **Step 3: Listen for "want vs. should want".** The most dangerous answers are the ones where the user says what a thoughtful answer *sounds like* rather than what they actually want. Watch for: pattern-matching best-practice talk ("I want it to be scalable", "clean architecture") without specifics; phrases like "I should probably…", "I think I'm supposed to…"; buzzwords as goals.

> **Step 4: Restate intent in the user's own words.** Six lines: Outcome, User, Why now, Success, Constraint, **Out of scope** (this last one non-negotiable, says the repo: "Half of misalignment is silent disagreement about what is *not* being built").

> **Step 5: Confirm — explicit yes, not "whatever you think".** List of phrases that DON'T count as yes: "Whatever you think is best" (delegation), "Sounds good" (ambiguous), "Sure, let's go" (often a polite exit), silence followed by "okay let's start" (surrender, not convergence).

The **95% Confidence Stop** is the key piece: you're done when you can predict the user's reaction to the next three questions you'd ask. If not, you're not done.

This is, literally, what I've been doing by hand in my more reflective posts without knowing it had a name. The difference is that now the agent working with me does it systematically, with a confidence number that forces honesty, and with an explicit "want vs. should want" set to detect performative answers.

If your skill collection doesn't have something equivalent, you're missing 50% of the value.

### 2. `test-driven-development` — the test pyramid with teeth

This skill is the one that most resembles what the industry was already teaching ten years ago, but with two important twists.

The first is the **Discover the Stack First** section: before writing the first test, the agent has to discover *how this particular repo tests*. The command isn't "npm test" by default; it's "whatever the repo's package.json, build.gradle, or Cargo.toml says." This sounds obvious but kills an entire class of errors: agents that assume tooling the project doesn't use.

The second is the **Test Pyramid with Beyonce Rule**: 80% unit, 15% integration, 5% E2E. If you liked it, you should have put a test on it. Infra changes, refactors, and migrations aren't responsible for catching your bugs — your tests are. If a change breaks your code and you didn't have a test for it, that's on you.

The **Test Sizes** table is also useful: Small (single process, no I/O, no network, no DB, milliseconds), Medium (multi-process OK, localhost only, seconds), Large (multi-machine, external services allowed, minutes). 80% of your suite should be Small. This is practical: if your CI takes 30 minutes because your pyramid is inverted, this skill tells you.

The **Prove-It Pattern** for bugs is the cherry on top: when a bug report arrives, don't try to fix it. First write the test that reproduces it. When the test fails (confirming the bug), implement the fix. When the test passes (confirming the fix), run the full suite (verifying no regressions). Three steps. Discipline.

### 3. `spec-driven-development` — the spec as a living contract

This skill is the one that most resembles what OpenSpec and Spec-Kit do, and it's useful to read it alongside theirs to see the differences (I'll do that in the comparison section). The flow is **SPECIFY → PLAN → TASKS → IMPLEMENT** with a human review at each phase.

The most interesting thing is the **Surface assumptions immediately** section. Before writing any spec content, the agent lists what it's assuming:

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. Authentication uses session-based cookies (not JWT)
3. The database is PostgreSQL (based on existing Prisma schema)
4. We're targeting modern browsers only (no IE11)
→ Correct me now or I'll proceed with these.
```

This is brilliant. Most "specs" in other frameworks assume the agent knows the context. Here it's forced to make it explicit and ask for correction before proceeding. Half of spec disagreements come from unsaid assumptions; this kills them at the root.

The **Spec template** has six mandatory areas: Objective, Commands, Project Structure, Code Style (with a real snippet, not a descriptive paragraph), Testing Strategy, Boundaries (three-tier: Always/Ask first/Never). And the spec is *alive*: updated when decisions change, when scope changes, committed alongside the code, referenced in PRs.

The final section, **Reframe instructions as success criteria**, is the one that should be copied everywhere:

> REQUIREMENT: "Make the dashboard faster"
> REFRAMED SUCCESS CRITERIA:
> - Dashboard LCP < 2.5s on 4G connection
> - Initial data load completes in < 500ms
> - No layout shift during load (CLS < 0.1)
> → Are these the right targets?

"Faster" is not a specification. "LCP < 2.5s on 4G" is.

---

![SKILL.md anatomy: 6 consistent sections, with a real TDD rationalization table as example](/images/agent-skills-anatomy-skill-en.svg)

*Figure 1 — The 6 mandatory sections of every SKILL.md (left) and a real sample of the rationalization table from the `test-driven-development` skill (right). The orange sections are what differentiate this catalog from any prompt collection.*

## The three-tier eval framework: what really differentiates this repo

This is where Addy stops competing and starts pulling ahead. Of the three frameworks I'm comparing (Superpowers, OpenSpec, Spec-Kit), **none has an eval framework in the repo that runs against its own catalog**. agent-skills does. And it's well thought out.

The framework has three tiers:

![Three-tier eval framework: structural, routing and behavioral](/images/agent-skills-eval-tiers-en.svg)

*Figure 2 — How the repo measures the quality of its own skills. Tier 1 and Tier 2 are deterministic and run in CI; Tier 3 runs a real agent against per-skill scenarios.*

### Tier 1: structural

Static audit of the SKILL.md files. Checks that each one has valid frontmatter, mandatory sections (`Overview`, `When to Use`, `Process`, `Rationalizations`, `Red Flags`, `Verification`), that the Rationalizations have substance (not three courtesy rows), and that the descriptions are concrete. If a skill doesn't have Rationalizations or has fewer than three rows, it fails Tier 1.

### Tier 2: routing

Checks that the skill descriptions carry the vocabulary users actually use and that no two skills collide on routing. This is **deterministic and runs in CI**. When an agent has to decide which skill to load, it reads the descriptions; if two skills have similar descriptions or use ambiguous vocabulary, the router fails. This avoids the classic bug of "I asked for X and got Y because the descriptions overlapped."

### Tier 3: behavioral

The most interesting and most expensive. Runs a real agent against a set of per-skill scenarios and compares the output against per-skill expectations. When does it fail? When an updated model "rationalizes" skipping a step. This is what Superpowers calls "pressure testing" but taken to catalog level: not ad-hoc pressure, but an automated, reproducible test.

What this means in practice is that **the repo has three types of quality being measured continuously**:

- Is the skill well-written? → Tier 1.
- Does the agent load the right skill? → Tier 2.
- Does the agent do what the skill says when it has it loaded? → Tier 3.

If any of the three fails, CI breaks. And the repo treats eval failures as bugs that must be fixed before merging the PR.

When you read the section of `docs/comparison.md` where Addy talks about the other frameworks, he says this explicitly:

> What is newer, and the current point of difference: a **three-tier eval framework** lives in the repo. Tier 1 checks structure, Tier 2 checks that each skill's description carries the vocabulary users actually say and that no two skills collide on routing (deterministic, runs in CI), and Tier 3 grades an agent's real execution trace against per-skill expectations. Neither of the other two ships that kind of in-repo, catalog-wide measurement today.

It's honest. It's not "we have evals, we're the best." It's "this is the concrete technical differential, and the others don't have it." That gives me more confidence than the usual marketing.

---

## Installation: which agent to use and why

The good thing about agent-skills is that it's designed to run on many agents without you having to learn a new toolchain. Quick install:

```bash
npx skills add addyosmani/agent-skills            # install all 24 skills
npx skills add addyosmani/agent-skills --list     # browse before installing
```

Or individually:

```bash
npx skills add addyosmani/agent-skills --skill code-review-and-quality
npx skills add addyosmani/agent-skills --skill interview-me
npx skills add addyosmani/agent-skills --skill test-driven-development
```

The `npx skills` CLI comes from [vercel-labs/skills](https://github.com/vercel-labs/skills) and works with 70+ agents. If you have Claude Code, Cursor, Codex, Copilot, Cline, and others, you probably already have the CLI available.

If you prefer native install, options are:

- **Claude Code (recommended)**: official marketplace with `/plugin marketplace add addyosmani/agent-skills`.
- **Cursor**: workflow skills under `.cursor/skills/`, short policies in `.cursor/rules/*.mdc`. DO NOT paste full skills into rules (this is documented in `docs/cursor-setup.md`).
- **Antigravity**: `agy plugin install https://github.com/addyosmani/agent-skills.git`.
- **Gemini CLI**: `gemini skills install https://github.com/addyosmani/agent-skills.git --path skills`.
- **Windsurf, OpenCode, Copilot, Kiro, Codex, Command Code**: each with its own setup documented in `docs/<agent>-setup.md`.

There's an important caveat from the repo itself: **installing a single skill copies only `skills/<name>/`, not the shared `references/`**. The skill still works, but paths to shared checklists are broken. This is tracked in [#361](https://github.com/addyosmani/agent-skills/issues/361). To avoid it, install the whole repo, clone it locally, or copy the needed checklists into `references/` inside the installed skill.

If I had to recommend one agent to start with agent-skills, it'd be Claude Code. The official marketplace is maintained by Addy himself and the integration is more polished than the rest. For multi-agent (you have Cursor at work and Claude Code at home), the `npx skills` CLI abstracts away the differences.

---

## Agent personas: the 4 used for review

In addition to the 24 skills, agent-skills ships 4 pre-configured **agent personas** for review. Personas live in `agents/<name>.md` and are invoked from the `/review` slash command (single-perspective) or `/ship` (parallel fan-out).

| Persona | Role | Perspective |
|---|---|---|
| `code-reviewer` | Senior Staff Engineer | Five-axis review (correctness, readability, architecture, security, performance). Structured output with Critical/Important/Suggestion. |
| `test-engineer` | QA Specialist | Test strategy, coverage analysis, Prove-It pattern. |
| `security-auditor` | Security Engineer | Vulnerability detection, threat modeling, OWASP assessment. |
| `web-performance-auditor` | Web Performance Engineer | Core Web Vitals audit with Quick/Deep modes, metric-honesty rule. |

The interesting piece is that `/ship` launches all four in parallel and then merges the results into a go/no-go. It's the cleanest implementation of "fan-out review" I've seen in a skill framework. Each persona has an explicit rubric: it's not "review this," it's "review this and return a verdict in this format."

I read `code-reviewer.md` in full. Its output template is an example of clarity:

```markdown
## Review Summary

**Verdict:** APPROVE | REQUEST CHANGES

**Overview:** [1-2 sentences summarizing the change]

### Critical Issues
- [File:line] [Description and recommended fix]

### Important Issues
- [File:line] [Description and recommended fix]

### Suggestions
- [File:line] [Description]

### What's Done Well
- [Positive observation — always include at least one]

### Verification Story
- Tests reviewed: [yes/no, observations]
- Build verified: [yes/no]
- Security checked: [yes/no, observations]
```

If your current agent doesn't produce reviews with this level of structure, this skill alone is worth it. The **Acknowledge what's done well** is the piece I like most: reviews without positive feedback are brutal even when they're correct.

---

## Reference checklists: what's reused

There are 7 shared reference checklists in `references/`:

| Reference | Covers |
|---|---|
| `definition-of-done.md` | Project-wide standing bar every change clears, contrasted with per-task acceptance criteria. |
| `testing-patterns.md` | Test structure, naming, mocking, React/API/E2E examples, anti-patterns (JavaScript/TypeScript). |
| `security-checklist.md` | Pre-commit checks, auth, input validation, headers, CORS, OWASP Top 10. |
| `performance-checklist.md` | Core Web Vitals targets, frontend/backend checklists, measurement commands. |
| `accessibility-checklist.md` | Keyboard nav, screen readers, visual design, ARIA, testing tools. |
| `observability-checklist.md` | On-call questions, structured logging, RED/USE metrics, tracing, symptom-based alerting, pre-launch gate. |
| `orchestration-patterns.md` | Endorsed multi-persona patterns, anti-patterns, the "personas don't invoke personas" rule. |

This matters: the checklists are **living documents**, not decorative PDFs. When a skill loads a checklist, it treats it as a source of truth. If you find a gap in a checklist, you open a PR against the repo and the change propagates to all the skills that use it.

The "personas don't invoke personas" pattern deserves mention: if a persona detects it needs to consult another, it says so in its output as a recommendation. Orchestration belongs to slash commands (`/review`, `/ship`), not to personas. This avoids the classic bug of multi-agent frameworks where personas start calling each other in cascade and you end up with infinite feedback loops.

---

## The honest comparison: Superpowers, OpenSpec, Spec-Kit

OK, now the section you asked for. I'll be as honest as Addy is in his own `docs/comparison.md`. The data on each repo is from each one's official README; the observations on differences are mine (and debatable).

### Summary table

| | **agent-skills (Addy)** | **Superpowers (obra)** | **Spec-Kit (GitHub)** | **OpenSpec (Fission-AI)** |
|---|---|---|---|---|
| **Core idea** | Encode the full senior-engineering lifecycle as skills | A complete development methodology built on composable skills | GitHub's official toolkit for SDD with any agent | Lightweight, iterative SDD, brownfield-friendly |
| **Organizing principle** | SDLC phases (Define→Ship) behind a meta-skill router | A single disciplined loop: brainstorm, plan, execute, review | Rigid phase gates (constitution → specify → plan → tasks → implement) | Changes + specs as living artifacts, no rigid gates |
| **Catalog size** | 24 skills, full cycle | ~14 skills, deep on inner loop | 7 main commands + extensions/presets/bundles | `/opsx:*` commands + `openspec` CLI |
| **Lifecycle coverage** | Broad: idea refinement, API/UI design, security, performance, CI/CD, observability, deprecation, ADRs, launch | Deep but narrow: TDD, debugging, planning, review, skill authoring | Narrow and SDD-focused: from spec to implement | Narrow and SDD-focused: from explore to archive |
| **Entry points** | Slash commands 1:1 to phases (`/spec` `/plan` `/build` `/test` `/review` `/code-simplify` `/ship`, plus `/webperf`), with `/build auto` full-plan mode | Skill-chained pipeline (`brainstorming`, `writing-plans`, `subagent-driven-development`) | Slash commands (`/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`) | Slash commands (`/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive`) + CLI |
| **Distinctive mechanisms** | Anti-rationalization tables and Red Flags in every skill; **parallel review personas** in `/ship`; reference checklists; **three-tier eval framework** in CI | Subagent-driven development with task reviewer (spec + quality) and fix loop; git worktree isolation; skills-that-write-skills, pressure-tested | Constitution-based governance; stackable extensions/presets/bundles; Specify CLI in Python; 30+ official integrations | Stores beta for cross-repo planning; editable living artifacts; 30+ supported tools; designed for brownfield |
| **Quality measurement** | **Trigger, routing, and behavioral evals** against the catalog (in-repo, some in CI) | Pressure-testing methodology is core; eval suite lives in a separate repo | No in-repo catalog evals | No in-repo catalog evals |
| **Tooling reach** | Claude Code, Cursor, Gemini CLI, Antigravity, OpenCode, Windsurf, Copilot, Kiro, Codex, Command Code, `npx skills` CLI | One of the widest and most actively churned surfaces: Claude Code, Codex, Cursor, Copilot CLI, OpenCode, Kimi, Factory Droid, Antigravity, Pi | 30+ AI coding agents (official), with extensions/presets/bundles | 30+ AI assistants via slash commands |
| **Governance** | Actively reviews and merges community contributions; every skill ships an eval | Largely solo-authored; substantial backlog of unmerged community PRs | GitHub official, centralized maintenance | Maintained by Fission-AI + active community |
| **Best for** | Driving a feature through every phase with a human checkpoint at each | Long, autonomous, reasoning-heavy or exploratory work | Large teams that need governance + compliance + traceability | Existing projects (brownfield) where you need to iterate specs without rigid gates |

### How they really differ

What the table doesn't capture well is the *philosophy*. These four projects are optimizing for different things, and that's what matters when you choose one.

**agent-skills (Addy)** takes you from idea to deploy with a human checkpoint at every phase. Its obsession is that **no step gets silently skipped**. The eval framework exists for that: so a model or skill change doesn't degrade the process without someone noticing. If your priority is "I want my agents to follow the playbook even when the model changes," agent-skills is the most disciplined of the four. Its trade-off: it covers so much that sometimes it feels like ceremony for trivial stuff. A typo fix shouldn't go through 6 skills.

**Superpowers (obra/Jesse Vincent)** bets on **autonomy and upfront reasoning**. It extracts a spec via Socratic brainstorming, writes a plan executable by "an enthusiastic junior engineer with bad taste," and then launches subagents executing task-by-task with a task reviewer that verifies compliance + quality and has a fix loop. It's the framework for "give me a big chunk, go to sleep, come back with a reviewed PR." Trade-off: the single pipeline is heavy on small changes. The community keeps asking for multi-agent team execution and it's not in the box yet.

**Spec-Kit (GitHub)** is GitHub's official attempt to standardize SDD. It has 7 main commands (constitution, specify, plan, tasks, taskstoissues, implement, converge), a stackable extensions/presets/bundles system, and official support for 30+ agents. Its obsession is **governance**: the project's constitution defines the principles that guide everything else. If you work at a large company with compliance and want traceability, Spec-Kit is the safest bet. Trade-off: it's Python (the CLI), requires `uv`, and the phase gates are rigid. Iterating on existing specs is more friction than with OpenSpec.

**OpenSpec (Fission-AI)** is the most agile of the four. Its explicit philosophy is *fluid not rigid, iterative not waterfall, easy not complex, built for brownfield*. The flow is `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`, where each "change" is a folder with proposal.md, specs/, design.md, tasks.md. You can edit any artifact anytime without phase gates. It's the most friendly for brownfield and for teams that hate ceremony. Trade-off: less governance than Spec-Kit, less cycle coverage than agent-skills, less autonomy than Superpowers.

### Om Mishra's head-to-head

There's a controlled experiment worth mentioning: Om Mishra ([Superpowers vs Agent-Skills: Faster Shipping, Safer Reasoning](https://www.linkedin.com/pulse/superpowers-vs-agent-skills-faster-shipping-safer-reasoning-om-mishra-dzakf/)) ran the same task, same model, same repo, in Claude Code, changing only the skill framework. Results:

- **agent-skills** moved to code faster (~8 min vs ~12) and ran more validation passes (7 vs 5, including the full test suite). That broader validation caught a compatibility issue outside the immediate feature that feature-specific tests missed. He gave it the edge on **validation depth**.
- **Superpowers** invested more upfront architectural reasoning, which Om still prefers as his daily driver for evolving production systems and exploratory work with no established pattern.
- **Token efficiency: identical.** Both replanned once.

It's one developer's single-task experiment, not a benchmark. But it perfectly illustrates the central trade-off: **broad disciplined validation vs heavy upfront reasoning**. Om's honest conclusion is the honest conclusion in general: pick the tool to the task.

### How I'd choose (in 2026)

If I were forced to put one in each situation:

- **Taking a feature from start to finish with a serious review at the end** → agent-skills. The only one that covers security, performance, observability, and launch within the same system.
- **Refactoring a complex subsystem while I sleep** → Superpowers. The pipeline + subagent review is built for that.
- **Standardizing how a team of 5+ engineers uses agents on a shared repo** → agent-skills (for the phase commands, shared personas, and CI evals) or Spec-Kit (for institutional governance + traceability).
- **Working on a legacy codebase where I want to iterate specs without rewriting everything** → OpenSpec.
- **Pure requirements interrogation** → Matt Pocock's `grill-me` (which I already covered in [`grill-me-claude-skill-deep-dive`](/blog/grill-me-claude-skill-deep-dive/)). Not in this comparison because it's not a full framework, but the grilling skill is still the best in its class.

And the most important thing: **you don't have to choose one exclusively**. The agent-skills README says this explicitly and it's the best piece of advice in the repo:

> You do not have to choose exclusively, but combine with care. These are Markdown skills, not runtimes, so cherry-picking *individual* skills works well: pull in Pocock's `grill-me`, a Superpowers isolation pattern, or a specific checklist alongside your main setup.
>
> What does not work is running two of them as your **active router at the same time**. Stacked meta-skills fight over command names (`/tdd` defined in two places), compete on routing logic, and pull in different TDD philosophies, so you get unpredictable behavior rather than the best of both. Pick one framework as your primary router, and borrow from the others a la carte.

That. Cherry-pick skills, not frameworks.

---

## The shared frontier (where none of them have arrived yet)

Addy himself admits this in `docs/comparison.md`, and it's the most honest piece in the whole ecosystem:

> None of these has solved **durable cross-session memory** well yet: what an agent learned in one session rarely carries cleanly into the next. All three are circling it (learnings files, handoff artifacts, tracker-backed planning maps). If that is your bottleneck, know that you are at the edge of what any of them ships today, and expect to stitch some of it yourself for now.

If your main pain is "my agent forgets what it learned between sessions," none of the four solves it out-of-the-box. You'll have to roll your own. I've covered this in other posts ([`stack-memoria-persistente-implementacion`](/blog/persistent-memory-stack-implementation/), [`servidores-mcp-memoria-cross-agent`](/blog/mcp-servers-memory-cross-agent/)) but the final solution is still yours to build.

---

## Honest critique and trade-offs Addy doesn't mention

`docs/comparison.md` is brutally honest about the others, but there are things about his own project that a critical reader should notice:

1. **The catalog is large and the overhead is real.** 24 skills is more than most teams will consciously use. If you install everything, the agent will spend catalog tokens on every load, which adds up in long sessions. Per-skill install exists but requires discipline.

2. **The eval framework is powerful but opaque.** Tier 1 and Tier 2 are deterministic and run in CI, but Tier 3 (behavioral) is a test against a real agent. Which agent? Which version? Which scenarios? The repo doesn't make it 100% clear from outside. This matters if you want to reproduce the evals locally.

3. **The meta-router (`using-agent-skills`) is the least mature piece.** It's the most critical skill in the system and the one I've seen least evaluated in detail. If the router fails, everything fails. This is a known risk in any routing-based system.

4. **Coverage to Ship is ambitious but not validated in production by many teams yet.** The repo is relatively new (created 2025-08 if we look at the contribution history; `docs/comparison.md` is mid-2026). The full cycle to launch doesn't have the same track record as Superpowers' inner loop.

5. **Skills are opinionated, which is good and bad.** If your team has a different workflow (e.g., you don't do strict TDD), you'll need to customize. Spec-Kit's extensions/presets are more explicit about this.

None of this is a deal-breaker. But these are things an informed buyer should keep in mind.

---

## Why this repo matters more to me than the others

After months following this space, my reading is that **Addy's agent-skills is the most likely of the four to become the de facto standard for medium and large teams**, for three reasons.

The first is **coverage**. It's the only one that reaches Ship with an explicit checkpoint. That matters because most expensive bugs don't come from the inner loop (TDD, debugging) but from the outer loop (deploy, rollback, monitoring). Spec-Kit stops at implement. OpenSpec stops at archive. Superpowers stops at review.

The second is **measurable discipline**. The eval framework turns "we're disciplined" into a falsifiable claim. When a team says "we use agent-skills," they can demonstrate that skills load correctly, that routing doesn't collide, and that execution meets expectations. The other three frameworks live in a world of "trust us."

The third is **institutional legitimacy**. Addy Osmani isn't a random on Twitter. He's Engineering Lead at Chrome, author of books taught at universities, and someone with enough weight that "agent-skills" is a term an engineering manager can say in a meeting without being asked "and what is that?" Spec-Kit has GitHub's legitimacy, but one company's legitimacy is also a cage. Addy's is more portable.

If I had to bet on which one will dominate SDD-as-skills in 2027, I'd bet on agent-skills.

---

## Lessons I'm taking (and applying to my own projects)

Three concrete things I'll apply in my own setup after this tour:

1. **The "rationalization table + red flags" pattern is universal.** Every skill I write from now on will have these two sections. It's the difference between a workflow that's respected and one that gets rationalized away.

2. **The 95% Confidence Stop from `interview-me` is my new gate.** If I can't predict the user's reaction to the next three questions, I haven't finished understanding. I'll apply it explicitly in my planning sessions.

3. **The eval framework is the ceiling of the project.** Without Tier 1/2/3, agent-skills would be one more collection. With the eval framework, it's a system that can be improved and maintained. I'll steal the pattern for my own setups: any "framework" I build from now on needs to have an automated test that it does what it says.

And one final piece, which is the hardest to admit: **my own collection of skills (`vault/tareas/`, the Hermes workflows, the specai skills) should look more like agent-skills than it does now**. I have the habit of writing skills as narrative prompts. The SKILL.md format with Rationalizations + Red Flags + Verification is strictly superior for any workflow you actually want an agent to follow. It's one of those things that becomes clear when you read Addy's repo and realize you've been doing it less well than you thought.

---

## Bibliography and references

Primary sources (all verified during research):

- [addyosmani/agent-skills — main README](https://github.com/addyosmani/agent-skills/blob/main/README.md)
- [addyosmani/agent-skills — docs/comparison.md](https://github.com/addyosmani/agent-skills/blob/main/docs/comparison.md) — the most honest piece in the repo
- [skills/interview-me/SKILL.md](https://github.com/addyosmani/agent-skills/blob/main/skills/interview-me/SKILL.md)
- [skills/test-driven-development/SKILL.md](https://github.com/addyosmani/agent-skills/blob/main/skills/test-driven-development/SKILL.md)
- [skills/spec-driven-development/SKILL.md](https://github.com/addyosmani/agent-skills/blob/main/skills/spec-driven-development/SKILL.md)
- [agents/code-reviewer.md](https://github.com/addyosmani/agent-skills/blob/main/agents/code-reviewer.md)

Comparison:

- [obra/superpowers — README](https://github.com/obra/superpowers/blob/main/README.md) (268k★)
- [obra/superpowers — skills/brainstorming/SKILL.md](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md)
- [github/spec-kit — README](https://github.com/github/spec-kit/blob/main/README.md)
- [Fission-AI/OpenSpec — README](https://github.com/Fission-AI/OpenSpec/blob/main/README.md) (64k★)
- [Fission-AI/OpenSpec — docs/](https://github.com/Fission-AI/OpenSpec/tree/main/docs) (includes Stores beta for cross-repo planning)
- Om Mishra, [Superpowers vs Agent-Skills: Faster Shipping, Safer Reasoning](https://www.linkedin.com/pulse/superpowers-vs-agent-skills-faster-shipping-safer-reasoning-om-mishra-dzakf/)

Previous blog posts that cross with this topic:

- [`agentes-ia-skills`](/blog/building-ai-agent-skills/) — the meta-article on what agent skills are
- [`agent-skills-contexto-dinamico`](/blog/ai-agent-skills-dynamic-context/) — how skills handle context
- [`mattpocock-skills`](/blog/mattpocock-skills/) — the third leg of the skills ecosystem (Pocock)
- [`sdd-frameworks-spec-kit-openspec-bmad`](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad/) — previous comparison between Spec-Kit and OpenSpec
- [`superpowers-deep-dive`](/blog/superpowers-deep-dive/) — previous deep dive into Superpowers
- [`grill-me-claude-skill-deep-dive`](/blog/grill-me-claude-skill-deep-dive/) — Pocock's grilling skill
- [`specs-driven-development`](/blog/spec-driven-development-ai/) — SDD from the indie practitioner perspective
- [`socratic-agents-part-2-sdd-sycophancy`](/blog/socratic-agents-part-2-sdd-sycophancy/) — the sycophancy problem in SDD
- [`harness-engineering-wrapper-gana`](/blog/harness-engineering-wrapper-gana/) — the wrapper that matters more than the model
- [`stack-memoria-persistente-implementacion`](/blog/persistent-memory-stack-implementation/) — the shared frontier none of them solves yet

Complementary reading on the principles agent-skills encodes:

- *Software Engineering at Google* — the base book many of these practices come from (Hyrum's Law, Beyonce Rule, code review norms)
- [Google's Engineering Practices guide](https://google.github.io/eng-practices/) — the public version of the review practices
- [vercel-labs/skills](https://github.com/vercel-labs/skills) — the agent-agnostic CLI agent-skills uses to install on 70+ agents

---

## Closing

Addy Osmani's agent-skills is, right now, the coding-agent skills framework that takes me most seriously as an engineer. Not because it covers more — that's marketing. But because everything it covers, it covers with measurable discipline: explicit rationalizations, red flags, verification, CI evals. It's the first time I've seen a project of this size take seriously the question "how do I know my skills work?" and answer it with an automated system.

It won't solve everything. The cross-session memory problem is still open, and coverage to Ship is ambitious but not yet validated by enough production to feel obvious. But as a foundation for setting up a serious coding-agent workflow in 2026, it's the place to come back to.

If you had to take one thing from this article: **the anti-rationalization + red flags + eval framework pattern is the difference between a collection of prompts and an engineering system**. Everything else is secondary.

If you want to try it, `npx skills add addyosmani/agent-skills` installs it in 30 seconds. If you want to understand it first, this article is the tour. And if you want to discuss it, my DMs are open — I'm always interested in hearing how other people are setting it up.
