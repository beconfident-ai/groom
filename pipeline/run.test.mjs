/**
 * Behavior suite for the pipeline. Free to run: nothing here spends an agent call.
 *
 *   npm test        (node --test pipeline/run.test.mjs)
 *
 * Imports the real exports from run.mjs (its entry point is main-module guarded),
 * exercises both CLIs as subprocesses, and runs the deterministic wiki validator
 * against the live wiki so structural regressions fail CI for free.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync, unlinkSync, utimesSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PIPELINES, OP_CONFIG, headline, promptFor } from "./run.mjs";
import { validate } from "./validate.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const STAMP = path.join(ROOT, "wiki", "_meta", ".last-background-refresh");

const cli = (script, ...args) =>
  spawnSync(process.execPath, [path.join(HERE, script), ...args], { encoding: "utf8" });

function withStamp(state, fn) {
  const prior = existsSync(STAMP)
    ? { content: readFileSync(STAMP), mtime: statSync(STAMP).mtime }
    : null;
  try {
    if (state === "fresh") writeFileSync(STAMP, new Date().toISOString());
    if (state === "absent" && prior) unlinkSync(STAMP);
    return fn();
  } finally {
    if (prior) {
      writeFileSync(STAMP, prior.content);
      utimesSync(STAMP, prior.mtime, prior.mtime);
    } else if (existsSync(STAMP)) {
      unlinkSync(STAMP);
    }
  }
}

test("headline: first substantive line of the agent's result", () => {
  assert.equal(headline("**Summary:**\n\nFixed the Composio citation."), "Fixed the Composio citation.");
  assert.equal(headline("Lint pass completed. All good."), "Lint pass completed. All good.");
  assert.equal(headline(""), "(no summary)");
  assert.equal(headline("**Summary:**\n\n"), "(no summary)");
});

test("PIPELINES: registry mirrors the prompt directory; composites compose singles", () => {
  for (const steps of Object.values(PIPELINES))
    for (const step of steps)
      assert.ok(existsSync(path.join(HERE, "prompts", `${step}.md`)), `prompt missing for '${step}'`);
  assert.deepEqual(PIPELINES.all, ["research", "expand", "lint", "prune"]);
  for (const op of ["lint", "expand", "prune", "iterate", "research"])
    assert.deepEqual(PIPELINES[op], [op]);
});

test("promptFor: every op prompt opens with the shared conventions", async () => {
  for (const op of Object.keys(PIPELINES).filter((o) => o !== "all")) {
    const prompt = await promptFor(op);
    assert.match(prompt, /^# Wiki conventions/);
    assert.match(prompt, new RegExp(`Operation: ${op.toUpperCase()}`));
  }
});

test("OP_CONFIG: every op is schema-scoped; offline ops get no web tools; no arbitrary Bash", () => {
  for (const op of ["lint", "prune", "iterate", "expand", "research"]) {
    const cfg = OP_CONFIG[op];
    assert.ok(cfg, `OP_CONFIG missing '${op}'`);
    for (const tool of cfg.tools.filter((t) => t.startsWith("Bash")))
      assert.match(tool, /^Bash\([a-z]+:\*\)$/); // prefix-scoped only — no Bash(find:*), no bare Bash
    assert.ok(!cfg.tools.includes("Bash(find:*)"), `${op} must not get find (it is arbitrary exec)`);
  }
  for (const op of ["lint", "prune"]) {
    assert.ok(!OP_CONFIG[op].tools.includes("WebFetch"), `${op} should not have WebFetch`);
    assert.ok(!OP_CONFIG[op].tools.includes("WebSearch"), `${op} should not have WebSearch`);
  }
  for (const op of ["research", "expand"])
    assert.ok(OP_CONFIG[op].tools.includes("WebFetch"), `${op} needs WebFetch`);
});

test("validate: the live wiki passes every structural invariant", () => {
  const { ok, errors } = validate();
  assert.ok(ok, `wiki invalid:\n${errors.join("\n")}`);
});

test("validate: returns the expected shape", () => {
  const res = validate();
  assert.equal(typeof res.ok, "boolean");
  assert.ok(res.stats.pages > 10);
  assert.ok(Array.isArray(res.errors));
});

test("run.mjs CLI: unknown op exits 1 with usage", () => {
  const r = cli("run.mjs", "bogus");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /usage: node pipeline\/run\.mjs/);
});

test("run.mjs CLI: status reports without spending an agent call", () => {
  const r = cli("run.mjs", "status");
  assert.match(r.stdout, /GROOM status/);
  assert.match(r.stdout, /wiki:.*pages/);
  assert.match(r.stdout, /git:/);
});

test("launcher: debounces when the stamp is fresh", () => {
  withStamp("fresh", () => {
    const r = cli("background-refresh.mjs");
    assert.equal(r.status, 0);
    assert.match(r.stdout, /next eligible in .*skipping/);
  });
});
