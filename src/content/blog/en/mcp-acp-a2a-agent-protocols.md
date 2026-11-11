---
title: "MCP, ACP and A2A: connecting AI agents"
description: "Compare MCP, ACP and A2A through practical cases: when to connect tools, embed coding agents in editors, or communicate between independent services."
pubDate: "2026-11-11"
lastmod: "2026-11-11"
author: "ArceApps"
keywords: ["MCP","ACP","A2A","Agent Client Protocol","Agent2Agent","agentes IA"]
canonical: "https://arceapps.com/blog/mcp-acp-a2a-agent-protocols/"
heroImage: "/images/mcp-acp-a2a-agent-protocols.webp"
tags: ["IA","Agentes","Protocolos","MCP","ACP","A2A"]
category: "ai-agents"
reference_id: "2ca798ed-62dd-47ac-8112-57b0d26ac4ee"
---

> **“Agent orchestration without vendor lock-in” series, part 3 of 5.** We started with [ChatGPT Desktop and the MCP boundary](/blog/chatgpt-desktop-agent-orchestration/), then studied [Claude Desktop and local tools](/blog/claude-desktop-external-coding-agents/). Before adding more executors, we should ask a basic question: **what do we actually mean by connecting agents?**

## Three protocols for three different problems

In the agent ecosystem, “connection,” “delegation,” and “orchestration” are often treated as interchangeable words. They are not. An application that needs a search tool has different requirements from an editor displaying every change made by a coding agent. Neither is the same as two independent agent services discovering each other and collaborating on a long-running task.

**MCP**, Model Context Protocol, is especially useful for giving applications or agents structured access to tools and resources. **ACP**, Agent Client Protocol, was created to connect coding agents to clients such as editors and development environments. **A2A**, Agent2Agent Protocol, focuses on communication and collaboration among independently implemented agent systems. Their use cases can overlap, but their primary boundaries differ.

None of these protocols guarantees that an agent is competent, that execution will be safe, or that two models will reach a correct consensus. They define communication structures and interoperability mechanisms. Authorization, cost controls, durable state, and product decisions remain responsibilities of our own architecture.

## One running example

Imagine maintaining a web application with a small Android companion service. I want to say: “Review the authentication changes, identify a risk, and propose a patch with tests.” A conversational client can use MCP to invoke a \`create_task\` tool. An ACP-compatible editor can embed an external coding agent and display its activity in the working tree. An independently hosted security auditor could advertise its capabilities with A2A and accept a separate review task.

I do not need all three protocols to achieve this outcome. A straightforward HTTP API and one adapter might handle the whole job. The point of comparing standards is to discover **when interoperability pays for its complexity**, not to cover an architecture diagram with fashionable initials.

My most useful discipline is to mark authority at every boundary. Does the human interact with an editor, a chat, or a backend service? Who starts the job? Who persists its state? Which component can edit files? Which one responds to cancellation? Once these questions are answered, selecting a protocol becomes much less mysterious.

## MCP: exposing capabilities to a client

MCP focuses on allowing a compatible host to discover and invoke a server's capabilities. A tool has a name, description, input schema, and results. Resources and other capabilities are also part of the protocol, depending on the version and SDK. It is useful when connecting a chat to an issue tracker, document repository, or tightly scoped coding task.

An MCP server does not need to be an autonomous agent. It may simply wrap an API, database, or function. In our series, the MCP bridge exposes three operations: create task, query status, and request cancellation. The actual coding agent sits beneath the bridge, in OpenCode or another executor. That allows different compatible clients to access the same operations without learning internal agent-specific APIs.

Transport matters too. A local stdio process and a remote HTTP server have different deployment requirements. Protocol versions evolve as well; do not copy old handshake, session, or header details without checking the specification used by the client and server. Interoperability is demonstrated by compatibility tests, not by a configuration screenshot.

## A narrow MCP tool contract

A useful design starts with the smallest operation needed. The task-creation tool should not accept a free-form shell command or arbitrary directory. It receives an allowlisted project ID, goal, execution mode, and idempotency key. The server checks authorization and returns a stable ID. The call does not remain open until the agent finishes; progress can be retrieved separately.

~~~json
{
  "project_id": "demo-web",
  "goal": "Review the authentication change and propose tests",
  "mode": "analysis",
  "idempotency_key": "audit-auth-2026-11"
}
~~~

This is an **example tool argument object**, not a complete MCP protocol message. It omits transport headers, authentication, and the tool-call envelope. That simplification is intentional: the important design choice is the contract boundary.

A tool should not automatically inherit every permission held by the agent that invokes it. If it allows analysis only, the server must enforce that restriction even when the \`goal\` field requests file changes. API permissions belong in code and configuration, not in the model's willingness to obey instructions.

## ACP: the relationship between an editor and an agent

Agent Client Protocol was designed so compatible editors can communicate with coding agents without building proprietary integrations for each one. Zed, one of its creators, describes the idea as bringing your own agent to the editor. The editor retains its file, change, and review experience while the agent retains its execution logic. That is a different concern from a chat making one tool call.

In an ACP scenario, the client is usually an editing environment or app that needs an ongoing interaction with the coding agent: sessions, messages, activity, tool events, and results integrated into the interface. This is not merely a model router. The editor needs enough information to show developers what is happening and let them intervene.

Portability is the conceptual benefit. Instead of implementing unique integrations for OpenCode, Claude Code, and every other executor, an editor and compatible agents can adopt a shared surface. But concrete capabilities and maturity vary by implementation. Two products advertising “ACP” do not guarantee identical permissions, authentication, or feature support.

## ACP is not MCP with the letters reversed

The similar abbreviations encourage treating MCP and ACP as rivals, yet they usually operate on different planes. An editor may connect to a coding agent through ACP; the agent itself may access tools through MCP. The agent does not need to reinvent integration with GitHub, databases, or documentation systems. The division is natural once editor interaction and external tools have clear boundaries.

Imagine an editor view following the review of a patch in real time. ACP is relevant there. Now imagine the agent needs to retrieve issues from a repository: MCP may be a good tool interface. Replacing one with the other simply because both deal with agents often produces needless adapters and incomplete experiences.

A native editor integration backed by an ordinary HTTP API remains a valid alternative. Standards help when interoperability matters, but they should not become compulsory in small projects where a supported SDK is simpler and easier to maintain.

## A2A: collaboration between agent systems

A2A targets a broader boundary: independent agent systems that announce capabilities, exchange messages, and manage collaborative tasks. Its specification includes agent capability descriptions, messages, tasks, state transitions, and artifacts. It is attractive when participants are independently deployed, built with different frameworks, or operated across different trust domains.

Unlike an MCP tool whose purpose might simply be “create ticket,” an A2A service can represent a remote agent that carries out long-running work, requests additional information, and produces artifacts. A client does not need access to the remote agent's private memory or internal tools. That independence matters when integrating third-party systems or separating responsibility among services.

But it is not a reason to scatter small personal workflows across ten microservices. If two agents live in the same process and a supported SDK already provides the calls we need, turning each into an A2A service may add latency, identity management, deployment work, and failure modes for no practical benefit.

## Draw the boundaries, not just the acronyms

~~~text
Human
  |
  +-- Chat / app ----- MCP ----> tools: repo, tasks, data
  |
  +-- Editor --------- ACP ----> coding agent
                                     |
                                     +-- MCP --> tools
  |
  +-- Coordinator ----- A2A ----> independent agent service
                                     |
                                     +-- task status and artifacts
~~~

This diagram is not a mandatory topology. Tools may use other mechanisms, editors may launch local processes, and coordinators may talk directly to ordinary APIs. Its purpose is to separate three questions: what does the agent read or modify, how does the editing client interact with it, and how do independent agents collaborate?

For a personal project I would begin with the one boundary that is actually needed and introduce standards when connecting independent systems justifies them. Starting with every abbreviation available makes an integration harder to debug and harder to explain to someone reading the code.

## Compare responsibility, not marketing claims

| Design question | MCP | ACP | A2A |
| --- | --- | --- | --- |
| Typical client | App or agent invoking tools | Editor or agent-facing client | Another agent or coordinator |
| Exchanged capabilities | Structured tools, resources, results | Operational coding-agent interaction | Agent messages, tasks, artifacts |
| Durable state | Application responsibility | Implementation-specific | Task lifecycle is modeled explicitly |
| Strong fit | External systems and operations | Agent experience inside an editor | Independent multiagent services |
| What it does not solve | Planning and job persistence | Agent quality or project policy | Operational trust, correctness, cost |

This table summarizes protocol intent; it is not a certified compatibility matrix. Specific implementations may cover different subsets of a protocol. Compatibility has to be checked in official documentation and tests for the versions actually installed.

The wrong question is “which is best?” The useful question is “which boundary am I trying to standardize?” If I just want to query a database from Claude Desktop, A2A is probably unnecessary. If I want an editor that can work with several agents, ACP deserves attention. If I need remote agents to discover one another and coordinate jobs, A2A may justify its operational cost.

## What about an ordinary HTTP API?

Traditional APIs remain valid. OpenCode already exposes an HTTP server and a client SDK, which the bridge in the first two articles can use directly. There is no reason to wrap a call in A2A merely because it travels over a network. If I control both endpoints, an authenticated typed API with explicit task states may be the cheaper solution.

Standards become valuable when multiple clients or agents need a shared contract and we want to avoid writing a unique integration for every pair. Their costs include version negotiation, capability discovery, authentication, error handling, and compatibility tests. With one producer and one consumer, measure that overhead before choosing a framework.

My preferred design keeps business rules inside a transport-independent service. An MCP adapter calls the same \`createTask\` method as an HTTP route or a future A2A adapter. Switching transports should not rewrite authorization rules or task semantics. Otherwise adapters become duplicated centers of business logic.

## Versioning: the detail that breaks perfect demos

MCP, ACP, and A2A keep evolving. Each client and server usually supports a particular set of versions and capabilities. Pairing an older implementation with a newer client can produce failures unrelated to model intelligence. A meaningful compatibility report should record exact client, server, SDK, and specification versions.

I would not copy an old initialization sequence without checking whether it remains current. MCP, for example, has seen changes to transport and session models, and its documentation may cover both modern and historical releases. A2A has versioned specification pages that can coexist. Link to the exact version used for an integration rather than claiming that one unversioned example works forever.

The practical answer is familiar software engineering: pin dependencies, test startup negotiation, perform one known working call, and document what changes during upgrades. Do not wait for a user to notice that a tool vanished from their editor.

## State and cancellation are not the model's job

Having a protocol does not guarantee recoverable work. MCP can invoke an operation returning a job ID, but the service must persist that ID. ACP can manage an operational editor-agent session, but recovery after restart depends on the implementation. A2A models tasks explicitly, yet the service must still store their actual state correctly.

I would define one core job state machine and map it onto whatever protocols I use: \`queued\`, \`running\`, \`awaiting_approval\`, \`completed\`, \`failed\`, and \`cancelled\`. Cancellation needs a clear definition: what stops, what may already have completed, and what artifacts remain after interruption.

Separate execution state from review state as well. An agent can finish writing a patch without anyone approving it. Technical \`completed\` is not the same as \`merged\` or \`deployed\`. This distinction stops a UI from announcing success while CI, code review, or release verification is still outstanding.

## Security is not a property of an acronym

With MCP we inspect each tool's scope and the origins of the content it receives. With ACP, an editor and an agent engage deeply with project files, commands, and approvals. With A2A, identity, authentication, remote permissions, and artifact provenance become even more important.

None replaces least privilege. A review agent does not need production credentials. An issue-analysis agent should not have an unrestricted administrator shell. A service delivering a file must not be able to turn that file into a privileged instruction on the receiving side. The boundary between untrusted data and authorized instructions is particularly delicate when agents read repositories and web content.

Logs also deserve attention. They may contain secrets, source snippets, and private prompts. Uploading complete logs to an external observability service without filtering can create a privacy problem. Useful tracing does not require publishing every byte an agent touched.

## Three practical protocol selections

**Flow A: query application statistics from a chat.** Use MCP when the client supports it with appropriate permission scopes. The tool returns structured data, and reading can remain separate from write actions. A2A is unnecessary because no independent remote agent is negotiating a long-running job.

**Flow B: refactor code while observing changes inside an editor.** Consider ACP if the editor and coding agent have compatible implementations. Its value lies in the integrated experience. The agent can still query external systems through MCP or conventional APIs.

**Flow C: request an independent security review service.** Consider A2A when genuine interoperability, discovery, and remote job management matter. If that reviewer is a single process under my control, I would first test a plain API. Distributed complexity should be justified by an actual requirement.

## Prototype without adopting all three standards

My first prototype would not enable every protocol. It would have a small core service accepting a goal, authorized project, and execution mode. An MCP adapter would expose it to a conversational client, and the coding agent would be invoked through its documented SDK. That is the shortest route to useful, inspectable results.

I would add an ACP-compatible editor interface only when I needed that experience and had confirmed compatibility. A2A would come later, when collaborating with an independent agent service and when a known HTTP endpoint was no longer sufficient. Every new layer should correspond to a requirement that can be expressed as an acceptance test.

Common metrics should remain stable across transports: completion rate, time to first result, human interventions, error rate, and observed model cost. If adding a protocol improves none of these and unlocks no needed integration, it may not belong in the project.

## Anti-patterns worth avoiding

The first is “every model is an agent.” A model available through an API does not automatically have tools, memory, persistence, or permissions. The second is “everything through MCP.” MCP is useful, but it is not intended to replace every collaboration pattern or editing interface. The third is “A2A just in case”: distributing simple local tasks can generate operational work with no payoff.

The fourth is treating the conversation as a database. Closing the client should not erase the identity of an active task. The fifth is assuming an agent message is authoritative because it came from another agent. Messages are data until validated by policy and turned into allowed actions.

The sixth is hiding failures behind friendly model text. A transport failure, authorization denial, missing tool, and failed test demand different remedies. Design error messages and traces that distinguish them without requiring someone to read a huge transcript.

## Lessons for this series

MCP connects applications to tools. ACP connects clients—especially editors—to coding agents. A2A connects independent agent systems. This is a useful mental model, not a rule requiring all three standards. Our original goal remains unchanged: delegate verifiable work without losing control of state and permissions.

The next article takes the architecture into Git: one plan, implementation by an agent, review by another, and a pull request gated by CI. We will examine what information must cross each boundary and what decisions remain human. The final article looks at providers, budgets, routing, and fallbacks.


## Capability negotiation should be tested, not assumed

There is another practical difference between reading about a protocol and operating one: **capabilities are conditional**. A client may support the transport but not a particular optional feature. A server may implement tools but no resources, or present an operation that the client cannot authorize under its current permissions. Successful connection is only the beginning of integration testing.

For an MCP bridge I would keep a compatibility checklist of tool discovery, a read-only call, an expected validation error, and the behavior when permissions are denied. For an ACP integration I would inspect how the editor renders an active session, tool activity, requested approvals, and changed files. For A2A I would test an advertised capability, a valid task, an invalid task, progress updates, and artifact retrieval. These examples are not a protocol conformance suite, but they reveal whether a proposed integration actually serves its use case.

The boundary must also preserve error meaning. A model returning an unhelpful answer is different from a protocol rejecting malformed input; a network timeout is different from a task actively waiting for human approval. If the adapter flattens all failures into a generic string, the client will struggle to explain the next action. Typed errors and correlation identifiers do far more for maintainability than an elaborate “agent personality.”

Finally, build a reversible path. New protocol adapters should be optional around the core job service. If an upgraded SDK becomes incompatible, the existing task data should remain accessible through a simpler HTTP endpoint or administrative tool. Choosing interoperable protocols should reduce lock-in, not replace one vendor dependency with an all-or-nothing dependency on a specific protocol revision.


## A migration rule for small projects that grow

Suppose we started with an ordinary HTTP API connecting a dashboard to OpenCode. Months later, we want to support another editor. I would not immediately rewrite the whole service “to use ACP.” First, identify which editor-specific capabilities matter: live activity, approval prompts, file-change visualization, and session recovery. Then check whether the editor and selected agent actually implement those capabilities compatibly. Only then should the ACP adapter be introduced.

The same reasoning applies to A2A. If the requirement is merely to start another process on a known machine, an authenticated API is probably enough. If an independent service must advertise its capabilities to unknown clients and exchange long-running tasks and artifacts, A2A begins to provide measurable value. Keep task identifiers, authorization, and status rules in the central service; changing protocol must not duplicate state or bypass existing restrictions.

Even for a hobby project, I would document a recovery route: a health endpoint, an authorized way to inspect task records, and a manual cancellation mechanism. A protocol version mismatch should not turn existing jobs into a black box. Interoperability is valuable when it helps a system evolve, not when it forces a full migration every time an SDK changes.

## References and related articles

- [MCP: specification and documentation](https://modelcontextprotocol.io/specification)
- [Zed: Agent Client Protocol](https://zed.dev/acp)
- [Zed: the evolving ACP ecosystem](https://zed.dev/blog/acp-progress-report)
- [A2A: official documentation](https://a2a-protocol.org/)
- [A2A: task and messaging specification](https://a2a-protocol.org/v1.0.1/specification/)
- [ArceApps: ChatGPT Desktop with OpenCode](/blog/chatgpt-desktop-agent-orchestration/)
- [ArceApps: Claude Desktop with local MCP](/blog/claude-desktop-external-coding-agents/)
- [ArceApps: MCP-based shared memory](/blog/mcp-servers-memory-cross-agent/)

**Closing thought.** My favorite protocol is the one that saves me from writing an adapter I do not need. If the architecture diagram needs more acronyms than requirements, simplify it before writing the implementation.
