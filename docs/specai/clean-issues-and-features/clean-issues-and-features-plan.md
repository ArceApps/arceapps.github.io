# Clean Issues and Features Implementation Plan

**Goal:** Clean up the repository by permanently deleting 8 obsolete markdown files and the issue creation script, verifying references, and ensuring build integrity.
**Architecture:** Simple file deletion operations performed sequentially via Git CLI, followed by search-and-replace checkups on reference files, and concluding with a project compilation validation.
**Tech Stack:** Bash, Git, Ripgrep, Astro 5.16, Node.js.
**Status:** 🟡 IN PROGRESS

---

## Acceptance Criteria

- [ ] AC1: The 8 target files (`create-issues.sh`, `QUICK_START.md`, `GITHUB_ISSUES_README.md`, `ISSUES_CREATION_GUIDE.md`, `ISSUES_LIST.md`, `ISSUE_SUMMARY.md`, `IMPLEMENTATION_SUMMARY.md`, `ANALISIS_WEB.md`) are completely deleted from the workspace.
- [ ] AC2: All file deletions are staged and tracked in a Git feature branch.
- [ ] AC3: Verification that `AGENTS.md` and `README.md` contain zero active references to the deleted files.
- [ ] AC4: Project build passes successfully (`pnpm build`).

## Constraints & Guardrails

- Do not modify or delete any historical agent log files (`agents/bitácora/*`).
- Do not modify published blog posts/devlogs (`src/content/devlog/*` or `src/content/blog/*`).
- Always verify the workspace compiles properly after file removal.

---

## Task List

### Task 1: Initialize Development Branch
*   **Files:** None
*   **Acceptance for this task:**
    *   [ ] Feature branch `feature/arceapps_clean-issues-and-features` is created and active.
*   **Steps:**
    *   [ ] **Step 1:** Create and switch to the new feature branch.
        ```bash
        git checkout -b feature/arceapps_clean-issues-and-features
        ```

### Task 2: Remove Target Files
*   **Files:**
    *   [DELETE] `create-issues.sh`
    *   [DELETE] `QUICK_START.md`
    *   [DELETE] `GITHUB_ISSUES_README.md`
    *   [DELETE] `ISSUES_CREATION_GUIDE.md`
    *   [DELETE] `ISSUES_LIST.md`
    *   [DELETE] `ISSUE_SUMMARY.md`
    *   [DELETE] `IMPLEMENTATION_SUMMARY.md`
    *   [DELETE] `ANALISIS_WEB.md`
*   **Acceptance for this task:**
    *   [ ] All 8 target files are removed from the disk and marked as deleted in Git.
*   **Steps:**
    *   [ ] **Step 1:** Run git rm commands to delete the files.
        ```bash
        git rm create-issues.sh QUICK_START.md GITHUB_ISSUES_README.md ISSUES_CREATION_GUIDE.md ISSUES_LIST.md ISSUE_SUMMARY.md IMPLEMENTATION_SUMMARY.md ANALISIS_WEB.md
        ```
    *   [ ] **Step 2:** Verify that the files are deleted on disk and show as staged for deletion in `git status`.
        ```bash
        git status
        ```
    *   [ ] **Step 3:** Commit the deletion step.
        ```bash
        git commit -m "chore: remove obsolete issue creation and web analysis files"
        ```

### Task 3: Verify and Clean References in AGENTS.md
*   **Files:**
    *   Modify: `AGENTS.md`
*   **Acceptance for this task:**
    *   [ ] No references to the deleted files exist in `AGENTS.md`.
*   **Steps:**
    *   [ ] **Step 1:** Search for any remaining reference strings in `AGENTS.md`.
        ```bash
        grep -Ei "create-issues|QUICK_START|ANALISIS_WEB|ISSUES_LIST|ISSUE_SUMMARY|IMPLEMENTATION_SUMMARY" AGENTS.md || true
        ```
    *   [ ] **Step 2:** If any references are found, edit `AGENTS.md` to remove them, then stage and commit the changes.
        ```bash
        git add AGENTS.md
        git commit -m "docs: clean up file references in AGENTS.md"
        ```

### Task 4: Verify Project Compilation
*   **Files:** None
*   **Acceptance for this task:**
    *   [ ] Project compiles successfully using Astro's build process.
*   **Steps:**
    *   [ ] **Step 1:** Run the production build command.
        ```bash
        pnpm build
        ```
    *   [ ] **Step 2:** Verify the exit code is 0 and no build errors occurred.
