---
title: "Astro and vitest: the devlog guard against secrets"
description: "How the devlog ended up publishing the real Google Analytics measurement ID, and why the fix was not an external scanner but a vitest that walks src/content."
pubDate: 2026-10-12
lastmod: 2026-10-19
author: "ArceApps"
keywords:
  - "Astro"
  - "vitest"
  - "content secrets"
  - "Google Analytics"
  - "ArceApps Portfolio"
canonical: "https://arceapps.com/en/devlog/2026-10-12-portfolio-content-secrets/"
heroImage: "/images/devlog/portfolio-content-secrets.svg"
tags: ["Astro", "vitest", "Privacy", "DevOps", "Building in Public"]
---

Some articles quietly undo themselves. On 12 October 2026, while merging PR #71 over the Consent Mode v2 devlog that had been published the day before, an editorial pass noticed that article had been carrying, in two languages, the actual Google Analytics measurement ID of the site. That ID lives in `src/layouts/Layout.astro` for a legitimate functional reason: the file uses it to load `gtag.js` on every page and keep analytics running. What it cannot do is sit duplicated inside a technical article about cookie consent — an article whose whole point was to explain why those IDs should never be exposed without good reason. The fix was almost trivial —four edits, two additions and two deletions per language— but the lesson was not the fix. The lesson is that the editorial content of a portfolio cannot rely on simply having no secrets in it. It needs an executable check that says *no* when someone publishes them.

This entry walks through the full mechanics of that PR and, more importantly, the guard that comes with it: a vitest file at `src/utils/sensitive-content.test.ts`, which recursively walks `src/content`, looks for known measurement identifiers, API keys and credentials, and fails Content CI if it finds any. It is a small test —fifty-eight lines, including a recursive `walk` and nine regular-expression patterns— but its effect is out of proportion to what it costs.

## A devlog is an editorial surface, not a code surface

To understand why the answer was not an external scanner such as trufflehog or gitleaks, it helps to start with something that distinguishes this repository from almost any other: `src/content` does not compile, is not minified, and is not covered by unit tests. Its contract is editorial. A badly written article is still a valid article for Astro, as long as it satisfies the Zod schema in `src/content/config.ts`. And yet `src/content` is published to the public mirror `arceapps.github.io` with almost no filtering. `astro.config.mjs` already marks the directory as content that ends up in the static build.

That asymmetry —light validation at one end, effective publication at the other— is what allowed the measurement ID to leak without tripping any classic CI gate. The pipeline already tested content against the schema and against an Astro build. Neither of those looks at the *substance* of the Markdown. The schema validates that `title` is no longer than 100 characters, that `keywords` has between 3 and 5 entries, that `canonical` parses as a URL. The Astro build composes HTML and leaves it ready. Nowhere in either step is there a check that the text does not contain secrets. And yet the text gets published.

That is the crack.

`src/content` is also a place where copy tends to mirror source code. The Consent Mode v2 devlog was about how `gtag.js` gets loaded on the site, and to explain it the article quoted the exact line in `Layout.astro` where the ID appears. That was a natural example: when you are writing about how Google Analytics is loaded, you tend to copy the load URL, which is exactly where the ID is visible. And on top of that, the ID is also in the site's privacy policy. The risk exists for anyone documenting the topic. The problem was not lack of care. It was lack of a *barrier*.

## Why the answer was not "be more careful"

Three natural reactions exist when a secret ends up in a published devlog.

1. **Edit it by hand and learn the lesson.** Works once. The next time someone drafts examples about any external service with a key, the same thing happens again.
2. **Add a reminder to CONTRIBUTING.md** so that every PR opener remembers to scan the text. It is documentation; by construction, it is not executed.
3. **Trust GitHub secret scanning** or scanners like gitleaks and trufflehog. They each have their place, but their default patterns are calibrated for source code, not for prose. And editorial content naturally generates noise —words like *token*, *secret*, *AWS*— that triggers false positives which end up ignored.

None of the three is satisfactory alone, and together they are not satisfactory either. The first two depend on individual discipline in an editorial automation that runs on autopilot. The third introduces an external tool that adds cost and its own configuration dialect without addressing the root problem: the asymmetry between what Astro validates and what Astro publishes.

After thinking it through twice, the option I chose was the one that most resembled what the repository already did: a **test**.

## Why the test lives inside the repo, not in an external pipeline

There are three reasons, in this order, why the solution is a vitest inside the project itself.

The first is that the repository already runs `pnpm test` in Content CI. The pipeline does not expand with a new step; it extends an existing one. Content CI already does checkout, installs dependencies, runs `pnpm test`, and then `pnpm build`. If that first step finds a secret in `src/content`, it fails before reaching the build. Content CI by design runs on *every PR to `main`*, so the block happens where it needs to happen: at the moment someone merges.

The second is coverage. Vitest discovers files matching `src/**/*.{test,spec}.{js,ts}` by default. Any new file in `src/utils/` whose name ends in `.test.ts` is picked up automatically the next time around. There is no `index.ts` to maintain, no global import to add, no configuration to keep in sync.

The third is that the test is **readable**. Forty lines of regex, in order, with a name for each pattern. A future maintainer —or a future version of me at three in the morning— can add a new pattern in thirty seconds, because the code is readable without context.

I could have adopted trufflehog or gitleaks as dependencies. They work, but in this project they would have added a layer that only understands secrets. I prefer a test that reads as a test, not as a tool.

## The guard: fifty-eight lines of editorial paranoia

Here is the full file. I reproduce it here with minimal commentary so the next person reading it cold does not have to invest in context.

```ts
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

// Guard for published editorial content: articles must never reproduce
// real tracking identifiers, API keys, or credentials. Refer to them
// generically instead (e.g. "the Google Analytics measurement ID").
const CONTENT_DIR = join(process.cwd(), "src", "content");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const SENSITIVE_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "Google Analytics 4 measurement ID", re: /\bG-[A-Z0-9]{6,}\b/ },
  { name: "Universal Analytics ID", re: /\bUA-\d{4,}-\d+\b/ },
  { name: "Google Ads / conversion ID", re: /\b(?:AW|DC|GT)-[A-Z0-9]{6,}\b/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "secret API key", re: /\bsk-[A-Za-z0-9_-]{16,}\b/ },
  {
    name: "GitHub token",
    re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  },
  { name: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "AWS access key ID", re: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    name: "private key block",
    re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/,
  },
];

const contentFiles = walk(CONTENT_DIR).filter((f) =>
  [".md", ".mdx"].includes(extname(f)),
);

describe("published content does not leak secrets or tracking identifiers", () => {
  it("has content files to scan", () => {
    expect(contentFiles.length).toBeGreaterThan(0);
  });

  for (const { name, re } of SENSITIVE_PATTERNS) {
    it(`does not contain a ${name}`, () => {
      const hits: string[] = [];
      for (const file of contentFiles) {
        const lines = readFileSync(file, "utf8").split("\n");
        lines.forEach((line, index) => {
          if (re.test(line)) {
            hits.push(`${file}:${index + 1}`);
          }
        });
      }
      expect(hits).toEqual([]);
    });
  }
});
```

Five structural ideas deserve a quick note.

`walk` walks `src/content` recursively, without following symlinks and without crossing the root — a breadth-first scan, the old-fashioned way, where each directory entry is inspected with `statSync`, and if it is a directory it recurses, otherwise it returns the path. It is deliberately synchronous: the repository's scale is dozens of Markdown files, not millions, so synchronous simplicity wins.

`SENSITIVE_PATTERNS` is the list of things the guard knows how to detect. Each entry pairs a readable name with a regular expression. The idea is that adding a new kind of secret is one line and a comment, not a system.

The outer `describe` names the guard. Each inner `it(...)` checks a single pattern. If the pipeline fails with a long message, it is trivial to tell which family of secrets leaked —the test name says it— and in which file and line, because each match is recorded as `path:line`.

The file list is filtered by extension `.md` and `.mdx`. Astro only publishes Markdown and MDX under `src/content`, so the rest does not matter. The filter is by extension, not by folder convention, because some articles live directly under `devlog/es/...` and others under `blog/es/...`. The guard does not need to know where; it needs to know what gets published.

The regexes use `\b` (word boundary) to avoid false positives where `G-12345` (only five characters after `G-`, below the minimum) or to stop `G-1234abc` from being confused with a real ID because it contains lowercase letters. Each pattern's minimum length is calibrated so a short prefix is not confused with a real identifier —GA4 requires at least six alphanumerics after `G-`, Universal Analytics requires at least four digits before the dash, and `AIza` requires exactly 35 characters after the signature because Google API keys have a fixed length.

## The nine patterns, one by one

Each pattern is worth a paragraph, because the decisions in each regex mirror the specific shape of how the secret leaks.

**GA4 `\bG-[A-Z0-9]{6,}\b`.** This is the most common pattern now. It detects any Google Analytics 4 measurement identifier. The minimum length of six characters rules out accidental matches in generic references like "G-123" that a writer might use to talk about the format without using a real ID. The character class `[A-Z0-9]` covers the real alphabet Google uses —uppercase letters and digits— with no lowercase, because Google does not emit them.

**Universal Analytics `\bUA-\d{4,}-\d+\b`.** Covers the legacy Analytics, still in use on some sites. UA stopped processing data in July 2023, but it is still a relevant pattern because many older articles cite it.

**Google Ads / conversion `\b(?:AW|DC|GT)-[A-Z0-9]{6,}\b`.** A single regex with three prefixes because Ads (`AW-`), the conversion API (`DC-`) and the tag converter (`GT-`) share the same shape. Same minimum length as GA4, because the convention is the same.

**Google API key `\bAIza[0-9A-Za-z_-]{35}\b`.** The API key for Google services —Maps, YouTube Data, Translate— starts with `AIza` and is exactly 39 characters long. The regex requires the 35 characters after `AIza`; fewer than that is probably not a real key.

**Generic secret `\bsk-[A-Za-z0-9_-]{16,}\b`.** Pattern used by OpenAI, Stripe and many services that emit keys with the `sk-` prefix. The minimum 16 characters avoids false positives like "sk-123" appearing in prose about the format.

**GitHub tokens `\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b`.** Two forms because GitHub issues fine-grained personal tokens (`ghp_...`), OAuth tokens (`gho_...`), user-to-server tokens (`ghu_...`), server-to-server tokens (`ghs_...`) and refresh tokens (`ghr_...`), plus the new fine-grained personal access tokens with the `github_pat_` prefix. Each one ends in at least 20 alphanumeric characters.

**Slack tokens `\bxox[baprs]-[A-Za-z0-9-]{10,}\b`.** Covers the bot, app, user, refresh and install tokens Slack issues.

**AWS access key ID `\bAKIA[0-9A-Z]{16}\b`.** AKIA is the classic prefix of long-lived AWS keys; STS keys, which are short-lived, start with ASIA and have a different pattern that I have not yet included. It is a deliberate gap in the guard: STS keys do not get quoted in documentation because they are not printable in prose, and adding their regex would add noise. The plan is to close that gap the next time a concrete need appears.

**Private key block `-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----`.** It catches full PEM blocks of private keys —RSA, ECDSA, OpenSSH, DSA, PGP—. It is an unambiguous anchor: nobody writes that string in prose by accident.

## Why these nine, and no more

The temptation when building a guard like this is to enumerate every imaginable external service. That is a bad idea for two reasons.

The first is that each additional pattern adds maintenance surface. AWS has long-lived and short-lived access keys, several types of session tokens, and an evolving taxonomy. Google issues keys for well over a dozen services, each with its own prefix and length. GitHub has changed the shape of its tokens three times in five years. Listing everything turns the guard into a catalogue of external services, and a catalogue like that goes stale faster than it is audited.

The second is that we cover what matters for a portfolio: measurement identifiers, common API keys and canonical credentials —the things that, if printed by accident in an article, make the article itself *dangerous to read*. The rest is covered by GitHub's native secret scanning when the repository is private, which is exactly our case.

That hierarchy — editorial guard for the editorial surface, native secret scanning for code — avoids duplication and keeps the guard focused on what can fail in `src/content`.

## What the PR fixed, and what the PR did not touch

PR #71 merged five changes.

The first, second, third and fourth are edits to the two affected articles —cookie-consent in Spanish and English, responsive visual hierarchy in Spanish and English. Each edit replaces the real ID with a generic reference —"el identificador de medición de Google Analytics" in Spanish, "the Google Analytics measurement ID" in English. In the responsive visual hierarchy article, where the ID lived inside a code fragment reproducing the old `Layout.astro`, the replacement was a *symbolic constant*: `GA_MEASUREMENT_ID`. That lets a reader understand the format without seeing a real identifier. The pattern `\bG-[A-Z0-9]{6,}\b` does not fire on `GA_MEASUREMENT_ID` because the second word `_MEASUREMENT_ID` does not fit `[A-Z0-9]{6,}`: it contains an underscore, which is outside the regex's character class. It is a deliberate choice: if anyone wants to swap *measurement* for another word later, the substitution stays valid.

The fifth change is the guard. The other four are its reason to exist.

The PR did not change the production behavior of Google Analytics. The real ID stays where it must —in `src/layouts/Layout.astro`— because that file is the functional source of the behavior. The asymmetry is deliberate and useful: the ID is public for the browser that executes it, but not for the editorial repository that mentions it.

## Verification, numbers, expected behavior

Locally the test passes 10/10: the "there is content to scan" check plus the nine patterns. Content CI runs it automatically on every PR to `main` before `pnpm build`, so any future leak gets intercepted at code review.

The execution cost is negligible. `src/content` contains fewer than a hundred Markdown files, and each file is read once per pattern. The entire test ends in milliseconds —no network, no heavy parsing, no heavy dependencies—.

Maintenance cost exists: when a new secret type deserves to be in the list, the pattern has to be added. I treat it as a normal bug: open a PR, add the line, update the list. Each pattern is readable; adding one does not require understanding the others.

## What I learned — and what changes from here on

Three lessons survive the bug.

The first is that **a repository that publishes cannot rely on the writer's discipline**. The cookie-consent PR was written carefully: the four alternatives were documented, Consent Mode v2 was justified against paths A, C and D, the explanation for why Partytown did not guarantee the default-denied order was there. And yet it copied an ID. Editorial discipline is not a barrier; it is a good predisposition that needs a barrier behind it for when it fails.

The second is that **the editorial surface needs a guard proportional to its publication surface**. A test that fails in CI is stronger than a note in CONTRIBUTING.md, because it is executed by construction. The guard does not stop someone from writing an ID in a Markdown file. It stops that ID from reaching production after the merge.

The third is that **editorial secrets are a test problem, not a configuration problem**. Listing external services in a YAML table is tempting; a test that walks the content looking for patterns is executable, debuggable, and leaves a trail in the CI log when it fails. The difference between the two is the difference between an agreement and a wall.

From now on, every time a devlog reproduces a load URL, an example key, or a configuration fragment with real values, the guard will check that those values are not real. If they are, the PR will not reach `main`.

And when the guard falls short —because a new service will appear, a new token format, a new shape of identifier— the pattern gets added to the existing file. The test is small enough for that.

## Next steps

Three improvement lines, in order of priority.

The first, already underway: add AWS STS keys (`\bASIA[0-9A-Z]{16}\b`) and OAuth client-secret keys to the guard — the visible gaps today are manageable.

The second, pending: extend the guard to `agents/`, where the Scribe prompt and the bot workflows can also contain example keys. The current coverage is only `src/content`; widening to `agents/` covers a larger radius.

The third, medium-term: consider moving the walk to a standalone CI script so it can also run inside `sync-to-public.yml` before synchronising to the public mirror, not only on PR. Current coverage protects against leaking at the source; widened coverage would also protect against accidentally re-publishing what was already leaked.

## References

- PR #71: [`fix(content): redact real analytics ID and add secret-leak guard`](https://github.com/ArceApps/web-portfolio/pull/71) — the point fix and the guard.
- [Vitest — Getting Started](https://vitest.dev/guide/) — the framework the guard runs in; with no extra setup, it discovers `*.test.ts` by convention.
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) — the Zod schema under which `src/content` compiles, and which delimits what gets published.
- [GitHub — Secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning) — the native layer for source code; not a substitute for the editorial guard.
- Cookie consent devlog: [When Partytown stopped being the answer](https://arceapps.com/en/devlog/2026-08-12-portfolio-cookie-consent/) — the article whose own correction motivated this guard, and which the corrective PR links back to.
- Mirror pipeline devlog: [GitHub Actions: from private runner to mirror](https://arceapps.com/en/devlog/2026-W39-portfolio-mirror-pipeline/) — where the pipeline that synchronises the corrected content to the clean public mirror is documented.
