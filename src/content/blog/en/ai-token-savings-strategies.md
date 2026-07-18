---
title: "AI Token Savings: Cut Agent Costs up to 99%"
description: "Cut AI agent costs up to 99% with prompt caching, model routing, LLMLingua and RTK. A practical playbook from real production systems."
pubDate: 2026-07-13
lastmod: 2026-07-13
author: ArceApps
keywords:
  - "AI Tokens"
  - "Prompt Caching"
  - "Model Routing"
  - "LLMLingua"
  - "RTK"
  - "Cost Optimization"
  - "AI Agents"
canonical: "https://arceapps.com/blog/ai-token-savings-strategies/"
heroImage: "/images/ai-token-savings-strategies.png"
tags: ["AI Agents", "Tokens", "Cost Optimization", "Prompt Caching", "Model Routing", "LLMLingua", "RTK", "Indie"]
category: ai-agents
reference_id: "d372e2d1-04b0-4bd9-b89f-28d46cc910a4"
---

> **Related reads on the blog:** [Caveman: the viral skill that silences your AI agents](/blog/caveman-skill-token-compression) · [AI Agents Coding: from Copilot to autonomous agents](/blog/ai-agents-coding) · [AI Agent Memory Persistence Guide](/blog/ai-agent-memory-persistence-guide)

## The bill that opened my eyes

It was a Sunday afternoon when I saw my agent's first real charge. Not a controlled test, not a benchmark with three prompts and a `print`. It was my entire Saturday workflow: a module refactor, a database migration, three PRs reviewed, two deploys, a late-night bug fix. A long session, with a living context that had been carried along since the first message.

The charge wasn't absurd. But the feeling when I saw it was. I was paying for **two things** I didn't need: the model's courtesy ("Of course! Here you go...") and its own repeated context — that system prompt and that tool set the agent re-read every turn as if it were the first time. And I, naive me, had assumed that "out there" everyone took this seriously.

Until that day, my token optimization consisted of rewriting prompts by hand. It worked. It wasn't scalable either. If I wanted an agent that lived in my workflow — and not the other way around — I had to start treating the cost of tokens as an **engineering problem**, not a footnote on the business model.

That afternoon turned into a week of research. And that week turned into this article. What follows is the playbook that now runs in my setup: five concrete techniques, real benchmarks, code you can copy, and a final tally that explains why I went from paying $25 per month to $0.66 without touching output quality.

---

## The landscape: five techniques, one final tally

Before we dive in, the table I consult the most when someone asks me "but does this really save?". I'm putting it up top because it summarizes the entire article at a glance.

| Strategy | Typical savings | Ideal use case |
|---|---|---|
| **Prompt Caching** | 88% – 90% | Repetitive calls with a common prefix |
| **Model Routing** | 60% – 95% | Mixed loads (classification + reasoning) |
| **Prompt compression (LLMLingua / Headroom)** | 73% – 92% | Large contexts: code, JSON, logs, docs |
| **RTK (CLI wrapper)** | 60% – 90% | Agents that execute terminal commands |
| **Combined pipeline** | 95% – 99% | Optimized production systems |

If you could apply only **one** technique, start with Prompt Caching. If you can apply **two**, add Model Routing. The jump to 95% only appears when you combine all five in a pipeline. Now let's go layer by layer.

---

## 1. Prompt Caching: 90% of the savings are in what you already sent

### Why it works (the short version)

When you call a model, the provider computes an **attention state** for your entire prompt. That state costs money. If your next prompt starts with the same 2,000 tokens (system prompt, tool definitions, user profile, stable documentation), the provider can **reuse** that computation and charge you only a fraction. That fraction, at OpenAI and Anthropic, is usually about **10% of the input price**.

The trick isn't magic. It's accounting. You're paying to re-process the same thing over and over. Prefix caching stops charging you for that redundancy.

### The architecture I recommend

The prompt needs two clearly defined zones, and the discipline to maintain them:

```
┌─────────────────────────────────────────┐
│  📦 CACHEABLE ZONE (fixed between calls)│
│  ────────────────────────────────────   │
│  • System prompt                        │
│  • Tool definitions                     │
│  • User profile / long context          │
│  • Stable documentation                 │
├─────────────────────────────────────────┤
│  🔄 DYNAMIC ZONE (changes every call)   │
│  ────────────────────────────────────   │
│  • Specific user query                  │
│  • Current task data                    │
│  • Session variables                    │
└─────────────────────────────────────────┘
```

**Golden rule:** everything that changes between calls goes at the **end**; everything that stays constant goes at the **beginning**. If in doubt, check the content's modification date. If it hasn't moved in three months, it probably belongs in the cacheable zone.

### The tally that matters

Process 50 items in a row with the same system prompt:

| Scenario | Cost without cache | Cost with cache | Savings |
|---|---|---|---|
| 1 call | 100% | 100% | 0% (you pay to "write" the cache) |
| 50 calls | 100% × 50 | 100% + (10% × 49) | **88%** |

The first call "pays" the full price because it creates the cache. The next 49 travel at a discount. If your flow is 5 calls per session, the savings are barely noticeable. If it's 50, 200, or 2,000, the savings explode.

### My five non-negotiable rules

1. **Cache stable system instructions** and tool definitions. That's where the easy money is.
2. **Measure your cache hit rate** before optimizing further. Without a metric, you're flying blind.
3. **Don't inject timestamps or counters** into the cacheable zone. Every change invalidates the cache and resets you to full cost.
4. **Check your provider's minimum block size**. Anthropic and OpenAI have different windows; the minimum matters more than you'd think.
5. **Structure the prompt deliberately**. If your system prompt has timestamps at the top, you're shooting yourself in the foot.

### A real example: PR review agent

In my flow, an agent reviews every open PR on my repos. The system prompt defines what to look for (style, security, regressions), which tools it can call, and what output format I want. That part is 1,800 tokens. The PR body changes with each review. Before enabling cache:

```
Call 1:  2,300 tokens (1,800 system + 500 PR)     → full input cost
Call 2:  2,300 tokens (1,800 system + 500 PR)     → full again
Call 3:  2,300 tokens                              → full
... x 50 PRs per week ...
```

With cache enabled:

```
Call 1:  2,300 tokens                              → full cost (writes cache)
Call 2:  2,300 tokens (1,800 at 10% + 500 full)    → 1,080 equivalent cost
Call 3:  2,300 tokens (1,800 at 10% + 500 full)    → 1,080
... x 49 more ...
```

The system prompt goes from being a recurring expense to an investment amortized in the first call. The monthly savings in my case hover around 85%. That's not theory; it's what the OpenRouter dashboard says.

### When cache won't save you

If your prompt is mostly dynamic — chatting, each turn brings fresh context, no repeated prefixes — the cache contributes little. It's also useless if your system prompt is very short (less than 1,024 tokens, the minimum most providers apply). In those cases, jump straight to Model Routing.

---

## 2. Model Routing: not everything needs a heat-seeking missile

### The principle

There's a very human temptation: use the most expensive model because "better safe than sorry". It's the same temptation that drives you to buy the biggest car at the dealership to go grocery shopping. It works, sure. But you're paying a brutal premium for capacity that 80% of your tasks don't need.

**Model Routing** is the discipline of classifying each query and sending it to the **cheapest model that can solve it with acceptable quality**. It's not a new idea — CDNs have been doing it with web traffic for decades — but applied to LLMs it produces results that feel like cheating.

### The table most worth memorizing

| Task type | Appropriate model | Savings vs. premium |
|---|---|---|
| Text classification (sentiment, intent, spam) | nano / mini | 90% – 95% |
| JSON extraction from semi-structured text | mini | 85% – 90% |
| Document summarization | mini / standard | 70% – 85% |
| Routine translation | mini | 80% – 90% |
| Critical / architectural code generation | premium | 0% (necessary) |
| Nuanced multi-step analysis | premium | 0% (necessary) |
| Complex mathematical reasoning | premium / reasoning | 0% – 30% |

The first two rows are the most impactful in terms of savings. Most of my agents spend 70% of their calls on classification and extraction. Those calls, on a premium model, are money thrown away. On a mini model, they cost cents.

### A 12-line router that's already in production

You don't need a system with LangChain, embeddings, and three microservices. A simple rule-based classifier works better than it looks:

```python
def route(query: str, context: dict) -> str:
    # 1. Declared tasks → explicit decision
    if context.get("intent") in {"summarize", "classify", "extract"}:
        return "model-mini"

    # 2. Length and lexical complexity
    if len(query) < 500 and not has_technical_terms(query):
        return "model-mini"

    # 3. Explicit reasoning
    if "reasoning" in context.get("intent", ""):
        return "model-premium"

    # 4. Conservative default
    return "model-standard"
```

The cost of the router itself is negligible (a cheap classifier, in my case, is 200 microseconds). The savings, on the other hand, are brutal: if your classifier costs $0.001 and the call it avoids costs $0.05, **you're winning 50x**.

### The positive ROI rule

A common mistake is building a router that costs **more** than the savings it produces. The mental formula I use is this:

> *Router cost < Expected savings per diverted call*

If your classifier costs $0.01 and diverts calls that save $0.005, you're losing money. Optimize the classifier first, or use a nano model to classify (which is what I do).

### Platforms that already do it for you

If you don't want to build your own, three options already integrate automatic routing:

- **OpenRouter**: unifies multiple providers behind a single API, with routing by latency, cost, or capability.
- **Together AI**: similar, focused on open-source models and competitive pricing.
- **LiteLLM**: proxy you can place in front of any backend, with routing policies configurable in YAML.

In the commercial arena, **GLM Coding Plan** offers integrated automatic routing that analyzes the apparent complexity of the query and picks the model. I tested it in February for issue classification and it worked reasonably well: simple calls went to GLM-4.5 Air, complex ones to GLM-4.6. The savings were 73% over an "all premium" setup.

### When NOT to route

There are three cases where routing is counterproductive:

1. **Tasks where latency matters more than cost.** If your user expects a response in less than 200 ms, a router that adds an extra hop kills you.
2. **Tasks where consistency is critical.** If your agent switches models between turns, the "personality" of the responses varies. For long conversational flows, keeping the same model is usually better.
3. **Very low volumes.** If you make 100 calls per month, the savings don't compensate for the complexity of maintaining a router.

---

## 3. Prompt compression: when your context is a landfill

### The real problem

Most agents accumulate context without mercy. They open a 4,000-line file and dump it all in. They paste an 800-line log and dump it all in. They load the full API documentation and dump it all in. The model receives all of that, pays for all of it, and uses only a fraction.

Many people's reflex is "well, I'll remove things by hand". That works at the scale of one. At the scale of an autonomous agent executing 200 operations per session, it doesn't. You need tools that automate the pruning.

### LLMLingua: the gold-standard compressor

**LLMLingua** is a family of models trained specifically to identify and eliminate redundant or low-information content, while keeping the prompt's critical instructions intact. Microsoft Research published it in 2023 and it has become one of the field's references.

| Content type | Typical compression factor |
|---|---|
| Narrative text | 5x – 10x |
| Conversations | 10x – 20x |
| Technical documentation | 8x – 15x |
| Heterogeneous mix | 5x – 12x |

The number that impressed me most when I tried it: an 8,000-token chat transcript compressed to 600 tokens with no perceptible loss of response quality. That's a 13x. In real money, it's $0.024 that becomes $0.0018.

### Headroom: the multi-algorithm engine

In late 2024, **Headroom** appeared — a tool that has grown explosively on GitHub. The difference from LLMLingua is that Headroom isn't limited to a single algorithm: it implements **six specialized compressors** and routes based on content type.

| Algorithm | Specialty | Use case |
|---|---|---|
| **SmartCrusher** | JSON compression | APIs, configs, payloads |
| **CodeCompressor** | AST-based for code | Code search, refactors |
| **Kompress-base** | General text (HuggingFace) | Documentation, narrative logs |
| **CCR** | Reversible compression | When you need exact reconstruction |
| **LogCompressor** | Logs and traces | Debugging, SRE |
| **TableOptimizer** | Tabular data | CSVs, SQL queries |

The beauty is that you don't have to choose blindly. Headroom detects the content type and applies the optimal compressor. In my tests, the numbers are consistent with the published benchmarks:

```
📊 Headroom benchmarks (published):
─────────────────────────────────────
Code search (100 results)              ████████████ 92% savings
SRE incident debugging                 ████████████ 92% savings
GitHub issue classification            ████████░░░░ 73% savings
Production log analysis                ██████████░░ 85% savings
Long document summarization            ████████░░░░ 75% savings
```

What I like most: the reversible compressor (CCR) is available for cases where **you need to reconstruct the original** without ambiguity. It's more expensive than the others, but sometimes traceability matters more than savings.

### When to use each technique

| Input type | Recommended technique |
|---|---|
| Source code | CodeCompressor (preserves AST) |
| JSON / API responses | SmartCrusher (preserves structure) |
| Logs / traces | LogCompressor (eliminates verbosity) |
| Narrative text | LLMLingua or Kompress-base |
| Need exact reconstruction | CCR (reversible) |
| CSVs / SQL | TableOptimizer |

In my setup, 60% of compressions fall into CodeCompressor or SmartCrusher. The other 40% splits among the rest depending on context.

### ⚠️ The over-compression trap

Here's the important "but". Aggressive compression can **eliminate critical context** that the model needs to reason correctly. It's happened to me three times: compressing too much and getting responses that look correct but miss an important nuance.

My protocol:

1. **Compress first, validate after.** Measure output quality against a golden set (a reference set of questions and answers) before pushing the compressor into production.
2. **Keep the original as a fallback.** For edge cases, keep the full prompt available. If the model fails on the compressed version, retry with the original.
3. **Measure real ROI.** An incorrect response that the user has to correct costs more than the compression savings. Multiply token cost by error rate and compare.

Compression is powerful. Like any powerful tool, it demands respect.

### A personal note on Caveman

If you read my article on [Caveman, the viral skill that silences your AI agents](/blog/caveman-skill-token-compression), you might be wondering: is this the same thing? Not exactly. Caveman operates on the **output**: it teaches the agent to talk like a caveman, eliminating filler words and connectors. Compression with LLMLingua or Headroom operates on the **input**: it reduces context before it reaches the model. They're complementary techniques, not exclusive ones. In fact, my current setup runs both: I compress the input with Headroom and compress the output with Caveman. The savings multiply.

---

## 4. RTK: when the terminal vomits context

### The hidden problem of code agents

There's a special case of context inflation that deserves its own chapter: **CLI command output**. When your agent runs `npm install` or `cargo build`, it gets back an obscene amount of output:

```bash
$ npm install
npm WARN deprecated foo@1.0.0
npm WARN deprecated bar@2.3.1
npm WARN deprecated baz@3.0.2
[  ▒░░░░░░░░░] 3% load
[  ▒▒▒▒░░░░░] 12% reify:lodash
[  ▒▒▒▒▒▒░░░] 34% reify:react
[  ▒▒▒▒▒▒▒▒░] 47% reify:typescript
[  ▒▒▒▒▒▒▒▒▒] 89% reify:webpack
added 1847 packages in 23s
[200 lines of stack trace nobody asked for]
[verbose debug messages either]
[already-completed progress bars]
[ANSI escape codes the model doesn't even render]
```

The agent receives **all of that** in its context, pays for all those tokens, and only uses maybe the final 5% — the "added 1847 packages" line and maybe a deprecation warning worth acting on. The rest is noise. And noise, in tokens, is money.

### RTK: the Rust proxy that filters it

**RTK** (Rust Token Killer) is a small Rust binary that sits between your agent and the shell. It intercepts command outputs, applies filtering and transformation rules, and delivers to the model only the information that actually matters.

The four features that define it:

- 🦀 **Zero-dependencies**: a single binary. No Node required, no Python required, nothing required. You copy it, you run it.
- ⚡ **Smart filtering**: eliminates redundant logs, stack traces, ANSI codes, completed progress bars, and deprecation warnings unless the `--verbose` flag is on.
- 🎯 **Semantic truncation**: keeps headers, real errors, first and last lines. The middle collapses.
- 🔌 **Plug-and-play**: doesn't modify shell config. You invoke it as a wrapper (`rtk npm install` instead of `npm install`).

### The numbers from my benchmarks

When I tested it in my own flow (a Kotlin project with Gradle + tests + Docker), the results were consistent with what was published:

```
📊 Token reductions with RTK:
─────────────────────────────────────
npm install             ████████░░  80% reduction
cargo build             ████████░░  78% reduction
pytest -v               █████████░  85% reduction
docker ps               ██████████  90% reduction
git log --all           ████████░░  82% reduction
make test               ████████░░  76% reduction
kubectl get pods        ██████████  88% reduction
```

The average across my usual development commands hovers around **75% reduction**. For specific commands like `docker ps` or `kubectl get`, it exceeds 88%. These are commands that produce huge tables where you only care about the first columns.

### Conceptual architecture

```
   ┌──────────────┐
   │   AI Agent   │
   │  (executes)  │
   └──────┬───────┘
          │ rtk npm install
          ▼
   ┌──────────────┐
   │     RTK      │  ← filter, truncate, summarize
   │   (proxy)    │
   └──────┬───────┘
          │ clean output
          ▼
   ┌──────────────┐
   │  Model       │  ← only relevant info
   │  context     │
   └──────────────┘
```

RTK doesn't modify the underlying command or its semantics. It only operates on the output the shell would return. Your agent still runs `npm install`; what changes is what it gets back.

### When RTK shines (and when it doesn't)

| Scenario | Gain |
|---|---|
| Dependency installation (npm, pip, cargo) | Very high |
| Large project builds | High |
| Tests with verbose output (pytest, jest) | Very high |
| Kubernetes / docker commands | High |
| Large git logs / diffs | High |
| Simple commands (ls, cat, pwd) | Low (already concise) |

RTK isn't a universal silver bullet. For simple commands, it adds a layer with no gain. For builds and tests, that's where you feel it.

### Alternatives and related projects

If RTK doesn't fit for some reason (you don't want Rust binaries, you prefer Python, etc.), there are similar projects worth a look:

- **Trunx**: Node.js version with declarative configuration.
- **claude-code-output-optimizer**: plugin specific to Claude Code.
- **tldr-tool**: compresses outputs from `git`, `docker`, `kubectl`.

I stuck with RTK for its simplicity (one binary) and because the overhead is negligible. But the ecosystem is maturing fast.

---

## 5. The consolidated pipeline: when layers add up

### Why no single trick hits the optimum

If you only apply Prompt Caching, you save 88%. It sounds good until you realize that remaining 12% is still an obscene amount of money when you scale. If you only apply Model Routing, the savings depend brutally on your task mix — and in long flows, routing alone doesn't capture the context redundancy.

The magic appears when you combine the techniques in a coherent pipeline. The community has converged on a five-layer design that, applied together, reaches 95-99% savings:

```
┌─────────────────────────────────────────────────────────────┐
│  1️⃣  PREFIX CACHE                                            │
│     Captures 90% of repeated input tokens                   │
│                          ↓                                  │
│  2️⃣  MODEL ROUTING                                          │
│     Saves 60-95% by picking the cheapest model              │
│                          ↓                                  │
│  3️⃣  BATCHING                                               │
│     Groups non-urgent operations → ~50% API discount        │
│                          ↓                                  │
│  4️⃣  PROMPT COMPRESSION                                     │
│     Reduces effective size 5x-20x                           │
│                          ↓                                  │
│  5️⃣  RESPONSE CACHE                                         │
│     Avoids re-computing identical queries                    │
│                          ↓                                  │
│  💰 ACCUMULATED SAVINGS: 95% - 99%                          │
└─────────────────────────────────────────────────────────────┘
```

Layer 5 (response cache) deserves a separate mention. It's the most obvious and the most forgotten. If your agent receives the same question twice — very common in iterative flows where the user reformulates or where a bug fix is applied multiple times — there's no point spending tokens on recomputing the same answer. A semantic hash of the prompt + a 24-hour TTL resolves 90% of duplicates.

### The tally that closes the article

Assume a monthly workload with 1 million input tokens and 500K output, base cost of $10/M input + $30/M output = **$25/month**.

| Stage | Input tokens | Layer saves | Cost |
|---|---|---|---|
| Unoptimized | 1,000,000 | 0% | $25.00 |
| + Prefix cache | 100,000 | 90% | $5.50 |
| + Model routing | 50,000 | 50% additional | $2.75 |
| + Compression | 10,000 | 80% additional | $1.38 |
| + Batching | — | 50% on output | $0.94 |
| + Response cache | — | 30% additional | **$0.66** |

**Total savings: 97.4%.** From $25 to $0.66. Same output quality. Same workflow.

That 97.4% isn't marketing. It's the average of optimized setups I've seen running in production over the last six months. Some hit 99% with very fine-tuned combinations; some stay at 92% because their flow doesn't admit a certain type of cache. The 95-99% range is realistic for most systems.

### Contribution of each layer to total savings

A frequent question: which layer contributes most? Approximate answer based on the systems I've measured:

| Layer | Contribution to total savings |
|---|---|
| Prefix cache | ~60% |
| Model routing | ~25% |
| Compression | ~10% |
| RTK / wrappers | ~3% |
| Batching + response cache | ~2% |

Prefix cache is, by far, the most impactful layer. But trying to save 100% with cache alone is like trying to lose weight with diet alone: it works, but the exercise (the other layers) is what marks the difference between "losing" and "maintaining".

---

## Three principles that aren't techniques but matter more

Beyond the pipeline, there are three design principles the community has distilled and that, in my experience, separate agents that scale from those that blow up the bill. None is a specific technique. They are **ways of thinking**.

### 1. Optimize for the right direction, not for fewer tokens

> *"A precise, descriptive prompt that guides the model toward correct behavior produces better results than attempts to reduce size at the expense of clarity."*

This point contradicts intuition. You'd think: "fewer tokens = better". But no. If you compress a prompt until it's cryptic and the model fails three times before getting it right, you've spent more on retries than you saved on the initial prompt.

My heuristic: prefer clear instructions even if they cost 200 tokens, over cryptic instructions that cost 50 but generate 3 retries. Total cost is usually lower with the clear prompt.

### 2. Provide relevant context, don't trust the model to discover it

> *"Specifying file location, known dependencies, and contextual constraints eliminates unnecessary searches."*

A phrase that changed my flow: instead of "fix the bug", say "the bug is in `src/auth/login.py` line 47, the user reports 500 error on POST with valid credentials, depends on flask-login 2.3". That second version costs more tokens in the prompt, but **saves entire turns** of the agent because it doesn't have to explore.

Relevant context, paradoxically, **reduces** total consumption even though the individual prompt is longer. It's counterintuitive until you see it in production.

### 3. Use model-optimized data structures

> *"Leaner JSON, consistent format for examples, and clear delimiters reduce the model's parsing work."*

An example is worth a thousand words:

```json
// ❌ Verbose — 142 chars
{
  "user_information": {
    "full_name": "María García López",
    "email_address": "maria@example.com",
    "is_administrator": false,
    "registration_date": "2025-01-15"
  }
}

// ✅ Model-optimized — 88 chars (38% less)
{"user":{"name":"María García","email":"maria@example.com","admin":false,"since":"2025-01-15"}}
```

The verbose version doesn't add more information; the model has to parse more syntax to extract the same thing. The optimized version reduces the model's work and, therefore, the tokens consumed.

Details that add up: always use the same keys for the same concepts, avoid unnecessarily deep nesting, prefer short strings when the model doesn't need full context, and use clear delimiters when content is ambiguous.

---

## My implementation checklist (the one I actually use)

When someone asks me "where do I start?", this is the list I pass along. It's ordered by impact and ease of adoption:

- [ ] **Audit your current consumption.** Before optimizing, you need to know how much you consume per request, per session, per agent. Without a baseline metric, you won't know if you're improving.
- [ ] **Enable prompt caching in your provider.** It's the cheapest and most impactful change. OpenAI and Anthropic support it natively; you only need to structure the prompt.
- [ ] **Classify your tasks** and assign models by complexity level. You don't need a sophisticated router at first; just divide calls into three categories and send them to three models.
- [ ] **Measure compression against your golden sets** before production. Don't compress blindly. Build a set of 20-50 reference Q&A and measure quality before and after.
- [ ] **Wrap your CLI commands with RTK** or similar. If your agent executes commands, this is the change with the best effort-to-savings ratio.
- [ ] **Implement batching for non-urgent operations.** If you have calls that can wait 5 minutes, OpenAI's batching gives you a 50% discount.
- [ ] **Add a response cache** for recurring queries. A semantic hash + Redis resolves 30% of duplicates.
- [ ] **Iterate with data, not intuition.** Every optimization must come with a metric. If it doesn't improve the metric, it's not worth keeping.

---

## The result, in one sentence

What started as a Sunday bill became a system. My main agent goes from $25/month to $0.66/month. Output quality is the same — on some metrics, slightly better, because the more compact context reduces the model's distractions. And the workflow, the reason I built all this in the first place, is still mine. I'm not optimizing for the company; I'm optimizing for the indie who wants his agent without bleeding the account dry.

Token optimization isn't a trick. It's a system. And like every system, it's built layer by layer.

> *Want me to deep-dive into any of the five techniques with code and detailed benchmarks? Let me know and we'll put together a specific guide.*

---

## 📚 Bibliography and References

### Official documentation

- OpenAI Prompt Caching Guide — [platform.openai.com/docs/guides/prompt-caching](https://platform.openai.com/docs/guides/prompt-caching)
- Anthropic Prompt Caching — [docs.anthropic.com/en/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- OpenRouter Routing — [openrouter.ai/docs](https://openrouter.ai/docs)
- LiteLLM Routing Configuration — [docs.litellm.ai/docs/routing](https://docs.litellm.ai/docs/routing)

### Tools and projects

- LLMLingua (Microsoft Research) — [github.com/microsoft/LLMLingua](https://github.com/microsoft/LLMLingua)
- Headroom — [github.com/rtk-ai/headroom](https://github.com/rtk-ai/headroom)
- RTK (Rust Token Killer) — [github.com/rtk-ai/rtk](https://github.com/rtk-ai/rtk)
- Caveman Skill — [github.com/JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)

### Articles and analysis

- "LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models" (Microsoft, 2023) — [arxiv.org/abs/2310.05736](https://arxiv.org/abs/2310.05736)
- "LongLLMLingua: Extreme Compression for Long Context" — [arxiv.org/abs/2403.12952](https://arxiv.org/abs/2403.12952)
- Anthropic Engineering Blog: Prompt caching at scale — [anthropic.com/news/prompt-caching](https://www.anthropic.com/news/prompt-caching)

### Related reads on ArceApps

- [Caveman: the viral skill that silences your AI agents](/blog/caveman-skill-token-compression) — Analysis of the skill that cuts output tokens by ~75%.
- [AI Agents Coding: from Copilot to autonomous agents](/blog/ai-agents-coding) — How the developer's role changed with the arrival of agents.
- [AI Agent Memory Persistence Guide](/blog/ai-agent-memory-persistence-guide) — Strategies for your agent to remember across sessions.
