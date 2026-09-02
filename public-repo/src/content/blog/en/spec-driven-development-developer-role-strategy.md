---
title: "Spec-Driven Development: The Developer Role Redefined"
description: "How Spec-Driven Development flips the developer from typist to architect of intent. Inside the 40-60% waste map, the three maturity levels, and the Spec-as-Source role shift that ends vibe coding."
pubDate: 2026-08-11
lastmod: 2026-08-11
author: "ArceApps"
heroImage: "/images/spec-driven-development-developer-role-strategy-en.svg"
tags: ["SDD", "Spec-Driven Development", "AI", "Developer Experience", "Architecture", "Workflow", "Indie Dev"]
keywords: ["Spec-Driven Development", "SDD", "Spec-as-Source", "developer role", "AI coding workflow", "vibe coding hangover", "Birgitta Böckeler", "Thoughtworks"]
canonical: "https://arceapps.com/blog/spec-driven-development-developer-role-strategy/"
reference_id: "578cf6ee-a1c0-453e-ba68-51748b52d115"
---

> **Foundation reading:** [Spec-Driven Development with Agentic AI](/blog/spec-driven-development-ai) · [The Socratic Agent Series Part 2: SDD and Sycophancy](/blog/socratic-agents-part-2-sdd-sycophancy) · [SDD Frameworks Deep Dive](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad) · ["Grill Me" vs Socratic Method vs Spec-Driven Dev](/blog/grill-me-sdd-adversarial-workflow-comparison)

> **Sister article (ES):** [SDD: Implicaciones Estratégicas y Evolución del Rol del Desarrollador](/es/blog/spec-driven-development-developer-role-strategy/)

The blog already has deep coverage of what Spec-Driven Development *is* and which *frameworks* implement it — Spec Kit, OpenSpec, BMAD, Kiro, Superpowers, all of them. The two Socratic-Agent parts dissect how SDD fights AI sycophancy, and the Grill-Me comparison pits SDD against adversarial prompting. What this post covers instead is the **third axis**: what happens to *you* — the human at the keyboard — once SDD is no longer a methodology you evaluate but the operating model you live inside. The angle that is conspicuously absent in the existing posts: how your *role* changes, where the 40–60% of technical waste actually hides, and what "Spec-as-Source" demands of the indie dev who has nobody to delegate to.

## The hangover nobody admits to

I keep coming back to a passage William Collins published in March 2026, because it captures the moment the industry is in with surgical honesty:

> "Fast forward a few months. You try to add a feature to what you built. Or a teammate asks you to walk them through it. Or, worst of all, something breaks in production at 2AM and you're staring at 3,000 lines of AI-generated code you've never read — that's the hangover."
>
> — William Collins, *Vibe Coding Got Us Here. Can Spec-Driven Development Save Us?* (wcollins.io, March 2026)

Andrej Karpathy coined "vibe coding" in February 2025. Four and a half million views. Eighteen months later, the hangover is real. The numbers are not kind:

| What we measured | What we found | Who measured it |
| --- | --- | --- |
| AI-generated code with security vulnerabilities | 45% | Veracode 2025 |
| Java AI code failure rate | 70%+ | Veracode 2025 |
| XSS vulnerability rate vs. human-written code | 2.74× higher | CodeRabbit Dec 2025 |
| XSS protection failure rate in AI code | 86% | Veracode 2025 |
| Experienced devs *slower* with AI tools | 19% slower | METR RCT Jul 2025 |
| How much faster devs *believed* they were | 24% faster | METR RCT Jul 2025 |
| Code duplication increase (2020–2024) | ~4× | GitClear |
| Outstanding technical debt (current estimates) | $1.5 trillion | Analyst estimates |

The METR line deserves a second read. A randomized controlled trial — not a survey, not vibes, an actual RCT with experienced open-source developers — found that those developers were **19% slower** with AI tools while simultaneously *believing* they were 24% faster. That is a 43-point gap between perception and reality. We are not just writing more code; we are writing more code that we *think is good* but is, empirically, not.

Spec-Driven Development is not the only response to this gap. But it is the one that attacks the *root cause*: the lack of a persistent, machine-readable source of truth that survives between sessions, between tools, between the dozens of small iterations that compose an AI-assisted feature.

## What "the developer's role changed" actually means

Liu Shangqi, Technology Director APAC at Thoughtworks, put the shift in one sentence in December 2025:

> "The spec-as-source posture requires fundamental role redefinition, not a tooling change."
>
> — Liu Shangqi (Thoughtworks), quoted via Augment Code, "8 Best AI Tools for Spec-Driven Development"

That line is load-bearing. *Tooling change* is what most articles about SDD cover: install Spec Kit, run `specify init`, let the agent scaffold a constitution file. *Role redefinition* is what this article is about, because tooling without role change produces the 43-point METR gap in a slightly more structured jacket.

Concretely, the role shifts across four axes. They are not sequential steps; they are dimensions that move in parallel:

![The four roles of a Spec-Driven developer: Architect, Validator, Orchestrator, Curator, all orbiting the spec as the single source of truth.](/images/spec-driven-development-developer-role-strategy-en.svg)

### 1. From typist to architect of intent

You stop writing functions and start writing contracts. The artifact that matters is no longer the `class` or the `use case` — it is the OpenAPI document, the JSON Schema, the AsyncAPI spec, the Protobuf IDL. Whatever the formalism, the spec captures: inputs, outputs, invariants, edge cases, non-functional constraints, and acceptance criteria. You write these *before* the implementation exists. The implementation is what gets generated.

This is not new. Network engineers have written RFCs before any packet hits the wire for forty years. YANG models define device configurations before a single CLI command runs. gRPC teams ship `.proto` files before any service is implemented. Infrastructure has always been spec-first. What changes with SDD is that **the consumer of the spec is no longer a human with a backlog — it is an AI agent with no durable memory between sessions**. That makes the spec's precision load-bearing in a way it never was when humans were the only readers.

### 2. From author to validator of generated code

In the Vibe Coding world, you read diffs. In SDD, you read *compliance reports*. The question is not "does this code look right to me" but "does this generated code satisfy the constraints my spec defined?". That is a different cognitive task: pattern-matching against a contract rather than against an instinct. It is also why the role is not "reviewer" — you are not approving someone else's PR, you are verifying that a deterministic process produced a deterministic output. Veracode reports that 86% of AI code fails at XSS protection. The reason is not that the AI is dumb — it is that the prompt didn't carry the constraint. SDD moves the constraint from prompt to spec, where it cannot be forgotten.

### 3. From solo contributor to orchestrator of agentic flows

A single chat session with one AI model is no longer the unit of work. SDD-anchored projects typically compose:

- A planning model that interprets the spec and breaks it into tasks.
- An implementation model that writes code against a single task.
- A verification model that runs tests, linters, and contract checks.
- A reviewer model (often adversarial — see the Socratic Agent series) that challenges the design.
- A documentation model that keeps the spec and the wiki in sync.

You stop being the bottleneck that types the code and become the integrator that decides which model gets which job. The METR 19%-slower result disappears in this composition, because each agent operates on a tightly scoped task instead of an unbounded "build me an app" prompt.

### 4. From owner to curator of spec drift

This is the role that nobody talks about, and it is the one that determines whether SDD survives past week three. A spec that does not get updated becomes a lie. A lie that the agent reads with confidence produces confidently-wrong code. So the developer in an SDD operating model spends a non-trivial fraction of their time doing *spec maintenance*: when the implementation reveals an edge case the spec did not anticipate, the spec gets updated *first*, then the code gets regenerated. This is the inverse of the traditional flow, and it is the source of the most common complaint about SDD in the wild.

A senior Java developer with five years of experience, posting on r/ExperiencedDevs in February 2026, summarized the failure mode that happens when this role is skipped:

> "Initially it seemed great (I did it in steps), but it quickly went the other way around. In the end I got a ton of code, and when mistakes appeared, after indicating how to fix them, it kept failing and failing while destroying other functionalities... Because of the monstrosity of code it generated for not such a big feature, I decided to write it by hand and basically use AI for very tiny tasks."
>
> — FooBarBuzzBoom, r/ExperiencedDevs, "Spec Driven Development and other shitty stuff" (Feb 2026)

That is the anti-pattern. The fix is not "use a better model" — it is to update the spec first and regenerate, instead of patching generated code by hand. Once you start patching the output, you are in Spec-first mode at best; you cannot be in Spec-as-Source. The role of curator is what makes the difference.

## The three maturity levels (Böckeler's framework)

Birgitta Böckeler, Distinguished Engineer at Thoughtworks, defined the maturity levels that have become the de facto vocabulary for talking about SDD adoption. I am reproducing them here because every other framework I have seen either reduces to or refines these three:

![Three maturity levels: Spec-first (low commitment), Spec-anchored (living document), Spec-as-Source (full role redefinition).](/images/infographic-boeckeler-maturity-en.svg)

### Level 1 — Spec-first

You write the spec, then implement from it. The spec is a reference. Both the spec and the code can change independently; you update whichever is faster or clearer. Most "I tried SDD and it didn't work" stories end up here. It works, but it offers the least leverage because the cost of *keeping the spec and the code aligned* is entirely on you. If you only do this level, you have not changed your role much — you are still a typist who happens to write a doc first.

### Level 2 — Spec-anchored

You treat the spec as a living document. When requirements change, you update the spec, then regenerate or refactor the code. The spec becomes the source of truth for *intent*, while the code remains the source of truth for *what the system currently does*. This is where most production teams should land. It accepts a small amount of dual maintenance in exchange for staying close to brownfield reality — you do not have to make every spec field machine-executable; you only have to make it precise enough to drive regeneration.

OpenSpec is explicitly designed for this level. Thoughtworks added OpenSpec to their Technology Radar in April 2026 specifically because it focuses on *spec deltas* rather than full upfront specifications, which suits brownfield codebases where a complete spec is impractical.

### Level 3 — Spec-as-Source

The spec is the *only* artifact a human edits. The code is generated from it, always. There is no concept of "patching the generated output" — if the code is wrong, the spec is wrong. This is the level that delivers the 40-60% waste reduction and that demands the full role redefinition. It is also the level that breaks most teams, because the spec must be **100% executable** — no escape hatches, no "TODO: agent fills this in later" lines.

You can see the maturity gradient as a measure of *human distance from the code*:

- **Spec-first**: humans edit spec + code interchangeably. Low formal commitment.
- **Spec-anchored**: humans edit spec freely; agents regenerate code from it. Living document.
- **Spec-as-Source**: humans edit spec only; agents regenerate everything. Total redefinition of the role.

The maturity level you can sustain in practice depends less on tooling and more on the discipline of the curator role. Most projects I see collapse back to Level 1 within a quarter because nobody maintains the spec once the implementation "works".

## The 40–60% technical waste map

Where, exactly, does the 40-60% of waste go? The post title promised a number and the body has to deliver. After cross-referencing Veracode's 2025 security reports, METR's RCT, GitClear's code duplication tracking, and the operational complaints that surface in r/AI_Agents and r/ExperiencedDevs, four buckets cover almost all of the wastage:

![Waste map: four categories where the 40-60% reduction happens — re-derivation, drift, rework, review tax.](/images/infographic-waste-map-en.svg)

### Bucket 1 — Re-derivation cost

Every new agent session starts from zero. If your intent lives in chat history, it dies with the session. The cost of re-explaining the architecture, the constraints, the naming conventions, the testing strategy, and the edge cases to every new session is enormous and invisible. Teams that switch to SDD typically eliminate 40–60% of this re-derivation cost because the spec carries the intent and the agent reads it on session start. The savings show up not in throughput but in *consistency*: every agent session starts from the same ground truth.

### Bucket 2 — Drift

Liu Shangqi called this out directly: "Spec drift and hallucination are inherently difficult to avoid. We still need highly deterministic CI/CD practices to ensure software quality and safeguard our architectures." The point is not that drift goes to zero with SDD — it does not. The point is that with SDD, drift has a *direction*: when code and spec diverge, the fix is to update the spec, not to patch the code. Without SDD, drift has no direction; you patch whichever file is easier, and the spec becomes fiction within weeks.

### Bucket 3 — Rework cascade

The r/ExperiencedDevs developer quoted above hit this exactly: "it kept failing and failing while destroying other functionalities." That is the cascade. The AI generates a fix, the fix breaks the function next door, the developer (or another AI pass) fixes that, which breaks a third function. With SDD, the spec constrains the regeneration target, so the cascade typically terminates at the contract boundary instead of rippling through the codebase.

### Bucket 4 — Review tax

Reading 3,000 lines of AI-generated code you did not write is cognitively more expensive than writing 300 lines yourself. This is a non-obvious cost that the "10× productivity" hype never mentions. With SDD, the review target is the spec-compliance report and the diff against the contract — a much smaller surface. The 19%-slower METR result, I would argue, comes largely from teams that did not adopt SDD and therefore pay the full review tax on every AI-generated change.

I will be cautious with the headline number. The 40–60% reduction is not a universal constant; it is what you see in teams that move from unstructured vibe-coding to a disciplined SDD workflow *and* maintain the curator role. Teams that adopt SDD tooling without role change see much smaller gains — and frequently report worse results, because the spec maintenance overhead without the regeneration discipline is pure tax.

## The critical angle: what the critics get right

SDD is not a free lunch. Reading the skeptical sources honestly is part of the strategist's job, so here is what the critics get right.

### The "specs go stale" problem

A Reddit thread titled *"What spec-driven development gets wrong"* puts the failure mode bluntly:

> "Spec-driven development (SDD) suffers from the same fatal flaw as every documentation-first approach: specs are documents, and documents go stale because nobody rewards the invisible maintenance work of keeping them current."
>
> — r/vibecoding, May 2026

This is the curator role problem again, but stated from outside the SDD community. The rebuttal is not "we have tooling that prevents staleness"; tooling alone does not solve it. The rebuttal is "the developer role must explicitly include spec maintenance as a billable, rewarded activity, not as invisible overhead." That is a *management* answer, not a tooling answer, and most SDD articles skip it.

### The "specs encode confusion" problem

Another thread, from r/programming in February 2026:

> "The irony of the current AI-driven push toward 'spec-driven development' is that people think the spec replaces the need to understand the domain. It doesn't — it just encodes your understanding."
>
> — r/programming, February 2026

This is a serious critique. SDD does not replace domain expertise; it *crystallizes* whatever domain expertise you have (or do not have) into a document. If your understanding of the problem is wrong, the spec will be wrong, and the generated code will be wrong with much higher confidence than the vibe-coded version. SDD rewards depth of thought, not speed of typing. Teams that adopt SDD expecting it to compensate for shallow analysis will be deeply disappointed.

### The "specs become information slop at scale" problem

A comment in r/AI_Agents in July 2026 captured the scaling failure mode:

> "Sure you can keep asking the AI to resolve those constantly, but 1) that's costly, maybe not a problem now, will it be a problem later? 2) AI's resolution isn't consistent, sometimes you need 2-3 passes before the disparities are all addressed — it's like fitting a conditional random field, the bigger the field, the more passes you need to go through to 'settle' the model."
>
> — u/treble-maker123, r/AI_Agents, July 2026

That is the "codebase diffusion" critique — at sufficient scale, the spec itself becomes a complex artifact that needs reconciliation across versions, and the cost of keeping it consistent exceeds the savings. The mitigation is to keep specs as *small* and *composable* as possible — OpenSpec's "spec deltas" design is one answer, GitHub Spec Kit's separation between constitution and feature specs is another. But the critique holds: there is a scale at which SDD stops paying off, and that scale is lower than the hype suggests.

### The Thoughtworks internal debate

Liu Shangqi's December 2025 post included a notable internal debate at Thoughtworks:

> "At the more radical end of the spectrum, there's an argument that we can now discard code and treat specs as the sole source of truth that needs maintenance. In this view, code is a kind of byproduct, an intermediate product between requirements and compiled binaries. In contrast, more old-school technologists — like me — believe specs are merely elements that drive code generation, as it does in test-driven development. Executable code remains the source of truth you need to maintain."

This is the SDD community arguing with itself about whether Spec-as-Source is real or aspirational. The honest answer is: it works for *bounded* domains (APIs, schemas, infrastructure) and falls apart for *unbounded* ones (novel algorithms, exploratory UI, anything where the spec itself is being discovered through implementation). Choosing the right level of commitment per project is a strategic judgment, not a default.

## What this looks like for an indie dev

The blog's editorial line is "indie dev / solopreneur", so let me translate the strategy into concrete terms for somebody working alone on a side project. The corporate "you'll need a spec team" framing does not apply.

### The realistic adoption path

- **Start at Spec-first.** Pick one feature. Write a one-page spec: what the inputs are, what the outputs are, what the failure modes look like. Have the agent implement it. Read the diff against the spec. That alone will catch more bugs than any amount of "carefully worded prompts".
- **Graduate to Spec-anchored for anything you will maintain longer than a month.** Add a `specs/` directory to the repo. Treat the spec file as a living document. Every time you change requirements, update the spec *first*, then regenerate.
- **Reach Spec-as-Source only where it is cheap.** APIs with OpenAPI definitions. Schemas with JSON Schema. Configurations with Terraform/Pulumi. Infrastructure with Ansible. These are domains where the spec formalism already exists, is mature, and is *designed* to be the source of truth. Trying to make Spec-as-Source work for a one-of-a-kind UI flow is a waste of your time.

### The honest cost-benefit

SDD's waste-reduction gains are real for the four buckets above, but they come with an upfront tax: the discipline of writing specs before code. For an indie dev shipping a weekend prototype, that tax is too high. For an indie dev shipping a SaaS that customers pay for, the tax is a bargain compared to the alternative of debugging 3,000 lines of AI-generated code at 2AM.

The decision is not "should I use SDD?" The decision is "for *this specific feature*, does the spec cost less than the re-derivation + drift + rework + review tax I would otherwise pay?". That is a feature-by-feature judgment call, not a methodology switch you flip globally.

### The role-redefinition, applied to one person

When you are alone, the four roles (architect, validator, orchestrator, curator) collapse into a single weekly schedule:

- **Monday morning**: architect. Plan the week's features. Update specs.
- **Mid-week**: orchestrator. Compose agent sessions around the specs.
- **End of day**: validator. Run the contract tests. Diff the generated code against the spec.
- **Friday afternoon**: curator. Review which specs drifted, fix them, archive the dead ones.

That is the realistic indie version of the role redefinition. It is not glamorous. It is, however, what stops the hangover.

## The strategic horizon

The industry is moving fast. A few signals worth tracking:

- **Thoughtworks Technology Radar (Nov 2025)**: SDD added as a recognized technique. Three interpretations explicitly catalogued.
- **Augment Code Cosmos (2026)**: enterprise multi-repo orchestration built around specs. Signals that large orgs believe the spec layer is durable infrastructure, not a passing trend.
- **Linux Foundation hosting Agent Skills Standard governance** (per William Collins, March 2026): the *companion* layer to specs — instruction files that constrain *how* the AI writes code, while specs constrain *what* the code must do. The two layers are converging.
- **Gartner forecast (via Augment Code, 2026)**: 90% of enterprise software engineers will use AI code assistants by 2028. The governance question — who maintains the specs, who reviews the compliance — becomes a C-level concern, not an engineering-team concern.

The strategic implication for an indie dev is not "adopt SDD or fall behind". It is *position yourself on the right side of the role redefinition*. The developers who thrive in the next five years will be the ones who treat specs as their primary artifact, code as their secondary artifact, and AI agents as the team they orchestrate. The developers who cling to "I am the one who writes the code" will find themselves competing against teams of agents that produce more, faster, with fewer security vulnerabilities.

## Practical checklist before you adopt

Five questions to answer before moving a project to SDD:

1. **Is this domain spec-friendly?** APIs, schemas, infrastructure, BDD-style feature specs → yes. Novel algorithms, exploratory UI, one-off scripts → probably no.
2. **Can I name the spec formalism?** OpenAPI, JSON Schema, AsyncAPI, Protobuf, Terraform HCL, Cucumber/Gherkin. If you cannot point at one, you do not have a spec, you have a wish.
3. **Who maintains the spec when the implementation reveals new edge cases?** If the answer is "nobody", do not adopt SDD. You will produce Spec-first artifacts and let them rot.
4. **What is the regeneration path?** OpenAPI Generator, JSON Schema codegen, terraform plan, Kiro's task executor. If there is no deterministic regeneration path, the spec is documentation, not a source.
5. **What is the test that proves the generated code matches the contract?** Without this, you have moved the review tax from "read the diff" to "trust the AI". Neither is good enough.

If you can answer all five, the role redefinition is worth the upfront cost. If you cannot, start with Spec-first on one feature and see whether the curator discipline actually fits your working style before scaling it.

## What I take from this (and what I am skeptical of)

I am convinced that the role redefinition is real and durable. The shift from typist to architect of intent is not hype — it is what the data (METR, Veracode, the operator complaints on Reddit) supports. The four-role decomposition (architect, validator, orchestrator, curator) is the cleanest mental model I have found for navigating the shift.

I remain skeptical of two claims that circulate in the SDD community:

1. **That SDD is "just" TDD for the AI era.** TDD's waste reduction is empirically validated at ~40% in industrial studies. SDD's waste reduction is plausible but not yet validated at the same level — the 40–60% number I cited is an extrapolation from component studies, not a meta-analysis. Treat it as a working hypothesis.
2. **That Spec-as-Source scales to all domains.** The "codebase diffusion" critique from r/AI_Agents is real. Spec-as-Source works for bounded, declarative domains (APIs, schemas, infra). For domains where the spec itself is being discovered through the implementation (novel algorithms, exploratory UX, research code), Spec-anchored or Spec-first is the honest ceiling.

The blog will keep returning to this question — *how do you know which level of SDD commitment is right for the feature in front of you?* — because that is the strategic call that no framework answers for you. Spec Kit, OpenSpec, BMAD, Kiro, Superpowers — they all assume you have already made the call. The role of the architect is to make it.

## Bibliography / Referencias

### Primary sources

- Liu Shangqi. "Spec-driven development: Unpacking one of 2025's key new AI-assisted engineering practices." *Thoughtworks Technology Insights*, December 4, 2025. https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices
- Molisha Shah. "8 Best AI Tools for Spec-Driven Development." *Augment Code Tools*, 2026. https://www.augmentcode.com/tools/best-ai-tools-for-spec-driven-development
- William Collins. "Vibe Coding Got Us Here. Can Spec-Driven Development Save Us?" *wcollins.io*, March 23, 2026. https://wcollins.io/posts/2026/from-vibes-to-specs/
- Leigh Griffin & Ray Carroll. "Spec Driven Development: When Architecture Becomes Executable." *InfoQ Architecture & Design*, January 12, 2026. https://www.infoq.com/articles/spec-driven-development/
- "Spec-driven development." *Wikipedia*. https://en.wikipedia.org/wiki/Spec-driven_development
- "Spec-driven development." *Thoughtworks Technology Radar*, November 5, 2025. https://www.thoughtworks.com/radar/techniques/spec-driven-development

### Critical / community voices

- u/FooBarBuzzBoom. "Spec Driven Development and other shitty stuff." r/ExperiencedDevs, February 2026. https://www.reddit.com/r/ExperiencedDevs/comments/1reiro1/spec_driven_development_and_other_shitty_stuff/
- u/almeynman. "Why do spec-driven development?" r/AI_Agents, June 2026. https://www.reddit.com/r/AI_Agents/comments/1ug186i/why_do_specdriven_development/
- r/vibecoding. "What spec-driven development gets wrong." May 2026. https://www.reddit.com/r/vibecoding/comments/1t78bm5/what_specdriven_development_gets_wrong/
- r/programming. "Spec-driven development doesn't work if you're too confused to write the spec." February 2026. https://www.reddit.com/r/programming/comments/1r0s9za/specdriven_development_doesnt_work_if_youre_too/
- u/treble-maker123. Comment in r/AI_Agents, "Why do spec-driven development?", July 2026.

### Empirical studies cited

- Veracode. *2025 GenAI Code Security Report*. 45% AI code with security vulnerabilities; 70%+ Java AI code failure rate; 86% XSS protection failure.
- METR. *Randomized Controlled Trial: Impact of AI on Developer Productivity*. July 2025. 19% slower with AI tools; 24% perceived faster.
- CodeRabbit. *State of AI Code Quality Report*, December 2025. 2.74× XSS vulnerability rate vs. human-written code.
- GitClear. *Code Quality Research: 2020–2024*. ~4× code duplication increase.

### Prior art in this blog

- [Spec-Driven Development with Agentic AI](/blog/spec-driven-development-ai) — the foundational definition and taxonomy.
- [The Socratic Agent Series (Part 2): SDD and Sycophancy](/blog/socratic-agents-part-2-sdd-sycophancy) — how SDD fights AI compliance in CI pipelines.
- ["Grill Me" vs Socratic Method vs Spec-Driven Dev](/blog/grill-me-sdd-adversarial-workflow-comparison) — the philosophical tension between honoring the spec and challenging it.
- [SDD Frameworks Deep Dive: Spec Kit, OpenSpec, BMAD](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad) — the tool-level comparison.
- [Intent-Driven Development with FORGE and AISpec](/blog/intent-driven-development-forge-aispec) — a complementary intent-first methodology.
- [Spec Kitty](/blog/spec-kitty-mobile-development) — a CLI workflow that turns product intent into a repeatable agent loop.
- [OpenSpec for Mobile Development](/blog/openspec-mobile-development) — applying SDD to Android and Kotlin brownfield projects.

---

*The SDD ecosystem is moving fast. If you find a source that should be in this bibliography — a study I missed, a counter-argument I did not address, a framework I overlooked — drop it in the comments or send it my way. The role redefinition is real, but the conversation about it is far from settled.*
