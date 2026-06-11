---
title: Deploy Procedure
summary: The orbitctl canary deployment flow for promoting a build to production.
tags: [deploy, orbitctl, canary, release, rollout, orbit]
updated: 2026-05-01
confidence: established
---

# Deploy Procedure

All Orbit deploys go through the `orbitctl` CLI; direct `kubectl apply` against `orbit-prod` is blocked by admission policy. A production deploy is always a canary rollout.

Run the deploy with the immutable image tag (the Git commit SHA, never `latest`):

```
orbitctl deploy <service> --env prod --tag <sha>
```

This triggers a three-stage canary: **10% → 50% → 100%** of traffic. Orbit holds at each stage for a **10-minute bake period**, watching the canary's error rate and p99 latency against the [alert thresholds](alert-thresholds.md). If the canary breaches a threshold during any bake window, the rollout halts and auto-reverts — see the [rollback procedure](rollback-procedure.md).

Before the canary can begin, the build must have passed every one of the [CI/CD gates](cicd-gates.md), and the new pods must pass their [health checks](health-checks.md) — a pod that fails `/readyz` never receives canary traffic.

Deploys to `orbit-prod` are frozen during the weekly change freeze, **Friday 17:00 UTC through Monday 09:00 UTC**, except for SEV-1 hotfixes which may be shipped with EM approval (see [on-call escalation](on-call-escalation.md)).

To watch a rollout live, use `orbitctl status <service> --env prod --watch`. To deliberately pause a healthy rollout at its current stage, use `orbitctl deploy <service> --hold`; resume with `--resume`. The full canary, if unattended, completes in roughly 30 minutes given the three bake windows.
