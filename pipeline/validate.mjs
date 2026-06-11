#!/usr/bin/env node
/**
 * Deterministic wiki validator — the structural invariants every op claims to
 * uphold, enforced in code instead of in a prompt. Zero model tokens.
 *
 *   import { validate } from "./validate.mjs"   // { ok, errors, warnings, stats }
 *   node pipeline/validate.mjs                  // CLI: prints report, exits 1 on error
 *
 * run.mjs calls this after every op as a gate; run.test.mjs calls it to keep
 * the live wiki honest for free. The maintenance agent no longer self-reports
 * "all links resolve" — this proves it.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = path.join(ROOT, "wiki");

const CONFIDENCE = new Set(["established", "emerging", "contested"]);
const REQUIRED = ["index.md", "sources.md", "glossary.md"];
const FRONTMATTER_FIELDS = ["title", "summary", "tags", "updated", "confidence"];
const SOFT_MAX_LINES = 150;

/** Parse the leading YAML-ish frontmatter block into a flat map (string values). */
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fields = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

export function validate(wikiDir = WIKI) {
  const errors = [];
  const warnings = [];
  const files = readdirSync(wikiDir).filter((f) => f.endsWith(".md"));
  const fileSet = new Set(files);
  const today = new Date().toISOString().slice(0, 10);

  for (const req of REQUIRED) {
    if (!fileSet.has(req)) errors.push(`missing required file: ${req}`);
  }

  for (const f of files) {
    const text = readFileSync(path.join(wikiDir, f), "utf8");

    const fm = frontmatter(text);
    if (!fm) {
      errors.push(`${f}: missing or malformed frontmatter`);
    } else {
      for (const field of FRONTMATTER_FIELDS) {
        if (!(field in fm)) errors.push(`${f}: frontmatter missing '${field}'`);
      }
      if (fm.confidence && !CONFIDENCE.has(fm.confidence)) {
        errors.push(`${f}: confidence '${fm.confidence}' not in {established, emerging, contested}`);
      }
      if (fm.updated && fm.updated > today) {
        errors.push(`${f}: updated date '${fm.updated}' is in the future`);
      }
    }

    for (const link of text.matchAll(/\]\(([a-z0-9-]+\.md)(?:#[^)]*)?\)/gi)) {
      if (!fileSet.has(link[1])) errors.push(`${f}: broken link → ${link[1]}`);
    }

    const lines = text.split("\n").length;
    if (lines > SOFT_MAX_LINES) warnings.push(`${f}: ${lines} lines (> ${SOFT_MAX_LINES})`);
  }

  // Fact-level canaries: load-bearing facts that must survive maintenance.
  // Structural checks are necessary but not sufficient (a true page can be made
  // false by omission while staying structurally valid); canaries close that gap
  // at zero token cost. An op that legitimately moves a fact updates its canary.
  const canaryPath = path.join(wikiDir, "_meta", "canaries.json");
  if (existsSync(canaryPath)) {
    let spec;
    try {
      spec = JSON.parse(readFileSync(canaryPath, "utf8"));
    } catch {
      errors.push("_meta/canaries.json: malformed JSON");
    }
    for (const c of spec?.canaries ?? []) {
      if (!fileSet.has(c.page)) {
        errors.push(`canary: page ${c.page} missing (fact: ${c.fact})`);
        continue;
      }
      const body = readFileSync(path.join(wikiDir, c.page), "utf8");
      if (!new RegExp(c.pattern).test(body)) {
        errors.push(`canary failed in ${c.page}: lost "${c.fact}" (/${c.pattern}/)`);
      }
    }
  }

  // Every page reachable from index.md (the wiki's stated invariant).
  if (fileSet.has("index.md")) {
    const index = readFileSync(path.join(wikiDir, "index.md"), "utf8");
    const linked = new Set([...index.matchAll(/\]\(([a-z0-9-]+\.md)\)/gi)].map((m) => m[1]));
    for (const f of files) {
      if (f === "index.md" || f === "sources.md" || f === "glossary.md") continue;
      if (!linked.has(f)) errors.push(`${f}: orphaned (not linked from index.md)`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      pages: files.length,
      lines: files.reduce((n, f) => n + readFileSync(path.join(wikiDir, f), "utf8").split("\n").length, 0),
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ok, errors, warnings, stats } = validate();
  for (const w of warnings) console.warn(`warn  ${w}`);
  for (const e of errors) console.error(`ERROR ${e}`);
  console.log(`\n${stats.pages} pages · ${stats.lines} lines · ${errors.length} errors · ${warnings.length} warnings`);
  process.exit(ok ? 0 : 1);
}
