#!/usr/bin/env node
/**
 * background-refresh.mjs — opportunistic, non-blocking wiki maintenance.
 *
 * Fired by the harness-wiki skill on activation; safe to fire on every trigger.
 * Exits in milliseconds whether or not a refresh starts. Two gates, then a spawn:
 *
 *   toggle    pipeline/config.json → background_refresh.enabled
 *   debounce  at most one spawn per min_interval_hours, tracked by a stamp file
 *   spawn     pipeline/run.mjs <op>, fully detached, logging to log_file
 *
 * The stamp is written at spawn time, so it is also the concurrency guard: any
 * second trigger inside the interval skips. No lockfile, no wrapper process.
 * A crashed run simply waits out the interval — for an opportunistic refresh,
 * that is the retry policy you want.
 *
 *   node pipeline/background-refresh.mjs [lint|expand|prune|iterate|all]
 */

import { spawn } from "node:child_process";
import { mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PIPELINES } from "./run.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const HOUR = 3.6e6;

const hours = (ms) => (ms / HOUR).toFixed(1);
const attempt = (fn) => { try { return fn(); } catch { return undefined; } };
const exit = (reason) => { console.log(`[background-refresh] ${reason}`); process.exit(0); };

// Config — the corpus path (env GROOM_CORPUS wins) and the background_refresh block. The
// stamp lives under the configured corpus, so the launcher and run.mjs agree on one base.
const fullCfg = attempt(() => JSON.parse(readFileSync(path.join(HERE, "config.json"), "utf8"))) ?? {};
const CORPUS = process.env.GROOM_CORPUS ?? fullCfg.corpus ?? "wiki";
const STAMP = path.join(path.resolve(ROOT, CORPUS), "_meta", ".last-background-refresh");

// Gate 1 — toggle
const cfg = fullCfg.background_refresh;
if (!cfg) exit("no config — skipping");
if (!cfg.enabled) exit("disabled in pipeline/config.json — skipping");

// Gate 2 — debounce (a missing stamp is infinitely old)
const interval = (cfg.min_interval_hours ?? 24) * HOUR;
const age = Date.now() - (statSync(STAMP, { throwIfNoEntry: false })?.mtimeMs ?? -Infinity);
if (age < interval)
  exit(`ran ${hours(age)}h ago — next eligible in ${hours(interval - age)}h. skipping`);

// Gate 3 — atomic claim. The debounce stamp alone is a check-then-write: simultaneous
// triggers can all pass Gate 2 before any one writes the stamp (a TOCTOU window). mkdir
// is atomic on POSIX, so exactly one concurrent caller creates the claim and proceeds;
// the rest skip. A claim held longer than max_run_hours is reclaimed, so a crashed run
// cannot wedge refresh indefinitely.
const CLAIM = STAMP + ".claim";
const maxRun = (cfg.max_run_hours ?? 6) * HOUR;
function claim() {
  try { mkdirSync(CLAIM); return true; }
  catch {
    const held = Date.now() - (statSync(CLAIM, { throwIfNoEntry: false })?.mtimeMs ?? Date.now());
    if (held > maxRun) { try { rmSync(CLAIM, { recursive: true, force: true }); mkdirSync(CLAIM); return true; } catch {} }
    return false;
  }
}
if (!claim()) exit("another trigger holds the claim — skipping");

// Spawn — detached, logged, never awaited. Stamp first (closes Gate 2 for any late
// trigger), then release the claim; simultaneous contenders already lost it at mkdir.
// Op cascade: argv → config → "lint". Validity uses the SAME registry run.mjs runs,
// so a config typo (e.g. "_conventions") can no longer burn the debounce slot on a
// child that instantly usage-errors.
const valid = (op) => op != null && op in PIPELINES;
const op = [process.argv[2], cfg.op, "lint"].find(valid)
  ?? (rmSync(CLAIM, { recursive: true, force: true }), exit("no valid op in argv or config — skipping"));
const logPath = path.join(ROOT, cfg.log_file ?? "cron/background-refresh.log");

mkdirSync(path.dirname(logPath), { recursive: true });
writeFileSync(STAMP, new Date().toISOString());
const log = openSync(logPath, "a");
writeFileSync(log, `\n----- ${new Date().toISOString()} op=${op} -----\n`);

const child = spawn(process.execPath, [path.join(HERE, "run.mjs"), op], {
  cwd: ROOT,
  detached: true,
  stdio: ["ignore", log, log],
});
child.unref();

rmSync(CLAIM, { recursive: true, force: true });
exit(`spawned detached '${op}' (pid ${child.pid}) — log: ${path.relative(ROOT, logPath)}`);
