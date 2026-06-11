---
title: Integrations
summary: Native Lumen integrations — Slack, Segment, S3, webhooks, and the reverse proxy.
tags: [integrations, slack, segment, s3, webhooks]
updated: 2026-05-01
confidence: established
---

# Integrations

Integrations are enabled per workspace in **Settings → Integrations**. Most are available on all paid tiers; data-export integrations require Business or above.

## Slack

The **Slack** integration posts dashboard digests and alert notifications to a channel. Connect it with one OAuth click, then choose a default channel. Alerts fire when a Trend insight crosses a threshold you define. Slack is available on **Starter and above**.

## Segment

Lumen is a Segment destination. Add the **Lumen** destination in Segment and paste your Server Key (`lm_sk_`); Segment then forwards events to Lumen automatically. Segment-forwarded events count against your event quota like any other event. See [Plans & Limits](plans-and-limits.md).

## Amazon S3 sync

Business and Enterprise workspaces can stream raw events to an S3 bucket **every hour**. Provide the bucket name and an IAM role ARN that grants Lumen `s3:PutObject`. Files are written as gzipped newline-delimited JSON. This powers the scheduled export in [Data Retention & Export](data-retention-and-export.md).

## Webhooks

Create an outbound **webhook** to receive a POST when an alert fires or a funnel completes. Each webhook payload is signed with an HMAC-SHA256 signature in the `X-Lumen-Signature` header so you can verify it came from Lumen.

## Reverse proxy

To avoid ad blockers dropping events, route the SDK through a **reverse proxy** on your own domain and point `Lumen.init` at it with the `apiHost` option. This is the recommended fix for the missing-events case in [Troubleshooting: Common Errors](troubleshooting-errors.md).
