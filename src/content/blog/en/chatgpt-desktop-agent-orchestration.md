---
title: "ChatGPT Desktop and OpenCode: MCP realities"
description: "Understand MCP support for ChatGPT and OpenCode, including web versus desktop limitations, OpenRouter architecture, permissions, and agent sessions."
pubDate: "2026-11-07"
lastmod: "2026-11-07"
author: "ArceApps"
keywords: ["ChatGPT Desktop","MCP","OpenCode","OpenRouter","orquestación de agentes","coding agents"]
canonical: "https://arceapps.com/blog/chatgpt-desktop-agent-orchestration/"
heroImage: "/images/chatgpt-desktop-agent-orchestration.webp"
tags: ["IA","Agentes","MCP","OpenCode","OpenRouter"]
category: "ai-agents"
reference_id: "8a216b4c-c8f2-40c7-94a1-9d3a7845e551"
---

> **“Agent orchestration without vendor lock-in” series, part 1 of 5.** We will move from a conversational client delegating work to another agent to a multi-executor architecture with reviews and cost controls. The series index next to this post automatically links installments that are already published.

> **Important scope note:** this post describes an architecture and a documented integration procedure, not proof that every ChatGPT account can run custom MCP apps with write permissions. Availability varies with plans and enabled features. The bridge examples are illustrative; no end-to-end test results are claimed here.

> **Verified compatibility (November 7, 2026):** OpenAI documents custom MCP server connections in **ChatGPT web** for Business, Enterprise, and Edu workspaces with the appropriate permissions. It does not document the same installation as a universal feature of the **ChatGPT Desktop application**. The desktop flow in this article is therefore a **target architecture**, not a guaranteed currently available procedure. For an implementation today, use a supported client and plan, Claude Desktop with local MCP, or a custom application using an API.

## The interesting question is not which model gives the best answer

Consider a modest request: “Investigate the form bug on my website, add a regression test, fix the root cause, and prepare a pull request.” A powerful conversational model can reason about this request. That does not mean it has access to the source repository, understands the preferred branching strategy, can run tests, or maintains the execution state of the coding agent I normally use. The interesting jump is not asking a second model to draft an answer. It is **delegating a unit of work to a separate agent with tools, state, permissions, and observable outputs**.

We have already explored [OpenCode subagents](/blog/opencode-subagents/) and the [Paseo orchestrator](/blog/paseo-orchestrator-multi-provider-2026/) on this blog. Those posts focus on how agents organize their own work or how dedicated orchestration tools provide a control surface. Here the question is narrower: can I use the ChatGPT interface I already know to coordinate OpenCode, Claude Code, or another executor without giving up the strengths of those systems? Architecturally, yes. Operationally, it needs a bridge and must respect what a specific ChatGPT account can actually connect to.

The path we will dissect is **ChatGPT → remote MCP app or secure tunnel → orchestration service → OpenCode API/SDK → model configured in OpenCode**. The word “model” at the end matters: OpenRouter may supply inference to OpenCode, but it does not automatically become a coding agent that owns a working directory and a session.

## Four building blocks with different responsibilities

**ChatGPT** is our conversational entry point: it can help interpret goals, narrow scope, and invoke connected capabilities when they are available and allowed. **MCP** describes a structured way for a client to access tools, resources, and other capabilities. **OpenCode** is the coding agent that operates within a development environment and maintains sessions. **OpenRouter** is a model access and routing service that OpenCode can use as a provider.

This separation prevents a surprisingly common architectural mistake. A catalog of models is not a roster of independent agents. Sonnet, Haiku, and other models may be suited to different cognitive tasks, but the agent executing commands, managing tools, and retaining session state is another layer. Switching an OpenCode model is still using OpenCode. Starting a separate Claude Code review session creates a different executor with a different operational lifecycle.

MCP is not a job queue or a durable task database either. It can transport a “create coding task” call, but another component must persist the task identity, manage retries, prevent duplicate execution, enforce permissions, and publish progress. That component is a small orchestration service. I would deliberately keep it boring: adapt requests to existing agent APIs rather than building an elaborate new agent framework.

## The crucial limitation: ChatGPT is not a universal local MCP host

OpenAI’s official documentation distinguishes **remote MCP apps** from local MCP processes. At the time of writing, ChatGPT does not connect directly to an arbitrary local MCP server in the same way Claude Desktop supports local configurations. To reach a server running on a developer machine or private network, OpenAI documents **Secure MCP Tunnel**. Opening a random development port to the public Internet is not equivalent to a secure integration.

Plan availability also matters. OpenAI’s Help Center describes different levels of access to custom apps and full MCP actions. Write and modify capabilities should not be assumed for personal accounts: the full feature set is documented for Business, Enterprise, and Edu contexts, while other plans have more restricted behavior. The documentation also draws distinctions among custom apps, agent mode, and deep research. A tutorial promising “put this JSON in ChatGPT Desktop and your coding agent is now fully controlled” without those qualifications is not a reliable guide.

The first check should therefore be about **capabilities**, not the appearance of a settings menu. Can the account register a custom MCP app? Can that app invoke the required operations? Are approvals needed? Can the service be reached from the ChatGPT environment? If the first answer is no, the architecture remains valid but the proposed ChatGPT workflow is not available with that account configuration. A custom application built using OpenAI’s API is an alternative, with a different billing model and a different user experience. It is not the desktop app.

## A minimal architecture with an explicit trust boundary

I would draw four boundaries. ChatGPT handles intent and user dialogue. MCP exposes a small, typed contract. The orchestrator authorizes projects, logs work, and enforces limits. OpenCode owns the development execution. Instead of exposing “run any shell command” to a conversational client, I would start with three operations: create a task, check its status, and request cancellation. I would not provide arbitrary filesystem access or a flag to disable approvals.

~~~text
ChatGPT client (where this connection is supported)
               |
      Remote MCP / secure tunnel
               |
   create_task / task_status / cancel_task
               |
       Orchestration service
          |             |
     permissions     OpenCode API
                         |
                    agent session
                         |
                selected model provider
~~~

Tasks should get an orchestrator-generated ID distinct from an OpenCode session ID. That lets us change agents later without breaking the task references shown to the client. I would persist the request time, allowlisted project, branch, current status, observed cost when available, summary, and minimum required diagnostics. I would not blindly copy complete conversations, secrets, prompts, and source files into this store.

A configured allowlist of repositories and directories is essential. Even in a hobby project, never trust an absolute directory supplied by a model without validation. A language model is a probabilistic planner, not an authority to expand its own permissions. Separate read-only analysis from modifying code. A first task type can run automatically; the second deserves a user approval step or a carefully defined privileged route.

## Step one: run OpenCode as a controlled service

OpenCode documents its \`opencode serve\` command, a headless HTTP API, and a locally available OpenAPI specification. You do not need terminal keystroke automation or screen scraping. Compared with integrations that copy text out of another window, the HTTP interface is a much stronger foundation: sessions, prompts, permissions, cancellation, and status can be represented explicitly.

~~~bash
# Local-only example. Never expose this dev port to the Internet.
export OPENCODE_SERVER_PASSWORD="choose-a-strong-secret"
opencode serve --hostname 127.0.0.1 --port 4096

# From another shell, check the health endpoint:
curl -fsS http://127.0.0.1:4096/global/health
~~~

The health endpoint is documented, but a server configured with HTTP Basic authentication also requires credentials for the check. The unauthenticated \`curl\` line only works when authentication is not enabled; with a password, use an authenticated client and avoid placing the secret in shell history. The OpenCode HTTP service is not itself an MCP server: our bridge translates between their protocols and responsibilities.

OpenCode also offers a JavaScript/TypeScript SDK. For a Node-based orchestrator, using this client is simpler than maintaining hand-built request paths and bodies as the API evolves. The SDK can create a server and client together or attach to an existing instance. I prefer attaching to a separately managed local service, because that makes process restarts, service health, and log retention easier to reason about.

## Step two: prove the OpenCode API works before involving ChatGPT

My first integration test would target a harmless example repository without credentials. The acceptance criterion is not “a model can edit everything,” but rather “a session was created, received a bounded request, returned a retrievable result, and did not modify code.” The SDK publishes operations for these steps. Their exact response shapes can evolve across versions, so pin a package version and verify the current documentation before copying the sample into a production service.

~~~ts
import { createOpencodeClient } from "@opencode-ai/sdk";

const client = createOpencodeClient({
  baseUrl: "http://127.0.0.1:4096",
});

const created = await client.session.create({
  body: { title: "Inspect the example form" },
  throwOnError: true,
});
const id = created.data.id;

await client.session.prompt({
  path: { id },
  body: {
    parts: [{
      type: "text",
      text: "Read the sample project. List three risks; do not edit files."
    }]
  },
  throwOnError: true,
});

const history = await client.session.messages({ path: { id } });
console.log({ id, count: history.data?.length });
~~~

This is an **illustrative SDK-based sample**, not an assertion that I executed it here. The OpenCode process must be scoped to the allowed project directory and configured with a working model provider. Calls must also satisfy whichever authentication mechanism you enabled. Session creation, messaging, history retrieval, and abortion are documented operations. A successful HTTP response by itself proves very little; I want a readable analysis artifact and a clean Git diff.

I would also test a deliberately hostile request: “delete the parent directory” or “reveal environment variables.” Security should not depend only on the model refusing in natural language. The agent process should lack the operating-system capability or granted permission to carry out unsafe instructions.

## Step three: define a narrow MCP front door

The MCP tool contract should not leak the implementation details of the underlying agent. \`create_coding_task\` accepts a \`project_id\`, \`goal\`, \`mode\`, and idempotency key. \`coding_task_status\` retrieves known state; \`cancel_coding_task\` requests interruption. I would not expose unrestricted \`shell_command\`, \`working_directory\`, or \`ignore_permissions\` parameters.

~~~json
{
  "name": "create_coding_task",
  "description": "Creates a scoped coding task in an allowlisted project",
  "inputSchema": {
    "type": "object",
    "properties": {
      "project_id": { "type": "string" },
      "goal": { "type": "string" },
      "mode": { "enum": ["analysis", "propose_patch"] },
      "idempotency_key": { "type": "string" }
    },
    "required": ["project_id", "goal", "mode", "idempotency_key"]
  }
}
~~~

This snippet is a **conceptual tool contract**, not a deployable full MCP server. A real server must implement transport, protocol initialization, authorization, errors, and observability according to the relevant SDK and specification. The valuable property is that the model cannot choose an arbitrary directory or obtain more permissions by composing a more persuasive instruction.

Idempotency matters whenever a user interface retries a call after a timeout. Without it, “create one task” may start two agents writing to the same branch. I would bind the key to an authenticated user, project, and normalized goal for a reasonable interval. A repeated request returns the same task identity rather than starting another execution.

## Step four: connect ChatGPT without exposing the laptop

The setup process depends on which apps and developer capabilities are actually enabled on a particular ChatGPT account. The conceptual sequence is to make an authenticated remote MCP available, or connect a private service through a supported secure tunnel, register the custom app, and verify its effective permissions. I would not write menu-by-menu instructions as if everyone saw the same interface; plan access and client releases differ.

There is no security magic in \`--hostname 0.0.0.0\`. That flag makes a server listen on additional network interfaces; it does not provide authentication, encryption, sandboxing, or authorization. Keep OpenCode bound to \`127.0.0.1\` or within a trusted private network. Any public bridge must authenticate requests, map them to the right user, and enforce limits. Secrets belong in the service environment or a secret manager, never in the prompt, public repository, or an output that the model may expose.

In the first iteration I would make the ChatGPT integration create **read-only analysis** tasks and query their results. Code changes come only after cancellation, authorization, and state persistence work correctly. A clever multiagent demo that cannot tell you what executed is not a mature integration.

## OpenRouter belongs under the agent, not above it

OpenCode supports multiple model providers, including OpenRouter as documented. This allows a selected model to drive an OpenCode coding session. The orchestrator might request an “economical analysis” or “high-confidence review” profile, but the server should map these profiles to explicit, validated provider/model IDs rather than accepting arbitrary cost-bearing names from a client.

For an initial prototype, I would avoid automatic routing entirely. Choose one OpenRouter-backed model supported by the current catalog, record its observed usage, and keep a manual fallback. Model IDs, pricing, availability, and rate limits change. An example from a provider guide can age quickly; copying it unexamined is not a reliable operational policy.

OpenRouter does not mean ChatGPT is “running OpenRouter agents.” ChatGPT invokes a tool; the tool creates an OpenCode session; OpenCode calls a model through OpenRouter. Distinguishing those layers makes it possible to swap a provider without rewriting the orchestrator. The fifth installment explores exactly how to route work under a budget, handle fallback, and avoid runaway costs.

## A coding task outlives a single HTTP request

Treating \`create_task\` as one long call that returns a finished pull request is fragile. Agents can take time, request approval, hit missing dependencies, or wait for a reviewer. Keeping a model tool call open for all that work increases the odds that a client disconnect or timeout loses the result.

I would implement a small state machine: \`queued\`, \`running\`, \`awaiting_approval\`, \`completed\`, \`failed\`, and \`cancelled\`. Creation returns an ID and initial status; subsequent calls query progress. Status transitions should follow executable events and a persistent job record, not a language model's improvised interpretation of the last assistant message.

Automatic retries need to account for side effects. A read-only task can often be repeated safely. A task that has already changed files or opened a PR needs reconciliation before another attempt. The service must understand these differences, even if the conversational client expresses everything as a single friendly instruction.

## Approval boundaries and Git operations

The integration becomes useful when it leaves behind something verifiable. For software development that should be a diff on a dedicated branch, plus recorded commands and test outcomes. I would never let a general task-creation tool merge directly to \`main\`. Prepare a branch, apply the change, run tests, inspect the diff, open a PR, and gate the merge behind a separate authorized action.

Sensitive projects demand extra care. Do not transmit private files to an external model without reviewing the provider and data-retention terms. Do not include tokens in task descriptions. Do not treat instructions embedded in a README, issue, or web page as higher-priority commands. Prompt injection is especially dangerous when an agent is authorized to read both trusted instructions and untrusted project material.

Record who authorized each side-effectful action. “ChatGPT requested it” is not an adequate audit statement when the user request may have been influenced by untrusted content. I would also limit concurrency per working tree or branch, because two agents editing the same files turn a small fix into intermittent conflicts.

## Acceptance tests I would demand before trusting it

The first test requests a read-only audit of a toy repository and confirms the working tree remains clean. The second repeats the request with the same idempotency key and confirms only one session exists. The third closes the client connection and retrieves the same task later. The fourth asks for cancellation and verifies that the terminal state is recorded.

The fifth tries to name a disallowed project and verifies rejection before any OpenCode call. The sixth requests an operation requiring approval and checks that no write occurs before authorization. The seventh restarts the bridge and reconciles its durable task record with the underlying session.

I would measure latency per phase, retries, failures, and model spend only once those tests are passing. This post does not contain execution measurements for this particular integration. Presenting imagined savings, fictional screenshots, or made-up reliability percentages as real results would make an otherwise useful tutorial much less trustworthy.

## Common failures and how to diagnose them

**The app does not appear in ChatGPT.** Verify plan and custom-app eligibility before debugging the server. A correct backend cannot overcome a product permission boundary. **The app appears but its tool fails.** Separate authentication rejection, transport timeout, MCP protocol error, and executor failure instead of calling them all “the model was confused.”

**OpenCode responds but works in the wrong repository.** Check the server's configured working directory and project scope; a repository name in the prompt is not an access policy. **The task reports success but produced no diff.** That is fine for an audit but a failure for a task whose acceptance criteria require a patch.

**Costs unexpectedly grow.** Determine whether duplicate jobs were spawned, the provider retried requests, a very large context was reused, or the configured model changed. Observability is a prerequisite for optimization. Otherwise, every tuning decision is just a guess.

## When this architecture is not worth the trouble

If all my coding happens in OpenCode and I like its interface, I would probably not build a custom MCP bridge. It creates new services to maintain and new trust boundaries to secure. If all I want is a different model, OpenCode provider settings may already solve the problem. If my main goal is one interface for multiple existing coding agents, I would evaluate tools such as Paseo before implementing another orchestration UI.

The extra service makes sense when I want **one task entry point**, durable coordination across different executors, or integration with my own applications. It matters particularly when work should continue after the ChatGPT window closes. A conversation alone is not a durable job scheduler; persistence and operational control belong to the orchestration layer.

## Lessons and what comes next

The most useful lesson is that orchestration is not about accumulating models. It is about deciding **who may do what, in which environment, with which state, and under whose approval**. ChatGPT gives us a familiar interface. MCP can expose bounded operations. OpenCode performs coding work. OpenRouter supplies models. The bridge adds continuity, enforcement, and traceability. If a product feature is unavailable to your plan or platform, do not pretend that the connection is universal.

Our next installment changes the front-end client while keeping the problem: what does Claude Desktop offer through local MCP servers and desktop extensions? Later we will contrast MCP with ACP and A2A, design a multi-provider PR workflow, and examine operating costs. The series index on this page will link each article after it is released.

## References and further reading

- [OpenAI: developer mode and MCP apps in ChatGPT](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt)
- [OpenAI API: MCP servers and secure tunnel](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
- [OpenCode: HTTP server, authentication and API](https://opencode.ai/docs/server)
- [OpenCode: JavaScript/TypeScript SDK](https://opencode.ai/docs/sdk)
- [OpenCode: model providers and OpenRouter](https://opencode.ai/docs/providers)
- [Model Context Protocol: official documentation](https://modelcontextprotocol.io/introduction)
- [ArceApps: OpenCode subagents](/blog/opencode-subagents/)
- [ArceApps: Paseo, a multi-provider orchestrator](/blog/paseo-orchestrator-multi-provider-2026/)

**Closing thought.** Before connecting ten tools, I would start with one read-only task, one allowlisted project, and one auditable result. If that path proves solid, expand it. If it does not, additional agents will only multiply the uncertainty.
