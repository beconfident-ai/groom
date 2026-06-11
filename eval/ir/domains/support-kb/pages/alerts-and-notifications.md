---
title: Alerts & Notifications
summary: Threshold and anomaly alerts on Lumen insights, delivery channels, and cooldowns.
tags: [alerts, notifications, monitoring, anomaly]
updated: 2026-05-01
confidence: established
---

# Alerts & Notifications

Alerts watch a saved **Trend** insight and notify you when its value crosses a rule you set. Create one from any Trend report via **Insight → Add Alert**. Alerts are available on **Starter and above**.

## Alert types

- **Threshold alert** — fires when the metric goes above or below a fixed number you specify (for example, signups below 100 in a day).
- **Anomaly alert** — fires when the metric deviates from its expected range. Lumen learns the baseline from the **trailing 30 days** and flags values outside roughly two standard deviations.

## Check frequency

Alerts are evaluated on a schedule you pick: **every 15 minutes, hourly, or daily**. Anomaly alerts require at least the hourly frequency because they need enough history to model a baseline.

## Cooldown

To prevent alert storms, each alert has a **cooldown of 60 minutes** by default — once it fires it will not fire again until the cooldown elapses, even if the condition stays true. You can raise the cooldown up to 24 hours per alert.

## Delivery

Alerts deliver to email, a [Slack](integrations.md) channel, or an outbound [webhook](integrations.md). A single alert can target multiple channels at once. Each workspace may have at most **50 active alerts** on Team and **200** on Business. Alert history is kept for 90 days and is visible under **Settings → Alerts**.

See [Dashboards & Reports](features-dashboards.md) for building the Trend insights that alerts watch.
