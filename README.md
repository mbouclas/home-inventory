# Home Pharmacy

A mobile-first SvelteKit app to track drugs and medical supplies at home: snap a photo of the box, GPT-4o pulls out name / dosage / expiry / barcode, and a daily email digest reminds you what's about to expire.

## Stack

- SvelteKit 2 (Svelte 5 runes) + `@sveltejs/adapter-node`
- SQLite via `better-sqlite3` + Drizzle ORM
- Tailwind v4 + hand-rolled shadcn-style components on `bits-ui` primitives
- OpenAI `gpt-4o` (vision + structured output) for photo extraction
- Cloudinary for photo storage
- Nodemailer over SMTP for the expiry digest

## Setup

```sh
npm install
cp .env.example .env       # fill in OpenAI / Cloudinary / SMTP / CRON_SECRET / NOTIFY_EMAIL
npm run db:migrate
npm run dev -- --host      # --host so your phone on the LAN can reach it
```

Open `http://<your-lan-ip>:5173` on your phone.

## Daily expiry digest (Windows Task Scheduler)

The cron endpoint is `POST /api/cron/check-expiry`, protected by a Bearer `CRON_SECRET`.

```powershell
# one-off manual fire
$env:CRON_SECRET = "<paste from .env>"
Invoke-RestMethod -Method POST `
  -Uri http://localhost:3000/api/cron/check-expiry `
  -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

To schedule daily at 08:00:

1. Task Scheduler → **Create Task…**
2. Triggers → daily, 08:00.
3. Actions → Start a program: `powershell.exe`, arguments:
   ```
   -NoProfile -Command "Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/cron/check-expiry -Headers @{ Authorization = 'Bearer YOUR_SECRET_HERE' }"
   ```

## Production

```sh
npm run build
node build           # adapter-node output
```

Set `PORT` (default 3000) and the same env vars used in dev. SQLite file lives at `DATABASE_PATH` (default `./data/pharmacy.db`).

## Scripts

| script | what it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` / `node build` | prod bundle and run it |
| `npm run check` | svelte-check + typecheck |
| `npm run db:generate` | new migration from `schema.ts` |
| `npm run db:migrate` | apply pending migrations |
| `npm run db:studio` | Drizzle Studio |

## Routes

| | |
|---|---|
| `/` | Dashboard — expiring soon / expired / low stock |
| `/items` | Full list with qty +/- and delete |
| `/items/new` | Manual add form |
| `/items/import` | Photo capture → AI extract → review |
| `/items/[id]/edit` | Edit form |
| `POST /api/extract` | Multipart photo → JSON of extracted fields |
| `PATCH /api/items/[id]/qty` | `{ delta }` or `{ quantity }` |
| `DELETE /api/items/[id]` | Delete + remove Cloudinary asset |
| `POST /api/cron/check-expiry` | Bearer-protected daily digest |
