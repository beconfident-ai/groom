---
title: Webhooks
summary: Subscribing to Meridian events, the event payload shape, and supported event types.
tags: [webhooks, events, subscriptions, callbacks]
updated: 2026-05-01
confidence: established
---

# Webhooks

Webhooks push events to your server as they happen, so you do not have to poll. Managing webhook endpoints requires the `admin` scope described in [Authentication](authentication.md).

## Creating an endpoint

Register a receiver with `POST /v2/webhooks`, supplying a `url` (must be HTTPS) and an array of event types to subscribe to. The response returns a webhook `id` (prefix `whk_`) and a **signing secret** (prefix `whsec_`) shown only once — store it to verify deliveries per [Webhook Retries & Signatures](webhook-retries.md).

## Event types

Meridian emits these event types:

- `document.created`
- `document.updated`
- `document.deleted`
- `collection.created`
- `batch.completed`

Subscribe to the special value `*` to receive **all** event types. A single endpoint may subscribe to at most **25 event types** (or `*`).

## Delivery payload

Each delivery is an HTTP `POST` with a JSON body: `{ "id": "evt_…", "type": "document.created", "created": 1714521600, "data": { ... } }`. The `id` (prefix `evt_`) is unique per event but may be delivered more than once, so consumers must be idempotent — see [Idempotency](idempotency.md).

Your endpoint must respond with a **2xx status within 5 seconds**. Any other status, or a timeout, marks the delivery as failed and triggers the retry schedule in [Webhook Retries & Signatures](webhook-retries.md). Webhook deliveries are exempt from your [rate limits](rate-limits.md). You can list recent deliveries via `GET /v2/webhooks/{id}/deliveries`.
