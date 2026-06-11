---
title: Sandboxing
summary: Isolation tiers for side-effectful tool execution — process, container, gVisor, Firecracker, managed sandboxes — and how to choose.
tags: [sandboxing, isolation, security, infrastructure]
updated: 2026-06-10
confidence: established
---

# Sandboxing

Sandboxing is a mandatory harness primitive for any tool that can execute code, touch
files, browse, or call privileged systems. Not theoretical: the model can generate
arbitrary commands, and even framework authors warn against local execution (smolagents
docs: local CodeAgent execution is "inherently risky").

The trade-off is clean: stronger isolation costs platform complexity, tool compatibility,
and startup latency; weaker isolation costs blast radius. Teams without a hard budget
constraint should default to the stronger end.

## The five tiers

| Tier | Isolation | Notes |
|---|---|---|
| **Process** | None | Same process as the runtime. Only for code you wrote and trust. |
| **Container** (Docker rootless / ECI) | Namespaces + cgroups, shared kernel | The developer standard; container escape is a realistic threat for adversarial code. The floor, not the ceiling. |
| **User-mode kernel** (gVisor) | Per-sandbox application kernel in userspace | Defuses host-kernel-vuln escapes; process-like ergonomics. Common production default. |
| **microVM** (Firecracker) | Hypervisor-grade, minimal device model | <125ms boot, tiny footprint — viable per-tool-call. Proven under AWS Lambda. |
| **Full VM / managed** (E2B, Modal, Daytona) | Strongest, operated for you | Turnkey; adds a platform dependency and a latency floor. |

## Recommendations

- Floor for anything side-effectful: rootless container **with strict egress control**.
- Default with platform engineering capacity: **gVisor or Firecracker**.
- Default without it: **a managed sandbox service**.
- Inside any tier: least privilege, ephemeral credentials, explicit network egress
  allowlists, no long-lived secrets in the sandbox image.

## Design interactions

- The sandbox is safety layer 5 of 7 in the reference stack — it bounds damage when the
  gates upstream fail. See [permissions & safety](permissions-and-safety.md).
- Code-execution tool strategies (one code block instead of ten tool calls — see
  [tool design](tool-design.md)) shift load onto the sandbox: more power inside the
  boundary demands a stronger boundary.
- For [reinforcement-trained agents](training-frontier.md), environment hardening is also
  anti-reward-hacking infrastructure: an agent that can tamper with its evaluator's files
  will learn to.

Related: [permissions & safety](permissions-and-safety.md) · [tool design](tool-design.md) ·
[agent loop](agent-loop.md)
