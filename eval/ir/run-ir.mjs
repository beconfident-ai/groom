#!/usr/bin/env node
/**
 * EXPERIMENT — Does grooming improve retrieval? (structural degradation, IR metrics)
 *
 * GROOM is retrieval-agnostic: it maintains clean markdown, and any retriever consults it.
 * We test, across unrelated domains, whether the structural entropy GROOM fights
 * (duplicate/near-duplicate pages, boilerplate) degrades retrieval — i.e. whether grooming
 * (prune/lint, which removes that entropy) improves standard IR metrics. Retrievers are
 * pluggable; here we run BM25 (lexical, deterministic). Dense embeddings plug in via
 * run-ir-dense.mjs. We also report the full-context dimension: corpus token size, which is
 * what "just load everything if it fits the window" pays — and what prune shrinks.
 *
 *   node eval/ir/run-ir.mjs
 */
import { listDomains, loadDomain, bm25Index, queryMetrics, meanMetrics, degradeStructural } from "./lib.mjs";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const evalRetriever = (index, queries) =>
  meanMetrics(queries.map((q) => queryMetrics(index.search(q.query), q.relevant_pages)));

const domains = listDomains();
console.log(`# Grooming vs. structural entropy — BM25 retrieval over ${domains.length} unrelated domains\n`);
console.log(`  domain        state      R@1    R@3    R@5    nDCG@5   MRR    pages  tokens`);

const results = {};
for (const d of domains) {
  const { pages, queries } = loadDomain(d);
  const degraded = degradeStructural(pages);
  const groomed = evalRetriever(bm25Index(pages), queries);
  const dirty = evalRetriever(bm25Index(degraded), queries);
  const tok = (ps) => ps.reduce((s, p) => s + p.tokens.length, 0);
  results[d] = { groomed, degraded: dirty, pagesGroomed: pages.length, pagesDegraded: degraded.length, tokensGroomed: tok(pages), tokensDegraded: tok(degraded), nQueries: queries.length };
  const row = (label, m, np, tk) =>
    `  ${d.padEnd(12)} ${label.padEnd(9)} ${m["recall@1"].toFixed(2)}   ${m["recall@3"].toFixed(2)}   ${m["recall@5"].toFixed(2)}   ${m["ndcg@5"].toFixed(2)}     ${m.mrr.toFixed(2)}   ${String(np).padStart(3)}    ${tk}`;
  console.log(row("groomed", groomed, pages.length, tok(pages)));
  console.log(row("degraded", dirty, degraded.length, tok(degraded)));
}

// macro-average across domains
const avg = (state, key) => +(domains.reduce((s, d) => s + results[d][state][key], 0) / domains.length).toFixed(3);
const macro = (state) => ({ "recall@1": avg(state, "recall@1"), "recall@3": avg(state, "recall@3"), "recall@5": avg(state, "recall@5"), "ndcg@5": avg(state, "ndcg@5"), mrr: avg(state, "mrr") });
const mg = macro("groomed"), md = macro("degraded");
console.log(`\n## Macro-average across ${domains.length} domains`);
console.log(`  groomed    R@1 ${mg["recall@1"]}  R@3 ${mg["recall@3"]}  R@5 ${mg["recall@5"]}  nDCG@5 ${mg["ndcg@5"]}  MRR ${mg.mrr}`);
console.log(`  degraded   R@1 ${md["recall@1"]}  R@3 ${md["recall@3"]}  R@5 ${md["recall@5"]}  nDCG@5 ${md["ndcg@5"]}  MRR ${md.mrr}`);
const dRecall1 = +(100 * (mg["recall@1"] - md["recall@1"]) / md["recall@1"]).toFixed(0);
const dMrr = +(100 * (mg.mrr - md.mrr) / md.mrr).toFixed(0);
console.log(`\n  Grooming (removing the noise) lifts BM25 recall@1 by ${dRecall1}% and MRR by ${dMrr}% (macro-avg).`);
const tg = domains.reduce((s, d) => s + results[d].tokensGroomed, 0), td = domains.reduce((s, d) => s + results[d].tokensDegraded, 0);
console.log(`  Full-context dimension: grooming shrinks total corpus from ${td} to ${tg} tokens (${+(100 * (td - tg) / td).toFixed(0)}% smaller) — cheaper to "just load everything".`);

writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "results-ir.json"), JSON.stringify({ domains: results, macro: { groomed: mg, degraded: md } }, null, 2));
console.log(`\n  → results-ir.json written`);
