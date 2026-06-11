---
title: Service Tiers
summary: The four Orbit service tiers (Tier-0 to Tier-3) and the reliability obligations of each.
tags: [tiers, classification, slo, criticality, orbit]
updated: 2026-05-01
confidence: established
---

# Service Tiers

Every Orbit service is assigned exactly one of four tiers at registration time. The tier drives its [resource quotas](resource-quotas.md), [autoscaling](autoscaling-policy.md) bounds, and [on-call](on-call-escalation.md) paging behaviour, so it must be set correctly.

**Tier-0** is reserved for critical request-path services with no graceful degradation; the canonical example is `orbit-gateway`, the edge ingress. Tier-0 carries a 99.95% monthly availability SLO and any outage is automatically a [SEV-1](incident-severity.md).

**Tier-1** covers core services that customers depend on but which tolerate brief degradation, such as `orbit-auth` and `orbit-billing`. The Tier-1 SLO is 99.9% monthly availability.

**Tier-2** is the default for standard internal-facing or non-critical customer services; its SLO is 99.5% monthly availability. Most services live here.

**Tier-3** is for batch jobs, internal tooling, and async workers with no live SLO; they are monitored but never page on-call outside business hours.

A service's tier label lives in its `orbit.yaml` manifest as `tier: 0|1|2|3` and is validated by the [CI/CD gates](cicd-gates.md). Promoting a service to a higher tier requires sign-off from the platform team because it changes quota and paging commitments. Tier downgrades are allowed without sign-off. See [resource quotas](resource-quotas.md) for the exact CPU and memory limits each tier receives.
