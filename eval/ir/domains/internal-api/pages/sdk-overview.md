---
title: SDK Overview
summary: Installing, configuring, and initializing the official Meridian SDK client.
tags: [sdk, install, config, client, setup]
updated: 2026-05-01
confidence: established
---

# SDK Overview

The official SDK wraps the Meridian REST API with typed methods, automatic retries, and auto-pagination. This page covers install and configuration; the method surface is in [SDK Methods](sdk-methods.md).

## Installation

The package is published to npm as **`@meridian/sdk`**. Install the current release:

```
npm install @meridian/sdk
```

The latest stable version is **4.3.2**, which targets API [version](versioning.md) `v2`. The SDK requires **Node.js 18 or newer**.

## Initialization

```
import { MeridianClient } from "@meridian/sdk";
const client = new MeridianClient({ apiKey: "mrd_live_…" });
```

If you omit `apiKey`, the client reads it from the **`MERIDIAN_API_KEY`** environment variable, as noted in [Authentication](authentication.md).

## Configuration options

The constructor accepts:

- `apiKey` — your bearer key.
- `baseURL` — defaults to `https://api.meridian.dev/v2`.
- `timeout` — per-request timeout in milliseconds; default **30000** (30 seconds).
- `maxRetries` — default **3**; retries 429 and 5xx responses with exponential backoff, honoring `Retry-After` from [Rate Limits & Quotas](rate-limits.md).

Every write issued through the client automatically attaches an [idempotency key](idempotency.md) unless you supply one, so SDK retries are always safe. To target the sandbox, pass a `mrd_test_` key — no other config change is needed.
