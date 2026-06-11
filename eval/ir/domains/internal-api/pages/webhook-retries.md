---
title: Webhook Retries & Signatures
summary: The webhook retry backoff schedule, failure handling, and HMAC signature verification.
tags: [webhooks, retries, signatures, hmac, backoff]
updated: 2026-05-01
confidence: established
---

# Webhook Retries & Signatures

When a [webhook](webhooks.md) delivery fails (non-2xx response or a timeout past the 5-second limit), Meridian retries on a fixed exponential schedule.

## Retry schedule

A failed delivery is retried up to **8 times** with exponential backoff: the delays are **1 minute, 5 minutes, 30 minutes, 1 hour, 2 hours, 4 hours, 8 hours, and 24 hours**. If all 8 retries fail, the event is dropped and the endpoint is **automatically disabled** after **20 consecutive failures** across deliveries. Re-enable it with `POST /v2/webhooks/{id}/enable`.

## Signature verification

Every delivery includes a `Meridian-Signature` header. It is an **HMAC-SHA256** of the literal string `{timestamp}.{raw_body}`, keyed with your `whsec_` signing secret and hex-encoded. The header format is `t=<timestamp>,v1=<signature>`.

To verify: recompute the HMAC and compare in constant time. Reject the delivery if signatures differ, or if the `timestamp` is more than **5 minutes** old — this window blocks replay attacks. A mismatched signature should be treated as untrusted and never processed.

## Ordering and duplicates

Retries mean the same `evt_` id can arrive more than once and out of order. Always dedupe on the event `id` and make handlers idempotent, exactly as described in [Idempotency](idempotency.md). The retry timestamp advances each attempt, so the signature is recomputed for every retry and remains valid. See [Webhooks](webhooks.md) for the delivery payload shape.
