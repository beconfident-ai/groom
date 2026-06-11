# Wiki conventions (shared context for all operations)

You are maintaining `wiki/` — a markdown knowledge base on **harness engineering for AI agents**
(the discipline of building the control, execution, safety, evaluation, and training
infrastructure around LLMs to produce dependable agentic systems).

## File rules

- All content lives in `wiki/*.md`. Meta files (journal, style notes) live in `wiki/_meta/`.
- One topic per page. Kebab-case filenames (`tool-design.md`).
- Every page starts with YAML frontmatter:

```yaml
---
title: Human-readable title
summary: One sentence. This is what agents read to decide whether to load the page.
tags: [comma, separated, lowercase]
updated: YYYY-MM-DD
confidence: established | emerging | contested
---
```

- `confidence` meanings: `established` = multi-source consensus; `emerging` = credible but
  recent, single-source, or fast-moving; `contested` = sources actively disagree.
- Cross-link with relative markdown links: `[tool design](tool-design.md)`. Every page should
  link to at least two other pages. `index.md` must link to every page.
- Pages target 60–150 lines. If a page outgrows that, split it and update `index.md`.
- Cite claims that carry numbers ("93% of permission prompts are approved") with their origin
  inline, e.g. `(Anthropic auto-mode analysis, 2026)`. Sources collected in `sources.md`.
- Write for a technical reader (Head of AI / staff engineer). Plain prose over bullet walls.
  Explain the *why*, not just the *what*.

## Hard constraints

- Modify only files inside `wiki/`. Never touch `pipeline/`, `README.md`, `package.json`,
  `.claude/`, or anything else.
- Never delete `index.md`, `sources.md`, or `_meta/`.
- After ANY change to page structure (add/remove/rename), update `index.md` to match.
- End your run with a short summary of what you changed (this gets journaled).
