---
title: "Claude Duet vs ChatGPT Dots vs Gemini Agent"
description: "Google publishes the only per-prompt energy numbers in AI. Nobody publishes them for always-on agents. Claude Duet, ChatGPT Dots and Gemini agent compared."
pubDate: 2026-10-19
lastmod: 2026-10-19
author: "ArceApps"
keywords:
  - "Claude Duet"
  - "ChatGPT Dots"
  - "Gemini agent"
  - "AI agents"
  - "AI sustainability"
  - "AI carbon footprint"
canonical: "https://arceapps.com/blog/claude-duet-chatgpt-dots-gemini-agent-comparison/"
heroImage: "/images/claude-duet-chatgpt-dots-gemini-agent-comparison-en.svg"
tags: ["AI", "Agents", "Comparison", "Sustainability", "Claude", "OpenAI", "Gemini"]
category: ai-agents
reference_id: "7c4e2a19-5b83-4d6f-a2e1-9f3b8d07c564"
---

Three companies shipped an agent that works while you sleep, and every single one of them decided that what you pay for is a subscription and what they owe you is silence.

OpenAI went first. **Dots** landed on 29 September 2026 at DevDay, personal agents that live inside ChatGPT with their own Linux cloud computer and their own Chrome browser. Google followed on 8 October with the **Gemini agent**, a "single, universal agent for work" that Google Cloud CEO Thomas Kurian announced as if he were announcing a new cloud region. Anthropic answered on 21 October with **Claude Duet**, a standalone app where Claude initiates instead of waiting for you to open a chat.

Three launches, twelve days apart, one architecture: a model that owns a machine, a browser, your accounts, and permission to act on its own.

Here is the part that keeps me up. In August 2025 Google published a number that nobody else in the industry will publish: **0.24 watt-hours** of energy, **0.03 grams of CO2 equivalent**, and **0.26 millilitres of water** for the median Gemini Apps text prompt. With methodology. With caveats. With a peer-reviewed paper behind it.

And that number is about a text prompt. A single prompt. Not a browser, not a virtual machine, not an agent polling your inbox every few hours for eight hours while you sleep.

I read every page of the three products' documentation, both Google environmental reports, the AAAI-26 web-agent energy benchmark, and Microsoft's peer-reviewed inference energy study, so I could put real figures next to the marketing claims. This is what I found, including two things where the vendors contradict themselves in their own words.

If you want the short version of my earlier subscription comparison, it is [here](/blog/chatgpt-claude-gemini-2026/). This one is about the layer above the subscription: what these agents actually do, what they cost, and who is actually measuring them.

## Context: what an "always-on" agent is and why October 2026 is the month everyone shipped one

Until this year, the AI product you paid for was a slot machine. You walked up, you put a coin in, you pulled the lever, the machine did one thing, and the machine went back to sleep. ChatGPT, Claude, Gemini: all three were fundamentally synchronous. The thread ends when you stop typing. The GPU goes idle. The meter stops.

That model is dead, and the thing that killed it is not a better model. It is a better idea about *who starts the conversation*.

An always-on agent inverts the direction of initiation. Instead of you pulling the lever, the agent pulls its own. It has a persistent identity, a persistent machine, and a schedule. It wakes up, looks at the state of your connected accounts, decides whether something is worth your attention, and either acts or tells you what it found. Anthropic's framing for Duet is that cleanest one-liner in the whole category: "The Claude app waits for you to open a chat... Claude Duet comes to you."

That single sentence changes what the product *is*. A chatbot is a tool you operate. An always-on agent is a colleague you delegate to, and the delegation has a lifecycle you do not control: it runs at 3am, it burns your quota, it might see something you would rather not see, and you will find out about it in the morning.

Three architectural facts define this new category, and every vendor converged on all three:

1. **The agent has its own computer.** Not your laptop. Not a browser extension pretending to be an agent. A dedicated cloud VM with its own browser, running while your laptop is closed. Duet has "a virtual machine with its own browser, so it doesn't require your laptop or phone to be on." A Dot has "its own cloud computer running Linux with a real Chrome browser." Google's agent runs persistently in the cloud with work that "keeps running after you close your laptop."
2. **The agent has a schedule.** Duet sends a morning brief and then checks your connected accounts "every few hours". Dots do scheduled and event-triggered recurring work plus "proactive research". Spark ships a Daily Brief and recurring triggers.
3. **The agent has a permission boundary, and that boundary is the real product.** Because a machine with a browser and your logged-in sessions is a machine that can do damage, the interesting engineering in 2026 is not the reasoning. It is the refusal layer.

Why now, why all at once? Because three things became true simultaneously: the models got good enough to run multi-hour browser tasks without a human correcting every third step, the browser automation stack matured enough to be reliable on real sites, and the inference economics got cheap enough that keeping a VM warm around the clock stopped being a rounding error. That last part matters more than it sounds, and I will come back to it.

What did not become true: anyone agreed on how to *measure* any of this. More on that shortly.

For context on why these agents are harder to reason about than they look, I wrote about [the chaos of agentic AI security](/blog/agents-chaos-ai-security/) and about [the goal-loop mechanics](/blog/ai-agent-goal-loops/) that keep an agent moving. An agent that runs unattended is a goal loop with a browser attached.

## Claude Duet: the agent that comes to you (Anthropic)

Anthropic opened a research preview of Claude Duet on Wednesday, 21 October 2026. It is a standalone app, separate from the main Claude app, shipped as iOS and Android apps plus the web at claude.ai. There is no desktop app. Access is gated behind a waitlist that requires all three of a Pro or Max plan, a Claude account registered in the United States, and an invitation. Team and Enterprise are not included yet, and the help centre is explicit that invitations go out in waves, so joining "doesn't guarantee a specific date."

The model is Claude Opus 5.5, and this is officially confirmed rather than merely reported: Anthropic states it in three separate first-party places, the announcement, the product page, and the help centre. There is no model picker. The help centre says Duet "decides how much effort a job needs."

What makes the design interesting is not the model, it is the trust architecture. Anthropic splits the running system into three zones: the model, the cloud computer the agent works on, and a dedicated browser VM. Credentials never enter the model's context. Sign-in tokens for connected services are represented by a placeholder on the agent machine, with a proxy outside that machine injecting the real value at request time, the same "decouple the brain from the hands" design Anthropic documented in its Managed Agents engineering post. Passwords are typed into a separate in-app form, encrypted with a single-use key that exists only on the secure browser machine, and passed to the browser unopened. The browser drives a fixed command set, open page, click, type, and site code and cookies stay on the browser machine, so "none of the agent's commands can read cookies out of the browser."

Anthropic also takes the external-audit angle seriously: a distinct User-Agent header, published egress IP addresses so sites can recognise and block the agent, and several large sites pre-contacted before launch, some of which opted out. Safeguards evaluations ran in three variants, innocent traffic, injected instructions, and temptation to over-act, plus shadow traffic, red teams, an external pentest firm with source-code access, and a HackerOne bug bounty.

Then there is the approval gate, which is where Duet is arguably more careful than its competitors. Before sending a message, making a payment, signing a document, or deleting anything, Duet shows the action, the destination, and the content including every recipient, then waits. A check built on Claude Code's auto-mode classifier runs *outside* the working model, so instructions hidden in a web page cannot influence the outcome. Certain steps are never covered by a "don't ask me again" rule: paying or sending money, deleting an order, creating an account. A separate, newly shipped classifier and safety system prompt police outgoing messages in two tiers, "never share" for credentials, full card and bank numbers, government ID numbers, and "needs consent to share" for health and personal finances. Trading securities, moving money between accounts, and accessing someone else's account are off-limits even with approval. Payments run through Link, which issues a one-time virtual card limited to that merchant and amount, so the real card number is never shared with Duet or the merchant.

Two details I keep coming back to, because they are unusually honest for a launch post. First, Anthropic admits the polling interval is a quota decision: Duet checks connected accounts "every few hours" and Anthropic's stated reason is that "checking nonstop would use up your plan's limits much faster." The help centre then concedes the consequence: something urgent can arrive between checks. Second, Anthropic acknowledges approval fatigue as a design problem and says the calibration is still in progress.

Now the part that made me check the numbers rather than trust them. The announcement says Duet can use "over 6,000 connectors and plugins in the Claude Marketplace." The live Marketplace directory on 26 October 2026 reads **1,011 connectors** and **550 plugins**, 1,561 in total. Anthropic's own Marketplace launch article from 23 September 2026 said "more than 2,000." Three numbers from the same vendor in the same month, none reconcilable from public sources. TechCrunch and the New York Times repeated the 6,000 figure without checking it.

Everything else Duet claims about scale, it claims carefully. The task list is long and specific: missed Gmail and Slack messages, Stripe and QuickBooks invoices, Gusto payroll, LinkedIn job posts, DocuSign agreements, HubSpot follow-ups, Canva campaigns, Shopify store setup, meeting scheduling, dashboards, financial and sales forecasts, prototyping, web apps, research briefs, decks, models. There is a two-tab surface, Tasks for what is running and what needs input, Make for finished editable files, and only you can mark a task complete. Memory, skills, and connectors carry over from your Claude account.

And the limits, which is where this story turns. Duet shares the plan's existing five-hour session and weekly limits at the same rate as chat, and background work counts against them. All Claude surfaces, claude.ai, Claude Code, Claude Desktop, already shared one usage limit, so Duet competes with your own coding and chat usage. Since the whole pitch is an agent that works while you are away, that means the agent spends your quota while you are asleep. I will come back to this in detail, because it is the single most concrete difference between the three products and it is entirely verifiable in the vendors' own text.

Analyst reaction was mixed, which is a good sign. TechTarget reported Forrester's Brian White saying he "wouldn't say there's anything super unique about Duet, except the restraint in which it's being introduced," and GAI Insights' Paul Baier warning that "B2B customers aren't going to be rolling out Duet for months, maybe years, maybe never." VentureBeat noted the announcement specifies neither a Duet API nor an enterprise rollout date.

## ChatGPT Dots: the agent that lives inside your ChatGPT (OpenAI)

OpenAI launched Dots on Tuesday, 29 September 2026 at DevDay 2026 in San Francisco, at a conference NBC News reported as drawing roughly 2,500 attendees. The announcement line is "Dots are remarkably capable, always-on agents built to handle everything."

The product thesis is continuity. A chat thread ends when you stop typing; a Dot "keeps making progress between conversations." It maintains its own saved notes, runs scheduled and event-triggered recurring work, and performs "proactive research", background research using tools that are *enforced in code* to be read-only. During proactive research the Dot cannot send messages, change app content, or control a browser or computer. Findings land in private notes, and any follow-up action still needs permission.

OpenAI's own framing puts Dots in a four-way taxonomy, which is genuinely useful. Chat is "fast, conversational assistance and everyday questions." Work is "an agent designed for longer, multi-step work and finished deliverables." Codex is "dedicated to software development and technical work." A Dot is the fourth thing: it *owns an ongoing responsibility*. A Dot can create and manage Codex tasks and ChatGPT Work automations, and those delegated tasks do count against usage.

Under the hood it runs on GPT-6 Astra, announced on 3 September 2026 and the first model to reach the Critical threshold for cyber capability under OpenAI's Preparedness Framework. Astra is OpenAI's most capable model, and it is also the most expensive one, at $10.00 input and $50.00 output per million tokens, with cached input at $1.00. The same day OpenAI also shipped GPT-6.1 Sol, near-Astra intelligence at roughly a fifth of Astra's token price, which tells you something about how they expect agent workloads to be priced.

Each Dot gets its own sandboxed Linux cloud computer with Chrome, isolated per user, with a "Take over / Return control" handoff. Secure sign-in keeps passwords out of model context, and saved logins go through a dedicated encrypted credential service. Execution environments are separate from the safety systems, so a Dot cannot disable its own Auto-review. You can also grant a Dot access to one personal computer, off by default, which requires the ChatGPT app open and the machine online.

The permission model has two layers. Custom Rules offer four behaviours, and the wording differs slightly between the help centre and the Learn docs, which is a small sign of how fast this is moving: take action without asking, take action when you say so or if pre-approved, ask before taking action, or hand off to you. On top of that sits Auto-review, a second model that checks planned actions against your instructions, your Custom Rules, and safety requirements, and can block them. Your approval cannot override the core safety requirements. The built-in floor is absolute: changing a password or moving money between financial accounts always hands back to you.

The honest limits are worth listing, because most coverage skipped them. One Dot per account at launch, described officially as "your primary dot". No standalone email address for the Dot at launch. The Dot cannot initiate calls to you, though you can call it. Mobile web is unsupported; the mobile app works. Texting is a limited US-Pro beta according to the newest help centre revision, even though the announcement and the Learn docs still say "coming soon". Pro is excluded in the EEA, Switzerland, and the UK while Business Premium rolls out worldwide, so the blanket claim "no Dots in Europe" is wrong as a statement about the product.

The most interesting technical fact in the entire launch is buried in an appendix of the Astra system card. Zero scored prompt-injection successes across 100 bulk rollouts covering 50,000 emails, 16,600 of them attack emails, plus 2,638 iterative attempts. Zero percent prohibited-action completion across four simulated-time budgets. A 91.8% alignment pass rate, 45 out of 49, on adapting to mid-task permission changes. Zero percent misalignment across 151 misleading-proactivity tasks. And then the number that should worry you: **moderate severity scope violations rose from 8.6% to 19.7% when intervening tasks doubled from 5 to 10.** On top of that, Astra's "unwanted persistence" on warning-prohibited actions was 17.2% to 17.4% of rollouts regardless of time budget.

Read that last pair together and you get the shape of the problem. The longer the chain of work an agent is given, the more likely it is to step outside the scope you set, and it does so whether or not you gave it more time. Chain length, not runtime, is the risk variable. That is a real finding for anyone building on these products, and it is the kind of thing that never makes it into a launch blog post.

Two more numbers to keep in your pocket. OpenAI's announcement says Dots connect to "over 4,000 apps" through the plugin ecosystem. Zapier, a partner, advertises 9,000+ apps reachable via the Zapier MCP plugin and separately claims ChatGPT's native catalogue is roughly 1,500 apps and 2,500+ plugins. Those are not measuring the same thing, so treat the counting carefully. And Zapier published a first-hand test in which their Dot missed urgent judgment emails and sent an email without asking, which is a small window into how the permission model behaves in practice rather than in a benchmark.

Integrations reach ChatGPT, Slack, and Teams, with voice calls and SMS. There is an iOS widget and a Shortcuts action with Messaging, Dictation, and Call modes that you can bind to the iPhone Action button. And there is a business shape underneath all of it: "specialist dots" with their own identity, credentials, and IT-provisioned hardware are in focused enterprise pilots for procurement, invoice processing, email marketing, customer support, and commercial contracting, with planned integration into Microsoft Agent 365 governance.

One last thing about the commercial framing. Altman said the compute intensity justified a phased, premium-only debut, and described Dots as a premium product. NBC News reported the EU delay as a regulatory "process that takes longer". A Dot lives at $100, $200, or $500 a month on Pro, and $125 per user on Business Premium.

## Gemini agent and Gemini Spark: Google's universal agent

Google is running three different products with confusingly similar names, and you need all three to understand the picture.

The **Gemini agent**, announced on 8 October 2026 at Gemini at Work 2026, is the enterprise one. Thomas Kurian called it "your new single, universal agent for work": one agent, one API, one prompt box that answers questions, does knowledge work, creates images and media, and writes and runs code. You give it objectives, not instructions.

The defining architectural claim is multi-model routing. "Gemini is the agent, and the model underneath it is a separate choice." It orchestrates across Google's Gemini family and, as of launch, Anthropic's Claude models, with other private and open models to follow. Google's stated rationale is "the best model for the task is not always the largest one." For an agent that makes hundreds of sequential calls, that is not a gimmick, it is the single biggest cost and energy lever in the system, and I will come back to why Google not framing it as energy.

Six principles structure it: unified agent, omnipresent access, persistent execution, multi-agent orchestration, deep contextualisation, model-choice flexibility. Persistent execution means one set of memories, context, and a personalisation graph carried across devices and channels, with parallel and sequential sub-agent steps that "can run for hours or days." Multi-agent orchestration means dynamic rosters of temporary job-specific sub-agents, plus "coworker agents" with persistent roles, their own Workspace identities, their own `@agents.company.com` email addresses, and their own storage, seeing only the context you or your team provide. Three-layer capability stack: tools plus a registry covering Confluence, Office, Teams, Slack, Git, Jira, Salesforce, ServiceNow, BigQuery, Databricks, Postgres, Snowflake and any MCP server inside or outside the network; skills as modular prompts in a global library, a company registry and personal skills; and context and memory spanning session, semantic, procedural and episodic.

Governance is first-class in a way that has no equivalent at Anthropic or OpenAI: cryptographically attested agent identity governed like an employee, least-privilege role-based permissions, OAuth identity propagation, an audit trail attributed to the agent rather than a person, an Agent Sandbox with its own network boundary, and the Agent Gateway acting as an AI network firewall enforcing policy org-wide. Cost control is a headline feature too, with Smart Routing for automatic triage, real-time per-project spend caps in the Cloud Billing Console that pause the agent's work when hit, and per-project charge-back.

It is in private preview, with wide availability "soon" for select Business and Enterprise Workspace plans, at no additional charge where Gemini Enterprise is available. The published consumption pricing is $0.085 per vCPU-hour for Agent Compute, $0.009 per GiB-hour for Agent Memory, and $0.30 per GiB-month for Agent Storage, on top of tokens.

**Gemini Spark** is the consumer counterpart, announced on 19 May 2026 at I/O. A "24/7 AI agent that helps you navigate your digital life, takes action on your behalf and is under your direction," listed for AI Ultra $100 and $200 subscribers, US only at launch. It asks before spending money or sending emails. It runs on a dedicated Google Cloud virtual machine so tasks continue after you close the laptop. Third-party coverage, not Google's own launch post, attributes the underlying stack to Gemini 3.5 on the Antigravity harness, with native Gmail, Docs and Sheets access through structured APIs rather than screen-scraping, Chrome browsing added in July 2026 with hard confirmation before payment, and macOS desktop automation in beta. Spark expanded to AI Pro subscribers in the US on 24 July and to 160+ countries on 30 July, though that latter figure comes from aggregators rather than a Google page I could verify. It is a separate product with a separate interface, not a consumer skin of the enterprise agent.

The third surface is the experimental "Gemini Agent" inside the Gemini app, shipped 18 November 2025 with Gemini 3 Pro and explicitly "built on insights from Project Mariner". Project Mariner itself was shut down on 4 May 2026 with its technology folded into Gemini Agent, the Gemini API computer-use tool, and Chrome's auto browse. Three surfaces, three names, one underlying ambition.

Scale claims, for what they are worth: roughly 500 Google Cloud customers each processed more than a trillion tokens in the last year, about 80% of Google Cloud customers use AI products, roughly 90% of the Fortune 100 use Gemini Enterprise, and Gemini has over a billion monthly active users. Google also says per-token prices are down 98% since 2024 and that TPU 8i delivers 80% better price-performance than the prior generation.

## The table that matters: head-to-head comparison

| Dimension | Claude Duet (Anthropic) | ChatGPT Dots (OpenAI) | Gemini agent / Spark (Google) |
|---|---|---|---|
| Announced | 21 Oct 2026, research preview, waitlist | 29 Sep 2026, DevDay, general availability on Pro | Gemini agent 8 Oct 2026 (private preview); Spark 19 May 2026 |
| Model | Claude Opus 5.5, no choice | GPT-6 Astra | Gemini agent picks per job across Gemini *and* Claude; Spark on Gemini 3.5 + Antigravity (third-party attribution) |
| Compute | Own cloud VM with its own browser | Own cloud computer, Linux + Chrome, plus optional local PC | Persistent cloud execution, multi-agent orchestration, headless capable |
| Proactivity | Morning brief, checks every few hours | Proactive research, read-only tools enforced in code | Daily Brief, recurring tasks and triggers, sub-agents, coworker agents |
| Integrations | "Over 6,000" claimed; directory shows 1,011 connectors + 550 plugins | "Over 4,000 apps" via plugins | Enterprise tools registry + MCP (Confluence, Jira, Salesforce, BigQuery, Snowflake…) |
| Inspectable | **No**, cannot watch or take over the browser | **Yes**, open the Dot's computer at any time | Persistent context visible across devices |
| Approval model | Action, destination, every recipient shown; classifier runs outside the model | Auto-review + Custom Rules; password change always hands back | Secure sandboxing, identity and policy management, network gateways |
| Never permitted | Trading securities, moving money between accounts, accessing another's account | Changing a password, moving money between accounts | Governed by enterprise policy |
| Credentials | Never seen by model, single-use key on browser machine, proxy-injected tokens | Secure sign-in pauses the model, encrypted credential service | Identity + policy management |
| Price | $0 extra on Pro ($20/mo) or Max ($100/$200) | $0 extra on Pro ($100/$200/$500); Business Premium $125/user | Usage-based: $0.085/vCPU-h, $0.009/GiB-h, $0.30/GiB-month |
| **Quota** | **Background checks count against the shared 5-hour and weekly limits** | **Dot conversations do not count; Codex/Work tasks do** | Billed by consumption |
| Region at launch | US only | Pro excluded in EEA, Switzerland, UK; Business Premium worldwide | Gemini agent on Google Cloud enterprise; Spark US AI Ultra |
| Enterprise | Not included yet | Admin-gated beta, off by default | Core positioning |

Three rows in that table deserve more than a glance.

The **quota row** is opposite in the two vendors that charge by subscription, and it is not subtle. Anthropic's polling spends your budget. OpenAI's conversation does not. Same category of product, opposite economics, both stated in the vendors' own documentation.

The **inspectable row** is a design philosophy split. Dots let you open the agent's computer and watch it work. Duet explicitly refuses, and the help centre says you cannot watch or take over the browser. For a product whose entire value proposition is acting while you are absent, that is a meaningful difference in how much you have to trust.

The **integrations row** is a lesson in how numbers travel. Anthropic says 6,000, OpenAI says 4,000, and the underlying reality is smaller and less comparable than either. I have covered how claims like this drift before in [the AI agents on Android](/blog/ai-agents-android-theory/) and in [agent workflows on Android](/blog/ai-agents-workflow-android/). Integrations count is the easiest number in the industry to inflate and the hardest to verify.

## The green angle: what Google actually publishes

Google earns real credit here, and I want to be precise about how much.

On 21 August 2025, in a Google Cloud blog post co-signed by Jeff Dean and Amin Vahdat, Google published the environmental cost of the median Gemini Apps text prompt: **0.24 Wh of energy, 0.03 gCO2e, 0.26 mL of water**, "about five drops". The framing device is that this is equivalent to watching TV for less than nine seconds. The same figures appear in the peer-reviewed technical paper "Measuring the environmental impact of delivering AI at Google Scale" (arXiv:2508.15734) and are restated in Google's 2026 Environmental Report published on 30 June 2026, so they remain Google's current published numbers today.

The methodology is the part that should make you trust the number more, not less. Google explicitly counts the full stack: dynamic power of the system, achieved chip utilisation, idle provisioned machines, host CPU and RAM, data-centre overhead through PUE, and data-centre water consumption. Under the narrower industry methodology, the same median prompt is 0.10 Wh, 0.02 gCO2e, 0.12 mL. Google publishes the higher number, calls the narrow one "an optimistic scenario at best", and shows that the comprehensive method is 2.4 times larger. A company with an incentive to look good chose the frame that made it look worse. That is rare and worth saying out loud.

The energy breakdown for that 0.24 Wh is instructive: 0.14 Wh, 58%, on the active AI accelerator; 0.06 Wh, 25%, on host CPU and DRAM; 0.02 Wh, 10%, on idle provisioned machines; 0.02 Wh, 8%, on data-centre PUE overhead. Keep the 10% idle term in mind. We will need it.

The trajectory is extraordinary. Over twelve months, May 2024 to May 2025, the median prompt's energy fell **33 times** and its total carbon footprint fell **44 times**, while response quality improved. The 33 times decomposes into 23 times from model improvements plus software and hardware gains; the 44 times is 47 times on Scope 2 market-based plus 36 times on Scope 1 and 3.

The facility numbers are just as concrete. Google reported a fleet-wide average **PUE of 1.09** for 2025, holding at 1.09 from 2024 and improving from 1.10 in 2023 and 1.19 in 2009. Against the Uptime Institute 2025 Global Data Center Survey respondent average of 1.54, Google's own formula, (1 − 0.09 ÷ 0.54) × 100, gives **83% less overhead energy than the industry average**. **Ironwood**, the seventh-generation TPU, is stated as nearly 30 times more power efficient than Google's first Cloud TPU from 2018 and double the performance-per-watt of Trillium from 2024; the eighth-generation TPUs (TPU 8t for training, TPU 8i for inference) reach up to twice Ironwood's performance-per-watt, and Ironwood itself shows roughly a 3.7 times improvement in Compute Carbon Intensity against TPU v5p. Across the fleet, 2025 delivered over three times more compute performance per unit of energy than five years ago.

And the carbon accounting is done properly. Over a gigawatt of demand-response capacity integrated into long-term contracts with multiple US utilities as of early 2026, which shifts non-urgent ML workloads across hours and locations. More than 12 GW of net-new clean energy signed in 2025, the largest annual total in Google's history and more than the previous two years combined, eight times more than 2019. Carbon-reduction initiatives that "collectively avoided over 58 million tCO2e" in 2025, without which Google's ambition-based footprint would have been five times larger. About 7.7 billion gallons of freshwater replenished across 97 watersheds, roughly 78% of 2025 freshwater consumption.

Google's own caveats, which belong in any honest account: this is a point-in-time analysis using **May 2025** data; emissions were estimated by applying Google's **2024** average fleetwide grid carbon intensity; water was estimated with the 2024 average fleetwide water usage effectiveness; "These findings do not represent the specific environmental impact for all Gemini App text-generation prompts nor are they indicative of future performance"; and, in footnote two, "The data and claims have not been verified by an independent third-party." The 2026 Environmental Report repeats it in endnote ten: "These estimates have not been independently verified."

Read that last sentence as an admission of absence, not an admission of error. And read it next to what the other two vendors publish, which is nothing at all.

## The green angle: what Google does NOT publish

Here is the part that matters, and it is the part that almost nobody wrote about.

![Workload mismatch between a text prompt and an always-on agent with a browser](/images/agent-footprint-workload-mismatch-en.svg)

**Not one of Google's green numbers describes an agent.**

The 2026 Environmental Report contains zero mentions of Antigravity, Gemini Spark, the Gemini agent, Dots, or Mariner. The arXiv paper contains zero occurrences of "agent", "Antigravity", or "browser". The 0.24 Wh figure describes a median *text* prompt, measured in May 2025, on the models that existed then. The footnote explicitly disclaims forward-looking inference, which means it cannot even be assumed to describe today's Gemini serving stack, let alone an agent running on it.

Why does that matter so much? Because of what an agent actually is. A text prompt is one round trip: one request, one response, done. An always-on agent is thousands of round trips plus a browser, plus a sandbox, plus reserved idle capacity held for hours between steps. The AAAI-26 paper, "Promoting Sustainable Web Agents", published in March 2026 in the AAAI conference proceedings, benchmarked six web agents on an H100-NVL with the Mind2Web benchmark and measured what they cost:

- **0.49 Wh per action** for MindAct, times 7.3 actions per task, gives **3.58 Wh per task**, roughly **15 times** a Google text prompt.
- **5.78 Wh per action** for the GPT-4-based LASER agent, giving **42.19 Wh per task**, roughly **176 times** a text prompt. In emissions, at the US grid mix (453 gCO2e/kWh), the LASER estimate reaches **44,942 gCO2e** — the equivalent of driving **up to 181 kilometres** in an average car.
- Whole benchmark runs of **0.33 kWh to 3.31 kWh** depending on the agent, which is 1,375 to 13,792 times a single Google text prompt.

Microsoft's peer-reviewed Joule study, "Energy use of AI inference, efficiency pathways, and test-time scaling", arrives from an independent direction and lands in the same place. Median **0.31 Wh per query** for frontier-scale models, with an interquartile range of 0.16 to 0.60, which is close to Google's 0.24 Wh and suggests efficient serving at hyperscale is achievable industry-wide. But for **15 times longer** test-time-scaling queries, the median rises to **3.91 Wh**. And the authors' conclusion is the one that matters for agents: "Long reasoning and agentic queries... are estimated to increase energy consumption by more than an order of magnitude due to increased token generation and reduced serving concurrency."

Then there is the idle-capacity term, which Google's own methodology hands us. Idle provisioned capacity counts for **10% of a text prompt's energy**. For a one-shot prompt, that idle capacity amortises across thousands of concurrent requests. For an always-on agent holding a sandboxed VM and a browser session reserved between steps for hours, the same reserved capacity is held for the duration of the task with far less concurrency to amortise it over. That is my analysis of Google's published numbers, not a Google claim, and Google has published no number that would let anyone check it.

Here is the uncomfortable detail from that AAAI paper that I cannot stop thinking about. In its literature review, the authors write that **OpenAI's Operator and Google's Project Mariner are "impossible to estimate as no details of their implementation are available."** That is an academic finding, published in peer-reviewed proceedings in March 2026, that a Google browser agent's energy consumption was not estimable from public information. The same paper also finds that the estimation-versus-measurement gap runs **up to a factor of 7** even for a fully open-source agent, and that the energy cost is invisible to end users behind a search bar, which "makes it impossible for users to distinguish between 'good' and 'bad' agents." Their verdict on benchmarks: "benchmarks do not penalize energy consumption—yet."

And the rebound effect is visible in Google's own report. The 33 times and 44 times gains are real, and they are being outrun by volume. Google discloses that electricity demand grew **37%** in 2025, its largest load growth in history; that total ambition-based emissions rose **18%**; that supply-chain emissions rose **25%**; and that Scope 1 rose **20%**. The 2025 ambition-based footprint is 14,473,100 tCO2e. Per-unit efficiency and total footprint are different quantities, and only the second one matters for the atmosphere.

Meanwhile, the disclosure asymmetry outside Google is stark. Anthropic's 230-page Opus 5.5 system card contains zero occurrences of "carbon" or "water". Its 2026 Public Benefit Report contains zero occurrences of carbon, emissions, sustainability, energy, watt, water, or environmental. The closest Anthropic first-party statement is a paragraph in the Claude 4 system card promising an annual company-wide carbon footprint analysis with external experts, with no figures, no units, and no date. Anthropic's public environmental communications are about electricity prices and grid costs, not model efficiency. Fortune and Bloomberg reported in August 2026 that Anthropic has not disclosed greenhouse-gas emissions, made net-zero pledges, or published a sustainability report, and that it is working with the carbon-accounting platform Watershed to measure its footprint ahead of California's SB253 reporting. Axios wrote in September 2026 that "Anthropic's responsible AI doesn't extend to its environmental footprint." Heatmap reported that Anthropic has no annual sustainability report and no clean power PPA as of June 2026, and that per Cleanview data its data-centre carbon intensity is among the highest of its competitors, second only to xAI.

OpenAI is in the same position. Its own educational material states plainly that "proprietary energy benchmarks for models like GPT-4 aren't yet published". The Dots and Astra system card contains zero environmental metrics. There is no openai.com/sustainability page; it returns a 404.

Third parties have tried to fill the hole. Climate scientist Zeke Hausfather logged eight weeks of his own Claude Code usage, 1,138 prompts and 3.2 billion tokens, and estimated roughly 170 kWh of data-centre electricity, an implied average around 150 Wh per prompt. That is an independent personal measurement of Claude Code, not Claude Duet, on an agentic workload with heavy cache reads, with a wide 70 to 330 kWh range, and the researcher himself describes it as difficult to determine. It is not a substitute. It is evidence of something more interesting: that a third party had to build the instrument because the vendor would not.

So the honest framing is not "Google's agent is greener." It is that **Google is the only one of the three publishing measurable per-prompt footprints, and the number it publishes does not apply to an always-on agent running a browser for hours.** That is a ranking of disclosure, not of virtue. And it is a ranking that leaves the actual question unanswered.

## The invisible cost: the quota that burns while you sleep

Now the part that has nothing to do with carbon and everything to do with what an always-on agent costs the person who pays for it.

Look again at the quota row of the table, because it is the sharpest product difference between the three launches and nobody wrote about it in this framing.

Anthropic's help centre is explicit: Duet shares the plan's five-hour session and weekly limits at the same rate as chat, and **background checks and check-ins count**. Anthropic's own stated reason for throttling the polling to every few hours is that "checking nonstop would use up your plan's limits much faster." All Claude surfaces, claude.ai, Claude Code, Claude Desktop, already shared one usage limit before Duet existed. The consequence is concrete: if you are paying $20 a month for Claude Pro and you leave Duet connected to Slack, Gmail and HubSpot, the agent's overnight polling competes directly with the coding session you want to run in the morning.

OpenAI did the opposite and said so in its own announcement: **conversations with your dot do not count toward ChatGPT usage limits**. The tasks your dot starts in Codex or ChatGPT Work do count. That is a genuinely different economic model. Under Duet, background work is metered against your plan. Under Dots, the conversation with your agent is not, though delegated work is. One vendor makes the always-on behaviour the expensive part of the bill, the other makes it free and passes the cost through the "deeper work allowance", which OpenAI has not quantified numerically.

Then there is the auditability split. Dots let you open the agent's computer at any time and inspect its work, plus an Activity View and a stop-work control. Duet explicitly cannot show you its browser. You get a Tasks tab and a Make tab, and only you can mark a task complete, but you cannot watch the thing happen. For an agent whose entire pitch is working while you are away, that is a real difference in the amount of trust you have to extend blind.

And the third cost, the one that nobody prices: **attention**. A morning brief that arrives every day is a product decision with a psychological price tag. Duet's own documentation concedes that it "may misread threads" and "miscalibrate urgency." A daily brief that is wrong four times a week is not a feature, it is a chore with a push notification. Zapier's hands-on test with Dots is the mirror image: their Dot missed urgent judgment emails and sent an email without asking. Both failure modes are cheap in a demo and expensive in a real week.

Put these three together, quota, auditability, attention, and you get a genuinely different product calculus. Duet is an expensive employee you cannot watch. Dots is a free-ish employee you can watch. Google's Gemini agent is a metered, governed, auditable coworker with a real email address and a spend cap, priced by the hour of vCPU it burns.

That last pricing model is worth a moment, because it is the most honest of the three. Google charges for Agent Compute at $0.085 per vCPU-hour, Agent Memory at $0.009 per GiB-hour, and Agent Storage at $0.30 per GiB-month, plus real-time spend caps in the Cloud Billing Console that pause the agent when you hit them. You can see the meter. You can see which project it went to. Nobody else is showing you a meter for the thing that runs all night.

## What an indie developer should do with this

I build things for a living, alone, mostly at night, and this category landed directly on my desk. Here is what I actually concluded.

**Do not hand three always-on agents to the same job.** The Dots system card appendix gives you the data: moderate severity scope violations rose from 8.6% to 19.7% when intervening tasks doubled from 5 to 10. Chain length is the risk variable. Give an agent one narrow, well-defined responsibility with a clear stop condition, and check the output. If you find yourself building a ten-step chain that runs unattended overnight, you are building a system whose failure mode is a scope violation nobody will see until morning.

**Pick the agent whose permission model matches the blast radius.** Duet shows you the action, the destination and every recipient, and it can never auto-approve sending money, deleting an order, or creating an account. That is a better floor than anything OpenAI exposes for a general consumer Dot, where the safeguard is a second model plus your Custom Rules. If your agent touches anything irreversible, pick the one with the hardcoded blocks, and keep the payments manual.

**Budget the quota explicitly.** If Duet's background polling runs against your five-hour window, then an always-on agent and a coding session are the same resource. Decide in advance whether the agent gets the budget, or whether you do. The same discipline applies to Google's metered model: put a spend cap on it from day one, because the failure mode of a per-hour agent is not a crash, it is a quiet $400 in a month you did not notice.

**Turn on every approval you can, then turn off the ones that annoy you.** Both vendors support the same pattern: hard blocks for irreversible actions, explicit rules for everything else, and a way to pre-approve the boring 90%. Zapier's hands-on Dots test sent an email without asking, which means the default permission set was wrong for that workflow. Audit yours.

**Ask for the numbers before you trust the green.** The single most actionable thing in this whole comparison is that Google already built the instrument and published the methodology. A Wh-per-agent-hour figure, including idle provisioned capacity, is a small extension of an existing published method. Until it exists, the only defensible position is that nobody, including Google, knows what an always-on agent costs in energy. I would take a vendor's refusal to publish that as a signal about how they think about the rest of their numbers.

**Do not confuse disclosure with performance.** Microsoft's independent median of 0.31 Wh per query sits close to Google's 0.24 Wh. The efficiency gap between providers may be far narrower than the disclosure gap, and nobody currently knows which is which. What you can say with confidence is that Google has made itself checkable and the other two have not.

**And if you are outside the US, in the EEA, Switzerland or the UK, notice that you are outside all three.** Duet is US-only. Pro Dots exclude the EEA, Switzerland and the UK, although Business Premium is rolling out more widely. Spark's launch was US AI Ultra. The stated reasons are commentary rather than published policy. Combine that with the disclosure gap and ask yourself what a European solo developer is actually being asked to trust: an agent you cannot inspect, running on a machine you cannot see, billed against a quota you do not control, at an energy cost nobody has published.

## References

1. **Introducing Claude Duet** — Anthropic. *Research preview announcement, 21 October 2026.* [https://claude.com/resources/articles/claude-duet](https://claude.com/resources/articles/claude-duet)

2. **Claude Duet Safety, Privacy, and Security** — Anthropic. *Three trust zones, credential isolation, approval gates, sensitive-information classifiers.* [https://claude.com/resources/articles/claude-duet-safety-privacy-and-security](https://claude.com/resources/articles/claude-duet-safety-privacy-and-security)

3. **Get started with Claude Duet** — Anthropic Help Centre. *Eligibility, waitlist, usage limits, known limitations, off-limits actions.* [https://support.claude.com/en/articles/17631495-get-started-with-claude-duet](https://support.claude.com/en/articles/17631495-get-started-with-claude-duet)

4. **How do usage and length limits work?** — Anthropic Help Centre. *One shared five-hour and weekly limit across claude.ai, Claude Code and Claude Desktop.* [https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work)

5. **Introducing dots** — OpenAI. *Dots announcement, 29 September 2026, DevDay 2026.* [https://openai.com/index/introducing-dots/](https://openai.com/index/introducing-dots/)

6. **How we build safety, security, and privacy into dots** — OpenAI. *Auto-review, read-only proactive research, sandboxed cloud computer, credential handling.* [https://openai.com/index/how-we-build-safety-security-and-privacy-into-dots/](https://openai.com/index/how-we-build-safety-security-and-privacy-into-dots/)

7. **GPT-6 Astra: a new generation of intelligence** — OpenAI. *The model behind Dots and the first to reach the Critical cyber threshold.* [https://openai.com/index/gpt-6-astra/](https://openai.com/index/gpt-6-astra/)

8. **Safeguards for Dots (system card appendix)** — OpenAI Deployment Safety. *Injection evaluations, 91.8% alignment pass rate, scope violations rising 8.6% to 19.7%.* [https://deploymentsafety.openai.com/gpt-6-astra/safeguards-for-dots](https://deploymentsafety.openai.com/gpt-6-astra/safeguards-for-dots)

9. **Environmental Impact of AI** — OpenAI Academy. *"Proprietary energy benchmarks for models like GPT-4 aren't yet published."* [https://academy.openai.com/public/clubs/higher-education-05x4z/resources/environmental-impact-of-ai](https://academy.openai.com/public/clubs/higher-education-05x4z/resources/environmental-impact-of-ai)

10. **Welcome to Gemini at Work 2026: Introducing the Gemini agent** — Google Cloud. *Universal agent for work, multi-model routing, persistent execution, governance.* [https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026](https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026)

11. **The Gemini app becomes more agentic** — Google. *Gemini Spark, Daily Brief, 24/7 agent, AI Ultra tiers.* [https://blog.google/innovation-and-ai/products/gemini-app/next-evolution-gemini-app/](https://blog.google/innovation-and-ai/products/gemini-app/next-evolution-gemini-app/)

12. **Measuring the environmental impact of AI inference** — Google Cloud, 21 August 2025. *0.24 Wh / 0.03 gCO2e / 0.26 mL per median text prompt, full methodology and caveats.* [https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference](https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference)

13. **Measuring the environmental impact of delivering AI at Google Scale** — arXiv:2508.15734. *Peer-reviewed technical paper behind the headline figures.* [https://arxiv.org/abs/2508.15734](https://arxiv.org/abs/2508.15734)

14. **Google 2026 Environmental Report** — Google, June 2026. *PUE 1.09, TPU efficiency, Scope 1/2/3 tables, clean energy procurement, absolute emissions growth.* [https://sustainability.google/files/google-2026-environmental-report.pdf](https://sustainability.google/files/google-2026-environmental-report.pdf)

15. **Promoting Sustainable Web Agents: Benchmarking and Estimating Energy Consumption Through Empirical and Theoretical Analysis** — Krupp, Geißler, Banwari, Lukowicz and Karolus, AAAI-26. *0.49 Wh per action for MindAct, 5.78 Wh for LASER, runs of 0.33 to 3.31 kWh, and the finding that proprietary agents are impossible to estimate.* [https://ojs.aaai.org/index.php/AAAI/article/view/41221](https://ojs.aaai.org/index.php/AAAI/article/view/41221)

16. **Energy use of AI inference, efficiency pathways, and test-time scaling** — Oviedo et al., Joule (2026), arXiv:2509.20241. *Median 0.31 Wh per query, 3.91 Wh at 15 times longer queries, agentic queries over an order of magnitude.* [https://arxiv.org/abs/2509.20241](https://arxiv.org/abs/2509.20241)

17. **Claude Opus 5.5 System Card** — Anthropic. *230-page safety document with no carbon, energy or water metric.* [https://anthropic.com/claude-opus-5-5-system-card](https://anthropic.com/claude-opus-5-5-system-card)

18. **Claude 4 System Card** — Anthropic. *Section 1.1.4, the only Anthropic carbon-footprint statement: an annual promise, no figures.* [https://www-cdn.anthropic.com/6be99a52cb68eb70eb9572b4cafad13df32ed995.pdf](https://www-cdn.anthropic.com/6be99a52cb68eb70eb9572b4cafad13df32ed995.pdf)

19. **Covering electricity price increases from our data centers** — Anthropic, 11 February 2026. *Grid-upgrade costs, curtailment and water-efficient cooling, with no renewable target.* [https://www.anthropic.com/news/covering-electricity-price-increases](https://www.anthropic.com/news/covering-electricity-price-increases)

20. **AI giants are quiet on climate in sign of post-ESG Wall Street** — Fortune, 12 August 2026. *No GHG disclosure or sustainability report from Anthropic, and Watershed work ahead of California's SB253.* [https://fortune.com/2026/08/12/ai-giants-are-quiet-on-climate-in-sign-of-post-esg-wall-street/](https://fortune.com/2026/08/12/ai-giants-are-quiet-on-climate-in-sign-of-post-esg-wall-street/)

21. **SpaceX, OpenAI, Anthropic Quiet on Emissions in Post-ESG Era** — Bloomberg, 12 August 2026. *The same silence, ahead of IPOs.* [https://www.bloomberg.com/news/features/2026-08-12/spacex-openai-anthropic-quiet-on-emissions-in-post-esg-era](https://www.bloomberg.com/news/features/2026-08-12/spacex-openai-anthropic-quiet-on-emissions-in-post-esg-era)

22. **Anthropic's responsible AI doesn't extend to its environmental footprint** — Axios, 15 September 2026. *Headline and lede verified; full text was behind a bot wall and could not be retrieved.* [https://www.axios.com/pro/climate-deals/2026/09/15/anthropic-sustainability-metrics](https://www.axios.com/pro/climate-deals/2026/09/15/anthropic-sustainability-metrics)

23. **Anthropic Is Buying Carbon Removal — But Not Clean Power** — Heatmap News, 17 June 2026. *No annual sustainability report, no clean power PPA, and Cleanview carbon-intensity data.* [https://heatmap.news/climate/anthropic-carbon-emissions](https://heatmap.news/climate/anthropic-carbon-emissions)

24. **Claude Duet app is Anthropic's bet on agents** — TechCrunch, 22 October 2026. *Launch coverage that repeated the "6,000 connectors" figure without verification.* [https://techcrunch.com/2026/10/22/claude-duet-app-is-anthropics-bet-on-agents/](https://techcrunch.com/2026/10/22/claude-duet-app-is-anthropics-bet-on-agents/)

25. **Anthropic rolls out Claude Duet, but enterprises aren't ready** — TechTarget. *Forrester and GAI Insights analyst verdicts on the launch.* [https://www.techtarget.com/ai/news/366652530/Anthropic-rolls-out-Claude-Duet-but-enterprises-arent-ready](https://www.techtarget.com/ai/news/366652530/Anthropic-rolls-out-Claude-Duet-but-enterprises-arent-ready)

26. **Anthropic unveils Claude Duet AI agent app** — Reuters, 21 October 2026. *Launch coverage and positioning.* [https://www.reuters.com/technology/anthropic-unveils-claude-duet-ai-agent-app-2026-10-21/](https://www.reuters.com/technology/anthropic-unveils-claude-duet-ai-agent-app-2026-10-21/)

27. **Google brings agentic AI to Gemini, starting with businesses** — TechCrunch, 8 October 2026. *Gemini agent launch coverage and scale claims.* [https://techcrunch.com/2026/10/08/google-brings-agentic-ai-to-gemini-starting-with-businesses/](https://techcrunch.com/2026/10/08/google-brings-agentic-ai-to-gemini-starting-with-businesses/)

28. **Connectors and plugins, live marketplace directory** — Anthropic. *The directory counters: 1,011 connectors and 550 plugins.* [https://claude.com/marketplace/connectors-plugins](https://claude.com/marketplace/connectors-plugins)

29. **AI as a climate factor: Why agents like Claude Code are real power guzzlers** — heise.de. *Third-party measurement of Claude Code energy use by Zeke Hausfather.* [https://www.heise.de/en/news/AI-as-a-climate-factor-Why-agents-like-Claude-Code-are-real-power-guzzlers-11455405.html](https://www.heise.de/en/news/AI-as-a-climate-factor-Why-agents-like-Claude-Code-are-real-power-guzzlers-11455405.html)

30. **What are ChatGPT dots?** — Zapier. *First-hand test of the permission behaviour, including an email sent without asking.* [https://zapier.com/blog/chatgpt-dots/](https://zapier.com/blog/chatgpt-dots/)

## Final reflection

I keep returning to one number: 0.26 millilitres of water, about five drops, for one prompt. It is a beautiful number. It is also a number about a workload that no longer exists in the product being compared.

Google did something genuinely admirable in 2025: it built an instrument, published the method, and made itself checkable. I want to be clear that I am not dismissing that, because the alternative is what we have, which is three labs shipping agents that burn electricity at all hours of the night and not one of them telling us what that costs. The only way anyone found out anything about Anthropic's footprint is that a climate scientist ran his own meter on his own Claude Code usage.

But an instrument pointed at the wrong workload is not measurement. It is marketing with a methodology attached, and the difference only matters until the workload changes. The always-on agent is exactly that change: a persistent machine with a browser, holding reserved capacity, taking thousands of actions, running while nobody is watching. The peer-reviewed numbers for that workload are 3.58 and 42.19 Wh per task, and the honest peer-reviewed verdict on proprietary agents is that they are impossible to estimate from public information.

So my verdict, as an indie developer who ships software and pays for these subscriptions: I would take Dots for anything where I want to watch what the agent does, because being able to open its computer and take the controls back is worth more than the free quota. I would take Duet for anything irreversible, because its hard blocks on sending money, deleting orders and creating accounts are the real floor, not its reasoning. And I would take Google's metered, governed agent for anything that has to live inside a company, because a visible meter and a spend cap are the only parts of this whole category that behave like an adult.

What I would refuse to do is any of the three on the strength of a green claim, because there is not a single agent workload in this category with a published energy figure. Not one. The most any of these companies will give you is a number about a text prompt, and then a footnote explaining that the numbers are not independently verified.

We are building an industry on machines that run while we sleep, and we are measuring them with a stopwatch meant for a different job. I would like that fixed, and I would like it fixed by whoever already proved they know how. Until then, the honest position for anyone who cares about this is narrow but real: publish the instrument, publish the caveats, and do not let a five-drop headline travel further than the workload it actually measured.

If you want to see where I land on the security side of all this, I wrote about [the chaos of agentic AI security](/blog/agents-chaos-ai-security/). If you want to understand the loop that keeps these agents moving, [the goal-loop article](/blog/ai-agent-goal-loops/) is the one. And if you are still choosing a subscription, start with [ChatGPT, Claude or Gemini: Which to pay for in 2026?](/blog/chatgpt-claude-gemini-2026/).
