---
title: "NanoStack: The AI Agent Framework That Thinks Before It Codes"
description: "Discover NanoStack, the open-source, zero-dependency framework that transforms any AI coding agent into a complete engineering team. Compatible with Claude Code, Gemini CLI, OpenAI Codex, Cursor, and more."
pubDate: 2026-03-29
heroImage: "/images/nanostack-hero.svg"
tags: ["AI Agents", "NanoStack", "Gemini CLI", "Claude Code", "OpenAI", "Productivity", "Open Source"]
reference_id: "f8a3d12e-4b7c-4e9a-a5f2-c8d6e9b0f123"
---

Most AI coding tools answer a simple question: *"How do I write this?"* NanoStack answers a different one first: *"Should we even build this?"*

This distinction is the heart of [NanoStack](https://github.com/garagon/nanostack), an open-source framework that structures any AI agent into a full engineering team workflow. It doesn't replace your AI of choice — it gives it a process. Whether you use Claude Code, Gemini CLI, OpenAI Codex, or Cursor, the same sprint runs the same way.

## 🧠 What Is NanoStack?

NanoStack, created by [Gustavo Aragón](https://github.com/garagon) and inspired by [gstack from Garry Tan](https://github.com/garrytan/gstack), is a collection of 8 **agent skills** that model the full lifecycle of a software sprint. Each skill embodies a role on an engineering team:

| Skill | Role | What It Does |
|---|---|---|
| `/think` | CEO / Founder | Challenges the requirement. Is this the right problem? |
| `/nano` | Engineering Manager | Generates product and technical specs before a single line of code |
| `/review` | Staff Engineer | Two-pass code review: structural then adversarial |
| `/qa` | QA Lead | Functional, visual, and browser testing |
| `/security` | Security Engineer | Scans for secrets, injection, auth, and AI/LLM vulnerabilities |
| `/ship` | Release Engineer | PR creation, CI monitoring, post-deploy checks |
| `/guard` | Safety Layer | 28 block rules that prevent destructive commands |
| `/conductor` | Orchestrator | Coordinates parallel agent sessions |

The key difference from a simple AI copilot: these skills feed into each other. `/nano` generates a spec artifact that `/review` checks for scope drift later. `/review` findings cross-reference `/security` results. Nothing falls through the cracks.

## 🔄 The Sprint: A Process, Not a Collection of Tools

The mental model of NanoStack is a sprint. You run it in order:

```
/think → /nano → build → /review → /qa → /security → /ship
```

This is not about enforcing bureaucracy. It's about the agent asking the right questions at the right time. The real value shows when `/think` pushes back on a feature request:

```
You:    I need to add push notifications to my app. Users are
        missing replies to their posts.
You:    /think

Agent:  How are users coping today?

You:    They open the app 3-4 times a day just to check.

Agent:  That's high engagement. They already come back.
        The problem isn't that they can't be reached. The problem
        is that when they arrive, they can't tell what changed.

        That's a freshness problem, not a messaging problem.

        A notification system is a 3-week project. A red dot
        on the nav icon ships this afternoon.

        RECOMMENDATION: Reduce scope. Ship the dot. See if
        complaints drop. If they don't, then build push
        notifications, but now you have data, not a guess.
```

This is what NanoStack means by "questioning the requirement before writing the code." If you skip `/think` and go straight to `/nano`, the agent still plans it — it just doesn't challenge the premise.

## ⚡ Zero Dependencies, One Install

NanoStack has no build step and no external runtime dependencies. You only need `jq`, `git`, and one supported AI agent.

**Supported agents:** Claude Code (default), Gemini CLI, OpenAI Codex, Cursor, OpenCode, Amp, Cline, Antigravity.

### Install via git clone (recommended)

```bash
git clone https://github.com/garagon/nanostack.git ~/.claude/skills/nanostack
cd ~/.claude/skills/nanostack && ./setup
```

The setup script auto-detects which agents are installed and links the skills accordingly. Run it for a specific host if you want:

```bash
./setup --host gemini     # Gemini CLI only
./setup --host codex      # OpenAI Codex only
./setup --host cursor     # Cursor only
./setup --host auto       # All detected agents
```

### Install via npx (quick start)

```bash
npx skills add garagon/nanostack -g --full-depth
```

The `-g` flag installs globally (available in every project). `--full-depth` installs all 8 skills. This method copies files instead of symlinking, so advanced features like `--rename` and `bin/analytics.sh` won't be available.

### Install as a Gemini CLI extension

```bash
gemini extensions install https://github.com/garagon/nanostack --consent
```

### Update

```bash
~/.claude/skills/nanostack/bin/upgrade.sh
```

Pulls the latest changes and re-runs setup. No build step needed. Skills use symlinks, so changes take effect immediately.

## 🛡️ Guard: Safety Rails for Autonomous Agents

As agents become more autonomous, the risk of destructive commands grows. `/guard` is a three-tier safety system that intercepts dangerous operations before they execute:

- **Tier 1 — Allowlist**: Read-only commands (`ls`, `cat`, `git status`) skip all checks.
- **Tier 2 — In-project**: Operations confined to the current git repository pass through. Version control is the safety net.
- **Tier 3 — Pattern matching**: Everything else is checked against 28 block rules covering: mass deletion, force pushes, database drops, production deploys without review, remote code execution, and security bypasses.

When a command is blocked, `/guard` doesn't just say no. It suggests a safer alternative:

```
BLOCKED [G-007] Force push overwrites remote history
Category: history-destruction
Command: git push --force origin main

Safer alternative: git push --force-with-lease
  (fails if remote changed, so you don't overwrite others' work)
```

The agent reads this feedback and retries automatically with the safer command. All rules are configurable in `guard/rules.json`, so you can add your own patterns specific to your stack or infrastructure.

## 🤖 Autopilot: Approve Once, Ship Automatically

Once you've validated the idea with `/think`, you can let the agent run the entire sprint unattended:

```bash
/think --autopilot
```

`/think` is still interactive: you answer the agent's questions and approve the brief. After your approval, everything else runs automatically:

```
/nano → build → /review → /security → /qa → /ship
```

Autopilot pauses only if it encounters something it can't resolve on its own:
- A blocking issue in `/review` that requires a judgment call
- A `CRITICAL` or `HIGH` vulnerability in `/security`
- Failing tests in `/qa`
- A product question not answered by the available context

Between steps, the agent reports progress without asking for confirmation:

```
Autopilot: build complete. Running /review...
Autopilot: review clean (5 findings, 0 blocking). Running /security...
Autopilot: security grade A. Running /qa...
Autopilot: qa passed (12 tests, 0 failed). Running /ship...
```

This is the practical meaning of "agentic": the human defines the goal, the system handles the execution.

## 🎯 Specs by Scope: Right-Sizing the Plan

One common frustration with AI agents is that they go straight to implementation, skipping the planning step that prevents rework. `/nano` auto-sizes the spec based on the complexity detected:

| Scope | Trigger | What You Get |
|---|---|---|
| **Small** | 1–3 files | Implementation steps only |
| **Medium** | 4–10 files | Product spec + implementation steps |
| **Large** | 10+ files | Product spec + technical spec + steps |

The product spec covers: problem, solution, user stories, acceptance criteria, user flow, edge cases, and what's explicitly out of scope. The technical spec adds: architecture, data model, API contracts, integrations, security considerations, and rollback plan.

Critically, specs are presented for your approval before the agent writes a single line of code. As the NanoStack docs put it: *"If the spec is wrong, everything downstream is wrong."*

## 🧘 The Zen of NanoStack

What sets NanoStack apart philosophically is that it applies engineering judgment, not just engineering capability. The `ZEN.md` file in the repository captures this well:

> *Question the requirement before writing the code.*
> *Delete what shouldn't exist.*
> *If nobody would use a broken v1, the scope is wrong.*
> *Narrow the scope, not the ambition.*
> *Ship the version that ships today.*
> *Security is not a tradeoff. It is a constraint.*
> *The output should look better than what was asked for.*

These aren't motivational posters. Each line is a rule that one of the skills enforces. `/think` questions requirements. `/nano` narrows scope. `/security` treats security as a hard constraint. `/ship` verifies the output looks better than requested.

## 💡 How It Fits Into Your Current Workflow

NanoStack doesn't require you to switch AI providers or learn a new programming model. If you're already using skills-based architecture with files like `AGENTS.md`, `GEMINI.md`, or `COPILOT.md`, NanoStack plugs in as an additional set of skills alongside your project-specific ones.

If you're new to the skills concept, it's worth reading about [how agent skills work](/blog/building-ai-agent-skills) and [the AGENTS.md standard](/blog/agents-md-standard) before installing NanoStack — the framework makes more sense once you understand the modular context injection model.

## 🔌 LLM-Agnostic by Design

One of NanoStack's strongest points is that it doesn't tie you to any specific AI provider. The skills are plain Markdown files — the AI reads them as context. As long as your agent supports external skill files or custom system instructions, NanoStack works with it.

This means:
- Switch from Claude to Gemini? Same sprint.
- Try OpenAI Codex? Same commands.
- Use Cursor at work and Amp for personal projects? Install once with `--host auto`.

The only thing that changes between providers is how the AI interprets the Markdown instructions — and that's a feature, not a bug. You can tune a skill for a specific model by adjusting the language in its `SKILL.md` without breaking the workflow for others.

## Conclusion

NanoStack represents a practical answer to a real question: what happens after AI can write code? The answer isn't more code generation — it's better process. By giving your AI agent the same sprint structure a disciplined engineering team would follow, you get fewer rewrites, more thought-through requirements, and software that ships with fewer surprises.

It's free, open source, zero dependencies, and works with every major AI coding agent available today. For indie developers who are already experimenting with autonomous agents, it's worth trying on your next project.

## References

- [NanoStack on GitHub](https://github.com/garagon/nanostack)
- [NanoStack on skills.sh](https://skills.sh/garagon/nanostack)
- [gstack by Garry Tan (inspiration)](https://github.com/garrytan/gstack)
- [ZEN.md — The philosophy of NanoStack](https://github.com/garagon/nanostack/blob/main/ZEN.md)
- [AGENTS.md — Standard for AI-ready projects](https://github.com/garagon/nanostack/blob/main/AGENTS.md)
