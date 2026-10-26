---
title: "Coucou: agent approvals beyond the terminal"
description: "A technical research diary on how Coucou connects coding agents, desktop alerts and mobile approvals, and where its safety boundaries matter."
pubDate: 2026-10-26
lastmod: 2026-10-26
author: "ArceApps"
keywords: ["Coucou", "AI coding agents", "Claude Code", "Codex", "Android"]
canonical: "https://arceapps.com/devlog/2026-w44-coucou-agent-supervision/"
heroImage: "/images/devlog/coucou-agent-supervision.svg"
tags: ["devlog", "AI", "coding agents", "Open Source", "Android", "Linux", "security"]
draft: false
reference_id: "coucou-agent-supervision-2026-w44"
---

The command that starts an AI coding session is usually the shortest part of the experience. The agent reads files, plans edits, invokes tools and moves through a repository. Then, just as you begin doing something else, it stops to ask a question. May it run this command? Should it choose the first implementation? Can it use a particular capability?

I do not want agents to stop asking those questions. Permission boundaries matter. What I would like to avoid is the small ritual that follows every question: find the terminal, identify which session is waiting, reconstruct the context and respond before getting back to whatever I was doing.

That is why I spent time examining [Coucou](https://github.com/Louis-CFM/coucou). This is **not an ArceApps project**, and this entry is **not a claim that I installed, used or benchmarked it**. It is a technical research diary based on the project's public documentation and documented architecture as available on **October 26, 2026**. The question is narrower than a conventional product review: can we keep an AI agent's long-running execution separate from the few human decisions that unlock it, without turning a phone into an unsafe remote control?

Coucou, created by Louis Raillé, tries to put a small observation and interaction layer at the top of the desktop. Its companion character, Mochi, represents live sessions from Claude Code, Codex, Gemini CLI, Cursor, OpenCode, Amp, Hermes and other tools. It can show progress, present supported approval requests, expose file changes and, with the right desktop/mobile combination, let a phone handle selected interactions. Rhytam Biswas contributed the Android app and phone-link implementation.

By October 22, the changelog listed 0.5.3 releases across macOS and Windows/Linux, with Android at 0.3.0. That pace is worth remembering. A capability announced in the Mac build may not exist in Linux; something available in the Android companion may be absent on iPhone, or use a very different transport. This article treats those distinctions as part of the design rather than inconvenient footnotes.

## The real issue is interruption, not a lack of dashboards

Coding assistants are good at starting work. We give them a prompt, choose a model and watch the first few steps. The hard part appears once two or three sessions run concurrently. One is editing a component. Another is investigating a test failure. A third has paused for a tool approval. Without a shared status surface, the human operator needs to visit each session to discover which one is working and which one needs help.

There are two different jobs here. The first is **observation**: show enough state to tell working from waiting, finished from failed. The second is **intervention**: send a decision back to exactly the request that is still pending. A small state indicator may solve the first. The second involves authority, identity, time and validation.

Coucou attempts both without demanding that the work itself move into its interface. On macOS it sits around the notch; on Windows and Linux it draws an island along the upper screen edge. The user can keep working in an editor while monitoring what the agents are doing. The intended interaction is brief: see the event, inspect a relevant detail, answer if appropriate, return to work.

That makes it a different proposition from a full agent cockpit. I previously discussed visual agent environments in the [OpenChamber, Paseo and mobile frontends comparison](/blog/openchamber-paseo-comparative-2026/). Those tools are often evaluated by their ability to host conversations, manage sessions, expose workspaces and coordinate workflows. Coucou is most interesting when the underlying execution environment stays where it already is.

This is not a minor distinction. If the problem is project coordination, a notch widget will not magically provide queues and task dependencies. If the problem is being interrupted for a two-second answer, a powerful dashboard may be the wrong amount of interface.

## One visual idea, several very different applications

The first important finding is architectural. Coucou does not ship one identical cross-platform shell and pretend every operating system works the same way. The repository describes separate implementation choices for macOS, Windows/Linux, iPhone and Android.

The **macOS** app uses Swift 6, SwiftUI and AppKit. Its island is a borderless native panel following a small presentation state machine. Mochi is drawn with Canvas and TimelineView, with animations generated in code rather than from bundled character videos. The README describes a native core without third-party dependencies. That should not be taken to mean every optional feature is dependency-free; offline transcription, for instance, uses FluidAudio and an additional Parakeet model download.

On **Windows**, the application is built with Tauri 2, Rust and TypeScript. The island is a transparent, always-on-top window intended not to steal keyboard focus. Mochi uses Canvas 2D, recreating a consistent visual language with a different rendering implementation. A small executable relays Claude Code hooks through a Windows named pipe.

On **Linux**, Coucou shares the Tauri codebase with Windows but runs into Linux-specific windowing realities. Compositors that support layer-shell can anchor the island to the screen edge. The README describes an XWayland dock-window fallback for GNOME. An event relay communicates over a Unix socket in the user's XDG runtime directory, while secrets use the system's Secret Service. Those details determine whether the little island behaves like a helpful status surface or an irritating window that gets in the way.

The **Android** companion is a native Kotlin and Jetpack Compose application. It does not move the developer's running coding agent to the phone, nor is it meant to carry the desktop's API credentials. It connects to an explicitly enabled phone-link server in the Windows/Linux app. The **iPhone** companion takes an entirely different route through iCloud and CloudKit to the Mac.

There is a lesson in that split. A coherent experience does not necessarily imply one uniform transport or framework. Native integration can produce better behavior, but it comes with a maintenance burden: platform permissions, UI shells, data synchronization and availability matrices. The user-facing simplicity has to earn that engineering complexity.

## Hook events are a better foundation than guessing from pixels

At a glance, Coucou might seem to watch the terminal and infer what the agent is doing. The documentation describes something more deliberate: coding agents emit structured **hook events**.

On the Mac, a lightweight relay receives events and forwards them over a Unix socket to the running app. Windows uses a named pipe. Linux uses a local socket scoped to the user's runtime directory. Coucou associates incoming events with a named agent and session, then updates the corresponding state in its interface.

That is an important architectural choice. Polling a screen and trying to interpret changing text is brittle. A structured event can say which session changed, what kind of step occurred and whether an interaction is required. The event stream is still only as good as the agent's hook support, but it provides an explicit interface rather than visual guesswork.

The repository even describes a third-party extension convention: an optional *coucou_agent* field can identify another agent. The documented identifier accepts lower-case letters, digits and hyphens within a short length limit. A developer can send events to the relay and have a separate pill represent an in-house tool.

But there is a critical distinction between **displaying events** and **approving commands**. Generic third-party event integration is not equivalent to first-class permission control. The integration guide documents restrictions for approvals from arbitrary agents, while the top-level README describes dedicated support for Codex and other known integrations. The correct conclusion is not that any custom agent automatically gains remote approval support.

One small operational detail is especially reassuring: the README states that hooks return immediately when Coucou is not running, so Claude Code is not held hostage by a closed companion app. An optional observer should not become a single point of failure for the development workflow. That graceful degradation is a design requirement I would want in any similar tool.

## What an approval actually authorizes

Putting an Allow button on a notification is easy. Ensuring it authorizes the right operation is much harder.

The [Android Link protocol](https://github.com/Louis-CFM/coucou/blob/main/docs/ANDROID_LINK.md) contains concrete rules rather than vague promises. The desktop associates an approval with a SHA-256 fingerprint derived from the agent pill, session, tool, command and an input-specific request identifier. In the Windows/Linux implementation, even two identical commands submitted at different moments produce different request identities.

The phone sends an allow-or-deny decision linked to that fingerprint. The desktop must match it against the **approval still pending at that exact moment**. A delayed response to an expired request is ignored. A decision for another command is ignored. A response cannot simply be applied to whichever approval happens to be visible now.

The documented approval lifetime is around two minutes, with the desktop removing the request slightly before the upper limit. Approving requires a biometric check or the phone's configured screen lock; denying does not. The command itself is hidden from the lock screen. If the command is too long to display fully, the phone marks it as truncated and offers Deny only. The user must return to the desktop to review and allow the complete operation.

This is the sort of constraint that can sound fussy until it prevents a real mistake. A short preview should not be enough to authorize an unseen suffix of a command. A lock-screen notification should not expose a private repository path. A green button should not retain authority long after the original question stopped being relevant.

None of that makes a dangerous command safe. Binding a response to the right request solves an identity problem, not an intent problem. A correctly authenticated deletion command can still be catastrophic. What Coucou's protocol does, at least on paper, is limit accidental cross-request approvals and reduce the authority of stale notifications.

## Android's direct link: local networking with explicit pairing

The Android implementation deserves closer examination because it illustrates how to move selected decisions off the desktop without outsourcing the whole workflow to a cloud service.

The normal pairing flow requires Coucou on **Windows or Linux**, with the phone on the same local network. The published Android requirements include Android 11 or newer and a compatible recent desktop build. The basic link is an opt-in server. It is not enabled merely because someone installed the app, and it is not the macOS-to-iPhone mechanism repackaged.

Transport uses TCP with TLS 1.2 or 1.3. The desktop generates a self-signed certificate. Its pairing QR includes the desktop address, port, certificate fingerprint and a shared secret. Instead of trusting every certificate that a device on the LAN presents, Android pins the exact certificate established during pairing. The secret is stored using Android Keystore.

Messages are UTF-8 newline-delimited JSON with typed actions and explicit size limits. Session updates, approvals, decisions, pings and resolution events each have their own message form. This is pleasantly unglamorous engineering: a protocol that can be inspected and tested without requiring an opaque binary stream for simple state changes.

There is also **capability negotiation**. Extra features such as chat, session details, answers and diffs are optional. A phone that does not request a capability should not receive the corresponding sensitive information. A desktop setting must enable those features separately; the documentation describes some as off by default and rechecked per connection.

This is data minimization applied at protocol level. Session summaries can expose recent steps but omit full paths, complete prompts and command output in the limited details capability. Diff retrieval requires its own capability and request, with bounded lines and rate limits. The phone should not receive every byte of the desktop session simply because a status widget needs to know that an agent is waiting.

The project also documents an Internet-relay path separately from the basic LAN link. That matters for accurate expectations. Saying that Coucou necessarily works from anywhere is unsupported by the local transport design. Saying that it has no concept of remote access is too broad given the additional documentation. Any external relay should be assessed independently, including deployment, trust and network exposure. This research concentrates on the direct local link.

## iPhone follows a different trust and synchronization model

The iPhone route is not just the Android app written in Swift. According to the project's documentation, the Mac publishes sessions, turns and service state to a private CloudKit zone under the user's iCloud account. The iPhone reads that state and writes back supported decisions or instructions. The Mac still checks whether an incoming answer matches the action it is waiting for.

Live Activities introduce another component. Coucou describes a stateless Cloudflare Worker that sends APNs updates using limited agent state rather than the full content of the session. That is a sensible separation of duties, though the precise privacy guarantee would require auditing the deployed worker, the mobile client and the data that is actually transmitted.

This model offers different trade-offs. iCloud identity and synchronization avoid the Android-style LAN pairing procedure, while making Apple services part of the control path. Android's direct link avoids that dependency for basic local use, but requires an reachable desktop and its own TLS pairing. Neither architecture should be called inherently superior without specifying availability, security assumptions and failure modes.

Distribution channels complicate the picture further. The iPhone documentation refers to a TestFlight beta and features that depend on the GitHub build of the Mac application. The macOS App Store build has sandbox-related restrictions on some integrations. A checklist for a real deployment must therefore include operating system, Coucou version, package channel and the exact agent being supervised.

The broad marketing summary—“approve from your phone”—is useful as an introduction. It is not a substitute for that matrix.

## Linux and Android are the pairing worth testing

For a Linux-first development setup with an Android phone, the relevant configuration is Coucou on Linux plus its native Android companion. The Mac notch screenshots are visually memorable, but they are not a guide to whether the GNOME overlay works well on an Ubuntu machine.

The Linux distribution options documented by the repository include an AppImage and deb/rpm packages. An AppImage can be convenient for an isolated trial; a deb package fits a standard Ubuntu installation. The project publishes SHA-256 checksums for release files. Checking a downloaded artifact is basic release hygiene, although a matching checksum should not be mistaken for a full audit of the program that produced it.

GNOME behavior is the first question I would investigate. The Linux README distinguishes layer-shell compositors from the XWayland fallback. Desktop scaling, multiple monitors, global shortcuts, focus management and notifications are exactly the areas where a small overlay can turn from delightful to disruptive. Those need hands-on testing under the real window manager, not an assumption based on screenshots from another operating system.

The second concern is lifecycle behavior. Does a pending request expire cleanly when the computer suspends? Does the phone drop a stale notification after reconnecting? What happens if the desktop application is closed while the agent continues running? The documented identity and expiry rules are promising, but documentation is not runtime evidence.

Hermes appearing in the supported-agent list is another reason to look more closely. It suggests that Coucou is not limited to the two most visible commercial coding tools. Yet an integration label does not prove that all Hermes workflows, especially approval flows, have identical behavior. Session observation, event coverage and actionable approvals must be checked separately.

A disciplined trial would use one agent and one harmless approval first. Adding five integrations at once makes it much harder to identify which layer is failing.

## The awkward expansion from status widget to personal desktop hub

Coucou's release history tells a second story: feature expansion. By October 2026 the project had moved beyond simple agent indicators into dictation, note-taking, conversations with cloud and local models, usage counters, service cards and an experimental WhatsApp gateway.

The expansion has an understandable logic. A compact attention surface can be a useful place for several short interactions. Checking deployment status, acknowledging a question and starting dictation all benefit from avoiding a full application switch. Once the island works, it becomes tempting to route every small action through it.

But not all small-looking actions have small security consequences. A read-only status pill is different from an email operation. Local dictation is different from sending corrected text to a remote model. Viewing a WhatsApp conversation through an unofficial Web-protocol gateway introduces another service, another process and another trust boundary.

The README identifies operating-system credential stores: Keychain on macOS, Credential Manager on Windows and Secret Service on Linux. Those are appropriate places to keep API credentials. They do not, on their own, tell us what happens to prompts, file names, selected windows, meeting audio or command previews after a feature is enabled.

This is why I would keep the first evaluation tightly focused on coding-agent supervision. The optional integrations may be useful in their own right; they should not obscure the minimum feature set or encourage granting unrelated permissions before the core value is proven.

The real product-design question is not how many pills fit above the screen. It is whether each additional pill comes with understandable defaults, limited scope and an honest account of the information it sends elsewhere.

## Dictation demonstrates the importance of data boundaries

Flow is one of the larger additions. On compatible Apple silicon Macs, the documented setup can download a Parakeet speech-recognition model, using FluidAudio to perform offline transcription. The README gives a download size of roughly 650 MB. The feature can paste dictated text into the active application and offers dictionaries, replacements and optional post-processing.

The separate Notetaker can record audio from meetings and turn speech into transcripts and summaries. The documentation tells users to notify participants when recording. Some follow-up processing may use the selected AI provider or local platform features, so it is important to distinguish speech recognition from everything that happens after recognition.

Windows and Linux release notes list Flow dictation and Notetaker among their 0.5.0 additions, with X11 and Wayland support mentioned for Linux. That does not mean each platform uses the same capture stack, permissions or recognition model configuration as macOS. Feature-name parity and implementation parity are different things.

I have not measured transcription quality, memory use, latency, or behavior in Spanish. A claim that it is better than another dictation tool would require controlled recordings on the same device and microphone. The documentation is enough to explain the proposed experience, not enough to assign a performance score.

This reinforces a broader principle: “offline” describes a particular stage, not necessarily the entire feature. Once a transcript is handed to a cloud summarizer or rewritten using an API key, the data boundary has changed. Good software should make that change easy to identify before the user enables it.

## Why expiry matters more than delightful animations

Consider a deliberately hypothetical example. An agent asks permission to delete a temporary folder. The user sees the phone notification but does not respond immediately. The desktop request times out, and the agent moves on to another question. A minute later, the user opens the notification and taps Allow.

An unsafe implementation might treat that click as approval for the currently active operation. The UI could look polished and still commit a serious control-flow mistake. The issue is not notification delivery speed; it is whether the system preserves the identity and lifetime of each request.

Coucou's documented protocol attempts to prevent that mistake. Requests carry a fingerprint, have an expiration window and can be explicitly resolved by the desktop. The desktop only accepts a matching response while the original request remains pending. When a question is answered somewhere else, a resolution event tells the phone to remove its obsolete card.

This is a reusable pattern well beyond AI coding. Deployment gates, administrative confirmations and automated operations all need scoped human authorization. A remote approval should refer to one operation under one set of conditions. The phone is a voting surface for an existing request, not a general-purpose command source.

There is still no substitute for judgment. A 500-character command preview can be complete but fail to explain side effects. A harmless-looking tool call can modify data indirectly. For high-risk operations, the responsible response may be to deny from the phone and inspect the complete context at the workstation.

Making it convenient to approve should not make it socially or technically difficult to refuse.

## A watcher, a supervisor and an orchestrator do different jobs

Part of evaluating new coding tools is resisting imprecise labels. The ecosystem calls all kinds of products “agent dashboards,” even when their responsibilities differ sharply.

A **watcher** renders state. A **supervisor** makes relevant requests visible and can route restricted decisions. A **client** hosts a conversation or provides direct access to a provider's sessions. An **orchestrator** schedules work, coordinates dependencies, may manage several agents and carries execution policies. Some products blend these roles, but they remain different responsibilities.

From the repository and documentation examined here, Coucou's clearest strength is the watcher/supervisor layer. It also includes chat and integration features. I did not find evidence that it is intended to replace a project's issue tracker, source-control review process, CI, planning system or underlying agent runtime.

That matters when comparing it with OpenChamber, Paseo or other remote agent interfaces. If someone needs a browser-based environment for long-running multi-project sessions, Coucou alone may not address their main problem. If they need an unobtrusive way to recognize an agent's state and answer a limited request, its design is much closer to the target.

Could the two types of tool coexist? Possibly. But running overlapping observers can duplicate notifications, and having two surfaces capable of answering permission requests raises questions about which response wins. That coexistence is a hypothesis to test, not an integration I can claim to have validated.

In short, using Coucou should not be confused with delegating the whole workflow to it. It is designed to sit alongside the tools that actually perform the work.

## Open source code does not mean an open character license

There is a licensing detail worth calling out because the most memorable feature is a character rather than a technical diagram.

Coucou's source code is published under MIT terms. The Android contribution and phone-link code have their own authorship notices and MIT license coverage. This enables developers to inspect, modify and learn from the implementation while respecting the license obligations.

The project's **name, Mochi character, icon, sounds and other brand assets** are subject to a separate rights-reserved asset license. Forking the code does not automatically grant permission to redistribute the same mascot or present a derivative application as the original product. The maintainers explicitly ask distributed forks to use a distinct identity.

This distinction matters for independent developers who enjoy learning from attractive open-source interfaces. Architecture, protocol design and implementation techniques can be studied without cloning someone else's brand. A faithful technical article should preserve the same boundary.

The illustration attached to this devlog is therefore an original geometric interpretation of a desktop-to-phone approval flow. It does not reuse Mochi artwork or project assets. The image expresses the design problem rather than borrowing the product's identity.

## What a meaningful hands-on evaluation would look like

Researching source documents is useful, but it cannot answer the questions that decide whether a companion tool deserves a permanent place in a daily workflow. I would approach the next phase as a small, reversible experiment.

First, install an official Linux release and verify the published checksum where available. Record basic behavior under the actual desktop environment: idle CPU usage, display scaling, whether the island steals focus, whether notification sounds are predictable and whether the app cleanly handles a second monitor. The repository's Linux notes identify compositor-specific differences; those should be test cases rather than overlooked footnotes.

Second, connect **one** supported coding agent. Observe ordinary execution, file-change events, waiting states, completion and cancellation. It is important to distinguish a missing hook event from an island rendering issue. A successful agent run with no visible pill is not necessarily an agent failure.

Third, pair an Android device using the documented local link. A harmless approval should test both Allow and Deny, including screen-lock authentication. Then deliberately allow a request to time out and verify that an old phone action cannot authorize a new desktop operation. These are control-flow tests, not penetration tests, but they exercise the most interesting contractual claims.

Fourth, enable optional session details and diffs **one at a time**. Check what file names, command fragments and code changes become visible on the mobile screen. Review the defaults and confirm that disabling the feature actually stops the extra information flow. If the test includes cloud providers, use disposable credentials rather than real project secrets.

Finally, repeat the basic scenario after closing the companion, suspending the computer and reconnecting the network. Software meant to reduce interruptions must be reliable when life interrupts it. The happy-path demo matters less than how an abandoned or delayed approval is resolved.

Until those tests have been performed, I would not publish a latency graph, compatibility score or sweeping reliability verdict. The architecture looks worth testing; the runtime quality remains unmeasured here.

## The design idea worth keeping

The most interesting part of Coucou is not Mochi's animation or the notch. It is the effort to keep **execution, observation and limited human authorization** in separate places.

The coding agent continues to run in the environment it already owns. A local relay turns its events into a compact, understandable state. A mobile companion can receive selected information and send an answer identified with one exact pending request. The desktop remains responsible for deciding whether that answer is still valid. The phone does not need the coding agent's entire runtime or the provider's API key to play that role.

There is substantial engineering behind this apparently lightweight interaction: native UI shells, different desktop transports, secure credential storage, TLS pairing, request fingerprints, expirations and deliberately scoped data sharing. The complexity is justified only if it disappears from the ordinary experience without weakening the safety contract.

My provisional assessment is therefore positive about the **architecture**, not an unconditional installation recommendation. Coucou documents sensible measures for observing agents and answering approvals, and Linux–Android deserves a focused real-world trial. It does not remove the need for terminal access, careful reviews or trustworthy automation boundaries.

Perhaps the next useful improvement in AI-assisted development is not granting agents ever broader permission to act without us. It may be making the rare moments when they genuinely need human judgment shorter, clearer and safer. That is the problem Coucou sets out to solve—and why its implementation is worth studying.

## References and further reading

- [Coucou source repository, overview and releases](https://github.com/Louis-CFM/coucou).
- [Changelog and release history](https://github.com/Louis-CFM/coucou/blob/main/CHANGELOG.md).
- [Third-party coding agent integration](https://github.com/Louis-CFM/coucou/blob/main/docs/AGENTS.md).
- [Android Link protocol and approval rules](https://github.com/Louis-CFM/coucou/blob/main/docs/ANDROID_LINK.md).
- [Coucou for Android documentation](https://github.com/Louis-CFM/coucou/blob/main/android/README.md).
- [iPhone integration and CloudKit](https://github.com/Louis-CFM/coucou/blob/main/docs/IPHONE.md).
- [Brand and asset licensing](https://github.com/Louis-CFM/coucou/blob/main/LICENSE-ASSETS.md).
- [Official Tauri 2 documentation](https://v2.tauri.app/).
- [Earlier OpenChamber, Paseo and agent frontend comparison](/blog/openchamber-paseo-comparative-2026/).

*Method note: this is a document- and architecture-based examination of a third-party project. No Coucou binaries were run, no formal protocol audit was carried out, and no device performance measurements are claimed.*
