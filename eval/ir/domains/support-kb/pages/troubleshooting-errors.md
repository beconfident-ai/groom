---
title: Troubleshooting Common Errors
summary: Diagnose missing events, auth failures, and common Lumen error codes with fixes.
tags: [troubleshooting, errors, debugging, error-codes]
updated: 2026-05-01
confidence: established
---

# Troubleshooting Common Errors

Lumen surfaces errors as a code on the `error` field of an API response and in the **Live Events** debugger. Diagnose by code first.

## ERR_INVALID_KEY

The message **"ERR_INVALID_KEY: the provided key is not recognized"** means the SDK was initialized with a key that does not exist or was revoked. Confirm you copied the full key from **Settings → Projects** and that a client uses a Project Key (`lm_pk_`) while a server uses a Server Key (`lm_sk_`). Rotating a key in [API Access](api-access.md) immediately invalidates the old one.

## ERR_QUOTA_EXCEEDED

**"ERR_QUOTA_EXCEEDED"** is returned when a hard usage cap is set and the monthly event quota is reached. Events are rejected, not queued. Raise or remove the cap in **Settings → Usage**, or upgrade your tier in [Plans & Limits](plans-and-limits.md).

## Events not appearing

If `track()` calls succeed but nothing shows up: events stream to **Live Events** within about 30 seconds, so wait two minutes first. Then check that the event is not being dropped by an **ad blocker** — route through a [reverse proxy](integrations.md) if so. Events with a timestamp older than the retention window are silently dropped; see [Data Retention & Export](data-retention-and-export.md).

## ERR_RATE_LIMITED

A **429** with **"ERR_RATE_LIMITED"** means you exceeded your per-minute API rate limit. The response includes a `Retry-After` header in seconds. Batch events with the `/v1/batch` endpoint to stay under the limit; see [Service Limits & Quotas](service-limits.md).
