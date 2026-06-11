# Operation: LINT

Quality pass. **Do not add or remove knowledge.** Fix form, not substance.

1. Read `wiki/index.md`, then every page in `wiki/`.
2. Check and fix, in priority order:
   - Frontmatter: present, valid YAML, all five fields, `updated` not in the future,
     `confidence` is one of the three allowed values.
   - Broken links: every relative link resolves to an existing file. Every page is
     reachable from `index.md`. Flag orphan pages by linking them from `index.md`.
   - Page length: pages over ~150 lines get flagged in your summary (do NOT split them
     during lint — that's a prune/expand decision).
   - Style drift: heading hierarchy (one `#` per page, then `##`/`###`), code fences with
     language tags, consistent terminology (use the glossary as the canonical vocabulary).
   - Numbers without citations: add `(citation needed)` markers — do not invent sources.
3. Do not rewrite prose for taste. Only touch sentences that are broken, ambiguous,
   or contradict the glossary.

Finish with a one-paragraph summary: what you fixed, what you flagged.
