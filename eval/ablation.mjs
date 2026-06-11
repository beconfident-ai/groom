#!/usr/bin/env node
/**
 * EXPERIMENT — Canary ablation: what the structural validator misses.
 *
 * Structural checks (frontmatter, links, reachability) are necessary but not
 * sufficient: a page can be made factually false while staying structurally valid.
 * Fact-level canaries are meant to close that gap. We inject semantic losses and
 * compare two gate configurations on each:
 *
 *   structural-only   validate() with no canaries file  → catches structure only
 *   +canary           validate() with the real canaries → also checks load-bearing facts
 *
 * We inject (a) each canaried fact's loss and (b) some un-canaried fact edits, so the
 * ablation is honest about coverage: canaries catch exactly what they cover, not "all
 * semantic loss".
 */
import { validate } from "../pipeline/validate.mjs";
import { LIVE_WIKI, path, writeFileSync } from "./lib.mjs";
import { mkdtempSync, mkdirSync, cpSync, readdirSync, readFileSync, writeFileSync as wf, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";

/** A temp wiki copy; `withCanaries=false` removes the canaries file (structural-only). */
function tempWiki(withCanaries) {
  const dir = mkdtempSync(path.join(tmpdir(), "groom-abl-"));
  const wiki = path.join(dir, "wiki");
  mkdirSync(path.join(wiki, "_meta"), { recursive: true });
  for (const f of readdirSync(LIVE_WIKI).filter((f) => f.endsWith(".md"))) cpSync(path.join(LIVE_WIKI, f), path.join(wiki, f));
  cpSync(path.join(LIVE_WIKI, "_meta", "canaries.json"), path.join(wiki, "_meta", "canaries.json"));
  if (!withCanaries) unlinkSync(path.join(wiki, "_meta", "canaries.json"));
  return { dir, wiki };
}
const edit = (wiki, file, fn) => wf(path.join(wiki, file), fn(readFileSync(path.join(wiki, file), "utf8")));

const spec = JSON.parse(readFileSync(path.join(LIVE_WIKI, "_meta", "canaries.json"), "utf8"));

// Injections: each removes/alters a fact WITHOUT breaking structure.
const INJECTIONS = [
  // (a) the five canaried load-bearing facts — remove the matched text
  ...spec.canaries.map((c) => ({
    id: `canaried: ${c.fact}`, covered: true,
    // Simulate the fact being removed by the op: strip ALL occurrences (a canary
    // trips only when the pattern disappears entirely, not when one mention is cut).
    apply: (wiki) => edit(wiki, c.page, (s) => s.replace(new RegExp(c.pattern, "g"), "[redacted]")),
  })),
  // (b) un-canaried factual edits — structurally fine, no canary covers them
  { id: "un-canaried: flip a sentence's claim", covered: false,
    apply: (wiki) => { const f = readdirSync(LIVE_WIKI).find((x) => x.endsWith(".md") && !["index.md","sources.md","glossary.md"].includes(x)); edit(wiki, f, (s) => s.replace(/\bis\b/, "is not")); } },
  { id: "un-canaried: delete a body paragraph", covered: false,
    apply: (wiki) => { const f = readdirSync(LIVE_WIKI).find((x) => x.endsWith(".md") && !["index.md","sources.md","glossary.md"].includes(x)); edit(wiki, f, (s) => { const ps = s.split("\n\n"); ps.splice(Math.floor(ps.length / 2), 1); return ps.join("\n\n"); }); } },
];

console.log(`# Canary ablation  (${INJECTIONS.length} semantic-loss injections)\n`);
console.log(`  ${"injection".padEnd(46)} structural-only   +canary`);
const rows = [];
for (const inj of INJECTIONS) {
  const a = tempWiki(false); inj.apply(a.wiki); const structural = validate(a.wiki); rmSync(a.dir, { recursive: true, force: true });
  const b = tempWiki(true); inj.apply(b.wiki); const canary = validate(b.wiki); rmSync(b.dir, { recursive: true, force: true });
  const sCatch = !structural.ok, cCatch = !canary.ok;
  rows.push({ id: inj.id, covered: inj.covered, structuralCatch: sCatch, canaryCatch: cCatch });
  console.log(`  ${inj.id.slice(0, 46).padEnd(46)} ${(sCatch ? "CAUGHT" : "missed").padEnd(16)}  ${cCatch ? "CAUGHT" : "missed"}`);
}

const covered = rows.filter((r) => r.covered);
const uncovered = rows.filter((r) => !r.covered);
const structCaughtCovered = covered.filter((r) => r.structuralCatch).length;
const canaryCaughtCovered = covered.filter((r) => r.canaryCatch).length;
console.log(`\n## Summary`);
console.log(`  on the ${covered.length} canaried facts:   structural caught ${structCaughtCovered}/${covered.length}   |   +canary caught ${canaryCaughtCovered}/${covered.length}`);
console.log(`  on the ${uncovered.length} un-canaried edits: structural caught ${uncovered.filter((r) => r.structuralCatch).length}/${uncovered.length}   |   +canary caught ${uncovered.filter((r) => r.canaryCatch).length}/${uncovered.length}  (coverage is targeted, not total)`);

writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "results-ablation.json"),
  JSON.stringify({ rows, structCaughtCovered, canaryCaughtCovered, nCovered: covered.length, nUncovered: uncovered.length }, null, 2));
console.log(`\n  → results-ablation.json written`);
