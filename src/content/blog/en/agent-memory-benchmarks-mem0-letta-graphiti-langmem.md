---
title: "Agent Memory: what Mem0 and Letta benchmarks reveal"
description: "Compare reproducible benchmarks of Mem0, Letta, Graphiti and LangMem, including sample sizes, recall, latency, costs and methodological traps."
pubDate: 2026-10-22
lastmod: 2026-10-28
author: "ArceApps"
keywords: ["Mem0 benchmark", "Letta", "Graphiti", "LangMem", "agent memory", "LongMemEval", "LoCoMo"]
canonical: "https://arceapps.com/blog/agent-memory-benchmarks-mem0-letta-graphiti-langmem/"
heroImage: "/images/agent-memory-benchmarks-mem0-letta-graphiti-langmem.svg"
tags: ["AI", "Memory", "Agents", "Benchmarks", "Mem0", "Letta"]
category: "ai-agents"
reference_id: "b0e49311-68a7-45f4-bf27-10d06ab1e4b9"
---

## A memory leaderboard can conceal more than it reveals

Evaluating memory systems for AI agents sounds easy. Take several tools, ask questions about past conversations, count correct answers and arrange the percentages from highest to lowest. The resulting table fits into one screenshot. Unfortunately, that table may hide nearly everything that determines whether the experiment should change your engineering decisions.

Was the experiment measuring evidence retrieval or the final answer produced by a language model? What history did each tool ingest? Were the products configured or left at defaults? Was ingestion cost included? Did the judge accept semantically equivalent answers? How many questions were asked, and did they involve recent facts, multi-session reasoning or decisions that had subsequently changed?

Those questions matter much more than a decimal place. I have already written about [Mem0 and Letta](/blog/mem0-memgpt-agent-memory-stack/) and [persistent agent memory](/blog/ai-agent-memory-persistence-guide/). Here I want to move from features to **evidence**. We will examine two open benchmarks from September 2026, explain their differences and resist the temptation to merge incompatible numbers into a universal ranking.

The main sources are hamza-dev-tech's agent-memory-bench and Datapace's agent-memory-benchmark. Both publish code and methodological details, but their task sets, models and baselines differ. That difference is valuable if we use it to ask better questions instead of announcing a winner.

![A methodological comparison of agent memory recall, answering, forgetting and operating cost.](/images/agent-memory-benchmarks-mem0-letta-graphiti-langmem-map-en.svg)

## What does it mean for an agent to remember correctly?

An agent can store every conversation and still answer badly because the right evidence does not reach its current context. Conversely, it can retrieve a correct excerpt and then misinterpret it. There are at least three distinct stages: **writing memory**, **retrieving evidence**, and **using that evidence to answer**.

During writing, a system decides which facts to retain, which to summarize and how to represent relationships. During retrieval, it selects information relevant to the current question. During answering, a language model turns the selected information into an output. A failure in one stage should not be automatically blamed on another.

Memory also has to handle change. A developer might choose a library in January and replace it in March. Returning the January preference as the current choice is not good recall; it is returning an old fact outside its valid context. In coding agents, such mistakes can produce subtle regressions.

Multi-hop questions need evidence from more than one session. Unanswerable questions require the system to acknowledge missing evidence rather than manufacture a plausible answer. A benchmark that rewards confident guesses may encourage exactly the behavior we want to avoid.

Finally, the products have different architectures. Mem0 can be a component embedded in an application. Letta includes an agent runtime and its own model of memory management. Graphiti emphasizes relationships and time. LangMem provides memory utilities that integrate with LangGraph. A fair comparison must say which layer of each system is actually under test.

## First benchmark: agent-memory-bench and six configurations

Hamza's repository describes an open evaluation of long-conversation memory. Its published run from **23 September 2026** uses 419 turns, 120 probes and two conversations. There is a discrepancy in the source README: its results summary names gpt-4o-mini at temperature zero, while its “Models” section says gpt-oss-120b through Groq. Without inspecting the run manifest we cannot confidently identify the model used for that run. The project describes a common answering model and limits retrieval to ten returned items.

The project also records correct refusals of adversarial questions without answers, search latency, returned token counts and ingestion time per turn. It uses normalized string matching and an LLM judge to handle equivalent answer formats. Disagreements are written to a review file rather than hidden.

These are the published figures, with their conditions kept visible:

| Configuration | Recall | Correct adversarial refusal | Search p50 |
| --- | ---: | ---: | ---: |
| GoodMem, vendor tuned | 57.6% | 82.1% | 754 ms |
| GoodMem, defaults | 53.3% | 92.9% | 633 ms |
| Letta 0.11.7 | 52.2% | 92.9% | 318 ms |
| Mem0 2.1.0 | 50.0% | 92.9% | 38 ms |
| LangMem 0.0.30 | 45.7% | 85.7% | 68 ms |
| Zep/Graphiti 0.30.2 | 37.0% | 92.9% | 163 ms |

These are **not universal product-quality scores**. They describe these versions, tasks and configurations. With only two conversations, a gap of a few percentage points should not automatically be interpreted as a statistically decisive advantage.

Latency figures need equal caution. The author notes that some hosted services were accessed over long network distances from Pakistan while other configurations were self-hosted. A search p50 under those conditions reflects infrastructure and geography as well as implementation. It is not a promise about what you will see on your laptop.

## What the first experiment controls—and what it cannot

The benchmark uses a common interface with operations to reset, add, flush and search memory. Adapters are intended to remain thin, reducing the temptation to give one product extra processing unavailable to others. That is a sensible way to study common behavior, even though it may prevent some systems from exploiting their full architecture.

The top-ten retrieval limit is another trade-off. Some memory products are designed to return a few compact facts; others retrieve larger episodes. A common limit makes comparison easier but can affect the systems differently. The correct response is to document the policy and consider sensitivity tests, not to pretend the limit is neutral in every possible sense.

The vendor-tuned GoodMem configuration illustrates why configuration deserves its own column. Its reported recall rises relative to defaults, while correct adversarial refusal falls. Choosing only the most flattering metric would hide a genuine trade-off.

The repository contrasts its measured scores with higher promotional figures sometimes published elsewhere. That discrepancy does not, by itself, prove that another result was fabricated. Different datasets, models, prompts or graders can produce different numbers. To establish a contradiction, the protocols would need to be comparable.

Reproducibility is a major advantage of an open benchmark. Generalizability is a different property. Re-running the same small sample successfully does not show that the result will hold across other languages, engineering repositories or long-term personal data.

## Second benchmark: Datapace's deliberately small pilot

Datapace publishes a vendor-neutral benchmark that includes memory products and baselines without a specialized memory layer. Its pilot from **7 September 2026** uses only ten LongMemEval questions, one seed and a twelve-session history, ingested chronologically.

The most valuable part of its design may be the baselines. Alongside memory systems, it includes an **oracle** given only evidence sessions, a 32k-token recent-context window and an agent that searches dated files. File search is an important competitor. Too many memory products are evaluated only against other complex tools, leaving open the question of whether ordinary files and text search would be enough.

The report describes a particular configuration with Ling 3.0 Flash in which the oracle scores 90, two baselines score 80, and Mem0 and LangMem score 70. It also reports that the memory products can use roughly ten to fifty times fewer prompt tokens per answer than some context baselines in that pilot.

Those observations are interesting, not definitive. With ten questions, getting one additional answer right changes the score by ten percentage points. There is only one seed. Some product/model combinations cannot run under identical requirements, which creates holes in a supposedly simple comparison grid.

I read this work primarily as a useful evaluation design and a motivation for larger experiments. The strong performance of file search should keep us humble. A complex semantic memory system may save context; a simple file baseline may preserve detail; an answering model may determine the ceiling regardless of the retrieval method.

## Why these two studies must not share one leaderboard

Combining their headline percentages would create a misleading ranking. The studies have different datasets, sample sizes, answer models, versions, ingestion rules, baselines and evaluation procedures. Even the meaning of “accuracy” can change when one benchmark focuses on retrieved evidence and another judges a generated answer.

A system may retrieve a correct source but fail to answer because the model misunderstands it. Another may answer correctly using general knowledge even though its memory retrieval was weak. Without separating those stages, the final score cannot identify which component deserves credit.

Latency comparisons face similar confusion. Search latency is not end-to-end answer latency. Combining or comparing them without labels is like comparing database query time with the time a user waits for an entire webpage to render.

Default configurations are useful baselines, but not necessarily representative of carefully deployed production systems. Some tools rely on separate servers, external models, graph stores or indexes. Tuning can improve one metric at the expense of another, as the GoodMem configuration comparison illustrates.

I therefore prefer two distinct tables with methodology next to each, rather than a fabricated overall leaderboard. The refusal to over-interpret the evidence is itself an important result of this review.

## A good memory knows when there is no answer

A system that always returns something can appear capable until it encounters a question with no support in the stored conversations. For a personal assistant that may mean inventing a preference. For a coding agent it may mean asserting a nonexistent architecture decision or recommending a dependency that was never chosen.

Hamza's benchmark includes adversarial questions without an answer and measures correct refusal. This is a useful counterweight to recall. Aggressive semantic retrieval can surface a superficially similar memory that tempts the answering model to fill in missing details.

A richer evaluation would distinguish missing relevant evidence, retrieving an obsolete or contradictory record, failing to use correct evidence, and making an unsupported claim. It should also recognize that different stages are responsible for different mistakes.

If the source was never ingested, ingestion is the likely issue. If it is stored but never retrieved, the ranking or retrieval strategy deserves inspection. If it is correctly retrieved but ignored, the answer-generation stage may be at fault.

For engineering tasks I pay particular attention to superseded facts. Confidently remembering an old decision can be worse than saying “I don't know,” especially if the agent can modify code based on that error.

## The forgetting curve and updated facts

Long conversations are not merely larger piles of text. They have chronology. A framework changes, a user corrects a preference, an old decision is rescinded and a project adopts a new design. Memory should preserve the history without confusing past and present.

Datapace's stated evaluation dimensions include degradation with distance from the source evidence and the rate at which systems serve a superseded value. Those dimensions are closer to real software development than a simple question about something said yesterday.

Temporal graph systems can represent entities and validity intervals, but need correct updates and queries. Extracted fact memories can replace older records but may lose the reason for a change. Dated files keep chronology visible, but require the agent to determine which statement is current. Every approach pays a price somewhere.

A test set I would build includes facts that change twice, version-specific requirements and explicit reversals of decisions. Questions should distinguish “what was decided in May?” from “what is the current policy?” An agent that gives the same answer to both still has a temporal memory problem.

Preserving source dates and references is essential. Without them, both a correct historical answer and a current decision can become impossible to verify.

## Costs move between writing, reading and maintenance

One memory system may search very quickly while spending more resources ingesting each message. Another may store almost raw material and perform expensive processing at retrieval time. Comparing only one stage can favor the architecture that has shifted work elsewhere.

The first benchmark reports both search and ingestion. For instance, Mem0 is listed with a 38 ms search p50 and 1.52 seconds of ingestion per turn; LangMem with 68 ms and 4.15 seconds; Letta with 318 ms and 0.37 seconds. Those numbers describe the published environment only. They illustrate different profiles, not performance promises for other installations.

Model-assisted extraction, embeddings, graph updates, index maintenance and reingestion after changes all have costs. In a long-lived assistant, the accumulated cost of memory upkeep may be substantial even if each individual search feels inexpensive.

I would construct separate budgets for initial ingestion, incremental updates, retrieval and recovery or migration. Only then would I estimate total operating cost for a particular pattern of use.

Cost per answer is not interpretable without a history length, query rate, deployment context and retention period. A memory service that looks cheap for ten questions may be expensive when ingesting thousands of daily messages.

## Dataset quality is a separate engineering problem

Even a fully reproducible benchmark may represent a world far removed from your application. Synthetic conversations simplify human behavior. Real users change topics, correct statements, mix languages, abbreviate details and assume knowledge that was never explicitly recorded.

Hamza's repository acknowledges that LoCoMo is synthetic and human-edited. That does not invalidate the dataset. Controlled scenarios are useful for comparison. But I would want a second, application-representative test before assuming the same results hold for coding decisions or personal project notes.

For an indie development workflow, I would prepare a small set of carefully reviewed and anonymized questions about confirmed requirements, installed tools, architectural choices and explicitly rejected alternatives. Each expected answer should refer to a verifiable source, with a date and decision status.

That design avoids rewarding a memory system for remembering a provisional suggestion as if it had been approved. It also keeps private conversations out of public datasets.

If the test set cannot be shared because it contains private information, the methodology and aggregate results should still be documented precisely enough to examine what was done.

## An LLM judge is another model to evaluate

Semantic grading is useful because equivalent answers can look different. “3 May” and “2026-05-03” may be the same factual answer, while strict string matching would reject one. An LLM judge can handle those variations, but it introduces judgment errors of its own.

The judge model, temperature, prompt and scoring rules should be fixed and disclosed. It helps to retain disagreements between normalized matching and LLM grading, and manually review a sample. Hamza's benchmark includes an explicit disagreement-review file, which improves transparency.

Consider an answer that states the right date and an unrelated false claim. Is it correct? What if it omits a crucial qualification? Without a documented rubric, the final percentage partly measures the judge's generosity.

Security and privacy require even stricter evaluation. If a memory returns another user's private record, it has failed regardless of whether the answer matches the question. Some correctness properties cannot be reduced to semantic similarity.

A precise-looking score is not automatically a reliable measurement. It becomes useful when the scoring procedure is clear enough to challenge.

## A better benchmark I would build for ArceApps

I would begin with a common workload divided into categories: literal recall, revised facts, multi-session reasoning, absent evidence, two-source reasoning and recovery of project decisions. Each system would receive the same information in chronological order, using documented adapters and fixed versions.

I would run **two related but separate evaluations**. The retrieval test would ask whether the final selected context contains the evidence needed to answer. The answer test would give that context to a fixed model and grade the result. This separation reveals whether the weakness is finding information or using it.

Baselines should include dated files with text search, a recent context window and an oracle that sees only relevant evidence. Report token volume, end-to-end latency, ingestion cost, updating time and restart behavior. Include correct refusals and cross-user access failures as first-class outcomes.

With resources available I would repeat the evaluation over several seeds and independent datasets, then report uncertainty rather than overstate differences. Failure analysis should inspect whether an error was temporal, semantic, caused by extraction or caused by final answer generation.

This is a **proposed methodology, not a benchmark I have already run**. Describing an experiment one could reproduce is more honest than displaying attractive fabricated numbers.

## Choosing a memory system for the task

If automatic extraction and updating of compact conversational facts is the priority, Mem0 deserves consideration. If you want an agent runtime built around managed memory, Letta offers a different model. For temporal relationships among entities, Graphiti is worth testing. For an existing LangGraph workflow, LangMem may integrate more naturally.

Those are starting hypotheses, not final rankings. I would test a simple baseline first: versioned Markdown, local search, linked decisions and an explicit review mechanism. A more complex service should justify itself through better retrieval, lower total maintenance or more reliable agent outcomes.

Datapace reminds us that files can be highly competitive. Hamza reminds us that configuration, latency and ingestion change the story. Neither supports declaring the highest-scoring tool universally best.

Operational qualities matter too: exports, authorization, deletion, observability and crash recovery. A marginal recall improvement may not justify surrendering control over important project data.

## What I take away from these measurements

The most useful conclusion is not that one brand wins. It is that **agent memory needs several complementary measures and honest baselines**. Recall, answering, knowing when to abstain, updating superseded facts, respecting scopes and controlling cost are different capabilities.

Both open projects are valuable because they publish methods and limitations that can be examined. They deserve reproduction and extension, not conversion into marketing slogans. Their numbers should travel with their assumptions.

For ArceApps, I would still prefer an architecture whose behavior I can explain and verify over one with an impressive but opaque percentage. When a coding agent needs to remember why I rejected an option, speed alone is not enough. It needs the **right decision, its context and its source**.

## References

- [agent-memory-bench](https://github.com/hamza-dev-tech/agent-memory-bench), published September 2026 run and methodology.
- [Datapace agent-memory-benchmark](https://github.com/datapace-ai/agent-memory-benchmark), code and baselines.
- [Datapace pilot results](https://github.com/datapace-ai/agent-memory-benchmark/blob/main/results/README.md), ten-question report.
- [Mem0](https://github.com/mem0ai/mem0), [Letta](https://github.com/letta-ai/letta), [Graphiti](https://github.com/getzep/graphiti) and [LangMem](https://github.com/langchain-ai/langmem), original projects.
- ArceApps background: [Mem0 and Letta](/blog/mem0-memgpt-agent-memory-stack/), [Graphicle](/blog/graphicle-code-memory/) and [persistent memory](/blog/ai-agent-memory-persistence-guide/).

**Closing thought.** Before trusting a benchmark score, ask what was remembered, when it was remembered, how it was graded and what happens after the fact changes. That discussion is more valuable than cheering the winner of the next table.
