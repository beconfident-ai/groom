/**
 * Shared harness for the GROOM evaluation experiments.
 *
 * Every experiment runs against an ISOLATED, throwaway git repo containing a copy
 * of the live corpus (harness-wiki/wiki/). Nothing here touches the canonical repo,
 * spends an agent call, or hits the network — the measurements are of the GROOM
 * *mechanism* (the checkpoint gate, the deterministic validator, git recovery, and
 * the debounce lock), which is fully deterministic.
 *
 * The validator imported below is the REAL one the production runner uses
 * (pipeline/validate.mjs); we call validate(tempWiki) so it inspects the copy.
 */
import { cpSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const HARNESS = path.resolve(HERE, "..");
export const LIVE_WIKI = path.join(HARNESS, "wiki");

/** A git command in repo `dir`, returning trimmed stdout. */
export const git = (dir, ...args) =>
  execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" }).trim();

/** Working-tree paths changed relative to the repo root (mirrors run.mjs:104).
 *  Parses raw porcelain (no trim): each line is `XY␠PATH`, path from column 3. */
export function changedPaths(dir) {
  const raw = execFileSync("git", ["-C", dir, "status", "--porcelain"], { encoding: "utf8" });
  return raw.split("\n").filter(Boolean).map((l) => l.slice(3));
}

/** Build a fresh isolated repo mirroring the real layout (wiki/ + pipeline/ + README),
 *  committed as the checkpoint. The non-wiki files are tracked so a fence-escape fault
 *  (an agent editing infra outside wiki/) can be injected and reverted faithfully. */
export function freshRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), "groom-exp-"));
  cpSync(LIVE_WIKI, path.join(dir, "wiki"), { recursive: true });
  cpSync(path.join(HARNESS, "pipeline"), path.join(dir, "pipeline"), {
    recursive: true, filter: (src) => !src.includes("node_modules"),
  });
  for (const f of ["README.md", "package.json"]) {
    const src = path.join(HARNESS, f);
    try { cpSync(src, path.join(dir, f)); } catch {}
  }
  git(dir, "init", "--quiet");
  git(dir, "config", "user.email", "exp@groom.local");
  git(dir, "config", "user.name", "groom-exp");
  git(dir, "config", "commit.gpgsign", "false");
  git(dir, "add", "-A");
  git(dir, "commit", "--quiet", "-m", "checkpoint");
  return dir;
}

export const cleanup = (dir) => rmSync(dir, { recursive: true, force: true });

/**
 * The accept/reject predicate, mirroring run.mjs:171-202 exactly. run.mjs is the
 * single source of truth; this is a faithful transcription so an experiment can
 * evaluate the gate without spawning the LLM. The substantive component — validate()
 * (structure + canaries) — is imported real, not reimplemented.
 *
 *   outcome: { subtype, isError }   the simulated terminal result of the op
 *   returns: status string; accepted iff it starts with "ok".
 */
export function gate({ op, outcome, beforeLines, repoDir, validate }) {
  if (outcome.subtype !== "success" || outcome.isError) return `FAILED (${outcome.subtype})`;
  const escaped = changedPaths(repoDir).filter((p) => !p.startsWith("wiki/"));
  if (escaped.length) {
    git(repoDir, "checkout", "--", ...escaped);
    return `FAILED (escaped fence: ${escaped.join(", ")})`;
  }
  const check = validate(path.join(repoDir, "wiki"));
  const delta = check.stats.lines - beforeLines;
  if (!check.ok) return `FAILED (invalid: ${check.errors[0]})`;
  if (op === "prune" && delta > 0) return `FAILED (prune grew the wiki by ${delta})`;
  return "ok";
}

/** Recovery, mirroring run.mjs:199-201: hard reset + clean the corpus subtree. */
export function recover(repoDir) {
  git(repoDir, "reset", "--hard", "--quiet");
  git(repoDir, "clean", "-fdq", "wiki");
}

/** True iff the working tree is byte-identical to the checkpoint (HEAD). */
export const isClean = (repoDir) => changedPaths(repoDir).length === 0;

/** Summary stats over a numeric array. */
export function stats(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))];
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const sd = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length);
  return { n: s.length, min: s[0], p25: q(0.25), median: q(0.5), p75: q(0.75), p95: q(0.95), max: s.at(-1), mean: +mean.toFixed(3), sd: +sd.toFixed(3) };
}

/** Monotonic-ish wall clock in ms (process.hrtime is allowed; Date.now is not in some sandboxes). */
export const now = () => Number(process.hrtime.bigint() / 1000n) / 1000; // ms, microsecond resolution

export { writeFileSync, readFileSync, path };
