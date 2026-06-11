# Operation: EXPAND

Research pass. Bring the wiki up to date with the current state of the field.

1. Read `wiki/index.md` and `wiki/_meta/journal.md` (last few entries) to understand
   current coverage and what previous runs already did.
2. Use WebSearch to check what has changed in harness engineering since the most recent
   `updated` date across the wiki. Prioritize primary sources:
   - Anthropic engineering blog, OpenAI engineering posts, Google ADK release notes
   - MCP / A2A spec changes
   - Major framework releases (LangGraph, Agents SDK, ADK, PydanticAI)
   (arXiv papers are the RESEARCH op's job — skip them here unless one is the source
   of a vendor/framework change you're already covering)
3. Pick the **2–4 most consequential developments** (not everything you find). For each:
   - If it updates an existing page: edit that page, bump `updated`, adjust `confidence`.
   - If it deserves a new page: create it following conventions, link it from `index.md`
     and from at least one related page.
   - Add new sources to `sources.md`.
4. Mark genuinely new/unverified claims `confidence: emerging`. Never present a single
   blog post as `established`.
5. If something in the wiki is now WRONG (not just stale), fix it and note the correction
   in your summary — corrections matter more than additions.

Budget: stay focused. A good expand run touches 3–6 files, not 20.

Finish with a one-paragraph summary: what you added/updated and why it made the cut.
