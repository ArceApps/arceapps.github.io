---
title: "A2UI 1.0: How AI Agents Generate Native UI on Android with Jetpack Compose"
description: "A2UI 1.0 lets AI agents generate interactive native UI instead of plain text. Learn how the open protocol works and how to render agent-generated interfaces on Android with the Jetpack Compose A2UI renderer."
pubDate: 2026-11-19
lastmod: 2026-11-19
author: ArceApps
keywords: ["A2UI", "Jetpack Compose", "AI Agents", "Android", "Native UI", "Kotlin", "Google"]
canonical: "https://arceapps.com/blog/a2ui-jetpack-compose-agent-generated-ui-2026/"
heroImage: /images/placeholder-article-a2ui-compose.svg
tags: ["AI", "Android", "Kotlin", "Compose", "A2UI"]
category: android-kotlin
reference_id: 80559870-c398-4660-8684-01514e5ce2af
---

## 🤖 The Wall of Text Problem

If you have built an AI agent into a mobile app, you already know the frustration. You ask the agent to "book a flight to Barcelona next Friday," and instead of giving you a button you can tap, it replies with a 400-word paragraph listing options, prices, and confirmation links. The user has to read, parse, and act on text. That is the **wall of text** problem, and it is the single biggest UX bottleneck in agent-driven apps today.

**A2UI 1.0** solves it. Released by Google on November 11, 2026, A2UI (Agent-to-UI) is an open protocol that lets an AI agent describe *what* to show on screen, while the client app decides *how* to render it using its own native components. The agent never ships code. It ships a declarative description of a UI, and the app renders it with Jetpack Compose, SwiftUI, Flutter, or React — natively, with full platform fidelity.

In this article we will unpack the protocol, walk through the new **Jetpack Compose A2UI renderer** (`1.0.0-alpha02`), and build a small agent-generated form end to end in Kotlin. Note: the Kotlin snippets below are **illustrative pseudocode** — the real AndroidX API names differ (see the official integration guide). The JSON payloads follow the A2UI v1.0 wire format, which Compose will support once the renderer reaches v1.0.">

---

## 🧩 What is A2UI?

A2UI is a **declarative, JSON-based UI protocol** for agent-driven interfaces. Think of it as a shared contract between two sides:

- **The agent** (server side, usually Python/TypeScript/Dart) decides that the user needs a form, a chart, or a confirmation card. It emits a small JSON payload describing the components and their data.
- **The renderer** (client side, running on the device) receives that payload and instantiates native widgets from a pre-approved **component catalog**.

Three ideas make this powerful:

1. **Native rendering, not web rendering.** The agent describes a "button" semantically. The Compose renderer turns it into a real `Button` composable with your Material 3 theme, your typography, and your ripple. No WebView, no HTML, no CSS.
2. **No arbitrary code execution.** The agent cannot run JavaScript or ship a binary. It can only reference component types that the renderer already knows about. This is the security foundation of the whole protocol.
3. **Decoupled branding.** The agent never hardcodes colors, fonts, or spacing. It says "primary action button" and the renderer applies the app's design system. The same agent payload looks like your app on Android and like a different app on iOS.

> 💡 **Mental model:** A2UI is to agent UI what JSON is to REST APIs — a neutral, declarative wire format that both sides agree on, with the client keeping full control over presentation.

---

## 🏗️ Architecture: The Component Catalog Contract

The heart of A2UI is the **component catalog**. A catalog is a registry of component types the renderer knows how to draw, each with a JSON schema describing its props. The agent and the renderer must agree on a catalog before any UI can flow.

```text
┌─────────────────────┐         A2UI JSON          ┌──────────────────────┐
│   AI Agent          │  ───────────────────────▶  │  Compose Renderer    │
│  (Python/TS/Dart)   │  createSurface / update…   │  (Android client)    │
│                     │                            │                      │
│  Uses only types    │  ◀───────────────────────  │  Renders with M3     │
│  declared in catalog│   function calls / events  │  components          │
└─────────────────────┘                            └──────────────────────┘
        │                                                    │
        └────────────── shared catalog = contract ───────────┘
```

Key architectural pieces:

- **Surface.** A surface is the canonical container for a piece of agent UI. Every surface has a `child="root"` entry point. You can have multiple surfaces (e.g., one for a chat bubble, one for a modal).
- **Adjacency list.** Components reference each other by ID, not by nesting. A `Column` lists its children as `["title", "subtitle", "cta"]`. This flat structure makes diffs, patches, and streaming trivial.
- **Progressive rendering.** If a component references an ID that has not arrived yet, the renderer shows a placeholder instead of crashing. This is what makes streaming UI feel smooth.
- **`catalogId`.** A string (conventionally a URI) identifying which catalog the payload targets. The renderer validates that it supports that catalog before rendering anything.

The agent is **constrained**: it may only emit component types present in the catalog. If it hallucinates a `MagicChart` that does not exist, the renderer drops it and reports an error back to the agent for self-correction.

---

## 📨 The A2UI Message Protocol

A2UI 1.0 defines four core messages that flow from agent to renderer:

| Message | Purpose |
|---|---|
| `createSurface` | Creates a surface, optionally with initial `components` and `dataModel` |
| `updateComponents` | Adds or replaces components in a surface (adjacency list) |
| `updateDataModel` | Patches data at a JSON Pointer path |
| `deleteSurface` | Removes a surface and its components |

And four bidirectional function-call messages for interactivity:

| Message | Direction | Purpose |
|---|---|---|
| `callRendererFunction` | agent → renderer | Ask the renderer to do something (e.g., show a toast) |
| `callAgentFunction` | renderer → agent | User action triggers an agent tool call |
| `rendererFunctionResponse` | renderer → agent | Result of a renderer function |
| `agentFunctionResponse` | agent → renderer | Result of an agent function |

Two protocol details worth knowing:

- **Single-message instantiation.** `createSurface` can carry both `components` and `dataModel` in one message, so an entire form can appear in a single frame.
- **Reliable delivery.** Messages arrive in order. The renderer applies them sequentially, which keeps state predictable even over flaky networks.

Envelope keys are prefixed with `@` (`@catalogId`, `@accessibility`, `@metadata`, `@checks`), and dynamic bindings use `@` too (`@path` for data binding, `@call` for function calls). Naming follows strict Unicode rules (UAX #31), so component IDs are safe to use as identifiers across languages.

---

## 📱 Jetpack Compose A2UI Renderer

On October 21, 2026, Google shipped the **Jetpack Compose A2UI renderer** as `1.0.0-alpha02`. It targets **A2UI spec v0.9.1** (v1.0 spec support for Compose is coming soon) and is built on top of Compose's Snapshot state system, which gives it high reactivity: when the data model changes, affected composables recompose automatically.

### Artifacts

```kotlin
// build.gradle.kts (app module)
// Make sure the Google Maven repository is available (usually in settings.gradle.kts)
dependencies {
    implementation("androidx.compose.material3:material3-a2ui:1.0.0-alpha02")
    implementation("androidx.a2ui.compose:compose-runtime:1.0.0-alpha02")
    implementation("androidx.a2ui.compose:compose-ui:1.0.0-alpha02")
    implementation("androidx.a2ui:a2ui-model:1.0.0-alpha02")
    implementation("androidx.a2ui:a2ui-engine:1.0.0-alpha02")
}
```

The **Basic Catalog** ships Material 3 components (`Button`, `Text`, `Column`, `Row`, `TextField`, `Card`, `Image`, …) via `material3-a2ui`, so you get a working UI out of the box. For your own design system, you can register a **custom catalog** with your own composables.

### Key capabilities

- **Schema validation.** Every incoming payload is validated against the catalog schema *before* it touches state models. Malformed payloads are rejected, not rendered.
- **Graceful hallucination handling.** Unknown component types are skipped and reported; the rest of the surface still renders.
- **Auto-reporting errors to the agent.** Validation failures and render errors are sent back as function calls, letting the agent self-correct on the next turn.
- **Reactive data binding.** `updateDataModel` patches flow straight into Compose state, triggering recomposition only where needed.

---

## 🛠️ Implementation: A Working Agent-Generated Form

Let us build a minimal example: an agent generates a "confirm booking" form, the user fills it, and tapping submit calls back into the agent.

### 1. Set up the renderer host

```kotlin
// BookingScreen.kt
@Composable
fun BookingScreen(
    agentClient: AgentClient,
    modifier: Modifier = Modifier,
) {
    val engine = rememberA2UIEngine(
        catalog = Material3BasicCatalog,
        onAgentFunctionCall = { call ->
            // Forward user actions to the agent
            agentClient.callFunction(call)
        },
    )

    // Collect the agent's UI stream
    val surfaces by engine.surfaces.collectAsState()

    Column(modifier = modifier.fillMaxSize().padding(16.dp)) {
        surfaces.forEach { surface ->
            A2UISurface(surface = surface, engine = engine)
        }
    }

    // Kick off the agent turn when the screen opens
    LaunchedEffect(Unit) {
        agentClient.sendMessage("Show a booking confirmation form for flight BCN-2026-11-21")
    }
}
```

### 2. What the agent sends

> ⚠️ **Compatibility note:** The payload below uses the A2UI v1.0 wire format (`components` + `dataModel` embedded in a single `createSurface`, plus `@path`/`@call` bindings). The current Compose renderer (alpha02) implements **v0.9.1**, so this exact payload will work once Compose ships v1.0 support. For v0.9.1 today, split `components` and `dataModel` into separate `updateComponents` / `updateDataModel` messages and omit the `@` prefix on bindings.

The agent (Python, in this example) emits a single `createSurface` message carrying components and data:

```json
{
  "createSurface": {
    "surfaceId": "booking-form",
    "catalogId": "https://a2ui.org/catalogs/material3-basic/v1",
    "components": [
      { "id": "root", "type": "Column", "children": ["title", "flight", "nameField", "submitBtn"] },
      { "id": "title", "type": "Text", "text": "Confirm your booking", "style": "headlineMedium" },
      { "id": "flight", "type": "Text", "text": "Flight BCN-2026-11-21 · 09:30", "style": "bodyLarge" },
      { "id": "nameField", "type": "TextField", "label": "Passenger name", "value": { "@path": "/passengerName" } },
      { "id": "submitBtn", "type": "Button", "label": "Confirm booking", "action": { "@call": "confirmBooking" } }
    ],
    "dataModel": {
      "passengerName": ""
    }
  }
}
```

Notice the `@path` and `@call` bindings: the text field is bound to `/passengerName` in the data model, and the button triggers the `confirmBooking` agent function with the current form values.

### 3. Handling the callback in Kotlin

When the user taps "Confirm booking," the renderer fires `callAgentFunction` with the form data. Your agent then runs the booking tool and streams back a new surface — say, a success card — which replaces the form.

```kotlin
// Inside your AgentClient / ViewModel
suspend fun onAgentFunction(call: AgentFunctionCall) {
    when (call.name) {
        "confirmBooking" -> {
            val name = call.args["passengerName"] as? String ?: return
            val result = bookingService.confirm(name, flightId = "BCN-2026-11-21")
            // Stream the result back; the agent will emit a new surface
            agent.sendToolResult(call.id, result)
        }
    }
}
```

### 4. Custom catalog for your design system

If Material 3 is not enough, register your own components:

```kotlin
val ArceCatalog = A2UICatalog(
    id = "https://arceapps.com/catalogs/arce/v1",
    components = mapOf(
        "ArceCard" to ArceCardComponent,   // your composable
        "ArceChart" to ArceChartComponent,
    ),
)
```

The agent must then reference `"type": "ArceCard"` and the renderer will use your composable, your colors, your animation. The agent still has no idea what `ArceCard` looks like — it just knows it exists and what props it accepts.

---

## 🔒 Security: Why A2UI Beats HTML Generation

Before A2UI, the common approach was to have the agent generate HTML/JSX and render it in a WebView. That approach has three well-known problems, and A2UI addresses each:

| Concern | HTML/JSX generation | A2UI |
|---|---|---|
| **Arbitrary code execution** | Agent can ship `<script>`; XSS risk | Agent only references catalog types; no code runs |
| **Schema safety** | No validation; malformed markup breaks the view | Payload validated against catalog schema before state update |
| **Sensitive data** | Often sent to the model in full | Data binding is server-side; sensitive values never reach the model |
| **Branding** | Agent hardcodes CSS/colors | Renderer applies native theme; agent stays brand-agnostic |
| **Performance** | WebView overhead, JS bridge latency | Native Compose recomposition, Snapshot-driven |
| **Accessibility** | Depends on generated markup quality | Renderer controls semantics; `@accessibility` envelope hints |

Additional safeguards in the Compose renderer:

- **Error states.** A component that fails to render shows a graceful error placeholder instead of crashing the screen.
- **Auto-reporting.** Render and validation errors are sent back to the agent as function responses, enabling self-correction on the next turn.
- **Catalog allow-listing.** You decide which catalogs the renderer accepts. An agent targeting an unknown `catalogId` is ignored.

> ⚠️ **Rule of thumb:** Never let the agent choose the catalog. The app pins the allowed catalogs; the agent only picks among the components inside them.

---

## 📊 When to Use A2UI (and When Not To)

| Scenario | A2UI? | Why |
|---|---|---|
| Agent-driven forms, confirmations, wizards | ✅ Yes | Structured, interactive, native feel |
| Dynamic charts/dashboards generated by agent | ✅ Yes | Custom catalog components for viz |
| Adaptive UI per user segment | ✅ Yes | Same payload, different native theme |
| Streaming progress while agent works | ✅ Yes | Progressive rendering + placeholders |
| Static marketing copy | ❌ No | Plain text is simpler and cheaper |
| Pixel-perfect custom animations | ⚠️ Maybe | Needs custom catalog; consider Compose directly |
| Offline-only, no agent round-trip | ❌ No | Overhead without benefit |

---

## 🌍 Adoption and Ecosystem

A2UI is not a Google-only experiment. Companies including **Atlassian, Bloomberg, and ByteDance** are already building with it, and the ecosystem is growing fast:

- **Agent SDKs** in Python, TypeScript, and Dart.
- **Web renderers** for React, Angular, and Lit — and they run inside **MCP Apps** (Claude, Gemini), so the same agent can target multiple hosts.
- **A2UI Macros** for programmatic expansion of component trees in Python.
- **A2UI Express** for rapid UI generation scaffolding.

For Android teams, the Compose renderer is the missing piece: it brings the same agent-driven UI model to native mobile, with Material 3 out of the box and a path to custom design systems.

---

## ✅ Conclusion

A2UI 1.0 marks a shift in how we think about agent interfaces. Instead of agents producing walls of text that users must decode, they now produce **declarative, native, interactive UI** — rendered by the app, themed by the app, and secured by a catalog contract. The Jetpack Compose renderer (`1.0.0-alpha02`) brings this to Android with schema validation, hallucination tolerance, and reactive data binding on top of Compose's Snapshot system.

If you are building an agent into an Android app, the migration path is clear: pin your catalogs, validate every payload, and let Compose do what it does best — render native UI at 60 fps with your design system intact.

The protocol is open, the SDKs are multi-language, and the renderers are multiplying. The wall of text era is ending. 🚀

---

*Have you tried A2UI in a Compose app yet? Share your experience — and your custom catalogs — with the community.*