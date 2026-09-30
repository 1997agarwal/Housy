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
- Store is a JSON file (`apps/web/.data`, gitignored) behind `src/lib/projects.ts`; swap for Supabase without touching callers.

## What is real vs. simulated in the current build
| Real | Simulated / placeholder |
|---|---|
| Estimate engine (`lib/catalog.ts`), validation, state machine with guarded transitions, persistence, concurrency-safe writes | All rates (placeholder, Bareilly baseline — calibrate with real quotes) |
| Responsive UI for the whole loop | Experts/crews are seed data; "Simulate:" buttons stand in for the expert/crew apps |
| | No auth, no payment gateway, no notifications, no photos |

## Next (in order)
1. Auth (phone OTP) + per-user projects (today `/projects` lists everything).
2. Supabase-backed store; real POC data + field-agent onboarding app; WhatsApp dispatch to POCs.
3. Expert visit app: measurements, photos, editable quote (scope changes = written change orders).
4. Photo proof per milestone; Razorpay milestone payments.
5. Hindi UI; AI advisor (Gemini) feeding the intake questions and quote findings.
6. Bring the mobile app onto the same API.
