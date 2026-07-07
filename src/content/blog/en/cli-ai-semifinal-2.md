---
title: "AI CLI Match 2: Codex vs Hermes vs Qwen vs Sweep"
description: "The second CLI agent semifinal. We pit Codex, Hermes, Qwen Agent, and Sweep against each other in the terminal to decide who advances to the Grand Final."
pubDate: 2026-07-01
lastmod: 2026-07-01
author: "ArceApps"
heroImage: "/images/cli-ai-semifinal-2.svg"
tags: ["AI", "CLI", "Agents", "Codex", "Hermes"]
reference_id: "05ddb988-cd84-466b-9336-6bf5ab96a7e7"
keywords: ["CLI AI Match", "Codex CLI", "Hermes", "Qwen Agent", "Sweep", "AI terminal agents"]
canonical: "https://arceapps.com/blog/cli-ai-semifinal-2/"
---

## 🌩️ Storm in the Terminal: The Second Semifinal

After a heart-stopping first semifinal where Cline and OpenCode demonstrated why they are the current kings of the terminal, we arrive at the second bracket of this Artificial Intelligence agent tournament. As an indie developer, my time is my most valuable resource. If a CLI agent wastes my time fixing its syntax errors, it has no place in my stack. I need tools that act like a Senior pair-programmer in my terminal, not like an intern I have to micromanage.

In this ring, we have four contenders with radically different philosophies: **Codex CLI**, the minimalist, hyper-optimized bet for the cloud; **Hermes**, the messenger god of open source with unprecedented local orchestration capabilities; **Qwen Agent**, the Asian giant redefining the use of complex tools; and **Sweep**, the asynchronous agent that has come down from GitHub to live directly in your console.

Just like in the first semifinal, only two will survive and advance to the Grand Final to face Cline and OpenCode.

---

## 📋 Methodology Reminder

We will evaluate the agents in the same five categories, scoring out of 10:

1. **Setup & Architecture (Setup & Arch):** Installation, dependencies, and initial friction.
2. **Integration and Extensibility (Extensibility):** Ecosystem, plugins, and MCP support.
3. **User Interface Design and UX (Design & UX):** Readability, diffs, and terminal experience.
4. **Features and Performance (Features & Perf):** Autonomy, token management, speed, and accuracy.
5. **Real-World Test (Real-World Test):** Autonomous refactoring in a Kotlin project.

Let the bell ring!

---

## 🟢 Contender 1: Codex CLI - The Cloud Minimalist

Not to be confused with OpenAI's old model, "Codex CLI" is a new tool written in Zig that burst onto the scene in 2026 promising one thing: light speed, assuming you are always connected to the internet.

### Setup and Architecture

Written in Zig, the binary is absurdly small (barely 4MB). It requires no runtime, no dependencies.

```bash
# Installation with a modern package manager
brew install codex-cli
codex auth --provider openai
```

Its architecture is purely *Cloud-Native*. Unlike other agents that tokenize and vectorize your repository locally, Codex packages your project (using smart ignores via `.gitignore`) and sends it to its own cloud for semantic processing. This makes the local setup a 10/10 in simplicity, but raises serious privacy concerns if you work with highly sensitive code.

### Integrations and Extensibility

Codex CLI is closed by design. It does not support MCP or third-party local plugins. Its premise is that all "tooling" happens in the cloud.

If you need the agent to run a linter, Codex doesn't run it on your local machine. It sends the command, executes it in an ephemeral cloud container that has a replica of your environment, and returns the result. It's a fascinating and extremely safe approach for your host machine (zero risk of the AI running `rm -rf /` on your laptop), but it makes extending it with your own local Python scripts impossible.

### Design and User Experience (UX)

The UX is pure, hard, and spartan, but incredibly polished. It uses simple ASCII animations to denote that it's thinking. Its diffs are rendered using the `delta` standard (if you have it installed on your system), giving it an appearance identical to doing a `git diff`.

- **Strengths:** Native integration with `delta` or `bat` to display code. Zero interface lag.
- **Weaknesses:** By delegating everything to the cloud, if your internet connection fluctuates, the UX degrades instantly, leaving the terminal frozen with no clear feedback.

### Features and Performance

By using dedicated clusters to index your code, the RAG (Retrieval) is best-in-class. When you ask it to find where an interface is defined, it doesn't search by regex; it makes a semantic query to its remote database that returns results in milliseconds.

Code injection is standard (search and replace), but it is heavily backed by the largest LLMs available, which reduces the failure rate.

### Real-World Test

I asked Codex CLI to abstract some Kotlin form validation logic that was repeated across 4 different Fragments and move it into a shared base `ViewModel`.

**Result:** It solved the problem conceptually perfectly. However, when trying to apply the changes, the cloud container where it ran the test build did not have the correct JDK version (17 instead of the 21 I use locally). So it assured me the code worked, but when downloading it to my machine, local compilation failed due to the use of *Pattern Matching* introduced in Java 21/Kotlin 2.0. A brutal disconnect between the cloud and local environments.

### Codex CLI Scores:
- Setup & Arch: 9/10
- Extensibility: 3/10
- Design & UX: 8/10
- Features & Perf: 8/10
- Real-World Test: 5/10 (Failed due to environment discrepancy)
- **Total: 33/50**

---

## 🟡 Contender 2: Hermes - The God of Local Orchestration

Hermes is the current darling of the Indie and Open Source community. Written entirely in TypeScript (compiled to native binaries with Bun), it is designed to be the central node of your operating system, not just a coding agent.

### Setup and Architecture

Using Bun under the hood, Hermes's execution speed rivals Go or Rust. Its initialization is slightly more complex, as it invites you to define a complete "Workspace."

```bash
bun install -g @hermes-ai/cli
hermes init --workspace-type android
```

Hermes shines in its state management. It uses a local SQLite database to maintain conversation history, dependency maps, and a vector embedding cache. Its architecture is geared towards *Local-First*, prioritizing SLMs (Small Language Models) running on your machine via llama.cpp for trivial tasks and only calling paid APIs when strictly necessary.

### Integrations and Extensibility

This is a hacker's paradise. Hermes implements the MCP (Model Context Protocol) standard perfectly, but goes further with its *Sub-agents* system.

You can define in its configuration that, for UI tasks, Hermes should delegate to a sub-agent specifically configured with a vision model and give it access to screen capture tools (using Playwright).

```typescript
// hermes.config.ts
export default defineConfig({
  agents: {
    coder: { model: 'claude-4.6', role: 'software_engineer' },
    reviewer: { model: 'llama-3-70b-local', role: 'security_auditor' }
  },
  mcp: ["@mcp/android-adb-tool"]
});
```

If you give it permissions, Hermes can compile your app, install it on an emulator via ADB, take a screenshot, visually analyze it, and correct the XML/Compose. It's witchcraft.

### Design and User Experience (UX)

Hermes's interface is interactive and rich. It uses hyper-vitaminized Inquirer.js components.

- **Strengths:** When Hermes proposes a change across multiple files, it shows you an interactive tree in the terminal. You can use the arrow keys to expand each file, see the diff, and "cherry-pick" by accepting only certain modifications before applying. This gives you absolute control.
- **Weaknesses:** Sometimes it gets too excited printing "Delegating to sub-agent X..." logs that clutter the terminal history.

### Features and Performance

Hermes's latency is slightly higher at first because it tries to do much of the reasoning (like task routing) using local models. Its patching engine uses AST for supported languages (TS, Python) but falls back on unified diffs for Kotlin, which sometimes requires manual intervention if the files are very long.

### Real-World Test

I asked Hermes to implement a structured logging system across 20 files of the Android app, replacing the classic `Log.d()`.

**Result:** Hermes understood the magnitude of the task. Instead of trying to do it all at once and overflowing its context, it divided the work itself into 4 batches. It edited the files, ran `./gradlew lint` locally (discovering it had broken a ktlint rule in batch 2), auto-corrected itself, and finished the task in 5 minutes. The interactive diff control allowed me to review its work comfortably.

### Hermes Scores:
- Setup & Arch: 8/10
- Extensibility: 10/10
- Design & UX: 9/10
- Features & Perf: 9/10
- Real-World Test: 9/10
- **Total: 45/50**

---

## 🔴 Contender 3: Qwen Agent - The Tool Giant

Straight from Alibaba's labs, Qwen Agent is a Python framework designed explicitly to squeeze the Qwen-Max and Qwen-Coder models. It is a heavy agent, intended for research environments and corporate pipelines, but has found its niche in the CLI.

### Setup and Architecture

Its Python dependency is strong and requires heavy packages. It is not a lightweight tool.

```bash
pip install qwen-agent[all]
qwen-cli start
```

Qwen Agent's architecture is centered on "Long-Term Memory" and complex tool use (Function Calling). Internally, it spins up a local service that indexes not only your code but your PDF requirement documents, exported Jira tickets, etc. It is a context-devouring monster.

### Integrations and Extensibility

Qwen Agent shines in enterprise integrations but limps in modern indie tools (it doesn't natively support MCP).

Its plugin system requires writing quite verbose Python classes inheriting from its base classes. You can't just pass it a bash script and say "use this." You have to define the complete JSON schema for input and output, which generates a lot of friction for quick tasks.

### Design and User Experience (UX)

UX is its Achilles heel. Qwen Agent feels like a Jupyter Notebooks research tool that was forcibly stuffed into a terminal.

- **Strengths:** It can generate graphs (like class dependencies) and, if your terminal supports image protocols (like iTerm2 or Kitty), it renders images directly in the console.
- **Weaknesses:** Text formatting is clunky. Diffs are sometimes shown as uncolored plain text. It frequently prints entire JSON dictionaries in the terminal when a tool call fails, completely breaking immersion.

### Features and Performance

Where Qwen Agent fails in UX, it makes up for with logical reasoning and an astounding understanding of complex architectures. If you pass it an undocumented legacy monolithic repository, it is the best of the 4 contenders at deducing how the system works by reading spaghetti code.

### Real-World Test

The challenge for Qwen Agent was tough: "Analyze the `PaymentProcessor.kt` class, find a possible *race condition* in the UI state update, and apply a Mutex or safe concurrent flow to fix it."

**Result:** Qwen Agent read the class, deduced the architecture (identified it was using an old MVP instead of MVVM), and wrote an impeccable technical explanation about the *race condition*. It proposed a solution using coroutine `Mutex`. However, its mechanism for writing the file failed spectacularly, overwriting the entire class with only the modified function, erasing the rest of the methods. I had to use Git to recover the file. A brilliant brain in a clumsy body.

### Qwen Agent Scores:
- Setup & Arch: 6/10
- Extensibility: 6/10
- Design & UX: 4/10
- Features & Perf: 9/10 (Pure reasoning)
- Real-World Test: 4/10 (Code destruction)
- **Total: 29/50**

---

## 🟣 Contender 4: Sweep - The Asynchronous Assistant

Sweep was born as a GitHub bot that read issues and created Pull Requests. In 2026, they launched their native CLI version (`sweep-cli`), bringing all that asynchronous power directly to the local terminal.

### Setup and Architecture

Written in Python and elegantly packaged, Sweep CLI acts as a daemon on your system.

```bash
pipx install sweep-cli
sweep daemon start
```

Its architecture is unique: it is not intended for synchronous "chat." It is designed to throw tasks to the background and keep working. You write the requirement in a markdown file (e.g., `task.md`) and run `sweep run task.md`. Sweep takes control in the background, creating a Git branch, applying changes, running tests, and when it finishes, it shows you an OS notification.

### Integrations and Extensibility

Sweep is deeply integrated with Git and GitHub/GitLab. Its extensibility is based on Git hooks and local CI/CD scripts.

If you want Sweep to verify code, you simply point it to the validation command in its configuration (`pnpm test` or `./gradlew check`). It will iterate on the code until the command returns an exit code of 0. It doesn't explicitly support MCP, but by basing all its validation on shell commands, it is universally compatible.

### Design and User Experience (UX)

Sweep's UX doesn't exist in the interactive terminal because it's not a chat.

- **Strengths:** The lack of distraction. You give it a complex task, you go grab a coffee or work on another branch, and you come back to a new branch with clean commits. It presents a PR summary directly in the terminal.
- **Weaknesses:** If it gets stuck, the feedback loop is slow. You can't quickly tell it "no, do it like this." You have to cancel the process, rewrite your prompt in the markdown file, and launch it again.

### Features and Performance

Sweep's search engine (which combines local embeddings and bm25) is extremely precise at finding relevant context. Its editing capability uses a highly optimized "Search/Replace" format that rarely breaks indentation.

### Real-World Test

I assigned Sweep the most tedious task: update 10 UI library dependencies in the `build.gradle.kts`, which required changing package names and updating deprecated method calls in about 15 XML and Kotlin files.

**Result:** I ran `sweep run update-ui-deps.md`. For 8 minutes the terminal was free. In the background, Sweep created a branch, attempted the update, the compiler failed (because XML attribute names had changed in the new library version), Sweep read the compiler error, searched online migration documentation using its internal web browsing tool, applied the changes to the XMLs, and the tests passed. When it came back to me, the branch was ready to merge. A resounding success in asynchronous autonomy.

### Sweep Scores:
- Setup & Arch: 8/10
- Extensibility: 7/10
- Design & UX: 7/10 (Due to async design)
- Features & Perf: 10/10
- Real-World Test: 10/10
- **Total: 42/50**

---

## 🏆 Semifinal 2 Verdict: The Winners

The results have been revealing, proving that the way we interact with agents (synchronous vs asynchronous) radically changes the perception of value.

| Contender | Setup | Extensibility | UX | Features | Real-World | **Total** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Hermes** | 8 | 10 | 9 | 9 | 9 | **45** |
| **Sweep** | 8 | 7 | 7 | 10 | 10 | **42** |
| **Codex CLI** | 9 | 3 | 8 | 8 | 5 | **33** |
| **Qwen Agent** | 6 | 6 | 4 | 9 | 4 | **29** |

### Hermes and Sweep advance to the Grand Final!

**Hermes** swept the board thanks to its local orchestration vision. Its ability to define sub-agents, its flawless support for MCP, and its interactive interface (allowing diff cherry-picking) make it the ultimate tool for the developer who wants to maintain absolute control while delegating complex tasks.

**Sweep**, despite its unconventional approach (no interactive chat), earned second place through brute force utility. The ability to launch long refactoring tasks and forget about them until the tests pass is a real superpower in an indie workflow.

Codex CLI fell short due to its cloud-only architecture, which failed spectacularly when it couldn't replicate a complex local Kotlin environment.

Qwen Agent is a brain trapped in a poorly designed tool for day-to-day use; brilliant for theoretical analysis, but dangerous if you give it unsupervised write permissions to your repository.

The stage is set! The Grand Final will pit the surgical precision of **Cline**, the modular flexibility of **OpenCode**, the supreme orchestration of **Hermes**, and the asynchronous autonomy of **Sweep** against each other. Prepare your keyboards; the final showdown will be epic.
