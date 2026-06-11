---
title: Frameworks landscape
summary: The orchestration runtime market mid-2026 — LangGraph, OpenAI Agents SDK, ADK, Claude Agent SDK, and the others — with a selection rule.
tags: [frameworks, tooling, vendors]
updated: 2026-06-10
confidence: emerging
---

# Frameworks landscape

Snapshot of mid-2026. This page goes stale fastest — check `updated` and verify against
current releases before load-bearing decisions.

| Framework | Best fit | Strengths | Trade-off |
|---|---|---|---|
| **LangGraph** | Long-running stateful agents | Low-level orchestration, durable execution, interrupts, persistence, HITL | You own the architecture; not batteries-included |
| **OpenAI Agents SDK** (+ Responses API) | Python with strong built-ins | Handoffs, guardrails, tracing, hosted tools | Opinionated around OpenAI runtime concepts |
| **Google ADK** | Enterprise multi-agent, multi-language | Workflow agents, hierarchical composition | Younger ecosystem; best value inside GCP |
| **Claude Agent SDK** | Coding/terminal-native agents | Inherits Claude Code primitives: deny-first permissions, hooks, skills, sidechains | Most natural on Anthropic models |
| **AutoGen** | Event-driven multi-agent | Scalable event-driven core, research heritage | Conceptual overhead; agent-sprawl risk |
| **CrewAI** | Quick multi-agent ergonomics | Crews, flows, memory, built-in tracing | Encourages org-chart decomposition without governance |
| **smolagents** | Lightweight experiments, code agents | Tiny abstraction surface; CodeAgent; direct MCP | Experimental API; security caveats on code exec |
| **PydanticAI** | Type-safe Python apps | Pydantic-validated I/O, Logfire alignment | App framework more than orchestration runtime |
| **Semantic Kernel** | .NET / Azure enterprises | Process framework, deep Azure integration | Middleware-flavored vs OSS agent stacks |

**Managed runtimes** (give up control, gain speed): OpenAI Responses + Conversations,
AWS Bedrock AgentCore, Microsoft Foundry Agent Service.

**Observability/eval platforms** cluster around LangSmith, Braintrust, Langfuse (strong
self-host story), Arize Phoenix, W&B Weave, Helicone.

## Selection rule

Most tunable open runtime → **LangGraph**. Capable Python SDK with hosted tools and
tracing → **OpenAI Agents SDK**. Enterprise multi-agent across languages → **ADK**.
Coding agent → **Claude Agent SDK**. Smaller ergonomic layer → CrewAI / smolagents /
PydanticAI. Azure/.NET shop → Semantic Kernel.

## Lock-in is smaller than it looks

Frameworks differ mainly in orchestration primitives, not tool or eval surfaces. Keep
tools behind [MCP](mcp-and-protocols.md), traces in an OTel-compatible backend, and eval
datasets portable, and switching costs stay manageable. The deep fork that actually
commits you is architectural, not vendor: explicit graphs vs model autonomy — see
[subagents & orchestration](subagents-and-orchestration.md).

Related: [mcp & protocols](mcp-and-protocols.md) · [adoption roadmap](adoption-roadmap.md) ·
[evaluation](evaluation.md)
