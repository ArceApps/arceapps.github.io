---
title: "Inside Superpowers: The Framework That Forces AI to Engineer"
description: A comprehensive technical deep dive into the Superpowers methodology, exploring its subagent orchestration, strict TDD enforcement, and how it transforms AI from a chaotic coder into a disciplined engineering partner.
pubDate: 2026-04-19
heroImage: /images/placeholder-article-ai-workflow.svg
tags: ["Superpowers", "AI Agents", "TDD", "Subagents", "Methodology", "Engineering", "Workflow", "Deep Dive"]
reference_id: b7c3e5d1-9a2f-4c8e-b1d6-8a9f2e3d4c5b
author: ArceApps
lastmod: 2026-04-19
canonical: "https://arceapps.com/blog/superpowers-deep-dive/"
keywords: ["Superpowers", "AI Agents", "TDD", "Subagents", "Methodology", "Engineering", "Workflow", "Deep Dive"]
---

> **Related reads:** [Agentic Engineering Methodologies: Superpowers vs OpenSpec](/blog/blog-superpowers-vs-openspec) · [Subagents in OpenCode](/blog/blog-opencode-subagents) · [TDD and AI in Android Development](/blog/tdd-ai-android-development)

If you've spent any significant time building software with AI agents, you know the cycle. You start with a brilliant idea, write a detailed prompt, and hit enter. The agent writes 500 lines of code. You run it. It crashes. You paste the error back. It writes another 200 lines, fixing the error but silently breaking an unrelated feature. Two hours later, you are drowning in a sea of context-polluted chat history, manually reverting files and questioning why you didn't just write the code yourself.

This is the reality of unconstrained AI generation. Large Language Models are probabilistic text engines; without strict guardrails, they drift. They hallucinate APIs, forget edge cases, and abandon architectural patterns the moment a bug appears.

Enter [Superpowers](https://github.com/obra/superpowers).

Developed by Jesse Vincent, Superpowers is not just another wrapper or a set of clever prompts. It describes itself as a "complete software development methodology for your coding agents." After spending weeks dissecting its source code and running it through the paces on the ArceApps portfolio, I can confidently say it is the most opinionated, rigorous, and fascinating approach to AI coding currently available.

In my previous article, I [compared Superpowers to OpenSpec](/blog/blog-superpowers-vs-openspec), highlighting the philosophical differences between process-oriented and artifact-oriented frameworks. Today, we are going all the way down the rabbit hole. We will look at exactly how Superpowers works, how its "skills" are structured, why its use of parallel subagents is a stroke of genius, and where the framework falls short.

## The Foundation: Composable Skills

To understand Superpowers, you have to understand how it interfaces with the AI. Superpowers is designed to run *inside* an existing agent harness, such as Claude Code, Codex CLI, or Cursor.

Instead of a single monolithic system prompt, Superpowers is built as a library of "Skills." Each skill is defined in a markdown file containing a name, a description of when to use it, and a highly detailed set of instructions.

When you install the plugin, these skills are loaded into the agent's context. The agent's native system prompt is instructed to evaluate the user's request and autonomously trigger the relevant skill.

Here are some of the core skills in the Superpowers library:
*   `test-driven-development`
*   `systematic-debugging`
*   `brainstorming`
*   `writing-plans`
*   `using-git-worktrees`
*   `subagent-driven-development`

### The Anatomy of a Skill

Let's look at how a skill is actually written. It's not polite conversational text; it's a strict algorithm for the LLM to follow. Take the `test-driven-development` skill, for example. The documentation explicitly states:

> **The Iron Law:** NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST. Write code before the test? Delete it. Start over. No exceptions.

This is prompt engineering taken to its logical extreme. It leaves no room for the LLM to "helpfully" skip steps. If the agent triggers the TDD skill, it is bound by these instructions. This composable architecture means you can add new skills or modify existing ones without rewriting the entire framework logic.

## The Superpowers Workflow: From Idea to Execution

The true power of Superpowers becomes apparent when you watch these skills chain together. When you ask the agent to implement a feature, it doesn't just start writing code. It initiates a complex, multi-stage workflow.

### Phase 1: Brainstorming (`brainstorming`)

The moment the agent detects you want to build something new, it halts. It refuses to write code. Instead, it triggers the `brainstorming` skill.

This phase is Socratic. The agent asks probing questions about edge cases, data structures, and architectural constraints. Once it has enough information, it generates a rough design document and presents it to you *in chunks*. It forces you to validate the design before it proceeds.

As a solo developer, this is invaluable. I often approach a feature with a half-baked idea. Having an agent relentlessly question my assumptions ("How will this UI component handle RTL languages?", "What is the fallback if the API rate limits?") catches fundamental flaws before they are set in code.

### Phase 2: Isolation (`using-git-worktrees`)

Once the design is approved, Superpowers enforces a clean workspace. It triggers the `using-git-worktrees` skill.

Instead of polluting your current branch with experimental, AI-generated code, it creates a dedicated `git worktree` in a temporary directory on a new branch. It then runs your project's setup scripts and verifies that the test suite passes cleanly in this isolated environment. If the tests fail before it even starts, the process halts.

This guarantees that any subsequent failures are the fault of the new code, not environmental pollution.


### Phase 3: The Plan (`writing-plans`)

With a clean worktree ready, the agent triggers `writing-plans`. It takes the approved design and breaks it down into a highly granular, markdown-formatted implementation plan.

Superpowers dictates that tasks should be "bite-sized" (2-5 minutes of work). Each task in the plan must include:
1.  Exact file paths.
2.  The complete code to be written (no "etc." or "implement logic here" placeholders).
3.  Specific verification steps (the test that must be written).

This plan acts as the blueprint for the rest of the execution. It is the crucial artifact that prevents the agent from losing its way.

### Phase 4: Subagent Orchestration (`subagent-driven-development`)

This is the crown jewel of the Superpowers methodology. If your harness supports it (like Claude Code), the main agent will now trigger `subagent-driven-development`.

Instead of the main agent reading the plan and trying to execute all 15 steps in one massive, context-heavy session, it becomes an orchestrator. For Task 1, it spawns a *completely fresh subagent*.

The orchestrator hands the subagent only what it needs:
*   The overall context (so it knows where it fits).
*   The specific instructions for Task 1.
*   The strict order to follow the `test-driven-development` skill.

The subagent wakes up, writes the failing test, writes the implementation, makes the test pass, and reports back. It is then terminated.

The orchestrator then initiates a **two-stage review**:
1.  **Spec Compliance:** Did the subagent build exactly what Task 1 demanded?
2.  **Code Quality:** Does the code meet the project's standards?

If the review fails, the orchestrator spawns a new "fixer" subagent with specific feedback. If it passes, it moves to Task 2 and spawns another fresh subagent.

### Why Subagents Change Everything

If you've ever watched an LLM try to implement a 10-step plan in a single chat, you've seen context collapse. By Step 6, the LLM has forgotten the architectural constraints established in Step 1. It starts repeating itself, confusing variable names from previous steps, and generally degrading in reasoning capability as the token count explodes.

Subagents solve this elegantly. A fresh subagent has zero memory of the struggles of the previous step. Its context window is empty, its attention mechanism is laser-focused, and its token generation is cheap. It only knows about Task N.

This isolation is how Superpowers can run autonomously for two hours, implementing complex features across dozens of files, without deviating from the original plan. It mimics how a tech lead (the orchestrator) delegates small, scoped tickets to junior developers (the subagents) and reviews their PRs before moving on.

## The Iron Law of TDD in Practice

Let's look closer at how Superpowers enforces TDD. For many developers, TDD is an aspiration, not a daily reality. Superpowers forces it to be a reality.

When a subagent is tasked with implementing a feature, the `test-driven-development` skill explicitly forbids writing production code first.

If you are building an Android app and ask it to implement a new `ViewModel`, it will not write the Kotlin code for the `ViewModel`. It will first write `MyViewModelTest.kt`, instantiating the view model and asserting that the initial state is correct. It will run the test. The test will fail (because the class doesn't exist). Only then will it write the skeleton `ViewModel` class.

This process is slow. It feels agonizingly methodical when you are watching the terminal output. The agent runs `pnpm test`, reads the failure logs, writes three lines of code, runs `pnpm test` again, reads the success logs, and commits.

But the result is undeniable. When the Superpowers run finishes, you don't just have a feature; you have a fully tested feature. You have absolute confidence that the code works exactly as specified in the plan. For an indie developer managing a complex codebase alone, this automated safety net is priceless.


## Critical Analysis: The Good, The Bad, and The Brutal

Superpowers is an incredible piece of engineering, but it is not a silver bullet. After extensive use, here are my unvarnished opinions on its strengths and weaknesses.

### The Good: Unprecedented Quality and Focus

**1. Context Preservation Through Isolation:** The subagent architecture is the killer feature. By wiping the slate clean for every discrete task, Superpowers completely eliminates the context drift that plagues long-running AI sessions. The quality of the code generated on Task 15 is just as sharp as the code generated on Task 1.

**2. The End of "It Works on My Machine":** The insistence on git worktrees is brilliant. How many times have you let an AI loose in your repo, only to realize it modified a configuration file you were experimenting with, breaking your local environment? Worktrees guarantee the AI operates in a sterile lab, proving its code works against a clean baseline.

**3. TDD as a Guardrail:** While human developers often argue about the ROI of strict TDD, for an AI agent, it is the ultimate guardrail. The test acts as an objective, machine-readable validation that the agent understood the prompt. If the agent hallucinates, the test fails. It forces the LLM to ground its reasoning in executable reality.

### The Bad: Friction and Speed

**1. It is Agonizingly Slow:** Superpowers trades speed for correctness. A task that might take you 10 minutes to hack together manually could take Superpowers 45 minutes to brainstorm, plan, worktree, test, implement, and review. If you are doing rapid prototyping or visual UI tweaks, the methodology feels like walking through molasses. It is designed for engineering, not hacking.

**2. Token Gluttony:** The workflow is incredibly token-intensive. The constant context switching, the Socratic brainstorming, the writing and reading of extensive plan documents, and the back-and-forth of the TDD cycle consume massive amounts of API credits. If you are paying per token, Superpowers will burn a hole in your wallet rapidly.

**3. The Boilerplate Burden:** Sometimes, you just want to add a single CSS class or update a typo in a markdown file. Triggering the Superpowers workflow for these micro-tasks is absurd. You have to actively fight the framework or step outside of it to do simple things.

### The Ugly: Harness Dependency and Brittleness

The biggest fundamental flaw of Superpowers is its architecture as a plugin residing *inside* an LLM prompt.

Because it relies on the host LLM (like Claude 3.5 Sonnet within the Claude Code CLI) to read the skill instructions and flawlessly execute them, it is inherently brittle. LLMs are not deterministic state machines. Sometimes, despite the strict instructions in `subagent-driven-development`, the orchestrator will get lazy and try to execute a task itself instead of dispatching a subagent. Sometimes it will decide to write the implementation before the test, flagrantly violating "The Iron Law."

When this happens, the entire methodology breaks down. You find yourself yelling at the terminal, "No, read the skill documentation again!"

Furthermore, the framework is heavily dependent on the capabilities of the CLI harness. If you use a harness that lacks a robust subagent API, Superpowers falls back to a much less effective sequential execution mode (`executing-plans`), negating its biggest advantage. It feels like trying to run a high-performance operating system on a hardware abstraction layer that keeps changing the rules.

## The Verdict: Who is Superpowers For?

Superpowers is not for everyone. If your primary use case for AI is writing boilerplate, generating simple scripts, or assisting with CSS layouts, this framework will frustrate you immensely. You will feel bogged down by process and ceremony. For those tasks, an artifact-guided approach like OpenSpec is far superior.

However, if you are a solo developer building complex backend systems, intricate algorithms, or mission-critical data pipelines—scenarios where a subtle bug can cause catastrophic failure—Superpowers is a revelation.

It is the closest thing I have experienced to having a disciplined, senior pair programmer sitting next to me. It forces me to think through my designs, it demands that my tests are comprehensive, and it executes implementation plans with a relentless, untiring focus.

For the ArceApps portfolio, I don't use Superpowers every day. But when I need to refactor the core search indexing logic, or when I'm building a complex state machine for a new game mechanic in PuzzleHub, Superpowers is the tool I reach for. I gladly trade the speed and token cost for the absolute peace of mind that comes from knowing the code is robust, isolated, and perfectly tested.

As agentic AI continues to evolve, we will likely see these methodological concepts baked directly into the IDE or the harness itself. But right now, Superpowers stands as a pioneering example of how to force probabilistic text engines to do rigorous, deterministic engineering. It is a glimpse into the future of human-AI collaboration, where the human provides the architecture, and the agent, bound by methodology, provides the execution.

## Dissecting the "Writing Plans" Skill

To truly appreciate the depth of the Superpowers methodology, we must examine the specific mechanics of its planning phase. The `writing-plans` skill is not merely a suggestion to "make a list"; it is a rigid architectural contract.

When an agent triggers this skill, it is instructed to generate a Markdown document that follows a highly specific schema. This isn't just for human readability; it's designed so that the subsequent subagents can parse the tasks without ambiguity.

A typical task generated by `writing-plans` looks like this:

```markdown
### Task 1.2: Implement Authentication Token Validation

**Context**: We need to validate the JWT token on incoming API requests before allowing access to the protected routes.

**File to modify**: `src/middleware/auth.ts`

**Action**: Create a new middleware function `validateToken`.

**Code to write**:
- Import `jsonwebtoken` library.
- Extract the Bearer token from the `Authorization` header.
- Use `jwt.verify` with the `JWT_SECRET` environment variable.
- If valid, attach the decoded user payload to the `req` object and call `next()`.
- If invalid or missing, return a `401 Unauthorized` response with a JSON error message.

**Verification (TDD Requirement)**:
- Create `src/middleware/auth.test.ts`.
- Write tests for:
  - Missing token (returns 401).
  - Invalid signature (returns 401).
  - Expired token (returns 401).
  - Valid token (calls next() and attaches user to req).
```

### Why this Granularity Matters

Notice the level of detail here. The orchestrator agent does not say, "Add auth middleware." It specifies the file path, the exact logic flow, and critically, the exact edge cases that must be tested.

This granularity is the antidote to LLM hallucination. When the fresh subagent receives this task, it doesn't need to guess how the authentication should work. It doesn't need to invent a new abstraction. It simply executes the highly constrained technical spec.

If the plan was vague, the subagent might decide to implement a custom session-based auth system instead of JWT, or it might forget to handle the expired token edge case. By forcing the planning agent to think through these details upfront during the `writing-plans` phase, Superpowers ensures that the execution phase is purely mechanical.

## The Two-Stage Review Process

Another fascinating aspect of the `subagent-driven-development` skill is the mandatory two-stage review process. In a typical AI coding workflow, the agent writes the code, says "I'm done," and you review the diff.

Superpowers automates the initial layers of this review, mimicking a senior developer reviewing a junior's Pull Request.

Once a subagent completes a task (meaning the tests pass and the code is written), the orchestrator agent does not immediately merge the work or move to the next task. Instead, it pauses and performs two distinct reviews:

### 1. Spec Compliance Review
The orchestrator looks at the original task description in the plan and compares it to the subagent's implementation. Did the subagent build exactly what was asked?

If the task asked for a function that returns a boolean, and the subagent wrote a function that returns an object, the spec compliance review fails. The orchestrator will spawn a new "fixer" subagent, passing it the error: *"The implementation returns an object, but the spec requires a boolean. Fix the implementation and update the tests accordingly."*

This prevents feature creep and ensures the architecture remains aligned with the original design.

### 2. Code Quality Review
Only after the code passes the spec compliance check does the orchestrator evaluate code quality. This review looks for standard engineering best practices:
*   **DRY (Don't Repeat Yourself):** Did the subagent duplicate logic that already exists elsewhere in the codebase?
*   **YAGNI (You Aren't Gonna Need It):** Did the subagent over-engineer the solution by adding unnecessary abstractions or generic interfaces?
*   **Complexity:** Is the code overly complex or difficult to read? Are the variable names descriptive?

If the code is messy or over-engineered, the orchestrator will instruct a fixer subagent to refactor it.

This automated rigorous review loop is exhausting to watch in the terminal, but the output is pristine. It forces the AI to produce code that isn't just functional, but maintainable.

## The Future of Agentic Workflows

Working with Superpowers feels like peering into the future of software development. We are moving away from treating AI as a highly advanced autocomplete engine, and towards treating it as an active participant in an engineering organization.

The current implementation of Superpowers has its flaws—mostly stemming from the limitations of the underlying LLMs and the brittleness of prompt-based plugin architectures. The token costs are high, and the process is slow.

However, the core concepts—enforced isolation via subagents, mandatory test-driven development, explicit planning, and automated multi-stage reviews—are fundamentally sound engineering principles.

As LLMs become faster, cheaper, and possess larger, more reliable context windows, the friction of this methodology will decrease. Eventually, IDEs will likely build these concepts natively into their interfaces. You won't need to install a Markdown-based skill plugin; your editor will simply spin up secure, isolated containers for subagents, enforce testing visually, and orchestrate the workflow seamlessly.

Until then, for those building complex applications where correctness matters more than speed, Jesse Vincent's Superpowers framework offers the most rigorous, disciplined, and effective methodology available for taming the chaos of agentic AI. It requires patience and a willingness to embrace process, but the reward is a codebase you can actually trust.
