---
title: Incident Severity Levels
summary: Definitions of SEV-1 through SEV-4, their response-time targets, and who is engaged.
tags: [incident, severity, sev, triage, orbit]
updated: 2026-05-01
confidence: established
---

# Incident Severity Levels

Every Orbit incident is assigned a severity at triage, which sets the response cadence and how far it escalates. When in doubt, declare the higher severity — it is cheap to downgrade and expensive to under-react.

**SEV-1** = customer-facing outage. A [Tier-0](service-tiers.md) service is down, or core functionality is unavailable to a majority of customers. SEV-1 pages the on-call **immediately**, opens a dedicated incident channel, and engages an incident commander. Any Tier-0 outage is automatically SEV-1.

**SEV-2** = major degradation, no full outage. Significant feature impairment or elevated errors affecting a subset of customers; a single Tier-1 service degraded. SEV-2 pages on-call and targets mitigation within 30 minutes.

**SEV-3** = minor or partially-degraded service with a viable workaround, or a Tier-2 issue. SEV-3 does **not** page outside business hours; it is worked the next business day and targets resolution within 3 business days.

**SEV-4** = cosmetic or low-impact issue with no customer effect — a logging gap, a flaky non-blocking test, a typo in a dashboard. SEV-4 is tracked as a normal backlog ticket.

A SEV-1 or SEV-2 always requires a written post-incident review within **5 business days**. Severity can be revised as understanding improves; record every change with a timestamp in the incident channel. Escalation timing per severity is detailed on the [on-call escalation](on-call-escalation.md) page.
