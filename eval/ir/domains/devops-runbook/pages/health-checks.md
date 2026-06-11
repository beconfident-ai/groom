---
title: Health Checks
summary: Orbit liveness and readiness probe endpoints, their semantics, and probe timing.
tags: [health, probes, liveness, readiness, healthz, readyz, orbit]
updated: 2026-05-01
confidence: established
---

# Health Checks

Every Orbit service must expose two HTTP probe endpoints, and the [CI/CD gates](cicd-gates.md) reject a manifest that does not wire both into its pod spec.

**`/healthz` is the liveness probe.** It must return `200 OK` whenever the process is running and not deadlocked. It must **not** check downstream dependencies — a liveness check that fails because a database is slow will get the pod killed and restarted in a loop, turning a dependency blip into a self-inflicted outage. Keep `/healthz` cheap and local.

**`/readyz` is the readiness probe.** It returns `200` only when the pod is ready to serve traffic, and it **may** check critical dependencies (database connection pool, cache, downstream auth). A pod failing `/readyz` is pulled from the Service load-balancer but is **not** restarted, so it can recover and rejoin. This is also why a pod failing `/readyz` never receives canary traffic during a [deploy](deploy-procedure.md).

Standard probe timing across the fleet: liveness probes run every **10 seconds** with a **3-failure threshold** before a restart, and readiness probes run every **5 seconds**. Both carry an `initialDelaySeconds` of 15 to allow the app to warm up.

A pod stuck in `CrashLoopBackOff` is almost always a failing liveness probe or a missing [secret](secrets-management.md) at startup; check `orbitctl logs <service> --previous` first. Probe flapping that pulls replicas below the tier minimum should fire a [saturation alert](alert-thresholds.md).
