---
name: ai
description: "Skill for the Ai area of home-inventory. 8 symbols across 6 files."
---

# Ai

8 symbols | 6 files | Cohesion: 82%

## When to Use

- Working with code in `src/`
- Understanding how POST, GET, load work
- Modifying ai-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/lib/server/ai/extract.ts` | getClient, extractFromImageUrl |
| `src/lib/server/ai/classify.ts` | getClient, classifyItem |
| `src/routes/api/extract/+server.ts` | POST |
| `src/routes/api/categories/+server.ts` | GET |
| `src/routes/items/new/+page.server.ts` | load |
| `src/lib/server/db/relations.ts` | listCategories |

## Entry Points

Start here when exploring this area:

- **`POST`** (Function) — `src/routes/api/extract/+server.ts:7`
- **`GET`** (Function) — `src/routes/api/categories/+server.ts:4`
- **`load`** (Function) — `src/routes/items/new/+page.server.ts:13`
- **`listCategories`** (Function) — `src/lib/server/db/relations.ts:4`
- **`extractFromImageUrl`** (Function) — `src/lib/server/ai/extract.ts:37`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `POST` | Function | `src/routes/api/extract/+server.ts` | 7 |
| `GET` | Function | `src/routes/api/categories/+server.ts` | 4 |
| `load` | Function | `src/routes/items/new/+page.server.ts` | 13 |
| `listCategories` | Function | `src/lib/server/db/relations.ts` | 4 |
| `extractFromImageUrl` | Function | `src/lib/server/ai/extract.ts` | 37 |
| `classifyItem` | Function | `src/lib/server/ai/classify.ts` | 22 |
| `getClient` | Function | `src/lib/server/ai/extract.ts` | 5 |
| `getClient` | Function | `src/lib/server/ai/classify.ts` | 9 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `POST → EnsureConfigured` | cross_community | 3 |
| `POST → GetClient` | intra_community | 3 |
| `POST → All` | cross_community | 3 |
| `POST → GetClient` | intra_community | 3 |
| `Load → All` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Server | 1 calls |
| Db | 1 calls |

## How to Explore

1. `gitnexus_context({name: "POST"})` — see callers and callees
2. `gitnexus_query({query: "ai"})` — find related execution flows
3. Read key files listed above for implementation details
