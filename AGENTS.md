# AGENTS.md — working on Housy

Read this first. It applies to any AI coding tool or human contributor.

## What this product is
"Urban Company for whole projects" for home Build / Renovate / Interiors. The core loop must not drift:
**pick city → pick project → instant estimate → paid expert first-visit → fixed quote → milestones with photo proof → approve-then-pay.**
Full rationale: `docs/PRODUCT_DIRECTION.md`. Current status: `docs/FEATURES.md`. If a change doesn't serve the loop, question it.

## Where things live (active code is `apps/web` only)
- `src/lib/catalog.ts` — project types, phases, rates, `estimate()`. **Pure; used in browser and server.** Rates are placeholders.
- `src/lib/cities.ts` — 20 cities, cost multipliers, `live`/`soon`. Only `live` cities accept bookings (others → waitlist).
- `src/lib/pros.ts` — seed crews per city. `proForTrade` throws `NoCoverageError` rather than assigning another city's crew.
- `src/lib/projects.ts` — project types + the **state machine** (`act()`), ownership-scoped. All money math lives here.
- `src/lib/auth.ts`, `sms.ts` — OTP login, signed session cookie, rate limits, SMS provider (MSG91 or demo mode).
- `src/lib/profile.ts` (server) / `profile-shared.ts` (browser-safe) — sign-up profile.
- `src/lib/uploads.ts` — image validation (magic bytes) + local storage. `admin.ts` — ops summary, allow-listed phones.
- `src/lib/kv.ts` — JSON-file store with a process-wide lock + atomic writes. **Every store goes through it.**
- `src/lib/http.ts` — the single domain-error → HTTP status map. Add new error classes there.
- `src/app/api/**` — thin route handlers: `requireSession()` → call lib → `errorResponse(e)`.

## Rules that are easy to break
1. **Client components must never import server-only modules at runtime** (`kv`, `projects`, `profile`, `uploads`, `auth`, `admin`, `waitlist` pull in `fs`/`next/headers` and break `next build`). `import type` is fine. Shared constants go in browser-safe files (`limits.ts`, `profile-shared.ts`, `catalog.ts`).
2. **Ownership is enforced inside `lib/projects.ts`** (`getProject(id, owner)`, `act(id, action, owner)`), not in routes. A project you don't own must look like it doesn't exist (404, never 403).
3. **Only mutate stored data inside `withJson`/`tx`.** If a change must persist even on failure (e.g. failed OTP attempts) return a result object; a thrown error discards the write.
4. **Money**: milestone amounts + advance must always equal the quote (last milestone absorbs rounding). Tests guard this — don't weaken them.
5. Never trust client input: validate in `validateCreate` / `validateProfile` / `decodeDataUrl`. Enums are checked with `hasOwnProperty` (so `__proto__` can't pass).
6. Uploads: identify by magic bytes; only JPEG/PNG/WebP; served private, `nosniff`. No SVG.
7. Structural work (walls, new house, full renovation) must always include an engineer/architect phase.
8. Adding a project type = add to `PROJECT_TYPES` **and** make sure every live city has crew for each phase trade + the first-visit expert (`catalog.test.ts` enforces this).

## Commands (run from `apps/web`)
`npm test` · `npm run typecheck` · `npm run lint` · `npm run build` · `npm run dev`
Run all four checks before pushing; CI runs them too.

## Local dev notes
- Login in dev = **demo mode** (code shown on screen). In `next start` (production mode) set `HOUSY_DEV_OTP=1` and `HOUSY_SESSION_SECRET=anything` to test the same way.
- Data lives in `apps/web/.data/` (git-ignored). Delete the folder to reset.
- `apps/backend` and `apps/mobile` are legacy and **not connected** — don't assume the web app talks to them.
- If `next build` says it can't find `react-dom`, the lockfile drifted: don't hack `NODE_PATH`; fix the dependency tree (see git history for `fix(deps)`).

## Placeholders that need real data / keys (see docs/FEATURES.md)
Rates & city multipliers · seed crews · MSG91 (untested) · payments (simulated) · Supabase (schema/migration written, untested, app still uses JSON files).
