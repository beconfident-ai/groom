---
title: Evaluation
summary: Per-call sensors vs harness-level evals, the benchmark portfolio and its trust crisis, the trace-native feedback loop, and the minimum credible scorecard.
tags: [evaluation, benchmarks, metrics, testing]
updated: 2026-06-10
confidence: established
---

# Evaluation

Agent evaluation is harder than model evaluation: you score **trajectories** — sequences
of decisions, tool calls, and intermediate states — not input/output pairs. Outcome-only
metrics reward agents that cheat to the answer, get there expensively, or leave side
effects an audit would fail.

## Two layers, both required

**Per-call sensors (inside the loop):** schema validation (cheapest; reject malformed tool
calls at parse or decode time), test/linter/compiler runs with output *formatted for the
model* (paths, line numbers, suggestions), LLM-as-judge for semantic dimensions only, and
optional self-critique passes. Lean computational before inferential — cheaper, more
reliable, drift-free (see the quadrant table in [what is a harness](what-is-a-harness.md)).

**Harness-level evals (outside the loop):** benchmark suites, golden-trajectory replay,
regression harnesses over saved transcripts. Golden-trajectory replay — save full traces,
replay the same prompts after a harness change, diff trajectories — catches regressions
point evals miss. Build this *before* the agent ships.

## The benchmark portfolio

| Benchmark | Measures | Caveat |
|---|---|---|
| AgentBench | Interactive reasoning, 8 envs | Aging; pre-dates current stacks |
| GAIA | General assistant w/ tools | Small held-out set |
| WebArena / Online-Mind2Web | Realistic web tasks | Browser-only numbers mislead where APIs exist |
| BrowserGym | Unified web-agent substrate | Infrastructure, not one distribution |
| OSWorld | Real computer use, 3 OSes | Heavy to run |
| τ-bench | Tool-agent-user + rules; `pass^k` | Simulated users |
| SWE-bench Verified/Live | Real software issues | Test adequacy contested; gaming documented |
| AgentRewardBench | Quality of automatic evaluators | Evaluates evaluators, not capability |
| ToolPRMBench | PRM quality for tool use | Narrow |

**The trust crisis:** Online-Mind2Web showed earlier web-agent results were over-optimistic;
AgentRewardBench showed rule-based evals *under*report success and no single LLM judge
dominates; the Agentic Benchmark Checklist found flaws misestimating relative performance
by up to 100%; a Berkeley RDI audit (April 2026) found exploit paths in 13 widely used
benchmarks. **Single-benchmark optimization is not SOTA. Portfolio evaluation plus
evaluator auditing is.**

## The trace-native feedback loop

Production teams run: curated tasks + production traces + simulators → datasets → offline
evals → candidate harness → online shadow/canary (no committed side effects) → trace
mining → verifier/PRM refresh → back into datasets. The same evaluators run offline and
online; they improve continuously alongside the agent. This loop is the on-ramp to the
[training frontier](training-frontier.md).

## The minimum credible scorecard

Tracking task success alone ships regressions. Minimum set:

- **Task success + pass@k / pass^k** — pass^k (all k attempts succeed) is the reliability
  metric production actually needs.
- **Latency, cost, step count** — the harness dominates all three.
- **Tool efficiency** — useful calls per success; wasted-call ratio.
- **Side-effect correctness** — state-based verification (the row is in the DB), not
  agent self-report.
- **Safety-violation and approval-intervention rates** — both directions: never-fires may
  mean lax; always-fires means noise.
- **Exploit rate** — success via gaming the evaluator; requires hardened testbeds.
- **Trace-level quality** — looping, drift, instruction fade-out invisible per-turn.
- **Context growth / compaction effectiveness** — see
  [context engineering](context-engineering.md).

Related: [training frontier](training-frontier.md) · [failure modes](failure-modes.md) ·
[agent loop](agent-loop.md)
