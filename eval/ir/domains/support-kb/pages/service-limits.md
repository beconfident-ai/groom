---
title: Service Limits & Quotas
summary: API rate limits, batch sizes, property and event-name limits, and ingestion caps in Lumen.
tags: [limits, quotas, rate-limits, api, ingestion]
updated: 2026-05-01
confidence: established
---

# Service Limits & Quotas

This page lists the hard technical limits that apply regardless of plan, plus the rate limits that scale by tier. For monthly event and storage quotas see [Plans & Limits](plans-and-limits.md).

## API rate limits by tier

Rate limits are enforced per workspace, per minute:

- **Starter — 60 requests per minute.**
- **Team — 300 requests per minute.**
- **Business — 1,200 requests per minute.**
- **Enterprise — custom, negotiated in your contract.**

Exceeding the limit returns a **429 ERR_RATE_LIMITED** with a `Retry-After` header. The `/v1/batch` endpoint counts as a single request regardless of how many events it carries.

## Per-payload limits

- A batch request accepts at most **500 events**.
- A single event payload may not exceed **32 KB**.
- An event may carry at most **250 properties**.
- An event name and any property key are limited to **255 characters**.
- A property value string is truncated at **8,192 characters**.

## Identity and cardinality

A single workspace can track up to **10 million distinct users** on Team, and unlimited on Business and Enterprise. A breakdown in the [Insight Builder](features-dashboards.md) returns at most the **top 1,000 values** of a property; higher-cardinality breakdowns are grouped into an "Other" bucket.

## Ingestion behaviour

Events with a timestamp more than **5 days in the past or 1 hour in the future** are rejected at ingestion. Backfilling older data requires the historical import endpoint, available on Business and above.
