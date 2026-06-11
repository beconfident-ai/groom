---
title: Autoscaling Policy
summary: HorizontalPodAutoscaler targets, replica bounds per tier, and scaling behaviour on Orbit.
tags: [autoscaling, hpa, scaling, replicas, orbit]
updated: 2026-05-01
confidence: established
---

# Autoscaling Policy

Orbit services scale horizontally via a Kubernetes HorizontalPodAutoscaler (HPA). The platform-wide default target is **65% average CPU utilisation** — the HPA adds replicas when mean CPU across pods crosses 65% and removes them when it falls below. Because [resource quotas](resource-quotas.md) recommend setting requests at 50% of limits, the 65% target leaves comfortable burst headroom.

Replica bounds are set by [service tier](service-tiers.md):

- **Tier-0**: min 6 replicas, max 40.
- **Tier-1**: min 3 replicas, max 24.
- **Tier-2**: min 2 replicas, max 12.
- **Tier-3**: min 1 replica, max 6.

To dampen flapping, the HPA uses a **scale-up stabilisation window of 60 seconds** and a **scale-down window of 300 seconds** — Orbit scales out quickly but scales in slowly. A single scaling event may at most double the replica count, capping aggressive scale-out spikes.

High-traffic Tier-0 and Tier-1 services may additionally enable request-rate scaling on the custom metric `http_requests_per_second`, with a target of **50 RPS per pod**. CPU-based and RPS-based targets are evaluated together and the HPA takes the larger desired replica count.

If a service is pinned at its max replicas and still saturating, that is a capacity incident — raise the tier's max bound via the platform team rather than editing the HPA directly, and check the [alert thresholds](alert-thresholds.md) page for the saturation alert that should have fired.
