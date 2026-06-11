---
title: Context engineering
summary: The central discipline of harness engineering — curating the smallest high-signal token set per call; context rot, four management patterns, layered compaction.
tags: [context, compaction, core-discipline]
updated: 2026-06-11
confidence: established
---

# Context engineering

Prompt engineering asks "how do I write the instructions for one call." Context engineering
asks "what set of tokens should be in the model's window at *this exact call*, across a
multi-turn loop." The guiding principle (Anthropic, "Effective context engineering for AI
agents", 2025): **find the smallest possible set of high-signal tokens that maximizes the
probability of the desired outcome.**

## Context rot

The reason minimalism wins even with 1M-token windows: a model's ability to recall and
reason over in-window information degrades as the window fills. Leading explanations (the
mechanism is still debated): softmax attention spreads each token's influence across more
competitors as context grows, and training data skews short so long-range recall is
undertrained. A fact the model technically "saw" may be too dilute to drive behavior.
Empirically verifiable: embed a fact at 5K/50K/200K tokens of surrounding context and watch
retrieval accuracy fall. **Quantity of tokens is not the goal; quality is.** Track
tokens-per-task as a first-class metric.

## The four management patterns

Production systems combine all four; each targets a different failure mode.

1. **Just-in-time retrieval (progressive disclosure).** Keep lightweight references (paths,
   IDs, URLs) in context; load content via tool calls when needed. How coding agents handle
   large repos — grep/head/read on demand rather than preloading. Default for any
   large-corpus task.
2. **Compaction.** Summarize older history; reinitialize the window with the summary.
   Tune for **recall first** (capture every fact that might matter: architectural decisions,
   unresolved bugs, user preferences), precision second (drop redundant tool outputs).
   Recall failures are catastrophic — the agent forgets the bug it was fixing; precision
   failures are merely expensive.
3. **Structured note-taking.** The agent writes outside the window — `NOTES.md`, progress
   files, todo lists — and reloads on demand. Best for iterative work with discrete
   deliverables; the notes double as a human-readable audit trail. Anthropic ships a memory
   tool for this pattern.
4. **Sub-agents with summary-only return.** A worker explores in its own window (possibly
   tens of thousands of tokens) and returns 1–2K tokens to the parent. See
   [sub-agents](subagents-and-orchestration.md).

## Layered compaction: the Claude Code reference pipeline

The most documented production compaction design runs five layers in cost order before
every model call, escalating only while pressure remains (arXiv 2604.14228):

| # | Layer | What it does | Cost |
|---|---|---|---|
| 1 | Budget reduction | Per-message size caps; oversized outputs → content reference | ≈0 |
| 2 | Snip | Temporal trim of oldest history segments | low |
| 3 | Microcompact | Fine-grained, cache-aware merging of redundant structures | medium |
| 4 | Context collapse | **Read-time projection**: model sees a compressed view; full history preserved in a separate store | medium |
| 5 | Auto-compact | Full LLM-generated semantic summary | high (1 model call) |

The architectural commitment underneath: **append-only state, projection at read time**.
Transcripts are never destroyed; compaction produces views, not writes. Auditability over
query efficiency — it pays off when debugging "why did the agent do that" weeks later, and
when compliance asks for the record (see [regulatory](regulatory-and-compliance.md)).

## Anti-patterns

- **Compaction-as-truncation.** Chopping history destroys decisions and open bugs. Compact
  semantically, recall-first.
- **Treating window growth as the only context problem.** Rot hits before the limit does.
- **Stuffing instead of retrieving.** If you preload "everything that might be relevant,"
  you've already lost; build the retrieval tool instead.

Related: [memory & state](memory-and-state.md) · [agent loop](agent-loop.md) ·
[long-running agents](long-running-agents.md)
