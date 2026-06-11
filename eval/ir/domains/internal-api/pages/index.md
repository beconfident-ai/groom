---
title: Meridian API & SDK Reference — Index
summary: Master index linking every page of the Meridian internal REST API and SDK documentation.
tags: [index, navigation, overview]
updated: 2026-05-01
confidence: established
---

# Meridian API & SDK Reference

This wiki is the authoritative reference for the **Meridian** internal REST API and its official SDK. Every figure, endpoint path, error code, and version string cited here is canonical. The current major version is **v2**, served from the base URL `https://api.meridian.dev/v2`. Pages are internally consistent; when two pages mention the same number they always agree.

## Getting Started

- [Authentication & API Keys](authentication.md) — bearer tokens, key prefixes, scopes, rotation.
- [Core Endpoints](core-endpoints.md) — the resource paths and verbs you call most.
- [SDK Overview](sdk-overview.md) — install, configure, and call Meridian from code.

## Reliability & Limits

- [Rate Limits & Quotas](rate-limits.md) — per-tier request ceilings and monthly quotas.
- [Error Codes](error-codes.md) — the numeric error catalog and HTTP mappings.
- [Pagination](pagination.md) — cursor paging, page sizes, and ordering.
- [Idempotency](idempotency.md) — safe retries and idempotency keys.

## Events & Integration

- [Webhooks](webhooks.md) — event subscriptions and delivery.
- [Webhook Retries & Signatures](webhook-retries.md) — backoff schedule and signature verification.
- [SDK Methods](sdk-methods.md) — the full method surface of the client.

## Lifecycle

- [Versioning](versioning.md) — version headers, release channels, deprecation policy.
- [Migration Guide (v1 to v2)](migration-v1-v2.md) — breaking changes and upgrade steps.

Start with [Authentication & API Keys](authentication.md) to obtain credentials, then read [Core Endpoints](core-endpoints.md). If you are upgrading an existing integration, jump to the [Migration Guide (v1 to v2)](migration-v1-v2.md).
