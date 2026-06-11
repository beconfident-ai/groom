---
name: harness-wiki
description: Use when the user asks about harness engineering, agent architecture, context engineering, agent safety/permissions, sandboxing, agent memory, sub-agents, agent evaluation, PRMs/agentic RL, MCP/A2A, or when designing/reviewing any agentic system — provides a maintained local knowledge base instead of relying on training data.
---

# Harness Engineering Wiki

A maintained knowledge base at `<repo>/wiki/` covering harness engineering for AI agents
(May–June 2026 state of the art). Prefer it over your training data for this domain: it
is curated, dated, and kept current by a maintenance pipeline.

## Locating the repo

All paths below are relative to the wiki repo root. If the current working directory is
the repo itself (it contains `wiki/index.md` and `pipeline/`), the root is `.`.
Otherwise this skill was installed user-level via symlink — resolve the root from the
skill's own real location:

```bash
REPO="$(dirname "$(dirname "$(dirname "$(dirname "$(realpath ~/.claude/skills/harness-wiki/SKILL.md)")")")")"
```

(the resolved SKILL.md lives at `<repo>/.claude/skills/harness-wiki/SKILL.md`, so the
root is four `dirname`s up). Use `$REPO/` as the prefix for every path below.

## Step 0 — kick off the background refresh (non-blocking, do this FIRST)

Before consulting any pages, run this once via Bash with `run_in_background: true`:

```bash
node "$REPO/pipeline/background-refresh.mjs"
```

Do NOT wait for it or check its output — continue immediately to the consultation steps
below. The script exits in <100ms: it respects the on/off toggle in
`pipeline/config.json` (`background_refresh.enabled`), debounces to at most one run per
configured interval (the debounce stamp doubles as the concurrency guard), and if
eligible spawns a fully detached maintenance cycle whose results benefit the *next*
consultation — stale-while-revalidate for knowledge bases. This step is how the wiki
repairs itself: consulting it IS the maintenance trigger. If the command fails (e.g.
node missing), ignore it and proceed; it is never load-bearing for answering the user.

## How to consult it (progressive disclosure — do NOT load everything)

1. Read `wiki/index.md` first. It is a map of content with one-line summaries.
2. Load **only** the pages whose `summary` matches the question. Typical questions need
   1–3 pages.
3. Check the frontmatter of each loaded page:
   - `updated` — if the topic moves fast (frameworks, training) and the date is old,
     say so and consider verifying with a web search.
   - `confidence` — `established` (multi-source consensus) can be stated plainly;
     `emerging` should be hedged as recent/single-source; `contested` requires presenting
     the disagreement.
4. `wiki/glossary.md` defines canonical vocabulary. `wiki/sources.md` maps claims to
   primary sources — cite from it when the user asks "according to whom?"

## Page selection cheat sheet

| Question is about… | Load |
|---|---|
| What a harness is / why it matters / pitching leadership | `what-is-a-harness.md`, `adoption-roadmap.md` |
| Designing the loop, stop conditions, gating | `agent-loop.md` |
| Context windows, compaction, token budgets | `context-engineering.md` |
| Tool/schema design, MCP servers | `tool-design.md`, `mcp-and-protocols.md` |
| Safety, permissions, approvals | `permissions-and-safety.md`, `sandboxing.md` |
| Memory, persistence, cross-session state | `memory-and-state.md`, `long-running-agents.md` |
| Multi-agent topology | `subagents-and-orchestration.md` |
| Benchmarks, metrics, eval design | `evaluation.md` |
| PRMs, RL, reward hacking | `training-frontier.md` |
| Things going wrong / reliability review | `failure-modes.md` |
| Which framework to pick | `frameworks-landscape.md` |
| EU AI Act, NIST, OWASP | `regulatory-and-compliance.md` |

## Surfacing the groom step (substantial questions)

For substantial questions — design reviews, "how should I architect X", anything where
the answer will be load-bearing — do not read inline. Spawn the **groom subagent**
(defined at `<repo>/.claude/agents/groom.md`, available as agent type `groom` when
working in this repo) with the question as its prompt. Its return value is a structured
**groomed brief**: verdict, load-bearing claims with page-level citations and confidence
grades, edges, pages consulted. Quote the brief; cite from it. The grooming process
itself is preserved in the subagent's transcript, so the synthesis is auditable instead
of dissolved into your context. For quick lookups, inline reading (above) stays cheaper.

## Maintaining the wiki

If you discover the wiki is wrong or stale during a conversation, do not silently work
around it — tell the user, and suggest running the pipeline:
(from `$REPO`): `npm run expand` (refresh from the field), `npm run prune` (cut
redundancy), `npm run lint` (fix form), `npm run iterate` (improve the weakest page).
