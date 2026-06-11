---
title: Harness Engineering Wiki — Map of Content
summary: Entry point. Read this first to decide which pages to load; do not load the whole wiki.
tags: [index, navigation]
updated: 2026-06-10
confidence: established
---

# Harness Engineering Wiki

A maintained knowledge base on **harness engineering**: the design and operation of the
control, execution, safety, evaluation, and training infrastructure that turns one or more
LLMs into a dependable agentic system. The defining equation of the field:
**Agent = Model + Harness** — and in production, ~98% of the codebase is harness.

## How to use this wiki (humans and agents)

Each page's frontmatter `summary` tells you whether it's relevant. Load only what you need —
this wiki practices what it preaches about [context engineering](context-engineering.md).
`confidence` field: `established` (consensus), `emerging` (recent/fast-moving), `contested`
(sources disagree).

## Core concepts

- [What is a harness](what-is-a-harness.md) — definition, scope, the control-plane thesis, why the harness is now the differentiator
- [The agent loop](agent-loop.md) — the universal skeleton: reason → gate → execute → observe, and where the harness inserts itself
- [Context engineering](context-engineering.md) — the central discipline; context rot, the four management patterns, compaction pipelines
- [Memory & state](memory-and-state.md) — three-tier memory, facts as objects, belief revision, continual-learning layers

## Building blocks

- [Tool design](tool-design.md) — tool sets as a measured performance variable; design principles and the 54-tool reference point
- [MCP & interoperability protocols](mcp-and-protocols.md) — MCP, A2A, AG-UI; the protocolization of the stack
- [Sub-agents & orchestration](subagents-and-orchestration.md) — supervisor/worker, summary-only returns, sidechain transcripts
- [Frameworks landscape](frameworks-landscape.md) — LangGraph, OpenAI Agents SDK, ADK, Claude Agent SDK, and how to choose

## Safety & operations

- [Permissions & safety layers](permissions-and-safety.md) — defense in depth, deny-first, approval fatigue, graduated trust
- [Sandboxing](sandboxing.md) — isolation tiers from process to microVM; when each is enough
- [Failure modes](failure-modes.md) — the control-failure catalog and the mitigation hierarchy
- [Long-running agents](long-running-agents.md) — the initializer/worker shift-handoff pattern

## Measurement & improvement

- [Evaluation](evaluation.md) — per-call sensors vs harness-level evals; benchmark portfolio; the minimum scorecard
- [Training frontier](training-frontier.md) — PRMs, agentic RL, reward hacking, the harness utility function

## Strategy

- [Regulatory & compliance](regulatory-and-compliance.md) — EU AI Act timeline, NIST, OWASP; the harness as compliance boundary
- [Adoption roadmap](adoption-roadmap.md) — the four-phase rollout and twelve operating principles

## Reference

- [Glossary](glossary.md) — canonical vocabulary used across all pages
- [Sources](sources.md) — primary sources backing the wiki's claims
