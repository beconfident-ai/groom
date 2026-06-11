---
title: On-Call Escalation
summary: The PagerDuty rotation, acknowledgement windows, and the Orbit escalation chain.
tags: [on-call, escalation, pagerduty, paging, rotation, orbit]
updated: 2026-05-01
confidence: established
---

# On-Call Escalation

Orbit on-call runs on PagerDuty as a weekly rotation handing over **Monday at 10:00 UTC**. There is always a primary and a secondary on-call engineer.

When an [alert](alert-thresholds.md) pages, the primary must **acknowledge within 5 minutes**. If the page is not acknowledged, PagerDuty escalates to the secondary on-call after **10 minutes**. If still unacknowledged, it escalates to the engineering manager after **20 minutes**. A [SEV-1](incident-severity.md) additionally notifies the platform team and the incident-commander rotation in parallel from the moment it is declared, without waiting on the timers.

The primary owns triage: assign a severity, start an incident channel for SEV-1/SEV-2, and either mitigate (often a [rollback](rollback-procedure.md)) or pull in the service owner. Each Orbit service records its owning team in `orbit.yaml` under `owner:`; the on-call engineer is not expected to debug another team's service alone and should page that owner for anything beyond a standard mitigation.

Handover at rotation change requires a written summary of any open incidents and active Alertmanager silences. The outgoing primary stays reachable for **2 hours** after handover for context.

On-call is compensated and capped: no engineer may be primary for more than **one week in any four**. If a page fires during the [deploy](deploy-procedure.md) freeze window, treat it as production-impacting and follow the same chain. Escalation policy changes are owned by the platform team.
