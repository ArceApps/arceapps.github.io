---
title: "OpenBot vs Hermes vs Paperclip: Who Wakes the Agent?"
description: "OpenBot, Hermes Agent and Paperclip compared by the question that decides everything at 3 a.m.: what wakes the agent, what it remembers and what stops it."
pubDate: 2026-11-14
lastmod: 2026-11-14
author: "ArceApps"
keywords:
  - "OpenBot"
  - "Hermes Agent"
  - "Paperclip"
  - "proactive AI agents"
  - "agent routines"
  - "AI orchestration"
  - "AI automation 2026"
canonical: "https://arceapps.com/blog/openbot-vs-hermes-vs-paperclip-ai-agents-2026/"
heroImage: "/images/openbot-vs-hermes-vs-paperclip-ai-agents-2026-en.svg"
tags: ["OpenBot", "Hermes Agent", "Paperclip", "AI Agents", "Automation", "Orchestration"]
category: ai-agents
reference_id: "7f2c4a19-8b3d-4c60-9e51-2a6d0b8c4f37"
---

Every agent demo ends the same way: a person types something. The tool thinks, calls a few functions, and produces an answer that looks impressive for ninety seconds. Then the person closes the tab, and nothing happens again until the next demo.

That is not the interesting part. The interesting part is what happens at 3 a.m., when nobody types anything, and something in your project has changed.

I have spent the last few weeks living inside three platforms that answer that question in three genuinely different ways: **OpenBot** (the local-first desktop workspace from Synthetify Labs), **Hermes Agent** (Nous Research), and **Paperclip** (the "company of agents" server). I have already written about [Hermes against OpenClaw](/blog/hermes-vs-openclaw) and about [Paperclip's zero-human-company pitch](/blog/paperclip-ai-zero-human-company). This article is not a rerun of either. It is about the part that separates a chat with tools from a system that keeps working while you sleep.

One caveat before the numbers: if you have read anything about "OpenBot" lately, check which one. There is a **different project with the same name** from CopilotKit at [open.bot](https://open.bot/). Everything here refers to `nightly-labs/openbot`, the app at [openbot.run](https://openbot.run/). Different licence, different features, different product.

All repository numbers below were read from the GitHub API on **14 November 2026**, because this ecosystem moves weekly and a comparison without a date is a rumour.

## The axis nobody benchmarks

Benchmarks measure models. They do not measure the thing that actually determines whether an agent platform is useful to you, which is: **what causes the agent to start working, and what makes it stop.**

Every one of these tools can read a file, run a command, and call an API. The differences that matter are in the plumbing around that:

| Wake source | What it really means | Typical failure mode |
|---|---|---|
| **Clock** | A schedule fires: cron, "every weekday at 09:00" | Runs when there is nothing to do, and invents work to justify the tokens |
| **Event** | Something outside calls in: a webhook, a GitHub action, a form | Delivered twice, or delivered while the host is asleep and silently dropped |
| **Queue** | Work is assigned: a task, a card, a comment | Pile-up. Six things wait behind one stuck run |
| **Judge** | A second model decides the work is not finished and continues | Never converges, and burns a budget proving it |
| **Agent** | Another agent hands over the job | Two agents hand it back and forth forever |

There is also a fifth pattern that looks like proactivity and is really its opposite: **the idle poll**. An agent wakes every five minutes to ask whether anything happened. Paperclip's own documentation argues against it with unusual bluntness, and the argument is worth repeating because it applies to every tool in this article: an agent ticking every five minutes, five agents deep, produces sixty runs an hour that mostly say *nothing to do, going back to sleep*. The human response is to pause the agents, and pause is a blunt override that also kills the wakeups you wanted. Their rule of thumb: *if you find yourself constantly pausing and resuming an agent, the heartbeat is wrong, not your workflow.*

Keep that in mind, because the three platforms place their bets very differently on this spectrum. OpenBot bets on a human-sized team sitting on your desk. Hermes bets on a scheduler with memory. Paperclip bets on an org chart where work arrives as a ticket.

## The three, in one paragraph each

**OpenBot** is a desktop app (macOS, Windows, Linux) that runs the AI CLIs you already pay for — Codex, Claude Code, Gemini, Grok, OpenCode, Cursor, Cline, Pi, Mercury, any ACP agent — as separate agents, each with its own workspace, thread, queue and conversation. It is local-first: the SQLite database is yours, the files are yours. 7,659 stars, 771 forks, PolyForm Noncommercial 1.0.0 (source-available; commercial use needs a paid licence), a release roughly every day, and native iPhone/Android apps that are clients of the computer running OpenBot.

**Hermes Agent** is an MIT-licensed Python agent from Nous Research that grows with you: persistent memory in `~/.hermes/`, skills it writes for itself, a messaging gateway for around twenty chat platforms, cron with event triggers, a durable Kanban board where every task is a row in SQLite, and goal loops. 263,302 stars, 59,341 forks, repo created in July 2025, first public release in February 2026. Hermes Cloud (hosted agents) starts at $20/month on the Plus tier.

**Paperclip** is a Node.js server with a React UI that orchestrates a *team* of agents: org chart, roles, reporting lines, money budgets, review and approval stages, private projects, audit trail. It is not an agent framework; it does not care how your agent is built, only that it can receive a heartbeat. 113,834 stars, 18,893 forks, MIT, Node 24.11+, embedded Postgres locally, `npx paperclipai onboard --yes`. Paperclip Cloud exists only as a waitlist, with no date and no public price.

Three products, three philosophies. Now the part everyone skips: how each one actually wakes up.

## OpenBot: an app that keeps its own clock

OpenBot's primitive is the **routine**, and its definition is refreshingly narrow: *one instruction plus the times to run it*. When it fires, the agent does the work in its own workspace and its own thread, so the result lands where the context already is, and the run history sits next to it. The thread marks which turns a routine started, which sounds cosmetic until the first time you mistake a scheduled answer for something you asked for.

Two details from the documentation tell you more about the design than any feature list:

> Size the instruction so that "nothing to report" is a normal answer. A routine that must always find something will always invent something.

> A routine is an instruction for an agent, not a job runner for your machine. It has no retry policy and no dependency graph, and it is the wrong tool for anything that must happen exactly once at exactly one time.

That is an honest description of a deliberate limit. OpenBot is not trying to be Airflow with an LLM in the middle. It is trying to be a colleague who checks something every morning.

**Schedules and webhooks.** Routines run on a schedule, and webhook routines exist too. The interesting part is what happens when the host is asleep. On a hosted server, OpenBot stops after a period of inactivity but keeps its data; it wakes shortly before a scheduled routine so the routine fires on time. Messages and webhook deliveries wake it as well — the first delivery gets a "try again later" answer while the server starts, which takes a few minutes, and most webhook senders (their examples are Shopify and Stripe) retry on their own for hours. It is not a guaranteed exactly-once trigger; it is a system that assumes the network will knock again.

**Queues and channels.** Each agent has its own FIFO queue with pause, resume, cancel and crash-safe persistence. A **channel** is a shared thread several agents read and write, with **one task owner at a time** and an explicit handover. You keep Stop, Resume, Reassign, Archive and Restore. The handover is a message, so you can read who took the work and why. This is a much better collaboration primitive than "spawn five agents and hope", because it makes ownership legible.

**The backup model.** If an agent's plan hits a limit, or the provider is down or overloaded, the agent can move to a backup model on a different provider while keeping its chat and workspace, and leaves a note in the chat saying so. For anyone who has watched a Claude Code session die mid-refactor because of a rate limit at 2 a.m., this is the single most practical feature in the product.

**Memory and skills.** Each OpenBot agent has instructions, saved memories, skills, a workspace and a thread. It is not the same depth as Hermes (more on that below), but it is not nothing either, and there is an importer for Hermes profiles: each profile becomes an OpenBot agent, carrying instructions, entries from `MEMORY.md` and `USER.md` (subject to OpenBot's memory limits), and custom skills. Credentials, chat history, bundled skills and MCP settings do not travel. The exporter tells you what it skipped, which is the correct way to do a migration.

**The security decision you must read.** OpenBot's agents run with `danger-full-access` and `approvalPolicy: never`. The README says it plainly: they can read and modify files, run commands, use the network and control the embedded browser without per-action confirmations after the first-launch consent. You can set per-agent access (full, workspace-only, ask first), and you should. To be precise about something that circulates in comparisons: the Linux warning in the README is about **not** starting OpenBot with `--no-sandbox`, which removes the boundary between the renderer and the rest of the computer. It is not a warning about running Hermes. I could not find a primary source for that claim, and I looked.

**Where OpenBot wins:** it is the only one of the three with native phone apps, the only one where "my agents use the ChatGPT and Claude plans I already pay for" is the default instead of an integration, and the only one that feels like a workspace rather than a control panel. **Where it loses:** durability. A desktop app is a desktop app. If the machine sleeps, so does the team — unless you pay for a hosted server (from €20/$25 per month for Starter) or run it on a VPS yourself.

## Hermes: a scheduler with a body

Hermes has five different mechanisms that can start work, and confusing them is the main reason people misconfigure it. The boundaries are sharper than they look:

| Mechanism | Lives in | Trigger | Use it when |
|---|---|---|---|
| `cron` | Outside any session, durable scheduler | Time, interval, or a webhook route | The job must run unattended and survive restarts |
| `/heartbeat` | Inside one conversation | Idle time elapsed | You want the agent to keep an eye on something *in this thread* |
| `/loop` | Inside one conversation | Fixed cadence or a condition | Poll a deploy, iterate until green, monitor during a session |
| `/goal` | Inside one conversation | A judge model decides the objective is not met | "Keep going until this is actually done" |
| Kanban | A separate durable board | Task created, dependency cleared, review requested | Work that crosses agents, needs review, or must outlive the session |

**Cron, in detail.** Hermes cron does what you expect — cron expressions, intervals, one-shots, per-job timezone, pause/resume/edit/trigger/remove, catch-up windows for missed occurrences (half the period, clamped between two minutes and two hours by default, overridable per job) — plus three things that change the design:

1. **Webhook-triggered cron jobs.** A job can carry a webhook route and fire the moment something happens instead of waiting for the next tick. A PR gets feedback, a service posts an alert, the job wakes.
2. **No-agent mode.** A job can run a script on a schedule and deliver its stdout verbatim, with zero LLM involvement. This sounds like a footnote and is actually the difference between a €0 monitoring loop and a €40/month one.
3. **Pre-dispatch validation.** Before spending a token, the scheduler checks that the provider key resolves, the attached skills are ready, the delivery target has credentials, and the MCP servers named by the job resolved. If not, the job is marked `blocked_config` and you get **one** alert, not one per tick. A misconfigured job never spends money.

Cron jobs can also load skills, run inside a project directory (`--workdir`, which injects `AGENTS.md` and makes the file/terminal tools operate there), carry a pinned model and reasoning effort per job, and deliver results back to the origin chat or any configured platform target. And a cron run cannot create more cron jobs — runaway scheduling is disabled by design. Small decisions, all of them in the right direction.

**The Kanban board is the real queue.** Every task is a row in `~/.hermes/kanban.db`. A dispatcher loop sweeps boards, reclaims stale claims and crashed workers, promotes tasks whose parents are done, and spawns the assigned profile as a full OS process with its own workspace. Tasks have statuses (`triage`, `todo`, `ready`, `running`, `blocked`, `review`, `done`), dependencies, comments that become context on the next spawn, blockers with kinds (dependency, needs_input, capability, transient), and **PR completion contracts**: a card can declare `OWNER/REPO`, and it cannot complete until the repository's own required checks pass on the exact head commit. Heartbeats are rows too, so a long run is visibly alive instead of invisibly stuck.

This matters for proactivity because a board is a queue with memory. A cron job that creates three cards and dies still leaves three cards. The work does not evaporate because a process crashed.

**Goal loops.** `/goal` sets a standing objective; after every turn a judge model checks whether it is satisfied and, if not, feeds a continuation prompt into the same session until it is, or the turn budget runs out. Kanban cards can run in the same mode. The documentation is unusually honest about the boundary: `/goal` is single-session and never creates cards; if you want work on the board, you put it on the board. The failure mode is real — a judge that keeps saying "not yet" while the agent rearranges deck chairs — which is why the turn budget and the "one checkpoint near 90% of the budget" notice exist.

**Hooks.** Four systems: gateway hooks (Python handlers on gateway events, gateway only), plugin hooks, shell hooks that can block a tool call, and **outbound webhooks** that push signed lifecycle events to external endpoints. That last one is how Hermes participates in a system it does not own: it tells your CI, your dashboard, or another agent that something happened.

**Where Hermes wins:** the scheduler, the queue and the memory live in the same process, and the delivery target is a chat app. A cron job finishing at 3 a.m. sends a Telegram message that wakes nobody; a failure at 3 a.m. sends one that does. It is MIT, so commercial use is free, and the hosted option keeps the agent alive when your laptop is not. **Where it loses:** there is no native phone app (your phone is Telegram, Signal or WhatsApp), no money budget per agent (turn caps, spend limits on some tools, and the Business plan's per-member caps instead), and the configuration surface is genuinely large. A cron fleet is a pet. You will maintain it.

## Paperclip: the org chart that assigns work

Paperclip starts from the opposite assumption: agents should be dormant most of the time, and the org structure should decide who wakes up. Its documentation lists **four** wake sources, and the framing is worth stealing for your own systems:

| Source | What triggers it |
|---|---|
| Timer | A heartbeat interval ticks, whether or not there is work |
| Assignment | A task is assigned to the agent, or a comment arrives on one of its open tasks |
| On demand | You click "Wake now", or another agent hands over work |
| Automation | A routine fires on its schedule and hands the agent an issue |

Timer heartbeats are **off by default** on new agents, and that default is the most opinionated thing in the product. Their reasoning is the paragraph I quoted earlier: noise produces pausing, pausing kills the event-driven wakeups you actually want. The recommended combination is *heartbeat off, wake on demand on*, which means the agent looks active in the dashboard 24/7 and consumes nothing until work lands on its desk.

**Routines** are where scheduled work belongs: a reusable job definition with triggers. Supported trigger kinds include a **schedule** (cron, in your timezone, shown in plain English in the UI), a **webhook** (a signed URL anything external can call), a **GitHub webhook**, and an **API trigger**. When a trigger fires, the routine creates or reopens a task, assigns it, and the assignment wakes the agent. The run appears in the inbox with a link back to the routine that caused it, so "why did this agent run?" always has an answer. There is Run now with per-run variable overrides, `{{variable}}` placeholders, per-routine secrets, delivery policies for overlapping runs and missed schedules (coalesce if active, skip missed by default), and a revision history.

**Money.** Budgets exist per company, per agent and per project. A warning fires at 80% by default and a hard stop at 100%: Paperclip pauses the scope, cancels queued and running runs, and rejects new ones, while keeping tasks assigned so they resume when you raise the cap. Company and agent budgets reset at 00:00 UTC on the first of the month; project budgets are lifetime by default. Only a board-level user can raise a cap. Every run records provider, model, tokens and cost, and the spend is attached to both the run and the issue.

**Governance.** Sensitive actions can require human sign-off. Big efforts can require a plan review before anyone is staffed on them; changing the plan resets the approval. Execution policy has three layers — a comment is always required to close, a review stage is optional, an approval stage is optional — with a review-round counter (three by default) that escalates to a human when two agents cannot converge. The audit trail records what the agent read, decided and did.

**Where Paperclip wins:** it is the only one of the three where "who is allowed to spend what, and who signs off" is a first-class object rather than a convention. If three people share the agent team, this is the difference between a system and an incident. **Where it loses:** it is a server you run (Node 24.11+, Postgres), there is no native phone app (a responsive web UI, reachable with Tailscale or a VPN), the cloud is a waitlist, and there is no per-agent persistent memory — context lives in tasks and threads, by design. Paperclip's answer to "what did we learn last month" is a document in a task, not a memory file.

## Same job, four ways

Abstract comparisons are useless. Here are four concrete jobs, run through each platform the way I would actually run them. No tool wins all four.

### Job 1: a nightly build digest in chat

The job: every night at 02:00, run the test suite, summarise failures, and put the result where I will see it with coffee.

**OpenBot.** A routine on the `test-engineer` agent: *"Run `./gradlew testDebugUnitTest`, list tests that failed since the previous run, and nothing else."* It fires at 02:00, works in its own thread, and the result is in the app. Delivery to Slack, Discord or Telegram is supported for agents, so the digest can also land in a channel. If the laptop is closed and you are on a hosted server, the server wakes before the routine. If you are on the desktop app, nothing runs — this is the honest limitation, and it is the reason the hosted tier exists.

**Hermes.** One cron job with `--workdir` pointing at the repo, so `AGENTS.md` and the terminal tools are in the right place, and delivery to Telegram. If the job only needs to run a script and paste the output, `no_agent` mode makes it free. If the test command fails because the provider key expired, preflight marks it `blocked_config` and tells you once instead of forty times.

**Paperclip.** A routine with a schedule trigger assigned to the QA agent, producing a task each night. The run is a real task with a comment thread, so the digest from three weeks ago is searchable, and the spend for each night is recorded. If the QA agent's budget is exhausted at 100%, the routine's task is created and waits instead of silently not running.

**Verdict.** Hermes for a solo developer (cheapest, most control, delivers to a chat app). Paperclip if the digest is part of an auditable process. OpenBot if you already live in the app and your machine is on, or you pay for a hosted server.

### Job 2: a pull request arrives at 23:40

The job: when a PR is opened, review it, run the checks, and either approve with a summary or request changes.

**OpenBot.** A webhook routine wakes the reviewer agent; the agent works in a channel with the implementer agent, takes ownership of the task, and hands back. Handover is a message, so you can read the reasoning chain in the morning. What OpenBot does **not** give you is an approval that the runtime enforces: the agents can say "approved" and nothing stops a merge. The gate is your branch protection.

**Hermes.** A cron job with a webhook route fires immediately on the GitHub event, or a card is created on the board and the dispatcher picks it up. The review is a card transition: `kanban_request_review` moves it to a reviewer profile, `kanban_request_changes` sends it back with a comment, and a PR completion contract means the card cannot be closed until the repo's required checks pass at the exact head commit. That last part is the difference between "the agent says it works" and "the repository agrees".

**Paperclip.** A GitHub-webhook-triggered routine creates a task, the assignment wakes the reviewer, and the execution policy routes the close through a review stage and, if you configured one, a human approval stage. The agent literally cannot mark it done without the comment and the sign-off. With budgets, a review loop that ping-pongs costs money you can see and stop.

**Verdict.** Paperclip, if the PR is a business process with a sign-off. Hermes, if you want the board and the repo to be the same source of truth and you are the only human. OpenBot, if the value is watching the two agents argue and you will read it later.

### Job 3: stop it, it is spending money

The job: an agent gets enthusiastic at 01:00 and starts generating 400 variants of a puzzle.

**OpenBot.** You can Stop the run and Reassign the channel. There is no money budget per agent; the limit is the provider plan, and the backup model may quietly move the agent to another provider when the first one hits its cap. That is great for continuity and terrible for cost surprise, in exactly the same way.

**Hermes.** No per-agent money cap. What you have: turn budgets, per-job model pins (so a cheap model runs the noisy job), `no-agent` mode for anything that does not need a model, and the ability to stop a running cron job without touching its schedule. If you run an MCP tool with spend limits, those apply. For money, the honest answer is that Hermes gives you levers, not a ledger.

**Paperclip.** This is the case the product was built for. 80% warning, 100% hard stop, queued and running runs cancelled, new work rejected, tasks preserved until you raise the cap, and a per-run cost record you can attribute to a person and a project.

**Verdict.** Paperclip by a wide margin. If you run agents that touch paid APIs, a hard stop with an audit trail is not a nice-to-have.

### Job 4: the machine restarts at 04:00

The job: a deploy, a kernel update or a crash happens mid-run, and the work must not silently disappear.

**OpenBot.** Queues are crash-safe and persisted, conversations survive restarts, and hosted servers stop and resume around routines. On the desktop app, a crashed run is a crashed run; you will see it when you open the app.

**Hermes.** The Kanban board is SQLite on disk. A worker that dies is reclaimed by the dispatcher (PID gone, claim expired), the task returns to `ready`, and a new worker is spawned with the comment thread as context. Cron runs have admission recovery: an interrupted run keeps its identity, and a known terminal result is handed to the delivery queue without re-running the agent.

**Paperclip.** Runs are rows with status and audit; a stuck heartbeat is a documented debugging path rather than a mystery, and the task stays assigned. Routines have explicit catch-up policies for what happens when the scheduler was offline.

**Verdict.** Hermes and Paperclip, in that order for a solo setup. OpenBot is honest about being an app: durable queues, not a durable service.

### Job 5: ask from the train

**OpenBot** has native iPhone and Android apps that connect to your computer, so the agent's workspace is in your pocket with no VPN.

**Hermes** has no native app; the phone is Telegram, WhatsApp, Signal, Slack or SMS, and the agent answers there with the same memory. Hermes Desktop and the browser webapp cover the desktop side.

**Paperclip** has a responsive web UI that works as a PWA, but by default it listens only on the machine; remote access is Tailscale, a VPN, or a public address you configure.

**Verdict.** OpenBot for a native app, Hermes for "it is already in my chat app", Paperclip for "I will open it on the laptop".

## Memory and skills: what survives the night

Proactivity without memory is just automation with extra steps. The comparison here is less flattering to two of the three, so let me be specific.

| | OpenBot | Hermes Agent | Paperclip |
|---|---|---|---|
| Per-agent persistent memory | Yes — instructions, saved memories (with limits), workspace | Yes — `MEMORY.md` + `USER.md` per profile, injected as a frozen snapshot, hard character budget | No — context lives in tasks, threads and project docs |
| Skills | Yes — skills, plus a Marketplace; imports Hermes custom skills | Yes — progressive-disclosure skills, self-authored during work via `skill_manage` | Yes — company skills library, versioned and testable in Skill Studio |
| Recall of past sessions | Conversation history per agent | FTS5 session search across history | Task search; audit runs |
| What compounds over months | Instructions you refine, files in the workspace | Memories + skills + session archive | Documents, plans and process |

The practical difference: with Hermes, the tenth time the agent debugs a Gradle daemon issue, it writes a skill about it and the eleventh time is cheap. With OpenBot, you get a stable workspace and a well-written instruction file, and the improvement is the one you wrote. With Paperclip, the improvement is organisational: better plans, better review, better budgets — the knowledge lives in the company, not in one agent.

None of those is wrong. But if your question is "will this thing get better at my specific job without me retraining it", Hermes is the only one of the three with a mechanism for that.

## Money and licence

| | OpenBot | Hermes Agent | Paperclip |
|---|---|---|---|
| Code licence | PolyForm Noncommercial 1.0.0 | MIT | MIT |
| Commercial use | Paid licence (Starter €10/mo; Team €25/mo base for 2 seats + €15 per extra seat up to 10; 10% less with a hosted server, 20% annual discount) | Free, including commercial | Free, including commercial |
| Hosted | EU servers from €20/$25 per month (Starter), billed monthly or annually | Hermes Cloud: Free / Plus $20 / Super $100 / Ultra $200 per month; Business has no public price | Cloud: waitlist only, no price published |
| What you pay for models | Your existing ChatGPT / Claude / Gemini / Grok plans, or API keys | 200+ models through Nous Portal, or your own keys | Whatever your agents' adapters use; every run's cost is recorded against a budget |
| Self-host | Desktop app, or VPS with Docker | CLI, gateway, desktop, webapp | One Node.js process with embedded Postgres |

Two things people get wrong. First: OpenBot is free for personal and non-commercial use, and **that stops the moment your project earns money** — the article you are reading describes a platform that would need a commercial licence if it made revenue. Second: Hermes Cloud's $20 is a hosted agent, not a licence fee; self-hosting is genuinely free and MIT. Paperclip's cloud does not exist yet in any purchasable form, so any comparison that quotes a Paperclip Cloud price is inventing it.

## Decision matrix

| If this is you | Pick | Because |
|---|---|---|
| Solo dev, one machine, wants agents that use existing ChatGPT/Claude plans, wants them on the phone | **OpenBot** | Native mobile, plans you already pay for, Vault for logins, backup model |
| Solo dev with a server, wants agents that never stop and remembers everything, lives in Telegram | **Hermes** | Cron + webhooks + Kanban + memory + MIT, for the price of the models |
| 3–10 people sharing agents, with money that needs a cap and work that needs sign-off | **Paperclip** | Org chart, budgets, execution policy, private projects, audit |
| A product that must run overnight, unattended, and recover from crashes | **Hermes**, or **Paperclip** if a team is involved | Durable queue and scheduler with recovery semantics |
| Marketing/demo of a team of agents on a desktop, today | **OpenBot** | It is an app. You download it and it works |
| A hard budget ceiling per agent per month | **Paperclip** | Hard stop at 100%, recorded spend per run |
| Agents that must get better at your domain over time | **Hermes** | Self-authored skills + memory + session search |

## The combination nobody documents well enough

These are not mutually exclusive, and the most interesting setups use two of them.

**Hermes inside Paperclip.** Paperclip ships a Hermes adapter (local) and a gateway adapter. Two paths: *invite* an external Hermes that already runs on another machine (copy the invitation prompt into Hermes, approve the join request, and Paperclip sends tasks to Hermes's API server), or create an agent with the Hermes card on Paperclip's host and let Paperclip start it on a heartbeat. The local adapter takes model and provider, a toolset list, `timeoutSec`, `maxTurnsPerRun`, `persistSession`, `worktreeMode` and checkpoints; Hermes reads its model from `~/.hermes/config.yaml`, not from Paperclip.

The division of labour is clean: Paperclip owns the org chart, the budgets, the review and approval stages and the audit trail; Hermes owns memory, skills, the 30-odd tools, MCP and multi-provider routing. Hermes reports token usage and cost back, so a Paperclip budget can pause it. And in the gateway path, **each Paperclip task gets its own Hermes session**, which is exactly what you want: the memory of a task does not leak into the next one, but the profile's memory and skills still apply.

**Hermes inside OpenBot.** OpenBot's importer turns Hermes profiles into agents: instructions, memories from `MEMORY.md` and `USER.md`, custom skills, supported routines. It leaves credentials, chat sessions, bundled skills and MCP settings behind, with a report of what was skipped. If you want the desktop-and-phone experience with the agent you already trained, this is the migration path — and it is a one-way door, so export your Hermes profile first.

**The one combination I would not build:** Paperclip and OpenBot on the same machine, both trying to own the queue. Two schedulers, two sets of budgets (one of them imaginary), two places where a task can be stuck. Pick the owner of the queue.

## What I would actually run

For a personal project with a single developer: **Hermes as the engine and the scheduler, Telegram as the interface, and one cron job that does no LLM work at all** — the cheap monitoring loop that tells you when something is broken. Add OpenBot if you want a desktop cockpit and native mobile apps and you are already paying for Claude or ChatGPT; the two coexist fine as long as you decide which one owns each routine.

For a small team with revenue: **Paperclip as the outer shell, Hermes as the agent runtime inside it, Codex or Claude Code for the code itself.** You get budgets and sign-off where money is involved, memory and skills where the work happens, and a per-task session boundary that keeps one project's context out of another's.

What I would not do is pick one because it has more stars. 263k stars on Hermes means a lot of people wanted an MIT agent that remembers; 113k on Paperclip means a lot of people wanted to stop being the only adult in a room full of agents; 7.6k on OpenBot means a smaller, newer, more focused bet. Those are three different wishes, and the numbers are just the wishes counted.

## Closing: the test that matters

Here is the test I now run on any agent platform before I trust it with a real project. I write one routine that has to produce **nothing to report** nine nights out of ten, and I leave it running for a week.

A tool that wakes on time, does nothing, and stays quiet has earned the next job. A tool that wakes on time, invents something to justify itself, and messages me at 02:40 has told me exactly what it will do to my project at scale. And a tool that silently does not wake at all has told me which of us is responsible for the clock.

OpenBot passes this test on a machine that stays on. Hermes passes it on a machine that does not need to. Paperclip passes it only if the routine is assigned to an agent with a budget and a reason.

The agents are ready to work without you. The question is whether you built the part that decides when.

---

*If you want the practical half of this — a full puzzle platform and brain-training app built end to end with these three, with the nightly flows, the agent roster, the costs and the failure modes — I wrote it as a separate case study: [A Puzzle Platform Run by Agents](/blog/puzzle-platform-brain-training-agents-case-study-2026).*
