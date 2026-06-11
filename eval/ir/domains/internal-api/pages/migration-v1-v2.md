---
title: Migration Guide (v1 to v2)
summary: Breaking changes between Meridian v1 and v2 and the steps to upgrade an integration.
tags: [migration, versioning, upgrade, breaking-changes, v1, v2]
updated: 2026-05-01
confidence: established
---

# Migration Guide (v1 to v2)

Meridian **v1 reaches end-of-life on 2026-12-31** (see [Versioning](versioning.md)). After that date, requests to `/v1` return [error code 4404](error-codes.md). Migrate before then.

## Breaking changes

1. **Pagination switched from offset to cursors.** v1 used `?offset=&limit=`; v2 uses opaque cursors as described in [Pagination](pagination.md). Replace offset loops with the `next_cursor` flow.
2. **Resource id prefixes.** v1 ids were bare integers; v2 ids are prefixed strings (`doc_`, `whk_`, `evt_`). Treat ids as opaque strings.
3. **Errors are now numeric codes.** v1 returned string error slugs only; v2 adds the four-digit `code` catalog in [Error Codes](error-codes.md). Switch your handlers to match on `code`.
4. **Idempotency keys are required for safe retries.** v1 had no idempotency support; in v2 attach an `Idempotency-Key` header per [Idempotency](idempotency.md).
5. **Search moved from `GET /v1/search` to `POST /v2/search`.**

## Upgrade steps

1. Upgrade the SDK to **`@meridian/sdk` 4.3.2**, which is v2-only (see [SDK Overview](sdk-overview.md)).
2. Change your base URL to `https://api.meridian.dev/v2` and set `Meridian-Version: 2026-04-15`.
3. Rewrite list calls to use cursor pagination and treat all ids as strings.
4. Re-register [webhooks](webhooks.md); v1 webhook secrets are not carried over and must be regenerated.

There is **no automatic data migration step** — your data is shared across versions; only the request/response contract changes.
