# Housy — feature inventory

Legend: ✅ built & tested · 🟡 built but simulated / needs keys or real data · ⬜ not started.
"Tested" = covered by the automated suite (`npm test`, 70+ tests) and/or driven end-to-end in a real browser.

## 1. Accounts & onboarding
| Feature | Status | Notes |
|---|---|---|
| Phone-OTP login / sign-up (one flow) | ✅ | 6-digit code, hashed, single-use, 5-min expiry, 5-attempt lockout, 30 s resend gap |
| OTP abuse limits | ✅ | 5/hour per phone, 10/hour per IP. Per-IP relies on `x-forwarded-for` (spoofable without a trusted proxy — per-phone cap still holds) |
| Signed httpOnly session cookie (30 d), logout | ✅ | tamper/expiry tested |
| SMS delivery via MSG91 | 🟡 | Code written, **never run against a real account**. Without keys: demo mode shows the code on screen (dev, or `HOUSY_DEV_OTP=1`) |
| 2-step onboarding + editable profile | ✅ | name, email, where you live, language, property city/type/area/value, goals, timeline; drives welcome recommendations & default city |
| Hindi UI | 🟡 | Language *preference* is stored; the interface is English only |
| Inline verify-to-book (no lost form) + finish-sign-up nudge | ✅ | |

## 2. Cities
| City picker (20 cities), per-city pricing multiplier, remembered per browser | ✅ | |
| Live vs coming-soon; bookings refused server-side for non-live cities | ✅ | Live: Bareilly, Lucknow |
| Waitlist for non-live cities (idempotent per phone+city) | ✅ | |
| Ops dashboard `/admin` (demand by city, latest sign-ups with masked phones) | ✅ | Allow-list via `HOUSY_ADMIN_PHONES` |

## 3. Project catalog & estimates
| Build (new house) · Renovate (bathroom, kitchen, wall, rewiring, waterproofing, painting, full-home) · Interiors (full-home, single room) | ✅ | 10 project types |
| Instant phase-wise estimate: labor/material split, 15 % contingency, range, timeline, quality tiers, safety flags | ✅ | |
| Interiors: design style + "8–12 % of property value" budget guide | ✅ | |
| **Rates, city multipliers, timelines** | 🟡 | **Placeholders** (Bareilly baseline). Need real quotes to calibrate |
| Structural work always includes engineer/architect phase | ✅ | |

## 4. Project lifecycle (the core loop)
| Book paid first visit (site visit / design consultation / plot visit), pick slot, on-site contact | ✅ | Fee shown but **not charged** |
| Expert visit → real measurements re-price the fixed quote, findings + expert note | ✅ | Done via a *demo control* on the project page (no expert app yet) |
| Reschedule (before visit) · cancel · decline quote | ✅ | Cancel blocked once work starts |
| Accept quote → 20 % advance → milestones per phase, crews assigned from the project's own city | ✅ | Payments **simulated** |
| Milestones in strict order: start → submit → approve → paid; money always sums to the quote | ✅ | |
| **Photo proof required to submit a milestone**, crew note, owner reviews before paying | ✅ | Images resized in browser, validated by magic bytes, private, 2 MB, 6 per milestone; stored on local disk |
| Ownership isolation (other users get 404) | ✅ | |
| Crew directory per city, filter by trade | ✅ | |
| Crew/expert real apps (today: "Demo control" buttons on the owner's page) | 🟡 | The biggest simulation left |
| Real payments (Razorpay: visit fee, advance, milestone release) | 🟡 | Needs keys |
| Notifications (SMS/WhatsApp on booking, quote, submission) | ⬜ | |

## 5. Platform
| Persistent storage | 🟡 | JSON files in `.data/` (works locally/single server, **not serverless**). Supabase schema + `migrations/001_cities.sql` written but **never run**; app doesn't use it yet |
| Seed crews (16 in Bareilly & Lucknow) | 🟡 | Fake names. Replace with field-agent-onboarded real crews |
| Tests, strict typecheck, ESLint, CI (GitHub Actions) | ✅ | |
| Error / not-found pages | ✅ | |
| Clean-clone install & build | ✅ | Fixed a broken lockfile this pass |

## 6. Not started (from the PRD)
AI advisor in the web app (bathroom/wall feasibility, freeform chat — exists only in legacy backend) · floor-plan wizard/scan (legacy mobile) ·
in-app chat · reviews & ratings · expense/photo journal beyond milestones · design deliverables for interiors (3D upload/approval, room scope, finishes) ·
supervisor-as-a-service · equipment & material marketplace · education content · field-agent app & Housy ID cards · issue/dispute flow · NRI-specific features.

## Suggested next order
1. Interiors depth (design deliverable upload + approval gate, room scope, finishes) — the differentiator.
2. Supabase storage (needs project + keys) → deployable.
3. Reviews & ratings after completion; issue/dispute flow.
4. AI advisor (port from legacy backend) feeding intake & quote findings.
5. Real expert/crew app, payments, notifications (need keys/accounts).
