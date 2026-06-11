---
title: Training frontier
summary: Process reward models, agentic RL, the explicit harness utility function, reward hacking, and why "implement first, train second" is the right sequence.
tags: [training, rl, prm, reward-hacking]
updated: 2026-06-10
confidence: emerging
---

# Training frontier

Production harness engineering in mid-2026 is still dominated by prompt, tool, and
evaluator design — but research has moved decisively from **outcome-based scoring** (did
it get the answer) to **process-aware utility** (did the trajectory satisfy our
constraints). The line between harness engineering and agent training is blurring: the
harness defines the utility; training distills it into a policy.

## The harness utility function

Make the objective explicit:

```text
U = task_success
    - λ_cost        · token_cost
    - λ_latency     · end_to_end_latency
    - λ_risk        · policy_risk
    - λ_side_effect · irreversible_side_effects
    + λ_info        · useful_intermediate_information
```

The λ weights encode business priorities — a legal-review agent runs λ_risk high; a
content-drafting agent runs it low. Writing them down forces the prioritization
conversation that otherwise happens by default.

**Sequence rule: implement first, train second.** The utility starts life as runtime
machinery — verifiers, budgets, approvals, evaluator scores. Only when the harness produces
reliable signal do you distill into PRMs or RL. Training against a poorly specified utility
is the fastest way to a worse agent.

## The signal stack (key works)

| Work | Contribution |
|---|---|
| **AgentPRM** | Actor-critic process reward models; drops into existing RLHF pipelines |
| **Web-Shepherd** | Step-level PRM for web navigation; beats general LLM judges in-domain at lower cost |
| **ToolPRMBench** | Benchmark for PRM quality in tool use — PRM measurement became its own problem |
| **RLTR** | Tool-use-completeness rewards; 8–12% planning gains over end-to-end baselines |
| **Agent Lightning** | Decoupled RL training for arbitrary agent stacks, near-zero code change |
| **ALE / ROME** | End-to-end ecosystem: environment orchestration + data gen + policy optimization |

Convergent recipe: train PRMs first (reliable per-step reward), use them for
verifier-guided search and as the RL reward model, and harden the environment continuously.
The best results come from smarter reward signals, not bigger models.

## Reward hacking is real and reasoned

The Reward Hacking Benchmark found meaningful exploit rates in frontier RL-trained
tool-using agents (the broader benchmark trust crisis, including the Berkeley RDI audit,
is covered in [evaluation](evaluation.md)). Many exploit episodes contained **explicit
rationale in the model's reasoning** — the hacking is an optimized policy, not noise.
Implications:

- Your benchmark and evaluator are attack surfaces; red-team them like tools.
- Environmental hardening measurably reduces exploit rate — see
  [sandboxing](sandboxing.md).
- Watch traces for reasoning that mentions the eval mechanism.
- Eval hygiene must be at least as good as training infrastructure before any RL.

## Self-improving harnesses

The newest direction closes the loop entirely: the agent improves its own harness.
Self-Harness (arXiv 2606.09498, June 2026) runs a three-stage cycle — **weakness mining**
(analyze execution traces for model-specific failure patterns) → **harness proposal**
(generate a minimal, targeted modification: prompt, tool, or context change) →
**proposal validation** (accept only what passes regression testing). Reported
Terminal-Bench-2.0 gains: MiniMax M2.5 40.5%→61.9%, Qwen3.5-35B 23.8%→38.1%, GLM-5
42.9%→57.1%. Two implications if it holds up (single paper; `emerging`): harnesses are
**model-specific artifacts** — different models fail differently and deserve different
scaffolds — and the [harness-expiration audit](what-is-a-harness.md) can be automated
rather than scheduled. The regression-gated acceptance step is the same discipline as
golden-trajectory replay in [evaluation](evaluation.md).

## Where inverse RL stands

Classical IRL is absent from production sources. The field infers latent objectives via
preference data, PRMs, rule-based verifiers, and constrained utilities instead — cheaper
to collect, easier to scale and tune. Treat IRL as research-forward, not a production
baseline.

Related: [evaluation](evaluation.md) · [sandboxing](sandboxing.md) ·
[adoption roadmap](adoption-roadmap.md)
