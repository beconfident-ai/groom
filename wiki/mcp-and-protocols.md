---
title: MCP & interoperability protocols
summary: The protocolization of the agent stack — MCP for tools, A2A for agent federation, AG-UI for the UI surface; plus the four extension mechanisms.
tags: [mcp, a2a, protocols, interoperability]
updated: 2026-06-10
confidence: established
---

# MCP & interoperability protocols

The most important technical shift since 2024: **interoperability got protocolized**. In
2023 every framework had its own tool format and message convention; by 2026 the field has
consolidated on three standards, one per communication layer.

| Layer | Standard | Status (mid-2026) |
|---|---|---|
| Model ↔ tool/context | **MCP** (Model Context Protocol) | De facto standard. Hosted in OpenAI Responses; native in Claude Code, Cursor, Bedrock, ADK. |
| Agent ↔ agent | **A2A** (Agent-to-Agent) | Emerging. Strong Google backing; multi-vendor adoption underway. |
| Agent ↔ UI | **AG-UI** | Earlier-stage. Event-driven streaming of thinking/tool-call/approval events. |

## MCP essentials

MCP formalizes a small primitive set: **tools** (callable functions), **resources**
(read-only data), **prompts** (reusable templates), and **lifecycle** (init, capability
negotiation, shutdown), over JSON-RPC with six transports (stdio, SSE, HTTP, WebSocket,
SDK, IDE adapters). A server can be a local subprocess or a remote service; the agent
doesn't care. The *host* owns security boundaries; the server is just a capability provider.

Practical consequence: **stop writing bespoke tool integrations.** Composio alone wraps
250+ SaaS actions as MCP (citation needed); Playwright MCP does browser automation via the accessibility
tree (no vision needed); filesystem/shell/DB servers are standard.

Known spec gaps as of mid-2026: identity propagation, richer error semantics, well-known
discovery, and a Tasks primitive — all on the public roadmap. `confidence: emerging` on
how these land.

## A2A and AG-UI in one paragraph each

**A2A** addresses multiple agents — possibly different frameworks, teams, or vendors —
coordinating: agent cards for capability discovery, task lifecycle, typed messages. Read it
early if federation is on your roadmap; defer if you're single-agent.

**AG-UI** standardizes the agent→UI event stream so UIs don't hand-parse each framework's
output format. Matters once you build product surfaces on top of agents.

## The four extension mechanisms

Mature harnesses extend through four mechanisms with different cost/power profiles — use
all four for different jobs, not one for everything:

| Mechanism | Context cost | Power | Use for |
|---|---|---|---|
| MCP servers | High (schemas in context) | Highest | External integrations, SaaS, browser, FS |
| Plugins | Variable (bundles) | High | Distributing reusable harness extensions |
| Skills | Low (markdown, lazy-loaded) | Medium | Domain knowledge, conventions, workflows |
| Hooks | Zero (run outside the model) | Targeted | Policy, telemetry, gates, transformations |

Skills are markdown instruction files loaded on demand — domain knowledge without an MCP
server's context cost. Hooks intercept lifecycle events (PreToolUse, PostToolUse,
PermissionRequest…) entirely outside the model's view — the right home for organizational
policy; Claude Code defines 27 hook event types.

Related: [tool design](tool-design.md) · [frameworks landscape](frameworks-landscape.md) ·
[permissions & safety](permissions-and-safety.md)
