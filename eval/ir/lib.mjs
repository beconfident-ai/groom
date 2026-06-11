/**
 * IR evaluation harness for GROOM — shared library.
 *
 * Pages are the retrieval unit (GROOM maintains and agents load whole pages). We measure
 * standard IR metrics (recall@k, precision@k, nDCG@k, MRR) of a retriever over a corpus,
 * given a gold query->relevant-page set. Two degradations model the entropy GROOM fights:
 *   structural  duplicate/near-duplicate and boilerplate pages (what prune/lint remove) —
 *               hurts RETRIEVAL metrics by adding competing documents.
 *   staleness   corrupted facts in pages (what canaries/expand catch) — hurts ANSWER recall
 *               (handled in the answer-recall harness; retrieval is largely unaffected).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

export const DOMAINS_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "domains");
export const listDomains = () =>
  readdirSync(DOMAINS_DIR).filter((d) => existsSync(path.join(DOMAINS_DIR, d, "queries.json")));

const STOP = new Set(("a an the of to in is are and or for on with at by from as it this that these those " +
  "be was were been being do does did how what when where which who why your you i we our").split(" "));

export function tokenize(s) {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length > 1 && !STOP.has(t));
}

/** Strip YAML frontmatter and markdown link/format syntax to plain retrievable text. */
export function pageText(raw) {
  const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
  return body.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#*`_>|-]/g, " ");
}

/** Load a domain: { pages: [{file,text,tokens}], queries: [...] }. */
export function loadDomain(domain) {
  const dir = path.join(DOMAINS_DIR, domain);
  const pagesDir = path.join(dir, "pages");
  const pages = readdirSync(pagesDir).filter((f) => f.endsWith(".md")).sort().map((f) => {
    const text = pageText(readFileSync(path.join(pagesDir, f), "utf8"));
    return { file: f, text, tokens: tokenize(text) };
  });
  const queries = JSON.parse(readFileSync(path.join(dir, "queries.json"), "utf8")).queries;
  return { domain, pages, queries };
}

/* ---------- BM25 (Robertson/Sparck-Jones, k1=1.5 b=0.75) ---------- */
export function bm25Index(pages, k1 = 1.5, b = 0.75) {
  const N = pages.length;
  const df = new Map();
  for (const p of pages) for (const t of new Set(p.tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = (t) => Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
  const avgdl = pages.reduce((s, p) => s + p.tokens.length, 0) / N;
  const tf = pages.map((p) => { const m = new Map(); for (const t of p.tokens) m.set(t, (m.get(t) ?? 0) + 1); return m; });
  return {
    /** rank all pages for a query string; returns [{file, score}] desc. */
    search(query) {
      const qt = tokenize(query);
      return pages.map((p, i) => {
        let s = 0;
        for (const t of qt) {
          const f = tf[i].get(t); if (!f) continue;
          s += idf(t) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * p.tokens.length / avgdl));
        }
        return { file: p.file, score: s };
      }).sort((a, b) => b.score - a.score);
    },
  };
}

/* ---------- IR metrics given a ranked file list + a relevant set ---------- */
const dcg = (rels) => rels.reduce((s, r, i) => s + r / Math.log2(i + 2), 0);
export function queryMetrics(ranked, relevant, ks = [1, 3, 5]) {
  const relSet = new Set(relevant);
  const order = ranked.map((r) => (relSet.has(r.file) ? 1 : 0));
  const firstRel = order.indexOf(1);
  const out = { mrr: firstRel === -1 ? 0 : 1 / (firstRel + 1) };
  for (const k of ks) {
    const topk = order.slice(0, k);
    const hit = topk.reduce((a, b) => a + b, 0);
    out[`recall@${k}`] = hit / relSet.size;
    out[`precision@${k}`] = hit / k;
    const ideal = dcg(Array(Math.min(k, relSet.size)).fill(1));
    out[`ndcg@${k}`] = ideal ? dcg(topk) / ideal : 0;
  }
  return out;
}

/** Mean of per-query metric objects. */
export function meanMetrics(rows) {
  const keys = Object.keys(rows[0]);
  const out = {};
  for (const k of keys) out[k] = +(rows.reduce((s, r) => s + r[k], 0) / rows.length).toFixed(4);
  return out;
}

/* ---------- structural degradation: the bloat prune/lint remove ---------- */
/** Return a degraded page set: originals (still the gold targets) + injected noise pages
 *  (near-duplicates of real pages, re-titled with altered bodies, + thin boilerplate).
 *  Deterministic: seeded by page index, no RNG. */
export function degradeStructural(pages) {
  const noise = [];
  pages.forEach((p, i) => {
    if (i % 2 === 0) { // near-duplicate of every other page: same topic, altered/again truncated
      const half = p.text.slice(0, Math.floor(p.text.length * 0.6));
      noise.push({ file: `dup-${p.file}`, text: `${half} ${half}`, tokens: tokenize(`${half} ${half}`) });
    }
  });
  const boiler = ["About this wiki and how to contribute edits and report issues to maintainers.",
    "Changelog of recent updates revisions and version history for this reference.",
    "Frequently asked questions general help getting started overview and tips.",
    "Glossary of common terms abbreviations and definitions used across pages."];
  boiler.forEach((t, i) => noise.push({ file: `boilerplate-${i}.md`, text: t, tokens: tokenize(t) }));
  return [...pages, ...noise];
}
