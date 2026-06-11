---
title: Orbit Platform SRE Runbook — Index
summary: Master index to the Orbit Kubernetes platform deployment and on-call operations runbook.
tags: [index, navigation, overview, orbit, sre]
updated: 2026-05-01
confidence: established
---

# Orbit Platform SRE Runbook

This wiki is the authoritative operations runbook for **Orbit**, our internal application platform running on Kubernetes. Every figure, threshold, and command here is canonical for the Orbit fleet and is internally consistent across pages. Orbit runs three environments — `orbit-dev`, `orbit-staging`, and `orbit-prod` — and all services are classified into one of four service tiers that determine their quotas, scaling, and paging behaviour.

## Deploying

- [Deploy Procedure](deploy-procedure.md) — the `orbitctl` canary rollout flow.
- [CI/CD Gates](cicd-gates.md) — checks a build must pass before prod.
- [Rollback Procedure](rollback-procedure.md) — reverting a bad release.
- [Health Checks](health-checks.md) — liveness and readiness probes.

## Capacity and Scaling

- [Service Tiers](service-tiers.md) — the four tiers and what they mean.
- [Resource Quotas](resource-quotas.md) — CPU and memory limits per tier.
- [Autoscaling Policy](autoscaling-policy.md) — HPA triggers and replica bounds.

## On-Call and Incidents

- [Alert Thresholds](alert-thresholds.md) — when monitoring fires.
- [Incident Severity Levels](incident-severity.md) — SEV-1 through SEV-4.
- [On-Call Escalation](on-call-escalation.md) — the paging and escalation chain.
- [Observability and SLOs](observability.md) — metrics, logs, traces, error budgets.

## Platform Operations

- [Secrets Management](secrets-management.md) — Vault paths and rotation.

Start with [Service Tiers](service-tiers.md) if you are new; it underpins almost every other page.
