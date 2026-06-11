---
title: Regulatory & compliance
summary: The harness as the primary compliance boundary; EU AI Act timeline, NIST RMF, OWASP agentic Top 10, and the artifact checklist.
tags: [regulation, compliance, governance]
updated: 2026-06-10
confidence: established
---

# Regulatory & compliance

**The harness is your primary compliance boundary.** A model cannot "be compliant" — it's
a stochastic component. Compliance lives in what surrounds it: audit logs, approval
records, policy artifacts, dataset lineage, sandbox boundaries, runbooks. When an auditor
says "show me," you point at harness components.

Design consequence: compliance requirements are architecture inputs, not late additions.
Append-only transcripts, separately persisted approval decisions, and evaluator-version
tracking are cheap on day one and brutal to retrofit after production traffic accumulates.

## EU AI Act timeline

The most consequential timeline for systems touching European users:

- **1 Aug 2024** — entered into force
- **2 Feb 2025** — prohibited practices + AI literacy obligations apply
- **2 Aug 2025** — governance rules + GPAI model obligations apply (technical
  documentation, copyright policy, training-content summaries; systemic-risk models add
  risk mitigation, incident reporting, cybersecurity)
- **2 Aug 2026** — Act broadly applicable
- **2027+** — extended transitions for high-risk product-embedded systems

Human oversight, incident logging, technical documentation, and action approval — the
operational obligations — are all implemented in the harness:
[permissions](permissions-and-safety.md) for approvals, append-only
[traces](context-engineering.md) for logging, [evaluation](evaluation.md) records for
documentation.

## Other frameworks worth knowing

- **NIST AI RMF 1.0 + Generative AI Profile** — risk-management vocabulary that maps
  cleanly onto harness design; plus a secure-development profile for GenAI.
- **OWASP LLM Top 10 (2025)** and **OWASP Top 10 for Agentic Applications (2026)** — the
  most practical public threat-model vocabulary for engineering teams; the agentic list
  covers excessive agency, tool misuse, and orchestration-level attacks.
- **Agent auth standardization** — IETF draft work (SPIFFE, OAuth Token Exchange, DPoP)
  for agent identity across services; emerging.

## The artifact checklist

What the harness must produce to demonstrate compliance:

- **Immutable trace logs** — every model call, tool call, retry, handoff, approval;
  append-only, long retention
- **Approval records & policy artifacts** — who approved what, when, on what basis
- **Dataset lineage** — which data fed which evaluator version, and eval-suite history
- **Sandbox & credential boundary documentation** — what the agent can reach, with which
  credentials, reviewed by whom
- **Benchmark audit trails** — what was measured, when, with what evaluator version
- **Operator runbooks** — incident response: who is paged, what they do
- **PII masking at ingestion** — sensitive data never enters the model's view; dashboard
  masking is too late

Related: [permissions & safety](permissions-and-safety.md) · [evaluation](evaluation.md) ·
[adoption roadmap](adoption-roadmap.md)
