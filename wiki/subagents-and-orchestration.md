---
title: Sub-agents & orchestration
summary: Supervisor + isolated workers with summary-only returns; sidechain transcripts, parameterized agent classes, and the graphs-vs-autonomy fork.
tags: [orchestration, subagents, multi-agent]
updated: 2026-06-10
confidence: established
---

# Sub-agents & orchestration

When one context window can't hold the problem, decompose. The dominant 2026 pattern is
**supervisor + isolated workers with summary-only returns**: the supervisor owns the plan
and the right to commit; workers run sub-tasks in their own clean windows and return only
condensed summaries.

The discipline that makes this scale: **summary-only returns**. A worker that burns 30K
tokens exploring returns ~1.5K tokens of findings. Without this rule, every worker's
exploration lands in the supervisor's window and you've multiplied your
[context-rot](context-engineering.md) problem instead of solving it.

## Four design choices that matter (OpenDev lessons, arXiv 2603.05344)

1. **Single concrete agent class, parameterized.** Class hierarchies
   (`PlanningAgent`, `ResearchAgent`, …) hit the diamond problem the moment a worker needs
   mixed capabilities. One `MainAgent`; variation comes from `allowed_tools`, system-prompt
   overrides, and model selection. Composition of new variants becomes a config change.
2. **Sidechain transcripts.** Each worker's full history goes to its own file (Claude Code:
   per-subagent JSONL). Debuggable after the fact, invisible to the parent at runtime —
   this is what makes summary-only returns lossless for auditing.
3. **Permission inheritance with escalation.** Workers inherit the parent's permission
   mode; a "bubble" escape hatch escalates denials to the parent's approval surface when a
   worker genuinely needs something sensitive. See
   [permissions & safety](permissions-and-safety.md).
4. **Eager construction.** Build all prompts and schemas before first execution. Lazy
   construction causes first-call latency and races with MCP discovery — a documented
   shipped-and-reverted regression.

## Topology families

- **Deterministic workflow** — DAG with model-filled slots; compliance-grade tasks.
- **Single-agent loop** — the default starting point; one agent, one tool surface.
- **Planner–executor–critic** — separates planning from execution from gating; reduces
  plan thrash, gives verification a seat.
- **Manager–worker** — this page's main pattern; manager-only write authority.
- **Code-first** — the agent emits code, not tool calls; see [tool design](tool-design.md).
- **Managed runtime** — platform owns the loop (Responses, AgentCore, Foundry).

Hybrids are the norm: a support agent might run a single-agent loop whose refund action is
delegated to a schema-restricted worker behind a critic gate — three families in one system.

## The architectural fork: graphs vs model autonomy

Two live philosophies. **Explicit graphs** (LangGraph): control flow as typed state and
conditional edges — inspectable, testable, replayable. **Implicit reasoning** (Claude Code):
no imposed planning graph; the model reasons freely inside a deterministic operational
harness. Neither has won. Choose by whether your domain demands inspectable control flow
(regulated workflows → graphs) or benefits from model latitude (open-ended engineering →
autonomy). See [frameworks landscape](frameworks-landscape.md).

## Multi-agent failure modes

Deadlocks, duplicated work, and contradictory plans come from unclear role contracts and
shared write authority. Mitigations: manager-only writes, typed handoff messages (A2A if
cross-vendor — see [mcp & protocols](mcp-and-protocols.md)), shared canonical state with
single-writer discipline.

Related: [context engineering](context-engineering.md) · [agent loop](agent-loop.md) ·
[long-running agents](long-running-agents.md)
