---
title: "Claude Desktop: connect OpenCode and external agents"
description: "Connect Claude Desktop to OpenCode with local MCP servers and extensions. Compare permissions, remote connectors, security, sessions, and architecture."
pubDate: "2026-11-09"
lastmod: "2026-11-09"
author: "ArceApps"
keywords: ["Claude Desktop","OpenCode","MCP","desktop extensions","OpenRouter","agentes externos"]
canonical: "https://arceapps.com/blog/claude-desktop-external-coding-agents/"
heroImage: "/images/claude-desktop-external-coding-agents.webp"
tags: ["IA","Agentes","MCP","Claude","OpenCode"]
category: "ai-agents"
reference_id: "b57cc834-1ddf-4b6a-a81d-59920b01cd23"
---

> **“Agent orchestration without vendor lock-in” series, part 2 of 5.** Our [first installment](/blog/chatgpt-desktop-agent-orchestration/) separated ChatGPT, MCP, OpenCode, and OpenRouter without assuming that every plan has access to the same capabilities. Today we replace the conversational entry point with Claude Desktop and ask what changes, what stays the same, and how to reuse our orchestration service.

## The paradox: the client matters too

We often compare AI models as though the quality of an entire development workflow depends exclusively on reasoning performance. Yet when a workflow crosses tool boundaries, the ergonomics and permissions of the **client** can matter more than a marginal difference in a benchmark. A client that can start an MCP server locally provides a different integration path from one that only supports remote apps. That is not necessarily about intelligence; it is about where the process and security boundaries sit.

Claude Desktop is especially interesting because Anthropic documents **local MCP servers** and **desktop extensions**. There is an extension directory, a way to install custom packages, and mechanisms to inspect connected tools. That makes it possible, architecturally, to delegate work from a Claude conversation to an OpenCode session without exposing the OpenCode development port directly to the Internet.

Nothing is automatic. Claude Desktop does not launch OpenCode merely because a prompt includes its name. A local MCP server has to publish an appropriate tool, and some executable code needs to translate that structured tool call into a real OpenCode session. Our goal is to reuse the same conceptual bridge from the first article, choosing the right transport and keeping the permission model intact.

## What remains unchanged

Our first article proposed three operations: create task, query status, and request cancellation. The contract is intentionally independent of its client. If Claude Desktop discovers those capabilities via MCP, it does not need to know which model OpenCode is running or how that agent internally represents its sessions. OpenCode remains the executor; Claude becomes a planning and supervisory interface.

The main change is the connection path. For a local Claude Desktop integration, an MCP server can run as a child process communicating over standard input and output. For a remote connection, Anthropic documents custom connectors where traffic originates from its cloud infrastructure, including when the user is working in the desktop client. These are different mechanisms. “My machine can access this VPN endpoint” does not mean Anthropic's remote connector can reach it.

This distinction shapes the design. If the application and OpenCode live on the same computer, a local MCP process can reduce network infrastructure. If the coding agent runs on a home mini PC and the conversation happens elsewhere, we must decide whether to locate the bridge next to the agent, expose it privately to the local desktop process, or deploy a separately protected remote connector. Each arrangement creates a different trust boundary.

## Claude Desktop is not Claude Code

Another common source of confusion: **Claude Desktop** is a conversational application, while **Claude Code** is a coding agent. They come from the same vendor but are not the same executable or workflow. Connecting Claude Desktop to OpenRouter does not instantly turn it into an independently managed coding agent. Installing Claude Code also does not guarantee that Claude Desktop can orchestrate its sessions through an arbitrary generic connector.

We can use Claude Desktop to scope requests, collect context, and call the bridge. The bridge may invoke OpenCode, whose configured model can be provided through OpenRouter. Later, we might add Claude Code as a separate executor, provided we use a supported interface and define the required permissions. That is different from merely choosing a Claude model within OpenCode.

Separating concepts also lowers coupling. If I change executors tomorrow, the desktop should still be able to show “accepted,” “running,” “awaiting approval,” or “review ready.” It should not have to parse every provider's private session schema to offer the same basic experience.

## Choose local MCP or a remote connector deliberately

For a personal experiment I would begin with a local MCP server. Claude Desktop can start it and communicate through MCP without publishing an Internet endpoint. That simplifies the first connectivity test, but it is not automatically secure: a local process still inherits an execution environment and needs boundaries around project access. A program that can read every file in the user account remains sensitive even without an open TCP port.

A remote connector has a different risk profile. Anthropic explains that remote connector calls originate in its own infrastructure; the server must be reachable through a supported route. An endpoint visible only on a personal Tailscale network is not automatically visible to Anthropic's cloud. A protected proxy, tunnel, or hosted service may solve the reachability problem, but it adds authentication, monitoring, network policy, and possibly recurring costs.

The choice should be driven by where the coding agent lives, where its working tree lives, who may request actions, and how long tasks have to survive. For two processes on one machine, local stdio is a reasonable starting point. For access from multiple devices, a persistent task service separated from the client process becomes a more natural foundation.

## A readable local configuration example

The MCP and Claude Desktop documentation describe a \`mcpServers\` configuration with an executable command and arguments. This is a **schematic configuration**, assuming we have written a local executable called \`arce-agent-bridge\` that speaks MCP over stdio. It is not an officially available utility, and copying this JSON does not create it.

~~~json
{
  "mcpServers": {
    "coding-orchestrator": {
      "command": "node",
      "args": ["/absolute/path/to/bridge/mcp-stdio.js"],
      "env": {
        "BRIDGE_CONFIG": "/private/path/bridge-config.json"
      }
    }
  }
}
~~~

Paths must refer to real files on the machine that runs Claude Desktop. Windows requires different paths and possibly a different command. On macOS, the environment available to a graphical application may differ from the interactive terminal environment: a command that works in a shell may not resolve when launched by the app. Absolute executable and configuration paths reduce that class of errors, and client logs help investigate process startup failures.

I would not put an OpenRouter API key into this example. The bridge should read a private configuration and the OpenCode process should obtain secrets through a suitable operating-system mechanism. Claude's configuration file is infrastructure, not a credential vault we should check into Git. Precise packaging and secret storage depend on the host OS and extension format.

## Desktop extensions distribute the integration; they do not invent it

Anthropic documents desktop extensions and installable \`.mcpb\` packages. These make it easier to package, install, and configure local MCP servers without asking every user to hand-edit JSON. That becomes valuable once we have a stable bridge and want to reduce installation errors. It does not alter the core architecture: a process still exposes tools, depends on other software, and needs a threat model.

I would not build an installer first. I would make the bridge easy to run manually, with clear startup logs and a minimal diagnostic command. After acceptance tests pass, I would add a manifest, versioned dependencies, and configuration fields marked appropriately for sensitive values. Anthropic documents secure handling for certain sensitive fields through operating-system storage, but that does not make every tool action safe.

An extension also creates a lifecycle obligation. When the OpenCode SDK or bridge contract changes, compatibility must be managed. A beautiful one-click installation that then fails silently after an update is less useful than a more manual but observable and reliable procedure.

## Test the bridge without relying on model reasoning

I would begin with a request that does not require inference: \`task_status\` for an unknown identifier should return a structured “not found,” without launching OpenCode. Next, \`create_task\` for a disallowed project must fail explicitly. Only then would I try a read-only analysis task against a sample repository and confirm that its working tree remained unchanged.

The next step is inspecting Claude Desktop logs. Anthropic documents how to view connected MCP servers, available tools, and debugging information. If the bridge does not appear, the failure is in process startup or registration. If it appears but fails when called, inspect the tool contract, authorization, and underlying executor. A language model's conversational explanation is not a substitute for program logs.

An ambiguous instruction such as “optimize the project” is a good test. The bridge should not infer an arbitrary filesystem location because the model happened to mention one. A tool should require an allowlisted project identifier and, when changes are requested, an explicit mode that activates the appropriate approval policy.

## Long-running work needs a task identity

The worst MCP tool design is a function that starts a coding agent and blocks until the complete solution is ready. A conversation can close, a network can disconnect, or a task can outlive the tool-call timeout. Without persistent identity, the user will not know whether an unfinished job is still modifying files.

Instead, return a \`task_id\`, a state, and a concise description promptly. Progress is retrieved separately. The service knows whether OpenCode is examining files, requesting approval, or producing a diff. The desktop client can show those states without forcing Claude to reconstruct the entire history from a large chat transcript.

Cancellation also needs precise semantics. Requesting cancellation cannot undo commands that have already run. If an agent created a branch or changed a file, the resulting state should say what remains after interruption. Regaining control means providing inspectable and reversible artifacts, not pretending that earlier side effects never happened.

## Integrate OpenCode without hiding its real session

OpenCode documents an HTTP service, an SDK, and session-management operations. The bridge can maintain a mapping between its own task IDs and agent session IDs. Claude Desktop should not need to know OpenCode endpoints, and the language model should not improvise raw HTTP requests. Instead, a validated tool handler sends an authorized request to an adapter.

~~~text
Claude Desktop
    └── MCP stdio: create_task(project_id, goal, mode)
           └── local bridge
                  ├── project and permission policy
                  ├── durable task store
                  └── OpenCode SDK client
                         └── identified agent session
                                └── configured model
~~~

A conversational request such as “review this change” needs translation into a concrete unit of work: project, Git ref, goal, boundaries, and expected artifacts. If the target is ambiguous, the tool can return a clarifying result rather than silently broadening its access. We do not need to remove ambiguity by giving the service excessive permissions.

A real OpenCode session may contain project instructions, context, and tool results. That is useful for the executor, but not everything belongs in the conversational response. I would expose a brief summary, changed files, a diff reference, and actionable errors. Keeping this output compact avoids feeding large execution transcripts back into a second model and inflating token costs.

## What should Claude still do?

Claude should not merely acknowledge “task started.” It can help decompose goals, identify weak acceptance criteria, and decide whether delegation is worthwhile. But the decision must result in a bounded, authorized operation that can be inspected later. When the bridge returns results, Claude can explain risks, propose a human review, and request follow-up work.

I would not grant it permission to edit the bridge's own security policy. If additional access is needed, ask the user through an explicit authorization mechanism rather than silently editing configuration. An agent that persuades another model to bypass guardrails is not more productive; it creates a security regression.

For coding workflows, I would reserve merge decisions for a distinct operation after diff inspection and CI. Separating orchestration from final approval prevents a promising model answer from becoming published code without verification.

## Local processes still have a threat model

Local MCP reduces network exposure but does not eliminate prompt injection. The agent may read repository files, issues, web pages, or tool output containing adversarial instructions. A README may request secrets, or a page may suggest unsafe commands. The orchestrator should treat this material as untrusted data and preserve explicit authority boundaries.

A lower-privilege operating-system account or a container can be appropriate for executing downloaded code. At minimum, constrain project directories, restrict destructive commands, and keep credentials separate from source. A security reminder in the agent prompt is not enough if the underlying process can run unrestricted shell commands as the main user.

Desktop extensions require scrutiny as well. A third-party package may execute software on your machine. Check its origin, version, permissions, dependencies, and update channel. For a sensitive personal workflow, a small auditable bridge can be safer than an extension with unnecessary functionality and a large dependency tree.

## Three concrete deployment scenarios

In the first scenario, Claude Desktop and OpenCode run on one laptop and operate on a local repository. A stdio MCP bridge is the simplest choice, and OpenCode's HTTP service can remain bound to loopback. In the second scenario, the executor runs on a home mini PC. The bridge needs a private path to that host, and we must not assume a Claude remote connector can reach an address on a personal VPN.

In the third scenario, the user wants to manage work from mobile, a laptop, and a browser. A durable, authenticated orchestration service accessible through supported client mechanisms may be better. That brings user identities, retry handling, storage, monitoring, and network exposure. Simplicity disappears if we just copy a local configuration onto a public endpoint.

There is no universal “most powerful” topology. Claude Desktop's local integration has a deployment advantage for desktop workflows. Remote services offer greater independence from a particular machine. A uniform task contract means we can switch client adapters without redefining our entire system of work.

## Avoid sending the same work twice

The goal of orchestration is not to have Claude write a lengthy plan and then make OpenCode rediscover everything from scratch. The bridge can transfer a bounded goal, acceptance criteria, constraints, and file references. It rarely needs a hundred pages of transcript. A good handoff specifies what the executor should produce, what it must not touch, and how success will be checked.

Likewise, I would not ask Claude to reread every OpenCode log to verify completion. Expose events and artifacts instead: test results, diff location, modified files, and review state. The conversational model can reason about this compact report rather than paying token costs to reconstruct the history.

A useful maturity signal is the ability to close one conversation, start another, and inspect the same task without manual reconstruction. That requires durable state outside both the Claude transcript and the agent session, even if the minimum implementation is a SQLite table with IDs, states, and executor references.

## Installation failures worth diagnosing explicitly

If Claude Desktop cannot discover the local server, verify the executable path, working directory, app environment, and server logs. A relative path that works from a terminal may fail when the graphical app launches the same command. An immediately exiting process often points to a missing dependency or startup exception rather than a sophisticated protocol failure.

If the tool appears but calls fail, inspect MCP SDK version, stdio transport, and whether the process writes debugging output into the protocol stream. Debug messages belong on stderr or another suitable logging destination. Interleaving arbitrary console output with protocol messages can corrupt the exchange.

If OpenCode reports credential errors, fix its provider configuration rather than pasting API keys into a prompt. If failures occur only for certain projects, inspect the allowlist and the operating-system permissions of the process. Every boundary deserves its own test; opening all permissions just to see which one was blocking a call is a poor debugging technique.

## Reproducible acceptance criteria

Before adding a second real executor, I would require seven checks: the local connection is visible; a health or status call works; unknown projects are rejected; a read-only analysis task can be created; the result survives a Claude Desktop restart; cancellation has consistent state; and the sample repository remains unchanged. These tests are inexpensive compared with diagnosing intermittent multiagent behavior after launch.

Then I would exercise patch proposal mode against a temporary branch. The output must contain a diff and a list of executed checks. A confident tone in a model-generated explanation is not an acceptance test. Automated tests and human review remain real boundaries.

This article deliberately contains no synthetic speed benchmarks and no invented screenshots of a custom connector running. It is an architecture based on documented interfaces, not measured evidence from a finished product. Once a real implementation is deployed, its observations would justify a separate experimental report.

## Lessons: choose clients by their boundary

Claude Desktop offers a particularly clear documented path for local MCP servers and desktop extensions. That does not make it inherently better for every workflow. It changes how easily a local tool can be deployed and how that tool is managed. The same orchestration layer should keep enforcing permissions, persisting tasks, and preventing accidental data disclosure regardless of the client.

Compared with the ChatGPT design, I would reuse the tool contract, agent profiles, task store, and acceptance tests. Only the connection adapter changes. If replacing the client forces us to rewrite job state and security rules, we probably did not separate concerns well enough in the first place.


## A small threat-model exercise before installing any extension

Before installing an unknown extension, I would draw two lists: data it is allowed to read and actions it is allowed to perform. For an agent-orchestration bridge, the first list might contain task identifiers, a project's public Git metadata, and a small status summary. The second might permit starting read-only investigations and cancelling a job. Nothing in that initial use case requires a home-directory search, access to password stores, or an unrestricted shell.

Then I would deliberately test whether the extension can exceed that scope. Ask it to reference an unregistered project, to cancel a task owned by a different account, and to retrieve an unrelated session's logs. Those attempts should fail in the bridge's authorization code. It is not sufficient for Claude to reply politely that it cannot do the action if the tool itself would have allowed the operation.

A separate check concerns upgrades. Document the version of Claude Desktop, the MCP SDK, and the bridge. When an update is installed, rerun discovery, a harmless status request, an unauthorized request, and cancellation before trusting the integration on a sensitive repository. Local integrations are convenient precisely because they run near valuable files; that convenience is also why the permissions need careful review.

Finally, uninstalling an extension should not abandon active jobs without explanation. If task execution lives in a separate persistent service, Claude Desktop can disappear without destroying the work record. This separation is the strongest argument for retaining a simple task service even when the user interface already offers a pleasant extension manager.

## References

- [Anthropic: local MCP servers in Claude Desktop](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)
- [Anthropic: remote custom connectors and network requirements](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
- [MCP Python SDK: connecting to a real host](https://py.sdk.modelcontextprotocol.io/es/get-started/real-host/)
- [OpenCode: HTTP server](https://opencode.ai/docs/server)
- [OpenCode: client SDK](https://opencode.ai/docs/sdk)
- [ArceApps: ChatGPT Desktop as an orchestrator](/blog/chatgpt-desktop-agent-orchestration/)
- [ArceApps: cross-agent memory through MCP](/blog/mcp-servers-memory-cross-agent/)

**Closing thought.** My first experiment would use a local server, a sample repository, and read-only permissions. If that circuit is predictable, packaging and additional executors become worthwhile. The next installment changes the question: rather than which client to use, **which protocol should connect each component without introducing unnecessary machinery?**
