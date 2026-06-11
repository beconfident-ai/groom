---
title: The agent loop
summary: The universal control-flow skeleton shared by all production agents, and where the harness inserts gates, sandboxes, and evaluators.
tags: [fundamentals, architecture, runtime]
updated: 2026-06-10
confidence: established
---

# The agent loop

Every production agent — Claude Code, Codex, Devin, Cursor Composer, Bedrock Agents — is a
variant of one skeleton. Differences are in where the harness inserts itself, not in shape.

```python
def run_agent_harness(task, model, tools, state_store, sandbox, guardrails, evals, budget):
    state = state_store.load_or_create(task.id)
    trace = []
    for step in range(budget.max_steps):
        obs = guardrails.ingress(state.build_observation())          # 0. mask/classify input
        proposal = model.plan(obs, tools.schemas(), state.working_memory())   # 1. reason
        decision = Decision(proposal, risk=guardrails.score_risk(proposal))
        if decision.risk > THRESHOLD:                                 # 2. gate
            approval = guardrails.route_for_approval(decision, state)
            if not approval.approved:
                state.record_block(decision, approval.reason)         # denial -> context
                continue
        result = sandbox.execute(lambda: tools.invoke(decision))      # 3. isolate side effects
        trace.append((step, decision, result))                        # 4. record
        state.update(decision, result)
        if evals.online(trace, state)["terminate"] or state.goal_reached():
            break
    return guardrails.egress(state.finalize()), trace                 # 5. sanitize output
```

Note the constructor: model, tools, state store, sandbox, guardrails, evals, and budget are
**separate first-class subsystems**, each with its own tests and failure modes. The loop is
small; the subsystems are large.

## What each arrow hides

- **Ingress guardrails** run before the model sees anything — PII masking, content
  classification, provenance tagging. Sensitive data should never enter the model's view;
  masking at the dashboard layer is too late.
- **Risk scoring** happens on every proposal, via rules, a fast classifier, or a
  chain-of-thought safety model. The score routes the action: auto-allow, ask, or deny.
- **Denial as routing signal**: a denied action is fed back as text. The model reads the
  reason and re-plans within bounds — denial is steering, not failure.
- **Sandboxed execution**: side-effectful tools never run in the agent's process. See
  [sandboxing](sandboxing.md).
- **The trace is separate from operating state.** Append-only, mined later for evaluation,
  debugging, and policy updates. See [evaluation](evaluation.md).
- **Online evaluators** can terminate the loop: progress stalls, loop detection, cost caps,
  known dead-end patterns.

## Stop conditions

Production loops stop on: no tool call in the response (natural completion), max
steps/tokens/wall-clock exceeded, prompt-too-long (triggers compaction-and-retry before
termination), an evaluator or hook signaling stop, or an external abort. Each maps to a
distinct recovery strategy; conflating them produces silent failures.

## Implementation notes from production systems

- Claude Code executes tools **as they stream** from the model (latency win), with sibling
  abort controllers that kill parallel subprocesses if any Bash tool errors.
- Its loop replaces state wholesale at ~7 "continue points" rather than mutating fields —
  simpler reasoning about state across iterations.
- One `queryLoop` serves CLI, headless, IDE, and SDK; only the I/O wrapper varies.
  (arXiv 2604.14228, "Dive into Claude Code", 2026.)

## The non-negotiable rule

**The model must not own permissions, side effects, or measurement.** Letting the model
self-approve, self-execute, or self-grade conflates proposer and auditor — self-evaluation
bias, prompt-injection corruption, and plain bad systems design. Every published production
architecture (Anthropic, OpenAI, LangGraph) separates these. Home-grown stacks that skip
the separation prototype fine and then become undebuggable at scale.

Related: [what is a harness](what-is-a-harness.md) · [permissions & safety](permissions-and-safety.md) ·
[context engineering](context-engineering.md)
