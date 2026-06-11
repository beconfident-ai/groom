#!/usr/bin/env node
/**
 * EXPERIMENT — Consumption-triggered vs. scheduled maintenance (simulation).
 *
 * GROOM's thesis is that binding maintenance to consumption keeps the corpus fresher
 * *where it matters* than a fixed schedule of equal cost, because reads concentrate on a
 * skewed subset of pages and that is exactly where maintenance should go. We cannot yet
 * test this end-to-end on a live model, so we test the scheduling principle in a
 * discrete-event simulation under a stated drift/access model. Pure code, seeded RNG.
 *
 * Model: N pages over T ticks. Each tick: (1) every fresh page drifts stale with prob d
 * (the world changes, independent of reads); (2) M reads arrive, each hitting a page drawn
 * from a Zipf(s) distribution — a read "fails" if its page is currently stale; (3) a fixed
 * budget of B page-refreshes is spent, by one of two policies:
 *   consumption  refresh the (up to B) distinct pages just read this tick   [GROOM]
 *   scheduled    refresh B pages in round-robin, access-blind                [cron]
 * Both policies get the IDENTICAL budget B. Metric: read-failure rate = fraction of reads
 * that hit a stale page (the user-facing harm: an agent grounding on a stale page).
 */
const N = 50, T = 6000, WARMUP = 1000, M = 12, D = 0.03, B = 3;
const SKEWS = [0.0, 0.4, 0.8, 1.0, 1.2, 1.5];
const SEED = 0x9e3779b9;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Zipf(s) sampler over ranks 0..N-1 (rank 0 = hottest), via inverse-CDF. */
function zipf(N, s, rng) {
  const w = Array.from({ length: N }, (_, i) => 1 / Math.pow(i + 1, s));
  const Z = w.reduce((a, b) => a + b, 0);
  const cdf = []; let acc = 0;
  for (const x of w) { acc += x / Z; cdf.push(acc); }
  return () => { const u = rng(); let lo = 0, hi = N - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < u) lo = m + 1; else hi = m; } return lo; };
}

/** Run one policy; returns {readFail, stalePerPage} after warmup. The system cannot
 *  observe drift (per the paper's own framing — consumption is its only freshness signal),
 *  so neither policy inspects stale[]; they select pages to refresh blind. */
function simulate(policy, s) {
  const rng = mulberry32(SEED);                 // same seed/access stream for both policies
  const draw = zipf(N, s, rng);
  const stale = new Array(N).fill(false);
  const staleTicks = new Array(N).fill(0);
  let ptr = 0, reads = 0, fails = 0, counted = 0;
  for (let t = 0; t < T; t++) {
    for (let i = 0; i < N; i++) if (!stale[i] && rng() < D) stale[i] = true; // drift
    const readThisTick = [];
    for (let m = 0; m < M; m++) {
      const p = draw();
      readThisTick.push(p);
      if (t >= WARMUP) { reads++; if (stale[p]) fails++; }
    }
    if (t >= WARMUP) { counted++; for (let i = 0; i < N; i++) if (stale[i]) staleTicks[i]++; }
    // spend budget B
    if (policy === "consumption") {
      const seen = new Set();
      for (const p of readThisTick) { if (seen.size >= B) break; if (!seen.has(p)) { seen.add(p); stale[p] = false; } }
    } else { // scheduled round-robin
      for (let k = 0; k < B; k++) { stale[ptr % N] = false; ptr++; }
    }
  }
  return { readFail: fails / reads, stalePerPage: staleTicks.map((x) => x / counted) };
}

console.log(`# Consumption-triggered vs. scheduled maintenance (simulation)`);
console.log(`  N=${N} pages, T=${T} ticks, ${M} reads/tick, drift d=${D}/tick, budget B=${B} refresh/tick (equal for both)\n`);
console.log(`  Zipf s   read-fail: consumption   scheduled    relative reduction`);
const rows = [];
for (const s of SKEWS) {
  const c = simulate("consumption", s).readFail;
  const r = simulate("scheduled", s).readFail;
  const red = (r - c) / r;
  rows.push({ s, consumption: +(100 * c).toFixed(1), scheduled: +(100 * r).toFixed(1), reduction: +(100 * red).toFixed(1) });
  console.log(`  ${s.toFixed(1)}      ${(100 * c).toFixed(1).padStart(5)}%                 ${(100 * r).toFixed(1).padStart(5)}%       ${red >= 0 ? `consumption ${(100 * red).toFixed(0)}% lower` : `scheduled ${(-100 * red).toFixed(0)}% lower`}`);
}

// Mechanism: at a representative skew, how does freshness track read-frequency rank?
const SREP = 1.0;
const cDet = simulate("consumption", SREP).stalePerPage;
const rDet = simulate("scheduled", SREP).stalePerPage;
const hotK = Math.max(1, Math.round(N * 0.1)); // top 10% most-read pages (ranks 0..hotK-1)
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const hotC = mean(cDet.slice(0, hotK)), hotR = mean(rDet.slice(0, hotK));
const coldC = mean(cDet.slice(N - hotK)), coldR = mean(rDet.slice(N - hotK));
console.log(`\n  Mechanism (s=${SREP}): mean staleness by read-frequency rank (fraction of time stale)`);
console.log(`    hottest 10% of pages:  consumption ${(100 * hotC).toFixed(1)}%   scheduled ${(100 * hotR).toFixed(1)}%`);
console.log(`    coldest 10% of pages:  consumption ${(100 * coldC).toFixed(1)}%   scheduled ${(100 * coldR).toFixed(1)}%`);
console.log(`  Consumption-triggering keeps the most-read pages freshest (${(100 * hotC).toFixed(0)}% vs ${(100 * hotR).toFixed(0)}% stale) by spending its budget where reads land, at the cost of the rarely-read tail.`);

const skewed = rows.at(-1);
console.log(`\n  Net read-weighted staleness: scheduled wins under near-uniform access (its coverage is exhaustive);`);
console.log(`  consumption-triggering overtakes it as access skews and reaches ${skewed.reduction}% lower at s=${skewed.s}.`);
console.log(`  Trend across skew (consumption vs scheduled, +ve = consumption lower): ${rows.map((r) => `${r.reduction}%`).join(" → ")}`);

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "results-staleness-sim.json"),
  JSON.stringify({ params: { N, T, WARMUP, M, D, B }, rows }, null, 2));
console.log(`\n  → results-staleness-sim.json written`);
