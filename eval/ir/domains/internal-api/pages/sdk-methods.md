---
title: SDK Methods
summary: The full method surface of the Meridian SDK client, grouped by resource.
tags: [sdk, methods, client, api, reference]
updated: 2026-05-01
confidence: established
---

# SDK Methods

The `MeridianClient` (see [SDK Overview](sdk-overview.md)) groups methods under resource namespaces that mirror the [core endpoints](core-endpoints.md). All methods are async and return typed objects.

## Documents

- `client.documents.create(body)` → `POST /v2/documents`.
- `client.documents.retrieve(id)` → `GET /v2/documents/{id}`.
- `client.documents.update(id, body)` → `PATCH /v2/documents/{id}`.
- `client.documents.delete(id)` → `DELETE /v2/documents/{id}`.
- `client.documents.list(params)` → returns an **auto-paginating async iterator**; iterate with `for await (const doc of client.documents.list())` and the SDK fetches each page using the cursors from [Pagination](pagination.md).

## Collections & search

- `client.collections.create(body)` and `client.collections.listDocuments(id)`.
- `client.search.query(text, filters)` → `POST /v2/search`.

## Batch & webhooks

- `client.batch.submit(operations)` → `POST /v2/batch`, max 50 operations.
- `client.webhooks.create({ url, events })` and `client.webhooks.verifySignature(payload, header, secret)`, which implements the HMAC check from [Webhook Retries & Signatures](webhook-retries.md).

## Error handling

Failed calls throw a typed `MeridianError` exposing `.code` (the numeric value from [Error Codes](error-codes.md)), `.type`, `.status`, and `.requestId`. For example, a reused idempotency key throws a `MeridianError` with `.code === 4292`. Rate-limit errors throw `MeridianRateLimitError`, a subclass that also carries `.retryAfter` in seconds.
