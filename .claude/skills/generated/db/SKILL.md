---
name: db
description: "Skill for the Db area of home-inventory. 27 symbols across 13 files."
---

# Db

27 symbols | 13 files | Cohesion: 85%

## When to Use

- Working with code in `src/`
- Understanding how slugify, GET, POST work
- Modifying db-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/lib/server/db/lots.ts` | attachLots, listItemLots, getItemWithLots, consumeItemQuantity, normalizeLots (+3) |
| `src/lib/server/db/relations.ts` | createCategory, searchTags, upsertTagByName, setItemTags, getItemCategoryIds (+1) |
| `src/lib/server/db/index.ts` | getRawDb, all, get |
| `src/lib/utils.ts` | slugify |
| `src/routes/api/tags/+server.ts` | GET |
| `src/routes/api/categories/+server.ts` | POST |
| `src/lib/server/db/seed.ts` | seedCategories |
| `src/routes/+page.server.ts` | load |
| `src/routes/items/+page.server.ts` | load |
| `src/lib/server/db/snapshot.ts` | getInventorySnapshot |

## Entry Points

Start here when exploring this area:

- **`slugify`** (Function) — `src/lib/utils.ts:9`
- **`GET`** (Function) — `src/routes/api/tags/+server.ts:4`
- **`POST`** (Function) — `src/routes/api/categories/+server.ts:8`
- **`seedCategories`** (Function) — `src/lib/server/db/seed.ts:18`
- **`createCategory`** (Function) — `src/lib/server/db/relations.ts:10`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `slugify` | Function | `src/lib/utils.ts` | 9 |
| `GET` | Function | `src/routes/api/tags/+server.ts` | 4 |
| `POST` | Function | `src/routes/api/categories/+server.ts` | 8 |
| `seedCategories` | Function | `src/lib/server/db/seed.ts` | 18 |
| `createCategory` | Function | `src/lib/server/db/relations.ts` | 10 |
| `searchTags` | Function | `src/lib/server/db/relations.ts` | 25 |
| `upsertTagByName` | Function | `src/lib/server/db/relations.ts` | 42 |
| `setItemTags` | Function | `src/lib/server/db/relations.ts` | 71 |
| `load` | Function | `src/routes/+page.server.ts` | 5 |
| `load` | Function | `src/routes/items/+page.server.ts` | 4 |
| `getInventorySnapshot` | Function | `src/lib/server/db/snapshot.ts` | 4 |
| `attachLots` | Function | `src/lib/server/db/lots.ts` | 36 |
| `GET` | Function | `src/routes/api/sync/snapshot/+server.ts` | 4 |
| `getItemCategoryIds` | Function | `src/lib/server/db/relations.ts` | 90 |
| `getItemTagNames` | Function | `src/lib/server/db/relations.ts` | 97 |
| `listItemLots` | Function | `src/lib/server/db/lots.ts` | 25 |
| `getItemWithLots` | Function | `src/lib/server/db/lots.ts` | 40 |
| `consumeItemQuantity` | Function | `src/lib/server/db/lots.ts` | 61 |
| `load` | Function | `src/routes/items/[id]/edit/+page.server.ts` | 15 |
| `PATCH` | Function | `src/routes/api/items/[id]/qty/+server.ts` | 12 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `POST → ListItemLots` | cross_community | 4 |
| `GET → ListItemLots` | cross_community | 4 |
| `Load → ListItemLots` | cross_community | 3 |
| `POST → All` | cross_community | 3 |
| `POST → All` | cross_community | 3 |
| `POST → NormalizeLots` | cross_community | 3 |
| `POST → InsertItemLots` | cross_community | 3 |
| `Load → ListItemLots` | intra_community | 3 |
| `Load → All` | cross_community | 3 |
| `PATCH → NormalizeLots` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Check-expiry | 2 calls |
| Ai | 1 calls |

## How to Explore

1. `gitnexus_context({name: "slugify"})` — see callers and callees
2. `gitnexus_query({query: "db"})` — find related execution flows
3. Read key files listed above for implementation details
