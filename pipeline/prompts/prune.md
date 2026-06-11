# Operation: PRUNE

Compression pass. The wiki's value is signal density — an agent loads these pages into
finite context, so every redundant paragraph has a real cost. Cut without losing knowledge.

1. Read every page in `wiki/`.
2. Hunt, in priority order:
   - **Duplication across pages.** The same concept explained in two places → keep the
     best explanation on its canonical page, replace the other with one sentence + a link.
   - **Overlapping pages.** Two pages covering one topic → merge into one, delete the
     other, update every inbound link and `index.md`.
   - **Stale content.** Claims superseded by newer pages or marked `emerging` for >6 months
     with no corroboration → delete or demote to a one-line mention.
   - **Filler prose.** Hedges, restated headings, "as mentioned above", marketing adjectives,
     paragraphs that explain the obvious to this audience → tighten.
   - **Dead sources.** Entries in `sources.md` no longer referenced by any page → remove.
3. Rules:
   - Never delete a *fact* that appears nowhere else — relocate it instead.
   - A page that shrinks below ~25 lines should usually be merged into its nearest neighbor.
   - Net line count of the wiki should go DOWN in a prune run. If it went up, you expanded.
4. Update `updated` on every touched page. Keep `index.md` exact.

Finish with a one-paragraph summary including: lines before → after, pages merged/deleted.
