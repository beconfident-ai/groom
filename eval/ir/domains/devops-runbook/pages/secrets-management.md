---
title: Secrets Management
summary: How Orbit stores, injects, and rotates secrets using HashiCorp Vault.
tags: [secrets, vault, rotation, credentials, security, orbit]
updated: 2026-05-01
confidence: established
---

# Secrets Management

Orbit secrets live in HashiCorp Vault. **No secret is ever committed to Git, baked into an image, or stored as a plaintext Kubernetes `Secret` at rest** — the [CI/CD gates](cicd-gates.md) run a secret scanner that fails the build on any detected credential.

Secrets are organised by a fixed path convention:

```
orbit/<env>/<service>
```

For example, the production billing database password lives at `orbit/prod/billing`. Access is governed by Vault policies bound to each service's Kubernetes ServiceAccount, so a pod can read only its own service's path and nothing else — least privilege is enforced by the path, not by convention.

Secrets are injected at pod startup by the Vault Agent sidecar, which writes them to an in-memory `tmpfs` volume mounted at `/var/run/secrets/orbit`. They are **never exposed as environment variables**, because env vars leak into crash dumps and child processes.

All secrets carry a **90-day maximum age and are rotated every 90 days**; the rotation job runs automatically and bumps the Vault version. Because the Agent re-reads on a 60-second lease renewal, a rotated secret propagates to running pods without a redeploy. Database credentials use Vault dynamic secrets with a 24-hour TTL on top of the 90-day static rotation.

A suspected secret leak is a [SEV-1](incident-severity.md): revoke the Vault lease, rotate the affected path immediately, and page the platform team via [on-call escalation](on-call-escalation.md).
