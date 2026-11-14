---
title: "OpenCode and Claude Code: from task to pull request"
description: "Design a multiagent coding workflow: plan tasks, implement with OpenCode, review independently, verify with GitHub Actions, and prepare a safe PR."
pubDate: "2026-11-14"
lastmod: "2026-11-14"
author: "ArceApps"
keywords: ["OpenCode","Claude Code","multi-agent workflow","GitHub Actions","pull request","coding agents"]
canonical: "https://arceapps.com/blog/multi-provider-coding-agent-workflow/"
heroImage: "/images/multi-provider-coding-agent-workflow.webp"
tags: ["IA","Agentes","OpenCode","Claude Code","GitHub Actions"]
category: "ai-agents"
reference_id: "f6143393-a010-487a-99b2-116fcbe8fbd2"
---

> **“Agent orchestration without vendor lock-in” series, part 4 of 5.** Earlier posts separated [ChatGPT from the OpenCode executor](/blog/chatgpt-desktop-agent-orchestration/), explored [Claude Desktop as an MCP client](/blog/claude-desktop-external-coding-agents/), and compared [MCP, ACP, and A2A](/blog/mcp-acp-a2a-agent-protocols/). Now comes the awkward question: **what actually improves when work is delegated among different vendors' agents?**

## The experiment: from a bug to a reviewable PR

Instead of imagining an “AI team” with twenty roles, I will describe a small, verifiable workflow: investigate a bug, write acceptance criteria, implement a patch, request an independent review, and prepare a pull request. Our sample application is a website with a form that can be submitted twice rapidly, creating duplicate requests. The example is hypothetical and intended to describe a reproducible method. **This article does not claim that a real benchmark run or completed test repository exists.**

The goal is not to prove that ChatGPT beats Claude or vice versa. We want to learn whether separating responsibilities catches defects earlier, keeps changes focused, and creates a stronger audit trail than one long conversation. If coordination consumes more supervision than it saves, it is not worthwhile. Success means a PR another developer can inspect, not an enthusiastic narrative from the orchestration agent.

I would start with three roles only: **planner**, **implementer**, and **reviewer**. The planner can be ChatGPT or Claude Desktop according to capabilities and preferences. The implementer can be OpenCode using a model from OpenRouter. The reviewer can use Claude Code or another independent executor. These roles are not just model aliases: they have different access, context, outputs, and points of intervention.

## Define a work contract before launching agents

A request like “fix duplicate submissions” fails to specify what counts as duplicate, where the problem occurs, and which behaviors must remain intact. Before delegation, the planner should produce a minimal specification the implementer can follow without casually redefining the problem. This is not a lengthy process document; it is a set of checkable behaviors.

~~~yaml
task: prevent-duplicate-form-submit
repository: example-web
base: main
scope:
  - src/components/ContactForm.tsx
  - src/components/ContactForm.test.tsx
acceptance:
  - "A second click during an in-flight submission sends no extra request"
  - "A failed request allows another attempt"
  - "Keyboard and screen-reader interactions retain clear accessible state"
constraints:
  - "Do not edit secrets, dependencies, or workflows"
  - "Do not merge or deploy"
deliverables:
  - "minimal diff"
  - "tests and actual outcomes"
  - "remaining risks"
~~~

This is an **illustrative task contract**, not a schema required by a particular tool. The example repository and paths may not exist in your project. They must be adapted to real source code rather than copied blindly.

Defining scope also makes it obvious when the implementer discovers a root cause outside the expected files. It may propose a scope change, but should not silently expand its own authority. A convincing explanation from an agent is not permission to modify unrelated areas.

## Step one: branch isolation and a clean starting point

Two agents editing one branch in parallel are a recipe for conflicts that are hard to attribute. I would prefer one branch per unit of work and a dedicated workspace. Git's \`git worktree\` supports multiple working directories associated with one repository, avoiding the need for full additional clones. For truly parallel editing tasks, separate worktrees reduce interference, provided they use distinct branches.

~~~bash
git fetch origin
git switch main
git pull --ff-only
git worktree add -b fix/contact-submit ../example-web-fix main
cd ../example-web-fix
git status --short
~~~

These are orientation commands for a clean local repository. Any uncommitted user work must be identified before automation changes the tree. I would not use \`git reset --hard\` as a convenient automated way to make a branch clean. The coordinator should inspect state and refuse unsafe modifications until the user chooses a safe strategy.

Associate the task ID with repository, base commit, and branch. That lets the reviewer identify the precise diff and allows CI to validate a known revision. An agent that writes files without a Git reference leaves the human to reconstruct the most important context.

## Step two: the planner does not write code

I would give the planner access to the issue description and, if needed, read-only source excerpts. Its output should be acceptance criteria, risks, likely files, and the minimum verification plan. It should not modify the same repository as the implementer or execute commands merely to appear busy. A clearly defined role is more useful than an elaborate personality for each agent.

In the example, the planner must distinguish disabling the submit button in the user interface from preventing duplicates at the server. Disabling a button can improve UX, but if the API accepts repeated requests or the user refreshes the page, duplication may still occur. The contract must call out that limit. A frontend fix does not magically create backend idempotency.

Likewise, a component test may check that two clicks trigger one request, yet say nothing about whether the backend rejects duplicates. If the server is in scope, an integration test may be necessary. Making this distinction explicit helps the implementer know what proof is sufficient and what remains unaddressed.

## Step three: delegate implementation to OpenCode

I would use the orchestration service proposed in the first article. A \`create_task\` operation accepts an allowlisted project, branch, goal, change mode, and idempotency key. The bridge calls OpenCode through its documented server or SDK. If OpenCode uses OpenRouter, model selection belongs in the authorized executor configuration, not in unconstrained free-form chat text.

The handoff should contain the task contract, not the entire conversation history. Avoid transferring irrelevant context and private credentials. The bridge validates the branch, applies time limits, and stores a reference to the underlying session so results remain retrievable after the ChatGPT or Claude Desktop window closes.

~~~text
create_task(
  project_id = "example-web",
  branch = "fix/contact-submit",
  mode = "propose_patch",
  goal = "Meet the contract and produce a reviewable diff"
)
           |
        OpenCode
           |
       files + tests + diff
~~~

This is **orchestration pseudocode**, not a documented direct OpenCode function call. The real provider boundary remains its SDK or server. Keeping those levels separate prevents a vendor API update from forcing a redesign of the conversation and authorization model.

## Step four: inspect the diff before involving another agent

Before asking another model to review anything, obtain the Git diff and check which files changed. If the implementer touched secrets, workflows, dependencies, or files outside its approved scope, stop the process. An AI review does not replace validation of the changed surface.

~~~bash
git status --short
git diff --check
git diff --stat
git diff -- src/components/ContactForm.tsx src/components/ContactForm.test.tsx
~~~

\`git diff --check\` detects some whitespace errors; it is not a security audit or behavioral test. \`git diff --stat\` measures change volume, not quality. Automated tests are still necessary. If the agent already committed its work, compare against the base revision instead of assuming the working-tree \`git diff\` command will show committed changes.

Do not hand the reviewer only a summary written by the implementer. Provide the original contract, Git ref, diff, and test results. That prevents the first agent from selectively describing its own achievements and hiding uncomfortable details. Independent review needs evidence, not just another agent's narrative.

## Step five: review independently with Claude Code

The reviewer can be a separate agent such as Claude Code, but should be restricted to **reading and reporting findings**. Its question is “what may be wrong with this patch?” rather than “rewrite the feature however you prefer.” Ideally it reads a separate checkout or snapshot of the same commit, without write permissions to the implementer's branch.

The checklist should cover behavior, edge cases, accessibility, security, regressions, and test quality. A second provider may bring a different perspective, but can also reproduce the first agent's mistakes. Two agreeing model outputs do not mathematically prove correctness.

When the reviewer finds a defect, it should report a precise file location or context, impact, and a reproduction suggestion. The implementer gets a bounded follow-up task. I would cap review rounds; allowing two agents to debate endlessly burns time and tokens without a guarantee of better code.

## Step six: GitHub Actions is the verification authority

Once code is ready, the PR should pass the checks the repository already performs well. I would not redundantly run all the same tests manually because of habit. GitHub Actions can provide a common evidence layer: unit tests, build, lint, static analysis, or visual checks, depending on the project. The coordinator records actual workflow results rather than inferring success from “everything looks fine.”

~~~yaml
name: Verify proposed patch
on:
  pull_request:
    branches: [main]
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
~~~

This is a **simplified illustrative workflow**. It only fits a Node/pnpm project with the corresponding scripts. Reuse existing Actions in a real repository instead of adding redundant workflows. Any check requiring external services or secrets must respect GitHub Actions' security model; never expose credentials to untrusted PR code without an explicit review of that threat.

The rule is simple: a model response cannot turn a CI run green. Only the actual workflow result establishes the check outcome. CI itself does not cover everything; UX, real accessibility behavior, and possible disclosure of private information may need further review.

## Step seven: create the PR but keep merge separate

A useful PR explains the problem, the change, verification evidence, and remaining risks. It can link the issue and orchestrator task ID if those references contain no private data. Commits should remain legible and focused. A history full of tiny prompt-induced adjustments may not be as helpful as a clear, reviewed change set.

I would not auto-merge on the basis of another model saying “approved.” Require relevant checks, final diff inspection, and explicit publication authority. In repositories that deploy from \`main\`, merging a PR can mean publishing a website, releasing an app, or changing infrastructure.

After merge, the coordinator can check that the default branch contains the change and that deployment completed if it belongs to the task. Do not call the work finished before then. A high-quality open PR does not mean users are running the new version.

## Five decisions to leave with a human

I would not silently delegate scope expansion, credentials, financial costs, destructive operations, or merge authority. A human decides whether the fix may touch the backend, whether a new dependency is acceptable, whether extra model spend is justified, whether a file should be deleted, and whether to ship the change. The agent can assemble evidence and compare options, but decision authority must be explicit.

This does not mean annoying confirmations for every harmless step. Read-only analysis, local tests, and edits confined to a temporary branch can be preapproved. The trick is separating reversible actions from actions that publish data or cause irreversible loss.

For a solo developer, supervision should focus where it adds value. Approving each file read makes orchestration unbearable. Letting an agent modify \`main\` or delete a database without intervention is reckless. Balance comes from permission classes and technical enforcement, not vague promises from the model.

## Transfer evidence, not chat history

The big temptation in multiagent workflows is to pass every prior conversation to the next model “just in case.” That increases cost, latency, and privacy exposure while carrying old decisions that may no longer apply. I would hand over a compact package: goal, contract, Git version, relevant files, verified findings, unresolved questions, and artifact references.

~~~json
{
  "task_id": "task-042",
  "base_commit": "BASE_COMMIT_SHA",
  "branch": "fix/contact-submit",
  "acceptance": ["no duplicate requests", "retry after errors"],
  "artifacts": ["diff-ref", "test-report-ref"],
  "open_questions": ["backend idempotency out of scope"]
}
~~~

The example contains no private data and is not an official MCP or A2A schema. It belongs to the orchestration service, independent of how the different agents are invoked. Artifact references must still be authorized; knowing an ID should not grant another model access to arbitrary logs.

A careful handoff also helps review. The second agent sees the same facts as the first without being forced to trust the implementer's account of its own work. That may be more valuable than adding a third model without explicit boundaries.

## Avoid duplicate tasks and concurrent writes

A client request may be repeated after a timeout. The coordinator should use idempotency keys so “create one task” does not start two sessions on the same branch. It also needs a per-project or per-branch lock for write operations. The goal is not to serialize every task in the system, only to avoid conflicting concurrent writes.

Two reviewers can inspect the same commit in parallel because they only read. An implementer and reviewer sharing a mutable worktree create ambiguity. For a robust experiment, distinguish \`analysis\`, \`propose_patch\`, and \`review\` as modes with different permission policies.

Interrupted tasks may leave a process running or a half-written branch. Before retrying, reconcile the actual OpenCode session and Git status. Automatically repeating a mutation without checking previous side effects is an effective way to duplicate changes.

## Measure whether the coordination is worthwhile

Do not assume three agents always outperform one. Compare the multiagent workflow with one-agent execution on the same task, base repository, and acceptance criteria. Record total wall time, model calls, observed token spend, review rounds, defects found before CI, and corrections needed afterward.

A single example cannot prove universal superiority. Model behavior may vary between runs and repositories evolve. Record versions and preserve artifacts for comparison. A regression test that fails in one run and passes in another carries more evidence than several paragraphs praising the “synergy” of agent personalities.

Include human effort in the measurement too: time spent preparing the task, supervising agents, handling retries, and reviewing their work. If orchestration reduces API spend but costs an extra hour of human supervision, it may not be economical for a solo developer. Operational cost is larger than the model invoice.

## Risks that arrive before expected

The first risk is **unclear authority**. Can one agent change acceptance criteria written by another? I would say no without explicit review. The second is **context drift**: after multiple rounds, a small fix grows into a large refactor. The third is **superficial automated approval**: a reviewer returns “LGTM” without examining the diff.

The fourth risk is secret leakage when logs are transferred between providers. The fifth is reproducibility: without recording commit, dependency versions, executor version, and model, a future run may behave differently without an obvious explanation. The sixth is excessive permissions, especially with GitHub tools able to create branches, modify files, and merge code.

The useful response is to reduce the workflow to a few states and evidence artifacts. We do not need a hierarchy chart for agents. We need contracts. The planner defines, the implementer proposes, the reviewer questions, CI verifies, and the human decides to publish.

## Lessons and the final installment

The outcome I want is not total autonomy. It is **auditable delegation**. If I can see which agent acted, with which model, on which commit, what diff it left, which tests passed, and who approved publication, orchestration starts making sense. If I merely receive increasingly confident chat messages, I have added complexity without control.

Our final installment examines routing through OpenRouter, mixing local and remote executors, budgeting tasks, and setting fallback policies. That is the logical next problem: once the architecture works, it should work predictably without costing more than the value it adds.


## What automated verification cannot completely replace

A green test is valuable evidence, but it does not necessarily cover the user's experience. In the example form, a test may prove that a second click does not send another request and still miss the fact that a loading state is not announced to assistive technology. It may correctly disable the button while leaving an error message impossible to understand. On a real website I would manually check keyboard navigation, focus, errors, and responsive behavior whenever the patch touches them.

Security review is different from code-style review. If the fix adds idempotency, someone must decide where the key is generated and validated, how long it remains valid, and how the backend treats retries. A simple “disable the button” approach does not answer those questions. If the plan ignored them, the error starts with task definition rather than with implementation. The reviewer should be able to challenge the plan instead of merely congratulating the patch for meeting incomplete criteria.

Artifact privacy matters too. A diff may include internal configuration; logs can expose tokens or identifiers. Before returning links to a conversational client, the orchestration service should apply authorization consistently to both execution and reporting. The fact that a pull request is public does not authorize publication of private debugging traces or internal screenshots.

An automated reviewer can help by searching for edge cases, but its result must be treated as a proposal. A comment that says “no issues found” does not certify accessibility, security, or behavior. Nor does it absolve the developer of examining changes outside the expected scope. The highest-value human check is often the final review of the complete diff, not an extra agent round.

## A reproducible baseline beats an impressive demo

I would run the exact same task twice from the same base commit: once with a single coding agent, then with the planner–implementer–reviewer pipeline. Preserve the acceptance contract, model versions, tool permissions, and CI results. Do not change the repository halfway through and then compare the costs as though the inputs were identical. The exercise should yield a small set of observable facts rather than a marketing headline.

The baseline includes human intervention. Count the time spent clarifying the task, reviewing the final diff, reading logs, and recovering from failed attempts. One elaborate pipeline may use fewer API calls while demanding more manual supervision. For a solo developer, that can be a worse outcome despite apparently lower model cost.

Finally, define completion explicitly. “The agent is done,” “the reviewer approved,” “CI passed,” and “the change is deployed” are four different states. A proper closing report should identify which state has actually been reached, what remains uncertain, and what still requires a human decision. Keeping those distinctions visible may be the single most valuable property of an orchestrated workflow.


## The hidden cost of every handoff

Every handoff between agents has a context cost and a coordination cost. If a planner writes ten pages that the implementer must consume, we are paying to create and process information that may not help. If the reviewer receives only a glowing summary without the diff, it may approve mistakes a human would notice in seconds. The goal is not to minimize every message, but to design handoffs containing real evidence.

I would use a compact template: task ID, exact Git commit, goal, affected files, tests, and unresolved questions. The implementer attaches a diff; the reviewer replies with findings attached to the same revision. This prevents a multi-turn conversation from obscuring which version of the code is actually being examined.

Artifact permissions must follow the privacy policy of the project. A link to a public pull request may be shareable; a log containing environment variables is not. The coordinator should return authorized references and a sanitized summary rather than copying every file and diagnostic message across services. Sending less irrelevant data can improve both operating cost and security.

The handoff also needs a deadline and a clear failure status. When another agent is unavailable, the coordinator should not keep sending the same request and assuming progress. It can pause the task, preserve its artifacts, and ask whether to retry or continue with a single executor. In a small project, graceful failure can be more valuable than a spectacular demo of simultaneous agents.

## References

- [Git: official worktree documentation](https://git-scm.com/docs/git-worktree)
- [GitHub: troubleshooting required PR checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [OpenCode: client SDK and sessions](https://opencode.ai/docs/sdk)
- [OpenCode: HTTP server](https://opencode.ai/docs/server)
- [ArceApps: MCP, ACP, and A2A](/blog/mcp-acp-a2a-agent-protocols/)
- [ArceApps: ChatGPT Desktop and agents](/blog/chatgpt-desktop-agent-orchestration/)
- [ArceApps: coding-agent CI/CD orchestration](/blog/orchestrating-ai-agents-cicd-pipeline/)

**Closing thought.** I would build a pipeline that leaves one reviewable PR before designing an “agent team” with ten specialists. The best automation is the one that retains the ability to explain and reverse what it did.
