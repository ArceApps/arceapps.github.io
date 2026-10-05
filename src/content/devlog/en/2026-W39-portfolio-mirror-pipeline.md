---
title: "GitHub Actions: from private runner to mirror"
description: "How the portfolio separated private source, public mirror and Pages deployment after moving every job to one runner proved too broad."
pubDate: 2026-09-21
lastmod: 2026-10-05
author: "ArceApps"
keywords:
  - "GitHub Actions"
  - "GitHub Pages"
  - "self-hosted runner"
  - "repository mirror"
  - "ArceApps Portfolio"
canonical: "https://arceapps.com/en/devlog/2026-W39-portfolio-mirror-pipeline/"
heroImage: "/images/devlog/portfolio-mirror-pipeline.svg"
tags: ["GitHub Actions", "GitHub Pages", "DevOps", "Astro", "Building in Public"]
---

Some changes begin as an operational fix and end up forcing you to draw an architectural boundary that was previously only implicit. That is exactly what happened to the portfolio on September 20 and 21.

The trigger was practical: available GitHub Actions minutes were no longer a resource I could simply take for granted. The first move was reasonable in isolation. I already had a self-hosted runner, so the portfolio workflows could run there instead. PR #58 did exactly that: deployment, public-mirror synchronization and OpenCode moved to `self-hosted`.

The problem became visible when I stopped looking at each workflow separately and looked at the whole publishing system.

The portfolio was no longer just one repository building one website. `ArceApps/web-portfolio` was the private workspace, while `ArceApps/arceapps.github.io` acted as a clean public mirror. Applying the same runner strategy to both sides meant that a cost optimization was erasing a trust boundary. A persistent private machine with access to my working environment should not become the general execution environment of the public repository.

Less than seven hours after PR #58, PR #59 corrected the direction. The self-hosted runner stayed on the private side, where it prepares the release tree. The public mirror went back to `ubuntu-latest`, where it builds and deploys Pages. PR #60 then documented the resulting architecture in a technical article.

This devlog is not a rewrite of that guide. The guide explains how to reproduce the pattern and what each piece does. What matters here is the sequence: why a sensible local optimization became the wrong global architecture, how the mirror stopped being merely a copy and became a release boundary, and what separating cost, trust and deployment taught me.

## The starting point: a repository that was no longer only a website

It is easy to picture an Astro portfolio as a conventional web repository:

```text
src/
public/
package.json
astro.config.mjs
```

But `web-portfolio` had grown around the site. The repository also contains technical documentation, agent configuration, automation, specifications and working material that is useful while developing but is not part of the public product.

That creates two concepts that look similar but are not equivalent:

```text
development repository
publishable distribution
```

As long as both live in one repository, the distinction can feel philosophical. The moment a public mirror exists, it becomes operational.

The private source can contain everything needed to build, reason about and automate the project. The mirror should contain only what I deliberately accept as public. I did not want to replicate private Git history, and I did not want a `.gitignore` to masquerade as a publishing security policy. I wanted to produce a clean tree.

That distinction was already implicit in the synchronization script. The runner change forced me to treat it as an explicit architectural property.

## PR #58: move everything to my own runner

PR #58 was titled `ci: use self-hosted runner for web workflows`. Its intention was straightforward: stop depending on hosted minutes for the portfolio jobs.

The affected workflows included deployment, mirror synchronization and OpenCode. Conceptually, the change was almost mechanical:

```yaml
runs-on: self-hosted
```

If you only look at the private repository, the decision makes sense. The Mini PC already exists, can run Node, pnpm and the project tools, and gives me an execution environment that does not depend on the hosted-minute budget.

A self-hosted runner can also be convenient for long jobs and local caches. The machine persists, and I control the installed toolchain.

But persistence is also the reason a self-hosted runner deserves more care.

A normal GitHub-hosted runner is ephemeral for the job. It is provisioned for execution and does not become my general-purpose server afterward. My private runner is a machine that remains part of my infrastructure after the workflow finishes.

The right question therefore stopped being “where is this build cheaper to run?” and became “what code am I willing to execute on a persistent machine that belongs to my infrastructure?”

That change of question was the real beginning of the current architecture.

## Self-hosted was not the mistake

It is important not to take the wrong lesson from the correction. The problem was not using `self-hosted`.

The final design still relies on it.

The mistake was treating all jobs as if they belonged to the same trust zone.

The private and public repositories have different responsibilities. The private repository is a controlled workspace. The public repository is, by definition, an exposed surface: its code is visible and its collaboration model can change over time. Even if I do not currently execute arbitrary third-party pull requests, designing the system as if the public repository were equally trusted creates unnecessary risk.

The private runner needs access to the source and permission to write the distribution. That work belongs on the private side.

The public build does not need access to the private workspace. It can run on GitHub's ephemeral infrastructure and receive only the tree that has already crossed the publishing boundary.

The separation became:

```text
private web-portfolio
        |
        | self-hosted
        | filter and sync
        v
public arceapps.github.io
        |
        | ubuntu-latest
        | build and deploy
        v
GitHub Pages
```

That diagram looks obvious now. It was not obvious when the immediate objective was simply to make workflows run without consuming the wrong pool of minutes.

## PR #59: turn security into topology

PR #59, `ci: keep self-hosted runner private`, corrected the architecture.

The deployment workflow gained an explicit repository guard:

```yaml
jobs:
  build:
    if: github.repository == 'ArceApps/arceapps.github.io'
    runs-on: ubuntu-latest
```

The deployment job follows the same principle. The public repository is responsible for building Pages, and it does so on a hosted runner.

On the other side, synchronization has the inverse condition:

```yaml
jobs:
  sync:
    if: github.repository == 'ArceApps/web-portfolio'
    runs-on: self-hosted
```

I particularly like this part because the policy does not exist only in prose. It is encoded in the workflow.

Even if a workflow file ends up somewhere unexpected, the job asks which repository it is running in before doing anything.

That is defense in depth. The mirror script also excludes the synchronization workflow, but the security model does not depend on that exclusion remaining perfect forever.

The final topology expresses the trust model:

- the private runner touches the private source;
- the mirror receives a filtered tree;
- the public runner sees only the public tree;
- Pages receives the compiled artifact.

The public runner does not need to know the private repository. The private runner does not need to execute code from the public mirror.

## The mirror stopped being “a copy”

Before this review I could describe `arceapps.github.io` as a public mirror and leave it there.

That now feels incomplete.

A traditional mirror suggests replication. This repository does not replicate private Git history and does not replicate every file. It is a distribution generated through policy.

The private workflow checks out both source and destination and then runs:

```bash
./scripts/sync-mirror.sh "$GITHUB_WORKSPACE" "$RUNNER_TEMP/clean-mirror"
```

The script creates a clean temporary directory and applies explicit exclusions with `rsync`.

Among the excluded paths are:

```text
.git
.opencode
agents
docs
openspec
AGENTS.md
BUGS.md
CONTEXT.md
test-results
dist
node_modules
```

The synchronization workflow itself, `.github/workflows/sync-to-public.yml`, is excluded as well.

The important property is that the script does not “clean” the private repository. It constructs another tree.

That changes the mental model:

```text
private source + publication policy = public distribution
```

The source remains intact. The distribution can be destroyed and regenerated.

That asymmetry is healthy.

## Why I do not push private history

Once two repositories exist, synchronizing them with Git itself is tempting.

For this use case it would be the wrong abstraction.

A `git push --mirror` is intended to replicate refs and history. That history is exactly what I do not want to make public accidentally.

A file can disappear from today's working tree and still exist in an old commit. A publishing policy that filters the current tree cannot make private history safe if the history itself is pushed.

So the pipeline copies files and lets the public repository create its own history.

The destination checkout keeps its `.git`, receives the filtered tree with:

```bash
rsync -av --delete --exclude='.git' \
  "$RUNNER_TEMP/clean-mirror/" public-repo/
```

and creates a public commit only when something actually changed.

The repositories have different histories because they represent different things:

- private history explains how I work;
- public history explains what I published.

They do not need to be isomorphic.

## `--delete`: the option that prevents ghosts

One of the least glamorous decisions in the pipeline is `--delete`.

Without it, synchronization can copy new files while leaving behind files that no longer exist in the source. That may be useful in some backup models. It is wrong for a public distribution.

Imagine a path that was publishable yesterday but is removed today or moved into an internal area. If the mirror keeps the old file, the current publication policy says one thing while the actual public tree says another.

The semantic I want is:

```text
mirror = current publishable state
```

not:

```text
mirror = accumulation of everything ever copied
```

The script uses deletion semantics while preparing and applying the clean tree.

The result is useful operationally: I can inspect the public repository as a snapshot of the current policy. Obsolete files do not survive merely because no later job happened to overwrite them.

## Denylist: convenient, but not free

The current script publishes everything except a set of excluded paths.

That is a denylist.

For a portfolio it is convenient. If I add a component, image or public route, it normally reaches the mirror without requiring a second edit to the synchronization policy.

But the failure mode deserves attention. If I create a new internal directory tomorrow and forget to exclude it, that directory can become public.

An allowlist would invert the relationship:

```text
publish src/
publish public/
publish package.json
publish astro.config.mjs
...
```

That is safer against accidental exposure because a new path stays private until declared. The trade-off is operational: a legitimate new build input can disappear from the public tree until the allowlist is updated.

I did not switch to an allowlist during this period. That matters. A devlog should not present an identified improvement as if it were already implemented.

The lesson is narrower: the current policy favors ergonomics and therefore needs conscious review. If the private repository becomes more sensitive, an allowlist is a reasonable future evolution.

## The boundary is not a secret manager

Another important lesson is not to ask the mirror to solve a different security problem.

Excluding internal files does not make it acceptable to commit secrets.

Publishing credentials still belong in GitHub Secrets or equivalent mechanisms. The mirror filters documentation, automation and working artifacts; it is not a machine that erases security mistakes from Git history.

The workflow uses `PUBLIC_RELEASE_TOKEN` to write to the public repository. That credential has one narrow responsibility: allow the private side to publish the distribution.

The architecture is stronger when every credential and every runner has the smallest useful scope.

That connects directly to PR #59: if the public build does not need the private publishing credential, it should not receive it.

## Two pipelines joined by a commit

The final design has a property that initially looked like extra complexity and now looks like an advantage: publishing is not one giant workflow.

There is a private pipeline:

```text
push web-portfolio/main
 -> checkout private source
 -> checkout destination
 -> create clean-mirror
 -> rsync
 -> public commit
 -> push arceapps.github.io/main
```

And a public pipeline:

```text
push arceapps.github.io/main
 -> ubuntu-latest
 -> pnpm install
 -> refresh app data
 -> pnpm build
 -> upload-pages-artifact
 -> deploy-pages
```

Git is the hand-off between them.

That adds an intermediate commit, but it also creates an inspection point. If the public build fails, I can inspect the exact distribution it tried to compile. If synchronization produces no change, no empty commit is created and the second pipeline does not need to pretend work happened.

Permissions are decoupled too. The first pipeline needs permission to write the mirror. The second needs Pages permissions, but not access to the private source.

In security architecture, “one more step” does not always mean “bad complexity.” Sometimes that step is what allows every component to carry less privilege.

## Concurrency and the single logical writer

The synchronization workflow defines:

```yaml
concurrency:
  group: sync-to-public
  cancel-in-progress: false
```

It could cancel an older synchronization when a new push arrives. I deliberately did not choose that behavior.

The reason is sequencing rather than performance.

A publication that has already started can finish; the next one waits and publishes the later state. For this flow I prefer a coherent queue over interrupting a job between two checkouts and a synchronization operation.

That is not a universal rule. For preview builds or expensive validation, `cancel-in-progress: true` can be exactly right. Here the goal is to maintain one logical writer to the public mirror.

It is a small configuration choice, but reliability often lives in choices too small to deserve their own feature.


## The mirror contract can be tested

The architecture also suggests a more precise verification model. A green build answers one question: “does the public distribution compile?” The mirror needs to answer another one as well: “does the distribution contain only what the publication policy allows?”

Those are different properties.

The script already materializes a `clean-mirror` directory, which creates a natural place to check invariants before pushing. A validation step could fail if it finds paths such as `agents/`, `.opencode/` or `docs/`, while also requiring the files Astro needs to build.

Conceptually:

```bash
test ! -e clean-mirror/agents
test ! -e clean-mirror/.opencode
test ! -e clean-mirror/docs
test -f clean-mirror/package.json
test -d clean-mirror/src
```

I did not implement that suite during the period described here, so I am not presenting it as an existing guarantee. The important result is that the new topology makes the contract expressible.

Before the change, “synchronize the repository” could mean too many things. Afterward, the contract is narrower: a private execution transforms a workspace into a public tree, and a public execution transforms that tree into a Pages artifact.

Each arrow can be verified independently.

It also gives failures a clearer location. If the mirror contains a forbidden path, the publication boundary is wrong. If the mirror is correct but Astro does not compile, the problem belongs to the distribution or build. If both stages work and Pages fails, the problem belongs to deployment.

Separating pipelines does not eliminate failures. It gives them an address.

## A small but explicit threat model

A personal portfolio did not need to become an academic security exercise, but it did help to identify what the architecture was protecting.

There were three different risks.

The first was **publishing more files than intended**. The filtering script and the decision not to replicate private Git history reduce that risk.

The second was **executing public code on persistent private infrastructure**. Keeping the mirror build on `ubuntu-latest` avoids turning the Mini PC into that execution surface.

The third was **giving one component more credentials than it needs**. Splitting synchronization from deployment means the credential that writes the mirror can exist where it is required, while Pages operates with its own permissions.

None of those controls is universal. A denylist can become stale, a long-lived token still needs careful handling, and workflow definitions are themselves part of the trusted surface.

But the risks are no longer mixed together under one vague label called “CI.” Each one maps to a concrete boundary and can evolve without redesigning the entire system.

That modularity is an important consequence of the correction. Replacing the mirror token later does not require changing how Pages builds. Replacing the denylist with an allowlist does not require moving the public runner. Moving to a different hosting provider would not require the private workspace to abandon its distribution contract.


## PR #60: document after correcting

One part of the chronology I particularly like is that the long-form documentation came after both CI changes.

PR #60 published “GitHub Pages: Private Portfolio, Public Mirror.” It documents the real workflow, the filtering script, runner separation, the denylist/allowlist trade-off and credential handling.

That matters because the article does not describe a hypothetical architecture. It describes the architecture after the first attempt had already been corrected.

It also keeps this devlog from turning into a tutorial. If someone wants to reproduce the pattern, the technical article is the better destination. Here I can preserve the story of the change.

The editorial split mirrors the system split:

- the technical article explains the mechanism;
- the devlog explains the evolution and decisions.

They cover the same system without needing to be the same piece of writing.

## What changed in how I see the portfolio

Before this period I mostly thought of the portfolio as a website with automation around it.

Afterward, I see a small publishing system with three layers:

1. **workspace** — where private tools and context can live;
2. **release source** — the filtered public repository;
3. **artifact** — the `dist` tree served by Pages.

Each layer can have different permissions.

That model is more useful than asking only whether “the repository” is private or public.

It also forces a distinction between availability and security. Moving jobs to my own runner addressed availability and hosted-minute cost. Leaving every job there weakened the trust boundary. PR #59 did not simply undo PR #58; it refined where each part belonged.

The self-hosted runner remained a solution. It stopped being a universal solution.

## What I do not consider finished

The system works, but there are improvements I do not want to disguise as completed work.

The first is the denylist. It still requires remembering new internal paths.

The second is the write credential for the mirror. The current workflow uses a dedicated token. The technical article already notes the value of minimum privilege and alternatives such as GitHub Apps or shorter-lived credentials.

The third is that a clean mirror deserves tests for its publication policy. An Astro build proves the public tree can build; it does not prove forbidden paths are absent.

Later, Content CI added for the portfolio strengthened another part of the project, but I will not retroactively insert it into this September story. During this period, the central work was the private/public boundary.

Technical history becomes less useful if later improvements are presented as though they already existed.

## What I learned from a correction made within one day

The first lesson is that optimizing one resource in isolation can make the system worse.

“I have my own runner, so I will run everything there” is a local optimization. “Private and public code have different trust levels” is a global constraint.

The second lesson is that security becomes easier to reason about when drawn as a flow.

I did not need a grand new permissions framework. I needed to put each execution on the correct side:

```text
private -> private runner -> filter -> public -> ephemeral runner
```

The third lesson is that a mirror does not need to be a replica. It can be a compilation of publishable source: an explicit selection of what crosses the boundary.

The fourth is that Git can be the boundary between pipelines. The public commit is not noise; it is the contract between the process that prepares a distribution and the process that builds it.

The fifth is that documentation written after a correction is often better documentation. PR #60 could explain not only what existed, but why the public runner was deliberately different from the private one.

## Result

By the end of September 21, the portfolio had a clearer topology than it had at the beginning:

```text
ArceApps/web-portfolio
(private workspace)
        |
        | GitHub Actions / self-hosted
        | scripts/sync-mirror.sh
        v
clean public tree
        |
        | commit + push
        v
ArceApps/arceapps.github.io
(public release source)
        |
        | GitHub Actions / ubuntu-latest
        | pnpm build
        v
GitHub Pages
```

For someone visiting the website, almost nothing changed visibly. That is precisely the point.

Not every infrastructure improvement should produce a visual feature. Some should make the system easier to explain, reduce the number of responsibilities attached to each credential, and prevent a cost optimization from turning a private machine into a public execution surface.

This time the work started with a question about CI minutes and ended by defining where my workspace stops.

That is a trade I am happy to make.


## References

- [PR #58 — use self-hosted runner for portfolio workflows](https://github.com/ArceApps/web-portfolio/pull/58)
- [PR #59 — keep the self-hosted runner private](https://github.com/ArceApps/web-portfolio/pull/59)
- [PR #60 — article about the private/public mirror](https://github.com/ArceApps/web-portfolio/pull/60)
- [Technical article: GitHub Pages with a private repository and public mirror](/en/blog/github-pages-private-repo-mirror/)
- [GitHub Docs — About self-hosted runners](https://docs.github.com/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)
- [GitHub Docs — Deploying with GitHub Actions](https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
