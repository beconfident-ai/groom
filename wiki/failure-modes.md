---
title: Failure modes
summary: The control-failure catalog — what actually takes agent projects down — with symptoms, mitigations, and the ordered mitigation hierarchy.
tags: [failure-modes, reliability, mitigations]
updated: 2026-06-10
confidence: established
---

# Failure modes

The dominant agent failures in 2026 are not hallucinations — they are **control
failures**: the agent did something it shouldn't, skipped something it should have, did
the right thing with unintended side effects, or succeeded at unsustainable cost. Use this
catalog as a checklist: would your system catch each row?

## The catalog

| Failure | Symptom | Primary mitigation |
|---|---|---|
| Prompt injection / jailbreak transfer | Agent obeys malicious webpage/file/tool output | Retrieval & execution rails · allowlisted tools · provenance tagging · approval for writes |
| Tool overload / confusion | Wrong tool picked, irrelevant repeats, inflated latency | Fewer tools, sharper boundaries — see [tool design](tool-design.md) |
| Context poisoning / memory drift | Forgets task, repeats questions, acts on stale notes | Structured state · recall-first compaction · bounded scratchpads |
| Looping / retry storms | Cost spikes, no progress, endless self-correction | Step & retry budgets · dead-end classifiers · circuit breakers |
| Unsafe code/command execution | Host mutation, exfiltration, escape attempts | Isolation tiers — see [sandboxing](sandboxing.md) |
| Evaluator gaming / reward hacking | Benchmark gains without capability gains | Separate evaluator process · immutable env state · exploit suites — see [training frontier](training-frontier.md) |
| Multi-agent coordination failure | Deadlocks, duplicate work, contradictory plans | Role contracts · manager-only writes — see [sub-agents](subagents-and-orchestration.md) |
| Judge drift / brittle offline metrics | Offline gains don't transfer; false wins | Adjudicated judge benchmarks · mixed rule+judge scoring · online evals |
| Silent failure / graceful degradation | Failures invisible; regressions ship | Loud failure modes · post-action audit · anomaly detection |
| Approval prompts as only safety | Blanket approval defeats the gate | Defense in depth — see [permissions & safety](permissions-and-safety.md) |
| Compaction-as-truncation | Lost decisions and open bugs | Semantic, recall-first compaction — see [context engineering](context-engineering.md) |
| Instruction fade-out | Agent drifts from constraints mid-task | Event-driven reminder re-injection at decision points, not just at startup |

## The mitigation hierarchy

Order of operations when standing up safety from scratch — each step is cheaper and more
reliable than the next, so do them in this order:

1. **Remove unnecessary tools.** The cheapest safety gain is a smaller action space.
2. **Strongly type what remains.** Schemas + constrained decoding make invalid inputs
   unrepresentable.
3. **Gate all irreversible actions.** Explicit approval points for mutations, external
   messages, money, production.
4. **Isolate side-effectful execution.** Assume the model can generate anything; bound
   what "anything" can do.
5. **Trace everything.** You can't debug what you didn't capture.
6. **Evaluate trace-level behavior.** Per-turn checks miss looping, drift, and gaming.
7. **Red-team the evaluator.** Your benchmarks are attack surfaces.
8. **Only then consider agent-specific RL.** RL amplifies whatever flaws the harness has.

Most failed projects attempt this list in reverse — heavy training investment on top of an
unsound harness. Get the harness right; train when there's signal worth training on.

Related: [permissions & safety](permissions-and-safety.md) · [evaluation](evaluation.md) ·
[sandboxing](sandboxing.md)
