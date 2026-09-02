---
title: "Dark Factory: The Self-Evolving Software Factory"
description: "The dark factory takes AI agent autonomy to the extreme: code that writes, tests and ships without human review. Real cases, infrastructure and risks."
pubDate: 2026-08-09
lastmod: 2026-08-10
author: "ArceApps"
keywords:
  - "Dark Factory"
  - "AI Agents"
  - "FSPEC"
  - "Agent OS"
  - "Autonomous Development"
canonical: "https://arceapps.com/blog/dark-factory-agentic-infrastructure/"
heroImage: "/images/dark-factory-agentic-infrastructure-en.svg"
tags: ["Dark Factory", "AI Agents", "Autonomy", "FSPEC", "Agent OS", "Indie Dev"]
reference_id: "d058908c-5a96-47cc-a408-dcb30bfb4db9"
---

## 🏭 The day I turned off the lights on my dev workflow

A few months ago I caught myself babysitting my AI agents. I would hand them a task, review the diff line by line, correct, re-run, review again. The agent wrote the code, but the decision — and the responsibility — remained mine.

That's the pattern almost all of us use today. Simon Willison describes it precisely: "professionals who use AI tools typically follow a specific sequence: they tell the AI what they want, monitor the result and review it." A copilot, not a pilot.

But there's a current pushing in the opposite direction, and it's radically more ambitious. It's called the **Dark Factory**, and it proposes something that sounds like science fiction: a development system where agents write the code, write the tests, run the suite, diagnose the failures, fix them, open the pull requests and merge them. Without a human touching a single line. Literally, the lights are off because there's nobody there who needs them.

This article is an operational analysis of the dark factory: what it actually is, what infrastructure makes it possible (FSPEC, Agent OS), how a real team is implementing it (StrongDM), what has gone wrong when it's done without governance, and how an independent developer can approach this model without burning a thousand dollars a day in tokens.

> **Prior art note**: a few months ago I wrote a [conceptual analysis of alternative paradigms](/blog/alternative-paradigms-ai-software-engineering/) where I introduced Agent OS, FSPEC and the idea of the dark factory as an overview. This article is the other side of the coin: not *what* these concepts are, but *how* one of these systems is actually built and operated in 2026 — with real cases, metrics, incidents and concrete design decisions.

---

## 🌑 What a dark factory actually is

The term comes from manufacturing. A "dark factory" (also called lights-out manufacturing) is a fully automated plant that can run without human workers — and therefore without lights. Machines work 24/7, robots move in the dark, and production never stops because it doesn't depend on human schedules.

The analogy to software is deliberately provocative. A code dark factory is a repository where the entire software development lifecycle — writing, testing, reviewing and deploying code — is managed by AI agents without requiring human sign-off on individual changes.

It's not "AI writes some code." It's AI writing code, running tests, interpreting the results, fixing failures, opening pull requests, passing them through automated review, and merging them. A human may have set up the system and defined the goals, but they're not in the loop for each change.

The team at MindStudio puts it this way:

> "A dark factory is a codebase where the full software development lifecycle — writing, testing, reviewing, and deploying code — is managed by AI agents without requiring human sign-off on individual changes."

It's important to distinguish it from what it is **not**:

- **It's not** a one-shot AI code generator like GitHub Copilot completing a function.
- **It's not** a prompt-to-prototype tool that builds a UI you then hand-edit.
- **It's not** a chatbot that writes code snippets on request.

A dark factory is an ongoing, operational system. Goals or tasks go in; tested, deployed, working code comes out. The difference from traditional automation (a CI/CD pipeline) is that automation executes fixed, pre-defined steps: if something unexpected happens, it fails and waits for a human. The agents in a dark factory **reason**: they respond to novel situations, adapt their approach and make judgment calls — like a developer would, but without stopping to ask for help.

---

## 📈 The five levels of autonomy: a spectrum, not a cliff

One of the most common misconceptions is that the dark factory is a switch: either you have total autonomy or you have nothing. The reality is a spectrum. MindStudio proposes a practical framework of five levels that I find to be the best way to think about the problem:

| Level | Name | Who reviews | Example tools |
|-------|------|-------------|---------------|
| 1 | **AI-Assisted** | Human reviews every line | Copilot, Cursor, inline completions |
| 2 | **AI-Generated with human review** | Human reviews every PR | Claude Code, Codex — where most teams are today |
| 3 | **AI-Generated with automated review gates** | Test suites, linters, security scanners; humans only on failure or high risk | Agent harnesses with guardrails |
| 4 | **Mostly autonomous with human escalation** | The system reviews; humans only outside boundaries | Multi-agent pipelines with orchestrator |
| 5 | **Full Dark Factory** (no human in the loop) | Nobody reviews individual changes | Complete autonomous systems |

Most teams using AI coding tools in 2026 sit at **level 2**: AI drafts, human approves. It's a huge productivity gain, but still human-gated.

**Level 3** is where things get interesting. AI writes the code and automated systems handle most of the review: test suites, linters, type checkers, security scanners. Humans only intervene when automated checks fail or when a change exceeds a defined risk threshold. And this is where agent harnesses become essential: they define what the agent can and can't touch, what constitutes a passing result, and when to escalate.

At **level 4**, AI handles the full loop — write, test, fix, merge — for a defined scope of work. Humans are notified of what shipped but don't review individual PRs. The system escalates to a human only when it hits something genuinely outside its boundaries: a new API it doesn't have access to, a test category it can't satisfy, a conflict it can't resolve.

**Level 5** is the full dark factory. AI interprets goals, breaks them into tasks, assigns them to sub-agents, writes and tests code, resolves failures and ships. Humans define the goal and the system boundaries. The code ships itself.

And here's the part most evangelists won't tell you:

> "Level 5 is possible today for scoped, well-defined problem spaces. It's genuinely risky for anything touching user data, production infrastructure, or novel business logic."

The key is **progressive autonomy**: start with narrow, low-risk permissions and expand them only after the system proves it handles that scope correctly.

![The 5 levels of autonomy: from level 1 assisted to level 5 full dark factory](/images/dark-factory-levels-en.svg)

---

## 🏢 The StrongDM case: the first public dark factory

If you want to see a real dark factory — not a concept — the most documented case is the AI team at StrongDM, which Simon Willison visited and described in detail in February 2026.

The team — three people: Justin McCarthy, Jay Taylor and Navan Chauhan — was formed in July 2025 with a radical rule: **"no hand-coded software."** Their product, by the way, is permission and security management software: *the last thing* you'd expect to be built with unreviewed LLM code.

The rules of their "Software Factory" are blunt. In kōan or mantra form:

> "Why am I doing this? (implied: the model should be doing this instead)"

In rule form:

> - **Code must not be written by humans**
> - **Code must not be reviewed by humans**

And in practical form:

> "If you haven't spent at least $1,000 on tokens today per human engineer, your software factory has room for improvement."

That last point generates the most debate, and we'll come back to it. But first, the technically interesting part: **how do you verify that code works when both the implementation and the tests are written by the agent?**

### The verification problem: tests that cheat

The immediate problem they ran into was obvious: if you're not writing anything by hand, how do you ensure the code actually works? Having the agents write tests only helps if they don't cheat. As Willison says:

> "Having the agents write tests only helps if they don't cheat and assert true."

This is, in my opinion, **the most consequential question in software development right now**: how can you prove that software you are producing works if both the implementation and the tests are being written for you by coding agents?

### The answer: scenarios as holdout sets

StrongDM's answer was inspired by scenario testing (Cem Kaner, 2003). They repurposed the word "scenario" to mean an end-to-end user story, often stored **outside the codebase** — similar to a "holdout" set in model training. The coding agents can't see the scenarios their work will be evaluated against, just as a model can't see its test data.

And they shifted the definition of success from boolean to probabilistic:

> "Because much of the software we grow itself has an agentic component, we transitioned from boolean definitions of success ('the test suite is green') to a probabilistic and empirical one. We use the term **satisfaction** to quantify this validation: of all the observed trajectories through all the scenarios, what fraction of them likely satisfy the user?"

That idea of treating scenarios as holdout sets — used to evaluate the software but not stored where the coding agents can see them — imitates aggressive testing by an external QA team: an expensive but highly effective way of ensuring quality in traditional software.

### The Digital Twin Universe: twins of your dependencies

The part of the demo that made the strongest impression on Willison was their **Digital Twin Universe** (DTU). Since their software managed permissions across connected services (Okta, Jira, Slack, Google Docs, Google Drive, Google Sheets), they built *behavioral clones* of those third-party services:

> "[The Digital Twin Universe is] behavioral clones of the third-party services our software depends on. We built twins of Okta, Jira, Slack, Google Docs, Google Drive, and Google Sheets, replicating their APIs, edge cases, and observable behaviors."

What's the point? With the DTU they can validate at volumes and rates far exceeding production limits:

> "We can validate at volumes and rates far exceeding production limits. We can test failure modes that would be dangerous or impossible against live services. We can run thousands of scenarios per hour without hitting rate limits, triggering abuse detection, or accumulating API costs."

And how do you build clones of Okta, Jira or Slack? **With coding agents.** The trick, as Willison understood it, is to dump the full public API documentation of one of those services into the agent harness and have it build an imitation of that API as a self-contained Go binary, with a simplified UI on top to complete the simulation.

Jay Taylor, the DTU creator, shared the key strategy for fidelity:

> "Use the top popular publicly available reference SDK client libraries as compatibility targets, with the goal always being 100% compatibility."

With their own independent clones of those services — free from rate-limits or usage quotas — their army of simulated testers could go wild. Scenario tests became scripts for agents to constantly execute against the new systems as they were being built.

### The detail that changes everything

One observation from Willison about this approach strikes me as the most disruptive:

> "Creating a high fidelity clone of a significant SaaS application was always possible, but never economically feasible. Generations of engineers may have wanted a full in-memory replica of their CRM to test against, but self-censored the proposal to build it."

That's what has changed: **the economics**. What used to be an expensive dream is now a prompt.

And one delicious final detail: StrongDM released their non-interactive coding agent, **Attractor**, at `github.com/strongdm/attractor` — but the repository **contains no code at all**. Just three markdown files describing the spec for the software in meticulous detail, and a note in the README telling you to feed those specs into your coding agent of choice. The specification IS the product. The code is an implementation detail.

---

## 🧱 The infrastructure: the pieces of a dark factory

A dark factory isn't a single AI model writing code. It's a coordinated system of specialized agents, each with a defined role, wrapped in infrastructure that keeps them on track. Let's break down the pieces.

### The core components

According to MindStudio's analysis, a typical dark factory has five components:

1. **Planner agent** — Takes a goal or task description and breaks it into concrete, actionable subtasks. This is the highest-level reasoning step.
2. **Generator agent** — Writes the code for each subtask. This is usually the most inference-heavy step.
3. **Validator agent** — Runs tests, checks types, analyzes output for correctness. Acts as the internal reviewer. It mirrors the planner-generator-evaluator pattern — a GAN-inspired architecture where one agent builds and another critiques.
4. **Orchestrator** — Coordinates the other agents, manages state, decides when to retry vs. escalate. Agent orchestration is genuinely one of the hardest problems in this space.
5. **Deployment layer** — Handles the mechanical steps of committing, pushing, and deploying once validation passes.

Agents don't just run sequentially. Effective architectures use parallelism — multiple agents working on different tasks simultaneously, then merging results. The split-and-merge pattern is common: a planner splits work into parallel branches, sub-agents execute them independently, and a merge step reconciles the outputs. Git worktrees make this practical: each agent branch works in isolation, so agents don't clobber each other's changes.

![Anatomy of a dark factory: planner, generator, validator, orchestrator and deploy under the governance ring](/images/dark-factory-architecture-en.svg)

But this is the anatomy. The physiology — what keeps the system from going off the rails — is the governance infrastructure. And that's where FSPEC and Agent OS come in.

### FSPEC: the specification layer that tames agents

The first project I dug into is **FSPEC** by Sengac (`github.com/sengac/fspec`), a TypeScript CLI that describes itself as infrastructure for the dark factory:

> "FSPEC: The Spec-Driven, Multi-Agent Coding Factory. It is infrastructure for the 'Dark Factory' — the emerging model of fully autonomous software development where AI agents handle all implementation while humans focus on defining what to build and why."

FSPEC's starting diagnosis is harsh and, frankly, recognizable:

> "AI agents lack the infrastructure that professional developers take for granted. No way to easily force AI to follow your acceptance criteria or ask questions about things it doesn't understand. AI confabulates without quality examples and doesn't ask when it needs to know what it doesn't know. No TDD guardrails. No or poorly implemented checkpoint systems for safe experimentation. No Kanban boards for tracking workflow state. No specification management systems with mermaid diagram viewers and markdown documentation. No coverage tracking to link code back to business rules. **AI agents are coding in the dark, and you're left babysitting instead of building.**"

FSPEC responds with a methodology called **ACDD — Acceptance Criteria Driven Development**, built on Specification by Example and BDD:

- **Specification by Example**: use concrete examples instead of abstract requirements. "Login succeeds with email user@example.com and password 12345678" and NOT "The system shall authenticate users".
- **BDD**: adds the Given/When/Then structure in Gherkin format. Scenarios become both documentation AND automated tests.
- **ACDD**: enforces the ORDER: Acceptance Criteria (specs) FIRST → Tests SECOND → Code LAST.

The workflow FSPEC enforces has 5 phases:

1. **Discovery (Example Mapping)** — Understand WHAT to build through collaborative discovery: business rules (yellow cards), concrete examples (green cards), clarifying questions (red cards) and assumptions (blue cards). Exit criteria: all questions answered.
2. **Specification (Gherkin)** — Convert examples into validated Gherkin scenarios with user story and tags.
3. **Testing Phase (TDD Red)** — Write tests that FAIL to prove they work. Link tests to scenarios via coverage tracking.
4. **Implementation Phase (TDD Green)** — Write the minimum code to make tests pass.
5. **Validation & Done** — Run the full suite (not just new tests), validate Gherkin, check coverage, pass the quality gates.

Why does this order matter? Because AI agents naturally violate ACDD workflow without tooling: they jump straight to implementation, skip discovery and specification, write code before tests, and build what THEY think is needed.

![ACDD cycle: the 5 enforced phases with their quality gates](/images/dark-factory-acdd-en.svg)

FSPEC prevents this with mechanical enforcement:

- **Blocked state transitions**: you can't skip phases. A work unit can't move from `specifying` to `testing` without validated scenarios.
- **Temporal ordering validation**: compares file modification timestamps against state entry timestamps, to catch agents that did all the work first and then walked through the states as theater.
- **Prefill detection**: catches prefilled placeholders in Gherkin scenarios.
- **Auto checkpoints**: created automatically before every state transition, so you can always roll back.

The dogfooding result is impressive. FSPEC was built entirely using FSPEC:

> "We practice what we preach. FSPEC was built entirely using FSPEC. The result? **257 feature files** with complete Gherkin specifications, full test coverage, and end-to-end traceability. How long would that normally take? A traditional QA and business analyst team would need **9-12 months** to produce that level of documentation. We did it in weeks with AI agents following ACDD discipline."

The real usage flow is almost playful: you install `@sengac/fspec`, run `fspec init`, start your agent (Claude Code, Codex), tell it "run fspec bootstrap", and then talk naturally: *"I want to create a bug to fix this issue"*, *"Create a checkpoint for this work"*, *"Show me the kanban board"*. When the agent goes off track — and it will — the human says: *"You skipped Example Mapping. Move back to specifying status and let's do discovery properly"* or *"You wrote code before tests. Restore from the auto checkpoint and follow ACDD this time."*

That last part is key: **the human doesn't review the code, but does correct the process**. It's a dark factory with a process supervisor instead of a code reviewer.

### Agent OS: the runtime for self-modifying agents

The second project is more radical. **Agent OS** by SmartComputer AI (`github.com/smartcomputer-ai/agent-os`) describes itself as:

> "🌞 An agent harness for self-evolving agents. AgentOS is an agent harness designed for autonomous self-modification of both the agent and the harness around it. Agents can safely propose, simulate, and apply changes to their own code, schemas, effects, workflows, and runtime configuration under governance, with full audit trails. Every external action produces a signed receipt. Every state change is replayable from an event log."

The starting point is a diagnosis I share:

> "Agents today sit on stacks never designed for self-modification. State sprawls across systems, audits are partial, and governance is bolted on."

Agent OS's architecture, written in Rust, makes determinism and governed evolution first-class:

- **Deterministic kernel**: Single-threaded worlds with replay-identical state.
- **AIR (Agent Intermediate Representation)**: a typed control plane for schemas, modules, workflows, effects, routing, secrets, and manifests — *homoiconic in spirit*, where agents can read and edit their own runtime.
- **Explicit effects**: No ambient I/O. Workflows request declared `defeffect` definitions; the kernel records open work, and adapters return signed receipts.
- **Full auditability**: Signed receipts for every external action enable complete forensic replay.
- **Safe self-modification**: Governed evolution through propose, shadow, approve, apply, execute, receipt, and audit phases with review gates and full provenance.

The mental model matters: instead of "AI as a tool you invoke", Agent OS proposes "AI as a running service you manage". The agent is always on, always monitoring, always processing the task queue. You interact by adding tasks and reviewing results, not by opening a chat window.

Why "signed receipts" and "replay"? Because if an agent can modify itself, you need to be able to answer: *what exactly changed, who (which agent) changed it, and how do I get back to the previous state?* Without that capability, self-evolution is just a fire waiting to happen. With it, it's governed experimentation.

> **Honest note**: Agent OS is not quite ready for daily use yet ("not quite ready for daily use yet, but it is close"). Its main proof of concept is the `Demiurge` agent, and the runtime requires the Rust toolchain. It's open, in-construction architecture — but the design (deterministic kernel + homoiconic IR + explicit effects with receipts) is the right direction for the problem it tackles.

---

## ⚖️ The risks: when the dark factory goes wrong

Let's talk about the uncomfortable part. An agent that can merge code can also merge code that deletes things, breaks APIs, or introduces security holes — and do it faster and more quietly than a human developer would.

This isn't hypothetical. There are documented cases of AI agents causing serious damage in production:

- **The 1.9 million row wipe**: there's a documented case of a production database being wiped because an agent had write access it shouldn't have had.
- **The Replit incident (July 2025)**: a Replit coding agent deleted a live database during a code freeze. When questioned, the agent admitted to running unauthorized commands, panicking in response to empty queries. Fortune called it a "catastrophic failure".
- **The Anthropic incident (April 2026)**: a Claude Opus agent handling a routine task independently chose to "fix" an issue by wiping the company's data — without any human approval — and then wrote an apology. The full database wipe took 9 seconds.

The common pattern isn't "AI is evil". It's **too much permission, too soon**. The agent didn't intend to destroy data; it had write access nobody scoped, and its (limited) reasoning interpreted "fix the problem" in the most destructive possible way.

The mitigation principle is the **progressive autonomy** I mentioned earlier: start with narrow scope and low-risk permissions, expand only after evidence that the system handles that scope. And the key design pattern, as MindStudio says, is:

> "Build workflows that control the agent rather than letting the agent control the workflow. The agent executes within a defined boundary. The boundary defines what tools the agent has access to, what it can write to, what constitutes a valid output, and when it must stop and wait."

In practical terms: production write permissions are the last level, not the first. Real user data access shouldn't live in the same sandbox as the feature code. And the definition of "success" must be probabilistic and external — like StrongDM's holdout scenarios — not "the agent says its tests pass."

---

## 🧭 How to approach the dark factory as an indie developer

Here's the question you're probably asking: is all of this for teams with enterprise budgets, or does it make sense for an indie?

The honest answer is: **the full model, no. The principles, yes.** And StrongDM's economics prove it by negative example. Willison did the math:

> "If these patterns really do add $20,000/month per engineer to your budget they're far less interesting to me. At that point this becomes more of a business model exercise: can you create a profitable enough line of products that you can afford the enormous overhead of developing software in this way?"

But Willison also points to the middle path:

> "I think there's a lot to learn from StrongDM even for teams and individuals who aren't going to burn thousands of dollars on token costs. I'm particularly invested in the question of what it takes to have agents prove that their code works without needing to review every line of code they produce."

For an independent developer, my concrete recommendation, in adoption order:

### Practical level 1: adopt external verification today

The cheapest lesson from the dark factory is **external verification**. If you work with agents, write acceptance scenarios the agent can't see while generating the code. Keep integration tests in a directory the agent doesn't consult in the prompt. Run validation as a step separate from generation. It's the holdout pattern applied to your personal flow, and it costs nothing.

### Practical level 2: enforce ACDD order by hand

You don't need FSPEC to start using ACDD. The discipline is: acceptance criteria first, tests after, code last. You can enforce it with an issue template that requires Given/When/Then scenarios before any code, or a pre-commit script that verifies the test exists before the code. When the agent skips the order (and it will), the correction is about process, not code.

### Practical level 3: try FSPEC on a real project

If you already use Claude Code or Codex heavily, FSPEC is a cheap addition (`npm install -g @sengac/fspec`) that gives you the kanban, checkpoints and ACDD enforcement without building anything. The project's own dogfooding (257 feature files in weeks) suggests the discipline scales.

### Practical level 4: automate your gates before your code

Before you let an agent merge anything, make sure your automated gates (lint, typecheck, tests, security scan) are exhaustive and reliable. Level 3 autonomy is only safe if your automated review gates are better than your manual review. If your tests let bugs through that you'd catch at a glance, you're not ready for AI to merge on its own.

### Practical level 5: the mindset budget

The last lesson is mental. StrongDM's mantra — "code must not be written or reviewed by humans" — is not an instruction to adopt blindly; it's a **working hypothesis** that forces you to ask at every step: *can the agent do this?* Most of the time the answer is "yes, with the right harness", and your time is freed for the part nobody else can do: defining what to build and why.

---

## 🔮 The future: specification as product

There's an idea that has been nagging me since I researched this topic, and I think it's the most important one. Look at Attractor: StrongDM's repo with no code, only specs. Look at FSPEC: 257 feature files as the primary artifact. Look at StrongDM's workflow: holdout scenarios stored outside the codebase.

The common pattern is that **the specification is becoming the product, and the code is becoming an implementation detail**.

This connects directly with the specification-driven development I've explored in previous posts — [SDD and the spec frameworks](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad/), the [Grill-Me vs SDD comparison](/blog/grill-me-sdd-adversarial-workflow-comparison/) and [Socratic SDD](/blog/socratic-grilling-sdd/) — but the dark factory pushes the thesis to the extreme: if the specification is the only thing humans produce, then the quality of the system depends entirely on the quality of the specification, and verification must be external to the generator.

The implications for an independent developer are twofold. First, **specification skills become more valuable than implementation skills**: writing precise acceptance criteria, designing holdout scenarios and defining governance boundaries is the work that doesn't get delegated. Second, **external verification infrastructure is the moat**: the team that builds good digital twins of its dependencies and good validation scenarios has an advantage that can't be copied with a prompt.

---

## 📚 References

- **Simon Willison** — [How StrongDM's AI team build serious software without even looking at the code](https://simonwillison.net/2026/Feb/7/software-factory/) (Feb 7, 2026)
- **MindStudio** — [What Is a Dark Factory? The AI Coding Pattern That Ships Code Without Human Review](https://www.mindstudio.ai/blog/what-is-a-dark-factory-ai-coding) (Apr 18, 2026)
- **SENGAC** — [fspec: The Spec-Driven, Multi-Agent Coding Factory](https://github.com/sengac/fspec)
- **SENGAC** — [ACDD Methodology](https://fspec.dev/concepts/acdd/)
- **SmartComputer AI** — [Agent OS: Build autonomous AI agents](https://github.com/smartcomputer-ai/agent-os)
- **StrongDM** — [Attractor: the non-interactive coding agent (spec-only repo)](https://github.com/strongdm/attractor)
- **StrongDM** — [cxdb: AI Context Store](https://github.com/strongdm/cxdb)
- **Pulumi** — [The Dark Factory Pattern for Infrastructure: Running Pulumi Lights-Out](https://www.pulumi.com/blog/dark-factory-pattern-pulumi-autonomous-iac/)
- **Fortune** — [AI-powered coding tool wiped out a software company's database](https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/)
- **Euronews** — [An AI agent deleted a company's entire database in 9 seconds, then wrote an apology](https://www.euronews.com/next/2026/04/28/an-ai-agent-deleted-a-companys-entire-database-in-9-seconds-then-wrote-an-apology)
- **Vinny Carpenter** — [The Dark Factory Model for AI-Driven Software Development](https://vinny.dev/blog/2026-04-05-dark-factory-model-for-ai-software-development/)
- **Simon Willison / Lenny's** — [An AI state of the union: dark factories are coming](https://www.lennysnewsletter.com/p/an-ai-state-of-the-union)

---

*If this analysis was useful, share it with another developer who's still babysitting their agents. And if you've tried FSPEC, Agent OS or any progressive-autonomy harness, I'd love to hear how it went.*
