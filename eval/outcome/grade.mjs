#!/usr/bin/env node
/**
 * Outcome experiment, grading stage. The consuming-agent QA runs (subagents reading the
 * fresh vs. staled corpus produced by prep.mjs) are recorded in RUNS below; this grades
 * them against ground truth and reports accuracy. The probed facts are near-future and
 * corpus-specific, so the agent has no independent knowledge of them — it answers from
 * the corpus, which is the realistic condition the harness-wiki skill creates.
 *
 * Result: staleness in the corpus propagates into wrong answers on exactly the affected
 * facts (controls unaffected), establishing that corpus correctness is outcome-critical —
 * and those affected facts are precisely the ones GROOM's canaries guard.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// graders: correct(answer) and staled(answer) per item id
const ITEMS = {
  arxiv:      { type: "stale",   correct: (a) => /2606\.09498/.test(a),                     staled: (a) => /2603\.01122/.test(a) },
  tbench:     { type: "stale",   correct: (a) => /61\.9/.test(a),                           staled: (a) => /52\.3/.test(a) },
  approval:   { type: "stale",   correct: (a) => /93/.test(a),                              staled: (a) => /74/.test(a) },
  rot:        { type: "stale",   correct: (a) => /context rot/i.test(a),                    staled: (a) => /token decay/i.test(a) },
  goldentraj: { type: "stale",   correct: (a) => /golden[- ]trajectory/i.test(a),           staled: (a) => /fixed[- ]prompt/i.test(a) },
  mcp:        { type: "control", correct: (a) => /mcp|model context protocol/i.test(a),     staled: () => false },
  a2a:        { type: "control", correct: (a) => /agent[- ]to[- ]agent|federation/i.test(a), staled: () => false },
};

// recorded consuming-agent runs (3 fresh, 3 staled) from the QA subagents
const RUNS = {
  fresh: [
    { arxiv: "arXiv 2606.09498", tbench: "61.9%", approval: "~93%", rot: "context rot", goldentraj: "golden-trajectory replay", mcp: "MCP (Model Context Protocol)", a2a: "Agent-to-agent coordination (federation)" },
    { arxiv: "arXiv 2606.09498", tbench: "61.9%", approval: "~93%", rot: "context rot", goldentraj: "golden-trajectory replay", mcp: "MCP (Model Context Protocol)", a2a: "Agent-to-agent coordination/federation" },
    { arxiv: "arXiv 2606.09498", tbench: "61.9%", approval: "~93%", rot: "context rot", goldentraj: "golden-trajectory replay", mcp: "MCP (Model Context Protocol)", a2a: "Agent-to-agent coordination (federation)" },
  ],
  staled: [
    { arxiv: "arXiv 2603.01122", tbench: "52.3%", approval: "~74%", rot: "Token decay", goldentraj: "Fixed-prompt replay", mcp: "MCP (Model Context Protocol)", a2a: "Agent-to-agent coordination (federation)" },
    { arxiv: "arXiv 2603.01122", tbench: "52.3%", approval: "~74%", rot: "Token decay", goldentraj: "Fixed-prompt replay", mcp: "MCP (Model Context Protocol)", a2a: "Agent-to-agent coordination (federation)" },
    { arxiv: "arXiv 2603.01122", tbench: "52.3%", approval: "~74%", rot: "Token decay", goldentraj: "Fixed-prompt replay", mcp: "MCP (Model Context Protocol)", a2a: "Agent-to-agent coordination (federation/interoperability)" },
  ],
};

function score(runs) {
  const ids = Object.keys(ITEMS);
  let stCorrect = 0, stTotal = 0, stStaled = 0, ctCorrect = 0, ctTotal = 0;
  for (const run of runs) for (const id of ids) {
    const g = ITEMS[id], a = run[id] ?? "";
    if (g.type === "stale") { stTotal++; if (g.correct(a)) stCorrect++; else if (g.staled(a)) stStaled++; }
    else { ctTotal++; if (g.correct(a)) ctCorrect++; }
  }
  return { stCorrect, stTotal, stStaled, ctCorrect, ctTotal,
    staleAcc: +(100 * stCorrect / stTotal).toFixed(1), ctrlAcc: +(100 * ctCorrect / ctTotal).toFixed(1),
    allAcc: +(100 * (stCorrect + ctCorrect) / (stTotal + ctTotal)).toFixed(1) };
}

const fresh = score(RUNS.fresh), staled = score(RUNS.staled);
console.log(`# Outcome: corpus staleness vs. consuming-agent accuracy`);
console.log(`  ${RUNS.fresh.length} runs/condition, 5 staleness-target facts + 2 controls per run\n`);
console.log(`  condition   stale-target acc      control acc        overall`);
console.log(`  fresh       ${String(fresh.stCorrect+"/"+fresh.stTotal).padEnd(7)} (${fresh.staleAcc}%)    ${fresh.ctCorrect}/${fresh.ctTotal} (${fresh.ctrlAcc}%)     ${fresh.stCorrect+fresh.ctCorrect}/${fresh.stTotal+fresh.ctTotal} (${fresh.allAcc}%)`);
console.log(`  staled      ${String(staled.stCorrect+"/"+staled.stTotal).padEnd(7)} (${staled.staleAcc}%)    ${staled.ctCorrect}/${staled.ctTotal} (${staled.ctrlAcc}%)     ${staled.stCorrect+staled.ctCorrect}/${staled.stTotal+staled.ctTotal} (${staled.allAcc}%)`);
console.log(`\n  staled agent reproduced the injected wrong value in ${staled.stStaled}/${staled.stTotal} stale-target answers.`);
console.log(`  staleness-specific: controls unchanged (${fresh.ctrlAcc}% → ${staled.ctrlAcc}%); affected facts collapse ${fresh.staleAcc}% → ${staled.staleAcc}%.`);

writeFileSync(path.join(HERE, "results-outcome.json"), JSON.stringify({ runsPerCondition: RUNS.fresh.length, fresh, staled }, null, 2));
console.log(`\n  → results-outcome.json written`);
