---
title: Permissions & safety layers
summary: Defense in depth for agent actions — deny-first evaluation, permission modes, safety classifiers, approval fatigue, and graduated trust.
tags: [safety, permissions, security]
updated: 2026-06-10
confidence: established
---

# Permissions & safety layers

Safety in agentic systems is not a moderation sidecar; it is a **layered control stack
threaded through the loop**. The architectural commitment is defense in depth: no layer
trusts the others, each catches a different failure class, and **any single layer can block
an action**.

## The seven-layer reference stack (Claude Code)

The most documented production safety architecture (arXiv 2604.14228):

1. **Tool pre-filtering.** Deny-listed tools never appear in the model's schema. The model
   cannot attempt what it cannot see — the cheapest, most reliable control. See
   [tool design](tool-design.md).
2. **Deny-first rule evaluation.** Deny rules override allow rules unconditionally. No
   allow is strong enough to beat a deny. Commonly botched when user rules share a priority
   pool with policy rules.
3. **Permission modes.** A coarse trust dial constraining the whole system at once:
   plan (read-only) / default (interactive) / acceptEdits / auto (classifier decides) /
   dontAsk / bypassPermissions / bubble (sub-agent escalation).
4. **Safety classifier (auto mode).** Two-stage — fast filter, then chain-of-thought — that
   judges whether an action is safe without asking the user.
5. **Sandbox isolation** at execution time bounds the blast radius even if every layer
   above fails. See [sandboxing](sandboxing.md).
6. **Permission non-restoration.** Session-granted permissions are NOT restored on
   resume/fork; every approval re-evaluates under current rules. Usability cost, real
   safety win against stale-authority bugs.
7. **Hooks.** External code at lifecycle events can deny, modify input, or inject context —
   organization policy without forking the harness.

## Approval fatigue: the number that redesigns your UX

Users approve ~**93%** of permission prompts (Anthropic auto-mode analysis, 2026).
Interactive confirmation is therefore behaviorally unreliable as the *only* safety
mechanism — a prompt that's always approved is a habit, not a check. Respond two ways:
(1) prompt only for genuinely consequential actions so attention survives; (2) add
automated checks (classifiers, schema enforcement, sandboxing) that don't depend on user
attention.

## Graduated trust

Trust is a spectrum traversed over the user↔agent relationship, not a binary. Anthropic's
data: ~20% of actions auto-approve at <50 sessions, rising past 40% by 750 sessions.
Design permission systems to widen automatically with track record, with the dial visible
and reversible.

## Risk-weighted oversight

Reversible, read-only actions get light gating; irreversible, outward-facing, or
money-moving actions get heavy gating. Encode reversibility in tool annotations so the
gate can read it. The mitigation ordering lives in [failure modes](failure-modes.md).

## Compliance hook

This layer produces the artifacts regulators ask for: approval records, policy evaluation
artifacts, immutable decision logs. Design them in from day one — see
[regulatory & compliance](regulatory-and-compliance.md).

Related: [sandboxing](sandboxing.md) · [agent loop](agent-loop.md) ·
[failure modes](failure-modes.md)
