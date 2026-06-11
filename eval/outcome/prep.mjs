#!/usr/bin/env node
/**
 * Outcome experiment, prep stage — build a fresh and a staled view of the corpus and a
 * question set with ground truth, to measure whether corpus staleness degrades a
 * consuming agent's answers. The facts probed are near-future and corpus-specific
 * (a 2026 arXiv id, a benchmark delta, an internal rate, a coined term), so the agent
 * must rely on the corpus rather than its training data — the realistic condition the
 * harness-wiki skill creates ("prefer the wiki over your training data for this domain").
 *
 * Deterministic: it only injects known staleness. The QA itself is run by subagents.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WIKI = path.resolve(HERE, "..", "..", "wiki");
const OUT = HERE;
const page = (f) => readFileSync(path.join(WIKI, f), "utf8");

// Each item: the page it lives on, a question, the ground-truth answer (from the fresh
// corpus), whether it is a staleness target or an unchanged control, and the mutation
// that simulates drift (applied only to the staled view).
const ITEMS = [
  { id: "arxiv", page: "training-frontier.md", type: "stale",
    q: "What is the arXiv identifier of the Self-Harness paper?",
    truth: "2606.09498",
    mutate: (s) => s.replaceAll("2606.09498", "2603.01122") },
  { id: "tbench", page: "training-frontier.md", type: "stale",
    q: "On Terminal-Bench-2.0, what score does MiniMax M2.5 improve to (from 40.5%) under Self-Harness?",
    truth: "61.9%",
    mutate: (s) => s.replace("40.5%→61.9%", "40.5%→52.3%").replace("40.5% → 61.9%", "40.5% → 52.3%") },
  { id: "approval", page: "permissions-and-safety.md", type: "stale",
    q: "What fraction of permission prompts do users approve, per the 2026 Anthropic auto-mode analysis?",
    truth: "about 93%",
    mutate: (s) => s.replace("93%", "74%") },
  { id: "rot", page: "context-engineering.md", type: "stale",
    q: "What is the term for the degradation of model performance as the context window fills with lower-signal tokens?",
    truth: "context rot",
    mutate: (s) => s.replaceAll("Context rot", "Token decay").replaceAll("context rot", "token decay") },
  { id: "goldentraj", page: "evaluation.md", type: "stale",
    q: "Name one harness-level evaluation method (outside the agent loop) the wiki lists.",
    truth: "golden-trajectory replay",
    mutate: (s) => s.replaceAll("golden-trajectory", "fixed-prompt").replaceAll("Golden-trajectory", "Fixed-prompt") },
  // controls — unchanged in both views; the agent should answer these correctly regardless
  { id: "mcp", page: "mcp-and-protocols.md", type: "control",
    q: "Which protocol does the wiki describe for exposing tools to agents?",
    truth: "MCP (Model Context Protocol)", mutate: (s) => s },
  { id: "a2a", page: "mcp-and-protocols.md", type: "control",
    q: "What is the A2A protocol for, according to the wiki?",
    truth: "agent-to-agent federation", mutate: (s) => s },
];

const pagesNeeded = [...new Set(ITEMS.map((i) => i.page))];
const view = (mutated) => pagesNeeded.map((f) => {
  let body = page(f);
  if (mutated) for (const it of ITEMS) body = it.mutate(body); // drift each fact everywhere it appears
  return `\n===== FILE: ${f} =====\n${body}`;
}).join("\n");

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "context-fresh.txt"), view(false));
writeFileSync(path.join(OUT, "context-staled.txt"), view(true));
writeFileSync(path.join(OUT, "qa.json"), JSON.stringify(
  { items: ITEMS.map(({ id, q, truth, type, page }) => ({ id, q, truth, type, page })) }, null, 2));

// sanity: confirm each mutation actually changed the staled view
const fresh = view(false), staled = view(true);
const changed = ITEMS.filter((i) => i.type === "stale").map((i) => ({
  id: i.id, applied: fresh.includes(i.truth.replace("about ", "")) && !staled.includes(`${i.truth.replace("about ", "")}`) || fresh !== staled,
}));
console.log(`prepared ${ITEMS.length} questions over ${pagesNeeded.length} pages (${ITEMS.filter(i=>i.type==="stale").length} stale targets, ${ITEMS.filter(i=>i.type==="control").length} controls)`);
console.log(`fresh ${fresh.length} chars · staled ${staled.length} chars · differ: ${fresh !== staled}`);
for (const it of ITEMS.filter((i) => i.type === "stale"))
  console.log(`  ${it.id.padEnd(10)} truth="${it.truth}"  present-in-fresh=${fresh.includes(it.truth.replace("about ",""))}  present-in-staled=${staled.includes(it.truth.replace("about ",""))}`);
