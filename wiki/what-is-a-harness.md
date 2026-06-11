---
title: What is a harness
summary: Definition and scope of harness engineering; the control-plane thesis; why the harness, not the model, is the production differentiator.
tags: [fundamentals, definition, strategy]
updated: 2026-06-10
confidence: established
---

# What is a harness

The **harness** is everything in an agentic system except the model: the loop, tools,
context manager, permission system, memory, sub-agent orchestrator, hooks, sandboxes,
and observability. Working definition:

> Harness engineering is the design and operation of the control, execution, safety,
> evaluation, and training infrastructure that turns one or more models into a dependable
> agentic system.

It is broader than prompt engineering (prompts are one input to one call; the harness
governs every call across a task) and narrower than AI platform engineering (it excludes
base-model pretraining, generic MLOps, and application UX, though all three constrain it).

The term is descriptive, not standardized. Anthropic says "agent harness" for long-running
agents; LangGraph layers "Deep Agents" on its runtime; OpenAI's Agents SDK defines the agent
as instructions + tools + handoffs + guardrails + runtime behavior — the harness in all but
name. Translate across vendor vocabularies.

## The control-plane thesis

Between 2023 and 2026 frontier models converged in capability. For most enterprise tasks,
model selection stopped determining the winner; the differentiator moved into how the model
is called, gated, observed, and measured. The strongest systems are best described as
**model + control plane + environment + evaluator**.

Two numbers anchor the thesis:

- ~**1.6%** of Claude Code's codebase is AI decision logic; **98.4%** is operational
  infrastructure (community source analysis of Claude Code, 2026).
- ~**88%** of agent projects never reach production, a rate that barely improved as models
  got better (directional industry figure; vendor field reports and Gartner notes, 2025–26).
  The bottleneck is harness maturity, not model capability.

## The operating-system mental model

The most useful frame: the harness is an OS; the model is a process running inside it.
The OS decides what memory the process can read (context), which syscalls exist (tools),
which calls succeed (permissions), where execution happens (sandbox), and what the process
is told about the world (observations). The process does not get to override these.

Consequence — the central architectural rule of the field: **the model proposes; the
harness disposes**. The model never directly owns permissions, side effects, or measurement.
A design that lets the model decide its own permissions has given it root. Anthropic,
OpenAI, and LangGraph all converge on this; see [the agent loop](agent-loop.md).

## Three things to internalize

1. **Context is the scarce resource, not compute.** Windows grew to 1M tokens but usable
   recall did not keep pace — see context rot in [context engineering](context-engineering.md).
2. **The loop is trivial; the subsystems are everything.** `while true: call → parse →
   execute → update` is five lines; reliability lives in how each arrow is implemented.
3. **Harness components have expiration dates.** Every scaffold encodes "the model can't do
   X yet." As models improve, scaffolds become liabilities — token cost, latency, masked
   bugs. Label each workaround with the limitation it addresses; audit and remove regularly.
   Early work automates this audit — see self-improving harnesses in the
   [training frontier](training-frontier.md).

## Böckeler's two-axis lens for harness controls

Every individual control falls on two axes: direction (guide before action vs sense after)
and mechanism (deterministic computation vs LLM inference):

| | Computational | Inferential |
|---|---|---|
| **Guides** (feedforward) | AGENTS.md, schemas, allowlists, sandbox config, lint rules | skills, few-shot examples, agentic memory, RAG over conventions |
| **Sensors** (feedback) | tests, type checkers, linters, fitness functions, SLOs | LLM-as-judge, review subagents, self-critique |

Mature harnesses operate in all four quadrants. Feedback-only agents repeat mistakes;
feedforward-only agents never learn whether the rules worked; computational-only systems
miss semantic problems; inferential-only systems are slow, costly, and drift-prone.
(Birgitta Böckeler, "Harness Engineering for Coding Agent Users", martinfowler.com, 2026.)

Related: [agent loop](agent-loop.md) · [adoption roadmap](adoption-roadmap.md) ·
[failure modes](failure-modes.md)
