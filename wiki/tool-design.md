---
title: Tool design
summary: Tool sets are a measured performance variable, not plumbing — design principles, the overlap litmus test, deferred schemas, and the 54-tool reference point.
tags: [tools, design, performance]
updated: 2026-06-11
confidence: established
---

# Tool design

The most-cited agent failure mode in 2026 is **bloated tool sets with overlapping
functionality**. Anthropic's litmus test ("Writing effective tools for AI agents", 2025):
if the engineer cannot definitively pick the right tool for a situation, the model can't
either — and will manifest the ambiguity as wrong-tool selection at runtime.

## Design principles

- **Token-efficient outputs.** Every token a tool returns lives in context for the rest of
  the conversation. Return what's needed in the most compact meaning-preserving form.
- **One tool, one job.** If two tools could plausibly serve the same situation, consolidate
  them or sharpen the boundary.
- **Descriptive parameter names.** Models read schemas as reasoning context: `user_id` over
  `uid`, `include_archived` over `archived`. Trivial cost, fewer wrong-argument calls.
- **Risk taxonomy in annotations.** Tag tools `readOnly` / `destructive` / `idempotent` /
  `openWorld`. The harness routes approvals on these; the model reasons about consequences
  with them. An untagged mutating tool is a latent permission bug — see
  [permissions & safety](permissions-and-safety.md).
- **Constraint enforcement at the decoder.** JSON Schema / regex / CFG masking at sampling
  time makes *malformed* calls unrepresentable (types, enums, required fields). Semantic
  validity — the path exists, the command is safe — still belongs to the permission gate;
  decoder masking complements post-hoc checks, it does not replace them.
- **Per-tool-type result summarization.** File reads keep line numbers and truncate the
  middle; shell keeps first/last lines plus errors; search keeps matches and paths.
  One-size-fits-all summarization wastes precision or tokens.
- **Deferred schemas.** With hundreds of MCP tools, loading every schema up front blows the
  window before the conversation starts. Keep tool *names* always visible; load full
  schemas on demand (Claude Code's `ToolSearch` pattern).
- **Hybrid API + browser for web tasks.** If a structured API exists, use it; browse only
  when it doesn't. Hybrids beat browser-only agents on every measured benchmark
  (WebArena-family results, 2025–26).

## Scale reference

Claude Code ships **54 built-in tools** (19 unconditional, 35 feature-flagged) — a practical
upper bound for a unified, curated tool surface (arXiv 2604.14228). Beyond that, use MCP
servers and skill-based dispatch rather than more first-class tools.

## Code execution as a tool strategy

For multi-step structured operations, letting the agent write and run code in a sandbox
beats chaining discrete tool calls: one runtime block replaces ten round-trips. MCP code
execution reportedly cuts tokens ~98.7% on such workloads (Anthropic engineering, 2025).
The trade-off: code is harder to gate than typed calls — pair with strong
[sandboxing](sandboxing.md).

One safety note belongs here because it is a *tool-design* decision: restricting an agent
means constructing it with a smaller `allowed_tools` list, not prompting it to behave —
schema-level enforcement is layer 1 of the safety stack in
[permissions & safety](permissions-and-safety.md).

Related: [mcp & protocols](mcp-and-protocols.md) · [permissions & safety](permissions-and-safety.md) ·
[subagents & orchestration](subagents-and-orchestration.md)
