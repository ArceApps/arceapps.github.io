---
title: "OpenCode Subagents: Workflows, Use Cases, and Superpowers"
description: "Learn how to design agentic workflows with OpenCode subagents. Discover how to combine cheap and frontier AI models to automate tasks like Superpowers."
pubDate: 2026-06-26
lastmod: 2026-06-26
author: ArceApps
keywords:
  - "opencode"
  - "subagents"
  - "workflows"
  - "superpowers"
  - "automation"
canonical: "https://arceapps.com/en/blog/opencode-subagents-workflows/"
heroImage: "/images/opencode-subagents-workflows.svg"
tags: ["ai", "opencode", "agents", "architecture"]
category: ai-agents
reference_id: "e5a3c9b7-1f2d-4e8a-b9c0-8d7e6f5a4b3c"
---

> **Recommended Prerequisite Reading:** [Subagents in OpenCode](/en/blog/opencode-subagents) · [Inside Superpowers](/en/blog/superpowers-deep-dive) · [Orchestrating Agents in CI/CD](/en/blog/orquestar-agentes-pipeline-cicd)

A while ago, I wrote about the [fundamentals of subagents in OpenCode](/en/blog/opencode-subagents), explaining how to configure the `agents.json` file and the different modes of operation. Since then, my way of using them has evolved radically. I no longer see them simply as a shortcut to avoid typing long prompts, but as **architectural components to automate entire workflows**.

Today, we are going to dive much deeper. We'll look at how to design workflows by combining "cheap" agents (SLMs or fast models) for routine tasks with frontier agents (like Claude 3.5 Sonnet or GPT-4o) for deep reasoning. And most importantly: how to use this architecture to autonomously implement rigorous methodologies like [Superpowers](/en/blog/superpowers-deep-dive).

---

## The Economics of Subagents

When you start building multi-agent workflows, cost (both in tokens and latency) quickly becomes a bottleneck. You can't pass every minor decision to a heavy reasoning model.

The secret to efficient agent teams is **complexity routing**.

### Cheap Agents (SLMs / Fast Models)
Models like Haiku, Gemini Flash, or Llama 3 (8B) are perfect for **classification, extraction, and synthesis** tasks. In my current stack, I use these models for:

1. **The Router (Router Agent):** Analyzes the user's prompt and decides which specialized subagent to call.
2. **The Summarizer:** Condenses the context of long conversations before passing it to the primary agent, saving thousands of context tokens.
3. **The Syntax Checker (Linter Agent):** Reviews code for obvious syntax or style errors before wasting resources on a full testing cycle.

### Frontier Agents (Heavy-lifters)
Models like Claude 3.5 Sonnet or GPT-4o are reserved for **intensive tasks**:

1. **The Architect (Plan Agent):** Designs the solution structure and breaks the problem down into steps.
2. **The Security Reviewer (SecOps Agent):** Analyzes dependencies and code for complex vulnerabilities.
3. **The Core Code Generator (Build Agent):** Writes the actual business logic.

---

## Use Case 1: Automating "Superpowers"

If you've read my analysis of [Superpowers](/en/blog/superpowers-deep-dive), you'll know that it's a fantastic framework because it forces agents to apply rigorous Test-Driven Development (TDD). But running Superpowers manually requires a lot of oversight. This is where subagents shine.

We can create a workflow in OpenCode that automates the Superpowers cycle:

### Agent Configuration

In our `.opencode/agents.json`, we define three specific agents:

```json
{
  "agent": {
    "super-plan": {
      "description": "Creates the technical plan and test cases.",
      "mode": "subagent",
      "model": "anthropic/claude-3-5-sonnet",
      "temperature": 0.1,
      "permission": {
        "edit": "deny",
        "bash": "deny"
      }
    },
    "super-test": {
      "description": "Writes unit tests based on the plan.",
      "mode": "subagent",
      "model": "anthropic/claude-3-5-sonnet",
      "permission": {
        "edit": "allow",
        "bash": "allow"
      }
    },
    "super-code": {
      "description": "Implements the code to make the tests pass.",
      "mode": "subagent",
      "model": "anthropic/claude-3-5-sonnet",
      "permission": {
        "edit": "allow",
        "bash": "allow"
      }
    }
  }
}
```

### The Orchestrated Workflow

Instead of doing everything at once, the flow works like this:

1. We call `@super-plan` to analyze the requirement and generate a design document with the expected test cases.
2. Once approved, we call `@super-test`. This agent is **only** allowed to write test files and run `pnpm test`. Obviously, the tests will fail because there is no code yet. **This is the expected behavior in TDD.**
3. Finally, we invoke `@super-code`. Its only directive is: *"Read the output of the failing tests and write the minimum code necessary to make them pass"*.

By splitting the problem, we avoid the classic issue of the agent writing the code and tests at the same time, creating "happy path tests" that always pass but don't verify anything real.

---

## Use Case 2: Automatic Issue Triage (The Explorer Agent)

Another incredibly useful workflow for legacy projects or large codebases is **automatic triage**.

Often, we face a bug reported by a user: *"The login button doesn't work when I'm on Safari"*. Instead of opening the project and starting to search with `grep`, I use a cheap explorer agent.

```markdown
<!-- ~/.config/opencode/agents/triage.md -->
---
description: Analyzes a bug report and finds the problematic files
mode: subagent
model: google/gemini-1.5-flash
permission:
  edit: deny
  bash: allow
---

You are a triage agent. Your goal is not to fix the bug, but to find where it is.
Use bash commands like `find`, `grep`, and `cat` to search the codebase.
When you find the relevant files, provide a 3-line summary explaining
which component might be failing and which files the developer should look at.
```

This agent uses an ultra-fast and cheap model. Its job is to do the code "archaeology." Once `@triage` tells me the problem is in `src/components/Auth/LoginButton.tsx`, I can invoke my main agent (the expensive model) passing that file directly, saving time and context.

---

## Use Case 3: The "Paranoid Reviewer" (SecOps)

AI-generated code tends to be functional, but not always secure. Blindly trusting a single model to write and review its own code is an anti-pattern.

For this, I configure a strict security review subagent:

```json
{
  "agent": {
    "paranoia-review": {
      "description": "Reviews code for vulnerabilities before commit.",
      "mode": "subagent",
      "model": "anthropic/claude-3-5-sonnet",
      "prompt": "You are an extremely strict security auditor. Look for SQL injections, XSS, exposed tokens, and business logic vulnerabilities. DO NOT suggest style improvements, ONLY serious security issues.",
      "temperature": 0.0
    }
  }
}
```

The key here is the prompt and the temperature of `0.0`. We want this agent to be deterministic and focus exclusively on one domain: security. Before pushing to production, I run `@paranoia-review review recent changes` as the final step in my workflow.

---

## Conclusion

The true power of OpenCode does not lie in having a chat integrated into your terminal, but in its ability to act as an **orchestrator**.

By starting to treat subagents as specialized atomic functions—some cheap and fast for exploration, others heavy and methodical for implementation—you transform your development environment from a simple code generator into a genuine software assembly line.

The next time you face a complex task, don't ask your main agent to do it all. Ask yourself: *How would a real engineering team divide this?* And then, create the subagents to replicate that team.
