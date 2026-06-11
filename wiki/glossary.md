---
title: Glossary
summary: Canonical vocabulary for the wiki — use these terms consistently across all pages.
tags: [glossary, reference]
updated: 2026-06-10
confidence: established
---

# Glossary

- **Harness** — everything in an agentic system except the model: loop, tools, context
  manager, permissions, memory, orchestration, sandboxes, observability.
- **Agent loop** — the reason → gate → execute → observe cycle; see
  [agent loop](agent-loop.md).
- **Context rot** — degradation of in-window recall as context grows, caused by O(n²)
  attention dilution; see [context engineering](context-engineering.md).
- **Compaction** — replacing older history with a summary to relieve context pressure.
  Distinct from truncation (destructive chopping).
- **Read-time projection** — showing the model a compressed view while preserving the full
  record in storage; compaction as view, not write.
- **Progressive disclosure / just-in-time retrieval** — keeping references in context and
  loading content on demand.
- **Summary-only return** — sub-agent discipline: workers return condensed findings, never
  full histories; see [sub-agents](subagents-and-orchestration.md).
- **Sidechain transcript** — a worker's full history stored separately: auditable, but
  invisible to the parent at runtime.
- **Deny-first** — permission evaluation where deny rules override allow rules
  unconditionally.
- **Permission mode** — coarse trust dial (plan / default / acceptEdits / auto / dontAsk /
  bypass) constraining the whole permission system.
- **Approval fatigue** — habitual blanket approval of permission prompts (~93% observed),
  making interactive confirmation unreliable as sole safety.
- **Graduated trust** — automation widening with user↔agent track record.
- **Defense in depth** — multiple independent safety layers, any of which can block.
- **Schema-level enforcement** — safety by removing capabilities from the tool schema
  rather than checking at runtime.
- **MCP** — Model Context Protocol; standard model↔tool/resource interface.
- **A2A** — Agent-to-Agent protocol for cross-vendor agent federation.
- **Skill** — markdown instruction file loaded on demand; low-context-cost domain
  knowledge.
- **Hook** — code intercepting harness lifecycle events outside the model's view.
- **Zombie memory** — stale stored facts treated as current; fixed by belief revision.
- **Golden-trajectory replay** — saving full traces and replaying identical prompts after
  harness changes to diff trajectories.
- **pass^k** — reliability metric: all k attempts must succeed (τ-bench).
- **PRM (process reward model)** — reward model scoring trajectory steps, not just
  outcomes; see [training frontier](training-frontier.md).
- **Reward hacking** — achieving high evaluator scores by exploiting the evaluator or
  environment rather than doing the task.
- **Harness expiration** — scaffolds encoding "the model can't do X yet" becoming
  liabilities as models improve.
- **Shift-handoff pattern** — initializer + worker-protocol design for
  [long-running agents](long-running-agents.md).
- **Control failure** — failure of gating/measurement/recovery rather than of model
  reasoning; the dominant 2026 failure class.
