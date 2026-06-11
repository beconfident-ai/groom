# Evaluation harness

Reproducible measurements of the GROOM *mechanism* — the checkpoint gate, the
deterministic validator, git recovery, and the concurrency lock. Every experiment runs
against an isolated, throwaway git repo containing a copy of the live corpus
(`wiki/`); nothing here touches the canonical repo, spends an agent call, or hits the
network. The validator and launcher under test are the real shipped code
(`pipeline/validate.mjs`, `pipeline/background-refresh.mjs`); `lib.mjs` transcribes the
gate predicate from `pipeline/run.mjs` (the single source of truth) so a fault can be
evaluated without spawning the LLM.

These cover what is deterministically measurable. They do **not** evaluate knowledge
correctness or whether consumption-triggered maintenance improves downstream outcomes —
that is the paper's stated open problem, not something this harness claims to settle.

```bash
node eval/fault-matrix.mjs [reps=50]    # gate rejects + recovers every fault class; no-gate baseline corrupts
node eval/scaling.mjs      [trials=50]  # validator cost vs corpus size (median + IQR per size)
node eval/concurrency.mjs  [k=8] [rounds=500]  # stamp-only vs atomic claim under a k-way race
node eval/ablation.mjs                  # structural-only vs +canary catch-rate on semantic-loss injections
node eval/outcome/prep.mjs              # build fresh vs staleness-injected corpus views + question set
node eval/outcome/grade.mjs             # grade the consuming-agent QA runs (see note below)
```

The outcome experiment has two deterministic stages here (`prep` builds the fresh/staled
corpus views and the ground-truth question set; `grade` scores recorded answers). The
middle stage — a consuming agent answering the questions over each view — is run by an
LLM and its transcripts are recorded in `grade.mjs`; it is the only step that is not
pure code.

Each writes a `results-*.json`. Headline findings (single Apple-Silicon laptop, Node 22;
absolute timings are load-sensitive, so report median + IQR and treat slopes as
order-of-magnitude):

| Experiment | Result |
|---|---|
| Fault matrix | 9 fault classes; the gate rejects all and recovers byte-identical to the checkpoint (50/50 reps each, n=450). A no-gate baseline that commits unconditionally corrupts the corpus in 9/9. In-process recovery: ~10–13 ms median. |
| Scaling | Validator is linear in pages (R² > 0.99); ~0.8 ms at 19 pages, ~14 ms at 400; tens of µs/page — negligible against a multi-second LLM op. |
| Concurrency | An 8-way trigger race: the prior debounce-stamp resolves to exactly one run only ~30–60% of the time (a TOCTOU window); the atomic `mkdir` claim resolves to exactly one in 500/500 rounds. |
| Ablation | Structural validation catches 0/5 semantic-loss injections; fact-level canaries catch the 5/5 they cover, and 0/2 they do not — coverage is targeted, not total. |
| Outcome | A consuming agent answers a question set over a fresh vs. a staleness-injected corpus. Accuracy on the affected facts collapses 100% → 0% while unchanged controls hold at 100% — corpus staleness propagates directly into wrong agent answers, on exactly the facts the canaries guard. |
