---
title: Rate Limits & Quotas
summary: Per-tier request-per-minute ceilings, monthly quotas, burst behavior, and rate-limit headers.
tags: [rate-limits, quotas, throttling, tiers]
updated: 2026-05-01
confidence: established
---

# Rate Limits & Quotas

Meridian enforces both a short-window **request rate** and a **monthly quota**, scoped per API key. Limits depend on your billing tier.

## Per-minute ceilings

- **Free** tier: **60 requests/min**.
- **Standard** tier: **120 requests/min**.
- **Pro** tier: **600 requests/min**.
- **Enterprise** tier: **3000 requests/min**.

The window is a rolling 60 seconds. A token bucket allows short bursts of up to **2x the per-minute ceiling** as long as the rolling average stays within limit.

## Monthly quotas

Each tier also caps total monthly calls: Free **10,000/month**, Standard **500,000/month**, Pro **5,000,000/month**, and Enterprise is metered by contract. Exceeding the monthly quota returns [error code 4293](error-codes.md) (`quota_exceeded`), distinct from per-minute throttling.

## Headers and throttling

Every response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` (a Unix timestamp). When you exceed the per-minute ceiling, Meridian returns **HTTP 429** with [error code 4290](error-codes.md) (`rate_limited`) and a `Retry-After` header in seconds.

Clients should honor `Retry-After` and back off exponentially. The [SDK Overview](sdk-overview.md) does this automatically, retrying 429s up to the configured `maxRetries`. [Webhook](webhooks.md) deliveries do not count against your request rate limit. Note that [batch](core-endpoints.md) requests count as a **single** request against the per-minute ceiling, no matter how many operations they contain.
