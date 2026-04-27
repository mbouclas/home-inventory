---
name: server
description: "Skill for the Server area of home-inventory. 5 symbols across 3 files."
---

# Server

5 symbols | 3 files | Cohesion: 67%

## When to Use

- Working with code in `src/`
- Understanding how uploadPhoto, deletePhoto, POST work
- Modifying server-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/lib/server/cloudinary.ts` | ensureConfigured, uploadPhoto, deletePhoto |
| `src/routes/api/sync/operations/+server.ts` | POST |
| `src/routes/api/items/[id]/+server.ts` | DELETE |

## Entry Points

Start here when exploring this area:

- **`uploadPhoto`** (Function) — `src/lib/server/cloudinary.ts:19`
- **`deletePhoto`** (Function) — `src/lib/server/cloudinary.ts:31`
- **`POST`** (Function) — `src/routes/api/sync/operations/+server.ts:34`
- **`DELETE`** (Function) — `src/routes/api/items/[id]/+server.ts:5`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `uploadPhoto` | Function | `src/lib/server/cloudinary.ts` | 19 |
| `deletePhoto` | Function | `src/lib/server/cloudinary.ts` | 31 |
| `POST` | Function | `src/routes/api/sync/operations/+server.ts` | 34 |
| `DELETE` | Function | `src/routes/api/items/[id]/+server.ts` | 5 |
| `ensureConfigured` | Function | `src/lib/server/cloudinary.ts` | 4 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `POST → ListItemLots` | cross_community | 4 |
| `POST → EnsureConfigured` | cross_community | 3 |
| `POST → All` | cross_community | 3 |
| `POST → NormalizeLots` | cross_community | 3 |
| `POST → InsertItemLots` | cross_community | 3 |
| `POST → EnsureConfigured` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Db | 3 calls |

## How to Explore

1. `gitnexus_context({name: "uploadPhoto"})` — see callers and callees
2. `gitnexus_query({query: "server"})` — find related execution flows
3. Read key files listed above for implementation details
