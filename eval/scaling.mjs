#!/usr/bin/env node
/**
 * EXPERIMENT — Validation-gate cost vs. corpus size, with repeated trials.
 *
 * The gate runs after every maintenance operation, so its cost must stay negligible.
 * We build synthetic corpora (the real pages, duplicated) at five sizes and time the
 * REAL validator in-process T times per size, reporting median + spread (the earlier
 * single-shot "median of 7" is replaced by an honest distribution).
 */
import { validate } from "../pipeline/validate.mjs";
import { LIVE_WIKI, stats, now, path, writeFileSync } from "./lib.mjs";
import { mkdtempSync, mkdirSync, cpSync, readdirSync, readFileSync, writeFileSync as wf, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const SIZES = [19, 50, 100, 200, 400];
const TRIALS = Number(process.argv[2] ?? 30);
const WARMUP = 5;

/** Materialize a corpus of exactly `n` pages by duplicating the real ones. */
function buildCorpus(n) {
  const dir = mkdtempSync(path.join(tmpdir(), "groom-scale-"));
  const wiki = path.join(dir, "wiki");
  mkdirSync(path.join(wiki, "_meta"), { recursive: true });
  cpSync(path.join(LIVE_WIKI, "_meta", "canaries.json"), path.join(wiki, "_meta", "canaries.json"));
  const originals = readdirSync(LIVE_WIKI).filter((f) => f.endsWith(".md"));
  for (const f of originals) cpSync(path.join(LIVE_WIKI, f), path.join(wiki, f));
  let i = 0;
  while (readdirSync(wiki).filter((f) => f.endsWith(".md")).length < n) {
    const src = originals[i % originals.length];
    const body = readFileSync(path.join(LIVE_WIKI, src), "utf8");
    wf(path.join(wiki, `dup-${i}-${src}`), body);
    i++;
  }
  return { dir, wiki };
}

console.log(`# Validation cost vs. corpus size  (TRIALS=${TRIALS}, ${WARMUP} warmup discarded)\n`);
console.log(`  pages   median    IQR              p95      mean±sd        pages/ms`);
const points = [];
for (const n of SIZES) {
  const { dir, wiki } = buildCorpus(n);
  const realPages = validate(wiki).stats.pages;
  const ts = [];
  for (let k = 0; k < TRIALS + WARMUP; k++) {
    const t0 = now();
    validate(wiki);
    const dt = now() - t0;
    if (k >= WARMUP) ts.push(dt);
  }
  rmSync(dir, { recursive: true, force: true });
  const s = stats(ts);
  points.push({ pages: realPages, ...s });
  console.log(`  ${String(realPages).padStart(4)}   ${s.median.toFixed(3)}ms   [${s.p25.toFixed(3)}, ${s.p75.toFixed(3)}]   ${s.p95.toFixed(3)}ms   ${s.mean.toFixed(3)}±${s.sd.toFixed(3)}   ${(realPages / s.median).toFixed(0)}`);
}

// least-squares slope (µs/page) over the medians
const xs = points.map((p) => p.pages), ys = points.map((p) => p.median);
const xm = xs.reduce((a, b) => a + b) / xs.length, ym = ys.reduce((a, b) => a + b) / ys.length;
const slope = xs.reduce((a, x, i) => a + (x - xm) * (ys[i] - ym), 0) / xs.reduce((a, x) => a + (x - xm) ** 2, 0);
const intercept = ym - slope * xm;
const ssTot = ys.reduce((a, y) => a + (y - ym) ** 2, 0);
const ssRes = ys.reduce((a, y, i) => a + (y - (slope * xs[i] + intercept)) ** 2, 0);
const r2 = 1 - ssRes / ssTot;

console.log(`\n## Linear fit: ${(slope * 1000).toFixed(1)} µs/page  (intercept ${intercept.toFixed(2)}ms, R²=${r2.toFixed(4)})`);
console.log(`   sub-10ms through 400 pages: ${ys.every((y) => y < 10)}`);

writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "results-scaling.json"),
  JSON.stringify({ trials: TRIALS, points, slope_us_per_page: +(slope * 1000).toFixed(2), intercept_ms: +intercept.toFixed(3), r2: +r2.toFixed(4) }, null, 2));
console.log(`\n  → results-scaling.json written`);
