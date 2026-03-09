---
title: "Orchestrating AI Agents in Your Android CI/CD Pipeline"
description: "Learn how to integrate specialized AI agents (code review, documentation, benchmarks) into your Android CI/CD pipeline using GitHub Actions and AGENTS.md."
pubDate: 2026-03-09
heroImage: "/images/blog-multiagente-pipeline-cicd.svg"
tags: ["AI", "Android", "CI/CD", "GitHub Actions", "Agents", "Multi-Agent", "Automation"]
draft: false
---

> This article is part of the AI Agents in Android Development series. Before continuing, I recommend checking out:
>
> - **[Beyond the Chat: Why You Need AI Agents on a Multi-Agent Environment in Android](/blog/ai-agents-android-theory)** — The theoretical foundation of what agents are and why they matter.
> - **[Your Virtual Staff: Configuring Sentinel, Bolt, and Palette](/blog/configuring-ai-agents)** — How to set up each agent in your repository using `AGENTS.md`.
> - **[Autonomous AI Agents in Android: Beyond the Assistant](/blog/autonomous-ai-agents-android)** — The conceptual leap to agents that act without human intervention.

---

You've configured your agents. You know what Sentinel does, what Bolt does, what Scribe does. You call them manually when needed and they work great. But there's a next level: **making those agents activate automatically, at exactly the right moment, as a natural part of your workflow**. That's what integrating them into your CI/CD pipeline means.

In this article, we'll build an architecture where three specialized agents collaborate in a coordinated way every time you open a Pull Request in your Android project.

## 🗺️ The Architecture: Three Agents, One Pipeline

The classic Android CI/CD pipeline has well-known steps: compile, run tests, analyze lint, and publish. What we'll do is insert AI agents as *additional jobs* that run in parallel or in sequence depending on their dependencies.

Our three agents will be:

- **Sentinel** — Code Reviewer. Analyzes the PR diff, verifies Kotlin/Clean Architecture conventions, looks for security issues, and posts review comments.
- **Scribe** — Documenter. Generates or updates KDoc for new functions, updates `CHANGELOG.md` with PR changes, verifies that `UseCase`s have proper descriptions.
- **Bolt** — Performance. Runs Android benchmarks before and after the change, compares results, and comments if there are performance regressions.

> **Key principle:** Each agent should be *stateless* within its job. It receives event context (the PR diff, the repo state), does its work, and communicates output via GitHub comments or artifacts. It doesn't depend on the previous agent having finished — unless the logic specifically requires it.

## ⚙️ The Workflow YAML Structure

The workflow skeleton has three agent jobs. Sentinel runs first (its comments can block the merge if critical issues are found), while Scribe and Bolt run in parallel after Sentinel approves.

```yaml
# .github/workflows/ai-agents-pipeline.yml
name: AI Agents Pipeline

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, develop]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  # ── JOB 1: Sentinel — Code Review Agent ─────────────────────────────
  sentinel-review:
    name: "🛡️ Sentinel: Code Review"
    runs-on: ubuntu-latest
    outputs:
      review_passed: ${{ steps.review.outputs.passed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get PR diff
        id: diff
        run: |
          git diff origin/${{ github.base_ref }}...HEAD > pr_diff.txt
          echo "diff_lines=$(wc -l < pr_diff.txt)" >> $GITHUB_OUTPUT

      - name: Run Sentinel Agent
        id: review
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: |
          python scripts/agents/sentinel_review.py \
            --diff pr_diff.txt \
            --pr-number "$PR_NUMBER" \
            --agents-config AGENTS.md \
            --output review_result.json

      - name: Post review comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const result = JSON.parse(fs.readFileSync('review_result.json'));
            if (result.comments.length > 0) {
              await github.rest.pulls.createReview({
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: context.payload.pull_request.number,
                body: result.summary,
                event: result.critical_issues ? 'REQUEST_CHANGES' : 'COMMENT',
                comments: result.comments
              });
            }

  # ── JOB 2: Scribe — Documentation Agent ─────────────────────────────
  scribe-docs:
    name: "📝 Scribe: Documentation"
    runs-on: ubuntu-latest
    needs: sentinel-review
    if: needs.sentinel-review.outputs.review_passed == 'true'
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Run Scribe Agent
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          python scripts/agents/scribe_docs.py \
            --branch ${{ github.head_ref }} \
            --base ${{ github.base_ref }} \
            --update-kdoc \
            --update-changelog

      - name: Commit documentation updates
        run: |
          git config user.name "Scribe Agent"
          git config user.email "scribe-agent@arceapps.github.io"
          git add -A
          git diff --staged --quiet || \
            git commit -m "docs(scribe): auto-update KDoc and CHANGELOG [skip ci]"
          git push

  # ── JOB 3: Bolt — Performance Agent ─────────────────────────────────
  bolt-benchmarks:
    name: "⚡ Bolt: Performance Benchmarks"
    runs-on: ubuntu-latest
    needs: sentinel-review
    if: needs.sentinel-review.outputs.review_passed == 'true'
    steps:
      - uses: actions/checkout@v4

      - name: Setup JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Run Macrobenchmarks
        run: ./gradlew :benchmark:connectedBenchmarkAndroidTest

      - name: Run Bolt Analysis
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          python scripts/agents/bolt_benchmarks.py \
            --results benchmark/outputs/ \
            --baseline benchmark/baseline.json \
            --pr-number ${{ github.event.pull_request.number }} \
            --threshold-regression 10
```

## 🤖 Implementing Each Agent as a Python Script

The GitHub Actions workflows are the *orchestrator*, but the actual agent logic lives in Python scripts that call the LLM API. Here's the structure for `sentinel_review.py`:

```python
# scripts/agents/sentinel_review.py
import argparse, json, os
from openai import OpenAI

def load_agents_config(path: str) -> str:
    """Reads AGENTS.md to extract project conventions."""
    with open(path) as f:
        return f.read()

def build_sentinel_prompt(diff: str, config: str) -> str:
    return f"""You are Sentinel, an agent specialized in Android/Kotlin code review.

PROJECT CONVENTIONS:
{config}

PULL REQUEST DIFF:
{diff}

Review the code according to the conventions. For each issue found, indicate:
- file: file path
- line: approximate line number
- severity: critical | warning | suggestion
- body: description of the issue and how to fix it

Respond in JSON with this structure:
{{
  "summary": "Review summary in Markdown",
  "critical_issues": boolean,
  "comments": [
    {{"path": "...", "position": N, "body": "..."}}
  ]
}}"""

def run_sentinel(diff_path: str, pr_number: str, config_path: str, output_path: str):
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    
    diff = open(diff_path).read()[:15000]  # context limit
    config = load_agents_config(config_path)
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": build_sentinel_prompt(diff, config)}],
        response_format={"type": "json_object"}
    )
    
    result = json.loads(response.choices[0].message.content)
    result["passed"] = not result["critical_issues"]
    
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    
    # Output for GitHub Actions
    with open(os.environ.get("GITHUB_OUTPUT", "/dev/null"), "a") as gho:
        gho.write(f"passed={'true' if result['passed'] else 'false'}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--diff")
    parser.add_argument("--pr-number")
    parser.add_argument("--agents-config")
    parser.add_argument("--output")
    args = parser.parse_args()
    run_sentinel(args.diff, args.pr_number, args.agents_config, args.output)
```

> **Security note:** Never send the full diff if it exceeds the model's context window. Implement chunking or filter only the relevant `.kt` files to maintain analysis quality.

## 📋 AGENTS.md as the Pipeline's Source of Truth

The key to keeping agents *consistent* across runs is having all of them read the same `AGENTS.md`. This file defines the conventions Sentinel must verify, the tone Scribe must use, and the thresholds Bolt must respect.

```markdown
<!-- AGENTS.md — excerpt from the CI/CD section -->
## Pipeline Rules

### Sentinel (Code Review)
- CRITICAL: Every public function must have KDoc
- CRITICAL: UseCases must be in the `domain.usecase` package
- WARNING: Avoid business logic in ViewModels
- SUGGESTION: Prefer `StateFlow` over `LiveData` in new code

### Scribe (Documentation)
- KDoc format: first paragraph = description, @param = all non-obvious parameters
- CHANGELOG: follow Keep A Changelog format, [Unreleased] section
- Language: English for KDoc, project language for internal comments

### Bolt (Performance)
- Regression threshold: 10% on startup time, 15% on list operations
- Baseline file: benchmark/baseline.json (update on each release)
- Priority metrics: TimeToFullDisplayMs, FrameOverrunMs
```

With this contract, any new agent added to your toolset in the future can read the same `AGENTS.md` and behave consistently. **It's like automated onboarding for your AI agents.**

## 🔀 Advanced Coordination: Conditional Flows

The basic example is linear: Sentinel → (Scribe + Bolt). But real pipelines need more sophisticated conditional logic.

### Skip Scribe for Small PRs

```yaml
scribe-docs:
  needs: sentinel-review
  if: |
    needs.sentinel-review.outputs.review_passed == 'true' &&
    github.event.pull_request.changed_files > 3
```

### Security Agent Only for Data Layer Changes

```yaml
security-scan:
  needs: sentinel-review
  if: |
    contains(github.event.pull_request.labels.*.name, 'data-layer') ||
    contains(steps.diff.outputs.changed_files, 'data/repository')
```

### Auto-Correction Loop

The most advanced pattern is the **self-healing pipeline**: if Sentinel finds simple style issues (non-critical), it fixes them automatically, commits, and re-triggers the workflow.

```yaml
- name: Auto-fix style issues
  if: steps.review.outputs.has_style_issues == 'true'
  run: |
    python scripts/agents/sentinel_autofix.py \
      --issues review_result.json \
      --apply-fixes
    git commit -am "fix(sentinel): auto-fix style issues [skip ci]"
    git push
```

> **Watch out for infinite loops!** Always add the `[skip ci]` condition to agent commits, or implement a check that detects if the commit was made by the agent to avoid re-triggering the pipeline.

## 🚀 Gradual Rollout: From Pilot to Production

Don't implement all of this at once. A gradual rollout reduces risk and gives you time to calibrate your agents:

**Weeks 1-2:** Sentinel in `COMMENT` mode (non-blocking). Observe the quality of its reviews and adjust the prompt.

**Weeks 3-4:** Sentinel in `REQUEST_CHANGES` mode for critical issues. Add Scribe in read-only mode (generates KDoc but doesn't commit it).

**Week 5+:** Full pipeline. Bolt active with conservative thresholds (30% regression before alerting). Fine-tune until you reach 10%.

This approach gives you time to **trust** your agents before granting them write permissions on the repository.

## Conclusion

Integrating AI agents into your CI/CD pipeline isn't about replacing your current process — it's about **adding a layer of specialized intelligence** at exactly the moments where it delivers the most value. Sentinel ensures code consistency without the tech lead having to manually review every PR. Scribe makes sure documentation doesn't fall behind the code. Bolt prevents performance regressions from reaching production undetected.

The `AGENTS.md` file acts as the contract that keeps all agents — human and AI — working under the same rules. And GitHub Actions is the orchestrator that decides when and in what order each one acts.

The natural next step is adding a planning agent that coordinates the others using a framework like CrewAI or LangGraph. But that's a story for another time.

## References

- [GitHub Actions Documentation — Jobs and Contexts](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/contexts)
- [OpenAI API — Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Android Benchmarking — Macrobenchmark](https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview)
- [Keep A Changelog](https://keepachangelog.com/en/1.1.0/)
- [CrewAI Documentation](https://docs.crewai.com/)
- [LangGraph — Agentic Workflows](https://langchain-ai.github.io/langgraph/)
