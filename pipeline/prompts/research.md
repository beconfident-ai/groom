# Operation: RESEARCH

Paper-ingestion pass. Find recent arXiv work on harness engineering that has earned
attention, and fold the few that matter into the wiki. Citation-gated: recency alone is
noise.

## 1. Discover

Search for papers from the **last ~5 weeks** on: agent harnesses, agent scaffolding,
context engineering, agentic RL / process reward models, agent evaluation/benchmarks,
tool use, sandboxing for agents, multi-agent orchestration. Use both:

- arXiv directly (WebSearch `site:arxiv.org` + the listing pages for cs.AI / cs.CL / cs.SE)
- The Semantic Scholar API for citation counts — WebFetch:
  `https://api.semanticscholar.org/graph/v1/paper/search?query=<terms>&fields=title,abstract,citationCount,publicationDate,externalIds&limit=20`
  (also works per-paper: `/graph/v1/paper/arXiv:<id>?fields=citationCount,...`)

## 2. Gate (this is the point of the op)

A paper makes the cut only if it clears BOTH:

- **Attention**: ≥5 citations despite being weeks old, OR clearly major on other
  signals (frontier-lab authorship, a benchmark the wiki already tracks moving by
  >5 points, an explicit new SOTA on Terminal-Bench / SWE-bench / OSWorld-class evals).
  Citations accrue slowly — a month-old paper with 5+ is a strong signal.
- **Relevance**: it would change what a Head of AI *does* — a new pattern, a refuted
  assumption, a benchmark shift. Incremental deltas on existing lines don't qualify.

Expect to reject most candidates. **0 additions is a valid outcome** — say so in the
summary rather than padding the wiki.

## 3. Ingest (max 3 papers per run)

For each accepted paper:
- Add it where it belongs: usually a short subsection or paragraph on an existing page,
  `confidence: emerging`, numbers cited inline with the arXiv id.
- Add an entry to `sources.md` (and the stats table if it carries load-bearing numbers).
- Cross-link: the hosting page links to ≥1 related page; bump `updated`.
- Only create a new page if the paper opens a genuinely new topic area — rare.

Finish with a one-paragraph summary: candidates found, what passed the gate and why,
what was rejected and why.
