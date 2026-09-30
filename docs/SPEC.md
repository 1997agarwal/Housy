# Housy — Product & Technical Specification

*Living document. Source of truth for behaviour is the code and its tests; this describes intent, structure and rules. Status of every feature: [FEATURE_DECK.md](FEATURE_DECK.md) and [FEATURES.md](FEATURES.md).*

## 1. Vision
**Housy is "Urban Company for whole projects"** — build, renovate and design the interiors of a home, end to end, for owners who can't be on site (metro and NRI owners with property in Tier-2/3 cities). Seed city: Bareilly, Uttar Pradesh.
Task apps book a *task*. Housy owns the *project*: it estimates, sends a verified expert to measure, fixes the price, assigns the right trades in the right order, and releases money only as the owner approves proven work.

## 2. Users and portals
| Portal | Who | Status | Purpose |
|---|---|---|---|
| **Customer** (`/`, `/plan`, `/projects`, `/my-home`, `/advisor`, `/workers`) | Property owner | Built | Plan, price, book, track, approve, pay, chat, review |
| **Crew / contractor** (`/partner`) | Mason, plumber, electrician, tiler, painter, carpenter, waterproofer, engineer | Registration, approval, matching and job offers built; **work screens not yet** | List themselves, set rates and offerings, get matched jobs, accept/decline, (next) run the work |
| **Interior designer** (`/partner`, kind = designer) | Designer / architect | Registration built; **designer workflow not yet** | List, set fee and styles, get matched for design consultations, deliver renders for approval |
| **Ops** (`/admin`) | Housy staff (allow-listed phones) | Built (English only) | Approve partners, run the support queue, see demand by city |

One login (phone + OTP) covers every role; a person can be a customer *and* a partner.

## 3. The core loop
1. Pick a **project** (not a trade) → 2. instant phase-wise **estimate** → 3. paid **first visit** by a verified expert (structural engineer where walls are involved; designer for interiors) → 4. **fixed quote**, itemised by phase, 15% contingency, 20% advance → 5. **matched crews execute in order**; every milestone needs **photo proof** and the owner's approval before payment → 6. **completion**, verified **reviews**.
Extra work is never verbal: **change orders** are priced first and added only when approved.

## 4. Architecture
- **Web app**: Next.js 15 (App Router) + React 19 + Tailwind 4 + TypeScript strict, in `apps/web`. Mobile (`apps/mobile`, Expo) and NestJS backend (`apps/backend`) are legacy and not connected.
- **Storage**: JSON files in `apps/web/.data/` behind `lib/kv.ts` (per-file lock on `globalThis`, atomic write-rename, fails loudly on unreadable files). Single-process only. Supabase schema exists but is unused (deferred by choice).
- **Module pattern**: `x.ts` server-only · `x-shared.ts` browser-safe (types, constants, validation) · client components never import server modules at runtime.
- **i18n**: English and Hindi. UI copy in `messages.ts` (parity-tested); data-level Hindi next to the data (`catalog.ts`, `catalog-hi.ts`, `materials.ts`, `advisor-hi.ts`); text the server generates stays English in storage and is translated at display by `server-text.ts` (source-scanning completeness test). Text people type is never translated.
- **Time**: all dates and visit slots are IST (`lib/time.ts`).
- **Errors**: domain errors (`ValidationError`, `NotFoundError`, `ConflictError`, `AuthError`, `PartnerError`, …) map to HTTP in `http.ts`; unknown errors are 500 and not leaked.

## 5. Domain model (file → shape)
| File | Contents |
|---|---|
| `db.json` | `Project[]` — owner phone, type, city, area, tier, estimate, visit (expert, slot), quote (total, advance, findings), milestones (pro, status, amount, offer, crew note, feedback), photos, changes (change orders), expenses, budget, timeline |
| `users.json` | `Profile` per phone — name, email, language, persona, city, property, goals, timeline |
| `partners.json` | `Partner` per id — phone, kind (crew/designer), status (pending/approved/suspended), city, locality, trades, services, dayRate / feePerSqft, styles, crewSize, years, bio, available, Housy ID |
| `reviews.json`, `issues.json`, `chat.json`, `waitlist.json`, `plans.json` (home plans), `otp.json`, `ratelimit.json` | as named |
| `.data/uploads/` | Site photos and voice notes (validated by magic bytes, private) |

## 6. Key rules (each has tests)
**Estimate.** Phases × line items (labor/material, basis fixed/area/drain) × city multiplier × quality tier; robust to NaN/absurd input; interiors price per selected room (rooms sum exactly to the total) with finish grades that scale a phase's materials; structural types always include an engineer phase.
**Quote.** Re-priced from the expert's on-site measurements (area, drain distance); rounded to a step that scales with job size; milestone amounts always sum to the quote; advance 20%.
**Milestones.** Strict order: start → (photo) submit → approve → paid. Submit needs ≥1 photo newer than the last change request. Owner may request changes up to 3 times per milestone. Design milestone must be approved before execution phases unlock. A project completes only when all milestones are paid and no change order is pending.
**Matching.** For each phase trade in the project's city: candidates = seed crews + approved, available partners who do that trade (and the project type, if they restricted it). Score = rating (blended with real reviews) × 20 + track record + experience − rate-outlier penalty; newcomers get a 4.4 baseline and a boost until 5 reviews. Among candidates within 8 points of the best, the one with the **fewest open milestones** gets the job. Never crosses cities.
**Offers.** Partner-crews get a *pending* offer per milestone; the owner cannot start a pending milestone. Accept → logged. Decline → next best match (excluding those who declined), logged; if nobody else exists the decline is refused. Seed crews are assigned outright.
**Partners.** Register → *pending* → ops approves (issues `HSY-<CITY>-P###`) → matchable. Changing city or trade sends an approved partner back to pending. Suspended partners are unmatchable.
**Auth.** Phone + OTP; codes hashed, single-use, 5-min expiry, 5 attempts, resend returns the same code; per-phone (5/h) and per-IP (10/h) limits; signed httpOnly session cookie (30 days).
**Privacy.** Owner data is scoped by phone (others get 404). Crews see city/area/amount, and the customer's first name only after accepting. Ops sees masked phones. Public review views never expose reviewer phones.
**Money.** Payments are **simulated** everywhere (advance, milestone release, visit fee).

## 7. HTTP API (all JSON, `force-dynamic`)
| Area | Routes |
|---|---|
| Auth | `POST /api/auth/request`, `POST /api/auth/verify`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Profile / plan | `GET·PUT /api/profile`, `GET·PUT /api/home-plan` |
| Catalog | `GET /api/cities`, `GET /api/pros?city&trade`, `POST /api/waitlist` |
| Projects | `GET·POST /api/projects`, `GET·POST /api/projects/:id` (actions), photos, reviews, issues, chat (+ audio, read, crew demo reply) |
| Support | `POST /api/issues/:id` |
| Partner | `GET·PUT /api/partner`, `GET·POST /api/partner/jobs` |
| Ops | `GET /api/admin`, `GET·POST /api/admin/issues…`, `GET·POST /api/admin/partners` |

## 8. Configuration
`HOUSY_SESSION_SECRET` (required in production) · `HOUSY_ADMIN_PHONES` (comma-separated ops phones) · `HOUSY_DEV_OTP=1` (show OTP on screen in production builds for testing) · `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID` (real SMS) · `TZ`.

## 9. Quality
- ~262 unit/integration tests (vitest), strict typecheck, ESLint, GitHub Actions CI (install → typecheck → lint → test → build).
- Real-browser (Playwright) scripts for every flow were run manually per feature; they are not yet checked into the repo.
- Deliberate-mutation checks were used on critical rules (safety advisor, money, ownership).
- Completeness tests guard Hindi (messages, server text, advisor, catalogue names, materials).

## 10. Known limitations
Payments, SMS and notifications are not connected · JSON store is single-process · crews cannot yet run work from their own portal (owner-page *demo controls* still exist) · rates and multipliers are placeholders · per-IP rate limit trusts `x-forwarded-for` · no CAPTCHA · seed crews have fake names · Hindi copy needs native review · ops console is English only.

## 11. Roadmap
See [FEATURE_DECK.md](FEATURE_DECK.md). In order: (1) crew work screens, (2) designer workflow + style/budget matching + product recommendations, (3) notifications (WhatsApp/SMS), (4) real payments, (5) Supabase storage + file storage, (6) field-agent app and ID cards, (7) AI advisor, photo-to-plan.
