---
title: Error Codes
summary: The Meridian numeric error catalog, error envelope shape, and HTTP status mappings.
tags: [errors, error-codes, status, troubleshooting]
updated: 2026-05-01
confidence: established
---

# Error Codes

Meridian returns errors as a JSON envelope: `{ "error": { "code": 4015, "type": "invalid_api_key", "message": "..." } }`. The numeric `code` is stable and machine-readable; the `type` string mirrors it. Codes are **four digits**, where the leading two digits track the HTTP status family (40xx → 4xx client errors, 50xx → 5xx server errors).

## Authentication & authorization

- **4015** `invalid_api_key` — missing or malformed key (HTTP 401). See [Authentication](authentication.md).
- **4031** `insufficient_scope` — key lacks the required scope (HTTP 403).

## Request validation

- **4220** `validation_failed` — a field failed validation (HTTP 422).
- **4221** `batch_rolled_back` — one operation in a [batch](core-endpoints.md) failed (HTTP 422).
- **4404** `resource_not_found` — unknown id (HTTP 404).

## Idempotency & concurrency

- **4292** `idempotency_key_reused` — an idempotency key was reused with a **different** request body (HTTP 409). See [Idempotency](idempotency.md).
- **4091** `version_conflict` — optimistic-lock failure on `PATCH` (HTTP 409).

## Rate & quota

- **4290** `rate_limited` — per-minute ceiling exceeded (HTTP 429).
- **4293** `quota_exceeded` — monthly quota exhausted (HTTP 429). See [Rate Limits & Quotas](rate-limits.md).

## Server

- **5001** `internal_error` — unexpected server fault (HTTP 500); safe to retry.
- **5003** `service_unavailable` — temporary outage (HTTP 503); honor `Retry-After`.

Every error envelope also carries a `request_id` field; include it when contacting support. The [SDK Methods](sdk-methods.md) page documents how these surface as typed exceptions.
