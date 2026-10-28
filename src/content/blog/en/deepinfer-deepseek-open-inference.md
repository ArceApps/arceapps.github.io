---
title: "DeepInfer: what DeepSeek released and what is missing"
description: "Explore DeepInfer from DeepSeek: optimized kernels, MoE parallelism, deterministic inference, hardware requirements, and self-hosting limitations."
pubDate: 2026-10-24
lastmod: 2026-10-28
author: "ArceApps"
keywords: ["DeepInfer","DeepSeek","LLM inference","model serving","DeepSeek-V4.1-Flash"]
canonical: "https://arceapps.com/blog/deepinfer-deepseek-open-inference/"
heroImage: "/images/deepinfer-deepseek-open-inference.svg"
tags: ["DeepSeek", "Inference", "Open Source", "LLM Infrastructure"]
reference_id: "51090420-0240-4092-99fb-27dbebd013fa"
---

Releasing model weights and releasing the software that serves those weights are two different kinds of openness. The first allows people to inspect and, subject to licensing and hardware, run a model. The second shows how engineers address some of the hardest problems involved in running that model efficiently at scale. This is what makes [DeepInfer](https://github.com/deepseek-ai/DeepInfer), DeepSeek's newly open-sourced inference framework, noteworthy.

Its official description says DeepInfer powers DeepSeek's large-scale production services. But another sentence changes the practical interpretation: **this release provides offline inference and important components for serving at scale; it does not include everything required for a complete production service**.

That distinction matters to anyone considering self-hosting. DeepInfer is also separate from [DeepSeek Harness](/blog/deepseek-harness-everything-plugin/), which concerns agents, tools, plugins, and execution orchestration. DeepInfer operates underneath: it is infrastructure for running model inference.

## What DeepSeek has released

The official repository, [deepseek-ai/DeepInfer](https://github.com/deepseek-ai/DeepInfer), is licensed under **Apache 2.0**. At the time of this article, it documents support for one model: **DeepSeek-V4.1-Flash**. Supported hardware is **NVIDIA SM100 GPUs** and **Huawei Ascend 950 NPUs**. This is not a universal runtime that can be installed on any laptop with any model.

The release includes optimized kernels; attention and mixture-of-experts parallelism; speculative decoding mechanisms; asynchronous scheduling; batch-invariant inference; deterministic sampling; and structured outputs.

That list is easier to appreciate after breaking down what happens when a request becomes generated tokens.

## Inference is a system of competing bottlenecks

An autoregressive model typically processes the input tokens first, then generates output tokens. The initial processing is usually called **prefill**; subsequent generation is **decode**. The computational behavior differs: prefill can exploit parallel computation over many tokens, while decode advances sequentially and is especially sensitive to memory movement and retained state.

Serving multiple users adds scheduling challenges. The system must combine requests without wasting capacity. It also has to coordinate model parameters, intermediate activations, KV cache, communication between accelerators, and verification when speculative decoding is used.

No single magical kernel solves all this. A real serving system is an interplay of computation, memory, communication, and scheduling. DeepInfer makes much of that engineering visible.

~~~text
                 Requests
                    |
                Scheduler
                    |
                  Prefill
                    |
         Attention / MoE experts
                    |
                  Decode
           /          |          \
        draft      verify        output
                    |
                New tokens
~~~

This diagram illustrates the general process; it is **not a literal description of every DeepInfer process**. The implementation covers important components but does not supply an entire turnkey serving stack.

![Four-stage infographic about deepinfer deepseek open inference](/images/blog/diagrams/deepinfer-deepseek-open-inference-en.svg)

*Original ArceApps explanatory diagram, not a screenshot or measured result.*

## Optimized kernels: why details matter

The README names **FlashMLA, DeepGEMM, DeepEP, TileKernels, DeepSelect, and custom TileLang kernels**. They target different parts of computation and communication.

With very large models, performance depends on more than the theoretical compute power of an accelerator. Hardware can sit idle waiting for memory, communication, or badly scheduled work. Attention, matrix multiplication, and distributed communication need to be efficient together.

A useful lesson is that **model efficiency cannot be summarized by parameter count or linguistic quality alone**. Two systems running the same model may show dramatically different latency and cost because the inference runtime is different.

That does not justify comparing arbitrary benchmark numbers from different vendors. A fair experiment must hold model, precision, hardware topology, batch size, and input/output lengths constant.

## Parallelism and mixture of experts

DeepInfer documents **Attention DP / balanced CP** and **MoE EP + EPLB**. These refer to parallelizing attention and distributing experts in a Mixture-of-Experts architecture, including mechanisms for load balancing between experts.

In an MoE, different inputs may activate different subsets of experts. Routing can create uneven workloads: some devices perform far more work while others wait. **EPLB** addresses this kind of imbalance.

Think of a workshop with many machines. Owning eight machines does not make production efficient if only two receive work. The analogy is simplistic, but it illustrates why scheduling and load distribution matter as much as peak compute throughput.

This is infrastructure aimed at sophisticated accelerator configurations. It is not primarily a solution for an Android app issuing an occasional inference request.

## DSpark and confidence-scheduled verification

DeepInfer includes **DSpark and confidence-scheduled verification**. Speculative decoding, in broad terms, involves drafting candidate tokens and verifying them so that some sequential generation work can be accelerated.

The README documents flags that enable the feature and control maximum draft length. Those details are model- and implementation-specific; I would not copy them into an unrelated model stack without checking the code and compatibility.

The important point is that **proposing draft tokens does not mean accepting unverified output**. Verification remains part of the decoding mechanism. If checking candidates costs more than they save, the acceleration disappears.

We should also avoid equating higher draft acceptance with better answers. This is a mechanism for efficient generation under specified conditions, not an independent claim that the model's reasoning improves.

## SWA bounded replay

The release also includes **SWA bounded replay**, which aims to reduce decoder prefill work by replaying a bounded suffix when the model's attention properties permit it. The documented defaults are tied to V4.1, and the retained suffix must cover the sliding attention window plus any required backtracking.

This is a useful general engineering pattern: when architectural dependencies have known bounds, the runtime can avoid recomputing irrelevant history. But the implementation must respect the model's invariants exactly.

It would be misleading to explain this as “just truncate the context”. Naively dropping tokens can change the answer. Proper bounded replay relies on concrete properties of attention and state.

## Batching, determinism, reproducibility

Two less glamorous features may have wide practical value. **Batch-invariant inference** aims to preserve a request's results regardless of which other requests are batched alongside it. **Deterministic sampling** enables reproducible results under the documented parameters and seed conditions.

In a shared service, batch composition changes all the time. If that changes numerical outcomes, reproducing a failure becomes difficult. Batch invariance is useful for debugging, controlled comparisons, and evaluation.

According to the README, these features are **NVIDIA-only** in the current release. Deterministic sampling also requires a specific configuration that disables one speculative-decoding mode and supplies a fixed seed. It is not honest to promise bit-for-bit repeatability on arbitrary devices.

And determinism does not imply correctness. A consistently wrong response is still wrong; it is simply easier to investigate.

## Structured outputs for application developers

The release supports **structured outputs** constrained by regex, JSON Schema, or EBNF grammar. This is valuable when applications expect predictable formats. A document-processing tool, for example, may require a known set of fields rather than free-form prose.

But syntactic compliance and semantic correctness are different problems. A valid JSON object can still contain a fabricated date or the wrong price. A production application must validate business rules and check sources before trusting the content.

Structured generation reduces integration friction; it is not a substitute for domain validation.

## The missing piece: KV cache infrastructure

Now comes the most important limitation for self-hosting. The README explicitly lists what a **complete inference service still needs** and what is **not included** in this release:

1. a **KV cache system**;
2. prefill/decode disaggregation, although most required engine functionality is already implemented;
3. load balancing across data-parallel replicas for prefill and decode.

KV caching retains intermediate attention state so that each new token does not require recomputing all previous attention. Managing this cache for many users, varied context lengths, and dynamically arriving requests is a major serving challenge.

Therefore it would be incorrect to call DeepInfer the full DeepSeek production infrastructure, ready for deployment. The public release opens significant core pieces while explicitly excluding others.

I find that limitation more informative than unverified operational figures repeated in discussion threads.

## Hardware and build requirements

The documentation requires Linux, **Python 3.12**, **GCC 13 or later**, and either **CUDA 13** or **CANN 9.2**, depending on the accelerator. Supported devices are NVIDIA SM100 GPUs and Huawei Ascend 950 NPUs.

After setting up the specified Python environment and compatible hardware, the documented workflow includes:

~~~bash
export DEEPINFER_ACCELERATOR=nvidia
./build.sh
python examples/offline_inference.py
~~~

These are commands taken from the official documentation, **not a benchmark or installation I performed**. Unless a local model path is configured, the example downloads the DeepSeek-V4.1-Flash-1017 checkpoint from Hugging Face on its first run.

For an ordinary consumer laptop or mini PC without the supported accelerators, DeepInfer is **not currently a direct answer to local inference**. Open source does not automatically mean universal hardware support.

## What its benchmarks tell us

The repository includes prefill and decode performance benchmarks using **4 SM100 GPUs for prefill and 64 for decode**, each inside a scale-up domain. Reproduction instructions accompany the measurements.

That topology bears little resemblance to a home workstation. Even if the results are excellent for the intended setting, projecting them onto a consumer RTX card would be unsound. We need matching model architecture, precision, context, batching, and communication assumptions.

It also helps to separate throughput from latency and cost. Maximizing overall accelerator utilization, minimizing one request's delay, and minimizing cost per generated token are related but different goals.

## DeepInfer versus vLLM and SGLang

DeepSeek acknowledges that DeepInfer was originally built primarily on **vLLM**, with additional inspiration from **SGLang** and **TensorRT-LLM**. It is not an invention developed in isolation.

For developers deploying other models or using broadly available hardware, I would still begin by identifying runtimes that explicitly support their model and device. DeepInfer is valuable as a window into DeepSeek's high-performance design, but the current scope is specialized.

A responsible comparison should examine supported models, hardware, KV cache handling, serving APIs, maintenance, performance for the actual workload, and operational complexity—not repository star counts.

## Why this matters even if you never install it

Perhaps its greatest value is **architectural transparency**. We can see how optimized kernels fit into scheduling and parallelism, how batch invariance relates to reproducibility, and why KV cache remains an essential missing component.

Publishing code used in real systems allows informed examination of decisions and limits, beyond marketing slides. It does not mean every developer should adopt the same architecture.

For an indie developer, the useful question is not “should I put DeepInfer inside my app?” It is “what can this code teach us about the cost and constraints behind model APIs, and how might those ideas eventually reach more accessible runtimes?”

## Why an inference runtime resembles a specialized operating system

From an application API, model generation appears simple: send a prompt and receive tokens. At scale, the infrastructure must decide **which request runs next**, where each stage executes, how much state it retains, and how resources are distributed as new users arrive.

Some responsibilities resemble those of an operating system: scheduling concurrent work, managing scarce memory, allocating computational units, and coordinating execution. The analogy has limits, but it helps explain why an inference framework eventually contains many different subsystems.

DeepInfer concentrates on efficient execution of a supported model. It is not a user database, an authentication provider, or a complete API platform. When evaluating self-hosting, I would separate at least three layers: **inference engine**, **request-serving service**, and **platform operations**. The last category includes observability, access control, rate limits, failure recovery, and billing where applicable.

Having a sophisticated runtime does not mean those other layers exist. Nor does it guarantee that the topology can be changed without understanding the framework's constraints. This distinction keeps us from assigning capabilities to DeepInfer that the release itself does not claim.

## KV caching as a shared-resource problem

KV cache deserves a more concrete explanation because it often separates an isolated demo from a usable service. Each generation retains states derived from previous tokens. With one request, managing that state can look straightforward. With hundreds of concurrent sessions, context lengths and lifetimes become very different.

Picture ten users. One submits a hundred tokens, another submits twenty thousand, and a third requests a very long response while others finish quickly. Memory requirements are not uniform. The serving system must decide which states to retain, when to free memory blocks, and how to prevent unusually long sessions from degrading everyone else's experience.

These choices affect throughput and latency. A good policy reduces unnecessary recomputation and uses limited memory efficiently. A poor one wastes capacity, increases memory pressure, and creates unpredictable performance cliffs.

A production KV cache system is therefore not just a dictionary of stored tensors. It is an important piece of serving infrastructure. DeepInfer's explicit acknowledgment that this part is missing from the release should be treated as a serious architectural boundary.

## Inter-accelerator communication is not free

Parallelism helps only while the overhead it introduces remains smaller than the benefit. Splitting model execution across devices can increase capacity, but data must move and execution stages must synchronize. Depending on topology, communication can become the bottleneck.

This is why an impressive performance figure is incomplete without its **physical configuration**. Four accelerators in one tightly coupled domain need not behave like four devices connected by a different network. Interconnect latency, bandwidth, and communication patterns matter.

Mixture-of-Experts models add another complication: routing choices influence which accelerators receive work. Evenly distributing model weights is not enough if actual token routing concentrates activity on a few devices.

DeepInfer documents mechanisms that address these problems. The broader lesson is not that there is one universally best parallelism setting. It is that **runtime choices must be measured against the model architecture and hardware arrangement**.

## Determinism matters for evaluation, not only debugging

Deterministic generation is sometimes presented as a convenience feature, but it is also a scientific tool. If we compare two kernels or scheduling policies, we need to know whether a difference in output was caused by our change or by unrelated variation.

A fixed seed helps, but it may not be sufficient if batching and numerical execution depend on ordering. That is what makes the documented combination of batch-invariant inference and deterministic sampling conceptually important.

Reproducible outcomes make regression tests, incident analysis, and optimization comparisons easier. They also impose a documentation obligation. We need to record **which conditions were fixed**: model checkpoint, weights, hardware, software revision, seed, sampling parameters, and batch organization.

Outside those conditions, saying a model will “always produce exactly the same output” is too strong. Reproducibility belongs to the complete experimental setup, not one convenient flag.

## A practical checklist for selecting a runtime

For an indie application I would not begin with a graph of peak tokens per second. I would begin with **the exact model I need** and the hardware I can actually use. Next I would inspect licensing, memory needs, supported precision, output formats, operational tooling, and behavior under realistic concurrency.

Then I would run small, reproducible load tests. An app with one concurrent user has very different needs from a service handling thousands of sessions. The first may prioritize low operational complexity and good single-request latency. The second may justify elaborate accelerator scheduling and parallelism.

Maintenance matters too. A highly specialized runtime can be the right choice when I intend to run precisely the model it was built for. It may be the wrong choice when my goal is to experiment with many unrelated models every week.

That is why I prefer reading the architecture and limitations of an open-source release before making installation recommendations. Knowing where a tool does not fit is part of understanding its value.

## What the announcement does not prove

We cannot conclude that every user will achieve DeepSeek's operational efficiency. We cannot assume the released code reproduces every part of DeepSeek's deployed service. And we cannot extrapolate its optimizations to arbitrary architectures without measurement.

Some discussion threads repeat figures about enormous daily token volumes or particular hardware costs. Those numbers are **not confirmed by the official DeepInfer README**. They should be treated as third-party claims, not as the foundation for technical decisions.

An open license does not imply commercial support or a promise of future hardware compatibility either. Apache 2.0 enables inspection and reuse under its terms; it does not oblige maintainers to port the runtime to my computer.

What the release does provide is enough information to ask more precise questions. Which subsystem was published? Which constraints are documented? Which benchmarks can be reproduced? What remains missing between a demonstration and a complete service? Those questions will matter even after the current model generation is replaced.

## What a production deployment still has to operate

Even with fast kernels and well-designed parallelism, a real service has concerns that do not appear in a simple offline generation example. It needs to accept requests reliably, enforce authentication and rate limits, expose health and performance metrics, and recover when hardware fails.

Traffic is also uneven. A burst of short prompts can arrive while a few users are running long generations. Different request lengths compete for memory and attention. A robust service must decide how to queue them, apply fairness policies, and avoid exhausting resources during unusual spikes.

That operational layer is one reason a highly optimized inference engine should not be confused with a complete platform. The README's list of missing components provides a concrete boundary, but even supplying those components would not automatically solve every production concern.

Before treating any inference release as deployable infrastructure, I would ask how to monitor queue delays, memory pressure, throughput by request type, failures, and tail latency. Average speed can hide a poor experience for users who happen to arrive during congestion.

I would also want an upgrade and rollback plan. Changing model weights or kernels can alter numerical behavior. When structured output is part of an application contract, a seemingly minor runtime upgrade can affect downstream assumptions. Reproducibility settings and regression fixtures can make such changes safer to evaluate.

## Open-source infrastructure is also an educational resource

There is a productive way to approach this release even without the required accelerators. We can read its architecture and compare the responsibilities of different components. Which operations are model-specific? Which rely on the accelerator architecture? Where do scheduling decisions live? Which parts are necessary for offline inference but insufficient for a shared service?

Those questions help developers reason about LLM infrastructure without assuming that every technique belongs in their own applications. A small local assistant and a global inference service live at very different scales. The principles of explicit constraints and measurable performance still apply to both.

The same caution applies to performance claims from community discussions. Numbers without a reproducible workload, a declared hardware topology, and a documented cost boundary cannot support a sound financial decision. The public code and its documented limitations provide stronger evidence than an isolated anecdote.

For me, the release succeeds as a technical contribution even if it never runs on my computer. It makes a sophisticated part of inference engineering more inspectable and offers a concrete basis for future comparisons.

## Conclusion

DeepInfer reveals much of the work **beneath** an AI API. Serving modern models at scale requires careful engineering of kernels, scheduling, memory, communication, parallelism, and reproducibility. This open-source release shares substantial pieces of that system while acknowledging important omissions.

I would neither sell it as a complete production server nor recommend it indiscriminately for local inference. It is a technically significant, specialized release that helps explain how large-scale model serving actually works.

### References

- [DeepInfer — official repository and documentation](https://github.com/deepseek-ai/DeepInfer).
- [DeepInfer — evaluation documentation](https://github.com/deepseek-ai/DeepInfer/tree/main/eval).
- [DeepSeek Harness: everything is a plugin](/blog/deepseek-harness-everything-plugin/).
- [DeepSeek Harness Desktop: analysis](/blog/deepseek-harness-desktop/).

Sometimes the most revealing part of an open-source announcement is not what it includes, but its precise list of what is still missing.