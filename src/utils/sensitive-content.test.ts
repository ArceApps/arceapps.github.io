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
