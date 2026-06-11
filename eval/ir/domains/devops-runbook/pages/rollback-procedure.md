---
title: Rollback Procedure
summary: How to revert a bad Orbit release, revision retention, and rollback timing guarantees.
tags: [rollback, revert, revision, recovery, orbit]
updated: 2026-05-01
confidence: established
---

# Rollback Procedure

When a release misbehaves, rolling back is always preferred over rolling forward with a fix. Orbit retains the **last 10 revisions** of every service, so any of the previous ten deploys can be restored immediately.

To roll back to the immediately previous revision:

```
orbitctl rollback <service> --env prod
```

To target a specific older revision, pass `--to-revision <n>`; list available revisions with `orbitctl history <service> --env prod`. A rollback **completes in under 90 seconds** because the previous ReplicaSet is kept warm and scaled to zero rather than deleted — there is no image pull or rebuild on the rollback path.

The [deploy procedure](deploy-procedure.md) auto-reverts on its own when a canary breaches an [alert threshold](alert-thresholds.md) during a bake window; that automatic revert uses this exact mechanism, so a manual rollback afterwards is rarely needed.

Rollback is a data-unaware operation: it reverts the application image and config only, **never database schema**. If a release shipped a non-backward-compatible migration, a plain rollback will break — which is why Orbit mandates that all migrations be backward-compatible for at least one release (expand-then-contract). A failed rollback caused by a schema mismatch is a [SEV-1](incident-severity.md); page the service owner via [on-call escalation](on-call-escalation.md).

Always confirm recovery against the service's [health checks](health-checks.md) before closing the incident.
