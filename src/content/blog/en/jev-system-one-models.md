---
title: "Jev: AI Built to Decide, Not to Write"
description: "Explore Jev and System One Models: installation, API, SDKs, Agent Skill, community CLI/MCP tools, and patterns for typed software decisions."
pubDate: 2026-09-20
lastmod: 2026-09-20
author: "ArceApps"
keywords:
  - "Jev"
  - "System One Models"
  - "TypeSafe AI"
  - "AI Agents"
  - "Model Routing"
  - "Typed Decisions"
  - "Agent Skills"
canonical: "https://arceapps.com/blog/jev-system-one-models/"
heroImage: "/images/jev-system-one-models.svg"
tags: ["Jev", "TypeSafe AI", "System One", "AI Agents", "Model Routing", "Agent Skills", "Indie Dev"]
draft: false
category: ai-agents
reference_id: "ab18f9ae-3289-4c75-9769-5ef8196019de"
---

> **Related reading:** [Model Routing for Subagents: 30-80% Lower Cost](/blog/model-routing-subagents-coding-agents/) · [AI Token Savings: Cut Costs by up to 99%](/blog/ai-token-savings-strategies/)

## The problem does not always need a natural-language answer

Over the last few months I have written a lot about routing, agents, cheap models, expensive models, and how to avoid spending frontier intelligence on mechanical work. But there is an earlier question we usually treat as already solved:

**Does this decision actually need a model that generates text?**

Picture a coding agent working through a repository. During one session it may need to decide things such as:

- Is this task frontend, backend, infrastructure, or documentation?
- Do I need a frontier model, or will a fast one do?
- Does this change look risky?
- Should I load a particular skill?
- Does this tool result contradict the user's request?
- Is this retrieved RAG passage worth adding to context?
- Is confidence high enough to automate, or should I escalate?

None of those questions needs a beautifully written paragraph. What I really want is something much more boring and much more useful:

~~~text
route = "backend"
confidence = 0.94
~~~

or:

~~~text
needs_human_review = 0.17
~~~

or a distribution my code can consume:

~~~json
{
  "cheap_model": 0.08,
  "coding_model": 0.81,
  "reasoning_model": 0.11
}
~~~

Yet the standard architecture is still to send a prompt to a generative LLM, wait for tokens, ask for JSON, parse it, validate it, make sure no field was invented, and retry when the output does not match what the program expects.

On September 15, 2026, [TypeSafe AI introduced Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), its first **System One Model**, built around the idea that a large part of automation does not need language generation. Jev receives unstructured state plus typed questions and returns structured judgments and probabilities.

The line that best captures why I find it interesting is not “Jev is faster than an LLM.” It is this:

**Jev questions whether language generation is the right interface between a model and software.**

That changes how I think about agent architecture.

---

## What a System One Model is

TypeSafe borrows the name from the distinction popularized by Daniel Kahneman between fast, intuitive System 1 thinking and slow, deliberate System 2 thinking.

I would not stretch the psychology analogy too far. In software, the practical split is simpler.

A reasoning LLM is excellent when I need to:

- generate code;
- write or transform prose;
- plan an architecture;
- research;
- combine many constraints;
- sustain a conversation;
- explore an open-ended problem.

Jev is designed for another shape of work: **narrow questions about a specific state where the answer space is already known**.

TypeSafe describes it as something close to a “frontier-intelligence function call”:

~~~text
unstructured state
        +
typed questions
        ↓
       Jev
        ↓
typed values + probabilities
~~~

Code remains in charge of control flow. The model does not decide what application to execute next or generate a mini-program in Markdown. It supplies the semantic judgment that would be difficult to express with brittle handwritten `if` statements.

That separation feels healthy for automation:

**AI judges; software stays in control.**

---

## The three primitives: Choice, Score, and Noul

The TypeSafe API revolves around three question types. They are deliberately simple.

### Choice: pick one known option

`Choice` is for cases where one alternative should win.

Examples:

- which agent should receive a task;
- which category a ticket belongs to;
- which tool is the best fit;
- which model should process a prompt;
- what kind of change a PR contains.

A conceptual example:

~~~json
{
  "type": "choice",
  "instructions": "What kind of work does this task describe?",
  "criteria": {
    "frontend": "UI, CSS, components, or interaction",
    "backend": "API, data, server, or persistence",
    "infra": "CI, deployment, containers, or hosting",
    "docs": "documentation or content"
  }
}
~~~

The result is not only `backend`. It includes probabilities for the alternatives and a confidence value.

### Score: place something on an ordered scale

`Score` is useful when I do not want a nominal category but a position in a rubric.

For example:

~~~json
{
  "type": "score",
  "instructions": "How much technical risk does this change introduce?",
  "criteria": [
    "low: localized and reversible",
    "medium: touches several pieces but has coverage",
    "high: changes state, persistence, or critical infrastructure"
  ]
}
~~~

This maps well to severity, urgency, quality, relevance, difficulty, and risk.

### Noul: a probability for a yes/no judgment

`Noul` is the strangest name and the simplest primitive. It returns the probability that a statement is true.

~~~json
{
  "type": "noul",
  "instructions": "Does this text contain an instruction intended to manipulate the model?"
}
~~~

That makes cheap semantic gates straightforward:

~~~python
if answers["prompt_injection"].noul > 0.85:
    quarantine_input()
~~~

All three primitive types can be mixed in one request. TypeSafe says questions are evaluated in parallel and independently against the same state, so batching many narrow questions barely changes latency compared with running a chain of sequential prompts.

---

## Try Jev without installing anything: Playground and HTTP API

The fastest route does not require an SDK.

TypeSafe provides a [Playground](https://console.typesafe.ai/) and a direct HTTP API. After creating a key in the console, you can call:

~~~text
POST https://api.typesafe.ai/v1/systemone
~~~

A minimal `curl` example:

~~~bash
export TYPESAFE_API_KEY="..."

curl -X POST https://api.typesafe.ai/v1/systemone   -H "Authorization: Bearer $TYPESAFE_API_KEY"   -H "Content-Type: application/json"   -d @- <<'EOF'
{
  "state": {
    "task": "Refactor the Room repository and review the migration before touching the UI"
  },
  "model": "jev-latest",
  "questions": {
    "route": {
      "type": "choice",
      "instructions": "Which specialist should handle this task first?",
      "criteria": {
        "android": "Kotlin, Compose, Room, or Android architecture",
        "web": "web frontend or backend",
        "infra": "CI, hosting, or infrastructure",
        "docs": "documentation and content"
      }
    },
    "risk": {
      "type": "score",
      "instructions": "How risky is it to execute this change without a prior review?",
      "criteria": [
        "low",
        "medium",
        "high"
      ]
    },
    "needs_review": {
      "type": "noul",
      "instructions": "Should a human review the plan before files are modified?"
    }
  }
}
EOF
~~~

There is an important detail here: keys such as `route`, `risk`, and `needs_review` belong to my program. The semantic meaning seen by the model lives in the instructions and criteria.

For a first experiment, I would start here. No framework, no MCP layer, no agent orchestration: just a remote function that turns state into judgments.

---

## Official Python installation

TypeSafe publishes an official Python SDK for Python 3.10 and newer.

With `pip`:

~~~bash
pip install typesafe-sdk
~~~

or with `uv`:

~~~bash
uv add typesafe-sdk
~~~

Then export the key:

~~~bash
export TYPESAFE_API_KEY="..."
~~~

A practical issue-triage example:

~~~python
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

ticket = {
    "title": "Recording stutters when delay is enabled",
    "body": "With more than 30 seconds of buffer the audio echoes and fails repeatedly.",
}

with TypeSafeClient() as client:
    response = client.system_one(
        state=ticket,
        questions={
            "owner": Choice(
                instructions="Which area should investigate this issue first?",
                criteria={
                    "audio": "capture, playback, buffering, or codecs",
                    "ui": "interface or interaction",
                    "storage": "persistence or files",
                    "network": "streaming, connection, or transport",
                },
            ),
            "severity": Score(
                instructions="How severe is this for a user recording audio?",
                criteria=[
                    "cosmetic",
                    "annoying but usable",
                    "core functionality degraded",
                    "blocking or data loss",
                ],
            ),
            "needs_repro": Noul(
                instructions="Should this bug be reproduced under controlled conditions before changing code?"
            ),
        },
    )

owner = response.choices["owner"]
severity = response.scores["severity"]
needs_repro = response.nouls["needs_repro"]

print(owner.choice, owner.confidence)
print(severity.score, severity.confidence)
print(needs_repro.noul)
~~~

The SDK provides synchronous and asynchronous clients and handles retries according to its default retry policy.

Python looks like a natural fit when Jev sits inside a data pipeline, batch classifier, evaluation harness, or auxiliary service.

---

## Official JavaScript and TypeScript installation

For web apps, Node tooling, and agent infrastructure, the JavaScript/TypeScript SDK is probably the most natural surface.

It requires Node.js 20 or newer:

~~~bash
npm install @typesafe-ai/sdk
~~~

Then:

~~~typescript
import {
  choice,
  noul,
  score,
  TypeSafeClient,
} from "@typesafe-ai/sdk";

const client = new TypeSafeClient();

const response = await client.systemOne({
  state: {
    prompt: "Fix the broken test, update the docs, and do not change the public API.",
    changedFiles: [
      "src/services/parser.ts",
      "tests/parser.test.ts",
    ],
  },
  questions: {
    route: choice("Which agent should own this task?", {
      coder: "implements or repairs code",
      reviewer: "analyzes risk and correctness",
      researcher: "investigates documentation and prior art",
      docs: "primarily works on documentation",
    }),
    complexity: score("Expected work complexity", [
      "mechanical",
      "requires context",
      "requires deep reasoning",
    ]),
    canUseCheapModel: noul(
      "Can this be solved reliably with a fast, inexpensive model?"
    ),
  },
});

console.log(response.answers.route.choice);
console.log(response.answers.route.confidence);
console.log(response.answers.complexity.score);
console.log(response.answers.canUseCheapModel.noul);
~~~

One nice property of the TypeScript SDK is that response types are inferred from the questions. That is very much the product philosophy: the boundary between AI and code should look less like parsing a conversation and more like calling a typed API.

---

## There is an official Agent Skill

This is one of the decisions TypeSafe has made that I like most in the current coding-agent ecosystem.

There is an **official Agent Skill** that teaches the agent:

- how the API works;
- when to use Choice, Score, or Noul;
- how to formulate atomic questions;
- which architectural patterns TypeSafe recommends;
- how to handle confidence and thresholds.

For Claude Code it can be installed as a plugin:

~~~bash
claude plugin marketplace add typesafe-ai/skills
claude plugin install typesafe@typesafe-ai
~~~

For Codex and other agents compatible with the Agent Skills format:

~~~bash
npx skills add typesafe-ai/skills --skill typesafe-ai
~~~

Installation is project-local by default. For a global installation:

~~~bash
npx skills add typesafe-ai/skills --skill typesafe-ai -g
~~~

Then you can ask for something fairly natural:

~~~text
Use the TypeSafe skill and inspect this repository.
Find semantic decisions that we currently solve with fragile parsing,
heuristics, or expensive LLM calls, and propose where Jev is worth testing.
~~~

This **does not turn the coding agent into Jev**. The skill is operational documentation so Claude Code, Codex, or another agent can design a correct TypeSafe integration.

That distinction matters.

---

## Does Jev have an official CLI?

As of this article's publication date, **I cannot find a dedicated official Jev CLI in TypeSafe's documented product surfaces**.

The official documentation currently exposes:

| Surface | Status |
|---|---|
| Playground | Official |
| HTTP API | Official |
| Python SDK | Official |
| JavaScript/TypeScript SDK | Official |
| Agent Skill | Official |
| Dedicated CLI | Not listed as an official documented product |
| MCP server | Not listed as an official documented product |

That does not mean you cannot use Jev from a terminal. A `curl` request already does the job, and the community ecosystem has moved quickly.

### A community CLI/skill

The community project [okooo5km/jev](https://github.com/okooo5km/jev) packages a CLI together with an Agent Skill. Its documented installation is:

~~~bash
npx skills add okooo5km/jev -g
~~~

According to the project, the skill bundles the CLI so an agent can execute judgments directly from the shell without first writing a full integration.

That is convenient for experiments, but I would keep the trust boundary explicit:

**TypeSafe SDK/API/skill = official. This CLI = community.**

For a local prototype that can be perfectly reasonable. For production I would review source, releases, permissions, and secret handling first.

---

## What about MCP?

The situation is similar: TypeSafe's docs do not list an official MCP server today, but several community implementations already exist.

One of the most practical is [itsmostafa/typesafe-mcp](https://github.com/itsmostafa/typesafe-mcp). Its binary is called `evaluate`, and it exposes Jev as an MCP tool for Claude Code, Claude Desktop, Codex, and pi.

The project's macOS/Linux installation:

~~~bash
curl -fsSL https://raw.githubusercontent.com/itsmostafa/typesafe-mcp/main/install.sh | sh
~~~

Then:

~~~bash
export TYPESAFE_API_KEY="..."
evaluate setup mcp
~~~

I like the architecture because it turns Jev into **a tool used by the generative agent**.

The coding agent still performs research or writes code, but it can call a decision model when it needs to:

- classify;
- score;
- select a handler;
- evaluate risk;
- filter results;
- apply a guardrail.

The layers look like this:

~~~text
Codex / Claude Code
       │
       │ MCP: evaluate
       ▼
 community MCP server
       │
       │ /v1/systemone
       ▼
      Jev
       │
       ▼
typed probabilities
~~~

MCP is the adapter. Jev is the model. The server above is community-maintained.

There is also [BYK/jev-mcp](https://github.com/byk/jev-mcp), which focuses on mapping judgments over many items and evaluating question/threshold variants against labeled examples. That becomes interesting once you move beyond a demo and need to measure calibration and policy errors.

---

## Use case 1: model routing for agents

This is the use case that connects most directly with my earlier piece on [Model Routing for Subagents](/blog/model-routing-subagents-coding-agents/).

A typical static strategy looks like:

~~~text
explore  → cheap model
coder    → mid-tier model
planner  → frontier model
~~~

Jev lets you add **request-level routing**, not just role-level routing.

For example:

~~~typescript
const decision = await client.systemOne({
  state: {
    agent: "coder",
    task,
    repoSummary,
    touchedAreas,
  },
  questions: {
    tier: choice("What model tier does this task require?", {
      fast: "mechanical work, search, or localized editing",
      standard: "normal implementation with several constraints",
      frontier: "architecture, high ambiguity, or high risk",
    }),
    highRisk: noul(
      "Could an error in this task cause data loss, a security problem, or a hard-to-detect regression?"
    ),
  },
});

const tier = decision.answers.tier;

if (tier.confidence < 0.55) {
  return runWithFrontierModel(task);
}

if (decision.answers.highRisk.noul > 0.75) {
  return runWithFrontierModel(task);
}

return runWithModel(tier.choice, task);
~~~

Jev does not replace the coding model here.

**It decides when the coding model is worth paying for.**

At scale, that distinction could matter more than shaving a few tokens off the prompt.

---

## Use case 2: tool and skill selection

Modern agents accumulate tools and skills.

Loading everything has two costs:

1. more context;
2. more opportunities to choose badly.

TypeSafe even publishes a cookbook for **skill suggestion**: rank a skill from a catalog and independently decide whether a skill should be loaded at all.

I would use a two-stage router:

~~~text
user turn
    ↓
does it need a skill?
    ↓ Noul
yes ───────── no
│             │
▼             └── continue without loading one
Choice among candidates
│
▼
load only the winner
~~~

That gets more valuable as the catalog grows. Instead of dumping 180 full skill descriptions into the main context, I can prefilter candidates, ask Jev for a bounded decision, and load only what is needed.

The same idea applies to tools:

- GitHub vs terminal;
- web search vs repository search;
- image generation vs ordinary editing;
- database vs API;
- automation vs human review.

---

## Use case 3: guardrails around an LLM

Another strong application is putting Jev before and after a generative model.

Before:

~~~text
input
  ↓
Jev: prompt injection?
Jev: secrets or sensitive data?
Jev: risk level?
  ↓
LLM
~~~

After:

~~~text
LLM output
  ↓
Jev: does it answer the request?
Jev: does it contradict the evidence?
Jev: suspicious tool call?
  ↓
accept / retry / escalate
~~~

TypeSafe explicitly recommends this pattern for jailbreak detection, tool-call errors, sensitive-data exposure, and response-quality failures.

The cost relationship is what makes it compelling: if semantic verification is much cheaper than another frontier-model call, **verification can become systematic**, rather than something you only do when a result already feels suspicious.

---

## Use case 4: filtering context before RAG or a coding agent

One of the quietest ways to degrade an agent is to give it too much irrelevant context.

A common pipeline:

~~~text
query
  ↓
embeddings / lexical search
  ↓
20 candidate passages
  ↓
LLM receives all 20
~~~

With Jev, I can add a semantic gate:

~~~text
query
  ↓
cheap retrieval
  ↓
candidates
  ↓
Jev: relevance / contradiction / prompt injection
  ↓
only useful context
  ↓
LLM
~~~

TypeSafe has a dedicated cookbook for classifying RAG passages.

This attacks two problems at once:

- fewer tokens in the generative model;
- less semantic noise.

And it can answer something an embedding score does not capture particularly well: the difference between “this passage is about the same topic” and “this passage contains useful evidence for this exact question.”

---

## Use case 5: semantic checks in CI

A traditional linter is ideal when a rule can be expressed deterministically:

~~~text
no wildcard imports
do not exceed N characters
this method must be suspend
~~~

But many conventions are semantic:

- “this error message gives the user a useful next action”;
- “this change violates the public intent of the function”;
- “the documentation still describes the old behavior”;
- “this test actually protects the regression mentioned in the issue.”

TypeSafe explicitly lists **semantic code linting** as a use case.

I would not let Jev block a merge on day one. I would start like this:

~~~text
PR
 ↓
deterministic rules
 ↓
Jev semantic checks
 ↓
high confidence   → comment / flag
medium confidence → informational
low confidence    → ignore
~~~

Once I have enough real examples, I can measure false positives and decide whether any check deserves to become a gate.

---

## Use case 6: issues, bugs, and support triage

This is the classic example, but it remains a good one because all three primitives fit naturally into one request.

For an issue, I can ask simultaneously:

- `Choice`: responsible area;
- `Score`: severity;
- `Noul`: likely reproducible;
- `Noul`: possible data loss;
- `Noul`: requires immediate response.

Then ordinary code owns policy:

~~~python
if data_loss > 0.8:
    label("critical")
    notify_owner()

elif severity >= HIGH and severity_confidence > 0.7:
    label("high-priority")

elif owner_confidence < 0.5:
    label("needs-triage")

else:
    assign(owner)
~~~

This is the part I like: policy remains readable in source code. If “critical” changes tomorrow, I update thresholds and branches. I do not need to rewrite one giant prompt that mixes classification, business policy, and control flow.

---

## Use case 7: real-time applications

TypeSafe positions Jev for latency in the range of tens to a few hundred milliseconds depending on query and network conditions.

That opens uses where a generative LLM is normally too slow or intrusive:

- chat moderation during a game;
- classifying messages as the user types;
- dynamic UI selection;
- event prioritization;
- voice assistants that need to choose an action;
- limited NPC or adaptive game logic;
- semantic filters before an interactive action.

I would not use Jev to write a full character dialogue. I could use it to decide:

~~~text
player state + context
        ↓
Choice
        ↓
friendly / cautious / hostile / flee
~~~

Then code, authored assets, or another model can render the final behavior.

That is a very different architecture from “the LLM runs the game,” and probably much easier to debug.

---

## Use case 8: semantic map-reduce over large datasets

Another interesting use is to run small judgments over large collections:

- documents;
- logs;
- tickets;
- reviews;
- agent traces;
- code fragments;
- transcripts.

For example, over 100,000 agent traces I might extract features such as:

~~~text
did the agent hesitate before using a tool?
does the tool call match the goal?
did it enter a loop?
is the final response supported by evidence?
did the task really need the most expensive model?
~~~

Those probabilities become columns. Then I can aggregate them with SQL, train a classical model, or look for patterns.

At that point Jev looks less like an assistant and more like a **vectorized semantic function**.

---

## Confidence belongs in the architecture

One of TypeSafe's strongest ideas is that uncertainty should be part of system design.

It is not enough to ask:

~~~text
Which option won?
~~~

I also need:

~~~text
How safe is it to act on this answer?
~~~

A simple router might have three paths:

~~~python
if confidence >= 0.90:
    automate()

elif confidence >= 0.60:
    escalate_to_llm()

else:
    human_review()
~~~

But there is no universal threshold. The cost of being wrong changes by action.

Showing a bank balance might tolerate a lower confidence threshold. Approving a transfer should require much more certainty and perhaps explicit user confirmation.

The important principle is:

**confidence does not replace risk policy; it feeds it.**

It is also important not to confuse `confidence` with the probability assigned to one option. TypeSafe documents both because they answer different questions.

---

## “Can’t hallucinate” needs an asterisk

In the launch post, TypeSafe says Jev “can’t hallucinate.”

I understand the intended claim, but I would phrase it more narrowly.

If I define:

~~~text
choice = [frontend, backend, infra, docs]
~~~

Jev should not return:

~~~text
"quantum_archaeology"
~~~

The output space is constrained. TypeSafe says schema matching is guaranteed and type errors are impossible.

That removes a very real class of **interface hallucination**:

- invented keys;
- invalid JSON;
- unexpected formats;
- tool calls outside the schema.

But **a perfectly typed answer can still be semantically wrong**.

Jev can choose `frontend` when the right answer was `backend`.

TypeSafe is more candid about this in the technical docs than the marketing line suggests: it publishes a full “jaggedness” page for Jev 1.13 with known failure modes.

So my version of the claim is:

> Jev can guarantee the shape of the result. It cannot guarantee that every judgment is correct.

That is still a valuable property.

---

## Where Jev 1.13 struggles

TypeSafe documents several limitations itself. They are exactly what we need to decide when **not** to use the model.

### 1. It is not a calculator

I would not ask:

~~~text
How many times does X occur?
Which date is 47 days away?
Does this sum exceed 12,450?
~~~

If a calculation is exact, it belongs in code.

### 2. Dates and temporal comparison

TypeSafe recommends using the model for semantic extraction when necessary, then doing date arithmetic with normal date types in code.

### 3. Indirection and multi-step reasoning

The more reasoning hops a question requires, the worse it fits the System One shape.

Instead of:

~~~text
Given A, which depends on B, except when C applies,
should we do D?
~~~

split it into atomic judgments and combine the results.

### 4. Huge states full of irrelevant detail

More context does not always mean more quality.

TypeSafe explicitly acknowledges that Jev also suffers from context rot. Send the state relevant to the decision, not an entire repository “just in case.”

### 5. Adversarial content

State is data, but that does not make the model immune to prompt injection or deliberately manipulative text. Security integrations still need adversarial testing.

### 6. Generation

If you need to write, Jev is the wrong tool.

Trying to reconstruct a string through hundreds of `Choice` calls would be fighting the model. Use a generative model for generation.

---

## System One + System Two is the architecture that makes sense to me

I do not see Jev as a direct replacement for Claude, GPT, Gemini, or coding models.

I see it as **a layer that decides when and how to use them**.

An agent architecture could look like:

~~~text
                         ┌────────────────────┐
request ──► deterministic│ parsing / auth / DB│
                         └─────────┬──────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ Jev / System One │
                          │ classify         │
                          │ score            │
                          │ route            │
                          │ guardrail        │
                          └───────┬─────────┘
                                  │
            ┌─────────────────────┼────────────────────┐
            ▼                     ▼                    ▼
      deterministic          cheap / fast        frontier LLM
          code                  model              reasoning
            │                     │                    │
            └─────────────────────┴────────────────────┘
                                  │
                                  ▼
                          verification layer
~~~

That is more interesting to me than trying to build “one model for everything.”

Code solves exact problems.

Jev handles fast bounded judgment.

The LLM handles open-ended, generative, deliberate work.

A human enters when the cost of being wrong exceeds the value of automation.

---

## The benchmarks are impressive, but still vendor benchmarks

TypeSafe publishes extraordinary numbers.

Its launch post describes roughly 70-500 ms end-to-end latency for Jev versus seconds or much longer for some frontier-model workflows. It also lists input pricing of $0.042 per million tokens and says output is too cheap to meter separately.

Its workflow evaluations produce maximum claims of **193.6× faster** and **444.6× cheaper**.

I would not repeat those figures without the caveats.

TypeSafe itself notes that:

- those peaks are at the high end of what it expects in real deployments;
- the workflows were created by people on its model-capabilities team;
- reference answers come from external frontier models;
- the wrapper used to compare LLMs forces structured probabilistic decisions and may add latency and cost.

None of that invalidates the result. It just means I want independent benchmarks before turning “two orders of magnitude” into a general law.

The more credible point today is structural: **Jev does not autoregressively generate a text response for a closed decision**. There are real architectural reasons for that to be faster and cheaper on this workload shape.

The exact magnitude will depend on the task.

---

## How I would test it in a real project

I would not replace anything critical first.

I would run a one-afternoon experiment.

### Step 1: pick one repeated decision

For example:

~~~text
which model gets each subtask
~~~

### Step 2: collect 100-500 real cases

I want inputs that actually occur in my workflow.

### Step 3: define one narrow question

~~~text
Choice:
fast     → mechanical or localized task
standard → normal implementation
frontier → high risk or deep reasoning
~~~

### Step 4: compare with my own labels

I do not need perfection. I need to know where it fails.

### Step 5: test thresholds

For example:

~~~text
confidence >= 0.85 → apply routing
0.55-0.85          → standard model
< 0.55             → frontier / review
~~~

### Step 6: measure four things

- accuracy or agreement;
- dangerous false positives;
- latency;
- cost.

### Step 7: deploy in shadow mode first

Jev makes the decision, but does not control the workflow yet. I only log what it would have done.

Once enough real cases exist, I enable automation in the high-confidence region.

That method is much less exciting than a demo. It is also how I would learn whether the model actually belongs in my stack.

---

## Which surface I would use

After going through the official docs and today's ecosystem, my map looks like this:

| I want to… | I would use… |
|---|---|
| Understand the concept | Playground |
| Test one decision in five minutes | cURL + HTTP API |
| Integrate into backend/data pipelines | Python SDK |
| Integrate into web, Node, or tooling | JS/TS SDK |
| Have Codex/Claude help implement it | Official Agent Skill |
| Call it directly from a terminal | cURL or community CLI |
| Expose it as an agent tool | Community MCP |
| Measure thresholds/calibration at scale | SDK + custom harness or eval-oriented MCP |

And I would keep one principle:

**in production, the fewer unnecessary adapters between my code and the official API, the better.**

MCP and CLI are excellent for experimentation and agent tooling. A production API may be better off calling the official SDK directly.

---

## What feels genuinely new

Generative models trained us to love an incredibly flexible interface:

~~~text
string in → string out
~~~

That flexibility is their superpower. It is also part of the problem when I try to use them as an internal software dependency.

Jev proposes a different interface:

~~~text
state + bounded decisions → typed probabilities
~~~

I lose generation.

In return I get:

- a known output space;
- composable decisions;
- probabilities;
- latency compatible with more interactive paths;
- a clearer boundary between model and code.

But there is another consequence I like even more: **software engineering matters again**.

If I write a bad question, Jev is not going to rescue me by writing three paragraphs and guessing what I meant.

I have to decide:

- what state it needs;
- what the atomic question really is;
- which options exist;
- which threshold the product accepts;
- what happens under uncertainty;
- which part should remain deterministic code.

That is a feature, not a weakness.

AI stops occupying the entire system and becomes a primitive inside it.

---

## My conclusion: it does not replace the LLM, it puts the LLM in its place

After reviewing Jev, I am not especially interested in the “new model beats LLMs” story.

The more useful question is:

**How many LLM calls in my system exist only because I need a semantic decision?**

If the answer is “many,” System One Models are worth paying attention to.

I would not use Jev to write this article.

I would not use it to design a complete architecture.

I would not use it for arithmetic, to program a complicated feature, or to investigate an open-ended bug.

But I could use it a hundred times inside the system coordinating those tasks:

- decide which model to call;
- select a skill;
- filter context;
- score risk;
- detect an anomaly;
- verify an output;
- classify a tool call;
- decide whether to escalate.

That may be the most interesting part.

For years we have measured AI progress by how well a machine talks to us. Jev is betting on a much less visible layer: **models that do not need to talk because they are designed for other software to act on their decisions**.

If it holds up outside vendor benchmarks as well as the architecture suggests, it could become a useful part of the agent stack: not the brain that does everything, but the fast nervous system deciding which part of the brain should work next.

---

## References

- TypeSafe AI — [Introducing System One Models & Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- TypeSafe AI Docs — [Introduction](https://docs.typesafe.ai/introduction)
- TypeSafe AI Docs — [Quick start](https://docs.typesafe.ai/introduction/quickstart)
- TypeSafe AI Docs — [Primitives: Choice, Score and Noul](https://docs.typesafe.ai/primitives)
- TypeSafe AI Docs — [Client SDKs](https://docs.typesafe.ai/sdk)
- TypeSafe AI Docs — [Python SDK](https://docs.typesafe.ai/sdk/python)
- TypeSafe AI Docs — [JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)
- TypeSafe AI Docs — [Agent Skill](https://docs.typesafe.ai/agent-skill)
- TypeSafe AI Docs — [Example use cases](https://docs.typesafe.ai/concepts/use-case-map)
- TypeSafe AI Docs — [Intent routing](https://docs.typesafe.ai/patterns/intent-routing)
- TypeSafe AI Docs — [Confidence-gated routing](https://docs.typesafe.ai/patterns/confidence-routing)
- TypeSafe AI Docs — [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13)
- TypeSafe AI Docs — [LLM guardrails cookbook](https://docs.typesafe.ai/cookbooks/llm_guardrails)
- TypeSafe AI Docs — [Skill suggestion cookbook](https://docs.typesafe.ai/cookbooks/skill_suggestion)
- TypeSafe AI Docs — [Classifying RAG passages](https://docs.typesafe.ai/cookbooks/classifying_rag_passages)
- TypeSafe AI Skills — [Official Agent Skill repository](https://github.com/typesafe-ai/skills)
- okooo5km/jev — [Community CLI and agent skill](https://github.com/okooo5km/jev)
- itsmostafa/typesafe-mcp — [Community MCP server](https://github.com/itsmostafa/typesafe-mcp)
- BYK/jev-mcp — [Community eval-first MCP server](https://github.com/byk/jev-mcp)

---

If I end up integrating Jev into one of my agents, the follow-up I want to write is not another benchmark comparison. It is a **devlog with real traffic**: thresholds, mistakes, costs, latency, and wrong decisions. That is where we will know whether System One is merely an elegant idea or a primitive worth keeping in the stack.
