#!/usr/bin/env node
/**
 * EXPERIMENT — Concurrency lock reliability, prior vs. current design.
 *
 * GROOM serializes simultaneous triggers so that K consultations firing the launcher
 * at once start at most one maintenance run. We measure two designs over many K-way
 * races, each round starting with no prior run (all K eligible):
 *
 *   stamp-only  the prior design: pass the debounce gate, then write the stamp. This
 *               is a check-then-write with a TOCTOU window.
 *   atomic      the current design (the shipped launcher): an atomic mkdir claim gates
 *               the spawn, so exactly one concurrent caller proceeds.
 *
 * The spawned child is a no-op stub — the lock lives entirely in the launcher — so no
 * agent call is made. Both launchers are run from the same sandbox for a fair compare.
 */
import { LIVE_WIKI, stats, path } from "./lib.mjs";
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, rmSync, existsSync, unlinkSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

const K = Number(process.argv[2] ?? 8);
const ROUNDS = Number(process.argv[3] ?? 500);
const HARNESS = path.resolve(LIVE_WIKI, "..");

const dir = mkdtempSync(path.join(tmpdir(), "groom-conc-"));
mkdirSync(path.join(dir, "pipeline"), { recursive: true });
mkdirSync(path.join(dir, "wiki", "_meta"), { recursive: true });
const STAMP = path.join(dir, "wiki", "_meta", ".last-background-refresh");

// stub runner: exports the registry the launchers import; no-op as main.
writeFileSync(path.join(dir, "pipeline", "run.mjs"),
  `export const PIPELINES = { lint:["lint"], expand:["expand"], prune:["prune"], iterate:["iterate"], research:["research"], all:["research","expand","lint","prune"] };\n`);
writeFileSync(path.join(dir, "pipeline", "config.json"),
  JSON.stringify({ background_refresh: { enabled: true, op: "lint", min_interval_hours: 24, log_file: "cron/bg.log" } }, null, 2));

// current (atomic) launcher — the actual shipped file.
cpSync(path.join(HARNESS, "pipeline", "background-refresh.mjs"), path.join(dir, "pipeline", "atomic.mjs"));

// prior (stamp-only) launcher — faithful reconstruction of the pre-fix design.
writeFileSync(path.join(dir, "pipeline", "stamp-only.mjs"), `
import { spawn } from "node:child_process";
import { mkdirSync, openSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PIPELINES } from "./run.mjs";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const STAMP = path.join(ROOT, "wiki", "_meta", ".last-background-refresh");
const HOUR = 3.6e6;
const exit = (r) => { console.log("[bg] " + r); process.exit(0); };
const cfg = JSON.parse(readFileSync(path.join(HERE, "config.json"), "utf8")).background_refresh;
if (!cfg?.enabled) exit("disabled");
const interval = (cfg.min_interval_hours ?? 24) * HOUR;
const age = Date.now() - (statSync(STAMP, { throwIfNoEntry: false })?.mtimeMs ?? -Infinity);
if (age < interval) exit("debounced — skipping");
const op = [process.argv[2], cfg.op, "lint"].find((o) => o != null && o in PIPELINES);
const logPath = path.join(ROOT, cfg.log_file ?? "cron/bg.log");
mkdirSync(path.dirname(logPath), { recursive: true });
writeFileSync(STAMP, new Date().toISOString());
const log = openSync(logPath, "a");
const child = spawn(process.execPath, [path.join(HERE, "run.mjs"), op], { cwd: ROOT, detached: true, stdio: ["ignore", log, log] });
child.unref();
exit("spawned detached '" + op + "' (pid " + child.pid + ")");
`);

const runLauncher = (script) =>
  new Promise((resolve) => {
    let out = "";
    const c = spawn(process.execPath, [path.join(dir, "pipeline", script), "lint"], { cwd: dir });
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (out += d));
    c.on("close", () => resolve(out.includes("spawned detached") ? 1 : 0));
  });

async function measure(script) {
  const winners = [];
  for (let r = 0; r < ROUNDS; r++) {
    if (existsSync(STAMP)) unlinkSync(STAMP);
    rmSync(STAMP + ".claim", { recursive: true, force: true });
    const results = await Promise.all(Array.from({ length: K }, () => runLauncher(script)));
    winners.push(results.reduce((a, b) => a + b, 0));
  }
  const hist = {};
  for (const w of winners) hist[w] = (hist[w] ?? 0) + 1;
  return {
    hist, exactlyOne: winners.filter((w) => w === 1).length,
    multi: winners.filter((w) => w > 1).length, zero: winners.filter((w) => w === 0).length,
    stats: stats(winners),
  };
}

console.log(`# Concurrency lock: ${K}-way race × ${ROUNDS} rounds\n`);
const priorR = await measure("stamp-only.mjs");
const atomicR = await measure("atomic.mjs");
rmSync(dir, { recursive: true, force: true });

const line = (name, r) =>
  `  ${name.padEnd(12)} exactly-one ${String(r.exactlyOne + "/" + ROUNDS).padEnd(9)} (${(100 * r.exactlyOne / ROUNDS).toFixed(1)}%)  | >1: ${r.multi}  zero: ${r.zero}  max ${r.stats.max}  dist ${JSON.stringify(r.hist)}`;
console.log(line("stamp-only", priorR));
console.log(line("atomic", atomicR));
console.log(`\n  prior design leaks duplicate runs ${priorR.multi}/${ROUNDS} rounds; atomic claim: ${atomicR.multi}/${ROUNDS}.`);

writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "results-concurrency.json"),
  JSON.stringify({ k: K, rounds: ROUNDS, stampOnly: priorR, atomic: atomicR }, null, 2));
console.log(`\n  → results-concurrency.json written`);
