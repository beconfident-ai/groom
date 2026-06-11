---
title: Sources
summary: Primary sources backing the wiki's claims, grouped by what they're load-bearing for.
tags: [sources, references]
updated: 2026-06-10
confidence: established
---

# Sources

## Mental model & core discipline

- Anthropic — *Building Effective AI Agents* — agents as tool-using loops
- Anthropic — *Effective context engineering for AI agents* — context rot, the four
  patterns, token minimalism
- Anthropic — *Writing effective tools for AI agents* — the overlap litmus test
- Anthropic — *Effective harnesses for long-running agents* — initializer/worker pattern
- Birgitta Böckeler — *Harness Engineering for Coding Agent Users* (martinfowler.com, 2026) — guides/sensors ×
  computational/inferential
- OpenAI — *Harness engineering: leveraging Codex in an agent-first world*

## System architecture (deep dives)

- arXiv 2604.14228 — *Dive into Claude Code* — 7 safety layers, 5-layer compaction,
  27 hook events, 54 tools, 1.6%/98.4% split
- arXiv 2603.05344 — *Building AI Coding Agents for the Terminal* (OpenDev) —
  parameterized agent class, eager construction, dual memory
- awesome-harness-engineering (GitHub) — field taxonomy

## Protocols & frameworks

- modelcontextprotocol.io — MCP spec: intro, architecture, tools, resources, lifecycle
- a2a-protocol.org — A2A spec
- LangGraph docs — durable execution, persistence, HITL
- OpenAI Agents SDK + Responses API docs
- Google ADK docs · CrewAI docs · smolagents docs (incl. code-execution security caveats)
- Semantic Kernel docs · PydanticAI docs

## Evaluation & benchmarks

- AgentBench · GAIA · WebArena · BrowserGym · OSWorld · τ-bench (pass^k) ·
  SWE-bench Verified/Live
- AgentRewardBench — evaluating the evaluators
- Online-Mind2Web — realistic online web eval; ~85% judge–human agreement
- *Agentic Benchmark Checklist* — flaws misestimate relative performance up to 100%
- Berkeley RDI benchmark audit (April 2026) — exploit paths in 13 benchmarks

## Training frontier

- AgentPRM — agent process reward models
- Web-Shepherd — step-level PRM for web navigation
- ToolPRMBench — PRM quality benchmark for tool use
- RLTR — tool-use-completeness rewards (8–12% planning gains)
- Agent Lightning — decoupled RL for arbitrary agent stacks
- ALE / ROME — end-to-end agentic environment + policy ecosystem
- Reward Hacking Benchmark — exploit rates in RL-trained tool agents
- arXiv 2606.09498 — *Self-Harness: Harnesses That Improve Themselves* — weakness mining
  → proposal → regression-gated validation; model-specific harnesses

## Infrastructure

- gVisor docs — user-space application kernel
- Firecracker docs — microVM, <125ms boot
- E2B — managed agent sandboxes
- NeMo Guardrails — five rail types

## Governance

- EU AI Act — phased application timeline (2024-08-01 → 2026-08-02 → 2027+)
- NIST AI RMF 1.0 + Generative AI Profile
- OWASP LLM Top 10 (2025) · OWASP Top 10 for Agentic Applications (2026)
- IETF draft work on agent authentication (SPIFFE, OAuth Token Exchange, DPoP)

## Statistics quick index

| Claim | Source |
|---|---|
| 1.6% AI logic / 98.4% infrastructure | Community analysis of Claude Code, 2026 |
| ~88% of agent projects never ship | Directional; vendor reports + Gartner notes |
| ~93% of permission prompts approved | Anthropic auto-mode analysis, 2026 |
| 20%→40%+ auto-approval over 750 sessions | Anthropic, 2026 |
| ~98.7% token cut via MCP code execution | Anthropic engineering, 2025 |
| ~252× cost reduction, facts-as-objects | Emerging; single-vendor benchmark |
| 96.6% R@5, zero-LLM retrieval | MemPalace |
| Exploits in 13 benchmarks | Berkeley RDI audit, April 2026 |
| 8–12% planning gains | RLTR |
| Terminal-Bench-2.0 self-harness gains (e.g. 40.5%→61.9% MiniMax M2.5) | arXiv 2606.09498 |
