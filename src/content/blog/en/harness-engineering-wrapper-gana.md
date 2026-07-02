---
title: "Harness Engineering: The Wrapper Wins"
description: "Harness Engineering explained: why the wrapper (tools, memory, guardrails) makes agents productive. Definition, anatomy, and real indie application."
pubDate: 2026-07-02
lastmod: 2026-07-02
author: ArceApps
keywords:
  - "Harness Engineering"
  - "Agent Harness"
  - "Model + Harness"
  - "AI Agents"
  - "Indie Dev"
  - "Claude Code"
  - "AGENTS.md"
canonical: "https://arceapps.com/blog/harness-engineering-wrapper-gana/"
heroImage: "/images/harness-engineering-wrapper-gana.svg"
tags: ["Harness Engineering", "AI Agents", "Claude Code", "AGENTS.md", "Indie Dev", "Architecture", "Agentic AI", "2026"]
reference_id: "5fed4b93-ea15-411e-a6e6-2120934be487"
---

> **Related reading on the blog:** If you're new to the topic, this post assumes you already know the basics of agents and context. To get up to speed, read first [Effective Context for AI in Android](/blog/effective-context-ai), [GSD Core: the anti-ceremony context engineering framework](/blog/gsd-core-context-engineering), and [Headroom: the compression layer your agent stack needs](/blog/headroom-compression-layer). If you've already read those, jump to "The 3 Eras" — this article is the **meta-layer** that ties the others together.

There's a number I keep saying out loud since I first read it: **+13.7 points on Terminal Bench 2.0 by changing ONLY the harness, with the exact same model (`gpt-5.2-codex`)**. The LangChain team published it in mid-March: their `deepagents-cli` agent went from Top 30 to Top 5 on the leaderboard (52.8% → 66.5%) without touching a single model parameter, just by rewriting the system prompt, tuning the tools, and adding middleware around the calls. Zero fine-tuning. Zero provider swap. Zero magic. Pure wrapper engineering.

Then there's the Vercel data point that cinematically completed the picture: **they removed 80% of their agent's tools, left it with a flat filesystem + `grep`, and the results were better on almost every metric: 100% success (up from 80%), 3.5× faster, –40% tokens.** Again, the model didn't move a millimeter.

If you've been reading about agents for six months, you've probably come across the word **harness** somewhere. Maybe you saw it first on Mitchell Hashimoto's blog on February 5, 2026; maybe it reached you via the LangChain team; maybe some influencer on X dropped it on you. The interesting question isn't where the term comes from, it's why suddenly everyone is obsessed with the same idea: **the model commoditizes, the wrapper wins.**

This post is what I would have wanted to read three months ago, before spending two weeks diving into HN, Reddit, X, the LangChain blogs, Tomasz Tunguz's newsletter, Stuart Miller's Substack, and Nicolas Neira's guide. It's the indie — and slightly skeptical — answer to the question: **what exactly is Harness Engineering, does it actually affect me as an independent developer, or is it just another hype rebrand?**

## 🐎 The metaphor: the mustang and the saddle

Tomasz Tunguz (GP at Theory Ventures, 150,000 readers on his newsletter) summarized it in his piece *"Harnessing AI"* with the best metaphor I've read in months:

> *"AI is powerful but wild. Harnessing the power means domestication. There are seven parts to this domestication: context & memory, tools & action, orchestration & loop, state & persistence, sandbox & compute, observability & governance, and cost & workflow optimization."*

The mental image is powerful: an LLM is a **mustang** — pure brute force, instinct, undirected intelligence. Useless in your day-to-day until you put a saddle on it, some reins, a fenced path, and a rider who knows what they're doing. The harness is the set of all those things. Without it, the model is an inference bill. With it, the model is an engineer.

Vercel discovered exactly this in production: fewer tools and more filesystem gave them a more capable agent. Why? Because **tools are constraints and the filesystem is freedom.** An agent with 16 specialized tools has to remember which one to use in each case; one with `bash` + `read_file` + `write_file` can improvise its own approach. The saddle doesn't have to be elaborate; it has to be **the right one**.

## 📜 The origin: Mitchell Hashimoto, February 5, 2026

The term was put into circulation by **Mitchell Hashimoto**, co-founder of HashiCorp and creator of Terraform. He did it in Step 5 of a personal post titled *["My AI Adoption Journey"](https://mitchellh.com/writing/my-ai-adoption-journey)*, written by hand and dated February 5, 2026.

Hashimoto recounts his 6 steps from AI skeptic to AI-productive. Step 5 is literally titled *"Engineer the Harness"* and the key quote is this:

> *"At risk of stating the obvious: agents are much more efficient when they produce the right result the first time, or at worst produce a result that requires minimal touch-ups. The most sure-fire way to achieve this is to give the agent fast, high quality tools to automatically tell it when it is wrong. I don't know if there is a broad industry-accepted term for this yet, but I've grown to calling this 'harness engineering.' It is the idea that anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."*

Note what he **doesn't** say. He doesn't talk about the model. He doesn't talk about the provider. He doesn't talk about GPT-5 or Claude 4.6 or Gemini 3.1. He talks about **AGENTS.md** (documentation the agent reads on startup) and **programmed tools** (verification scripts, tests, health checks). The most sober definition that exists:

> *"It comes in two forms: better implicit prompting (AGENTS.md) and actual, programmed tools."*

That's it. That's the seed. Everything else — Tunguz's 7 components, Neira's 5 patterns, LangChain's `Agent = Model + Harness` — are expansions of that minimalist idea.

## 🧬 Operational definition: Agent = Model + Harness

Vivek Trivedy (LangChain) gave it the canonical form in his post *["The Anatomy of an Agent Harness"](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)* on March 10, 2026:

> *"Agent = Model + Harness. If you're not the model, you're the harness. A harness is every piece of code, configuration, and execution logic that isn't the model itself. A raw model is not an agent. But it becomes one when a harness gives it things like state, tool execution, feedback loops, and enforceable constraints."*

The formula is deliberately simple, and that's why it's powerful. It forces you to classify every component of your system in one of two boxes: **is it the model?** or **is it the harness?** If the answer is "I don't know", it's harness. And that includes:

- **System prompts** (the `AGENTS.md` the agent reads on startup)
- **Tools, skills, and MCPs** (with their descriptions, which are part of the prompt)
- **Bundled infrastructure** (filesystem, sandbox, browser)
- **Orchestration logic** (subagent spawning, handoffs, model routing)
- **Hooks and middleware** (compaction, continuation, lint checks)

That classification is what makes Trivedy's post useful as a catalog. He follows a brutal design rule: derive each harness component **working backwards from a desired agent behavior**. Want the agent to verify its own work → add a `PreCompletionChecklistMiddleware`. Want the agent to not get stuck in a doom loop editing the same file 10 times → add a `LoopDetectionMiddleware`. Want the agent to not run out of time → inject a time budget into the prompt.

## 🕰️ The 3 eras: Prompt → Context → Harness

Nicolas Neira (senior engineer with his own newsletter) gave it the historical dimension. He summarizes 2022-2026 as three eras of AI engineering, each answering a different question:

| Era | The question it answers | Period | Canonical example |
|---|---|---|---|
| **Prompt Engineering** | What do I tell the model? | 2022-2024 | *"Act as an expert in X"* |
| **Context Engineering** | What does the model know? | 2025 | RAG, context window, skills |
| **Harness Engineering** | Where does the model work? | 2026 | AGENTS.md, hooks, sandboxes, observability |

The chronology he reconstructed from primary sources (each citation verified):

1. **November 2025** — Anthropic publishes *"Effective Harnesses for Long-Running Agents"*. First formal use of the term in a frontier-lab blog. Talks about *initializer agent*, *coding agent*, and a `claude-progress.txt` to maintain state across sessions.
2. **February 5, 2026** — Mitchell Hashimoto, *"My AI Adoption Journey"*. Coines the verb **"harness engineering"** as a discipline.
3. **February 11, 2026** — OpenAI publishes *"Harness engineering: leveraging Codex in an agent-first world"*. Anecdote: 7 engineers, 1 million lines of code in 5 months, zero written by hand. The engineer's job stops being writing code; it becomes **designing the harness**. (The post hit 123 points on HN the same day.)
4. **April 2026** — Martin Fowler publishes his formal taxonomy: **Guides** (computational / inferential) + **Sensors** (computational / inferential). When Fowler organizes something, the industry adopts it. It happened with Refactoring, it happened with Microservices, it's happening now with Harness Engineering.
5. **April 2026** — Andrej Karpathy at Sequoia AI Ascent declares *"vibe coding"* dead and replaces it with *agentic engineering*, where 99% of the time you don't write code — you orchestrate agents.

In less than 6 months, **harness** went from an adjective only used by OpenAI's internal teams to a noun with academic taxonomy. It's not pure hype: it's a convergence of multiple lines (Anthropic, OpenAI, LangChain, Mitchell, Fowler, Karpathy) reaching the same place by different paths.

## 🧩 The 5 patterns (Neira's practical taxonomy)

Nicolas Neira identified 78 moments of harness engineering in engineering videos on his channel **before** the term even existed. He grouped them into 5 patterns. This is the part that serves me most as an indie developer, because I can apply it tomorrow:

### 1. Restrictions (27 moments)
**Limit what the agent can do BEFORE it acts.** This is the most frequent category, and the most counter-intuitive for those of us who start with agents: your first instinct is to give it more tools; the right one is to give it fewer. Concrete forms:
- Tool restriction (remove tools the agent shouldn't be able to invoke)
- IAM permissions (limit which files it can read/write/delete)
- Secrets in Secret Manager (not hardcoded in the prompt)
- Allow-lists of permitted bash commands

### 2. Verification (18 moments)
**Observe AFTER the agent acts.** The category with the most impact on autonomy. Forms:
- Hooks that reject dangerous operations (deleting DNS records, running `rm -rf` in prod)
- `validate.sh` that rejects malformed skills
- Programmatic tests the agent runs on its own output
- A second LLM reviewing the first one's output (Fowler calls this *Inferential Sensor*; I call it "the reviewer who never gets bored")

### 3. Documentation (19 moments)
**Files that define how the system behaves.** This is where each project's **`AGENTS.md`** lives, the skills, the tool contracts, the constitution files from Spec-Kit. The rule I learned: **every line in an `AGENTS.md` should come from a real agent error.** If it didn't come from an error, it's noise. If it came from an error, it's gold.

### 4. Observability (5 moments)
**If you can't see what the agent does, you don't have a harness.** LangSmith traces, OpenAI's 7 tmux panels, structured OpenTelemetry logs, session replay. Without observability, debugging an agent in production is witchcraft.

### 5. Reactive iteration (5 moments)
**When something fails, the harness adapts — not the model.** The piece that closes the loop. Neira's real example: when AI Studio returned 503 mid-run, the team didn't rewrite anything — they migrated the endpoint to Vertex AI by changing 3 variables in the config. That ability to reroute without retraining is what separates a harness from a prompt.

## 🧪 The benchmark that proves it works (LangChain + Terminal Bench 2.0)

Let's go back to the data point from the beginning because it deserves to be dissected. LangChain documented in *"Improving Deep Agents with Harness Engineering"* the full recipe that took their `deepagents-cli` agent from position 30 to 5 on Terminal Bench 2.0 (89 tasks in ML, debugging, and biology) with the same model:

- **Model fixed:** `gpt-5.2-codex`
- **Baseline:** 52.8% with standard prompt + standard tools
- **Final:** 66.5% after the harness changes
- **Delta:** +13.7 points

The knobs they turned (and only those):

1. **System prompt** with explicit 4-phase guidance: *Planning & Discovery → Build → Verify → Fix*. Obsessive insistence on writing tests before calling anything done.
2. **New middleware:** `PreCompletionChecklistMiddleware` (intercepts the agent before exit and reminds it to verify against the spec) and `LoopDetectionMiddleware` (counts edits per file and, if they exceed N, injects *"consider reconsidering your approach"*).
3. **`LocalContextMiddleware`** that on startup maps `cwd`, parent dirs, finds binaries (Python, Node) and injects them into context. Result: the agent doesn't waste time discovering its own environment.
4. **Reasoning sandwich**: `xhigh` at the start (to understand the problem) → `high` or `medium` during the work → `xhigh` again at the end (to verify). Optimizes compute spend.

The most interesting thing is what they **didn't** do. They didn't change models. They didn't fine-tune. They didn't change providers. They didn't rewrite the algorithm. They changed **what was around the model**, and that was enough to climb 25 spots.

## 🗣️ The honest critique: is it just Platform Engineering in a new coat?

Not everyone is convinced. Stuart Miller published on May 8, 2026 in his Substack *["Harness Engineering? Why the AI Industry's Newest Buzzword is an Old Idea"](https://haverin.substack.com/p/what-is-harness-engineering-ai-hype)* an article that went viral on LinkedIn, and the thesis is direct:

> *"The 'thing' being described is not new. It is not even slightly new. When you look at what is being defined, it is the practice of building a sensible software environment around a moving part, and we have names for that. A lot of names, and most older than my favorite pair of shoes: Platform engineering. Middleware design. Site Reliability Engineering. Service-oriented architecture. Control plane design."*

Miller concedes an honest nuance: LLMs are **stochastic** (they don't give the same answer twice), and wrapping something stochastic in a disciplined environment is indeed a slightly different design problem from wrapping a deterministic microservice. But his conclusion is that **the principle** — putting discipline around an unreliable component so it produces repeatable results — is as old as the assembly line.

And he's partly right. The **principle** is old. What's new is:

1. The **scale of variability** of the wrapped component. A microservice with bugs is 99.9% reliable. An LLM with good temperature is 70% reliable on long tasks.
2. The **iteration speed** of the harness. In 2015, tuning a system's harness cost a sprint. In 2026, tuning an agent's harness costs a commit and a `/clear`.
3. The **direction of the discipline**: in SRE/Platform Engineering, the harness surrounds a system that can't be rewritten. In Harness Engineering, the harness also **writes and rewrites** the system (or part of it), because the agent is both tool and operator.

The constructive critique I'd add, as an indie: **don't get obsessed with the name.** Call it *agent infrastructure*, *agent ops*, *scaffolding* — whatever you want, the work is the same. What matters is that you do it. **An agent without a harness is an expensive hobby. An agent with a harness is an engineer.**

## 🛠️ What this means for your indie workflow

If you've been reading my articles for a while, you'll have noticed that I've spent a year building, without knowing it, a harness. The enumeration surprised me when I did it:

- **`AGENTS.md` in every repo** with rules born from real errors → [Agents.md as a standard](/blog/agents-md-standard) is exactly "Documentation" from pattern 3.
- **Curated skills** (kanban, write-blog, write-devlog, grill-me) loaded as procedural context → fits "Context & Memory" from Tunguz.
- **Hermes hook system** that intercepts destructive actions → "Restrictions" + "Verification" from patterns 1 and 2.
- **Durable cron jobs** that execute workers with persistent memory → "State & Persistence".
- **Telegram sandbox** so the user can approve sensitive operations → "Human-in-the-loop" as an inferential sensor.
- **Traces and logs of every session** in `~/.hermes/logs` → pure "Observability".
- **Context compression** with Headroom between the agent and the provider → the missing piece.
- **Task decomposition** with kanban into small workers with clean context → "Orchestration & Loop".
- **Memory stack** (Hipocampus, hmem, plugmem, PARA files) → "State & Persistence" with 4 different strategies.
- **Spec-driven workflows** (OpenSpec, Spec-Kitty, BMAD) → feed the `AGENTS.md` and skills with verifiable contracts.

Mapped point by point, **my setup is a textbook harness** — I just built it by reading real errors from my agents over a year, which is exactly the methodology Hashimoto describes in his Step 5. It's not theoretical. It's not marketing. It's the direct consequence of treating every error as a hole in the harness and patching it with a rule, a tool, or a hook.

The uncomfortable but useful lesson: **if you've been using agents seriously for more than 6 months, you already have a harness.** The question isn't "should I build one?" — it's **"am I iterating on it discipline by discipline, or am I patching holes with more prompts?"** If the answer is the second one, this post is for you.

## 📐 Minimum anatomy: 5 pieces for Monday

If I had to distill everything above into an actionable checklist for an indie starting next week, it would be this:

1. **Create an `AGENTS.md` at the root of the project**, with 5-10 rules that **come from real errors your agent made this week.** Nothing generic. Each line is your blood.
2. **Reduce the number of tools to the minimum** (the Vercel lesson). If you have more than 10, ask yourself which ones are redundant. A `bash` + flat filesystem often wins.
3. **Add ONE verification hook** — for example, a `validate.sh` that the agent runs before marking a task as done. Start with one. You'll add more later.
4. **Make the invisible visible**: traces from every session, structured logs, or at least a `tail -f` of the conversation. Without observability, debugging agents in production is witchcraft.
5. **Write ONE explicit exit condition**: "the reviewer can't iterate more than 2 rounds", "the agent can't edit the same file more than 5 times", "if verification fails 3 times, escalate to human". Exit conditions are the agent equivalent of the `for` loops with `break` that your 2015 self refused to write.

Five pieces. One week. More impact on agent autonomy than any fine-tuning or model upgrade you'll do this quarter.

## 🎓 Lessons learned (what I take away)

After two weeks reading everything published on the topic and mapping it against my own setup, here's what I know:

1. **The model commoditizes, the harness wins.** The LangChain benchmark is the empirical proof. In 12 months, gpt-5.2-codex will be gpt-6; the harness you wrote keeps working because it's model-agnostic.
2. **The harness is not the prompt.** The prompt is one piece of the harness. Confusing the two is why most "prompt engineers" never get to building a production agent. If your only job is writing prompts, you're doing 5% of the work.
3. **The error is the construction material.** Hashimoto is right: every line in a good `AGENTS.md` comes from a real error. If you don't accumulate errors and convert them into rules, you're not doing harness engineering, you're doing wishful thinking.
4. **Fewer tools, more power.** Vercel, LangChain, and Tunguz agree without having coordinated. Restraint generates capability. It's counter-intuitive until you try it.
5. **The name matters less than the practice.** Harness, scaffolding, agent infrastructure, agent ops... Call it X. The discipline is the same: serious engineering around a stochastic component.
6. **As an indie, you already have a harness — you just haven't documented it.** If you've been working with agents for a year, open your `AGENTS.md` and count how many of the 5 patterns you recognize. Probably 4 or 5. The work now is to document it and share it.

## 📚 Bibliography and references

### Primary sources (ordered by importance)
- **Mitchell Hashimoto — *"My AI Adoption Journey"*** (February 5, 2026). The origin of the term. Step 5, *"Engineer the Harness."* [`mitchellh.com/writing/my-ai-adoption-journey`](https://mitchellh.com/writing/my-ai-adoption-journey)
- **Vivek Trivedy (LangChain) — *"The Anatomy of an Agent Harness"*** (March 10, 2026). The canonical definition: `Agent = Model + Harness`. [`langchain.com/blog/the-anatomy-of-an-agent-harness`](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)
- **LangChain — *"Improving Deep Agents with Harness Engineering"*** (March 2026). The Terminal Bench 2.0 case study: +13.7 points by changing only the harness. [`langchain.com/blog/improving-deep-agents-with-harness-engineering`](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering)
- **Anthropic — *"Effective Harnesses for Long-Running Agents"*** (November 2025). The first formal use of the term in a frontier lab. [`anthropic.com/engineering/effective-harnesses-for-long-running-agents`](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **OpenAI — *"Harness engineering: leveraging Codex in an agent-first world"*** (February 11, 2026). 7 engineers, 1M LoC in 5 months, zero by hand. [`openai.com/blog/harness-engineering`](https://openai.com/blog/harness-engineering)

### Analysis and critique
- **Tomasz Tunguz — *"Harnessing AI / Software After AI"*** (May 2026). The mustang metaphor and the 7 components of "domestication". [`tomtunguz.com/harnessing-ai`](https://tomtunguz.com/harnessing-ai/)
- **Simon Willison — *"How coding agents work"*** (March 2026). The clearest technical definition: *"A coding agent is a piece of software that acts as a harness for an LLM."* [`simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work`](https://simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work/)
- **Addy Osmani — *"Agent Harness Engineering"*** (April 2026). The product-engineering angle. [`addyosmani.com/blog/agent-harness-engineering`](https://addyosmani.com/blog/agent-harness-engineering/)
- **Martin Fowler — *"Agent Harnesses: Guides and Sensors"*** (April 2026). The formal taxonomy: computational vs inferential. [`martinfowler.com/articles/exploring-gen-ai/harnesses.html`](https://martinfowler.com/articles/exploring-gen-ai/harnesses.html)
- **Nicolas Neira — *"Harness Engineering: Why Claude, GPT and Gemini No Longer Matter"*** (2026). The chronology of the 3 eras and the 5 patterns. [`nicolasneira.com/en/harness-engineering`](https://nicolasneira.com/en/harness-engineering/)
- **Andrej Karpathy — *"Agentic Engineering"*** (Sequoia AI Ascent, April 2026). The death of vibe coding.
- **Stuart Miller — *"Harness Engineering? Why the AI Industry's Newest Buzzword is an Old Idea"*** (Substack, May 8, 2026). The most honest critique: platform engineering with new clothes. [`haverin.substack.com/p/what-is-harness-engineering-ai-hype`](https://haverin.substack.com/p/what-is-harness-engineering-ai-hype)

### Community threads worth reading
- **Hacker News — *"Harness engineering: Leveraging Codex in an agent-first world"*** (123 points, February 2026). [`news.ycombinator.com/item?id=48416264`](https://news.ycombinator.com/item?id=48416264)
- **Hacker News — *"Harness Engineering: 52 Days, One Person, 965K Lines of Code"*** (March 2026). AgentsMesh case: 600 commits, 365k LoC in production. [`news.ycombinator.com/item?id=47372903`](https://news.ycombinator.com/item?id=47372903)
- **Hacker News — *"Building agents without harness engineering"*** (June 2026). The thread that questions adoption: *"I read this twice and didn't fully understand what it was telling me."* [`news.ycombinator.com/item?id=48493447`](https://news.ycombinator.com/item?id=48493447)
- **r/ArtificialInteligence — *"Harness Engineering: Turning AI Agents Into Reliable Engineers"*** (April 2026). [`reddit.com/r/ArtificialInteligence/comments/1sc3m1t`](https://www.reddit.com/r/ArtificialInteligence/comments/1sc3m1t/harness_engineering_turning_ai_agents_into/)
- **r/theprimeagen — *"wtf is Harness Engineer & why is it important"*** (April 2026). The best line: *"Use deterministic logic and only use LLMs when they are required."* [`reddit.com/r/theprimeagen/comments/1sx738w`](https://www.reddit.com/r/theprimeagen/comments/1sx738w/wtf_is_harness_engineer_why_is_it_important/)
- **r/Trae_ai — *"The Definitive Guide to Harness Engineering"*** (April 2026). [`reddit.com/r/Trae_ai/comments/1sti4jx`](https://www.reddit.com/r/Trae_ai/comments/1sti4jx/the_definitive_guide_to_harness_engineering_what/)

### Related reading on this blog
- [Effective Context for AI in Android: the art of clear communication](/blog/effective-context-ai) — era 2 (Context Engineering) explained for Android.
- [GSD Core: the anti-ceremony framework for context engineering](/blog/gsd-core-context-engineering) — a concrete harness for Claude Code.
- [Headroom: the compression layer your agent stack needs](/blog/headroom-compression-layer) — "Verification" + "Context & Memory" in production.
- [Agents.md as an open standard](/blog/agents-md-standard) — the "Documentation" piece of pattern 3.
- [Persistent Memory for AI Agents: Practical Guide](/blog/ai-agent-memory-persistence-guide) — the "State & Persistence" piece in four strategies.
- [Complete AI Agent Stack 2026](/blog/complete-beginners-guide-ai-agents-stack-2026) — the catalog of tools that fit in a harness.
- [Superpowers Deep Dive: the most complete skills framework](/blog/superpowers-deep-dive) — skills as harness pieces.
- [OpenSpec in Mobile Development: spec-driven without theater](/blog/openspec-mobile-development) — feed the `AGENTS.md` with verifiable specs.
- [Alternative Paradigms in AI-Assisted Software Engineering](/blog/alternative-paradigms-ai-software-engineering) — the broader philosophical context.
- [Production-Ready Agentic Frameworks: 6 Strategies](/blog/production-agentic-frameworks) — frameworks that already implement part of the harness.
- [Spec-Driven Development with Agentic AI](/blog/spec-driven-development-ai) — specs as input to the harness.

---

Hashimoto's post closes with an image that's stuck with me: *"I literally did the work twice. I'd do the work manually, and then I'd fight an agent to produce identical results."* It's the opposite image to Karpathy's "vibe coding." It's **harness engineering in its most honest form**: you do the work by hand, you see where the agent fails, and you build the guardrail that prevents that failure forever. It's not glamorous. It's not viral. But it's what separates a demo agent from one that produces real software at 3 AM while you sleep.

If you read this far and your `AGENTS.md` has fewer than 10 lines, you have homework for Monday. If it has more than 100, you're probably over-documenting instead of iterating. The sweet spot, as always, is iterating real errors one by one until the harness stops being noticed and starts feeling like part of the model. That's the moment you won.
