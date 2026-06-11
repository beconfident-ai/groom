#!/usr/bin/env node
/**
 * EXPERIMENT — Fault-injection matrix with a no-gate baseline.
 *
 * The paper's central safety claim is that ANY failed maintenance operation is
 * reverted to the last good checkpoint rather than committed. Earlier we tested one
 * fault class (page deletion) and argued the rest "by construction." Here we inject
 * all nine fault classes that exercise the four gate clauses, and compare two arms:
 *
 *   GROOM     evaluate the real checkpoint gate; on reject, run the real recovery
 *             (git reset --hard + clean); assert the corpus is byte-identical to
 *             the checkpoint.
 *   baseline  the naive autonomous maintainer: commit the operation's output
 *             unconditionally. Measure whether corruption persists.
 *
 * Each GROOM arm runs REPS times to establish recovery reliability and latency.
 */
import { validate } from "../pipeline/validate.mjs";
import {
  freshRepo, cleanup, gate, recover, isClean, git, changedPaths, stats, now,
  path, writeFileSync, readFileSync,
} from "./lib.mjs";
import { readdirSync, existsSync, rmSync } from "node:fs";

const REPS = Number(process.argv[2] ?? 50);
const wikiOf = (repo) => path.join(repo, "wiki");
const pages = (repo) =>
  readdirSync(wikiOf(repo)).filter((f) => f.endsWith(".md") && !["index.md", "sources.md", "glossary.md"].includes(f));
const read = (repo, f) => readFileSync(path.join(wikiOf(repo), f), "utf8");
const write = (repo, f, s) => writeFileSync(path.join(wikiOf(repo), f), s);

/** Page with the most inbound links — deleting it maximally breaks the graph. */
function mostLinked(repo) {
  const all = readdirSync(wikiOf(repo)).filter((f) => f.endsWith(".md"));
  const inbound = Object.fromEntries(pages(repo).map((p) => [p, 0]));
  for (const f of all)
    for (const m of read(repo, f).matchAll(/\]\(([a-z0-9-]+\.md)(?:#[^)]*)?\)/gi))
      if (m[1] in inbound && m[1] !== f) inbound[m[1]]++;
  return Object.entries(inbound).sort((a, b) => b[1] - a[1])[0][0];
}

/* Each fault: how to materialize the faulty working tree, the op, and the simulated
 * terminal outcome of the agent. `clause` names the gate clause it should trip. */
const FAULTS = [
  { id: "broken-link", clause: "validator: link", op: "lint",
    inject: (r) => { const f = pages(r)[0]; write(r, f, read(r, f) + "\n\nSee [details](zzz-nonexistent-zzz.md).\n"); },
    outcome: { subtype: "success", isError: false } },
  { id: "bad-frontmatter", clause: "validator: frontmatter", op: "lint",
    inject: (r) => { const f = pages(r)[0]; write(r, f, read(r, f).replace(/^summary:.*$/m, "")); },
    outcome: { subtype: "success", isError: false } },
  { id: "future-date", clause: "validator: future date", op: "expand",
    inject: (r) => { const f = pages(r)[0]; write(r, f, read(r, f).replace(/^updated:.*$/m, "updated: 2099-01-01")); },
    outcome: { subtype: "success", isError: false } },
  { id: "semantic-loss (canary)", clause: "validator: canary", op: "prune",
    inject: (r) => {
      const spec = JSON.parse(readFileSync(path.join(wikiOf(r), "_meta", "canaries.json"), "utf8"));
      const c = spec.canaries[0];
      write(r, c.page, read(r, c.page).replace(new RegExp(c.pattern), "[removed]"));
    },
    outcome: { subtype: "success", isError: false } },
  { id: "page-deletion", clause: "validator: link/orphan", op: "prune",
    inject: (r) => rmSync(path.join(wikiOf(r), mostLinked(r))),
    outcome: { subtype: "success", isError: false } },
  { id: "fence-escape", clause: "gate: out-of-fence write", op: "lint",
    inject: (r) => { const f = path.join(r, "pipeline", "run.mjs"); writeFileSync(f, readFileSync(f, "utf8") + "\n// injected outside wiki/\n"); },
    outcome: { subtype: "success", isError: false } },
  { id: "agent-crash (mid-edit)", clause: "gate: non-success", op: "expand",
    inject: (r) => { const f = pages(r)[0]; write(r, f, read(r, f).slice(0, 40)); },
    outcome: { subtype: "error_during_execution", isError: true } },
  { id: "turn-truncation", clause: "gate: non-success", op: "iterate",
    inject: (r) => { const f = pages(r)[1]; write(r, f, read(r, f).slice(0, 120) + "\n\n## half-written"); },
    outcome: { subtype: "error_max_turns", isError: true } },
  { id: "prune-grew (postcondition)", clause: "gate: prune postcondition", op: "prune",
    inject: (r) => { const f = pages(r)[0]; write(r, f, read(r, f) + "\n" + Array(25).fill("padding line.").join("\n") + "\n"); },
    outcome: { subtype: "success", isError: false } },
];

console.log(`# Fault-injection matrix  (REPS=${REPS} per class)\n`);
const rows = [];
const allRecovery = [];

for (const fault of FAULTS) {
  // ---- baseline arm: commit the faulty output, measure persistent corruption ----
  const b = freshRepo();
  const beforeLines = validate(wikiOf(b)).stats.lines;
  fault.inject(b);
  git(b, "add", "-A");
  git(b, "commit", "--quiet", "-m", `naive: ${fault.id}`);
  const post = validate(wikiOf(b));
  const committed = git(b, "diff", "--name-only", "HEAD~1", "HEAD").split("\n").filter(Boolean);
  const escapedCommitted = committed.some((p) => !p.startsWith("wiki/"));
  const baselineCorrupted = !post.ok || escapedCommitted ||
    (fault.id.startsWith("prune-grew") && post.stats.lines > beforeLines);
  const baselineNote = !post.ok ? post.errors[0]
    : escapedCommitted ? `out-of-fence file committed (${committed.find((p) => !p.startsWith("wiki/"))})`
    : (post.stats.lines > beforeLines ? `corpus grew +${post.stats.lines - beforeLines} against prune intent` : "clean");
  cleanup(b);

  // ---- GROOM arm: gate + recovery, REPS times; reliability + latency ----
  const repo = freshRepo();
  const before = validate(wikiOf(repo)).stats.lines;
  let rejected = 0, recoveredClean = 0;
  const times = [];
  let exampleStatus = "";
  for (let i = 0; i < REPS; i++) {
    fault.inject(repo);
    const status = gate({ op: fault.op, outcome: fault.outcome, beforeLines: before, repoDir: repo, validate });
    exampleStatus = status;
    if (!status.startsWith("ok")) rejected++;
    const t0 = now();
    recover(repo);
    times.push(now() - t0);
    if (isClean(repo)) recoveredClean++;
  }
  cleanup(repo);
  allRecovery.push(...times);
  const t = stats(times);

  rows.push({
    fault: fault.id, clause: fault.clause,
    gate: exampleStatus.startsWith("ok") ? "ACCEPTED(!)" : "rejected",
    rejected: `${rejected}/${REPS}`, recovered: `${recoveredClean}/${REPS}`,
    recoverMs: t.median, baseline: baselineCorrupted ? "CORRUPTED" : "ok", baselineNote,
  });
  console.log(`  ${fault.id.padEnd(26)} gate=${rows.at(-1).gate.padEnd(11)} reject=${rows.at(-1).rejected} recovered=${rows.at(-1).recovered} reset≈${t.median}ms  | baseline=${rows.at(-1).baseline} (${baselineNote})`);
}

const R = stats(allRecovery);
const allRejected = rows.every((r) => r.gate === "rejected");
const allRecovered = rows.every((r) => r.recovered === `${REPS}/${REPS}`);
const baselineCorruptCount = rows.filter((r) => r.baseline === "CORRUPTED").length;

console.log(`\n## Summary`);
console.log(`  classes:                 ${rows.length}`);
console.log(`  GROOM rejected all:      ${allRejected}  (every fault tripped a gate clause)`);
console.log(`  GROOM recovered clean:   ${allRecovered}  (byte-identical to checkpoint, ${REPS}/${REPS} each)`);
console.log(`  baseline corrupted:      ${baselineCorruptCount}/${rows.length}  (naive maintainer commits the fault)`);
console.log(`  recovery latency (all ${R.n}):  median ${R.median}ms  p95 ${R.p95}ms  IQR [${R.p25}, ${R.p75}]  max ${R.max}ms  (mean ${R.mean}±${R.sd})`);

writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "results-fault-matrix.json"),
  JSON.stringify({ reps: REPS, rows, recovery: R, allRejected, allRecovered, baselineCorruptCount }, null, 2));
console.log(`\n  → results-fault-matrix.json written`);
