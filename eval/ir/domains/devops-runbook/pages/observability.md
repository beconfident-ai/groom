---
title: Observability and SLOs
summary: Orbit's metrics, logging, and tracing stack plus the error-budget model behind paging.
tags: [observability, metrics, logging, tracing, slo, error-budget, orbit]
updated: 2026-05-01
confidence: established
---

# Observability and SLOs

Orbit's observability rests on three pillars, all standardised across the fleet.

**Metrics** are scraped by Prometheus every **15 seconds** from each pod's `/metrics` endpoint and retained for **15 months**. The RED method is mandatory: every service exports Rate, Errors, and Duration, which is exactly what the [alert thresholds](alert-thresholds.md) evaluate.

**Logs** are structured JSON shipped to Loki; **plaintext logs are rejected by the ingestion pipeline.** Every log line must carry a `trace_id` and `service` field. Logs are retained for **30 days** in hot storage, then archived to object storage for **1 year**. Never log a secret or PII — a violation is at least a [SEV-3](incident-severity.md).

**Traces** use OpenTelemetry with **head-based sampling at 10%** of requests; any request that errors is sampled at 100% so failures are never lost.

The reliability model is an **error budget**: an SLO of 99.9% monthly availability permits roughly **43 minutes of downtime per month**. When a [tier's](service-tiers.md) budget is exhausted, that service enters a **feature freeze** — only reliability work and [rollbacks](rollback-procedure.md) ship until the budget recovers the following month. Budget burn rate is what distinguishes a fast-burn page from a slow-burn ticket on the [alerts](alert-thresholds.md) page.

The canonical operator dashboard is `orbit-overview` in Grafana, which fronts every tier's RED metrics and current budget.
