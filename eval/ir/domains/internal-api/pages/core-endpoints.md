---
title: Core Endpoints
summary: The primary Meridian REST resources, their paths, verbs, and request conventions.
tags: [endpoints, rest, resources, api]
updated: 2026-05-01
confidence: established
---

# Core Endpoints

All paths are relative to the base URL `https://api.meridian.dev/v2`. Request and response bodies are JSON; send `Content-Type: application/json`. Authentication is covered in [Authentication & API Keys](authentication.md).

## Documents

Documents are the central resource. The collection lives at **`/v2/documents`**.

- `POST /v2/documents` — create a document. Returns HTTP 201 with the new `id` (prefix `doc_`).
- `GET /v2/documents/{id}` — retrieve a single document.
- `GET /v2/documents` — list documents; supports cursor [pagination](pagination.md).
- `PATCH /v2/documents/{id}` — partial update.
- `DELETE /v2/documents/{id}` — soft-delete; returns HTTP 204.

## Collections

Documents are grouped into collections at **`/v2/collections`**. To list the documents inside one, call `GET /v2/collections/{id}/documents`.

## Search

Full-text search is a `POST /v2/search` call (not GET) because queries can be large. The request body takes a `query` string and an optional `filters` object. Search responses are capped at **200 results** regardless of requested page size and are also cursor-paginated.

## Batch

Up to **50 operations** may be submitted in one `POST /v2/batch` request. The batch endpoint is atomic: if any operation fails, the whole batch is rolled back and returns [error code 4221](error-codes.md). Each individual write should still carry its own idempotency key per [Idempotency](idempotency.md).

Every mutating call counts against your per-minute ceiling in [Rate Limits & Quotas](rate-limits.md). For programmatic access, prefer the typed wrappers in [SDK Methods](sdk-methods.md).
