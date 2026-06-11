---
title: CI/CD Gates
summary: The mandatory pipeline checks a build must pass before it can deploy to Orbit production.
tags: [cicd, pipeline, gates, coverage, approvals, ci, orbit]
updated: 2026-05-01
confidence: established
---

# CI/CD Gates

A build cannot reach the [deploy procedure](deploy-procedure.md) until it passes every CI/CD gate. The gates run in the pipeline on every commit and are enforced again at admission, so a green pipeline is necessary but the cluster re-checks before accepting the rollout.

The mandatory gates are:

1. **Tests and coverage** — the full unit and integration suite must pass, and line coverage must be **at least 80%**. A drop below 80% fails the build outright.
2. **Security scan** — the container image is scanned, and **any critical or high CVE blocks the build**. Medium and low CVEs file a ticket but do not block.
3. **Secret scan** — the diff is scanned for credentials; any hit fails the build (see [secrets management](secrets-management.md)).
4. **Manifest validation** — `orbit.yaml` must declare a valid [tier](service-tiers.md), CPU and memory `requests` and `limits` (see [resource quotas](resource-quotas.md)), and both [health check](health-checks.md) probes.
5. **Image policy** — the image must be tagged with the immutable commit SHA; `latest` is rejected.

Promotion to `orbit-prod` additionally requires **two human approvals** from the service's owning team — one author-distinct reviewer is not enough. Staging requires one approval; dev requires none.

A break-glass override exists for SEV-1 hotfixes: an engineering manager can bypass the two-approval gate (but never the security or secret scans) with `orbitctl deploy --break-glass`, which posts an audit record to the incident channel. See [on-call escalation](on-call-escalation.md) for who may invoke it.
