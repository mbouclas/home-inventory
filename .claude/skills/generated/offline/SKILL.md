---
name: offline
description: "Skill for the Offline area of home-inventory. 25 symbols across 2 files."
---

# Offline

25 symbols | 2 files | Cohesion: 65%

## When to Use

- Working with code in `src/`
- Understanding how openOfflineDb, readSnapshot, readOperations work
- Modifying offline-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/lib/offline/inventory-store.svelte.ts` | queueOperation, refreshPendingCount, init, refreshSnapshot, applySnapshot (+11) |
| `src/lib/offline/db.ts` | requestToPromise, openOfflineDb, getAll, readSnapshot, readOperations (+4) |

## Entry Points

Start here when exploring this area:

- **`openOfflineDb`** (Function) — `src/lib/offline/db.ts:31`
- **`readSnapshot`** (Function) — `src/lib/offline/db.ts:60`
- **`readOperations`** (Function) — `src/lib/offline/db.ts:109`
- **`addOperation`** (Function) — `src/lib/offline/db.ts:115`
- **`writeSnapshot`** (Function) — `src/lib/offline/db.ts:84`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `openOfflineDb` | Function | `src/lib/offline/db.ts` | 31 |
| `readSnapshot` | Function | `src/lib/offline/db.ts` | 60 |
| `readOperations` | Function | `src/lib/offline/db.ts` | 109 |
| `addOperation` | Function | `src/lib/offline/db.ts` | 115 |
| `writeSnapshot` | Function | `src/lib/offline/db.ts` | 84 |
| `deleteOperations` | Function | `src/lib/offline/db.ts` | 122 |
| `requestToPromise` | Function | `src/lib/offline/db.ts` | 16 |
| `getAll` | Function | `src/lib/offline/db.ts` | 55 |
| `txDone` | Function | `src/lib/offline/db.ts` | 23 |
| `nextExpiry` | Function | `src/lib/offline/inventory-store.svelte.ts` | 19 |
| `totalQuantity` | Function | `src/lib/offline/inventory-store.svelte.ts` | 26 |
| `sortLots` | Function | `src/lib/offline/inventory-store.svelte.ts` | 30 |
| `withStock` | Function | `src/lib/offline/inventory-store.svelte.ts` | 38 |
| `operationId` | Function | `src/lib/offline/inventory-store.svelte.ts` | 14 |
| `queueOperation` | Method | `src/lib/offline/inventory-store.svelte.ts` | 220 |
| `refreshPendingCount` | Method | `src/lib/offline/inventory-store.svelte.ts` | 225 |
| `init` | Method | `src/lib/offline/inventory-store.svelte.ts` | 87 |
| `refreshSnapshot` | Method | `src/lib/offline/inventory-store.svelte.ts` | 123 |
| `applySnapshot` | Method | `src/lib/offline/inventory-store.svelte.ts` | 199 |
| `syncPending` | Method | `src/lib/offline/inventory-store.svelte.ts` | 229 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `AddStock → RequestToPromise` | cross_community | 6 |
| `ConsumeStock → RequestToPromise` | cross_community | 6 |
| `Init → RequestToPromise` | cross_community | 5 |
| `AddStock → OpenOfflineDb` | cross_community | 5 |
| `DeleteItem → OpenOfflineDb` | cross_community | 5 |
| `DeleteItem → RequestToPromise` | cross_community | 5 |
| `ConsumeStock → OpenOfflineDb` | cross_community | 5 |
| `Init → OpenOfflineDb` | cross_community | 4 |
| `Init → TxDone` | intra_community | 4 |
| `AddStock → TxDone` | cross_community | 4 |

## How to Explore

1. `gitnexus_context({name: "openOfflineDb"})` — see callers and callees
2. `gitnexus_query({query: "offline"})` — find related execution flows
3. Read key files listed above for implementation details
