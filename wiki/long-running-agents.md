---
title: Long-running agents
summary: The initializer/worker shift-handoff pattern for work spanning many context windows — durable artifacts, fixed orientation protocols, tamper-resistant progress.
tags: [long-horizon, persistence, protocols]
updated: 2026-06-10
confidence: established
---

# Long-running agents

A long-running agent's work cannot fit one context window: hours to weeks, multiple
sessions, later instances picking up where earlier ones stopped. The naive approach fails
because each session starts amnesiac — an engineer beginning their first day every morning.
The hardest open problem in the field, and where harness design pays its biggest dividends.

The canonical pattern (Anthropic, "Effective harnesses for long-running agents", 2025) is
explicitly modeled on **human shift handoff**: one initialization pass creates durable
scaffolding; every later session follows a fixed orientation protocol before new work.

## The initializer agent (runs once)

Produces durable artifacts that replace memory:

- **`features.json`** — 200+ granular work items, each `{"passes": false}`
- **`progress.txt`** — running log of completed work
- **`init.sh`** — brings up the dev environment from cold
- **Baseline git commit** — a known-good starting point
- **`AGENTS.md` / `CLAUDE.md`** — conventions and constraints

Future agents need remember nothing; the artifacts encode the state.

## The worker protocol (every subsequent session)

1. `pwd` — verify location
2. Read git log + progress file — understand recent work
3. Pick the highest-priority incomplete feature
4. Run `init.sh`
5. Run end-to-end tests **before** changing anything (catches inherited broken state)
6. Implement exactly one feature
7. Flip its `passes` to `true`
8. Commit with a descriptive message; update the progress file

Rigidity is the point: the protocol prevents declaring victory by skipping verification.

## The tamper-resistance trick

Workers may **flip `passes` but never delete features**. This one constraint defeats the
failure mode where a stuck agent removes the difficult item from scope to claim
completion. An append-only work list with a single mutable bit per item is a
tamper-resistant progress record — a small piece of harness design doing the work of a
supervisor.

## Why this generalizes

Long-running agency is not a bigger-context-window problem; it is a **handoff-protocol
design problem**. The artifacts are [structured note-taking](context-engineering.md) made
load-bearing; the e2e-test-first step is a [computational sensor](evaluation.md) placed at
the highest-leverage moment; the append-only journal echoes the append-only-state principle
from [context engineering](context-engineering.md). Compose dozens of bounded sessions and
you get work no single session could do.

Self-verification matters more as horizons grow: browser automation (Playwright MCP) lets
the agent watch its own output as a user would, closing the loop without a human in it.

Related: [context engineering](context-engineering.md) · [memory & state](memory-and-state.md) ·
[subagents & orchestration](subagents-and-orchestration.md)
