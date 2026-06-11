---
title: Data Retention & Export
summary: How long Lumen keeps raw events per tier, plus CSV, S3, and full-export options.
tags: [retention, export, data, csv, gdpr]
updated: 2026-05-01
confidence: established
---

# Data Retention & Export

Lumen stores two kinds of data: **raw events** (individual tracked events with all properties) and **computed reports** (aggregated dashboard results). Retention applies to raw events; computed reports are kept indefinitely.

## Raw event retention by tier

- **Free — 30 days.** Raw events older than 30 days are permanently deleted.
- **Starter — 90 days.**
- **Team — 180 days.**
- **Business — 365 days.**
- **Enterprise — configurable up to 7 years.**

When raw events expire, dashboards built on them still show data inside the retention window but cannot query beyond it. Upgrading a tier extends retention going forward but does **not** restore events already deleted.

## Exporting data

There are three export paths:

1. **CSV export** — any report's underlying rows export to CSV from the report menu, capped at **1,000,000 rows** per export.
2. **Scheduled S3 sync** — Business and Enterprise workspaces can stream raw events hourly to an Amazon S3 bucket you own; configure it in [Integrations](integrations.md).
3. **Full data export** — request a complete archive of your raw events as newline-delimited JSON from **Settings → Data → Export**. The archive is generated within **24 hours** and the download link is valid for **72 hours**.

## Deletion and GDPR

To delete a single end user's data, call the `DELETE /v1/persons/{id}` endpoint described in [API Access](api-access.md). Deletion completes within **30 days**. Deleting a workspace removes all raw events immediately and computed reports within 30 days.
