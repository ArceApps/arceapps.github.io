# AI CLI Grand Final Optimization Task List

## Task 1: Optimize Frontmatter and SEO Metadata

**Files:**
- Modify: [es/cli-ai-grand-final.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/es/cli-ai-grand-final.md)
- Modify: [en/cli-ai-grand-final.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/en/cli-ai-grand-final.md)

**Acceptance for this task:**
- [x] Description length is 120-160 characters in both Spanish and English versions.

**Steps:**
- [x] **Step 1: Modify Spanish frontmatter description**
  Update the description to:
  `"La Gran Final del torneo AI CLI 2026. Comparamos OpenCode, Aider, Claude Code y Trae CLI para elegir al campeón definitivo para desarrolladores indie."` (151 chars)
- [x] **Step 2: Modify English frontmatter description**
  Update the description to:
  `"The Grand Final of the AI CLI 2026 tournament. We compare OpenCode, Aider, Claude Code, and Trae CLI to find the ultimate champion for indie developers."` (153 chars)
- [x] **Step 3: Commit frontmatter changes**
  ```bash
  git add src/content/blog/es/cli-ai-grand-final.md src/content/blog/en/cli-ai-grand-final.md
  git commit -m "seo: optimize frontmatter descriptions for final articles"
  ```

---

## Task 2: Correct English Links in the Spanish Article

**Files:**
- Modify: [es/cli-ai-grand-final.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/es/cli-ai-grand-final.md)

**Acceptance for this task:**
- [ ] All English version links in the Spanish article use absolute URLs `https://arceapps.com/...` to bypass link rewriting.

**Steps:**
- [ ] **Step 1: Replace relative links to English versions with absolute URLs**
  - Line 16: `[Semifinal 1 — agnostic block (EN)](/blog/cli-ai-semifinal-1/)` -> `[Semifinal 1 — agnostic block (EN)](https://arceapps.com/blog/cli-ai-semifinal-1/)`
  - Line 17: `[Semifinal 2 — native block (EN)](/blog/cli-ai-semifinal-2/)` -> `[Semifinal 2 — native block (EN)](https://arceapps.com/blog/cli-ai-semifinal-2/)`
  - Line 19: `[AI Tools Worth Learning in 2026 (EN)](/blog/ai-tools-worth-learning-2026/)` -> `[AI Tools Worth Learning in 2026 (EN)](https://arceapps.com/blog/ai-tools-worth-learning-2026/)`
  - Line 19: `[OpenCode Subagents: Workflows & Superpowers (EN)](/blog/opencode-subagents/)` -> `[OpenCode Subagents: Workflows & Superpowers (EN)](https://arceapps.com/blog/opencode-subagents/)`
  - Line 664: `[Semifinal 1 — agnostic block (EN)](/blog/cli-ai-semifinal-1/)` -> `[Semifinal 1 — agnostic block (EN)](https://arceapps.com/blog/cli-ai-semifinal-1/)`
  - Line 665: `[Semifinal 2 — native block (EN)](/blog/cli-ai-semifinal-2/)` -> `[Semifinal 2 — native block (EN)](https://arceapps.com/blog/cli-ai-semifinal-2/)`
  - Line 666: `[AI Tools Worth Learning in 2026 (EN)](/blog/ai-tools-worth-learning-2026/)` -> `[AI Tools Worth Learning in 2026 (EN)](https://arceapps.com/blog/ai-tools-worth-learning-2026/)`
  - Line 667: `[OpenCode Subagents: Workflows & Superpowers (EN)](/blog/opencode-subagents/)` -> `[OpenCode Subagents: Workflows & Superpowers (EN)](https://arceapps.com/blog/opencode-subagents/)`
  - Line 670: `[Android CLI: Accelerating Development with AI Agents (EN)](/blog/android-cli-agentes-herramientas/)` -> `[Android CLI: Accelerating Development with AI Agents (EN)](https://arceapps.com/blog/android-cli-agentes-herramientas/)`
- [ ] **Step 2: Commit Spanish link corrections**
  ```bash
  git add src/content/blog/es/cli-ai-grand-final.md
  git commit -m "fix: correct English target links in Spanish final article"
  ```

---

## Task 3: Fix Slugs and Translate Labels in the English Article

**Files:**
- Modify: [en/cli-ai-grand-final.md](file:///home/arceappspc/Projects/ArceApps/arceapps.github.io/src/content/blog/en/cli-ai-grand-final.md)

**Acceptance for this task:**
- [ ] Related articles' slugs and labels/titles are fully corrected to match English versions.

**Steps:**
- [ ] **Step 1: Replace Spanish slugs in English links**
  - Line 19: `/blog/servidores-mcp-memoria-cross-agent/` -> `/blog/mcp-servers-memory-cross-agent/`
  - Line 19: `/blog/opencode-plugins-memoria-nativos/` -> `/blog/opencode-memory-plugins-native/`
  - Line 98: `/blog/servidores-mcp-memoria-cross-agent/` -> `/blog/mcp-servers-memory-cross-agent/`
  - Line 250: `/blog/servidores-mcp-memoria-cross-agent/` -> `/blog/mcp-servers-memory-cross-agent/`
  - Line 551: `/blog/servidores-mcp-memoria-cross-agent/` -> `/blog/mcp-servers-memory-cross-agent/`
  - Line 616: `/blog/servidores-mcp-memoria-cross-agent/` -> `/blog/mcp-servers-memory-cross-agent/`
  - Line 668: `/blog/servidores-mcp-memoria-cross-agent/` -> `/blog/mcp-servers-memory-cross-agent/`
  - Line 669: `/blog/opencode-plugins-memoria-nativos/` -> `/blog/opencode-memory-plugins-native/`
  - Line 671: `/blog/loop-engineering-desarrollo-movil` -> `/blog/loop-engineering-mobile-development/`
- [ ] **Step 2: Translate Spanish Related Article titles/labels**
  - Line 671: `[Loop Engineering: de Prompts a Sistemas Autónomos]` -> `[Loop Engineering: From Prompts to Autonomous Systems]`
  - Line 672: `[Harness Engineering: el wrapper que gana]` -> `[Harness Engineering: The Wrapper that Wins]`
- [ ] **Step 3: Commit English link and translation fixes**
  ```bash
  git add src/content/blog/en/cli-ai-grand-final.md
  git commit -m "fix: correct slugs and labels in English final article"
  ```

---

## Task 4: Verify Build Success

**Files:**
- Run build tool and inspect terminal output.

**Acceptance for this task:**
- [ ] `pnpm build` finishes successfully without Zod schema errors or invalid route links.

**Steps:**
- [ ] **Step 1: Run production build**
  ```bash
  pnpm build
  ```
- [ ] **Step 2: Verify success output**
  Confirm the output says `Completed in ...` and `Complete!`.
