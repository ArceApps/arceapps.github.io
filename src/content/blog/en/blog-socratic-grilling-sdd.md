---
title: "Socratic Grilling Meets Spec-Driven Development: Can They Actually Coexist?"
description: "Matt Pocock's /grill-me skill forces adversarial alignment before coding. SDD frameworks enforce architectural contracts. We test whether these two philosophies can actually work together in a single workflow — and where they genuinely conflict."
pubDate: 2026-05-20
heroImage: "/images/blog-socratic-grilling-sdd.svg"
tags: ["SDD", "AI", "Socratic Method", "Spec-Driven Development", "mattpocock", "Prompt Engineering", "Skills"]
reference_id: "c8a2f3d5-7e1b-4c9d-8f0a-3e6b9d2c1a0d"
related_posts:
  - blog-mattpocock-skills
  - blog-socratic-method-prompts-kotlin-android
  - blog-sdd-frameworks-analysis-spec-kit-openspec-bmad
  - socratic-agents-part-2-sdd-sycophancy
---

## Two Different Answers to the Same Problem

If you've read our articles on [mattpocock/skills](/blog/blog-mattpocock-skills) and the [Socratic Method for breaking LLM sycophancy](/blog/blog-socratic-method-prompts-kotlin-android), you might have noticed something uncomfortable: they both claim to solve the misalignment problem, but they solve it in completely opposite ways.

Socratic prompting says: change the model's internal optimization target so it actively hunts for flaws before answering. The system prompt is rewritten to make the model adversarial toward the user — not to be mean, but because a model that agrees with you is useless if what you want is actually wrong.

Spec-Driven Development says: build an external artifact (a SPEC.md, a contract) that the model must respect before generating code. The model's job is to follow the spec, not to challenge it.

Skills (mattpocock) says something different again: the agent should *interview you* before doing anything, updating a shared glossary as decisions crystallize. The agent's job is to understand your intent so thoroughly that the implementation follows naturally.

These are three distinct philosophies. And you probably have a gut feeling about which one is right. I want to complicate that gut feeling.

## The Philosophical Difference in Detail

Let's be precise about what each approach assumes:

**Socratic prompting** assumes the *user* has the correct intent and the *model* is the source of risk. The model wants to please; you need to make it adversarial. The fix is prompt-level (system prompt modifications, anti-sycophancy guardrails).

The mechanism is mathematical: RLHF optimizes models to maximize user satisfaction scores. In a chat interface, satisfaction correlates strongly with validation and quick confidence. This is not a personality trait — it's a loss function. You can't "tell it to stop" without changing the optimization target directly in the system prompt. That's why vague instructions like "be more critical" don't work reliably. You need structural changes: prohibited phrases, required flaw-surfacing, output format constraints that prevent softening.

**SDD** assumes the *model* has a reasonable default but lacks persistent context about your project. The fix is artifact-level: a SPEC.md that survives the session, externalized so the model reads it every time.

The insight here is about *context persistence*. A chat conversation is ephemeral — the model only sees what was in the last few messages. A SPEC.md is persistent — every session starts by reading it. This means SDD solves a different problem than Socratic prompting: not "how do I make the model adversarial" but "how do I give the model durable access to my architectural decisions."

**Skills' /grill-me** assumes the *conversation itself* is where misalignment happens. Neither party has fully resolved the design tree. The fix is conversational: keep asking questions until the tree is resolved.

The key insight from the grill-me skill is the "design tree" metaphor: every decision has dependencies, and you can't evaluate a decision correctly until you've evaluated the decisions it depends on. The skill enforces this by asking questions one at a time, following the tree, resolving each node before moving to its children.

The key difference in authority models: **Socratic prompting** treats the model as your adversary (with authority to challenge you). **SDD** treats the spec as the authority (the model's job is to follow it, not to challenge it). **Grilling** treats the *conversation* as the authority — which means both you and the model are accountable to it, and neither can escape by saying "the spec said so" or "you asked me to."

## Where They Actually Conflict

This is where it gets uncomfortable.

Socratic prompting, taken to its logical conclusion, means you should never let a model accept a spec at face value. Every spec should be challenged. The model's job is to find the flaws in your thinking before you commit to building the wrong thing.

But SDD frameworks explicitly require the opposite: the spec *is* the contract. You write it, you review it, you commit to it. Then the model generates code that must conform to it. The model doesn't get to challenge the spec — it gets to challenge the implementation against the spec.

These are genuinely incompatible in a strict sense. If you apply Socratic prompting principles to an SDD workflow, you end up not writing the spec until you've interrogated it into the ground. And if you apply SDD principles to Socratic prompting, you end up building an adversarial framework that respects whatever spec you wrote, even if the spec is wrong.

The real tension: Socratic prompting optimizes for *correct thinking*. SDD optimizes for *correct output relative to a stated intention*. These are different optimization targets, and they're not always aligned.

## Where They Genuinely Complement Each Other

That said — and this is the interesting part — the two approaches land on the same conclusion from different directions: both believe that alignment before generation is the critical investment.

Socratic prompting: before the model answers, it must surface its unstated assumptions and identify the single point of failure.

Grilling (which is the implementation of Socratic principles in Skills): before the model writes code, it must walk the design tree and resolve dependencies between decisions.

SDD: before the model generates, it must read the spec and verify the implementation conforms.

What this means in practice: Socratic prompting is the *pre-spec* phase. It ensures your spec is not built on unstated assumptions. SDD is the *post-spec* phase. It ensures the implementation conforms to what you decided.

The workflow looks like this:

```
User has a vague intent
    ↓
Socratic grilling (/grill-me) → refined intent, resolved design tree
    ↓
Spec written (or updated) based on resolved decisions
    ↓
SDD enforcement (Spec Kit / OpenSpec / or just discipline)
    ↓
Code generated against spec
    ↓
Socratic evaluation (the adversarial prompt checks: does this actually meet the spec?)
```

Notice that Socratic prompting appears *twice*: once as a pre-spec forcing function, and once as a post-generation evaluation layer.

## The Phase-Aware Workflow Diagram

To make this concrete, here's how the phases map to specific tools:

```
INTENT FORMATION          →  /grill-me (Skills) or manual Socratic questioning
                                ↓
SPECIFICATION             →  SPEC.md (SDD) — now written from resolved decisions
                                ↓
GENERATION                →  Model reads spec, generates code, Socratic guardrails active
                                ↓
POST-GENERATION EVAL      →  Adversarial check: does this implementation actually meet the spec?
                                ↓
FAILURE (inevitable)      →  /diagnose (Skills) — 6-phase disciplined loop
                                ↓
ARCHITECTURE CLEANUP      →  /improve-codebase-architecture (Skills) — periodic anti-entropy
```

Notice what didn't appear: a monolithic pipeline. Each phase uses a different tool, appropriate to the phase's goal. The phase boundaries are where the authority model shifts: from "you vs the agent figuring out what to build" (grilling) to "the spec vs the implementation" (SDD) to "the model as adversarial evaluator" (Socratic post-gen) to "disciplined debugging" (diagnose).

## The Four-Phase Combined Workflow

Here's the integration I've found most useful in practice:

**Phase 1 — Grilling (Socratic pre-spec)**

Before you write a single line of spec, run a grilling session. The `/grill-me` skill (or manually, if you're not using Skills) walks the design tree. For each decision, it asks: what problem does this solve? What would make this decision wrong? What are the dependencies between this decision and others?

The output of this phase is not code — it's a list of resolved decisions. Some of them become the SPEC.md. Others get recorded as ADRs. The point is: you're not writing a spec from a position of uncertainty. You're writing a spec from a position of having been interrogated about your thinking.

**Phase 2 — Spec (SDD)**

Write the SPEC.md from the resolved decisions. This is where SDD frameworks kick in: the spec becomes the artifact that gates generation. The model reads it before writing any code. If you're using Spec Kit, the spec is treated as constitutional. If you're using OpenSpec, each change goes through a proposal process.

**Phase 3 — Generate with adversarial awareness (Socratic generation)**

When the model generates code, the system prompt includes the Socratic guardrails: identify the unstated assumption, surface the single point of failure, output findings as a risk table. The model is simultaneously following the spec and watching for spec violations.

The difference from pure Socratic prompting here is that the model has a reference document to check against — it's not just operating on vibes.

**Phase 4 — Diagnose (Skills' /diagnose)**

When something goes wrong — and it will — the `/diagnose` skill provides the disciplined debugging loop: build a feedback loop, reproduce, hypothesize, instrument, fix, regression-test. This is where the Socratic principle ("be adversarial toward the output") becomes operationalized as a concrete process.

## The Conflict You Can't Resolve

Despite all the complementarity above, there is one genuine conflict that doesn't resolve:

**Socratic prompting assumes the spec itself is the thing to be challenged. SDD assumes the spec is the thing to be honored.**

In a pure Socratic workflow, no spec is final. You surface the flaw, you update the spec, you regenerate. In a pure SDD workflow, the spec is final until a formal change process updates it.

The conflict is about *who has authority* to challenge the spec. In Socratic prompting, the model is an active adversary with authority to challenge anything — including the spec. In SDD, only the human (or a formal change process) can challenge the spec; the model's role is to enforce it, not to question it.

For complex systems where the cost of changing direction late is high, SDD's "spec is final" principle is correct. For early-stage exploration where you don't know what you don't know, Socratic prompting's "challenge everything" principle is correct.

The practical answer: use Socratic grilling during the pre-spec phase (when you're still figuring out what to build). Use SDD enforcement during the build phase (when you know what you're building and need to stay aligned). Use Socratic evaluation after generation (to catch what the spec missed).

## How Skills Fits In This Picture

Skills is interesting here because it's the only framework that explicitly combines grilling (pre-spec) with TDD (build) and diagnose (post-failure). It's not a pure SDD approach — it doesn't require a SPEC.md — but it's deeply compatible with SDD thinking.

Specifically:

- `/grill-me` and `/grill-with-docs` are the Socratic pre-spec phase
- `/tdd` enforces that code is generated in small, verifiable increments (the build phase, with or without a spec)
- `/diagnose` is the post-failure Socratic evaluation
- `/improve-codebase-architecture` is the periodic anti-entropy check

The thing Skills doesn't have is a *formal spec artifact* that gates generation. It relies on the grilling session to establish alignment, and the TDD loop to verify correctness. This works fine in many contexts — but for large teams or regulated environments where you need to demonstrate that the spec drove the implementation (not just that the code passes tests), you probably want something more formal.

## The Diagnose Skill Is Socratic in Disguise

One thing worth noting: the `/diagnose` skill from mattpocock/skills is, structurally, the most Socratic thing in the entire Skills repo — even though it doesn't market itself that way.

Phase 1 (build a feedback loop) is the phenomenological stage: understand the bug before theorizing about it. Phase 3 (hypothesise) requires ranked hypotheses *before* testing — you can't just test the first plausible idea. Phase 4 (instrument) says change one variable at a time and tag every debug log. Phase 6 (post-mortem) requires documenting the correct hypothesis so the next debugger learns from it.

This is textbook Socratic method: structured self-correction with explicit evidence requirements. The diagnostic loop doesn't trust the first explanation. It forces a ranked list. It demands falsifiability before testing.

What makes it more useful than a raw Socratic prompt is that `/diagnose` has process — it tells you *when* to do each thing (build loop → reproduce → hypothesize → instrument → fix → regression → cleanup), not just *what* to think. The Socratic method in its pure form leaves the sequencing to the practitioner. Diagnose supplies the sequencing.

This is why `/diagnose` pairs so well with SDD: when the spec has been enforced and the code was still wrong, you need disciplined debugging, not more alignment. The spec did its job. Now you need the process to find the actual bug.

## The Real Answer: They're for Different Risk Profiles

The reason these frameworks exist and none has won completely is that they're solving different risk profiles:

**Socratic prompting**: best when the cost of building the wrong thing is high and the cost of taking time to think is low. If you're building a system where a mistake means data corruption, safety violation, or significant rework — you want adversarial evaluation before anything else.

**SDD**: best when the cost of misalignment between team members is high and the implementation will be worked on by multiple people over time. The spec is a communication artifact, not just a constraint for the model.

**Skills** (grilling approach): best when you're working solo or with a small team and want lightweight structure without formal artifacts. The glossary emerges from the work rather than being pre-planned.

None of these is universally right. The honest answer is that you probably want all three, used in the right phase:

- Grill before spec
- Spec to align the team and constrain the model
- Grilling evaluation after generation
- Diagnose when something breaks

The workflow isn't "use Socratic prompting or use SDD." It's "use Socratic prompting to make your specs better, then use SDD to ensure your implementation matches your refined intent."

## A Concrete Integration Example

Let's say you're building an Android offline-first architecture. Without Socratic + SDD integration, you might do this:

1. Describe the app to Claude
2. Ask "does this look good?"
3. Claude says "yes, great approach!" (sycophancy)
4. You start building, hit issues with offline sync that you didn't anticipate

With Socratic + SDD integration:

1. Run `/grill-me` on the architecture proposal
2. The agent asks: "what happens when the user goes offline mid-transaction?", "how do you handle a conflict when the server state disagrees with local state?", "what's your recovery strategy if the sync job is interrupted?"
3. These questions expose flaws in the architecture proposal
4. You resolve them — this produces better design decisions
5. You write the SPEC.md from the resolved decisions (including the offline conflict resolution strategy)
6. You generate code against the spec
7. The Socratic evaluation layer checks: does this implementation actually handle offline conflict as specified?
8. If something breaks, `/diagnose` kicks in

The difference: in the first workflow, the model's sycophancy lets architectural flaws survive into implementation. In the second workflow, the grilling phase finds them before they're committed to.

## Why No Framework Solves This Completely

The reason these three approaches exist separately — and the reason a unified solution hasn't emerged — is that they optimize for different things and those things are genuinely in tension.

Socratic prompting optimizes for *correct thinking* before generation. It says: if you haven't challenged your assumptions, you're not ready. The failure mode it prevents is building the wrong thing because you never questioned the spec.

SDD optimizes for *correct output relative to stated intent*. It says: once you've decided something, enforce it consistently. The failure mode it prevents is drift — where the implementation slowly diverges from what you meant because there's no persistent reference.

Skills' grilling optimizes for *conversation-quality* before commitment. It says: keep asking until there's nothing left to ask. The failure mode it prevents is partial understanding — where both parties think they're aligned but are actually talking about different things.

These are all legitimate failure modes. And they genuinely conflict at the boundaries:

- If you apply Socratic "challenge everything" to the build phase, you never ship anything — every implementation decision gets re-litigated
- If you apply SDD's "spec is final" to the pre-spec phase, you commit to a design before it's been challenged — which is exactly the failure mode Socratic prompting was designed to prevent
- If you apply grilling's "keep asking" mindset to a situation where the spec is already formal and locked, you're not using the right tool for the phase

This is why the phase-aware workflow is the honest answer. Each methodology has a legitimate use case. The mistake is applying any single methodology across all phases.

The frameworks that have tried to be a single solution to all phases — BMAD, GSD (Just Ship It), full-stack SDD — all end up either forcing a pipeline that doesn't fit all situations, or being so lightweight that they don't enforce anything at the boundaries.

## The Verdict on Coexistence

Socratic prompting and SDD can coexist. They can even be genuinely complementary. But they require you to be clear about *when* each approach applies:

- **Socratic grilling** is for pre-spec: when your intent is still forming and you need adversarial questioning to find the flaws
- **SDD** is for build: when you've committed to a direction and need discipline to stay aligned
- **Socratic evaluation** is for post-generation: when you need a second check that the implementation matches the spec and the spec is sound

What you cannot do is apply Socratic prompting's "challenge everything" mindset to the spec *during* the build phase — that's how you end up never finishing anything. And you cannot apply SDD's "honor the spec" mindset to the pre-spec phase — that's how you commit to a flawed architecture because you never challenged it.

The framework that handles this best, in my reading, is mattpocock/skills — specifically because it has dedicated skills for each phase: `/grill-me` for pre-spec, `/tdd` for build, `/diagnose` for post-failure. The design is explicitly phase-aware.

Pure SDD frameworks (Spec Kit, OpenSpec) don't have an equivalent to grilling — they assume the spec is correct going in. Socratic prompting frameworks don't have a good story for formal spec enforcement during build.

The combined approach — Socratic pre-spec + SDD during build + Socratic post-generation + diagnose on failure — is more robust than any single methodology. It's also more complex, which is why most people default to one approach and miss the benefits of the others.

## References

- [mattpocock/skills](/blog/blog-mattpocock-skills) — the composable skills approach
- [Socratic Method Prompts: Breaking AI Sycophancy](/blog/blog-socratic-method-prompts-kotlin-android) — the four-component Socratic prompt anatomy
- [SDD Frameworks Comparison](/blog/blog-sdd-frameworks-analysis-spec-kit-openspec-bmad) — Spec Kit, OpenSpec, and BMAD
- [Socratic Agents Part 2: SDD and Sycophancy](/blog/blog-socratic-agents-part-2-sdd-sycophancy) — the relationship between adversarial prompting and SDD
- [/diagnose skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnose/SKILL.md) — the six-phase disciplined debugging loop
- [/grill-me skill](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md) — the alignment-before-coding session