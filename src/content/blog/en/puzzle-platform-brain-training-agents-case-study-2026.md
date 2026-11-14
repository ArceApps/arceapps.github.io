---
title: "A Puzzle Platform Run by Agents: The Full Case Study"
description: "How PuzzleSuite, BrainSuite and its content hub would be built with OpenBot, Hermes Agent and Paperclip: nightly flows, agent roster, costs and failure modes."
pubDate: 2026-11-14
lastmod: 2026-11-14
author: "ArceApps"
keywords:
  - "AI agents case study"
  - "proactive agents"
  - "PuzzleSuite"
  - "brain training app"
  - "Hermes Agent"
  - "Paperclip"
  - "OpenBot"
canonical: "https://arceapps.com/blog/puzzle-platform-brain-training-agents-case-study-2026/"
heroImage: "/images/puzzle-platform-brain-training-agents-case-study-2026-en.svg"
tags: ["AI Agents", "Automation", "Android", "Case Study", "PuzzleSuite", "Indie Dev"]
category: ai-agents
reference_id: "c4b81d76-5e02-4a93-b7f8-1d9e6c2a8b40"
---

Every article about agent platforms shows you a terminal. You type a prompt, the agent edits three files, and a green checkmark appears. It is a good demo and a terrible description of the work.

The work is this: it is 02:00, nobody is awake, and a queue of things that should have happened today did not. Fourteen puzzle variants need to exist, each one solvable by logic and not by guessing. The tests that cover them need to pass. A pull request needs a second opinion that is not mine at that hour. A release needs to reach an internal track on Google Play without me clicking through a console. And in the morning I want one message that says what happened, not forty that say nothing did.

That is the real test of an agent platform. Not "can it write code", but "can it own a recurring process without becoming a second job".

This is the practical half of a comparison I published separately. If you want the mechanism-by-mechanism breakdown — who has webhooks, who has budgets, who wakes on a queue — read [OpenBot vs Hermes vs Paperclip: who wakes the agent?](/blog/openbot-vs-hermes-vs-paperclip-ai-agents-2026). Here I am going to build the thing.

## The product, and why it is a fair test

**PuzzleSuite** is a native Android app in Kotlin and Jetpack Compose that ships fourteen logic puzzles: Akari, Dominosa, Fillomino, Galaxias, Hashi, Hitori, Kakuro, Kenken, MathCrossword, Minesweeper, Queens, Shikaku, Slitherlink and Zip. MVVM with `StateFlow`, Hilt for injection, Room and DataStore for local state, Firebase Analytics/Crashlytics/Auth/Firestore, WorkManager for background work. `minSdk 26`, `targetSdk 36`, `compileSdk 37`, Gradle 9.4.1, JDK 21. Published on Google Play.

**BrainSuite** is the sibling app: daily exercises for memory, attention, processing speed and cognitive flexibility, with streaks and statistics.

**PuzzleHub** is the web side: landing pages, the blog you are reading, documentation, and the content backend where new puzzles and their metadata are generated.

The repo already runs a spec-driven flow — `docs/specai/` folders with five documents per feature, an `AGENTS.md` with contracts, per-agent prompt files under `agents/bots/` for the coding bot, Conventional Commits, `main`/`develop`/`feature/*` branches. That matters for this article: agent platforms fail hardest where process is missing. This project already has process. What it does not have is a night shift.

Why is it a fair test of proactivity? Because almost every flow has four properties that break naive automation:

1. **The output is verifiable but not obvious.** A puzzle is either uniquely solvable by logic or it is garbage, and "looks fine" is not a check.
2. **The work is periodic and boring.** Exactly the kind of thing a human stops doing in week three.
3. **It touches money and credentials.** Play Console, signing keys, API keys, a store listing.
4. **Mistakes are public.** A bug in a released puzzle is a one-star review with a screenshot.

## What actually has to happen without me

Six flows, in the order I would automate them. The ordering is not arbitrary: it goes from cheapest-and-safest to most-expensive-and-riskiest, and most people do it backwards.

| # | Flow | Cadence | Blast radius if it goes wrong |
|---|---|---|---|
| 1 | Nightly test suite + digest | Daily | None. It only reads |
| 2 | Puzzle generation + validation PR | Nightly | High if it merges bad content |
| 3 | PR review for content-only changes | On event | Medium: bad merge |
| 4 | Release train to Play internal track | Weekly | High: a broken build in public |
| 5 | BrainSuite daily-session content | Weekly | Medium: repetition, boring sets |
| 6 | Store listing, ASO and blog drafts | Weekly | Medium: claims you cannot back |

Flow 1 is the one to build first, every time. It is a test run, it costs almost nothing, and it proves the scheduler is alive. If a platform cannot do flow 1 quietly and correctly for a week, it will not do flow 2.

## The cast

Seven agents. Fewer than you think, and each one with a single owner for a single kind of output. In all three platforms the roster is roughly the same; what changes is where each agent lives and what wakes it.

| Agent | Job | Output | Must never do |
|---|---|---|---|
| `puzzle-smith` | Generate a new puzzle definition for one game type and size | JSON + a solvability report | Invent a rule variant without a spec |
| `puzzle-verifier` | Prove uniqueness and logical solvability | Pass/fail + metrics | Approve its own generation |
| `qa-runner` | Run unit, Room and Compose tests; triage failures | Digest + flaky list | Touch `app/src/main` |
| `release-captain` | Version bump, changelog, signed AAB, upload to internal track | Release + notes | Promote to production |
| `content-scribe` | BrainSuite session sets, store copy, blog drafts | Text + metadata | Make health or performance claims |
| `growth-analyst` | ASO keywords, listing experiments, blog performance | Proposal, not action | Publish anything |
| `support-triage` | Classify Play reviews and Crashlytics clusters | Labels + escalation | Reply to a user |

The rule that saves you: **the agent that generates is never the agent that approves.** It is cheap to enforce in Paperclip (review stage) and in Hermes (a different profile for review). In OpenBot it is a channel convention, and conventions decay — which is worth knowing before you rely on it.

## Flow 1 — 02:00, the digest that says nothing

The job: run `./gradlew testDebugUnitTest`, compare failures against yesterday, and report. If everything passed, say so in one line.

**With Hermes.** One cron job, pinned to a cheap model, with `--workdir` pointing at the repo so `AGENTS.md` and the Gradle wrapper are in scope:

```bash
hermes cron create "0 2 * * *" \
  "Run ./gradlew testDebugUnitTest. List only tests that failed and were
   passing yesterday; include the stack line that matters. If nothing
   changed, reply exactly: no changes. Do not summarise successes." \
  --workdir /home/me/Projects/PuzzleSuite \
  --name "nightly-tests" \
  --deliver telegram
```

Three things about this that matter more than the command. The prompt forbids summarising successes, because a digest that lists 1,214 passing tests is a digest nobody reads. The job is pinned to a cheap model, so the boring work does not run on the expensive one. And if the provider key expires, preflight validation marks the job `blocked_config` and sends **one** alert instead of failing forty times in a night.

**With Paperclip.** A routine with a schedule trigger (`0 2 * * *`), assigned to `qa-runner`, producing a task every night. The difference is not the schedule; it is that last night's digest is a task you can search, comment on, and cost-attribute. When the same flaky Room test fails three nights running, the third task can link the two previous ones, and a human can decide to quarantine it. Paperclip's default delivery policies — coalesce if a run is still active, skip missed schedules — are exactly what you want for a nightly job; a queue of six stale digests at 09:00 is worse than one.

**With OpenBot.** A routine on the `qa-runner` agent: *"Run `./gradlew testDebugUnitTest`; list failed tests and nothing else."* It fires at 02:00 in the agent's own thread, and the answer is in the app. On the desktop app this only works while the machine is on; on a hosted server, the server wakes shortly before the routine. If your Mac is asleep at 02:00 every night, you have built a flow that never runs, and you will not find out from a green checkmark.

**What I actually do:** flow 1 with a script and zero LLM. `no_agent` mode in Hermes, or a routine that runs a shell script in OpenBot, or a Paperclip routine assigned to an agent whose only job is to paste the script output. The model adds value on the *third* failure, not the first: "this is the same `IllegalStateException` as Tuesday, caused by the Room migration not registered in `AppDatabase`". Run the script nightly, and let the model be called only when the script says something is wrong.

## Flow 2 — the nightly puzzle that must not be plausible-looking garbage

This is the flow that justifies the whole exercise, and the one where a naive setup produces content that looks fine and is not.

A puzzle definition is data: grid size, region layout, clues, and the solution. The generator's job is to produce one. The verifier's job is to prove two properties:

1. **Uniqueness.** Exactly one solution exists.
2. **Logical solvability.** A human-style solver — constraint propagation, no backtracking, no guessing — reaches that solution.

Property 2 is the one people skip, and it is the one that decides whether a puzzle is fun or infuriating. A 12×12 Shikaku with a unique solution that requires a guess is not a puzzle; it is a coin flip with extra steps.

A validator contract that does the job, in the language I would actually write it:

```python
# tools/puzzlecheck/validate.py  (exit code 0 = publishable)
def check(spec: PuzzleSpec) -> Report:
    solutions = solve_all(spec, limit=2)          # stop at 2, we only need to know
    if len(solutions) != 1:
        return Report.fail("solutions", count=len(solutions))

    trace = logical_solver(spec)                   # propagation only
    if trace.required_guess:
        return Report.fail("guessing", at=trace.first_guess_cell)

    if not (spec.band.min_clues <= trace.clue_count <= spec.band.max_clues):
        return Report.fail("density", ratio=trace.density, band=spec.band)

    if trace.longest_chain < spec.band.min_chain:
        return Report.fail("trivial", chain=trace.longest_chain)   # too easy to be new

    return Report.ok(metrics=trace.metrics)
```

Note what this validator does *not* ask the model. The model generates candidates; Python decides. Everything after the generator is deterministic, which means the nightly flow can run unattended without a judge model improvising quality.

**With Hermes:** a cron job at 01:00 that creates one Kanban card per game type and size band, and lets the dispatcher work them in parallel. The card body carries the acceptance criteria and the command to run. The verifier is a *different profile*, so `kanban_request_review` is a real handoff and not the same agent approving itself:

```bash
hermes kanban create "Shikaku 12x12 — 20 candidates" \
  --assignee puzzle-smith \
  --body "Generate 20 candidates. Run tools/puzzlecheck. Keep only those
          with unique solution and no guessing. Open a PR with the
          survivors and the metrics table. Do not touch kotlin sources." \
  --completion-contract OWNER/PuzzleSuite
```

The completion contract is the part I would not give up: the card cannot close until the repository's own required checks pass on the exact head commit of the PR. Not "the agent says tests pass". The repo says so.

**With Paperclip:** a routine creates the task, assigns it to `puzzle-smith`, and the execution policy routes the close through `puzzle-verifier` (review stage) and, if you want, a human approval stage for the first month. The budget matters here: generating 20 candidates × 14 game types × 30 nights is a real token bill, and a hard stop at 100% with a per-run cost record is how you find out before the invoice does.

**With OpenBot:** a routine on `puzzle-smith` with a handoff to `puzzle-verifier` in a channel. The channel's one-owner-at-a-time rule makes the sequence legible; the Stop/Reassign controls make it recoverable. What it does not give you is a merge gate — the agents can agree the puzzle is good, and your branch protection is still the only thing between that agreement and `main`.

**What I would build first:** the validator, before the agent. If the validator is weak, a better agent just produces better-formatted garbage faster.

## Flow 3 — the pull request that reviews itself

Content PRs are a special case: they touch `assets/puzzles/*.json` and a test fixture, and nothing else. That is a category you can automate review for, with a hard rule:

> Auto-merge is allowed only when the diff is confined to `assets/puzzles/` and `app/src/test/resources/puzzles/`, CI is green, the validator report is attached, and no file under `app/src/main/` changed.

Anything that touches the solver, the domain model or the UI gets a human, always. The reason is not distrust of the agent; it is that a diff in `puzzle-solver` can make a hundred puzzles wrong in a way no unit test catches until a player finds it.

The three implementations differ in exactly one interesting way: **who cannot close the work.**

- **Paperclip** enforces it at runtime. The agent cannot transition the task to done without the required comment and, if configured, the review and approval stages. The review loop escalates to a human after three rounds of two agents disagreeing.
- **Hermes** enforces it at the board and the repository: a PR completion contract reads the branch protection rules and the exact-head check runs, and refuses completion without them. The review is a profile change, and `kanban_request_changes` is a first-class transition rather than a comment that gets ignored.
- **OpenBot** gives you the conversation and the controls. The review is a handoff with a message you can read; the gate is GitHub, not the app.

In practice, all three converge on the same architecture: **the repo is the source of truth, and the agent platform is the queue in front of it.** The platforms that make that explicit save you from building it.

## Flow 4 — the release train

The weekly job: bump the version, generate the changelog from Conventional Commits, build and sign the AAB, upload to the internal track, and post the notes.

The hard part is not the build. It is credentials.

Play Console access is a service account JSON with publish permission, signing keys live in a keystore, and both are the kind of secret that ends up in a screenshot. Each platform handles this differently, and the difference is a real selection criterion:

- **OpenBot** has a **Vault**: logins, cards and contact details stored on the computer, encrypted by the OS, with 1Password and Bitwarden integration. Agents can sign in and fill forms, but only see the card's name and last four digits, and the first card fill on each site needs approval. For a flow that clicks through a web console, this is the most human-shaped answer of the three.
- **Hermes** expects secrets in the environment (`.env`, config) and has a documented security model around tools and approvals. Uploading via the Play Developer API with a service account is the clean path; clicking through the console needs a browser tool and a login you have to supply.
- **Paperclip** gives routines their own **secrets**, scoped to the routine's task, plus connector-level access and an approval stage before the action that publishes.

My recommendation, regardless of platform: **do not automate the console. Automate the API.** `fastlane supply` or the Play Developer API against the internal track, with a service account that can only publish to that track. Then the agent's job is a version bump, a changelog and one command — and the credential it needs is boringly limited.

For the changelog, the guardrail is a rule the agent cannot argue with: every line must correspond to a commit hash in the range, and the summary must not describe anything that is not in the diff. That single rule kills 90% of the "improved performance and stability" fog that agents produce when asked to write release notes.

## Flow 5 — BrainSuite, where the guardrail is the product

BrainSuite needs a weekly set of daily sessions: which exercise, which parameters, which order, which difficulty curve. It is exactly the kind of content an agent is good at and exactly the kind where an agent can quietly do harm.

The architecture I would use is a **human-owned taxonomy with agent-filled slots**. A human defines the exercise catalogue and the difficulty bands once, in a document the agent reads. The agent fills the weekly slots from that catalogue and never invents an exercise. Two hard rules:

1. **No clinical or performance claims.** Nothing about percentages, IQ, memory improvement or "science-backed" unless a human cites the paper. This is where agent-generated marketing copy becomes a liability.
2. **No repetition within the band.** The set for week 12 cannot reuse the exact parameters of week 11; the validator checks it the same way it checks puzzles.

With Hermes, this is a cron job that loads a skill — `brainsuite-session-planning` — so the taxonomy and the rules travel with the job instead of living in the prompt. With Paperclip, it is a routine assigned to `content-scribe` with a review stage, so a human can approve the first four weeks and then sample. With OpenBot, it is a routine plus an instruction file in the agent's workspace, which is clean and works — and drifts the moment somebody edits the file locally without telling anyone.

## Flow 6 — growth, with the brakes on

ASO and blog drafts: keyword research, listing variants, article outlines, a post per week for the site. The value is real and the failure mode is embarrassing, because an agent writing marketing copy will invent numbers.

Three constraints I would encode in the prompt and in the review step:

- **Every claim links to a source.** A competitor's install count, a benchmark, a framework's behaviour: if it cannot be linked, it does not ship.
- **The agent proposes, the human publishes.** No exception. The publish action lives behind an approval stage (Paperclip), a separate step (Hermes), or a channel handoff (OpenBot).
- **No new articles about a tool without reading its docs.** The number of confidently wrong comparisons on the internet is proof that this rule is not obvious to models.

## The 04:12 incident

Here is the flow that decides whether you keep the system.

At 04:12, `puzzle-smith` finishes 20 candidates for a new Kakuro size. The verifier rejects 17: six have two solutions, eleven need a guess. The three survivors produce a PR. CI runs. The instrumented Compose test fails on an emulator that ran out of memory — not because of the puzzle, because of the machine.

What happens next is the product:

- **Hermes.** The worker's claim goes stale, the dispatcher reclaims it, the task returns to `ready`, and a new worker spawns with the comment thread as context. The PR completion contract blocks the card: required checks did not pass. One Telegram message tells me a card is blocked, with the failure classification. I read it with coffee and either fix the runner or unblock with a comment. Nothing was lost and nothing was retried in a loop.
- **Paperclip.** The run is a row with status and audit. The task stays assigned. If the agent's monthly budget is at 100%, the next retry does not happen at all until I raise the cap, which is a good thing at 04:12 and an annoying thing at 09:00, in that order. A stuck heartbeat has a documented debugging path instead of becoming folklore.
- **OpenBot.** The channel shows the failed handoff with the verifier's message. If the machine slept, nothing happened and the thread is exactly where I left it. The backup model may have moved an agent to another provider mid-run and left a note; that note is the difference between confusion and an explanation.

The lesson is always the same: **the escalation path is the feature.** Not the automation. The automation is table stakes; everyone can run a command at 02:00.

## Memory that compounds

If the system does not remember, you will re-explain difficulty bands every week like a manager who lost the wiki.

What each agent needs to know, concretely:

- The rule set of each of the 14 games, in the repo (`docs/puzzles/`), not in a prompt.
- The difficulty bands, with the clue-density ranges that were validated by the solver.
- The list of failure modes already found — the twelve ways a Fillomino candidate has been wrong before.
- The tone of the store listing, which is not the tone of the blog.
- What the last four releases broke.

With Hermes, this becomes a skill the agent writes and refines, and a memory file that survives across sessions:

```markdown
---
name: puzzle-difficulty-calibration
description: Use when generating or validating PuzzleSuite puzzle candidates.
---

## Bands (validated 2026-11, do not edit without re-running the solver)
- Shikaku 10x10: clues 9–14, longest logical chain >= 7
- Kakuro 12x12: givens 30–38% of cells, no chain >= 4 forcing a guess

## Reject on sight
- Two solutions (count with limit=2, never full enumeration)
- `required_guess` true anywhere in the propagation trace
- Clue density outside the band by more than 15%

## Known generator traps
- Fillomino: symmetric seeds produce mirrored duplicates; dedupe by canonical form.
- Hitori: adjacent-cell elimination makes puzzles trivially solvable; check chain length.
```

That file is worth more than any prompt improvement, and it is the thing Paperclip structurally does not give you per agent: Paperclip's unit of memory is the task and the company skill library, which is the right unit for a team and the wrong one for a specialist that needs to remember its own scars.

OpenBot sits in between: instructions and saved memories per agent, with limits, and an importer that can carry `MEMORY.md` and `USER.md` entries and custom skills from Hermes. If you are migrating, export first — the import is one-way.

## What it costs

Public list prices only, no quotes. Model spend dominates everything, and it depends on how often you let an agent think.

| Setup | Software | Models | Infra | Realistic monthly |
|---|---|---|---|---|
| Solo, laptop, Hermes self-hosted | $0 (MIT) | Existing ChatGPT/Claude plan, or API | $0 | 20–60 $ |
| Solo, laptop, OpenBot | $0 personal / €10 commercial Starter | Existing plans (Codex, Claude Code, Gemini) | $0 | 20–40 $ |
| Solo, always-on | $0 | API keys | Hermes Cloud from $20, or a €5–10 VPS | 40–120 $ |
| Solo, OpenBot hosted | €10 licence + | Existing plans | €20/$25 Starter hosted | 45–90 $ |
| Team of 3–5, Paperclip + Hermes | $0 (MIT) | API, budgeted per agent | €10–20 VPS, or your own Postgres | 150–500 $ |

Two honest notes. First, the team row is a range because budgets are the point: Paperclip's 80% warning exists precisely because a five-agent org with no cap can spend a month of a solo dev's budget in a weekend. Second, the cheapest configuration is not the one with the fewest tools; it is the one where the boring jobs run without a model. A nightly script in `no_agent` mode costs zero and catches most of what you actually care about.

## Build order, if I were starting on Monday

**Week 0 — the validator.** Write `tools/puzzlecheck`. Make it fail loudly. Add it to CI. No agent involved. This is the single highest-leverage week, because every later flow depends on a machine-checkable definition of "good puzzle".

**Week 1 — the digest.** Flow 1, no LLM. Prove the scheduler is alive for seven nights. If a platform cannot do this quietly, stop and pick another.

**Week 2 — generation with a gate.** `puzzle-smith` + `puzzle-verifier` as separate agents, PR per batch, auto-merge only for content-only diffs. Run it for two weeks before letting it merge anything.

**Week 3 — the release train.** Service account scoped to the internal track, `fastlane supply`, changelog generated from commits with the hash rule. Keep promotion to production manual for a month.

**Week 4 — BrainSuite and growth.** These are the ones where taste matters, so they go last and ship behind an approval step.

The order is deliberately anti-climactic. Every failed agent project I have seen started with the creative flow, because it is the fun one, and skipped the boring one that proves the plumbing.

## What I would not automate

- **The difficulty curve.** A solver can prove a puzzle is valid; it cannot tell you the set of ten is a good evening. That is taste, and it is the product.
- **Release notes voice.** Generating them from commits is fine. Letting the agent decide the tone is how you end up sounding like a different company every week.
- **Pricing and monetisation.** No agent should be able to change a price without a human reading the whole sentence it appears in.
- **Angry users.** Triage, yes. Replies, no. A canned empathetic answer to someone who lost their streak at level 300 is worse than silence.
- **Anything that edits its own guardrails.** A prompt file, a validator, a CI config, a skill that defines the rules: those diffs always need a human, and the agent should be told that explicitly rather than trusted to infer it.

## The stack I would actually run

For PuzzleSuite and BrainSuite with one developer and a mini PC that stays on:

**Hermes as the engine** — cron for the nightly jobs, a Kanban board for anything that needs a handoff or a review, skills for the puzzle domain, Telegram as the phone. Zero licence cost, and the memory is the part that compounds.

**OpenBot as the cockpit, optionally** — if you already pay for Claude and ChatGPT and you want a desktop app with native iPhone and Android clients, import your Hermes profiles and run the interactive work there. Keep the nightly queue in Hermes so there is exactly one owner of the schedule.

**Paperclip when the second human arrives** — not before. Its org chart, money budgets and runtime-enforced approvals are the correct answer to "three people and a shared card", and overkill for one person with a laptop. When it arrives, put Hermes inside it as the runtime and let Paperclip own budgets and sign-off.

And the one thing I would not do: run all three schedulers at once. Two systems that both believe they own the nightly job produce either nothing or double. Pick the queue owner, write it down, and make the other tools call into it.

## The honest summary

The agents did not make the product. The validator did. The agent just runs it at 02:00, twenty times, without complaining, and files the survivors in a pull request that a machine can refuse.

That is the whole trick, and it is why the platform choice matters less than the order you build it in: first the thing that can say no, then the thing that works while you sleep, then the interface you check with coffee.

If you want the mechanism-by-mechanism comparison behind these flows — webhooks, budgets, heartbeats, memory, licences — it is here: [OpenBot vs Hermes vs Paperclip: who wakes the agent?](/blog/openbot-vs-hermes-vs-paperclip-ai-agents-2026).
