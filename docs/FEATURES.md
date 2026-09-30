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
| **Hindi UI** (EN / हिं toggle) | ✅ | Every customer screen: header, home, city picker, sign-in/OTP, onboarding, welcome, plan page (styles, rooms, finishes, phases, flags), project tracker (stages, quote, milestones, activity timeline, quote findings), projects list, crews, profile, advisor (all verdicts), home-plan editor, chat, and the reviews / issues / changes / expenses / photo panels, plus **server messages** (validation errors, timeline entries). Server text stays English in storage and is translated at display time (`lib/server-text.ts`), so old projects work too; completeness is enforced by tests that scan the source. Choice remembered per device; a saved profile language applies on a new device. **Stays as typed:** names and text people write (notes, feedback, chat, crew names). **Admin/ops console is English-only by design.** Copy needs a native-speaker review |
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
| **Budget & expenses**: your own budget vs where the project is heading (quote + your outside spending), 90 % warning / over-budget, category breakdown, ledger with delete, CSV export (formula-injection safe) | ✅ | Housy payments are tracked automatically; outside expenses are manual |
| **In-app chat** with the visit expert and every assigned crew (one thread each): text (Enter sends) + **voice notes** (record in the browser, ≤ 60 s, play back), live polling every 5 s, unread badges on the thread tabs and the projects list, IST timestamps, history kept after cancellation (sending blocked) | ✅ | Voice validated by magic bytes, private to the owner, ≤ 1.5 MB; 30 messages/min throttle; 1,000 messages/project cap. **Crews have no app yet:** their side is a *demo control* (`/chat/crew`, disabled in production unless `HOUSY_DEV_OTP=1`); real replies would arrive via a WhatsApp bridge (not built). No push notifications |
| Ownership isolation (other users get 404) | ✅ | |
| Crew directory per city, filter by trade, real ratings + recent reviews | ✅ | |
| **Verified reviews**: owner of a *completed* project rates each person who worked on it (4 criteria, 1–5, optional text), once each; reviewer shown masked ("Asha K."); real ratings blend into the seed baseline | ✅ | |
| Crew/expert real apps (today: "Demo control" buttons on the owner's page) | 🟡 | The biggest simulation left |
| Real payments (Razorpay: visit fee, advance, milestone release) | 🟡 | Needs keys |
| Notifications (SMS/WhatsApp on booking, quote, submission) | ⬜ | |

## 4b. Hardening (bug-hunt pass)
| Fixed: milestone deadlock after a change request when it already had 6 photos · NaN/Infinity/absurd `drainFt` producing NaN quotes · JSON-store wipe on any read error · full owner phones in the admin issues API · unbounded request bodies (now 413) · wrong-typed JSON returning 500 (now 400) · past/far-future visit slots · impossible expense dates (2026-02-31) · quote/milestone rounding on tiny jobs (₹0 milestones, quote above its own range) · per-room prices not summing to the total · home-plan → interiors hand-off double-scaling area (~22 % under-priced) · estimate calling >15 ft drains "comfortable" while the advisor said amber · visit slots and expense dates in the viewer's/UTC zone instead of IST · forms clearing input when an action failed · draft plans leaking between users on a shared device / newer unsaved drafts silently dropped · pages stuck on "Loading…" after a failed fetch · OTP re-request invalidating a real code / resetting the attempt counter | ✅ | Each has a regression test (`regressions.test.ts` etc.) |

**Known limitations (accepted for now):** per-IP rate limits trust `x-forwarded-for`, which is spoofable without a trusted proxy (per-phone caps still hold and the limiter store is size-bounded) · the JSON store is single-process (two server instances would lose updates) · a 4th+ bedroom or "Other" room is not priced by interiors (the UI says so) · no CAPTCHA on OTP requests, so a determined attacker can still SMS-bomb a number up to the caps.

## 5. Platform
| Persistent storage | 🟡 | JSON files in `.data/` (works locally/single server, **not serverless**). Supabase schema + `migrations/001_cities.sql` written but **never run**; app doesn't use it yet |
| **Crew & designer portal** (`/partner`): same phone login, register as a crew/contractor or interior designer — city, area, trades, project types wanted, day rate (crew) or ₹/sq ft + styles (designer), team size, experience, availability | ✅ | Starts **pending**; matchable only after ops approves in `/admin` (issues the Housy ID `HSY-<CITY>-P###`). Changing city/trade re-opens verification. Hindi + English |
| **Matchmaking**: ranks seed + approved crews by rating (blended with real reviews), track record, experience and rate fit; new partners get a fair baseline + boost; near-equals are picked by **least open work** | ✅ | Pure ranking + load sharing, unit-tested (`matching.ts`). Never crosses cities |
| **Job offers**: partner-crews receive a pending offer per milestone, accept or decline in their portal; decline re-offers to the next best match and is logged on the timeline; owner can't start a milestone that is still pending | ✅ | Crews see city/area/amount and only the customer's first name after accepting. Seed crews are assigned outright |
| Ops approvals queue in `/admin` (approve / suspend with note) | ✅ | English-only ops console; phones masked |
| **Materials guide** on every plan page: per project type, what to ask for at the chosen quality tier (specs and IS/ISI standards, not prices or brands) plus one "watch out" tip each | ✅ | Static content in `lib/materials.ts`, Hindi + English, completeness-tested. Product/artifact recommendations for interiors and designer-specific advice are not built |
| Seed crews (16 in Bareilly & Lucknow) | 🟡 | Fake names. They still exist alongside registered partners; remove once real crews are onboarded |
| Tests, strict typecheck, ESLint, CI (GitHub Actions) | ✅ | |
| Error / not-found pages | ✅ | |
| Clean-clone install & build | ✅ | Fixed a broken lockfile this pass |

## 6. Not started (from the PRD)
Freeform AI chat (legacy backend only) · photo-to-floor-plan AI scan (legacy mobile) ·
 photo journal beyond milestones · 
supervisor-as-a-service · equipment & material marketplace · education content · field-agent app & Housy ID cards ·  NRI-specific features.

## Suggested next order
1. ~~Interiors depth~~ — done.
2. ~~Reviews & ratings~~, ~~issue/dispute flow~~, ~~in-app chat~~ — done.
3. ~~Rule-based feasibility advisor~~ — done.
4. AI advisor (port from legacy backend, needs Gemini key) feeding intake & quote findings.
5. Supabase storage (deferred by choice), real expert/crew app, payments, notifications (need keys/accounts).
