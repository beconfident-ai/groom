---
title: Versioning
summary: How Meridian versions its API via headers, release channels, and its deprecation policy.
tags: [versioning, headers, deprecation, releases]
updated: 2026-05-01
confidence: established
---

# Versioning

Meridian uses **two layers** of versioning: a major version baked into the URL path, and a dated minor version selected by header.

## Major version in the path

The major version is part of the base URL — `https://api.meridian.dev/v2`. The current major version is **v2**. Major versions change only on breaking changes and are supported for a long horizon; the prior major **v1** is deprecated and reaches end-of-life on **2026-12-31** (see the [Migration Guide](migration-v1-v2.md)).

## Dated minor version header

Within a major version, behavior is pinned by the **`Meridian-Version`** header, a date string. The current pinned version is **`2026-04-15`**. If you omit the header, requests use the version that was current when your API key was first created (your account's "default pin"). We recommend setting the header explicitly so behavior never shifts under you.

## Release channels

Non-breaking additions ship continuously to the stable channel. Opt into early features by sending `Meridian-Version: 2026-04-15.beta`; beta behavior may change without notice and must not be used in production.

## Deprecation policy

Deprecated fields and endpoints emit a `Meridian-Deprecation` response header naming the field and its removal date. Meridian guarantees a **minimum 6-month notice** before removing anything from a stable dated version. Authentication keys are version-independent, per [Authentication](authentication.md). The SDK pins a version for you; [SDK 4.3.2](sdk-overview.md) sends `2026-04-15`.
