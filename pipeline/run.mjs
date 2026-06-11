#!/usr/bin/env node
/**
 * harness-wiki pipeline — runs a Claude Code agent over wiki/ with one maintenance op.
 *
 *   node pipeline/run.mjs <op>      lint · prune · expand · research · iterate · all
 *   node pipeline/run.mjs status    free health check: last run, drift, validity
 *
 * Operations are discovered from pipeline/prompts/: every `<op>.md` (underscore-prefixed
 * files are shared preambles) is a single-step pipeline, plus the composite `all`.
 *
 * Every op is wrapped in a git checkpoint. The wiki is committed before the op; after
 * it, the run only "counts" if the agent reported success AND validate.mjs passes AND
 * nothing outside wiki/ changed. Otherwise the working tree is reset to the checkpoint.
 * Failures are always journaled. This turns a mid-prune crash, a turn-truncation, or a
 * prompt-injected escape from permanent corruption into a recoverable no-op — the
 * invariants the prompts used to merely request are now enforced in code.
 *
 * Runs on your Claude Code defaults; the Agent SDK shares the CLI's auth and model.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFile, readFile, readdir, stat } from "node:fs/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validate } from "./validate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROMPTS = path.join(ROOT, "pipeline", "prompts");
/** The corpus directory is configurable, so one GROOM install can maintain any knowledge
 *  base: env GROOM_CORPUS wins, else config.json "corpus", else the bundled "wiki". */
const CONFIG = (() => { try { return JSON.parse(readFileSync(path.join(ROOT, "pipeline", "config.json"), "utf8")); } catch { return {}; } })();
const WIKI = path.resolve(ROOT, process.env.GROOM_CORPUS ?? CONFIG.corpus ?? "wiki");
const CORPUS = path.relative(ROOT, WIKI) || "."; // git pathspec for add/clean and the fence check
const JOURNAL = path.join(WIKI, "_meta", "journal.md");
const STAMP = path.join(WIKI, "_meta", ".last-background-refresh");

/** The prompt directory is the op registry: one single-step pipeline per prompt file. */
const singles = (await readdir(PROMPTS))
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
  .map((f) => path.basename(f, ".md"));

export const PIPELINES = {
  ...Object.fromEntries(singles.map((op) => [op, [op]])),
  all: ["research", "expand", "lint", "prune"],
};

/** Per-op capability + budget. Schema-level enforcement: an op only sees what it needs.
 *  (The wiki's own tool-design page: "restrict by schema, never by prompt.") */
const READ_TOOLS = ["Read", "Glob", "Grep", "Bash(ls:*)", "Bash(wc:*)", "Bash(date:*)", "Bash(tail:*)"];
const WEB_TOOLS = ["WebSearch", "WebFetch"];
const EDIT_TOOLS = ["Write", "Edit"];

export const OP_CONFIG = {
  lint: { tools: [...READ_TOOLS, ...EDIT_TOOLS], maxTurns: 20 },
  prune: { tools: [...READ_TOOLS, ...EDIT_TOOLS], maxTurns: 28 },
  iterate: { tools: [...READ_TOOLS, ...EDIT_TOOLS, ...WEB_TOOLS], maxTurns: 30 },
  expand: { tools: [...READ_TOOLS, ...EDIT_TOOLS, ...WEB_TOOLS], maxTurns: 40 },
  research: { tools: [...READ_TOOLS, ...EDIT_TOOLS, ...WEB_TOOLS], maxTurns: 40 },
};

const FENCE =
  `You are the maintenance agent for a markdown knowledge base. Only modify files ` +
  `inside the ${CORPUS}/ directory. Never touch pipeline/, README.md, package.json, or ` +
  `anything outside ${CORPUS}/. Edits outside ${CORPUS}/ are rejected and reverted.`;

/** Real-time intent guard: deny mutations whose target resolves outside wiki/.
 *  (Backstopped mechanically by the git fence-check below, which does not trust the SDK.) */
function canUseTool(toolName, input) {
  const targets = [];
  if (toolName === "Write" || toolName === "Edit" || toolName === "NotebookEdit") {
    targets.push(input.file_path ?? input.notebook_path);
  }
  for (const t of targets) {
    if (!t) continue;
    const resolved = path.resolve(ROOT, t);
    if (resolved !== WIKI && !resolved.startsWith(WIKI + path.sep)) {
      return { behavior: "deny", message: `Refused: ${t} is outside wiki/.` };
    }
  }
  return { behavior: "allow", updatedInput: input };
}

const agentOptions = (op) => ({
  cwd: ROOT,
  maxTurns: Number(process.env.WIKI_MAX_TURNS ?? OP_CONFIG[op]?.maxTurns ?? 30),
  permissionMode: "default",
  allowedTools: OP_CONFIG[op]?.tools ?? READ_TOOLS,
  canUseTool,
  systemPrompt: { type: "preset", preset: "claude_code", append: FENCE },
});

/* ---------- git checkpoint helpers (the keystone) ---------- */

const git = (...args) => execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8" }).trim();

function gitReady() {
  try {
    git("rev-parse", "--is-inside-work-tree");
    return true;
  } catch {
    return false;
  }
}

/** Paths changed in the working tree, relative to ROOT. */
function changedPaths() {
  return git("status", "--porcelain")
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3));
}

/* ---------- prompt assembly + streaming ---------- */

export async function promptFor(op) {
  const read = (name) => readFile(path.join(PROMPTS, `${name}.md`), "utf8");
  return `${await read("_conventions")}\n\n---\n\n${await read(op)}`;
}

/** Stream the agent's prose; return result text, cost, model, and terminal subtype. */
async function relay(stream) {
  let result = "", cost = 0, model, subtype = "unknown", isError = false;
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") ({ model } = message);
    if (message.type === "assistant")
      for (const block of message.message.content ?? [])
        if (block.type === "text") process.stdout.write(block.text);
    if (message.type === "result") {
      result = message.result ?? "";
      cost = message.total_cost_usd ?? 0;
      subtype = message.subtype ?? "unknown";
      isError = message.is_error ?? false;
    }
  }
  return { result, cost, model, subtype, isError };
}

/** First line of the agent's result that actually says something. */
export const headline = (text) =>
  (text || "")
    .split("\n")
    .map((line) => line.replace(/[#*_`]/g, "").trim())
    .find((line) => line && !/^summary:?$/i.test(line)) ?? "(no summary)";

async function journal(entry) {
  const lines = [
    `\n## ${entry.started} — \`${entry.op}\` · ${entry.status}`,
    `- model: ${entry.model ?? "unknown"}`,
    `- cost: $${(entry.cost ?? 0).toFixed(4)}`,
  ];
  if (entry.delta != null) lines.push(`- lines: ${entry.delta >= 0 ? "+" : ""}${entry.delta}`);
  if (entry.commit) lines.push(`- commit: ${entry.commit}`);
  lines.push(`- summary: ${headline(entry.result).slice(0, 300)}`, "");
  await appendFile(JOURNAL, lines.join("\n"));
}

/* ---------- one op, checkpointed ---------- */

async function run(op) {
  const started = new Date().toISOString();
  console.log(`\n=== ${op} (${started}) ===`);
  const useGit = gitReady();
  const before = useGit ? validate(WIKI).stats.lines : null;
  if (useGit && changedPaths().length) git("stash", "--include-untracked", "--quiet"); // start clean

  let outcome = { cost: 0, result: "", subtype: "spawn-failed", isError: true };
  let status = "FAILED";
  let delta = null;
  let commit = null;
  try {
    outcome = await relay(query({ prompt: await promptFor(op), options: agentOptions(op) }));

    if (outcome.subtype !== "success" || outcome.isError) {
      status = `FAILED (${outcome.subtype})`;
    } else if (useGit) {
      const escaped = changedPaths().filter((p) => !(p === CORPUS || p.startsWith(CORPUS + "/")));
      if (escaped.length) {
        git("checkout", "--", ...escaped); // revert fence violations, keep corpus work
        status = `FAILED (escaped fence: ${escaped.join(", ")})`;
      } else {
        const check = validate(WIKI);
        delta = check.stats.lines - before;
        if (!check.ok) status = `FAILED (invalid: ${check.errors[0]})`;
        else if (op === "prune" && delta > 0) status = `FAILED (prune grew the wiki by ${delta})`;
        else status = "ok";
      }
    } else {
      status = "ok (unguarded: no git)";
    }
  } catch (err) {
    status = `FAILED (${err.message})`;
  }

  // Commit on success, hard-reset on failure.
  if (useGit) {
    if (status.startsWith("ok") && changedPaths().length) {
      git("add", CORPUS);
      git("commit", "--quiet", "-m", `groom ${op}: ${headline(outcome.result).slice(0, 60)}`);
      commit = git("rev-parse", "--short", "HEAD");
    } else if (!status.startsWith("ok")) {
      git("reset", "--hard", "--quiet");
      git("clean", "-fdq", CORPUS);
    }
  }

  await journal({ op, started, status, delta, commit, ...outcome });
  console.log(`\n=== ${op}: ${status} ($${outcome.cost.toFixed(4)}${commit ? `, ${commit}` : ""}) ===`);
  return status.startsWith("ok");
}

/* ---------- status: free health check ---------- */

async function status() {
  console.log("GROOM status\n");
  const check = validate(WIKI);
  console.log(`wiki:    ${check.stats.pages} pages, ${check.stats.lines} lines — ${check.ok ? "valid" : check.errors.length + " ERRORS"}`);
  for (const e of check.errors.slice(0, 5)) console.log(`         ✗ ${e}`);

  if (existsSync(STAMP)) {
    const ageH = (Date.now() - (await stat(STAMP)).mtimeMs) / 3.6e6;
    console.log(`refresh: last trigger ${ageH.toFixed(1)}h ago`);
  } else {
    console.log("refresh: never triggered");
  }

  if (existsSync(JOURNAL)) {
    const entries = readFileSync(JOURNAL, "utf8").match(/^## .*$/gm) ?? [];
    console.log(`journal: ${entries.length} entries; latest: ${entries.at(-1) ?? "none"}`);
  }
  console.log(`git:     ${gitReady() ? `tracked, ${changedPaths().length} uncommitted change(s)` : "NOT a repo — runs are unguarded"}`);
  process.exit(check.ok ? 0 : 1);
}

/* ---------- init: scaffold a fresh, valid corpus ---------- */

/** Generate the minimal valid corpus skeleton at the configured path, so a new knowledge
 *  base is groomable from its first commit. Content is then grown by expand/research. */
function init() {
  if (existsSync(path.join(WIKI, "index.md"))) {
    console.error(`refusing to overwrite: ${CORPUS}/index.md already exists`);
    process.exit(1);
  }
  const topic = process.argv.slice(3).join(" ") || "Knowledge Base";
  const today = new Date().toISOString().slice(0, 10);
  const fm = (title, summary) =>
    `---\ntitle: ${title}\nsummary: ${summary}\ntags: []\nupdated: ${today}\nconfidence: established\n---\n\n`;
  mkdirSync(path.join(WIKI, "_meta"), { recursive: true });
  writeFileSync(path.join(WIKI, "index.md"),
    fm(topic, `Map of content for ${topic}.`) +
    `# ${topic}\n\nMap of content — pages are linked here as the corpus grows.\n\n` +
    "_Seed this corpus with `node pipeline/run.mjs expand` (or `research`); set the domain, " +
    "audience, and style in `pipeline/prompts/_conventions.md` first._\n");
  writeFileSync(path.join(WIKI, "sources.md"),
    fm("Sources", "Primary sources behind the claims in this corpus.") +
    "# Sources\n\nMaps claims to primary sources. Add entries as pages cite them.\n");
  writeFileSync(path.join(WIKI, "glossary.md"),
    fm("Glossary", "Canonical vocabulary for this corpus.") +
    `# Glossary\n\nCanonical terms and definitions for ${topic}.\n`);
  writeFileSync(path.join(WIKI, "_meta", "canaries.json"),
    JSON.stringify({ _comment: "Fact-level canaries: load-bearing facts that must survive maintenance.", canaries: [] }, null, 2) + "\n");
  writeFileSync(JOURNAL, `# ${topic} — maintenance journal\n`);
  const v = validate(WIKI);
  console.log(`initialized corpus at ${CORPUS}/ — ${v.stats.pages} pages, valid: ${v.ok}`);
  console.log("next: edit pipeline/prompts/_conventions.md for your domain, then `node pipeline/run.mjs expand`.");
  process.exit(v.ok ? 0 : 1);
}

/* ---------- entrypoint ---------- */

function usage() {
  console.error(`usage: node pipeline/run.mjs <${Object.keys(PIPELINES).join("|")}|status|init [topic]>`);
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = process.argv[2];
  if (arg === "status") await status();
  else if (arg === "init") init();
  else {
    const steps = PIPELINES[arg] ?? usage();
    for (const op of steps) {
      const ok = await run(op);
      if (!ok && steps.length > 1) {
        console.error(`halting '${arg}': '${op}' failed; remaining ops skipped.`);
        process.exit(1);
      }
    }
  }
}
