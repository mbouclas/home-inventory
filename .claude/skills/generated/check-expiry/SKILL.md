---
name: check-expiry
description: "Skill for the Check-expiry area of home-inventory. 15 symbols across 4 files."
---

# Check-expiry

15 symbols | 4 files | Cohesion: 94%

## When to Use

- Working with code in `src/`
- Understanding how todayIso, daysUntil, expiryStatus work
- Modifying check-expiry-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/routes/api/cron/check-expiry/+server.ts` | timingSafeEqual, renderEmail, row, section, escapeHtml (+1) |
| `src/lib/expiry.ts` | todayIso, daysUntil, expiryStatus, formatExpiryLabel |
| `src/lib/offline/inventory-store.svelte.ts` | sortItems, sortedItems, dashboard |
| `src/lib/server/mail.ts` | getTransporter, sendMail |

## Entry Points

Start here when exploring this area:

- **`todayIso`** (Function) — `src/lib/expiry.ts:4`
- **`daysUntil`** (Function) — `src/lib/expiry.ts:12`
- **`expiryStatus`** (Function) — `src/lib/expiry.ts:20`
- **`formatExpiryLabel`** (Function) — `src/lib/expiry.ts:29`
- **`getTransporter`** (Function) — `src/lib/server/mail.ts:5`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `todayIso` | Function | `src/lib/expiry.ts` | 4 |
| `daysUntil` | Function | `src/lib/expiry.ts` | 12 |
| `expiryStatus` | Function | `src/lib/expiry.ts` | 20 |
| `formatExpiryLabel` | Function | `src/lib/expiry.ts` | 29 |
| `getTransporter` | Function | `src/lib/server/mail.ts` | 5 |
| `sendMail` | Function | `src/lib/server/mail.ts` | 20 |
| `POST` | Function | `src/routes/api/cron/check-expiry/+server.ts` | 55 |
| `sortItems` | Function | `src/lib/offline/inventory-store.svelte.ts` | 5 |
| `timingSafeEqual` | Function | `src/routes/api/cron/check-expiry/+server.ts` | 9 |
| `renderEmail` | Function | `src/routes/api/cron/check-expiry/+server.ts` | 16 |
| `row` | Function | `src/routes/api/cron/check-expiry/+server.ts` | 17 |
| `section` | Function | `src/routes/api/cron/check-expiry/+server.ts` | 29 |
| `escapeHtml` | Function | `src/routes/api/cron/check-expiry/+server.ts` | 51 |
| `sortedItems` | Method | `src/lib/offline/inventory-store.svelte.ts` | 56 |
| `dashboard` | Method | `src/lib/offline/inventory-store.svelte.ts` | 60 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `POST → TodayIso` | intra_community | 4 |
| `Dashboard → TodayIso` | intra_community | 4 |
| `POST → GetTransporter` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "todayIso"})` — see callers and callees
2. `gitnexus_query({query: "check-expiry"})` — find related execution flows
3. Read key files listed above for implementation details
