---
title: Idempotency
summary: How Meridian uses idempotency keys to make write requests safe to retry exactly once.
tags: [idempotency, retries, safety, keys]
updated: 2026-05-01
confidence: established
---

# Idempotency

Meridian supports **idempotency keys** so that retried write requests are processed at most once. This protects against duplicate documents when a network failure hides a successful response.

## Sending a key

Attach the header `Idempotency-Key: <your-uuid>` to any `POST` request. We recommend a random **UUIDv4** per logical operation. `GET`, `PATCH`, and `DELETE` are already idempotent by design and ignore the header.

## How replay works

The first request with a given key is executed normally and its full response is cached. Any subsequent request reusing the **same key with an identical body** returns the **cached response** rather than re-executing, and includes the header `Idempotency-Replayed: true`. Cached idempotency results are retained for **24 hours**, after which the key may be reused freely.

## Conflicts

If a key is reused with a **different request body**, Meridian rejects it with HTTP 409 and [error code 4292](error-codes.md) (`idempotency_key_reused`). This signals a client bug — the same key must always map to the same payload.

If a retry arrives while the original request is still in flight, the second call blocks briefly and then returns the original result; it never double-executes.

The [batch](core-endpoints.md) endpoint accepts one idempotency key for the whole batch. The [SDK Overview](sdk-overview.md) auto-generates an idempotency key for every write unless you pass your own, which is why SDK retries are always safe. See [Webhook Retries](webhook-retries.md) for how the same guarantee applies to redelivered events.
