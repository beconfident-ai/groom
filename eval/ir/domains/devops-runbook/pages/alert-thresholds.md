---
title: Alert Thresholds
summary: The latency, error-rate, and saturation thresholds that trigger Orbit alerts and pages.
tags: [alerts, thresholds, latency, error-rate, monitoring, orbit]
updated: 2026-05-01
confidence: established
---

# Alert Thresholds

Orbit alerts are defined as Prometheus rules and routed through Alertmanager to [on-call](on-call-escalation.md). Two routing classes exist: **page** (wakes a human) and **ticket** (files a non-urgent issue). The thresholds below are the platform defaults for Tier-0 and Tier-1; Tier-2 uses the same shapes with a ticket route instead of a page.

**Latency** — page on-call when p99 latency exceeds 800 ms for 5 min. A softer warning ticket opens when p95 latency exceeds 400 ms for 15 min.

**Error rate** — page on-call when the 5xx error rate exceeds 2% of requests for 3 min. This is the single most common trigger and is also the gate that auto-reverts a canary [deploy](deploy-procedure.md).

**Saturation** — page when CPU utilisation stays above 90% for 10 min while the [autoscaler](autoscaling-policy.md) is already at the tier's max replicas, indicating the service cannot scale out further.

**Availability budget** — a ticket opens when a service burns more than 10% of its monthly error budget in a single hour (a fast burn). Two fast-burn windows back-to-back escalate to a page.

**Saturation of memory** — page on three OOM-kills of the same pod within 10 minutes; this usually means the pod is under-provisioned against its [resource quota](resource-quotas.md).

Every page maps to an [incident severity](incident-severity.md) at triage time. Silence an alert only with an Alertmanager silence that carries an owner and an expiry; permanent silences are forbidden.
