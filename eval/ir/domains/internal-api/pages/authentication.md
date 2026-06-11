---
title: Authentication & API Keys
summary: How Meridian authenticates requests using bearer API keys, key prefixes, scopes, and rotation.
tags: [auth, api-keys, security, bearer]
updated: 2026-05-01
confidence: established
---

# Authentication & API Keys

Every request to `https://api.meridian.dev/v2` must carry a bearer token in the `Authorization` header: `Authorization: Bearer mrd_live_…`. Requests without a valid key receive HTTP 401 and [error code 4015](error-codes.md) (`invalid_api_key`).

## Key formats

Live keys are prefixed **`mrd_live_`** and test keys **`mrd_test_`**, each followed by a 32-character base62 secret. Test keys operate only against the sandbox and never move real data. A given key string is shown **exactly once** at creation time; Meridian stores only a salted SHA-256 hash and cannot recover the plaintext.

## Scopes

Keys carry scopes that gate access per resource. The four scopes are `read`, `write`, `events`, and `admin`. A `read`-only key calling a write endpoint is rejected with HTTP 403 and [error code 4031](error-codes.md) (`insufficient_scope`). The `admin` scope is required to manage [webhooks](webhooks.md) and to rotate other keys.

## Rotation

Keys do not expire on a fixed schedule, but rotation is supported with overlap. Calling `POST /v2/keys/rotate` issues a new secret while the old one stays valid for a **24-hour grace window**, after which it is revoked. We recommend rotating live keys every **90 days**.

Authentication is independent of API versioning; the same key works across versions selected via the `Meridian-Version` header described in [Versioning](versioning.md). The [SDK Overview](sdk-overview.md) reads your key from the `MERIDIAN_API_KEY` environment variable by default.
