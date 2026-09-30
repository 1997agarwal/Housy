# Housy — Product Direction (north star)

**Housy is Urban Company for whole-project work.**
Urban Company / Snabbit book *tasks* (fix a tap, cut hair). A homeowner who wants "a new bathroom",
"this wall gone" or "the house rewired" still has to find, judge, sequence and supervise several trades by themselves.
Housy owns that job end to end — especially for the metro/NRI owner who cannot be on site.

## The core loop (what every feature must serve)
1. **Pick a project** (not a trade). 2. **Instant phase-wise estimate** from size, city, quality.
3. **Book a paid site visit** — a verified expert (structural engineer where walls/structure are involved) measures and assesses.
4. **Fixed-scope quote**, itemised by phase, 15% contingency shown, 20% advance.
5. **Verified crews execute in the right order**; the owner approves each milestone before it is paid.

If a feature does not make this loop faster, safer or more trusted, it does not ship yet.

## Decisions taken (change freely — they are recorded here on purpose)
- **Web first** (`apps/web`, responsive): metro/NRI owners plan on laptops. Mobile app stays as-is until the loop is proven.
- **Project-first, not marketplace-first.** The POC/Mistri model remains the supply side; POCs are *assigned to phases*, not browsed by the owner.
- **Milestone payments are in the MVP** (deviation from PRD v0.2, which deferred escrow to v2): an absent owner cannot verify work, so approve-then-pay is the trust mechanism. Currently simulated — no gateway.
- **Structural work always includes an engineer phase.** Non-negotiable safety rule from the PRD.
- **Multi-city from day one.** The homeowner picks the city where the *property* is (header picker, remembered per browser). It drives cost multipliers, which crews are shown, and who gets assigned. Registry: `apps/web/src/lib/cities.ts` (mirrored by `apps/backend/supabase/migrations/001_cities.sql`).
- **Live vs coming-soon cities.** Only cities with onboarded crews (`live`: Bareilly, Lucknow) accept site-visit bookings. Elsewhere the user still gets an estimate, and booking becomes a waitlist. We never assign a crew from another city and never invent workers for a city we haven't onboarded.
- **Going live in a new city** = onboard crews via field agents, then flip `status` to `live` (plus real rate calibration for that city).
- **Phone-OTP login; every project belongs to the verified phone.** Signed httpOnly session cookie (30 days). OTPs are hashed, expire in 5 min, are single-use, lock after 5 wrong tries, and can be re-requested every 30 s. Someone else's project returns 404 (not 403) so IDs can't be probed. The phone on a booking is the *site contact* (e.g. a caretaker) and may differ from the account phone.
- **OTP delivery is pluggable** (`lib/sms.ts`): MSG91 when `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID` are set; otherwise *demo mode* shows the code on screen (automatic in `npm run dev`; in production only with `HOUSY_DEV_OTP=1` — anyone can then log in as anyone, so public demos only). Production without either refuses to send. `HOUSY_SESSION_SECRET` is mandatory in production.
- Store is a JSON file (`apps/web/.data`, gitignored) behind `src/lib/projects.ts`; swap for Supabase without touching callers.

## What is real vs. simulated in the current build
| Real | Simulated / placeholder |
|---|---|
| Phone-OTP login, sessions, per-user ownership, City registry, per-city pricing/crews, waitlist, estimate engine (`lib/catalog.ts`), validation, state machine with guarded transitions, persistence, concurrency-safe writes | All rates and city cost multipliers (placeholders — calibrate with real quotes per city) |
| Responsive UI for the whole loop | Experts/crews are seed data; "Simulate:" buttons stand in for the expert/crew apps |
| | MSG91 sending is written but not yet verified against a live account |
| | No payment gateway, no notifications, no photos |

## Next (in order)
0. Onboard real crews for Bareilly/Lucknow (replace seed data in `lib/pros.ts`) and calibrate rates.
1. ~~Auth (phone OTP) + per-user projects~~ — done.
2. Supabase-backed store (needs a Supabase project + keys; also enables serverless hosting); real POC data + field-agent onboarding app; WhatsApp dispatch to POCs.
3. Expert visit app: measurements, photos, editable quote (scope changes = written change orders).
4. Photo proof per milestone; Razorpay milestone payments.
5. Hindi UI; AI advisor (Gemini) feeding the intake questions and quote findings.
6. Bring the mobile app onto the same API.
