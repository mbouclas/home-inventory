# Important
use bun runtime only


## Code Index (SymDex)

This project is indexed in SymDex under the name **`aggregators-scraper-crawlee`**.

SymDex is an MCP server that provides token-efficient symbol lookup, semantic search, and call graph queries over a pre-built index. It avoids the need to read whole files to find a function.

### Required: reindex before every task

Before starting any task, call `index_folder` to ensure the index reflects the current state of the codebase:

```json
{ "tool": "index_folder", "path": ".", "name": "aggregators-scraper-crawlee" }
```

### When to use SymDex

| Goal | Tool |
|---|---|
| Find a function or class by name | `search_symbols` |
| Read a specific function's source | `get_symbol` with byte offsets from `search_symbols` |
| Find code by what it does | `semantic_search` |
| List all symbols in a file | `get_file_outline` |
| Understand project structure | `get_repo_outline` |
| Find all callers of a function | `get_callers` |
| Find what a function calls | `get_callees` |
| Check index is fresh | `get_index_status` |

### Rules for agents

1. Never read a full file to find a function — call `search_symbols` or `semantic_search` first.
2. Use byte offsets returned by symbol search to read only the target symbol via `get_symbol`.
3. Re-index after modifying source files using `index_folder` or `invalidate_cache`.


You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

# Knowledge
if after a task was successfully completed, and you find something useful that is worth documenting for future reference, you can add it to the AGENTS.md file. This can include tips, best practices, or any insights that could help in future tasks. Always ensure that the information is clear and concise for easy reference. Also business logic or any important information that is not code but is relevant to the project can be added here.

## Auth gotcha
- If logged-in UI is visible but vote/favorite actions return `401` or open the login dialog, check for URI-encoded `session_token` cookies first.
- This happened on the recipe page vote flow: `session_user` was present so the UI looked authenticated, but the raw `session_token` cookie from the request header was still encoded and failed downstream auth.
- The normalization fix lives in `src/lib/server/auth-session.ts` and should safely `decodeURIComponent()` the token before using it.
- If this regresses, verify both `src/routes/api/votes/+server.ts` and `src/routes/api/favorites/+server.ts`, plus the regression test in `src/lib/server/__tests__/auth-session.test.ts`.

## Admin service auth gotcha
- For admin-only backend services under `/admin/*`, a decoded `locals.sessionToken` may still fail downstream if the backend expects the bearer token in its URI-encoded form.
- This surfaced in the glossary admin flow and again in seasons: the admin UI was authenticated locally, but direct server-load calls to the remote admin API returned `401 Not authenticated` until the token was re-encoded before sending the `Authorization` header.
- Follow the glossary pattern in `src/lib/services/admin-glossary.service.ts`: add a small `normalizeAdminToken()` helper that uses `encodeURIComponent(token)` and use it for every admin CRUD call made through `BaseHttpService`.
- Also mirror the glossary service-factory wiring: instantiate admin-only services without `INTERNAL_API_KEY` unless the backend explicitly requires it. `adminGlossary` and `season` should use `new ...Service(BASE_API_URL)`, not `new ...Service(BASE_API_URL, INTERNAL_API_KEY)`.
- Apply the same rule to new admin services such as `src/lib/services/season.service.ts` when they talk directly to `/admin/...` backend routes from server loads.
- If an admin page loads with a banner like `Not authenticated` while the same user is visibly logged in, compare the working glossary service against the new admin service first.

## User service auth gotcha
- For normal user-authenticated backend services such as `/favorites`, `/votes`, and `/user/recently-viewed`, the backend may also expect the bearer token in its URI-encoded form even when the frontend has already decoded the `session_token` cookie for local auth checks.
- This surfaced in local verification for favorites and recently viewed: page auth looked valid, but same-origin API routes still returned `401` until the token was re-encoded before being forwarded by `BaseHttpService`.
- The shared fix lives in `src/lib/services/base-http.service.ts`: normalize bearer tokens with `encodeURIComponent(token)` unless the token is already encoded.
- If authenticated page loads work but browser-side POST/GET calls to same-origin API routes return `401`, compare the token form sent in the downstream `Authorization` header first.

## Content markdown pages
- Markdown-backed pages live in the top-level `content/` directory and are routed through `/content/[slug]`.
- Use frontmatter keys `title`, `description`, `publishedAt`, `updatedAt`, `robots`, `image`, `featured`, `section`, and `type`.
- `publishedAt` and `updatedAt` must be valid date strings; invalid values fail parsing in `src/lib/content/pages.ts`.
- `image` should point to a public asset under `static/` such as `/images/...`; it is used both in the `/content` index cards and in page SEO metadata.
- `featured: true` pushes a page to the top of its sort order before date-based ordering.
- `section` groups cards on `/content`, while `type` is used for secondary badges and filtering.

## SEO redirect inventory
- Track old-to-new URL migrations in `docs/seo-redirect-inventory.md`.
- Update the inventory whenever adding or changing legacy redirects so canonical mappings and test coverage stay easy to review.

## SymDex Code Navigation
This repo is indexed with SymDex (repo name: `pastry-sveltekit`).
### Navigation Policy
**Prefer SymDex MCP tools for code discovery over full-file reads.**
Only read full files when SymDex results are insufficient for the task.
### Available Tools & Use Cases
- **`search_symbols`** - Find functions, classes, components, and methods by name
  - Example: Find `RecipeCard` component, `searchRecipes` function, or `UserService` class
  
- **`semantic_search`** - Search by what code does, not what it's called
  - Example: "validate email addresses" finds validation functions even if you don't know the exact name
- **`search_text`** - Search code content when you know keywords but not symbol names
  - Example: Find all files using "algoliasearch" or "prisma"
- **`get_symbol`** - Read only the specific symbol definition (not the entire file)
  - Efficient for reading individual functions or components
  
- **`get_file_outline`** - See all symbols in a file without reading full content
  - Useful for understanding file structure before reading specific parts
- **`search_routes`** - Inspect HTTP endpoints (GET, POST, etc.)
  - SvelteKit API routes in `src/routes/api/**`
  - Find all recipe endpoints, auth endpoints, etc.
- **`get_callers` / `get_callees`** - Impact analysis before making changes
  - Example: Find what calls a function before refactoring it
### Keeping Index Current
**Option 1: Automatic (Recommended)**
Run once at the start of your session:
```bash
symdex watch I:\Work\pastry-sveltekit --interval 5
The index automatically updates on every file save/delete. No manual re-indexing needed.
Option 2: Manual
After making code changes, re-index:
symdex index I:\Work\pastry-sveltekit --name pastry-sveltekit
Only changed files are re-processed (SHA-256 detection).
Option 3: Invalidate specific files
symdex invalidate --repo pastry-sveltekit --file src/lib/utils/auth.ts
Operational Guidance
1. Current repo: Always use repo name pastry-sveltekit in tool calls
2. After code changes: Use symdex watch for automatic updates, or re-run symdex index manually
3. Avoid unnecessary reads: Don't read entire files just to find a symbol - use SymDex tools first
Project-Specific Tips
- Components: Search for .svelte components in src/lib/components/
- API Routes: Use search_routes to find endpoints in src/routes/api/
- Services: Look for business logic in src/lib/services/
- Server code: Check src/lib/server/ for server-only utilities
- Types: TypeScript types are in src/lib/types/
```
MCP Tools for Reindexing:
1. index_folder - Index or re-index a folder
{
  "tool": "index_folder",
  "path": "I:\\Work\\pastry-sveltekit",
  "name": "pastry-sveltekit"
}
- Indexes a local folder
- Re-run to re-index (uses SHA-256 to only process changed files)
- Use this when the repo isn't indexed yet, or to do a full refresh
2. index_repo - Re-index a named, registered repo
{
  "tool": "index_repo",
  "name": "pastry-sveltekit",
  "path": "I:\\Work\\pastry-sveltekit"
}
- Re-indexes a repo that's already in the registry
- Cleaner when you already have the repo registered
3. invalidate_cache - Force re-index specific files or entire repo
{
  "tool": "invalidate_cache",
  "repo": "pastry-sveltekit"
}
Or for a specific file:
{
  "tool": "invalidate_cache",
  "repo": "pastry-sveltekit",
  "file": "src/lib/utils/auth.ts"
}
- Forces re-index on next request
- Can target specific files or entire repo
Updated AGENTS.md with MCP Tool Guidance:
## SymDex Code Navigation
This repo is indexed with SymDex (repo name: `pastry-sveltekit`).
### Navigation Policy
**Prefer SymDex MCP tools for code discovery over full-file reads.**
Only read full files when SymDex results are insufficient for the task.
### Available Tools & Use Cases
**Symbol Discovery:**
- **`search_symbols`** - Find functions, classes, components, and methods by name
  - Example: Find `RecipeCard` component, `searchRecipes` function, or `UserService` class
  
- **`semantic_search`** - Search by what code does, not what it's called
  - Example: "validate email addresses" finds validation functions even if you don't know the exact name
- **`search_text`** - Search code content when you know keywords but not symbol names
  - Example: Find all files using "algoliasearch" or "prisma"
**Reading Code:**
- **`get_symbol`** - Read only the specific symbol definition (not the entire file)
  - Efficient for reading individual functions or components
  
- **`get_file_outline`** - See all symbols in a file without reading full content
  - Useful for understanding file structure before reading specific parts
**API & Routes:**
- **`search_routes`** - Inspect HTTP endpoints (GET, POST, etc.)
  - SvelteKit API routes in `src/routes/api/**`
  - Find all recipe endpoints, auth endpoints, etc.
**Impact Analysis:**
- **`get_callers` / `get_callees`** - Impact analysis before making changes
  - Example: Find what calls a function before refactoring it
**Index Management:**
- **`index_folder`** - Index or re-index the entire project
  - Use when starting a session or after major changes
  
- **`invalidate_cache`** - Force re-index of specific files or entire repo
  - Use after editing files to ensure index is current
  - Can target individual files: `{"repo": "pastry-sveltekit", "file": "src/lib/utils.ts"}`
  - Or entire repo: `{"repo": "pastry-sveltekit"}`
### Operational Guidance
1. **At session start**: Call `index_folder` if the repo isn't indexed yet
2. **Current repo**: Always use repo name `pastry-sveltekit` in tool calls
3. **After code changes**: Call `invalidate_cache` for changed files, or `index_folder` to re-index everything
4. **Avoid unnecessary reads**: Don't read entire files just to find a symbol - use SymDex tools first
### Project-Specific Tips
- **Components**: Search for `.svelte` components in `src/lib/components/`
- **API Routes**: Use `search_routes` to find endpoints in `src/routes/api/`
- **Services**: Look for business logic in `src/lib/services/`
- **Server code**: Check `src/lib/server/` for server-only utilities
- **Types**: TypeScript types are in `src/lib/types/`
### Repo Configuration
- **Repo name**: `pastry-sveltekit`
- **Repo path**: `I:\Work\pastry-sveltekit`


# Lessons

Lessons capture knowledge from prior sessions that cannot be expressed as executable code. They are a **last resort**, not the default place to record what you learned. Prefer tests, lint rules, canonical examples, and ADRs — in that order — before writing a lesson.

## Loading Lessons

Do not read the `lessons/` directory at session start. It is loaded on demand.

1. At session start, read only `lessons/INDEX.md`. Nothing else from `lessons/`.
2. Before editing any module, grep `INDEX.md` for: the module name, the filenames you will touch, and the domain concept of the change (e.g. `migration`, `auth`, `cache`, `idempotency`).
3. Open a full lesson file only when a tag, title, or file path in the index matches your current task. Do not speculatively load lessons because they "might be relevant."
4. If you load a lesson and it does not apply, say so in your response. It signals that the lesson's tags need tightening.

If `lessons/INDEX.md` is missing or older than any file in `lessons/`, regenerate it with `scripts/lessons_index.sh` before relying on it.

## Writing a Lesson

Before writing a lesson, walk this ladder and stop at the first rung that fits:

1. **Regression test** — the knowledge is "X breaks when Y." Write the test.
2. **Lint / semgrep / AST rule** — the knowledge is "we don't do pattern Z here." Encode the rule.
3. **Pre-commit or CI assertion** — the knowledge is "A and B must stay in sync." Write the check.
4. **Canonical example** — the knowledge is "here's how we do this pattern." Add or update a file under `examples/` and reference it from the nearest `AGENTS.md`.
5. **ADR** — the knowledge is an architectural *why* with tradeoffs.
6. **Lesson** — only if none of the above fit.

Do not write lessons for: syntax reminders, style rules a linter could enforce, "don't forget to…" notes that belong in tests, or restatements of what the code already shows. If you cannot answer the question "why isn't this a test or rule?" in one sentence, it should not be a lesson.

## Lesson File Format

One lesson per file. Path: `lessons/YYYY-MM-DD-short-slug.md`. All fields required; use `N/A` only when truly inapplicable.

```markdown
---
id: 2026-04-24-payments-idempotency-keys
tags: [payments, idempotency, stripe, retries]
files: [src/payments/processor.py, src/payments/webhook.py]
related_commits: [a3f2c1b]
supersedes: []
expires_on_change_to: [src/payments/processor.py::process_charge]
last_verified: 2026-04-24
---

# Short, declarative title

## Context
One paragraph. What situation does this apply to? What signals should make a
future session load this lesson?

## Lesson
The actual knowledge. 3–8 sentences. If it's longer, it should have been an
ADR or a canonical example instead.

## Why not a test / lint / example
One or two sentences. If you can't answer this cleanly, delete the file and
write the executable version instead.

## Canary
A concrete artifact whose change invalidates this lesson — a file path, a
function signature, or a commit reference. This is what keeps the lesson
falsifiable.
```



### Field rules

- `id` matches the filename slug.
- `tags` are lowercase, kebab-case, 2–6 items. Include the module, the domain concept, and the failure mode. Tags are the only thing scanned at load time — make them discriminating, not generic (`general`, `python`, `backend` are banned).
- `files` lists exact paths. If any listed file is moved or deleted, the lesson is flagged for review.
- `supersedes` lists IDs of lessons this replaces. Move superseded files to `lessons/archive/` in the same commit.
- `expires_on_change_to` points at a path or symbol. CI compares its current state against `last_verified` and flags drift.
- `last_verified` is an ISO date. Bump it whenever you confirm the lesson still applies, even without edits.

## Retiring Lessons

Move a lesson to `lessons/archive/` when any of the following is true:

- The canary has fired and the lesson no longer matches reality.
- The knowledge has been promoted to a test, rule, or canonical example. Reference the replacement in the archived file's frontmatter before moving it.
- A superseding lesson has been written.
- The referenced files no longer exist.

Archived lessons are not indexed and are never loaded during sessions.

## End-of-Session Protocol

Before ending a non-trivial session, for each piece of knowledge gained, walk the ladder in *Writing a Lesson* and land it at the highest rung that fits. A session that produces multiple lessons and zero executable artifacts is a smell — reconsider whether those lessons should have been tests or rules.

## Review Cadence

Lessons whose `last_verified` is older than 90 days, or whose canary has fired, surface via `scripts/lessons_review.sh`. Each flagged lesson must be re-verified, rewritten, promoted to executable form, or archived. Lessons flagged across two consecutive review cycles are archived automatically.

## Anti-Patterns

- Lessons without a canary — they cannot visibly go stale, which is the exact failure mode this system exists to prevent.
- Lessons that restate what a well-named test or type already expresses.
- Lessons longer than ~8 sentences in the `Lesson` section — promote to an ADR or canonical example.
- Tags so broad they match every task and get ignored.
- Lesson count growing faster than test and rule count. The healthy trend is the opposite.

# Session Journal

The journal is working memory for an in-flight task — decisions made, paths rejected, and where to resume. It is **not** durable knowledge. Lessons, tests, rules, examples, and ADRs cover durable knowledge; the journal covers the narrative of the current task only.

Journals are per-task, not per-session. A task may span many sessions; each session updates the same journal file.

## Location and Lifecycle

- Path: `.agent/journal/<task-slug>.md`
- The `.agent/` directory is gitignored. Journals are local and ephemeral.
- One journal per active task. Do not create per-session files.
- When the task ships (merge, deploy, or abandonment), the journal is walked through the lessons ladder and then deleted. Journals never accumulate.

## Loading the Journal

Journal loading takes precedence over all other context sources.

1. At session start, before reading `CLAUDE.md`, `AGENTS.md`, or `lessons/INDEX.md`, check `.agent/journal/` for a file matching the user's stated task or current branch.
2. If a matching journal exists, read it in full. It is the highest-signal context available — decisions, rejected paths, and the explicit next step were written by you in a prior session.
3. If no journal matches but the task is non-trivial (more than ~30 minutes of expected work, or touches more than one module), create one before starting.
4. If the user's task clearly does not match any journal and is trivial, no journal is needed.

## Journal File Format

```markdown
---
task: migrate-payments-to-stripe-v2
started: 2026-04-22
status: in-progress
branch: feat/stripe-v2
---

## Goal
One paragraph describing what "done" looks like. Concrete enough that a cold
reader can tell whether a given change moves toward or away from it.

## Decisions
Chronological, dated. One line each. Include the *why*, briefly.
- 2026-04-22: chose webhook-first over polling — Stripe's retry semantics make polling redundant
- 2026-04-23: keeping old processor behind feature flag until refund parity confirmed

## Tried and rejected
What was considered and ruled out, with the reason. Prevents re-litigating
dead ends in the next session.
- Parallel dual-write: idempotency keys collide across versions
- Shadow mode in prod: ops vetoed

## Open questions
Unresolved items. Check them off or convert to Decisions as they resolve.
- [ ] Does the refund flow need the same migration path?
- [ ] Confirm retention policy with legal

## Next step
The single most important field. Must be concrete enough to act on cold:
a command to run, a file and line, or a specific question to answer.
"Continue the migration" is not a next step.
Example: "Resume by running `pytest tests/payments/test_webhook_v2.py::test_replay`
— it's red and the fix is probably in `processor.py:184`."
```

### Field rules

- `task` matches the filename slug.
- `status` is one of: `in-progress`, `blocked`, `paused`, `shipping`, `abandoned`.
- `branch` is the git branch the work lives on. Used to auto-match journals at session start.
- Sections may be empty but must be present. An empty `Tried and rejected` is meaningful information.

## Update Rules

- Update `Decisions` and `Tried and rejected` **inline**, as they happen, not at session end. End-of-session updates get skipped under time pressure; inline updates do not.
- Update `Next step` as the **last thing** before ending a session, every time. If the session ends without a concrete next step written, the journal has failed at its one job.
- Do not rewrite history. Journals are append-mostly; if a decision is reversed, add a new dated Decision entry rather than editing the old one.
- Do not let the journal grow unbounded. If `Decisions` passes ~20 entries or the file passes ~300 lines, the task is either too large (split it) or finished in substance (ship it and retire the journal).

## Interaction with /compact

If context compaction is imminent during a session, dump current state to the journal **before** compacting, not after. Post-compact summarization loses nuance; an explicit pre-compact journal update preserves it.

## Retirement Protocol

When a task ships or is abandoned, walk the journal through the lessons ladder before deleting it:

1. **Decisions** with lasting architectural weight → ADR.
2. **Tried and rejected** entries that future contributors might re-attempt → either a regression test that would fail on the rejected approach, a comment in the relevant file (`# rejected: <approach> because <reason>`), or, if neither fits, a lesson.
3. **Patterns discovered during the work** → canonical example under `examples/`, referenced from the nearest `AGENTS.md`.
4. **Open questions** that remain open → move to an issue tracker, not a lesson.
5. Delete the journal file.

A journal that retires without producing any of (1)–(4) is suspicious — either the task was trivial (fine, delete and move on) or knowledge is being lost (reconsider).

## Anti-Patterns

- Keeping journals after the task ships. They rot into a shadow docs folder — the exact anti-pattern this whole system exists to avoid.
- Committing journals to the repo. They are local working memory, not shared artifacts.
- Using a journal as a substitute for a lesson, ADR, or test. The journal is ephemeral by design; durable knowledge goes elsewhere.
- Vague `Next step` entries. If the next action cannot be taken cold by a future session, the field is not done.
- One journal covering multiple unrelated tasks. Split them.
- Editing past `Decisions` entries instead of appending new ones. Destroys the reasoning trail.

## Relationship to Lessons

| Concern | Goes in |
|---|---|
| "In this codebase, X is always true" | Lesson (or preferably test / rule / example) |
| "On this task, we decided X because Y" | Journal → ADR at retirement if durable |
| "On this task, we tried X and it failed" | Journal → test or code comment at retirement |
| "Resume here next time" | Journal `Next step` only |
| "This user prefers X" | Not here. AGENTS.md if it affects the codebase; otherwise nowhere. |

The journal feeds the lessons system at retirement time. It is never a substitute for it.