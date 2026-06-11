---
title: Plans & Limits
summary: The four Lumen plan tiers with seats, storage, monthly event quotas, and pricing.
tags: [plans, pricing, limits, seats, quotas]
updated: 2026-05-01
confidence: established
---

# Plans & Limits

Lumen is sold in four self-serve tiers plus a custom Enterprise tier. Every workspace starts on **Free** and can upgrade in **Settings → Billing**. Prices are per workspace, billed monthly unless you choose annual billing (see [Billing & Invoicing](billing-and-invoicing.md)).

## Tier comparison

- **Free — $0/month.** 2 seats, 1 GB of storage, 50,000 tracked events per month, 1 project.
- **Starter — $49/month.** 5 seats, 10 GB of storage, 1 million events per month, 3 projects.
- **Team — $199/month.** 10 seats, 50 GB of storage, 10 million events per month, 10 projects.
- **Business — $599/month.** 30 seats, 250 GB of storage, 50 million events per month, unlimited projects.
- **Enterprise — custom pricing.** Unlimited seats, custom storage, custom event volume, and a 99.9% uptime SLA.

A "tracked event" is any call to `lumen.track()` or an ingested server-side event. Identify and page-view calls do **not** count against your event quota.

## Overages

If you exceed your monthly event quota, Lumen keeps ingesting and charges **$0.50 per additional 10,000 events** at the end of the cycle. Storage overages are billed at **$0.40 per GB per month**. You can set a hard cap in **Settings → Usage** to reject events instead of incurring overages.

See [Service Limits & Quotas](service-limits.md) for rate limits and [Data Retention & Export](data-retention-and-export.md) for how long event data is kept on each tier.
