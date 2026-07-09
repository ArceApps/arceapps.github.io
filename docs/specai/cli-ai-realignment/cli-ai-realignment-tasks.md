# AI CLI Tournament Realignment Task List

## Task 1: Realign Semifinal 1 (ES and EN)

**Files:**
- Modify: [es/cli-ai-semifinal-1.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/es/cli-ai-semifinal-1.md)
- Modify: [en/cli-ai-semifinal-1.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/en/cli-ai-semifinal-1.md)

**Acceptance for this task:**
- [x] In both files, Winner 1 is Claude Code (60/70) and Winner 2 is Hermes Agent (59/70).
- [x] Cline's score is adjusted downward to 56/70.
- [x] The conclusion sections state Claude Code and Hermes Agent as the qualifiers to the Grand Final.

**Steps:**
- [x] **Step 1: Modify Spanish Semifinal 1 scores and text**
  - Update Cline score from 60/70 to 56/70.
  - Update Claude Code score from 59/70 to 60/70.
  - Update Hermes Agent score from 53/70 to 59/70 (adjust category points: Ingesta 9/10, Estabilidad 8/10, etc.).
  - Update conclusion section (Winner 1: Claude Code, Winner 2: Hermes).
- [x] **Step 2: Modify English Semifinal 1 scores and text**
  Apply the exact same changes to the English version.
- [x] **Step 3: Commit Semifinal 1 changes**
  ```bash
  git add src/content/blog/es/cli-ai-semifinal-1.md src/content/blog/en/cli-ai-semifinal-1.md
  git commit -m "fix(semifinal-1): realign winners to Claude Code and Hermes Agent"
  ```

---

## Task 2: Realign Semifinal 2 (ES and EN)

**Files:**
- Modify: [es/cli-ai-semifinal-2.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/es/cli-ai-semifinal-2.md)
- Modify: [en/cli-ai-semifinal-2.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/en/cli-ai-semifinal-2.md)

**Acceptance for this task:**
- [x] In both files, Winner 1 is OpenCode CLI (62/70) and Winner 2 is OpenAI Codex CLI (60/70).
- [x] Aider's score is adjusted downward to 56/70.
- [x] Antigravity's score is adjusted downward to 55/70.
- [x] The conclusion sections state OpenCode and Codex as the qualifiers to the Grand Final.

**Steps:**
- [x] **Step 1: Modify Spanish Semifinal 2 scores and text**
  - Update OpenCode CLI score from 53/70 to 62/70.
  - Update OpenAI Codex CLI score from 49/70 to 60/70.
  - Update Aider score from 62/70 to 56/70.
  - Update Antigravity CLI score from 60/70 to 55/70.
  - Update conclusion section (Winner 1: OpenCode, Winner 2: Codex).
- [x] **Step 2: Modify English Semifinal 2 scores and text**
  Apply the exact same changes to the English version.
- [x] **Step 3: Commit Semifinal 2 changes**
  ```bash
  git add src/content/blog/es/cli-ai-semifinal-2.md src/content/blog/en/cli-ai-semifinal-2.md
  git commit -m "fix(semifinal-2): realign winners to OpenCode and OpenAI Codex"
  ```

---

## Task 3: Rewrite Grand Final Article (ES and EN)

**Files:**
- Modify: [es/cli-ai-grand-final.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/es/cli-ai-grand-final.md)
- Modify: [en/cli-ai-grand-final.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/en/cli-ai-grand-final.md)

**Acceptance for this task:**
- [x] The 4 finalists are OpenCode, Codex, Claude Code, and Hermes in both Spanish and English versions.
- [x] Swapped sections detail Codex and Hermes instead of Aider and Trae CLI.
- [x] Mermaid diagrams, SVG chart, and scorecard table updated with the new finalists and their scores.

**Steps:**
- [x] **Step 1: Modify Spanish Grand Final article**
  - Replace Aider section with OpenAI Codex CLI.
  - Replace Trae CLI section with Hermes Agent.
  - Update matchups: "OpenCode vs Codex" (Agnostics) and "Claude Code vs Hermes" (Nous weights).
  - Update scorecard table, Mermaid diagram, and SVG chart.
  - Update veredict section.
- [x] **Step 2: Modify English Grand Final article**
  Apply the exact same changes to the English version.
- [x] **Step 3: Commit Grand Final changes**
  ```bash
  git add src/content/blog/es/cli-ai-grand-final.md src/content/blog/en/cli-ai-grand-final.md
  git commit -m "fix(grand-final): update finalists to OpenCode, Codex, Claude Code, and Hermes"
  ```

---

## Task 4: Verification

**Files:**
- Run build tool and inspect terminal output.

**Acceptance for this task:**
- [x] `pnpm build` completes successfully.
- [x] Both articles have at least 5000 words.

**Steps:**
- [x] **Step 1: Run production build**
  ```bash
  pnpm build
  ```
- [x] **Step 2: Verify word counts**
  Verify with `wc -w`.
