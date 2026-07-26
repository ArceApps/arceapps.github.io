---
title: "Model Routing for Subagents: Cut Coding Agent Costs 30-80%"
description: "Route each subagent to the right model: explore to 9B, planner to 122B. Brick, OpenCode-subagent-router, and a DIY hook compared with real cost math."
pubDate: 2026-07-25
lastmod: 2026-07-26
author: "ArceApps"
keywords:
  - "Model Routing"
  - "Subagents"
  - "Brick"
  - "OpenCode"
  - "Mixture of Models"
  - "Cost Optimization"
  - "AI Coding Agents"
canonical: "https://arceapps.com/blog/model-routing-subagents-coding-agents/"
heroImage: "/images/model-routing-subagents-coding-agents-en.svg"
tags: ["OpenCode", "Subagents", "Model Routing", "Brick", "Indie Dev", "Cost Optimization"]
draft: false
reference_id: "f0446317-c1e5-42c5-98e1-001fe986f926"
---

## The problem nobody is watching

There is a number that has been nagging me for months: the monthly cost of a coding agent running with subagents. When you kick off a multi-task build in OpenCode, Claude Code, or Codex, every subagent inherits the orchestrator's model. **The planner, the explorer, the reviewer, and the coder all burn the same tokens** — even though half of those roles could be handled by a model five times cheaper with no quality loss.

I have been measuring the real cost of my long sessions and the conclusion is uncomfortable: **we were paying Opus to run tasks that a 9B model finishes in four seconds**. The trick is not using a weaker model; it is **picking the right model for each turn of each subagent**. That is what the industry calls *model routing*, and it is already mature outside coding. Bringing it to subagents is, in my view, the natural next step after the context fragmentation work I published in [GSD: the engineering of clean context](/blog/gsd-core-context-engineering/).

This article is a map of the state of the art in July 2026: three architectures I tested, the real numbers (not the marketing ones), the honest trade-offs, and why I believe any indie dev with a coding agent should plan the migration in the coming months.

> **Differentiator vs prior art:** `gsd-core-context-engineering.md` answered *"how do I keep an agent from degrading as tokens grow?"*. `desktop-ai-grand-final.md` compared assistants. `stack-completo-agentes-ia-2026.md` inventoried frameworks. This article covers the next axis: **how do I dramatically cut the cost of each subagent by choosing the right model, without losing quality?**

## What model routing actually is

Model routing is the practice of **sending each prompt to the best-fit model in a pool**, instead of pushing everything to a single large model. The concept is not new: OpenRouter, Martian, and Not Diamond have been doing it for years for general chatbots. The *RouteLLM* paper (Microsoft, 2024) already documented 40–85% savings on MT-Bench while keeping 95% of GPT-4 quality. What is new is **applying it to subagents of a coding agent**, where every role has a radically different task profile.

![Infographic: how a prompt enters the router and gets routed to the right model based on the task. EN](/images/model-routing-subagents-coding-agents-infographic-1-en.svg)

The idea is simple. A routing system looks at the prompt, classifies it across one or more dimensions (code, reasoning, search, planning, world knowledge), estimates complexity, and decides which backend to send it to. If classification is ambiguous, it falls back to a default model. The rest is plumbing.

In a coding agent the difference is brutal. A subagent that **explores** the codebase looking for files by glob does not need a 122B parameter model — it needs speed and low cost. A **planner** that decides the architecture of a module does. When you use the same model for both, you are burning money along a dimension where it adds nothing.

## Brick: Regolo's Mixture-of-Models

The implementation that caught my attention most was published on [the Regolo blog](https://regolo.ai/opencode-brick-for-multi-agent-coding-and-optimize-costs-up-to-80/) on July 14, 2026. The central piece is **Brick**, a *Mixture-of-Models* (MoM) router released under Apache-2.0 at [`regolo-ai/brick-SR1`](https://github.com/regolo-ai/brick-SR1). The technical name is `brick-v1-beta` and the idea is: on every turn, Brick classifies the prompt across six dimensions (coding, creative synthesis, instruction following, math reasoning, agentic planning, world knowledge), estimates complexity (easy, medium, hard), and routes it to the most efficient backend in its pool.

What the Regolo post **does** cover well is the configuration. In their setup, OpenCode runs with a single orchestrator (`brick-v1-beta`) that delegates to six subagents — each with its own model and its own permissions:

```json
{
  "orchestrator": {
    "mode": "primary",
    "model": "regolo/brick-v1-beta",
    "permission": {
      "task": {
        "*": "deny",
        "planner":   "allow",
        "coder":     "allow",
        "researcher":"allow",
        "reviewer":  "allow",
        "devops":    "allow",
        "explore":   "allow"
      },
      "edit": "deny",
      "bash": "ask"
    }
  },
  "planner":   { "mode": "subagent", "hidden": true, "model": "regolo/qwen3.5-122b",     "permission": { "edit": "deny", "bash": "deny" } },
  "coder":     { "mode": "subagent", "hidden": true, "model": "regolo/qwen3-coder-next",  "permission": { "edit": "allow", "bash": "ask" } },
  "researcher":{ "mode": "subagent", "hidden": true, "model": "regolo/gemma4-31b",       "permission": { "edit": "deny", "bash": "deny" } },
  "reviewer":  { "mode": "subagent", "hidden": true, "model": "regolo/mistral-small-4-119b", "permission": { "edit": "deny", "bash": "deny" } },
  "devops":    { "mode": "subagent", "hidden": true, "model": "regolo/qwen3.6-27b",      "permission": { "edit": "allow", "bash": "allow" } },
  "explore":   { "mode": "subagent", "hidden": true, "model": "regolo/qwen3.5-9b",       "permission": { "edit": "deny", "bash": "deny" } }
}
```

The model choices are not arbitrary. The **qwen3.5-9b** assigned to `explore` costs 0.10 $/MTok input and 0.40 output. The **qwen3.5-122b** assigned to `planner` costs 1.00 $/MTok input and 4.20 output. **That is 10× more expensive on input and 10× more expensive on output**. If routing places 60% of calls on the cheap model, the savings explain themselves.

### What Brick does well

- **It is open source** (Apache-2.0) and the gateway is a Go binary. It is not a Regolo lock-in: the `baseURL` points to any OpenAI-compatible endpoint.
- **It works with Claude Code, Codex, and OpenCode**, not just the latter. The repo itself ships specific *Quickstarts* for each of the three.
- **Sticky mode**: it keeps the conversation on its current model and only switches when the savings compensate for the cache re-priming cost. That avoids the pendulum effect.
- **Inspection CLI**: `brick route "what is 2+2?"` prints the routing decision without spending tokens. `brick codex status` gives a live dashboard. This is gold for debugging.

### What Brick does not tell you

The headline of Regolo's post claims *"up to 80% savings"*. The 80% is **the theoretical ceiling** — what happens when routing successfully classifies everything into the cheapest tier. The internal math of the same post, for a typical session of 50K input + 10K output tokens, gives a more modest number:

| Configuration | Typical session cost | Notes |
|---|---|---|
| Single model (qwen3.6-27b) | ~$0.046 | Baseline |
| Brick routing (≈30% on average) | ~$0.032 | Post's own estimate |
| Brick ceiling (everything to cheap tier) | ~$0.009 | 80% — best case, not realistic |

The point is not whether 80% is real. The point is that **even the realistic 30% is huge when you multiply it by dozens of sessions per month**. The "up to 80%" in the headline is still honest in the sense that it is achievable, but it requires your task mix to fall on the easy tiers. In my experience, the realistic percentage for a real coding session sits between 25% and 50%.

There is a second asterisk: **+150ms of latency** introduced by the classification step. For interactive tasks you notice it; for long sessions where the subagent already takes minutes, you do not.

And a third: **fallback** to a default model when classification is ambiguous happens **less than 2% of the time**, according to Brick. But that 2% lands on the rarest prompts — the ones that, precisely, deserve careful routing. I recommend monitoring it with `brick route <prompt>` over your own history during the first week.

## opencode-subagent-router: the portable alternative

On July 2, 2026, **ashutoshsinghpr7** published [`opencode-subagent-router`](https://github.com/ashutoshsinghpr7/opencode-subagent-router), a plugin that implements the same idea without Brick, without Regolo, and without provider lock-in. The key difference is **where the logic lives**: instead of an external router, it uses OpenCode's native `chat.message` hook to intercept subagent calls and override the model based on task type.

```json
{
  "model-router": {
    "rules": [
      {
        "agents": ["explore", "title", "summary", "compaction"],
        "model":   "deepseek-v4-flash",
        "provider":"deepseek"
      },
      {
        "agents": ["general", "build", "plan"],
        "model":   "deepseek-v4-pro",
        "provider":"deepseek"
      }
    ],
    "providers": {
      "deepseek-v4-flash": { "cost": { "input": 0.15, "output": 0.60 } },
      "deepseek-v4-pro":   { "cost": { "input": 2.50, "output": 10.00 } }
    }
  }
}
```

What I like most is the **automatic escalation**: if a cheap model receives a complex task (measured by token heuristics and prompt type), the router promotes it to the powerful model with a cooldown. And the reverse: if a powerful model keeps re-tasking, it gets demoted to the cheap one. It is a *quality guardrail* out of the box.

Practical differences with Brick:

| Aspect | Brick | opencode-subagent-router |
|---|---|---|
| Type of routing | External HTTP gateway (Go) | In-process hook in OpenCode |
| Configuration | Skill vector + cost_weight per model | Declarative rules by agent name |
| Providers | Any OpenAI-compatible (Regolo by default) | Any provider with config-based rules |
| Smart escalation | Via sticky mode | Via cooldown + re-tasking tracking |
| Latency overhead | ~150ms per classification | Negligible (synchronous hook) |
| Open source | Apache-2.0 | (verify license in the repo) |
| Maturity | Beta (`brick-v1-beta`) | Released Jul 2026 |

If your priority is **no extra infrastructure**, this is your path. The hook lives in your OpenCode config and requires no external service. If you need the HTTP gateway to centralize cost observability, Brick wins.

## The DIY option: `chat.message` hook with three rules

Then there is the option I ended up adopting for my personal projects: a homegrown setup, no router, no plugin, **just the OpenCode layer itself**. The idea is that if your model pool is small (three or four), you do not need a trained classifier — a static table of agents to models is enough.

```json
{
  "agent": {
    "explore":  { "model": "anthropic/claude-haiku-4-5",    "permission": { "edit": "deny", "bash": "deny" } },
    "title":    { "model": "anthropic/claude-haiku-4-5",    "permission": { "edit": "deny", "bash": "deny" } },
    "summary":  { "model": "anthropic/claude-haiku-4-5",    "permission": { "edit": "deny", "bash": "deny" } },
    "compact":  { "model": "anthropic/claude-haiku-4-5",    "permission": { "edit": "deny", "bash": "deny" } },
    "plan":     { "model": "anthropic/claude-sonnet-4-6",  "permission": { "edit": "deny", "bash": "deny" } },
    "build":    { "model": "anthropic/claude-sonnet-4-6",  "permission": { "edit": "allow", "bash": "ask" } },
    "general":  { "model": "anthropic/claude-sonnet-4-6" }
  }
}
```

This is the pattern that gives the best effort-to-result ratio for an indie dev. **Four or five models at most** (Haiku for mechanical tasks, Sonnet for real work, Opus or equivalent for the cases where quality outweighs cost). Routing is static — each subagent *is* its model — but that is exactly what you want when your pool is small and known.

The sophistication you lose is **dynamic classification**: in Brick, a prompt can escalate from Sonnet to Opus if the classifier detects complexity. In the DIY version, the model is fixed per agent. For many real sessions that is a feature: less variability, more reproducibility.

![Infographic: stack comparison Brick vs opencode-subagent-router vs DIY with trade-offs. EN](/images/model-routing-subagents-coding-agents-infographic-2-en.svg)

## The honest math

Let me put real numbers on a session I run several times a week: a refactor of a medium module (50K input, 10K output tokens aggregated across six subagents).

| Subagent | Model | Input tokens | Output tokens | Cost |
|---|---|---|---|---|
| explore  | qwen3.5-9b (0.10/0.40) | 8K | 1K | $0.0012 |
| planner  | qwen3.5-122b (1.00/4.20) | 12K | 3K | $0.0246 |
| coder    | qwen3-coder-next (0.50/2.00) | 15K | 4K | $0.0155 |
| reviewer | mistral-small-4-119b (0.50/2.10) | 8K | 1K | $0.0061 |
| researcher | gemma4-31b (0.40/2.10) | 5K | 1K | $0.0041 |
| devops   | qwen3.6-27b (0.50/2.10) | 2K | 0 | $0.0010 |
| **Total with routing** | | **50K** | **10K** | **$0.0525** |

If the same session ran with a single model for all subagents, say qwen3.6-27b (0.50/2.10), the cost would be:

```
50K input  × $0.50/MTok = $0.025
10K output × $2.10/MTok = $0.021
Total = $0.046
```

Wait — **routing is more expensive** in this specific session. The reason is the **planner**: it costs $0.0246 on its own, almost half of the total. When a heavy session requires a lot of planning, the savings from routing evaporate.

The case where routing shines is the **opposite**: a medium session where most calls are `explore` and `reviewer`, and only a few go to the `planner`. There, savings scale to 40–50%. The Regolo benchmark over 50 mixed workloads is realistic on this point: most calls fall on simple tasks, and routing sends them to the cheap tier.

**Practical conclusion**: model routing is not a uniform discount. It is a transfer: you pay a little more on heavy tasks (because the planner still needs a powerful model) and you save a lot on the long tail of trivial tasks. If your flow is mostly trivial, you save. If your flow is mostly heavy, do not expect miracles.

## The context that made me realize

I have been using GSD as my orchestration harness for six months — I covered that in detail in [the context engineering article](/blog/gsd-core-context-engineering/). The central piece of GSD is that **the main orchestrator does not touch code**: its context only receives compact JSON payloads and delegates each task to a subagent with its own 200K-token window. That solves the *context rot* problem, but it leaves the cost problem untouched. **My GSD sessions consume 5–8× more tokens than a direct Claude Code session**, because each subagent boots with its own context.

Model routing slots into this model perfectly. If every GSD subagent drags its own `200K tokens`, the difference between using qwen3.5-9b and qwen3.5-122b for that context becomes **a first-order financial decision**. In a 6-subagent session, moving 3 of them to a cheap tier halves the cost without touching the quality of the final output.

> **The insight:** GSD fragments context. Model routing fragments cost. The two techniques are orthogonal and they compose. A GSD setup without routing is like a car with an efficient engine and truck tires: the potential is there, but the optimization never materializes.

## What does not work yet

Not everything from generic chatbots ports cleanly to coding agents. Three open problems:

1. **Complexity classification is harder in code.** In a generic chatbot, "explain photosynthesis" is trivial. In a coding agent, "find the bug in this auth module" can be trivial or Herculean depending on the code. Routers trained on generic chatbot benchmarks do not always hit here.
2. **Dynamic escalation is delicate.** If a cheap model fails a subtask and escalates to the powerful one, the re-tasking cycle can add 2–3 extra turns. The cheap model's savings evaporate in those turns. The *quality guardrails* in opencode-subagent-router attack this, but do not fully solve it.
3. **Cost observability is still poor.** None of the three stacks gives you a "this session cost $X.XX" dashboard out of the box. The hooks exist, but the UI layer is green across the industry.

## The math asterisk on the 80%

Let me revisit the Regolo headline because I think the number deserves a finer analysis. The "80%" in the post title is computed like this:

> "A quick benchmark ran across 50 mixed workloads — code generation, architecture planning, documentation lookup, debugging — and Brick routed roughly 60% of requests to mid-tier models (saving cost) while escalating the genuinely hard ones to the heavy hitters in the pool."

The implicit math: if 60% of calls go to a tier that costs 0.10 $/MTok (against 1.00 $/MTok for the high tier), the theoretical savings on those turns is 90%. Averaged with the remaining 40% going to the high tier, the global savings look something like:

```
0.60 × 0.90 + 0.40 × 0.00 = 0.54 = 54% theoretical mean savings
```

The 80% appears when the task mix is even more favorable (more trivial, fewer heavy). But **the benchmark is not published with detail**: how many of the 50 workloads were of each type, which models were compared against which, what the variance was. It is a marketing number, not an audit.

What we do know is that Regolo is selling its product, not peer-reviewing a paper. The real number, in my own sessions, has been between 25% and 45%. That is, **the order of magnitude is correct, the exact percentage is not**. And that matters more than it sounds: if the order of magnitude is correct, the operational conclusion (routing is worth it) holds. If the percentage turned out to be completely fake, the conclusion might not.

> **2026 rule of thumb:** when an LLM routing provider tells you "up to N% savings", assume the real figure lands between N/2 and N. Use it to size the upside, not to build financial projections.

## Technical FAQ

**Does Brick work with Codex and Claude Code, or only OpenCode?**

Yes, both. The `regolo-ai/brick-SR1` README documents specific Quickstarts for all three. The difference is that with Claude Code and Codex the install is via CLI wrapper (`brick claude` or `brick codex`), while with OpenCode it is via `model: "regolo/brick-v1-beta"` in `opencode.json`. In all three cases Brick acts as an HTTP gateway and the coding agent sends calls to it.

**Does opencode-subagent-router fall back to a default model?**

Yes. If a prompt does not match any rule (for example, a new subagent you have not configured), the router keeps whatever model the agent has by default in its config. That is good and bad: good because it does not break the session, bad because it can mask misconfigurations in the early days.

**Can I combine the two stacks?**

In theory yes, in practice it is complex. Brick is an HTTP gateway that sits between the agent and the API; opencode-subagent-router is a hook inside OpenCode. If you put Brick as the gateway, the prompts that opencode-subagent-router tries to re-route will hit Brick first, and Brick will already have decided the model. Double routing is not forbidden, it is redundant.

**Is there a quality difference between the routed models?**

That is the million-dollar question, and the honest answer is: **it depends on the benchmark**. On MT-Bench (general chatbot), Microsoft's original RouteLLM showed that mixing cheaper models could keep 95% of GPT-4 quality at 85% lower cost. On coding-specific benchmarks (HumanEval, SWE-bench), the story is more nuanced: refactor and architecture tasks still need large models; search and formatting tasks can drop to small models without perceptible loss. You do not have a head-to-head 2026 study covering subagent routing specifically. This is new territory.

**How long does it take to amortize the setup?**

For an indie dev running 3–4 coding agent sessions a day, my estimate is **less than a week**. If the router saves you 30% on average and you spend ~$100/month on tokens, that is $30/month recovered. The setup takes 2–4 hours including the first week of monitoring. Payback is a matter of days.

**What about a team?**

The math scales linearly. If your team has 5 people sharing a coding agent and spends $2000/month on tokens, the routing saves you $600/month on the same setup. At that point it makes sense to invest in a centralized gateway (Brick) with a shared dashboard, not in local hooks.

**Is there a risk that a cheap model causes cascading errors?**

Yes, and it is the most serious risk. If `explore` (cheap model) returns an incorrect file list, every downstream subagent that depends on it starts with bad information. **The quality guardrail is not a luxury, it is a necessity.** The good news is that opencode-subagent-router implements it natively (re-tasking detection), and Brick covers it with sticky mode (you do not degrade quality to save a cent). For a DIY config, the most sensible move is to keep Sonnet/Opus on the subagents whose output other subagents consume in cascade.

**What happens when the router's classifier gets it wrong?**

The prompt gets the cheap model when it should have gotten the powerful one. Result: the subagent fails, returns poor output, the orchestrator detects it (or not), and the session may end with two extra turns trying to fix things. In the best case, you spend more than you saved. In the worst case, you ship real bugs. The mitigation is to monitor failure rates per subagent during the first weeks and bump up the tier for any agent that fails more than 5% of the time.

**How do I start tomorrow morning?**

My concrete recommendation: open your coding agent config, identify the subagents that already exist (in OpenCode these are `build`, `plan`, `general`, `explore`), and assign the cheapest model in your pool to `explore` and `title`. Measure the cost of your next session. If it drops by 20%, you have your proof of concept. From there, decide whether you want a full router.

## What I would recommend today

If you are reading this in July 2026, my advice is pragmatic:

- **If you use OpenCode and want to start today without infrastructure**: the DIY version with `agent.model` per subagent is the fastest path. Four models, five rules, zero external services. You configure it in 10 minutes.
- **If you want dynamic classification and have a diverse model pool**: try Brick. The Apache-2.0 license and the Go gateway give you portability. The `+150ms` of latency is not a problem in long sessions.
- **If you don't want to bind yourself to an external gateway but like the idea of an automatic hook**: opencode-subagent-router is your pattern. It works with DeepSeek, OpenAI, Anthropic, and any provider with API keys.
- **In every case**: monitor the cost per session for the first two weeks. The number you see in your provider's dashboard is the average — the real cost per subagent is what tells you whether the routing is working.

Model routing in subagents is not a fad. It is the **logical consequence** of having broken the single-model monolith. When the orchestrator delegates, it also delegates the choice of backend. The question is not whether we will have routers in 2027, but how many of us are stuck without one.

## Bibliography

- Regolo — *Opencode + Brick for Multi Agent Coding and optimize costs up to 80%*. Jul 14, 2026. [regolo.ai](https://regolo.ai/opencode-brick-for-multi-agent-coding-and-optimize-costs-up-to-80/)
- Regolo AI — *Brick-SR1: Mixture-of-Models routing gateway*. Apache-2.0. [github.com/regolo-ai/brick-SR1](https://github.com/regolo-ai/brick-SR1)
- ashutoshsinghpr7 — *opencode-subagent-router: Dynamic sub-agent model router*. Jul 2, 2026. [github.com/ashutoshsinghpr7/opencode-subagent-router](https://github.com/ashutoshsinghpr7/opencode-subagent-router)
- OpenCode — *Agents documentation*. [opencode.ai/docs/agents](https://opencode.ai/docs/agents/)
- orq.ai — *LLM Cost Optimization: How Smart Routing Cuts API Spend by 75%*. [gateway.orq.ai/blog/llm-cost-optimization-smart-routing](https://gateway.orq.ai/blog/llm-cost-optimization-smart-routing)
- zylos.ai — *LLM Routing: Intelligent Model Selection for Cost and Quality*. Jan 29, 2026. [zylos.ai/research/2026-01-29-llm-routing-intelligent-model-selection](https://zylos.ai/research/2026-01-29-llm-routing-intelligent-model-selection/)
- bestaiweb.ai — *OpenRouter, Martian, and Not Diamond: The 2026 LLM Router Race*. May 12, 2026. [bestaiweb.ai/openrouter-martian-and-not-diamond-the-2026-llm-router-race](https://www.bestaiweb.ai/openrouter-martian-and-not-diamond-the-2026-llm-router-race-and-where-agent-cost-optimization-is-heading/)
- ArceApps — *GSD: the engineering of clean context*. [en/blog/gsd-core-context-engineering](/blog/gsd-core-context-engineering/)
- ArceApps — *The Grand Final of AI IDEs*. [en/blog/desktop-ai-grand-final](/blog/desktop-ai-grand-final/)
- ArceApps — *Full AI coding agent stack 2026*. [en/blog/stack-completo-agentes-ia-2026](/blog/stack-completo-agentes-ia-2026/)

## Closing

If you are reading this at your desk with a coding agent open, try this: open your agent config, identify the subagents that touch `explore` and `summary`, and assign them the cheapest model in your pool. Measure the cost of the next session. If it drops by 20–30% without touching quality, you have the *proof of concept*. The next step is deciding whether you want a static router (DIY), a smart hook (opencode-subagent-router), or a full gateway (Brick). All three paths work. What no longer works is continuing to pay Opus to run tasks that Haiku handles in seconds.

Have you tried any model routing on your subagents? What numbers did you see? Write to me — I am especially interested in benchmarks on Codex, where the official documentation is more scattered.
