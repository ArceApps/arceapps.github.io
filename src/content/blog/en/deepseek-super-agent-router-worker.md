---
title: "DeepSeek Super Agent: Router, Workers, Attention"
description: "DeepSeek's Super Agent ships as an MIT prototype: one Router, many isolated Workers. What it does, what its numbers show and what it costs to run."
pubDate: 2026-11-12
lastmod: 2026-11-12
author: "ArceApps"
keywords:
  - "DeepSeek Super Agent"
  - "dsh-superagent"
  - "DeepSeek Harness"
  - "AI agents"
  - "agent architecture"
  - "Router Worker"
  - "coding agents"
canonical: "https://arceapps.com/blog/deepseek-super-agent-router-worker/"
heroImage: "/images/deepseek-super-agent-router-worker-en.svg"
tags: ["DeepSeek", "AI Agents", "Architecture", "Orchestration", "Open Source", "Indie Dev"]
reference_id: "3b445f6f-1e8a-4589-92f9-9d128d84df18"
---

> **Previously on ArceApps:** I took apart [DeepSeek Harness's plugin runtime](/blog/deepseek-harness-everything-plugin/), compared it with [OpenCode, Codex and Claude Code](/blog/deepseek-harness-vs-opencode-codex-claude-code/), and reviewed [the Desktop build](/blog/deepseek-harness-desktop/). This article moves one floor up: what happens when the agent stops being a window you open and becomes a service that watches a repository while you do something else.

On 31 October 2026 the DeepSeek Harness team published an essay instead of a product. It was called *Exploring Super-agent Design: Towards a More Autonomous Agent System*, it appeared first on WeChat and then as an X article, and it came with a small gift: an MIT-licensed repository called `dsh-superagent-prototype`. No launch event, no livestream, no benchmark table designed to win an argument on social media.

By the time I checked, on 12 November 2026, that repository had 22,733 stars and 2,766 forks, and its last push was nine days old. That ratio of attention to actual code churn tells you most of what you need to know. People are not cloning it because they intend to run a coding agent for a whole team tomorrow. They are cloning it because the essay makes an argument they have been feeling for months without being able to name it.

The argument is roughly this: the ceiling for a single task is the model. The ceiling for doing several tasks at once is the human. In the team's own observation, one person can keep track of only three to five active sessions. Past that number you are not supervising agents any more, you are operating a switchboard with a memory problem. And the industry's answer so far has been to keep adding sessions.

I read the essay twice, then read the code, then read the deployment instructions, which are more interesting than either. What follows is not a summary. It is what I found worth keeping, what I think the numbers actually prove, and where I would not follow DeepSeek.

## What DeepSeek actually published

Three things came out at once, and confusing them is the fastest way to misunderstand the release.

The first is an **essay**. It is an architecture document written by people who run this system internally, not a feature announcement. It says so in its first paragraph: it explores engineering ideas, it is not an introduction to existing product features.

The second is a **prototype**. The README is blunt in a way that corporate releases rarely are. It calls the code a research prototype for reference only, "not an official DeepSeek product", says much of the engineering was done by coding agents, warns that the style and practices may be inconsistent, and states that it has been adapted for publication so it is not identical to the internal version. It adds the sentence I wish more teams would write: some designs discussed in the article are directions for future development and are not implemented in this prototype.

The third is the **internal deployment** the essay describes. A Super-agent instance that has been running continuously inside DeepSeek, participating in issue reproduction, code review responses and the development of DeepSeek Harness itself. You cannot download that. You can only read about its shape and try to approximate it with the prototype plus your own infrastructure.

The press flattened all three into one story. Bloomberg's coverage, syndicated by *The Straits Times* on 1 November 2026, called it a prototype coding agent built to rival Anthropic's Claude Code that can watch developer group chats and suggest fixes without being asked. Seoul Economic Daily described the same thing as an architecture where routers and workers run multiple tasks at once to ease human attention bottlenecks. Both descriptions are accurate, and both skip the part that matters to me: this is a release about where the *session* sits in an agent system, not about a model getting smarter.

There is no new model here. There is no coding benchmark. There is an argument about system design, a reference implementation of that argument, and a lot of people who recognised the problem.

## The bottleneck is your attention, not the context window

Every agent tool I use has the same failure mode at scale, and it is not intelligence. It is that the unit of work is a conversation. One session, one thread of context, one thing at a time unless I manually open another tab and remember what I was doing in the first one.

The essay names the consequences precisely. A single session gives you continuity, because everything lands in the same context, but it serialises execution behind one ReAct loop and mixes the intermediate details of unrelated tasks into the same window. Open a new session per event and you get throughput, but no global picture, and several sessions answering the same person in different voices. Neither is wrong. They optimise for different things, and most tools make you choose per task, by hand, all day.

The four properties DeepSeek wants are continuity across channels, parallelism across tasks, proactivity on events, and persistence across failures. No single loop provides all four, which is not a controversial claim; anyone who has watched a long tool call block a conversation knows it. The interesting part is the claim that these four properties push you toward a specific architecture, and that the architecture looks suspiciously like things operating systems have been doing for decades.

That framing is honest and slightly deflating at the same time. Fast path and slow path, speculative execution, separating compute from state, an external watchdog, locality-based caching: none of this is new. What is new is assembling it into an agent system and publishing the assembly with measurements, including the measurements that do not flatter it. That is rarer than the ideas.

## One Router, many Workers

The core split is two layers with deliberately unequal jobs.

The **Router** is a long-lived session that owns every human interaction, from every entry point. It keeps the global picture, decides what becomes work, assigns it, and speaks to people. It is also designed *not* to execute. The essay says it may not even have a Bash tool. In the prototype this is visible in the presets: the router gets a reduced tool set for routing, the worker gets the tools for work.

The **Workers** each take one task in an isolated context with a full tool set. They never talk to humans directly. Their reasoning and tool calls stay inside their session; they report status to the Router, and the Router does the replying. Workers usually get the most capable model, the Router often does not need one.

That last point is the one I keep coming back to, because it is a cost decision disguised as an architecture decision. A Router that only has to read a message, decide whether it is work, and attach it to the right context is a long-input, short-output workload. It benefits from prompt caching and from batching, not from deep reasoning. Using your most expensive model there is waste; using a cheap one in a Worker is a false economy.

The comparison with an "Agent Team" is worth internalising, because the words look similar and the work is not. A team lead usually decomposes one hard task into tightly coupled subtasks, which requires understanding the task deeply and coordinating constantly. A Router does not decompose. It decides which independent piece of incoming work deserves a Worker, and keeps the cross-task map. That is why its reasoning load is lower, and why the essay can claim a smaller model often suffices.

The layers are logical, not literal. A Worker can spawn subagents. The Router could be sharded if scale demanded it, at the cost of shared memory. The prototype picks the simplest version: one persistent Router session, subscription-based direct delivery, no direct Worker-to-Worker chatter. Their experiments suggest that at their team size, that simple version holds.

## Triggers, Threads and the fast path

The second half of the design is about what wakes the agent up, and this is where the systems vocabulary earns its keep.

Inputs are no longer prompts typed into a session. They are **Triggers**: group chat messages, review comments, CI results, calendar events. A sequence of Triggers under the same pull request, the same IM topic or the same email thread forms a **Thread**. Workers subscribe to Threads, and the subscription is many-to-many: one Worker can follow several Threads, one Thread can have several subscribers.

That subscription is what makes the routing cheap. The first event of a Thread goes through the Router, which creates a Worker and subscribes it. Every later event in that Thread is delivered by code straight to the subscribed Worker, bypassing the Router entirely. The Router still observes everything, but it only assesses what has not been claimed. If a new event falls outside the Worker's mandate, the Worker can hand it back.

Events that are not on a subscribed Thread take the expensive path, and even there the design avoids calling a model on everything. Filtering is two-stage. Deterministic code checks the cheap facts first: which source, which scope, which allowlist, whether the sender is a bot. Only candidates that survive reach the model, which applies policies written in prompts. The essay borrows the fast path and slow path vocabulary from systems engineering, and the mapping is exact: known frequent decisions in code, semantic judgement in the model.

Context gets the same treatment. Rather than dumping everything into the window, the system inlines what is likely to be needed soon, spills the rest, and keeps IDs so the model can walk back to the full object when it needs to. Chain of Recall is the name they give to following those IDs hop by hop through related Threads and Worker sessions. It is a reference graph with summaries at each node, which is a much more honest way to handle long history than hoping the window is big enough.

The last piece is speculative execution, and it is the one that would change my daily work if it worked reliably. An agent can start preparing a result before anyone asks for it: reproduce a bug mentioned in a group chat, look for a fix, then deliver only if it confirms the problem and finds something simple. Otherwise it stays quiet. In their internal Harness user group, that policy exists. The cost is background compute; the benefit is that the answer is already there when a human asks.

## A loop that stops blocking

Proactivity is useless if the conversation freezes every time a tool runs. The essay is refreshingly concrete about the fix: replace blocking `run()` calls with `start()` and `stop()`. Call `start()`, get an immediate "Started" acknowledgement, keep responding to people, and receive the tool's final result later as a new event message. The model can call `stop()` when something has been running too long.

DeepSeek says the async mechanism already exists in DeepSeek Harness but is not enabled by default. The prototype shows the operational consequences, and this is where the documentation gets genuinely useful. Foreground shell commands move to background jobs after five seconds in the worker preset. If a turn ends with jobs or subagents still running, the Ticket keeps its worker slot. Background work has thirty minutes to finish before shell jobs are killed and the Ticket is reported as waiting, with the Executor's last words and a list of what was killed. Subagents are allowed to continue.

Those limits are the kind of detail that separates a demo from a system. They exist because an agent that can start background work will eventually start work it cannot finish, and something has to decide when to stop pretending. Thirty minutes is arbitrary, but it is a decision, and it is written down.

Channel etiquette follows the same logic. In instant messaging, the rule they tested is hard and slightly wonderful: keep each reply to no more than 100 words. Asynchronous channels get the opposite treatment: a pull request description should be a complete account of problem, change and validation. Same agent, different bandwidth. Most tools I have used get this backwards, dumping reasoning traces into a chat window and leaving review comments one line long.

## Compute, state, machines, watchdog

Sections five and six of the essay are where the design stops being about agents and becomes distributed systems, and where the gap between essay and prototype is widest.

A local agent binds three things to one machine: the compute that advances the loop, the session state that must persist, and the execution environment with its repository, credentials and toolchain. When the laptop sleeps, all three stop. The proposed fix is two splits. First, separate stateless compute in elastic containers from persistent state in a database, so sessions survive restarts and scale horizontally. Second, separate the cloud loop from state-heavy execution environments, leaving the repository where it actually lives and connecting through a lightweight daemon that stores no session state and only executes commands.

They call the result Bring Your Own Machine, and note the difference from Anthropic's "decoupling the brain from the hands" framing: here the first environments to connect are everyday personal machines, intermittently online, holding uncommitted changes and local credentials. That is a harder problem than a managed sandbox, and they say so.

The watchdog is the most interesting small idea in the essay. Process liveness checks do not catch an agent that is running fine while making no progress, or drifting away from the objective. So the watchdog is itself an agent session, outside the main system, woken by scheduled messages, with a model judging whether workers are doing substantive work. Because it has tools, maintainers can ask it in natural language what went wrong, or ask it to change the running system's prompts.

None of that cloud split is what you install. The prototype is a DeepSeek Harness profile on your machine, a local state directory, a worktree per ticket, and a web panel on `127.0.0.1`. The watchdog in `SETUP.md` is an hourly check from another profile that repairs the service when it is not running, which is liveness, not judgement. The essay describes where they are going. The repository is where they are.

## Who is allowed to ask for work

If you skip everything else, read the permission model, because it is the part that turns "proactive" from a marketing word into something auditable.

Each source has an allowlist. Each source has an **admission table** whose rows are receiving scopes, such as a Feishu chat or a GitHub surface, and whose cells decide what an unaddressed message becomes: an explicit request, an inferred candidate, or nothing. Bots are recognised and can only produce candidates, never explicit requests. A candidate carries a strength: explicit, inferred, or not admitted.

Then comes the accept mode, and this is the detail I would copy into every agent I build. `off` means nothing inferred becomes a candidate. `observe`, the default in setup, means inferred candidates are assessed and a positive assessment is recorded as "would accept" without doing anything. `auto` means the assessment actually starts work. You are supposed to start in `observe`, read the recorded decisions, and only then widen.

The authorisation unit is not the session, it is the **Mandate**: an immutable grant recording the policy version, scope, strength, matched rules and the sender's identity. A Ticket ends, but the Mandate does not; only a person's stop withdraws it, and a policy that no longer holds it revokes it. When the policy changes while work is running, the change is delivered to the ticket instead of silently cancelling it.

That whole structure exists to answer one question: what is the agent allowed to do without anyone asking? Most systems answer it in a system prompt and hope. This one answers it in a policy with a version number and a decision log.

It comes with a warning that deserves to be quoted in every review of this kind of tool. The worker presets run with `danger-full-access` as the operator's OS user. A worker can execute programs by path and read your home directory. The documentation's own advice is to use a dedicated OS account containing only the agent's credentials, because the account wrappers do not isolate the process. An always-on agent that can read your entire home directory and act in your GitHub name is not a toy, whatever the licence says.

## What the experiments actually measured

The results section is short, synthetic and more honest than most vendor benchmarks. Four approaches, each run five times, driven by a stream of roughly 300 group chat and CI messages, about twenty of which were work requests. Coding work was replaced by a tool that only consumes time, so the experiment measures scheduling and coordination, not whether the agent writes good code.

| Metric | Super-agent | Single session, neutral prompt |
| --- | --- | --- |
| Task completion p50 | 12.4 min | not reported as p50 |
| Task completion p95 | 15.7 min | 29.5 min |
| Delegation behaviour | Workers by construction | Subagent never invoked in 5 of 5 runs |
| Cache-read tokens per run | 23.23M with direct delivery | higher baseline, exact figure not stated in the same table |

The headline is the p95: 15.7 minutes against 29.5. Divide one by the other and you get roughly 1.9×, which is where the "1.9× faster" headlines came from. It is arithmetic on their figures, not a claim they made, and it measures scheduling under a synthetic workload. With a delegation-first prompt the single session improved and delegated in four of five runs, but still lost overall, and the fifth run produced a long tail because the model decided the task was small and did it itself.

The overhead numbers are the ones I trust most, because overhead is hard to make look good. Removing subscription-based direct delivery left completion times roughly unchanged but increased Router decisions by about 30% and pushed cache-read tokens from 23.23M to 31.77M per experiment, a rise of about 37%. In other words, the cheap-looking optimisation is worth a third of the Router's token bill under this load.

The batching experiment is separate and cleaner. The Router used a real model while workers used a mock. As trigger arrival rose from about one per minute to about forty, average batch size went from 1.0 to 2.8, single request duration from 2.5 to 3.9 seconds, and amortised inference time per decision fell from 6.4 to 1.6 seconds. That is the prefill economics of long inputs and short outputs doing exactly what you would hope, and it explains why a single Router session did not become the bottleneck at their scale.

What the experiments do not show: coding quality, behaviour on a real repository over weeks, cost per merged pull request, or how much human attention was actually saved. Nobody measured interruptions per completed task, which is the metric the whole essay is arguing about. I would like to see that study. Until then, treat the numbers as evidence that the routing works, not that the product does.

## Running it as a solo developer

The deployment document is refreshingly free of hand-waving. You need Node 22.19+ or 24+, pnpm, git 2.32+, Python 3.8+, tmux, GitHub CLI 2.48+, and a DeepSeek Harness version inside the range declared in `package.json` (the docs pin `0.2.1-rc.3`). You need a dedicated DeepSeek Harness profile called `superagent`, kept separate from the one you work in, because the plugin changes process-wide `PATH` and git settings. You need a GitHub *user account* for the agent, with write access, signed into its own `gh` wrapper; a GitHub App will not work, because the system reads the account's notifications. Feishu is optional and needs `lark-cli`.

The install is four commands, and then the real work starts.

```sh
npm install -g @deepseek-ai/dsh@0.2.1-rc.3
git clone <this repository> dsh-superagent && cd dsh-superagent
pnpm install && pnpm build
dsh superagent --from-default-profile web --dump-config > /dev/null
dsh plugin --profile superagent add "link:$PWD"
```

After that you copy a machine configuration with an absolute state directory, decide which repository the agent watches, write a prepare command that creates a git worktree per ticket, and set the policy. The defaults are sensible: port 3082, branch prefix `agent/`, accept mode `observe`, an hourly repair check from your own profile. The panel is local, which is the right default and also a limitation: this is not a service you check from your phone.

The constraint that matters most for someone like me is that an instance watches one GitHub repository. I have half a dozen side projects. Six instances, six dedicated agent accounts, six state directories, six sets of tokens, on a machine that must stay awake. That is not impossible; it is a hobby of its own. The intended user is a team with one repository and several humans, which is precisely the setting where attention is scarce and a shared agent account makes sense.

## Where this fits my own stack

I have written about the layers around this one, and the split is worth keeping straight.

The [plugin runtime](/blog/deepseek-harness-everything-plugin/) is about how capabilities get composed inside a harness. The [comparison with OpenCode, Codex and Claude Code](/blog/deepseek-harness-vs-opencode-codex-claude-code/) is about which harness and model I reach for. The [Desktop review](/blog/deepseek-harness-desktop/) is about what it feels like to use one. This Super-agent essay is about the system that decides which session does what, which is a layer none of those articles touch.

It also overlaps with two things I have already argued. My piece on [model routing for subagents](/blog/model-routing-subagents-coding-agents/) made the case that routing decisions are budget decisions; this essay gives that argument a measured example, where bypassing the router for subscribed threads saves about a third of its tokens. And [Dark Factory](/blog/dark-factory-agentic-infrastructure/) described the always-on software factory as an aspiration; here is a reference implementation of the plumbing, with the security chapter still unwritten.

The security piece is not hypothetical either. My notes on [agent security failures](/blog/agents-chaos-ai-security/) and on [agent memory benchmarks](/blog/agent-memory-benchmarks-mem0-letta-graphiti-langmem/) point at the same two cracks this design has: untrusted input reaching an always-on actor, and long-term memory that nobody has costed. DeepSeek's own open questions say the same thing, which is either humility or an accurate risk register. Probably both.

## The uncomfortable parts

The essay's security section is the most honest page in the release, and it should worry anyone planning to run this on a machine with credentials. An always-on loop connected to cloud infrastructure and to device daemons assumes mutual trust between them. If the loop is compromised through a server intrusion or prompt injection, every connected device is potentially reachable. Even without a compromise, credentials that enter the model's context can leak. Their conclusion is that mechanisms are needed to use credentials without the model ever touching them, and that until then a Super-agent can only operate inside a small trusted scope.

Their long-term memory answer is equally unsatisfying: the Router plus Chain of Recall handles recent tasks, but operation across months is the scalability bottleneck. Anyone who has run a long-lived agent knows that this is not a detail. It is the difference between a system that gets better with history and one that slowly forgets why it exists.

Then there is the engineering reality of research code. The README warns about inconsistent style and practices. The peer dependencies are pinned to `0.2.1-alpha.2` packages while the install pins `0.2.1-rc.3`, which is the kind of mismatch that produces an afternoon of debugging. There are tests, plenty of them, but no support contract and no compatibility promise. Zero open issues on a repository that popular is not a health signal; it is a sign that nobody expects to file one.

And the independent validation is thinner than the star count suggests. When I checked Hacker News on 12 November 2026, the most popular submission of the repository had 11 points and no comments. The discussion that did happen was mostly on X and in Chinese-language technical blogs. That is not a reason to dismiss the work; it is a reason to read the code instead of the reaction.

## What I would steal

Five ideas, ordered by how quickly I could use them in my own tooling.

**Subscription as a fast path.** Keep the expensive coordinator for starting work, and route follow-ups by identifier. It is the cheapest throughput win in the whole design, and it does not require a new model.

**Observe before auto.** Record what the agent would have done, review the log, then widen permissions. This is a five-line feature in most orchestrators and it changes the failure mode from "it did something wrong" to "it would have done something wrong".

**Attention as a budget.** Count interruptions per completed task, not just tokens. The essay's whole premise is that human attention is the scarce resource, and then its experiments measure minutes and tokens. I can measure the thing I actually care about in my own workflow.

**Deterministic filtering before the model.** Allowlists and scope checks in code, semantic judgement only for survivors. My cron jobs already do a crude version of this; doing it deliberately would cut a lot of pointless calls.

**Ticket is not session.** A follow-up should resume the work item with its mandate and history, not reopen a chat and hope the context comes back. The prototype's ticket stages, with explicit waiting states and a person-review stage, are a good vocabulary even if you never install it.

## Verdict

Read the essay. Clone the repository if you enjoy reading TypeScript that was largely written by the thing it describes, which is a strange and slightly melancholy experience. Do not put it in production, and do not run it on the machine where your SSH keys live unless you have followed their advice about a dedicated OS account and a dedicated GitHub identity.

As an architecture document, it is the most useful thing I have read about agents this autumn, because it stops pretending that the hard part is the model. The Router without a shell, the admission table, the observe mode, the token cost of direct delivery: these are decisions I can evaluate, disagree with and copy. That is what I want from a release like this. Not a promise that my work is now autonomous, but a map of where the seams are.

The part I remain unsure about is whether the two-layer split survives contact with messy, long-lived projects. Their own open questions say the memory model and the security model are unsolved, and those are not footnotes. But the diagnosis is right, and the diagnosis is the valuable part: past three to five sessions, the limit is me.

## References

1. **Exploring Super-agent Design: Towards a More Autonomous Agent System** — DeepSeek Harness Team. *The original essay, published in Chinese on 31 October 2026 and as an X article on 1 November 2026; sections 2–9 are the source for every architectural claim here.* [https://x.com/i/article/2116829218935857152](https://x.com/i/article/2116829218935857152)
2. **Exploring DeepSeek Super Agent Design (full English translation)** — Offloop. *Unofficial complete translation used for quotation; the Chinese original remains authoritative.* [https://offloop.org/learn/exploring-deepseek-super-agent-design](https://offloop.org/learn/exploring-deepseek-super-agent-design)
3. **dsh-superagent-prototype README** — GitHub, deepseek-ai. *Scope, the "research prototype, not an official DeepSeek product" warning and the list of designs not implemented.* [https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/README.md](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/README.md)
4. **000 Philosophy** — dsh-superagent docs. *Attention as the design budget; act only when asked or when a written rule allows it.* [https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/000-philosophy.md](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/000-philosophy.md)
5. **001 Domain model** — dsh-superagent docs. *Source, Trigger, Thread, Eval, Mandate, Ticket, Assignment, Subscription and the rules each keeps.* [https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/001-domain.md](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/001-domain.md)
6. **002 Authorization** — dsh-superagent docs. *Allowed lists, admission table, request strength and the `off` / `observe` / `auto` accept modes.* [https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/002-authorization.md](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/002-authorization.md)
7. **003 Execution** — dsh-superagent docs. *Ticket stages, worker slots, the thirty-minute background limit and the router/worker presets.* [https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md)
8. **006 Deployment** — dsh-superagent docs. *Prerequisites, install commands, `danger-full-access`, the dedicated OS account recommendation and the local panel.* [https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/006-deployment.md](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/006-deployment.md)
9. **007 Architecture** — dsh-superagent docs. *Runtime, Engine and the module map behind the domain model.* [https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/007-architecture.md](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/007-architecture.md)
10. **SETUP.md** — dsh-superagent. *Agent-guided setup and defaults: profile `superagent`, port 3082, branch prefix `agent/`, `observe` mode, hourly repair check.* [https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/SETUP.md](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/SETUP.md)
11. **package.json** — dsh-superagent. *Version 0.1.0 under the MIT licence, `engines.dsh` at `^0.2.1-alpha.2`, Node 22.19 or 24.* [https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/package.json](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/package.json)
12. **Repository metadata** — GitHub REST API. *Created 2026-10-31T09:32:46Z, last push 2026-11-03T09:29:14Z, 22,733 stars and 2,766 forks when queried on 2026-11-12.* [https://api.github.com/repos/deepseek-ai/dsh-superagent-prototype](https://api.github.com/repos/deepseek-ai/dsh-superagent-prototype)
13. **DeepSeek Harness** — DeepSeek. *Official product page: public preview, open source, "everything is a plugin" architecture.* [https://www.deepseek.com/en/harness/](https://www.deepseek.com/en/harness/)
14. **DeepSeek drops enhanced coding agent with aim to rival Anthropic** — The Straits Times / Bloomberg, 1 November 2026. *Launch coverage that frames the prototype as a Claude Code rival and dates the WeChat post to 31 October.* [https://www.straitstimes.com/asia/east-asia/deepseek-drops-enhanced-coding-agent-with-aim-to-rival-anthropic](https://www.straitstimes.com/asia/east-asia/deepseek-drops-enhanced-coding-agent-with-aim-to-rival-anthropic)
15. **DeepSeek Unveils 'Super Agent' to Run Multiple Tasks at Once** — Seoul Economic Daily, 1 November 2026. *The router-and-workers framing and the human attention bottleneck.* [https://en.sedaily.com/world/2026/11/01/deepseek-unveils-super-agent-to-run-multiple-tasks-at-once](https://en.sedaily.com/world/2026/11/01/deepseek-unveils-super-agent-to-run-multiple-tasks-at-once)
16. **Hacker News submissions mentioning dsh-superagent** — Algolia HN Search API. *Top submission scored 11 points with no comments when queried on 2026-11-12.* [https://hn.algolia.com/api/v1/search?query=dsh-superagent&tags=story](https://hn.algolia.com/api/v1/search?query=dsh-superagent&tags=story)
17. **DeepSeek Harness's "Super-agent" design: a Router with no Bash** — sysnote, 1 November 2026. *Independent analysis of what the essay claims versus what the prototype ships.* [https://sysnote.net/news/deepseek-harness-super-agent-design-router-workers](https://sysnote.net/news/deepseek-harness-super-agent-design-router-workers)
18. **DeepSeek's Super-agent Design Puts a Router Behind Every Task** — NYU Shanghai RITS, 2 November 2026. *Summary that emphasises the attention argument over the model itself.* [https://rits.shanghai.nyu.edu/ai/deepseeks-super-agent-design-puts-a-router-behind-every-task/](https://rits.shanghai.nyu.edu/ai/deepseeks-super-agent-design-puts-a-router-behind-every-task/)
