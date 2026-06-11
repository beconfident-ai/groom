---
title: Security & Compliance
summary: Lumen data hosting regions, encryption, certifications, and the audit log.
tags: [security, compliance, encryption, soc2, audit]
updated: 2026-05-01
confidence: established
---

# Security & Compliance

This page summarizes how Lumen protects workspace data and the compliance commitments that apply.

## Data hosting and residency

Workspace data is hosted in one of two regions chosen at workspace creation: **US (Virginia)** or **EU (Frankfurt)**. The region is fixed for the life of the workspace and cannot be changed after creation — to move regions you must create a new workspace and re-import. EU workspaces keep all raw events within the EU to support data-residency requirements.

## Encryption

All data is **encrypted in transit with TLS 1.2 or higher** and **encrypted at rest with AES-256**. Server Keys and SSO secrets are stored in a dedicated secrets vault, never in the primary database.

## Certifications

Lumen maintains a **SOC 2 Type II** report, renewed annually, and is **GDPR-compliant**. A signed Data Processing Addendum (DPA) is available to all paid customers on request. HIPAA support is offered only under Enterprise contracts with a signed BAA.

## Audit log

Every workspace on **Business and Enterprise** has an **audit log** under **Settings → Audit Log** that records administrative actions — member invites, role changes, key rotation, and SSO changes — with actor, timestamp, and IP address. Audit log entries are retained for **1 year**. Enterprise workspaces can stream the audit log to their own SIEM via [webhook](integrations.md).

## Sub-processors

Lumen publishes its list of sub-processors and gives **30 days notice** before adding a new one. Account-level controls such as SSO and 2FA are covered in [Account & SSO Setup](account-and-sso.md).
