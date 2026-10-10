---
title: "SDD + TDD: From Requirements to Verifiable Tests"
description: "Learn how to combine SDD and TDD with coding agents: lightweight specifications, acceptance criteria, Red-Green-Refactor and CI-backed evidence."
pubDate: 2026-10-08
lastmod: 2026-10-10
author: "ArceApps"
keywords: ["SDD", "TDD", "Spec-Driven Development", "Test-Driven Development", "acceptance criteria", "coding agents", "CI"]
canonical: "https://arceapps.com/blog/sdd-tdd-acceptance-loop/"
heroImage: "/images/sdd-tdd-acceptance-loop.svg"
tags: ["SDD", "TDD", "Testing", "AI Agents", "Software Engineering", "Indie Dev"]
reference_id: "9bbde137-a863-41ca-987f-a9480363516d"
---

> **Earlier ArceApps reading:** the blog already covers [spec-driven development](/blog/spec-driven-development-ai/), [AI-assisted TDD in Android](/blog/ia-tdd-android/) and [adversarial clarification for agentic workflows](/blog/grill-me-sdd-adversarial-workflow-comparison/). This time, instead of introducing another acronym, we will connect them through **one small, testable feature**.

![SDD and TDD infographic: feature development from intent to verified evidence](/images/sdd-tdd-acceptance-loop-infographic-en.svg)

## The specification nobody executes and the test nobody questions

There are two very effective ways to fool ourselves while programming with AI agents. One is to write an impressive specification, ask the model to implement it, and treat a large diff plus a confident explanation as evidence that the requirements were satisfied. The other is to let the agent choose an implementation first, then generate unit tests for its existing decisions and celebrate a green test suite.

Both approaches can produce valid, carefully formatted code that solves the wrong problem. A specification is not an executable test, and a test cannot establish that unspoken requirements were correct. This is why a simple chain has attracted renewed attention: **specification → acceptance criteria → TDD → implementation → verification**.

An [October discussion in r/ClaudeCode](https://www.reddit.com/r/ClaudeCode/comments/1wza2ur/has_anyone_actually_combined_tdd/) captured the difference neatly. SDD addresses whether we are building the intended behavior; TDD guides how we implement that behavior; acceptance tests examine whether the visible outcome matches expectations. These are complementary questions, not three interchangeable labels for a larger prompt.

My preferred approach is modest. Preserve the intent outside a disappearing chat context, turn meaningful behaviors into executable checks, make at least one test fail for the right reason before changing the implementation, and demand evidence before merging. Sometimes that takes one paragraph and two tests. Sometimes it deserves a more substantial contract because data, permissions or money are involved.

The point is to reduce uncertainty, not to manufacture process artifacts.

## Why SDD and TDD complement one another

SDD defines the contract: who needs the feature, what behavior they expect, what must never happen and which outcomes would establish success. A good requirement should generally survive a change in implementation language or architecture. "Retrying the same attempt must not consume another credit" is product behavior. "Store the request IDs in a JavaScript Set" is a design choice.

TDD operates closer to the code. We begin with an observation that is not yet satisfied, write a test that exposes it (**Red**), introduce the smallest working implementation (**Green**) and improve the structure without changing observable behavior (**Refactor**). With an AI agent, the external test is particularly useful: persuasive prose does not change a failing assertion.

They can also interfere with each other. A specification that dictates every internal class removes legitimate implementation choices. A test suite that mirrors those internal choices becomes fragile and difficult to refactor. Conversely, a vague acceptance statement such as "the experience should feel smooth" supplies no usable test oracle.

I separate three levels: user need, observable outcome and implementation mechanism. Decisions at the third level should be motivated by the first two or by existing project constraints. This keeps the agent from inventing architecture that makes its own task easier but the project harder to maintain.

Good SDD and good TDD do not require more paperwork. They create a shorter and more trustworthy path between what someone asked for and what the repository can demonstrate.

## Our running example: three attempts per day

Consider an intentionally synthetic feature unrelated to any production ArceApps repository. A small application offers **three daily attempts**. Every request has a unique identifier. If a network retry repeats the same identifier, the system must not charge twice. When the calendar advances to the next logical day, the allowance resets. Requests for earlier days should be refused.

At first this looks like a counter decrement. Then the ambiguities emerge. Who decides which calendar day applies? What happens when the client times out after the server has already accepted a request? Can the counter become negative? What if the client supplies February 30? Can two concurrent requests read the same remaining balance?

For the exercise we deliberately limit the scope to a pure state-transition function in Node.js. It receives an existing state and a request, then returns a new state with an outcome. No database, HTTP server or distributed scheduler is included. That makes the rules testable without pretending to solve storage or concurrency.

The key requirement is idempotency. In real networks, an operation can succeed even when the response never reaches the caller. Retrying with the same request identifier should be recognized, not charged again. This belongs in the specification before deciding which collection or database index will hold the identifiers.

By framing the scope clearly, we also make our eventual claim of success appropriately narrow. We can verify domain behavior without asserting that the entire production system is reliable.

## Step 1: write a contract before touching implementation

The goal fits in a paragraph: "Allow up to three accepted actions per logical day while ensuring a network retry cannot consume an additional attempt." From a user's perspective, it does not matter whether the implementation uses an array, a Set or a database. It matters that their remaining credits are correct.

We can now derive observable requirements. **R1** accepts a new request while credit remains. **R2** recognizes an already-seen identifier without charging again. **R3** prevents the remaining count from becoming negative. **R4** resets credit when the day advances. **R5** rejects earlier days. **R6** rejects blank request IDs and impossible calendar dates.

The contract also states its exclusions. This module does not authenticate users, calculate local time zones, persist state, enforce atomicity between processes or protect the database. We assume that an upstream layer provides an authoritative ISO logical date. Listing these boundaries is as important as declaring what the function does.

Our initial definition of done combines automated positive and negative cases, review of the diff for scope creep, and explicit documentation of uncovered risks. No implementation code is needed yet.

A short contract like this is more useful than an enormous document that mostly names internal objects. It leaves room for alternative designs while making the behavior difficult to misunderstand.

## Step 2: turn prose into a test oracle

An acceptance criterion should enable a decision about a particular observation. Given a starting state with three credits and no recorded requests, a new identifier must return two credits and an **accepted** outcome. Repeating that identifier must return **duplicate** without changing the remaining count.

Once the allowance is exhausted, another new identifier must return **exhausted** and leave the count at zero. On a later logical day, the initial allowance should be restored and then consumed by the new request. An earlier day produces a range error; malformed inputs produce a type error.

Notice that the response to a duplicate requires a product decision. Some APIs return the original successful response to make retries indistinguishable. Our illustrative domain function deliberately returns a separate **duplicate** outcome. It is a documented choice, not the one correct solution for every system.

This is where lightweight traceability helps. Every important requirement should have at least one testable example, and every important test should protect a meaningful requirement or relevant invariant. We do not need an enterprise traceability database to connect six rules to seven tests.

A specification that cannot lead to a failing observation is still incomplete. A test that protects only a convenient implementation detail may be unnecessary even when it passes.

## Step 3: the first test must fail for the right reason

Node's built-in test runner is enough for this exercise. We create **quota.test.mjs** and import the behavior we want to implement. The first test protects a straightforward state transition:

~~~js
import test from 'node:test';
import assert from 'node:assert/strict';
import { recordAttempt } from './quota.mjs';

const start = { day: '2026-10-08', remaining: 3, seen: [] };

test('accepts first attempt and uses one credit', () => {
  const result = recordAttempt(start, {
    day: '2026-10-08',
    requestId: 'req-1'
  });

  assert.equal(result.outcome, 'accepted');
  assert.equal(result.state.remaining, 2);
  assert.deepEqual(start.seen, []);
});
~~~

The third assertion is not an aesthetic preference. It verifies that the input state was not silently mutated. Pure transitions are easier to compare, replay and reason about when retries appear elsewhere in a larger application.

Before implementing the function, run the test. It should fail because the desired behavior does not yet exist. If it is already green because the agent accidentally imported another module or wrote an assertion that cannot fail, we have gained little confidence. Red is evidence that the test protects something specific.

That principle becomes even more important when agents write both implementation and tests. We want tests that can contradict the implementation, not a mutually agreeable story produced by one model.

## Step 4: implement the smallest explicit transition

Below is the core of the implementation used for this article. It checks inputs, distinguishes the current day from a later one, recognizes repeated requests and decrements only when credit remains.

~~~js
export function recordAttempt(state, request) {
  const iso = request.day;
  const epoch = typeof iso === 'string'
    ? Date.parse(`${iso}T00:00:00Z`)
    : NaN;
  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    && Number.isFinite(epoch)
    && new Date(epoch).toISOString().slice(0, 10) === iso;

  if (!validDay || !request.requestId?.trim()) {
    throw new TypeError('Invalid request');
  }
  if (request.day < state.day) throw new RangeError('Stale day');

  const current = request.day === state.day
    ? state
    : { day: request.day, remaining: 3, seen: [] };

  if (current.seen.includes(request.requestId)) {
    return { state: current, outcome: 'duplicate' };
  }
  if (current.remaining === 0) {
    return { state: current, outcome: 'exhausted' };
  }
  return {
    state: {
      ...current,
      remaining: current.remaining - 1,
      seen: [...current.seen, request.requestId],
    },
    outcome: 'accepted',
  };
}
~~~

This function intentionally lacks clever architecture. There are no generic repositories, factories, domain-event buses or abstraction layers invented for a few lines of business logic. The contract does not justify them.

That modesty is useful. A short path between a rule and its resulting state makes future code review, debugging and maintenance more reliable. When the requirements later demand persistence or concurrency controls, we can add the needed layer with new tests rather than pretending it was necessary from the start.

## Step 5: seven tests and a genuine red-green cycle

I executed this synthetic example locally using **Node.js 22.16.0** and **node --test**. The initial suite had six tests: a successful first request, an idempotent retry, exhausted allowance, next-day reset, stale-day rejection and malformed input rejection. Then I added a seventh case: an impossible date, **2026-02-30**, must be treated as invalid input and result in **TypeError**.

The original date validation checked only a regular-expression pattern. The new test failed. More specifically, an invalid calendar day was accepted far enough that comparing it with an earlier state produced **RangeError**, rather than the required **TypeError**. This was a real and informative failure: syntactically plausible is not the same as calendar-valid.

The correction checked that parsing the candidate date and converting it back to a canonical ISO date produced the exact original string. That catches normalization of nonexistent dates into later legitimate dates. After the change, the suite reported **seven passing tests, zero failures**.

This is a verified run of a standalone teaching example, not a claim about CI in any production repository. That distinction is important. A credible technical article should describe exactly which code was exercised and under what conditions.

The red-green loop is useful evidence because we know which behavior was missing, what the wrong output was and what changed to satisfy the contract. Merely writing "we applied TDD" after generating implementation and tests would not offer the same assurance.

## How an AI agent can make a failing test green for the wrong reason

Suppose we tell a coding agent, "Fix the February 30 test." A tempting shortcut is to change the assertion so that it accepts the **RangeError** already produced by the flawed implementation. Every test turns green, but the product contract has been rewritten to endorse the bug.

This is not a far-fetched concern. Agents optimize for whatever completion signal their workflow supplies. If passing tests are the only signal, editing a test may appear as legitimate progress unless the requirements and review boundary say otherwise.

The defense is to establish and review acceptance criteria before the implementation becomes convenient. A model can challenge a contradiction in the specification, but it should surface the proposed change as a decision. It should not silently redefine success to match existing output.

Mocks create a related problem. A test that merely checks whether a fake dependency was called may never verify the visible result that matters to the user. Test doubles are valuable for isolating difficult dependencies, but they can also hide missing behavior when overused.

When reviewing AI-written tests, I ask two questions: what incorrect implementation would this assertion detect, and could the assertion pass while the user-facing behavior is still wrong? Those questions are more informative than a large coverage number.

## Refactoring is not permission to build an abstraction cathedral

TDD's third phase improves internal design while preserving all previously tested behavior. An agent may use this moment to introduce a series of abstractions, registries and generic interfaces. Sometimes that is helpful, but in a small domain function it can make the code harder to follow.

For instance, extracting an **isValidDay** helper would be reasonable if several modules share calendar validation. If this is the only consumer, the extraction may offer little benefit. The decision should rest on a real maintenance concern such as duplication, confusing names or unnecessary coupling.

After refactoring, run the complete relevant test suite again and inspect the diff. Tests do not automatically guarantee elegant design, performance, security or accessibility. They guard the behaviors we chose to specify. That is valuable but necessarily incomplete.

This is another point where SDD re-enters the discussion. An agent could produce code that passes all local tests while violating the repository's architectural constraints or introducing unrelated changes. Those constraints belong in the plan and code review, not solely in the function's assertions.

The healthiest workflow treats tests as evidence, requirements as direction and human review as a separate responsibility.

## The important limit our green tests do not solve: concurrency

The example now has seven green tests. Does that make it safe to deploy on a server handling several devices? **No.** It is a pure state transition applied sequentially to a state supplied by its caller. Two simultaneous requests could read the same previous balance, each decide it may spend a credit and later overwrite the other's result.

A production implementation would need atomicity at its persistence boundary: a database transaction, optimistic concurrency control, a conditional write or another mechanism with equivalent guarantees. Idempotency keys need durable storage and an appropriate uniqueness constraint; a local array does not enforce deduplication across restarts or multiple workers.

Calendar authority is another unsolved system-level concern. The sample trusts a logical day supplied by an external layer. A real application with users across time zones and daylight-saving changes must define what counts as "today" and who is allowed to make that decision.

These omissions are not reasons to dismiss the test. They are reasons to make the contract's scope precise. SDD describes the system-level behavior and its assumptions. TDD verifies a unit's behavior within those assumptions. Integration and system tests must later establish that the assumptions remain true under real operational conditions.

A green unit test is a bounded piece of evidence, not a certificate for an entire product.

## How I would delegate the sequence to a coding agent

I would structure the task around observable checkpoints. First, the agent reads the current repository, existing tests and GitHub Actions workflows. It locates reusable logic and identifies conflicting constraints. Next it drafts a short contract with positive and negative cases, edge behavior and explicit exclusions. Only then does it create the relevant failing tests.

The implementation step should remain as small as possible, with a visible diff after each meaningful change. The agent should report which test was red, why it failed, how the code changed, and what checks ran afterward. If CI already executes a build and test suite, there is little value in adding another parallel script that duplicates those checks.

Before merging, I would manually inspect concerns that tests do not capture well: accessibility, responsive layout, permissions or data exposure, depending on the feature. Not every change needs every kind of audit; the point is to select controls that correspond to actual risk.

An agent is most useful when it reduces the friction of doing these things without erasing the decision points. Automating a flawed workflow simply ships its mistakes faster.

The boundary between agent autonomy and product authority must remain explicit. The agent can recommend changes to the contract, but the code's acceptance criteria should never depend solely on its own declaration of success.

## When the full SDD ceremony costs more than it saves

We should take criticism seriously. In an [August thread on r/SpecDrivenDevelopment](https://www.reddit.com/r/SpecDrivenDevelopment/comments/1vubvmz/we_tried_specdriven_development_for_months_we/), a practitioner reported that months of using a complete propose-review-apply workflow had not convincingly improved their resulting code compared with well-scoped prompts. They also reported greater token use and longer completion times in their situation.

That is a community account, not a controlled experiment or definitive disproof of SDD. Still, it raises the right question: **which uncertainty are we paying to remove?** For a trivial label change or low-risk CSS adjustment, pages of documentation may add overhead without improving quality. For permissions, billing or database migrations, explicit edge cases and review can prevent costly mistakes.

I scale the process. A trivial change gets a clear purpose and the relevant existing check. A moderate feature gets a short contract, plan and tests. A high-risk change gets more explicit acceptance scenarios, architecture review and migration evidence. The number of tools installed does not determine the amount of process needed.

A methodology deserves to survive because it makes shipped software easier to verify and maintain—not because it creates attractive documentation. That is true of SDD, TDD and every fashionable agent orchestration framework.

The simplest version that reliably meets the need is usually a better starting point than the most comprehensive template.

## Spec Kit and the missing bridge between specifications and tests

The [official Spec Kit documentation](https://github.github.com/spec-kit/) describes workflows that move from intent and specification through planning, implementation and convergence. Its specification templates emphasize testable requirements, user scenarios and measurable success conditions. Those are compatible with TDD but do not automatically produce a useful red-green loop.

There are also community proposals for test-first presets and traceability artifacts, such as [issue #3502](https://github.com/github/spec-kit/issues/3502). The distinction matters: an open proposal is evidence of community interest, not proof that a feature is universally supported in a stable release.

For my lightweight workflow, I do not need an entire framework to keep the same principles. When the change warrants it, a concise plan file and task file preserve decisions; tests live with the source code; and CI acts as the reliable record of automated verification. If a check keeps paying for itself, it belongs in CI rather than being repeated manually.

The framework should adapt to the project's actual architecture and team size. A solo developer should not have to emulate a large organization simply to introduce one feature. The value is the visible link between a requirement and its evidence.

Tools come and go. A meaningful acceptance case and a trustworthy regression test usually outlive them.

## A practical definition of done

Before merging an agent-assisted change, I would verify five questions. Can each critical behavior be traced to a meaningful requirement? Did the relevant tests actually fail before the fix? Are important negative and edge cases represented? Does the diff respect the project's scope, security and architecture? Did the automated checks that already exist finish successfully?

A concise PR description can answer those questions by linking the contract, acceptance cases, test evidence and CI run. If a visual or manual check is still missing, it should be recorded as missing rather than invented as a pass.

Known limitations also need to remain visible. In our example, durable persistence and concurrency are not solved. Writing that down prevents the function from being reused under false assumptions and gives a clear path for a next iteration.

Definition of Done is not praise added at the end of an agent session. It is the threshold for deciding that a change deserves to remain in the main branch, even when the model has been enthusiastically declaring victory for half an hour.

The goal is an honest closure: which requirements were met, which evidence supports that decision, and which risks remain.

## Conclusion: versioned intent, executable behavior

SDD and TDD are not competing for the same job. SDD makes us express what matters and which boundaries we must respect. TDD provides a mechanism that can falsify our assumptions and guide small implementation steps. Review and CI add independent evidence that does not depend on how confidently an agent describes its own code.

The daily-attempt example is intentionally ordinary. That is why it is useful. A new test exposed an impossible calendar date, produced a real failure and drove a narrow correction. Afterward, all seven cases passed. That is the sort of concrete, repeatable engineering I value much more than declarations that an agent can implement any specification automatically.

Scale the process to the risk, not to the number of AI products installed. A short specification and one meaningful failing test can save more maintenance effort than a giant ceremony. When the software matters, success is not the model saying "done". It is being able to demonstrate why the feature meets its contract.

## Bibliography

- [GitHub Spec Kit official documentation](https://github.github.com/spec-kit/) — processes, requirements and verification.
- [Spec Kit specify template](https://github.com/github/spec-kit/blob/main/templates/commands/specify.md) — testable requirements and edge cases.
- [Spec Kit contributor testing guidance](https://github.com/github/spec-kit/blob/main/CONTRIBUTING.md) — positive/negative tests and regression cases.
- [Community proposal for a test-first preset](https://github.com/github/spec-kit/issues/3502) — evolving work, not a universally available capability.
- [SDD + TDD discussion on r/ClaudeCode](https://www.reddit.com/r/ClaudeCode/comments/1wza2ur/has_anyone_actually_combined_tdd/) — the debate motivating this workflow.
- [Critical SDD experience on Reddit](https://www.reddit.com/r/SpecDrivenDevelopment/comments/1vubvmz/we_tried_specdriven_development_for_months_we/) — a useful but non-experimental account.
- [ArceApps SDD foundation](/blog/spec-driven-development-ai/) and [AI + TDD for Android](/blog/ia-tdd-android/) — earlier coverage.

*The isolated teaching example was executed locally with Node.js 22.16.0 on October 10, 2026. October 8 is the editorial date for this series, not a claim of earlier live publication.*
