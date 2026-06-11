---
title: Memory & state
summary: Three-tier memory (core/archival/recall), facts as first-class objects, belief revision, zombie memory, and the three layers of continual learning.
tags: [memory, state, persistence]
updated: 2026-06-10
confidence: established
---

# Memory & state

Most production memory failures are **retrieval failures, not capacity failures**: the
fact was in storage but didn't reach the model's window at the right moment. Architect for
retrieval first.

## The three-tier model

Originating in MemGPT/Letta, now industry-wide (Anthropic Memory Tool, Mem0, Zep,
MemPalace):

| Tier | Relation to context window | Contents | Cost profile |
|---|---|---|---|
| **Core** | Always in context | System prompt, identity, recent turns, hot constitution | Tokens on every call — must stay compact |
| **Archival** | Queried on demand | Embeddings, knowledge bases, code symbol indexes | Sub-second retrieval; agent must know to ask |
| **Recall** | Triggered loads | Structured notes, named files, fact stores | Deliberate, slower, auditable |

Each tier covers a distinct failure mode: without core the agent forgets who it is;
without archival there's nowhere for the long tail of learned facts; without recall the
agent can't deliberately load task context. Failures usually trace to using one tier for
everything.

## 2026 refinements

- **Facts as first-class objects.** Encode `{subject, predicate, object, confidence,
  last_updated}` instead of raw text. Reported ~100% accuracy at ~252× lower cost than
  holding equivalents in-context (emerging; single-vendor benchmarks) — structured facts
  can be queried, deduped, and revised; prose can't.
- **Multi-graph memory.** Separate semantic, temporal, causal, and entity graphs rather
  than one mega-store; queries traverse the right graph, updates don't pollute the others.
- **Belief revision.** When a stored fact conflicts with new information, flag the
  conflict and keep the timeline instead of silently keeping or overwriting. The
  **zombie-memory problem** — stale facts treated as current — is a documented production
  failure mode.
- **Local-first semantic search.** MemPalace-class systems hit 96.6% R@5 with zero LLM
  calls in the retrieval path. Retrieval quality comes from indexing and ranking, not from
  an LLM in the loop.
- **Dual memory (OpenDev pattern).** Episodic (summarized history) + working (current
  iteration) memory, injected together: prevents both amnesia and unbounded growth.
  (arXiv 2603.05344.)

## Three layers of continual learning

When someone says "the agent learned X," disambiguate:

1. **Model weights** — actual fine-tuning. Rare, expensive.
2. **Harness behavior** — updated prompts, policies, hooks, tool schemas. Medium frequency.
3. **Contextual memory** — facts written to archival/recall storage. Frequent.

Most "learning" in production is layer 3. Treating it as layer 1 inflates expectations
and infrastructure.

Related: [context engineering](context-engineering.md) ·
[long-running agents](long-running-agents.md) · [training frontier](training-frontier.md)
