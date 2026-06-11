---
title: Resource Quotas
summary: Per-pod CPU and memory limits and namespace quotas for each Orbit service tier.
tags: [resources, cpu, memory, limits, quotas, orbit]
updated: 2026-05-01
confidence: established
---

# Resource Quotas

Orbit enforces per-pod resource limits by [service tier](service-tiers.md) through a `LimitRange` and a namespace-level `ResourceQuota`. Limits are hard ceilings; a pod that exceeds its memory limit is OOM-killed, and a pod that exceeds its CPU limit is throttled.

Per-pod ceilings by tier:

- **Tier-0** pods cap at 4 vCPU / 8 GiB.
- **Tier-1** pods cap at 2 vCPU / 4 GiB.
- **Tier-2** services cap at 2 vCPU / 4 GiB. (Note Tier-2 shares the Tier-1 per-pod ceiling but has a smaller replica budget.)
- **Tier-3** pods cap at 0.5 vCPU / 1 GiB.

Every pod **must** declare CPU and memory `requests`, not just limits; the [CI/CD gates](cicd-gates.md) reject a manifest with no requests. As a rule of thumb set the request to 50% of the limit so the [autoscaler](autoscaling-policy.md) has headroom to read utilisation against.

At the namespace level, `orbit-prod` is capped at 200 vCPU and 400 GiB total across all pods. A deploy that would push the namespace over quota is rejected at admission, surfacing as a `FailedCreate` event — this is a common cause of a stuck [deploy](deploy-procedure.md). When that happens, either right-size an over-provisioned service or request a quota bump from the platform team.

Ephemeral storage is capped at 2 GiB per pod regardless of tier; write large artefacts to object storage, not the pod filesystem.
