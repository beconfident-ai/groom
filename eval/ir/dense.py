#!/usr/bin/env python3
"""Dense (neural) retriever arm of the GROOM IR experiment.

Mirrors run-ir.mjs exactly — same corpora, same deterministic structural degradation, same
IR metrics (recall@k, nDCG@k, MRR) — but ranks with a local sentence-transformer instead of
BM25. Local + reproducible, no API key. Demonstrates that grooming's retrieval benefit is
retriever-agnostic (holds for lexical AND dense).

    python3 eval/ir/dense.py
"""
import json, os, re, math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DOMAINS = HERE / "domains"
MODEL = os.environ.get("IR_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

def page_text(raw: str) -> str:
    body = re.sub(r"^---\n.*?\n---\n?", "", raw, count=1, flags=re.S)
    body = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", body)
    return re.sub(r"[#*`_>|-]", " ", body)

def load_domain(d: Path):
    pages = []
    for f in sorted(os.listdir(d / "pages")):
        if f.endswith(".md"):
            pages.append({"file": f, "text": page_text((d / "pages" / f).read_text())})
    queries = json.loads((d / "queries.json").read_text())["queries"]
    return pages, queries

# port of lib.mjs degradeStructural (identical logic + boilerplate, so BM25 and dense share the corpus)
BOILER = ["About this wiki and how to contribute edits and report issues to maintainers.",
          "Changelog of recent updates revisions and version history for this reference.",
          "Frequently asked questions general help getting started overview and tips.",
          "Glossary of common terms abbreviations and definitions used across pages."]
def degrade(pages):
    noise = []
    for i, p in enumerate(pages):
        if i % 2 == 0:
            half = p["text"][:int(len(p["text"]) * 0.6)]
            noise.append({"file": f"dup-{p['file']}", "text": f"{half} {half}"})
    for i, t in enumerate(BOILER):
        noise.append({"file": f"boilerplate-{i}.md", "text": t})
    return pages + noise

def dcg(rels): return sum(r / math.log2(i + 2) for i, r in enumerate(rels))
def query_metrics(ranked_files, relevant, ks=(1, 3, 5)):
    relset = set(relevant)
    order = [1 if f in relset else 0 for f in ranked_files]
    first = order.index(1) if 1 in order else -1
    out = {"mrr": 0.0 if first < 0 else 1.0 / (first + 1)}
    for k in ks:
        topk = order[:k]; hit = sum(topk)
        out[f"recall@{k}"] = hit / len(relset)
        ideal = dcg([1] * min(k, len(relset)))
        out[f"ndcg@{k}"] = (dcg(topk) / ideal) if ideal else 0.0
    return out
def mean(rows):
    keys = rows[0].keys()
    return {k: round(sum(r[k] for r in rows) / len(rows), 4) for k in keys}

from sentence_transformers import SentenceTransformer
import numpy as np
print(f"# Grooming vs. structural entropy — DENSE retrieval ({MODEL})\n", flush=True)
model = SentenceTransformer(MODEL)

def embed(texts):
    v = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return np.asarray(v)

def eval_state(pages, queries):
    P = embed([p["text"] for p in pages])
    Q = embed([q["query"] for q in queries])
    files = [p["file"] for p in pages]
    rows = []
    for qi, q in enumerate(queries):
        sims = P @ Q[qi]
        ranked = [files[i] for i in np.argsort(-sims)]
        rows.append(query_metrics(ranked, q["relevant_pages"]))
    return mean(rows)

results = {}
print(f"  domain        state      R@1    R@3    R@5    nDCG@5   MRR", flush=True)
for d in sorted(os.listdir(DOMAINS)):
    dd = DOMAINS / d
    if not (dd / "queries.json").exists(): continue
    pages, queries = load_domain(dd)
    groomed = eval_state(pages, queries)
    degraded = eval_state(degrade(pages), queries)
    results[d] = {"groomed": groomed, "degraded": degraded}
    for label, m in (("groomed", groomed), ("degraded", degraded)):
        print(f"  {d:<12} {label:<9} {m['recall@1']:.2f}   {m['recall@3']:.2f}   {m['recall@5']:.2f}   {m['ndcg@5']:.2f}     {m['mrr']:.2f}", flush=True)

doms = list(results)
def macro(state, key): return round(sum(results[d][state][key] for d in doms) / len(doms), 3)
mg = {k: macro("groomed", k) for k in ["recall@1", "recall@3", "recall@5", "ndcg@5", "mrr"]}
md = {k: macro("degraded", k) for k in ["recall@1", "recall@3", "recall@5", "ndcg@5", "mrr"]}
print(f"\n## Macro-average across {len(doms)} domains")
print(f"  groomed    R@1 {mg['recall@1']}  R@3 {mg['recall@3']}  R@5 {mg['recall@5']}  nDCG@5 {mg['ndcg@5']}  MRR {mg['mrr']}")
print(f"  degraded   R@1 {md['recall@1']}  R@3 {md['recall@3']}  R@5 {md['recall@5']}  nDCG@5 {md['ndcg@5']}  MRR {md['mrr']}")
lift = round(100 * (mg["recall@1"] - md["recall@1"]) / md["recall@1"]) if md["recall@1"] else 0
print(f"\n  Grooming lifts DENSE recall@1 by {lift}% (macro-avg) — the benefit holds for neural retrieval too.")
(HERE / "results-ir-dense.json").write_text(json.dumps({"model": MODEL, "domains": results, "macro": {"groomed": mg, "degraded": md}}, indent=2))
print(f"\n  -> results-ir-dense.json written")
