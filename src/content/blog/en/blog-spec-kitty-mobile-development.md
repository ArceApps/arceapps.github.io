---
title: "Spec Kitty: GitHub Spec Kit's Evolution for Mobile-First AI-Driven Development"
description: "How Spec Kitty reimagines Specification-Driven Development for mobile teams using Kotlin and Android, with a code-first philosophy and worktree-based isolation that makes AI agents genuinely useful rather than just decorative."
pubDate: 2026-05-19
heroImage: "/images/blog-spec-kitty-mobile-development.svg"
tags: ["SDD", "Spec Kitty", "Spec Kit", "Android", "Kotlin", "AI Agents", "Mobile Development", "Spec-Driven Development", "Workflow", "Architecture", "Git Worktrees"]
reference_id: "a8f92c3d-4e15-4b7a-9f2c-1d3e5f6a7b8c"
---

> **Related readings:** [Deep Analysis of SDD Frameworks: Spec Kit, OpenSpec and BMAD](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad) · [OpenSpec for Mobile Development: SDD in Android and Kotlin](/blog/blog-openspec-mobile-development) · [Spec-Driven Development with Agentic AI](/blog/spec-driven-development-ai)

When GitHub released Spec Kit as an open-source project at the end of 2025, it established a milestone in how development teams could structure AI-assisted workflows. The framework introduced the concept of a **constitution** — a living document that AI agents consult before generating any code — along with a four-phase gate system (`specify` → `plan` → `tasks` → `merge`) that enforced human approval at each transition. It was a thoughtful, methodical approach that worked beautifully for web-native development teams embedded in the GitHub ecosystem.

But mobile development has its own rhythm. Android projects with Kotlin have specific constraints — device fragmentation, API level requirements, platform-specific patterns like Jetpack Compose or Hilt dependency injection — that a general-purpose framework like Spec Kit wasn't designed to address. The moment a mobile developer tried to use Spec Kit for an Android project, the friction became apparent: the constitution model assumed you could write comprehensive system documentation upfront, but mobile projects evolve in small, verifiable increments where premature documentation becomes technical debt.

**Spec Kitty** emerges from this gap. It's an evolution of Spec Kit's core ideas — specification-driven development, human-in-the-loop gates, artifact persistence in the repository — but redesigned from the ground up for how mobile and Kotlin developers actually work. The most significant departure: **code is the source of truth, not the specification**. Specifications in Spec Kitty are change requests, not comprehensive documentation. This inversion sounds subtle but transforms everything about how AI agents operate in a mobile codebase.

---

## The Fundamental Inversion: Code Is Truth, Spec Is Delta

To understand why this matters, consider the classic failure mode of specification-driven development in mobile contexts.

When a mobile team writes a comprehensive specification document for an authentication feature, they document the entire system: how tokens are stored, which APIs are called, what happens on failure, the UI flow for login and registration. The document becomes the source of truth. But six months later, when the team has evolved the implementation — switching from JWT to OAuth2, adding biometric authentication, changing the token storage strategy — the specification document is now obsolete. Nobody updated it. The AI agent reads the spec, generates code based on it, and introduces bugs because the spec no longer reflects reality.

Spec Kitty's philosophical foundation addresses this directly. **The specification is always a delta from current reality, never current reality itself.**

This means:
- Specifications describe what you want to ADD, MODIFY, or DELETE
- The AI agent ALWAYS reads the actual code to understand the current state
- After a change is merged, the spec becomes historical context — the code is what matters
- No drift between specification and implementation is possible because they serve different roles

For a Kotlin Android project, this maps cleanly to how mobile development actually happens. You don't write a spec for the entire authentication system. You write a spec that says: "Add biometric authentication as a fallback when the device supports it, using the BiometricPrompt API with EncryptedSharedPreferences for token storage." The AI agent reads the current auth implementation, understands the existing JWT flow, and adds the biometric layer as a delta. The resulting code is correct because the agent worked from ground truth.

### How Spec Kitty Differs from Spec Kit's Constitution Model

Spec Kit uses a **constitution** as the primary context artifact. The constitution attempts to document all architectural decisions, coding standards, technology choices, and constraints. When you run `/speckit.specify`, the agent loads the constitution and uses it to validate the generated spec.

This works when:
- The project has a stable, well-understood architecture
- You're building from scratch (greenfield)
- The team can invest upfront time in comprehensive documentation

It breaks when:
- The project is brownfield with undocumented decisions scattered across the codebase
- Requirements change frequently and specs become stale
- The constitution grows so large that agents ignore it

Spec Kitty removes the constitution entirely. Instead, the charter (`doctrine/charter.md`) defines immutable development principles — test-first imperatives, library-first architecture, simplicity constraints — rather than comprehensive system documentation. These principles guide agent behavior without attempting to document current system state.

The practical difference for an Android developer:

**Spec Kit approach:**
```
Constitution: "System uses Retrofit 2.9 for networking, Moshi for JSON serialization,
Hilt for DI, Coroutines for async, StateFlow for UI state. Never use LiveData."
→ Agent reads constitution
→ Agent generates authentication spec assuming Retrofit + Moshi + Hilt
```

**Spec Kitty approach:**
```
Charter: "Test-first imperative. All network operations MUST have contract tests
before implementation. Library-first: every feature starts as a standalone module."
→ Agent reads current auth implementation in the codebase
→ Agent reads Spec Kitty spec for the change: "Add biometric auth using BiometricPrompt"
→ Agent generates implementation based on actual code + delta spec
```

The second approach is more robust because the agent never makes decisions based on stale documentation.

---

## The Spec Kitty Architecture for Android Projects

A Kotlin Android project using Spec Kitty has a specific directory structure that organizes specification artifacts alongside implementation:

```
my-android-app/
├── app/
│   └── src/main/
│       ├── java/com/myapp/
│       └── res/
├── kitty-specs/                  # Spec Kitty artifacts (not in final APK)
│   ├── 001-biometric-auth/
│   │   ├── spec.md              # Feature specification
│   │   ├── plan.md              # Implementation plan
│   │   ├── research.md          # Technical research findings
│   │   ├── data-model.md        # Domain entities and relationships
│   │   ├── contracts/           # API specifications
│   │   │   └── biometric-api.md
│   │   ├── tasks.md             # Task checklist
│   │   └── tasks/              # Work package prompts (flat structure)
│   │       ├── WP01-deps.md
│   │       ├── WP02-storage.md
│   │       ├── WP03-biometric.md
│   │       └── WP04-integration.md
│   └── _archive/                # Completed feature specs
├── .worktrees/                  # Git worktrees for parallel development
│   └── 001-biometric-auth/      # Isolated checkout for this feature
├── doctrine/                    # Charter and principles
│   └── charter.md
└── build.gradle.kts
```

The `kitty-specs/` directory is the heart of the system. Unlike a general documentation folder, it's structured around **missions** (Spec Kitty's term for features) with a clear lifecycle: specification → planning → tasking → implementation → review → acceptance → merge → archival.

### The Key Insight: Worktrees for Isolation

One of Spec Kitty's most practical features is its use of **git worktrees** for feature isolation. When you run `/spec-kitty.specify "Add biometric authentication"`, the CLI:

1. Creates a semantic branch: `001-biometric-auth`
2. Spawns a worktree at `.worktrees/001-biometric-auth/`
3. Switches your agent (Claude, Cursor, Gemini) into that isolated checkout

This matters enormously for mobile development because:

- **No branch switching overhead**: You work in the feature worktree, commit changes, and the main branch stays clean. No `git stash` / `git checkout` cycles when you need to quickly check something in main.
- **True parallel development**: If you're building two features simultaneously, you can have two worktrees with different agents working independently.
- **Clean handoff**: When a feature is complete, the worktree merges cleanly and disappears. No orphaned branches.

For Android specifically, the worktree approach aligns well with how Gradle modules work. A feature might involve changes to the app module, a new library module for the biometric wrapper, and test modules — all isolated in the worktree without touching main.

---

## Comparing Spec Kitty and OpenSpec: Two Philosophies, One Problem

Both Spec Kitty and OpenSpec address the same core problem — keeping AI agents aligned with architectural intent in a codebase that evolves continuously. But they approach it from fundamentally different angles.

### OpenSpec's Change Proposal Model

OpenSpec treats each modification as a **formal proposal** with a specific structure:

```
openspec/
├── main/specs/                  # Canonical project specs (built over time)
│   ├── architecture.md
│   └── security.md
└── changes/
    └── ch-0042-add-biometric/   # Each change is a self-contained proposal
        ├── proposal.md           # Why, what, scope
        ├── specs/                # Delta specs (additions/modifications/deletions)
        │   └── biometric-spec.md
        ├── tasks.md              # Atomic verifiable tasks
        └── design.md             # Architectural decisions
```

The key innovation is **retroactive spec building**: you start with an empty `main/specs/` directory and build it incrementally. Each change, when archived, merges its delta specs back into the canonical specs. After a year of changes, you have a comprehensive specification document that was built organically rather than written speculatively.

The validation step (`openspec validate`) ensures spec-task alignment before implementation begins. This catches discrepancies between what was proposed and what was planned *before* any code is written.

### Spec Kitty's Mission-Based Model

Spec Kitty organizes work around **missions** (features) rather than changes. The distinction is subtle but important:

- **OpenSpec change**: A modification to existing system behavior
- **Spec Kitty mission**: A user-facing outcome that might involve multiple systems

A biometric authentication feature in Spec Kitty is a mission (`001-biometric-auth`). Within that mission, there are work packages that might touch the storage layer, the biometric API integration, the UI, and testing — each as a separate work package with its own lifecycle lane.

The charter-based governance in Spec Kitty provides constraints that OpenSpec lacks. The charter defines immutable principles (test-first, library-first, simplicity constraints) that apply to all missions. This means you don't need to rediscover architectural principles for each feature — they're baked into the workflow.

### Feature Comparison Table

| Aspect | Spec Kitty | OpenSpec |
|--------|------------|----------|
| **Primary artifact** | Mission (feature) with work packages | Change proposal with delta specs |
| **Architectural context** | Charter principles + actual code | Canon specs built via archival |
| **Specification scope** | Delta from current code (change request) | Can be delta or comprehensive |
| **Human approval gates** | Specify, plan, tasks, review, accept, merge | Proposal, spec validation |
| **Parallel development** | Git worktrees (native isolation) | Branch-based (manual management) |
| **Brownfield friendliness** | High — works from actual code | High — builds specs retroactively |
| **Android/Kotlin support** | Multi-agent, Hilt/Compose-aware | Change-based, platform-agnostic |
| **CLI tooling** | `spec-kitty` (Python) | `openspec` (Node.js) |
| **Maturity** | Active development, v3.x | Established, v2.x |

### When to Choose Which

**Choose Spec Kitty when:**
- You want charter principles that apply consistently across all features
- You work with multiple AI agents simultaneously (Claude + Cursor + Gemini in parallel)
- Git worktrees fit your workflow (fast branch switching, parallel features)
- You value the test-first imperative enforced as a gate rather than a convention
- Your Android project uses Hilt, Compose, and Coroutines heavily — Spec Kitty has templates that understand these patterns

**Choose OpenSpec when:**
- You want change-level traceability (each change is a formal proposal with its own delta)
- Your team is comfortable with branch-based workflow rather than worktrees
- The Node.js ecosystem fits your tooling better
- You want a lighter ceremony for small changes (fewer mandatory gates)

The honest answer is that for a Kotlin Android project with a team that uses multiple AI coding assistants, **Spec Kitty's worktree model and charter principles provide more robust governance**. But if you're already invested in OpenSpec and it works for your team, the grass isn't greener on the other side — both solve the same problem well.

---

## Kotlin and Android Implementation Examples

Let's walk through how Spec Kitty handles a concrete Android scenario: adding biometric authentication to an existing login system.

### Step 1: Initialize the Project

```bash
# Install Spec Kitty CLI
pipx install spec-kitty-cli

# Initialize with Claude Code as the primary agent
spec-kitty init my-android-app --ai claude

cd my-android-app
spec-kitty verify-setup
```

The init command creates the `kitty-specs/` directory structure, sets up the `doctrine/` folder with a default charter, and generates agent command files for Claude Code (`.claude/commands/`).

### Step 2: Create the Mission Specification

```text
/spec-kitty.specify

Add biometric authentication to the existing login flow. Users with
fingerprint or face recognition should be able to authenticate using
BiometricPrompt. Devices without biometric capability should fall back
to the existing PIN/password flow. Store authentication tokens in
EncryptedSharedPreferences using AndroidX Security library.
```

The CLI enters discovery mode, asking clarifying questions about:
- Which biometric types to support (fingerprint, face, iris)
- Whether to require biometric as primary auth or allow it as optional
- How fallback should work when biometric fails
- Integration points with existing AuthManager

After the interview completes, it creates `kitty-specs/001-biometric-auth/spec.md` with the structured specification.

### Step 3: Generate the Implementation Plan

```text
/spec-kitty.plan

Use AndroidX Biometric 1.1.0 library, AndroidX Security-Crypto 1.1.0-alpha06
for EncryptedSharedPreferences. Keep the existing JWT flow for network
authentication. Add BiometricPrompt for local authentication with
BiometricManager.canAuthenticate() to check availability at runtime.
```

The plan command creates `plan.md` with:
- Technical approach (BiometricPrompt + EncryptedSharedPreferences)
- Module structure (new BiometricAuth library module)
- Dependency additions to build.gradle.kts
- Architecture decisions with rationale

### Step 4: Research Phase (Optional but Recommended)

```text
/spec-kitty.research

Investigate:
1. Best practices for BiometricPrompt error handling
2. Security considerations for biometric auth on Android
3. Performance impact of biometric authentication
4. Testing strategies for biometric flows (requires instrumentation tests)
```

This generates `research.md` with findings from the research agent, including library compatibility notes and security benchmarks specific to Android.

### Step 5: Generate Work Packages

```text
/spec-kitty.tasks
```

This creates `tasks.md` with the task checklist and individual work package files in `tasks/`:

**WP01-deps.md** (lane: planned):
```markdown
---
lane: "planned"
agent: "claude"
assignee: "Claude Code"
---

## Dependencies Installation

1. Add `androidx.biometric:biometric:1.1.0` to `app/build.gradle.kts`
2. Add `androidx.security:security-crypto:1.1.0-alpha06` to dependencies
3. Verify `minSdk` is 23 or higher (required for BiometricPrompt)
4. Run `./gradlew dependencies` to confirm no version conflicts
```

**WP02-storage.md** (lane: planned):
```markdown
---
lane: "planned"
agent: "claude"
assignee: "Claude Code"
---

## Secure Token Storage

1. Create `SecureTokenStorage` class wrapping EncryptedSharedPreferences
2. Implement `MasterKey` using `MasterKey.Builder` with `setKeyScheme(MasterKey.KeyScheme.AES256_GCM)`
3. Migrate existing tokens from SharedPreferences to EncryptedSharedPreferences
4. Add unit tests for `SecureTokenStorage` read/write operations
```

**WP03-biometric.md** (lane: planned):
```markdown
---
lane: "planned"
agent: "claude"
assignee: "Claude Code"
---

## BiometricPrompt Integration

1. Create `BiometricAuthenticator` class with `authenticate()` method
2. Use `BiometricPrompt.PromptInfo` with `setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)`
3. Handle `BiometricPrompt.AuthenticationCallback` with success, error, and failure paths
4. Implement fallback to PIN when `canAuthenticate()` returns `BIOMETRIC_NO_HARDWARE` or `BIOMETRIC_ERROR_NONE_ENROLLED`
5. Add instrumentation tests for biometric flow
```

**WP04-integration.md** (lane: planned):
```markdown
---
lane: "planned"
agent: "claude"
assignee: "Claude Code"
---

## Login Flow Integration

1. Modify `LoginViewModel` to expose biometric auth state via `StateFlow<BiometricState>`
2. Add "Use fingerprint" button to `LoginScreen` composable
3. Wire biometric button click to trigger `BiometricAuthenticator.authenticate()`
4. On successful biometric auth, retrieve token from `SecureTokenStorage` and proceed to home
5. Verify existing PIN/password flow still works when biometric unavailable
```

### Step 6: Implement with Workflow Commands

```bash
# Start implementing WP01 - automatically moves to "doing" lane
spec-kitty agent action implement WP01
```

The workflow command:
1. Moves WP01 from `planned` → `doing` in frontmatter
2. Adds activity log entry with timestamp and agent info
3. Displays the full implementation prompt with instructions
4. Commits the lane transition to git

After implementation:
```bash
# When done, advance to for_review
spec-kitty agent action implement WP01
# This moves from "doing" to "for_review"
```

### Step 7: Review and Accept

```text
/spec-kitty.review
```

The review command:
1. Auto-detects first WP with `lane: "for_review"`
2. Moves to `doing` and displays review instructions
3. Agent reviews the code against the spec
4. Human approves (→ `done`) or requests changes (→ `planned`)

Once all WPs are in `done`:
```text
/spec-kitty.accept
# Validates all WPs complete, frontmatter metadata, task checkboxes
# Records acceptance metadata to meta.json

/spec-kitty.merge --push
# Merges feature branch to main, removes worktree
```

---

## Multi-Agent Workflows in Spec Kitty

Spec Kitty's design accommodates multiple AI agents working simultaneously — a scenario increasingly common in mobile development where one agent handles business logic while another focuses on UI or infrastructure.

### Orchestrating Claude and Gemini on the Same Feature

In the multi-agent pattern, agents specialize:

- **Claude**: Discovery, planning, review (narrative-heavy tasks)
- **Gemini**: Data modeling, research, API design (technical depth)
- **Cursor**: Implementation (IDE integration, fast iteration)

For the biometric auth feature, the orchestration looks like:

1. **Lead (Claude) runs specify**: `/spec-kitty.specify` creates the mission structure
2. **Lead switches to worktree**: `cd .worktrees/001-biometric-auth`
3. **Gemini runs research**: `/spec-kitty.research` investigates biometric security implications
4. **Claude runs plan**: `/spec-kitty.plan` generates the implementation approach
5. **Claude runs tasks**: `/spec-kitty.tasks` creates work packages
6. **Cursor implements**: `spec-kitty agent action implement WP03` while Claude handles review
7. **Lead accepts and merges**: After all WPs complete

The flat `tasks/` directory with lane-based frontmatter makes this coordination robust. Each agent works on their assigned WP without stepping on others' toes. The dashboard (`spec-kitty dashboard`) shows real-time lane positions so nobody duplicates work.

### Claude + Cursor Collaboration Example

For teams using Claude for planning and Cursor for implementation:

```bash
# Project setup (one-time)
cd my-android-app
claude

# Claude creates the mission
/spec-kitty.specify

Add offline-first sync to the inventory management feature with
conflict resolution using last-write-wins and a sync indicator in
the UI showing pending uploads.

# Switch to worktree - Claude continues planning
cd .worktrees/002-offline-sync
claude

# Planning phase
/spec-kitty.plan

Use Room database with WorkManager for background sync,
Retrofit for API calls, Kotlin Flows for reactive data streams.
Implement conflict resolution in the Repository layer.

# Generate tasks
/spec-kitty.tasks

# Exit Claude, start Cursor in same worktree
exit
cursor-agent

# Cursor implements from work packages
spec-kitty agent action implement WP01  # Database schema
spec-kitty agent action implement WP02  # Room DAOs
spec-kitty agent action implement WP03  # WorkManager sync
spec-kitty agent action implement WP04  # UI sync indicator

# Cursor exits, Claude reviews
exit
claude

/spec-kitty.review  # Reviews each WP from for_review lane
```

The key mechanism enabling this collaboration is the **prompt bundle** in each work package file. The prompt contains everything the implementing agent needs: context from the spec and plan, specific implementation instructions, acceptance criteria, and the "WHEN YOU'RE DONE" instructions that guide the lane transition.

---

## Why Spec Kitty's Philosophy Works Better for AI Agents

Traditional specification documents assume humans will read them. They optimize for human comprehension: narrative explanations, diagrams, examples, and prose that guides understanding. AI agents don't need this optimization — they can parse structured content and extract meaning from it directly.

Spec Kitty leverages this by structuring specs as **executable prompts** rather than human-readable documents. The work package prompt isn't a description of what to build — it's a direct instruction for the AI agent that includes:

- The context from spec.md and plan.md
- Specific implementation instructions
- The acceptance criteria the agent will self-verify
- The exact commands to run for validation
- The lane transition instructions

This means Spec Kitty specs are more dense and less narrative than traditional specifications. They assume an AI reader. For humans who need to understand the work, the `spec.md`, `plan.md`, and `tasks.md` files provide the narrative view — but the agent works from the prompt bundles, which are optimized for machine consumption.

The charter plays a crucial role here. Because the charter defines immutable principles (test-first, library-first, simplicity), the prompt bundles don't need to repeat architectural constraints. The agent knows: "I must write tests before implementation. I must start this as a library module before integrating it into the app. I must use framework features directly rather than wrapping them." These constraints are embedded in the charter, not in each spec.

For a Kotlin Android developer, this means:
- You write less documentation (the charter handles constraints)
- The agent generates more correct code (charter principles are enforced)
- You spend less time reviewing because the agent self-validates against charter principles

---

## Getting Started with Spec Kitty on Android

If you're convinced and want to try it:

### 1. Install and Initialize

```bash
pipx install spec-kitty-cli

# Create a new project or initialize existing
spec-kitty init my-android-app --ai claude

cd my-android-app
spec-kitty verify-setup
```

### 2. Review and Customize the Charter

The default charter (`doctrine/charter.md`) has sensible defaults for Android:

```markdown
## Article III: Test-First Imperative
All implementation MUST follow strict Test-Driven Development.
No implementation code shall be written before:
1. Unit tests are written and confirmed to FAIL (Red phase)
2. Tests are validated and approved
```

For your project, you might add:
- AndroidX library version constraints
- Compose testing requirements
- Minimum SDK requirements enforced at spec level
- Hilt module conventions

### 3. Run Your First Mission

```text
/spec-kitty.specify

Add push notification support using Firebase Cloud Messaging.
Support notification tap actions that deep-link to specific screens.
Handle notification permissions on Android 13+ (API 33) with a
rational explanation to users before requesting.
```

The discovery interview will ask about notification categories, priority levels, data payload handling, and testing strategy. Answer the questions, and Spec Kitty generates a complete mission structure.

### 4. Track Progress Visually

```bash
spec-kitty dashboard
# Opens the local kanban board at http://localhost:3000
```

The dashboard shows all missions and their work packages in lane positions. You can filter by agent, see activity history, and identify blockers at a glance.

---

## Conclusion: Spec Kitty as the Evolution of Spec Kit for Mobile

Spec Kitty doesn't replace Spec Kit — it evolves its core ideas for contexts Spec Kit wasn't designed for. The charter-based governance, worktree isolation, and code-as-truth philosophy make it particularly well-suited for Android and Kotlin development teams working with AI coding agents.

The key differentiator is **pragmatism over comprehensiveness**. Rather than trying to document the entire system upfront (Spec Kit's constitution model), Spec Kitty treats specifications as change requests that work alongside actual code. Rather than requiring formal proposals for every modification (OpenSpec's change model), Spec Kitty uses mission-based organization with lighter ceremony for small features.

For mobile developers, this maps cleanly to how you actually work: small increments, verifiable outcomes, platform-specific constraints that change over time. The charter keeps architectural principles consistent while specs remain focused and current.

If you're already using Spec Kit or OpenSpec, Spec Kitty isn't necessarily a migration — it's an alternative approach that might fit your workflow better. Evaluate based on your team size, project complexity, and how many AI agents you use simultaneously. For a solo developer or small team doing Android development with one or two AI assistants, Spec Kitty's worktree model and charter enforcement provide meaningful advantages over less structured approaches.

The ecosystem around Spec Kitty is actively developing — the v3.x series is adding features like hosted sync, teamspace authentication, and enhanced dashboard visualizations. Watch the project if you're serious about AI-augmented mobile development.

---

## References and Links

- [Spec Kitty GitHub Repository](https://github.com/Priivacy-ai/spec-kitty)
- [Spec Kit by GitHub](https://github.com/github/spec-kit)
- [OpenSpec by Fission-AI](https://github.com/Fission-AI/OpenSpec)
- [Spec-Driven Development Guide (Spec Kitty)](spec-driven.md)
- [SDD Frameworks Analysis: Spec Kit, OpenSpec, BMAD](/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad)
- [OpenSpec for Mobile Development](/blog/blog-openspec-mobile-development)