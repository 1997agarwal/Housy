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
| Interiors: room-by-room scope (9 rooms) with live price per room; finish grades (shutters, lighting) | ✅ | Unselected rooms drop out of the price; scope survives on-site re-measurement |
| **Rates, city multipliers, timelines** | 🟡 | **Placeholders** (Bareilly baseline). Need real quotes to calibrate |
| Structural work always includes engineer/architect phase | ✅ | |

## 3a. Home plan (`/my-home`)
| Draw your house: templates (2/3 BHK) or add rooms; drag to move (snaps to ½ ft), arrow-key nudge, numeric edit, overlap warnings, totals | ✅ | Local draft until you sign in; then saved per user, restored on any device |
| Drop the septic/drain point → **pipe run**, fall needed at 1:40, and the advisor's verdict for the chosen bathroom (shaft & ventilation inferred/asked) | ✅ | Run = Manhattan distance from the nearest wall + 2 ft; an estimate, the on-site visit measures the truth |
| Hand-offs: "Plan this bathroom" (area + drain) and "Start interiors" (carpet area + matching rooms) pre-fill the projects | ✅ | URL params are validated, hostile values ignored |
| Photo → floor plan (AI) | ⬜ | Legacy mobile only; needs a vision API key |

## 3b. Feasibility advisor (`/advisor`)
| "Can I break this wall?" → green/amber/red with reasons, next steps, and a link into an engineer-led project | ✅ | Deterministic rules, **not AI**. Safety-first: any "not sure" answer can never be green; exterior/thick/load-bearing masonry walls are red. Tested exhaustively over all 5,832 answer combinations |
| "Can I add a bathroom?" → drain fall at 1:40, floor, leak risk, ventilation; cost range from the estimator; carries the drain distance into the plan | ✅ | |
| AI (Gemini) advisor / freeform chat | ⬜ | Needs an API key; exists only in the legacy backend |

## 4. Project lifecycle (the core loop)
| Book paid first visit (site visit / design consultation / plot visit), pick slot, on-site contact | ✅ | Fee shown but **not charged** |
| Expert visit → real measurements re-price the fixed quote, findings + expert note | ✅ | Done via a *demo control* on the project page (no expert app yet) |
| Reschedule (before visit) · cancel · decline quote | ✅ | Cancel blocked once work starts |
| Accept quote → 20 % advance → milestones per phase, crews assigned from the project's own city | ✅ | Payments **simulated** |
| Milestones in strict order: start → submit → approve → paid; money always sums to the quote | ✅ | |
| **Photo proof required to submit a milestone**, crew note, owner reviews before paying | ✅ | Images resized in browser, validated by magic bytes, private, 2 MB, 6 per milestone; stored on local disk |
| Design/work review loop: owner can **request changes** (max 3 rounds); fix needs a *fresh* photo; design must be approved before execution phases unlock | ✅ | Designer renders carry captions |
| **Problems & support**: owner reports quality / stoppage / material / design / payment issues (optionally tied to a step), threads with Housy, marks resolved or reopens; unresolved > 48 h auto-escalate; ops queue in `/admin` (reply/resolve) | ✅ | Max 5 open per project. No push notification when Housy replies (owner must open the page) |
| **Change orders**: the "fixed price" promise made real — owner requests extra work, expert prices it, owner approves → new milestone + quote total rise together; a pending change holds the project open | ✅ | Expert pricing is a demo control |
| Ownership isolation (other users get 404) | ✅ | |
| Crew directory per city, filter by trade, real ratings + recent reviews | ✅ | |
| **Verified reviews**: owner of a *completed* project rates each person who worked on it (4 criteria, 1–5, optional text), once each; reviewer shown masked ("Asha K."); real ratings blend into the seed baseline | ✅ | Crew *assignment* still ranks on the seed rating, not live reviews |
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
Freeform AI chat (legacy backend only) · photo-to-floor-plan AI scan (legacy mobile) ·
in-app chat · expense/photo journal beyond milestones · 
supervisor-as-a-service · equipment & material marketplace · education content · field-agent app & Housy ID cards ·  NRI-specific features.

## Suggested next order
1. ~~Interiors depth~~ — done.
2. ~~Reviews & ratings~~, ~~issue/dispute flow~~ — done.
3. ~~Rule-based feasibility advisor~~ — done.
4. AI advisor (port from legacy backend, needs Gemini key) feeding intake & quote findings.
5. Supabase storage (deferred by choice), real expert/crew app, payments, notifications (need keys/accounts).
