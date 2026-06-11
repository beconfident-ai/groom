# harness-wiki

**GROOM — Gated Refresh of Organizational Memory.** A **self-repairing LLM knowledge base**. Install the bundled Claude Code skill and the
wiki maintains itself as a side effect of being used: every time an agent consults it,
a non-blocking background cycle (built on the
[Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview)) lints, prunes, or
expands the content for the next reader. Knowledge bases rot; this one repairs itself
through its own tool-calling harness. Cron is supported too, but the skill is the
primary loop.

This instance's content is **harness engineering for AI agents**: the discipline of
building the control, execution, safety, evaluation, and training infrastructure around
LLMs. Fitting — the repo eats its own cooking. But the pipeline is content-agnostic:
fork it, replace `wiki/`, edit the prompts, and you have a self-repairing knowledge base
on anything.

```
wiki/                   the knowledge base (19 pages + meta)
  index.md              map of content — agents and humans start here
  _meta/canaries.json   load-bearing facts that must survive maintenance
  _meta/journal.md      append-only log of every pipeline run
pipeline/
  run.mjs               maintenance runner + checkpoint gate (~250 lines)
  validate.mjs          deterministic, token-free validator: structure + canaries (~125 lines)
  background-refresh.mjs  consultation-triggered launcher (~70 lines)
  prompts/              one prompt per operation + shared conventions
  config.json           background-refresh toggle, op, debounce interval
eval/                   reproducible mechanism benchmarks (fault matrix, scaling, concurrency, ablation, outcome)
cron/                   crontab + launchd examples
.claude/skills/
  harness-wiki/         Claude Code skill: teaches agents to consult the wiki
.claude/agents/
  groom.md              subagent returning a structured "groomed brief"
```

## The pipeline

Each operation launches a Claude Code agent (via the Agent SDK) scoped to `wiki/` with a
focused prompt:

| Command | What it does |
|---|---|
| `npm run lint` | Fix frontmatter, broken links, style drift. Never changes knowledge. |
| `npm run expand` | Web-research what changed in the field (vendor blogs, specs, frameworks); update or add the 2–4 most consequential things. |
| `npm run research` | Ingest recent arXiv papers — citation-gated (≥5 citations or clearly major) so recency alone never adds noise. 0 additions is a valid outcome. |
| `npm run prune` | Cut duplication, merge overlapping pages, delete stale content. Net lines must go **down**. |
| `npm run iterate` | Find the single weakest page and make it genuinely good. |
| `npm run all` | Cron entrypoint: `research → expand → lint → prune`. |

Every run appends a record (model, cost, summary) to `wiki/_meta/journal.md`.

### The primary loop: skill-triggered background refresh (stale-while-revalidate)

The wiki refreshes itself **as a side effect of being consulted**: when the bundled
skill activates (an agent loads wiki pages to answer a question), it first fires
`pipeline/background-refresh.mjs` as a non-blocking step. That launcher exits in <100ms — it
checks the toggle in `pipeline/config.json`, debounces against a stamp file (at most one
cycle per interval), then acquires an **atomic `mkdir` claim** so that several simultaneous
consultations resolve to exactly one cycle (the debounce stamp alone is a check-then-write
race — see `eval/concurrency.mjs`), and only then spawns a fully detached maintenance cycle
(default: `lint`) whose output lands in `cron/background-refresh.log`. The current
conversation is never blocked; the next consumer gets a fresher wiki.

```jsonc
// pipeline/config.json
{
  "background_refresh": {
    "enabled": true,           // master toggle — set false to disable at skill startup
    "op": "lint",              // which cycle to run: lint | prune | iterate | expand | all
    "min_interval_hours": 24,  // debounce: at most one spawn per interval
    "log_file": "cron/background-refresh.log"
  }
}
```

Cron (`cron/crontab.example`, `cron/launchd.plist.example`) remains available as a belt
to the skill's suspenders — useful if the wiki is consulted rarely but should stay fresh.

The pipeline runs on **your Claude Code defaults** — the Agent SDK shares the CLI's auth
and model selection, so when you upgrade your CLI's model, the wiki's maintenance agent
upgrades with it. The journal records the model that actually served each run.

Operations are **discovered from `pipeline/prompts/`**: every `<op>.md` file is a
runnable op, plus the composite `all`. Adding an operation to the pipeline is dropping a
prompt file — no code change.

### Setup

```bash
npm install
npm test                     # 10-test behavior suite — free, no agent calls
node eval/fault-matrix.mjs   # reproduce the mechanism benchmarks (also free)
npm run lint                 # first real run (spends one agent cycle)
```

Requirements: Node ≥ 20, [Claude Code](https://claude.com/claude-code) installed and
authenticated.

### Safety posture

Autonomous edits to a live corpus are the real risk, so every maintenance run is wrapped in
a **git checkpoint with a deterministic gate** (`run.mjs` + `validate.mjs`). The run commits
the corpus first, then executes the op with a per-op capability set (read/write/search +
prefix-scoped read-only Bash; web tools only for `expand`/`research`/`iterate`) and a
real-time guard that denies any write resolving outside `wiki/`. The edit is **accepted only
if** it (a) reports terminal success, (b) passes structural validation (frontmatter, link
resolution, index reachability), (c) passes **fact-level canaries** — load-bearing facts in
`wiki/_meta/canaries.json` that must survive maintenance, (d) satisfies its postcondition
(e.g. `prune` must not grow the corpus), and (e) changed nothing outside `wiki/`. Any failure
triggers `git reset --hard`, turning a mis-prune, a crash, a turn-truncation, or a fence
escape into a recoverable no-op instead of permanent corruption. The validator costs zero
model tokens and is reused as a CI test and a free `status` command.

The `eval/` harness measures this machinery (all reproducible, no agent calls): across nine
fault classes the gate rejects every one and recovers the corpus byte-identically (n=450)
where a no-gate baseline corrupts it 9/9; the validator scales linearly (~34 µs/page); the
atomic claim resolves 8-way races 500/500; and structural checks alone miss 5/5 semantic
losses that the canaries catch. See `wiki/permissions-and-safety.md` for the theory.

## Using the wiki as agent context

### Claude Code (recommended: the bundled skill)

The repo ships a skill at `.claude/skills/harness-wiki/SKILL.md`. Anyone running Claude
Code **inside this repo** gets it automatically: when a conversation touches agent
architecture, the agent reads `wiki/index.md`, loads only the relevant pages, and respects
each page's `updated` / `confidence` frontmatter instead of free-styling from training
data.

To use it from *other* projects, install it user-level:

```bash
mkdir -p ~/.claude/skills
ln -s "$(pwd)/.claude/skills/harness-wiki" ~/.claude/skills/harness-wiki
```

A skill is the right mechanism here (vs. CLAUDE.md or an MCP server) because it's
**lazy-loaded**: it costs ~one line of context until a harness-engineering question
actually comes up, then teaches the agent progressive disclosure over the wiki. A
knowledge base about context engineering should not itself blow your context window.

### Surfacing the groom step explicitly

Grooming is usually invisible: pages load into context and dissolve into the answer.
When you want the groom step to be an **explicit, auditable artifact**, delegate to the
bundled subagent at `.claude/agents/groom.md`: its prompt is your question, and its
return value is a structured *groomed brief* (verdict · load-bearing claims with
page-level citations and confidence grades · edges · pages consulted). Two properties
make this the right mechanism rather than trying to capture hidden reasoning:

- **The brief is the deliverable.** Subagents' final messages are returned as values to
  the caller, so the groomed synthesis arrives machine-consumable, not conversational.
- **The process is preserved.** The subagent's full transcript (every page read, every
  judgment) lands in its own sidechain file. A `SubagentStop` hook can archive briefs:
  the hook payload carries the transcript path, so one line of `jq` + `cp` files it
  under `wiki/_meta/briefs/`.

The groom agent also fires the background-refresh launcher on startup, so an explicit
groom is still a maintenance trigger — reading and grooming stay one motion.

### Other agents / frameworks

Point your agent at `wiki/index.md` and instruct it: *read the index, load only pages
whose `summary` matches the task, trust `established` pages, hedge `emerging` ones, check
`updated` dates on fast-moving topics.* The per-page frontmatter is designed to make that
selection cheap.

### Humans

Start at [`wiki/index.md`](wiki/index.md). Pages are 60–150 lines, prose-first, written
for a technical reader.

## Forking this for your own knowledge base

1. Replace `wiki/*.md` with seed pages on your domain (keep `index.md`, `sources.md`,
   `glossary.md`, `_meta/`).
2. Edit `pipeline/prompts/_conventions.md` — it defines the domain, audience, and style.
3. Adjust `expand.md`'s source list to your field's primary sources.
4. Update the skill description in `.claude/skills/` so agents know when to trigger it.
5. Schedule `npm run all` weekly. Read the journal occasionally; the pipeline is
   trustworthy-with-oversight, not autonomous.

## License

MIT
