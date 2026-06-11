---
title: Getting Started
summary: Create a workspace, install the Lumen SDK, send your first event, and build a dashboard.
tags: [onboarding, setup, sdk, quickstart]
updated: 2026-05-01
confidence: established
---

# Getting Started

Lumen is a product analytics tool that turns raw user events into dashboards, funnels, and retention reports. This page walks a new workspace through first value.

## 1. Create a workspace

Sign up at app.lumen.io and you land on the **Free** tier with one default project. Each project has its own **Project Key** (a string beginning with `lm_pk_`) found in **Settings → Projects**. The key is safe to ship in client code.

## 2. Install the SDK

Install the browser SDK with `npm install @lumen/analytics`, then initialize it:

```js
import { Lumen } from '@lumen/analytics';
Lumen.init('lm_pk_YOUR_KEY');
```

For backend ingestion use a **Server Key** (prefix `lm_sk_`) and the REST endpoint described in [API Access](api-access.md). Never expose a Server Key in client code.

## 3. Send your first event

Call `Lumen.track('Signup Completed', { plan: 'free' })`. Events appear in the **Live Events** stream within **about 30 seconds**; full processing into reports can take up to 2 minutes during peak load.

## 4. Build a dashboard

Open **Explore**, pick an event, and save the chart to a dashboard. The [Dashboards & Reports](features-dashboards.md) page covers funnels, retention, and the **Insight Builder**.

If events never arrive, see [Troubleshooting: Common Errors](troubleshooting-errors.md). To connect other tools, see [Integrations](integrations.md).
