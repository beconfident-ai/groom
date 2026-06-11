---
title: Account & SSO Setup
summary: User roles, inviting teammates, SAML/SCIM SSO, and two-factor authentication in Lumen.
tags: [account, sso, saml, roles, security]
updated: 2026-05-01
confidence: established
---

# Account & SSO Setup

Account and member management lives in **Settings → Members**. Every workspace has exactly one **Owner**, who can transfer ownership but cannot be removed.

## Roles

Lumen has four roles:

- **Owner** — full control, including billing and deletion. One per workspace.
- **Billing Admin** — manages billing and invoices but cannot delete the workspace.
- **Member** — creates and edits dashboards and reports.
- **Viewer** — read-only access to dashboards.

Seat counts in [Plans & Limits](plans-and-limits.md) count Owners, Billing Admins, and Members. **Viewers do not consume a seat** on any paid tier.

## Inviting teammates

Invite by email from **Settings → Members → Invite**. Invitations expire after **7 days**. A user can belong to multiple workspaces with the same login.

## Single sign-on (SSO)

**SAML 2.0 single sign-on is available on the Business and Enterprise tiers.** Configure it in **Settings → Security → SSO** by uploading your identity provider's metadata XML; Lumen supports Okta, Azure AD, and Google Workspace as IdPs. Once SSO is enforced, password login is disabled for all members except the Owner, who keeps a break-glass password.

**SCIM user provisioning** is Enterprise-only and auto-deprovisions users when they are removed from the IdP.

## Two-factor authentication

Any user can enable **TOTP-based two-factor authentication** on their own account. An Owner can require 2FA for the entire workspace from **Settings → Security**. See [API Access](api-access.md) for programmatic authentication, which uses keys rather than SSO.
