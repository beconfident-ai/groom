---
title: Pagination
summary: Cursor-based pagination for Meridian list endpoints, page sizes, and result ordering.
tags: [pagination, cursor, listing, paging]
updated: 2026-05-01
confidence: established
---

# Pagination

All Meridian list endpoints use **cursor-based pagination**, not offset/limit. Cursors are opaque, URL-safe strings; never construct or parse them yourself.

## Requesting a page

Pass `limit` to set page size. The default page size is **25 items** and the maximum is **100 items**; requesting more than 100 returns [error code 4220](error-codes.md) (`validation_failed`). To fetch the next page, send the `next_cursor` from the previous response back as the `cursor` query parameter.

## Response shape

List responses wrap results in a `data` array alongside a `pagination` object:

```
{
  "data": [ ... ],
  "pagination": { "next_cursor": "eyJ…", "has_more": true }
}
```

When `has_more` is `false`, `next_cursor` is `null` and you have reached the end. Cursors are valid for **1 hour** after issue; a stale cursor returns [error code 4220](error-codes.md).

## Ordering

Results are ordered by **creation time, newest first** by default. Pass `order=asc` to reverse to oldest-first. Ordering is stable across pages because cursors encode the sort position, so newly created items never cause an item to appear twice or be skipped.

The [search](core-endpoints.md) endpoint paginates the same way but caps total results at 200. The [SDK Methods](sdk-methods.md) page exposes an auto-paginating iterator so you rarely handle cursors by hand. Each page fetch is one request against your [rate limit](rate-limits.md).
