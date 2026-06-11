# Pipeline journal

Append-only log of maintenance runs. Newest entries at the bottom.

## 2026-06-10 — `genesis` (manual)
- model: claude-opus-4-7 (interactive session)
- 19 pages seeded from a deep-research synthesis of primary sources (Anthropic engineering
  posts, OpenAI, Martin Fowler, arXiv 2604.14228 / 2603.05344, MCP/A2A specs, benchmark
  literature, EU AI Act / NIST / OWASP). Index, glossary, and sources established as
  structural pages.

## 2026-06-10 — `prune` pass 1 (manual)
- model: claude-opus-4-7 (interactive session)
- Deduped cross-page overlap: tool-design.md's "tool removal as safety" section collapsed
  to one sentence + link (canonical home: permissions-and-safety.md layer 1);
  training-frontier.md's Berkeley RDI audit detail collapsed to a link (canonical home:
  evaluation.md benchmark trust crisis).

## 2026-06-10 — `lint` pass 1 (manual)
- model: claude-opus-4-7 (interactive session)
- Mechanical validation: frontmatter present/valid on all 19 pages; all relative links
  resolve; no orphan pages (all reachable from index.md); no page exceeds 150 lines
  (max: sources.md at 84). Wiki totals ~1,250 lines.

## 2026-06-10 — `research` (manual, user-submitted paper)
- model: fable-5 (interactive session)
- Ingested arXiv 2606.09498 *Self-Harness: Harnesses That Improve Themselves*: new
  "Self-improving harnesses" section in training-frontier.md (weakness mining → proposal
  → regression-gated validation; Terminal-Bench-2.0 gains across 3 models; harnesses as
  model-specific artifacts), cross-link from what-is-a-harness.md harness-expiration
  principle, sources.md entry + stats row. confidence: emerging (single paper, June 2026).

## 2026-06-10T08:49:00.167Z — `lint`
- model: cli-default
- cost: $0.8857
- summary: **Summary:**

## 2026-06-10 — `lint` correction (manual, found during paper writing)
- model: fable-5 (interactive session)
- Attribution fix: the martinfowler.com harness-engineering article is by Birgitta
  Böckeler, not Martin Fowler (caught by reference verification while writing the survey
  paper). Corrected in what-is-a-harness.md (section heading + citation) and sources.md.

## 2026-06-11 — `lint` correction (manual, found by essay technical review)
- model: fable-5 (interactive session)
- Two overclaims softened after an adversarial review of the survey essay traced them
  here: context-engineering.md stated O(n²) attention dilution as THE mechanism of context
  rot (now: leading explanations, mechanism debated, training-distribution factor added);
  tool-design.md called decoder masking "strictly better than post-hoc validation" (now:
  makes malformed calls unrepresentable; semantic validity still belongs to the gate).
