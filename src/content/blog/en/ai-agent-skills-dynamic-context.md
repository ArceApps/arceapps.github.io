---
title: "AI Agent Skills: Dynamic Context and Memory"
description: "Learn how to implement dynamic context in AI agents to improve memory and relevance. Practical tips for Android and beyond."
pubDate: 2025-05-24
heroImage: "/images/agent-skills-context.svg"
tags: ["AI", "Context", "Agents", "Memory", "LLM"]
reference_id: "791beb65-8337-4519-a0c9-916950056683"
---

The biggest limitation of AI Agents today is not "reasoning" (they reason quite well), but **Memory** and **Context**.

A "Skill" (like checking your GitHub issues or reading your code) is only useful if the agent knows *when* and *how* to use it. This requires giving the agent the right context at the right time.

## 🧠 The Context Problem

Imagine you tell an AI: "Fix the bug in the login screen."

Without context, the AI might hallucinate:
*   "Which login screen?"
*   "What bug?"
*   "Are you using XML or Compose?"

The standard solution is RAG (Retrieval-Augmented Generation), where we fetch relevant code chunks. But for **Skills**, we need something smarter. We need **Dynamic Context**.

## 🔄 Dynamic Context Injection

Instead of stuffing everything into the prompt (Context Window overflow!), we want the Skill itself to *declare* what context it needs.

### Example: The "Android Expert" Skill

If I activate the `android-expert` skill, it shouldn't just be a prompt saying "You are an Android expert." It should dynamically inject:
1.  **Project Structure**: `tree -L 2 src/` (output of command).
2.  **Dependencies**: Content of `libs.versions.toml`.
3.  **Recent Changes**: `git diff HEAD~1`.

By injecting this context *only when the skill is active*, we keep the main prompt clean and the agent focused.

## 🛠️ Implementing Dynamic Context

In a tool like **Cline** or **Cursor**, we can use `@` symbols to reference context.
*   `@Codebase`: Indexes your files with embeddings.
*   `@File`: Reads a specific file.

But for custom agents (e.g., using LangChain or simple API calls), we can structure our skills like this:

```kotlin
interface Skill {
    val name: String
    val description: String

    // The "magic" part: dynamic context
    suspend fun getContext(query: String): String
}

class GitSkill : Skill {
    override val name = "Git Expert"
    override val description = "Handles git operations and context."

    override suspend fun getContext(query: String): String {
        // Only inject diff if the user asks about "changes" or "commit"
        if (query.contains("change") || query.contains("commit")) {
            return "Current diff:\n" + runCommand("git diff --staged")
        }
        return ""
    }
}
```

## 🧩 Context Routing

An advanced pattern is **Context Routing**. An "Orchestrator" LLM decides which skills (and thus which context) are relevant for the query.

1.  **User**: "Why is the build failing?"
2.  **Orchestrator**: "I need the `BuildSkill` and `LogAnalysisSkill`."
3.  **BuildSkill Context**: Loads `build.gradle.kts`.
4.  **LogAnalysisSkill Context**: Loads the last 50 lines of `build.log`.
5.  **Agent**: "The build failed because of dependency conflict in `build.gradle.kts` (line 45)..."

## 🏁 Key Takeaway

Static prompts are dead. To build truly intelligent agents, we must move to **Dynamic Context**.

*   Don't dump your whole wiki into the prompt.
*   Let each Skill define its own "mini-context".
*   Inject that context only when relevant.

This approach saves tokens, reduces hallucinations, and makes your agents feel much smarter.
