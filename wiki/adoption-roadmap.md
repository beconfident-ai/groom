---
title: Adoption roadmap
summary: The four-phase rollout (foundation → hardening → domain specialization → optimization) and twelve operating principles for an AI leader.
tags: [strategy, roadmap, leadership]
updated: 2026-06-10
confidence: established
---

# Adoption roadmap

For a technical AI leader without a binding budget constraint: optimize for capability,
correctness, and future-proofing over cost minimization. The classic failure is
under-investing in the harness to move fast, then spending months retrofitting safety,
observability, and evaluation onto a system not designed for them.

## Four phases — don't skip

Phases are commitments, not calendar units. Each depends on the previous; skipping costs
time with interest.

1. **Foundation.** Standardize on one orchestration runtime
   ([frameworks landscape](frameworks-landscape.md)), [MCP](mcp-and-protocols.md) for
   tools (A2A only if federating), one trace substrate, one
   [sandboxing](sandboxing.md) story.
2. **Hardening.** Approval workflows, cost/step budgets, trace-level evaluators online,
   exploit-aware red-teaming. Treat every evaluator as untrusted until adversarially
   audited.
3. **Domain specialization.** Internal simulators mirroring your real tools, permissions,
   and failure modes. Public benchmarks are useful, not sufficient — harness quality is
   capped by how faithfully you emulate your systems of record.
4. **Optimization.** PRMs, verifier-guided search, RL — only after the runtime is stable
   and measurement is trustworthy, starting in narrow domains with strong ground truth.
   See [training frontier](training-frontier.md).

## Twelve operating principles

1. **Pick a harness; don't write your own from scratch.** The undifferentiated 98% is not
   your IP. Build the business-specific parts.
2. **Invest in sensors first** — computational before inferential
   (see [evaluation](evaluation.md)).
3. **Treat context as a budget.** Tokens-per-task on the same dashboard as latency and
   success rate.
4. **Schema-level safety over runtime checks.** Remove the tool, don't prompt against it.
5. **Build the eval harness before the agent.** Golden-trajectory replay from day one.
6. **Standardize on MCP.** The cost of not doing so is small in week one, enormous in
   month six.
7. **Externalize policy** — hooks and config, not hardcoded branches. Ship policy without
   redeploying.
8. **Plan for harness expiration.** Label every scaffold with the model limitation it
   works around; audit and remove as models improve.
9. **Append-only state, projection at read time.** Storage is cheap; lost evidence isn't.
10. **Sub-agents over monoliths** for decomposable work — with summary-only returns
    ([sub-agents](subagents-and-orchestration.md)).
11. **Make the harness your compliance boundary**
    ([regulatory](regulatory-and-compliance.md)).
12. **Audit your own evaluators.** Benchmarks are exploit surfaces
    ([training frontier](training-frontier.md)).

Related: [what is a harness](what-is-a-harness.md) · [failure modes](failure-modes.md) ·
[evaluation](evaluation.md)
