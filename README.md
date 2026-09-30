# 🏠 Housy

**Build it. Renovate it. Design it.** Housy is the one place a homeowner — especially one who lives in another city —
goes to build, renovate and do the interiors of a home, with verified experts, a fixed price, and milestone payments
they approve after seeing photo proof.

Think *Urban Company for whole projects*: not "fix a tap", but "add a bathroom", "redo my kitchen", "design my flat",
"build my house".

## The customer journey
1. Pick your **city** (20 cities; Bareilly & Lucknow live, the rest on a waitlist).
2. Pick a **project** — Build, Renovate or Interiors — and get an instant phase-wise estimate.
3. Book a paid first visit: site visit / design consultation / plot visit (architect, designer, engineer or mason).
4. The expert measures on site → you get a **fixed quote** (re-priced from real measurements).
5. Accept → verified crews are assigned per phase. Each milestone needs **photo proof**; you approve, then it's paid.

## Quick start (web app)
```bash
git clone https://github.com/1997agarwal/Housy.git && cd Housy
npm install                      # installs all workspaces (web, mobile, backend); use --workspace=apps/web for just the web app
cp apps/web/.env.example apps/web/.env.local     # optional for local dev
npm run web                      # → http://localhost:3000
```
In dev, **SMS login runs in demo mode**: the 6-digit code is shown on screen, no SMS is sent. Any Indian mobile number works.

| Command (from `apps/web`) | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm test` | 70+ unit tests (pricing, project state machine, ownership, auth, uploads, admin) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next + TypeScript rules) |
| `npm run build` | Production build |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests and build on every push and PR.

Data is stored as JSON under `apps/web/.data/` (git-ignored) so everything runs with **no external services**.
To operate as an admin, set `HOUSY_ADMIN_PHONES=<your number>` and open `/admin`.

## Repo map
```
apps/web/            ← THE PRODUCT. Next.js 15 (App Router) + Tailwind 4. UI, API routes, domain logic.
  src/lib/           catalog (project types + pricing), cities, pros (seed crews), projects (state machine),
                     auth (OTP + sessions), profile, uploads, admin, kv (JSON store)
  src/app/           pages + /api routes
apps/backend/        legacy NestJS API (not connected) — see docs/LEGACY_BACKEND_MOBILE.md
apps/mobile/         legacy Expo app (not connected)
packages/shared/     shared TS types (legacy apps)
docs/                SPEC.md (spec) · FEATURE_DECK.md + deck.html (features & roadmap) · PRODUCT_DIRECTION.md (why & decisions) · FEATURES.md (detailed inventory)
PRD_v0.2.md, MVP_Scope_v0.2.md, wireframes_*.jpg    original product docs
AGENTS.md            start here if you are an AI coding tool
```

## Read next
- [`docs/SPEC.md`](docs/SPEC.md) — product & technical specification.
- [`docs/FEATURE_DECK.md`](docs/FEATURE_DECK.md) — every feature with status, and the roadmap (slides: `docs/deck.html`).
- [`docs/FEATURES.md`](docs/FEATURES.md) — exactly what works, what's simulated, what's next.
- [`docs/PRODUCT_DIRECTION.md`](docs/PRODUCT_DIRECTION.md) — north star and the decisions taken.
- [`AGENTS.md`](AGENTS.md) — conventions and gotchas for anyone (human or AI) changing the code.
