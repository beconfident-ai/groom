---
title: API Access
summary: Lumen REST API base URL, authentication with Server Keys, key rotation, and core endpoints.
tags: [api, rest, authentication, keys, endpoints]
updated: 2026-05-01
confidence: established
---

# API Access

The Lumen REST API lets you ingest events, query reports, and manage data programmatically. The base URL is **`https://api.lumen.io/v1`** and all requests must use HTTPS.

## Authentication

Server-side requests authenticate with a **Server Key** (prefix `lm_sk_`) passed as a Bearer token: `Authorization: Bearer lm_sk_...`. Server Keys are created in **Settings → API Keys** and must never be shipped in client code. Client-side event tracking uses the public Project Key (`lm_pk_`) instead, as shown in [Getting Started](getting-started.md).

## Key rotation

Rotating a key in **Settings → API Keys** generates a new secret and immediately invalidates the old one — there is no grace period, so update your services before rotating. A revoked key returns **ERR_INVALID_KEY**; see [Troubleshooting: Common Errors](troubleshooting-errors.md).

## Core endpoints

- `POST /v1/track` — ingest a single event.
- `POST /v1/batch` — ingest up to **500 events per request**, the recommended path for high volume.
- `GET /v1/insights/{id}/results` — fetch the computed results of a saved report.
- `DELETE /v1/persons/{id}` — delete one end user's data, used for GDPR requests in [Data Retention & Export](data-retention-and-export.md).

## Rate limits

The API is rate limited per workspace and per minute, with limits that scale by tier. Exceeding the limit returns a **429** with a `Retry-After` header. Exact per-tier limits are listed in [Service Limits & Quotas](service-limits.md). API access is available on **Starter and above**; the Free tier can ingest events but cannot call the query or delete endpoints.
