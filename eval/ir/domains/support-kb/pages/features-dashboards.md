---
title: Dashboards, Reports & Cohorts
summary: Insight Builder, funnels, retention, cohorts, and dashboard sharing in Lumen.
tags: [features, dashboards, funnels, retention, cohorts, reports]
updated: 2026-05-01
confidence: established
---

# Dashboards, Reports & Cohorts

Lumen reports are built from events using the **Insight Builder**, found under **Explore**. Each report is one of four types: Trend, Funnel, Retention, or Flow.

## Insight Builder

A **Trend** report counts events over time. You can break down any event by a property (for example, `plan` or `country`) and apply filters. Trends support five aggregations: total count, unique users, count per user, sum, and median.

## Funnels

A **Funnel** report measures conversion across an ordered series of steps. The default **conversion window is 14 days** — a user must complete all steps within 14 days to count as converted. You can change the window per funnel from 1 hour up to 90 days.

## Retention

A **Retention** report shows the percentage of users who return after a starting event. Lumen computes **rolling retention** by default; switch to **bounded retention** in the report settings to only count users active in that exact period.

## Cohorts

A **cohort** is a named group of users you reuse as a filter on any report, managed under **People → Cohorts**. A **static cohort** is a fixed list captured at creation, while a **dynamic cohort** is rule-based and **re-evaluates every hour** so membership stays current. A single cohort may hold up to **10 rules**. Set user attributes with `Lumen.identify()`; user properties read at their current value, unlike event properties.

## Saving and sharing

Save any report to a **Dashboard**. Dashboards can be shared with a public read-only link, which is disabled by default and must be enabled per dashboard in **Dashboard → Share**. Scheduled email digests can be sent daily or weekly. Saved dashboards are unlimited on every paid plan; see [Plans & Limits](plans-and-limits.md) and [Data Retention & Export](data-retention-and-export.md) for how far back reports can query.
