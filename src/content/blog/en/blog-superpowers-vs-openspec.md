---
title: "Agentic Engineering Methodologies: Superpowers vs OpenSpec"
description: "A deep dive comparison of two distinct approaches to AI software development: the skill-based methodology of Superpowers and the artifact-guided workflow of OpenSpec."
pubDate: 2026-04-12
heroImage: "/images/blog-superpowers-vs-openspec.svg"
tags: ["SDD", "AI", "Superpowers", "OpenSpec", "Agentic AI", "Methodology", "Workflow", "Productivity"]
reference_id: "e4d2a1c9-6f8b-4a3d-8e7c-2b1d9f4a5c6d"
---

> **Related reads:** [Spec-Driven Development with Agentic AI](/blog/spec-driven-development-ai) · [Alternative Paradigms in AI-Assisted Engineering](/blog/alternative-paradigms-ai-software-engineering) · [SDD Frameworks Deep Dive](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad)

When I started bringing AI coding agents into my daily workflow for ArceApps, the honeymoon phase didn't last long. Initially, it felt like magic: drop a prompt into the chat, watch the code pour out, and hit commit. But as the applications grew in complexity, so did the friction. Agents would hallucinate architectural decisions, overwrite perfectly good abstractions with naive implementations, and worst of all, silently break existing behavior because they lacked the broader context of what I was trying to build.

The core issue wasn't the LLM's reasoning capability; it was the lack of a structured **methodology**. We wouldn't let a junior developer loose on a production codebase without a technical spec, a clear plan, and a code review process. Yet, we routinely expect AI agents to magically intuit our architectural intent from a three-sentence prompt.

This realization led to the rise of Spec-Driven Development (SDD) and agentic frameworks. In a previous article, I analyzed [GitHub Spec Kit, OpenSpec, and BMAD-METHOD](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad). Today, I want to pit two of the most fascinating approaches against each other: [Superpowers](https://github.com/obra/superpowers) and [OpenSpec](https://github.com/Fission-AI/OpenSpec).

Both tools aim to solve the same problem—keeping AI agents aligned and preventing context collapse—but they approach it from completely different philosophical angles. Superpowers is a prescriptive, skill-based methodology that enforces strict engineering practices like Test-Driven Development (TDD). OpenSpec, on the other hand, is an artifact-guided workflow that focuses on creating living documentation before any code is written.

In this deep dive, we'll explore how these frameworks work under the hood, compare their philosophies, and discuss which one might fit your indie dev workflow. As a solo developer building projects on nights and weekends, my tolerance for boilerplate and ceremony is incredibly low. I need tools that amplify my intent, not systems that turn me into a project manager for my own side projects. Let's see how these two stack up.

## The Evolution of AI Coding: From Chat to Methodology

Before we compare the specific frameworks, we need to understand the evolution of how we interact with AI agents.

### Generation 1: The Copilot Era
The first generation was inline code completion. You write a comment, the AI suggests the next few lines. It was useful for boilerplate, but it didn't fundamentally change how software was designed. The context was limited to the active file and perhaps a few open tabs.

### Generation 2: The Chat Era
The second generation brought the chat interface into the IDE. You could highlight a block of code and ask the AI to refactor it, or paste an error message and ask for a fix. This was a massive leap forward, but it still relied on the developer to hold the entire mental model of the application. The AI was a smart intern that you had to micromanage.

### Generation 3: The Agentic Era
We are now in the third generation, where tools like Claude Code, Cursor, and OpenCode can execute complex tasks across multiple files. They can run shell commands, read logs, and modify the codebase autonomously. But with this power comes a new class of problems. When an agent is given the freedom to roam a repository, it can easily lose sight of the original goal. It might refactor a core utility class while trying to fix a minor UI bug, leading to cascading failures.

This is where methodologies become critical. Just as Agile and Scrum provided structure for human teams, we now need frameworks for human-AI collaboration. The goal is to constrain the agent's autonomy within defined boundaries, ensuring that its actions are aligned with our intent.

This brings us to Superpowers and OpenSpec. Both are responses to the chaos of unconstrained agentic coding, but they represent two distinct philosophies: the **Process-Oriented** approach (Superpowers) versus the **Artifact-Oriented** approach (OpenSpec).



## Superpowers: The Process-Oriented Methodology

[Superpowers](https://github.com/obra/superpowers), developed by Jesse Vincent and the team at Prime Radiant, describes itself as "a complete software development methodology for your coding agents."

If I had to summarize Superpowers in one sentence, it would be: **"Do it right, or don't do it at all."**

### The Core Philosophy

Superpowers is deeply opinionated. It doesn't just want to help you write code faster; it wants to force you to write code *better*. It acts almost like a strict senior mentor looking over your agent's shoulder, enforcing rigorous engineering standards.

The framework is built on a set of composable "skills" that trigger automatically based on the context of the conversation. These skills aren't just prompts; they are executable workflows that guide the agent through specific phases of development.

The defining characteristic of Superpowers is its absolute, uncompromising insistence on **Test-Driven Development (TDD)**. It literally refers to this as "The Iron Law": *No production code without a failing test first*. If the agent tries to write implementation code before a test, the methodology instructs it to delete the code and start over. For a solo developer used to hacking things together late at night, this level of discipline can be jarring, but it is undeniably effective at preventing regressions.

### The Workflow Phases

When you start a task with a Superpowers-enabled agent, you don't just get code. You get a structured process:

1.  **Brainstorming**: Before writing a single line, the agent stops and asks questions. It refines rough ideas, explores alternatives, and presents a design document in digestible chunks for your validation. This prevents the "rush to implementation" that often plagues AI interactions.
2.  **Using Git Worktrees**: Once the design is approved, Superpowers enforces isolation. It creates a dedicated git worktree on a new branch, ensuring a clean test baseline. This means the agent isn't polluting your main workspace with experimental code.
3.  **Writing Plans**: The agent breaks the validated design down into bite-sized tasks, typically taking 2-5 minutes each. Every task in the plan includes exact file paths, the code to be written, and the verification steps required to prove it works.
4.  **Subagent-Driven Development (SDD)**: This is where Superpowers truly shines. Instead of executing the entire plan in a single massive context window, it dispatches *fresh subagents* for each individual task. This is a brilliant solution to context collapse. Each subagent only knows about its specific task, preventing it from getting confused by previous steps or unrelated code.
5.  **Test-Driven Development**: As mentioned, this runs concurrently with implementation. The agent must write a failing test, watch it fail, write minimal code to make it pass, and then commit.
6.  **Code Review**: Between tasks, a separate review agent acts as a quality gate, checking the implementation against the plan and reporting issues by severity. Critical issues block progress until resolved.
7.  **Finishing**: Once all tasks are complete, the agent verifies the entire test suite, presents options for merging or creating a PR, and cleans up the worktree.

### The Good, The Bad, and The Strict

**What I love about Superpowers:**
The isolation provided by subagents and git worktrees is phenomenal. It treats AI agents the way we treat modular code: small, focused, and independently verifiable. The strict adherence to TDD, while sometimes frustrating when you just want to prototype, results in remarkably stable code. It genuinely feels like working with a disciplined engineering team rather than a chaotic autocomplete engine.

**The friction points:**
Superpowers is heavy. It's an entire methodology imposed upon your workflow. If you just want a quick script or a CSS tweak, the brainstorming and planning phases feel like massive overkill. Furthermore, it relies heavily on the capabilities of the underlying agent harness (like Claude Code or Codex CLI). If the harness doesn't support subagents robustly, the entire methodology falls back to a much less effective sequential execution mode, which can quickly consume context windows.

## OpenSpec: The Artifact-Guided Workflow

While Superpowers focuses on strict process and execution guardrails, [OpenSpec](https://github.com/Fission-AI/OpenSpec) takes a fundamentally different route. Developed by Fission AI, OpenSpec is an **artifact-guided workflow**.

If Superpowers is a strict senior engineer enforcing TDD, OpenSpec is a pragmatic technical product manager helping you write a clear Spec before you hand it off to the dev team.

### The Core Philosophy

OpenSpec is built around four principles:
1.  **Fluid not rigid:** There are no hard phase gates. You can work on what makes sense at any given moment.
2.  **Iterative not waterfall:** You learn as you build and refine the spec as you go.
3.  **Easy not complex:** It boasts lightweight setup and minimal ceremony.
4.  **Brownfield-first:** It is explicitly designed to work with existing codebases, focusing on specifying *changes* rather than describing entire systems from scratch.

Unlike the heavy methodology of Superpowers, OpenSpec operates via slash commands (e.g., `/opsx:propose`, `/opsx:apply`) within your coding assistant's chat interface. It acts as a lightweight layer over your existing workflow rather than completely replacing it.

### The Artifact Lifecycle

OpenSpec organizes your work into distinct, version-controlled artifacts, stored in a dedicated `openspec/` directory in your project root. The workflow revolves around creating and refining these documents:

1.  **The Source of Truth (`specs/`)**: This directory contains the living documentation of how your system *currently* works.
2.  **The Proposal (`changes/<change-name>/`)**: When you want to build a new feature, you run `/opsx:propose <feature-name>`. OpenSpec doesn't write code; it generates a structured folder for the change containing:
    *   `proposal.md`: Why we are doing this and what is changing.
    *   `specs/`: "Delta specs" defining the specific requirements and scenarios for this feature.
    *   `design.md`: The technical approach and architecture.
    *   `tasks.md`: The implementation checklist.

This step is crucial. You and the AI align on these markdown documents. You review them, edit them manually if necessary, and ensure the agent perfectly understands the intent before moving forward.

3.  **Implementation (`/opsx:apply`)**: Once the artifacts are approved, you command the agent to implement the tasks defined in `tasks.md`. The agent uses the delta specs and design documents as its context, reducing hallucinations.
4.  **Synchronization and Archiving (`/opsx:sync`, `/opsx:archive`)**: After the code is written and verified, OpenSpec merges the delta specs back into the main source of truth (`specs/`) and archives the change proposal, keeping your documentation perfectly up-to-date with your codebase.

### The Good, The Bad, and The Fluid

**What I love about OpenSpec:**
OpenSpec is incredibly respectful of the developer's time and existing workflow. The "brownfield-first" approach is a breath of fresh air; most of my time is spent modifying ArceApps, not starting from `astro new`. By forcing the AI to generate a `design.md` and `tasks.md` first, I get a clear, readable contract of what it intends to do. If the design is wrong, I fix the markdown file, not the code. It drastically reduces the "AI churn" of generating code, realizing it's wrong, and trying to prompt it back on track.

**The friction points:**
OpenSpec provides the artifacts, but it doesn't strictly enforce *how* the implementation happens. Unlike Superpowers, it won't force the agent to write tests first, nor will it inherently dispatch parallel subagents (though you could theoretically combine OpenSpec artifacts with a subagent-capable harness). If your agent goes rogue during the `/opsx:apply` phase and ignores the `tasks.md`, OpenSpec doesn't have the deep process hooks to stop it, relying entirely on the underlying agent's adherence to instructions.


## Head-to-Head Comparison

To truly understand which framework fits your style, let's compare how they handle the critical stages of software development.

### 1. Planning and Context Management

**Superpowers** manages context through conversation and rigorous planning skills. It relies heavily on the agent's ability to interview you, extract the requirements, and formulate a plan dynamically. The plan is an ephemeral state within the agent's active memory or temporary files.

**OpenSpec** externalizes context into durable markdown files. The plan is a concrete set of artifacts (`proposal.md`, `design.md`, `tasks.md`). This means the context is version-controlled, easily readable by humans, and can be paused and resumed days later without losing state.

*Winner here depends on preference. If you want the AI to manage the process internally, Superpowers is smoother. If you want explicit, reviewable documents that act as contracts, OpenSpec is superior.*

### 2. Execution and Implementation

**OpenSpec** tells the agent *what* to do (via `tasks.md`) but largely leaves the *how* up to the agent's default behavior. It's a handoff: "Here is the spec, go build it."

**Superpowers** dictates exactly *how* the code is written. It enforces the Red-Green-Refactor TDD cycle, demands git worktree isolation, and utilizes a complex subagent architecture to execute tasks independently. It is highly structured execution.

*Superpowers wins the execution phase hands down. Its use of subagents to prevent context pollution during implementation is a game-changer for complex features.*

### 3. Flexibility vs. Rigidity

**OpenSpec** embraces fluidity. If you are halfway through implementation and realize the design needs a tweak, you just edit the `design.md` and continue. It doesn't force you into rigid phase gates.

**Superpowers** is rigid by design. "Violating the letter of the rules is violating the spirit of the rules," its documentation states. If you try to skip writing a test, it will fight you. If you try to shortcut the planning phase, it will resist.

*For indie hackers and rapid prototyping, OpenSpec's flexibility is much more accommodating. For mission-critical infrastructure where stability is paramount, Superpowers' rigidity is a feature, not a bug.*

## The Indie Developer Verdict

So, which one am I adopting for ArceApps?

The reality of being an indie developer is that you have limited hours. You need tools that maximize your leverage without bogging you down in enterprise-level ceremony.

If I am building a highly complex, isolated backend service—say, a new authentication flow or a critical data migration script—I want **Superpowers**. The guarantee of TDD and the safety of subagent isolation are worth the upfront investment in conversation and planning. It acts as the rigorous pair programmer I don't have.

However, for 80% of my daily work—adding new UI components to the Astro portfolio, writing blog posts, tweaking Tailwind styles, or implementing standard CRUD features—**OpenSpec** is the clear winner. Its "brownfield-first" approach maps perfectly to how I actually work. I love being able to run `/opsx:propose add-dark-mode`, review a cleanly generated markdown file detailing exactly what CSS variables will be touched, and then approve the implementation. It provides just enough structure to prevent hallucinations without feeling like a straitjacket.

### The Ultimate Stack?

The holy grail of agentic engineering might not be choosing between them, but combining their strengths. Imagine a workflow where you use OpenSpec to generate the durable, version-controlled artifacts (`design.md`, `tasks.md`), and then hand those exact tasks off to a Superpowers-style subagent orchestrator that enforces TDD during the execution of each specific task.

We are still in the early days of Spec-Driven Development. Both Superpowers and OpenSpec are brilliant attempts to tame the chaos of LLM coding. They prove that the future of AI engineering isn't just about better models; it's about better methodologies.

As we move toward 2026, the developers who thrive won't be the ones who can write the fastest prompts. They will be the ones who know how to architect clear specifications and orchestrate agents effectively within structured frameworks. Whether you lean toward the strict discipline of Superpowers or the fluid documentation of OpenSpec, adopting a structured methodology is the only way to scale your solo development efforts without losing your mind.

## A Deeper Technical Dive: Integrating with Existing Tooling

To fully appreciate the divergence between these two frameworks, we must look at how they integrate with the developer's existing ecosystem. This isn't just about abstract philosophy; it's about what happens in your terminal and your IDE.

### Superpowers: The Harness Dependency

Superpowers is fundamentally a set of advanced prompt engineering techniques and workflow scripts that must be injected into an existing agent "harness." It explicitly supports tools like Claude Code, Codex CLI, Cursor, and GitHub Copilot CLI.

The integration relies on the concept of "Skills." When you install Superpowers into Claude Code, for example, you are essentially loading a library of pre-defined behaviors (`test-driven-development`, `subagent-driven-development`, `writing-plans`). The framework relies on the underlying LLM to recognize the context of your request and autonomously trigger the appropriate skill.

This creates a highly magical experience when it works perfectly. You say, "I need to fix the authentication bug," and the agent autonomously decides to trigger the `systematic-debugging` skill, asks you probing questions, formulates a hypothesis, creates a git worktree, writes a failing test, and fixes the bug.

However, this deep integration has a significant downside: **Brittle Harness Dependency**. If Claude Code updates its internal system prompt, or if the LLM's behavior drifts, the trigger mechanisms for Superpowers' skills can break. The framework is constantly fighting against the native tendencies of the underlying agent. Furthermore, the most powerful feature—subagent dispatching—is entirely dependent on whether the host harness supports spawning parallel, isolated agent instances. If you are using a harness that only supports sequential chat history, Superpowers loses its biggest advantage and becomes a very token-heavy conversational partner.

### OpenSpec: The CLI Agnostic Approach

OpenSpec, conversely, takes a more decoupled approach. It is primarily a Node.js CLI tool (`npm install -g @fission-ai/openspec`) that manages the file system.

The "integration" with your coding agent is much looser and more resilient. OpenSpec generates the `/openspec` directory and the markdown artifacts. It then relies on the coding agent (whether it's Cursor, Windsurf, or a simple terminal integration) to read those files as standard context.

When you type `/opsx:propose` in your AI chat interface, you aren't triggering a complex internal LLM state machine like in Superpowers. You are simply running a command that tells the OpenSpec CLI to scaffold some folders and generate a markdown template based on your prompt.

This decoupled architecture makes OpenSpec incredibly resilient. It doesn't care if you switch from Claude 3.5 Sonnet to GPT-4o, or if you move from Cursor to a custom CLI tool. As long as the agent can read markdown files in your repository, OpenSpec works. The artifacts—`proposal.md`, `design.md`, `tasks.md`—are universally understood formats.

This resilience makes OpenSpec much easier to adopt for a solo developer who might be experimenting with different AI coding tools. You aren't locking yourself into a specific harness's plugin ecosystem.

## Real-World Scenarios: Where They Shine

Let's ground this comparison in practical, everyday scenarios I encounter while maintaining the ArceApps portfolio.

### Scenario A: The UI Component Refactor

**The Task:** I need to refactor the blog card component (`BlogCard.astro`) to use the new logical CSS properties defined in Tailwind v4, ensuring RTL compatibility without changing the visual design.

**Using Superpowers:**
The agent would likely trigger the `brainstorming` skill, asking me clarifying questions about RTL edge cases. It would then create a new worktree, write a test suite verifying the visual layout (which is notoriously difficult for UI components without visual regression testing), and then implement the CSS changes. The overhead of TDD for purely stylistic CSS refactoring is immense and often counterproductive. I would spend more time arguing with the agent about testing CSS classes than actually writing the CSS.

**Using OpenSpec:**
I would run `/opsx:propose refactor-blog-card-css`. It generates a `design.md` noting the shift to logical properties (e.g., changing `ml-4` to `ms-4`). I approve the markdown. I run `/opsx:apply`. The agent reads the design, modifies `BlogCard.astro`, and finishes. Quick, clean, and perfectly aligned with the task's complexity.

### Scenario B: Implementing a Complex Search Algorithm

**The Task:** I need to replace the basic client-side search with a custom TF-IDF indexing script that runs during the Astro build process and outputs a highly optimized JSON index for the client to consume.

**Using OpenSpec:**
I propose the change, and OpenSpec generates a solid design document detailing the TF-IDF math and the Astro integration points. I apply the change. The agent attempts to write the build script and the client-side consumer in one go. Because the task spans multiple architectural boundaries (Node.js build step vs. browser-side hydration) and requires precise mathematical logic, the agent gets confused halfway through `tasks.md`. It hallucinates a missing dependency, breaks the Astro build, and I have to step in, revert the changes, and manually guide it step-by-step.

**Using Superpowers:**
The agent recognizes the complexity and triggers `writing-plans`. It breaks the TF-IDF algorithm into small, mathematically verifiable functions. It triggers `subagent-driven-development`. Subagent A writes a test for the term frequency calculation, watches it fail, and implements the math perfectly. Subagent B handles the inverse document frequency. Subagent C writes the Astro integration test. Because each subagent operates in an isolated context, they don't confuse the build script logic with the client-side UI logic. The rigorous TDD ensures the math is correct before it ever touches the Astro build process. The feature lands perfectly, fully tested.

## Conclusion: Engineering is Contextual

The comparison between Superpowers and OpenSpec is not about finding the "best" tool in a vacuum; it is about finding the right tool for the specific context of your engineering challenge.

Superpowers is the heavy cavalry. It brings rigorous engineering discipline, enforced testing, and advanced isolation techniques to AI coding. It is ideal for complex, algorithmic, or mission-critical backend work where correctness is non-negotiable.

OpenSpec is the agile infantry. It provides lightweight, artifact-driven structure that respects your existing workflow and scales seamlessly with brownfield projects. It is perfect for the day-to-day feature development, UI tweaks, and rapid iterations that define the indie developer experience.

For the ArceApps portfolio, I find myself reaching for OpenSpec the vast majority of the time. Its fluid nature and markdown-based contracts fit perfectly with a project built on Astro and static content. However, knowing that tools like Superpowers exist—and understanding the philosophy behind subagent isolation and strict TDD enforcement—has profoundly changed how I write prompts and structure my own workflows, even when I'm not explicitly using the framework.

Ultimately, the shift towards Spec-Driven Development is the most important takeaway. Whether you choose the strict process of Superpowers or the fluid artifacts of OpenSpec, moving away from unstructured chat and toward defined methodologies is the key to unlocking the true potential of AI agents in software engineering.
