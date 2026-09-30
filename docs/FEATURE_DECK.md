# Housy — Feature deck

✅ built & tested  ·  🟡 built but simulated / needs keys or real data  ·  🚧 next (committed)  ·  ⬜ roadmap  ·  *(last updated with commit `b8a05be`)*

**One line:** Urban Company for whole projects — build, renovate and design a home, end to end, for owners who can't be on site.
**Slide version:** open [`deck.html`](deck.html) in a browser (← → to move).

## 1. Three portals, one login
| Portal | Status |
|---|---|
| Customer | ✅ |
| Crew / contractor (`/partner`) | 🟡 registration, approval, matching, offers ✅ · work screens 🚧 |
| Interior designer (`/partner`) | 🟡 registration ✅ · designer workflow 🚧 |
| Ops console (`/admin`) | ✅ (English only) |

## 2. Customer portal
| Feature | Status |
|---|---|
| Phone-OTP sign-up / login, 2-step profile, editable | ✅ |
| Real SMS delivery (MSG91) | 🟡 needs keys; demo mode shows the code |
| 20 cities, live vs coming-soon, waitlist, per-city pricing | ✅ (live: Bareilly, Lucknow) |
| 10 project types: build · renovate ×7 · interiors ×2 | ✅ |
| Instant phase-wise estimate, tiers, safety flags, timeline | ✅ (rates are placeholders 🟡) |
| Interiors: room-by-room scope, finish grades, 8–12% budget guide | ✅ |
| **Materials guide** per project and quality tier (specs & standards) | ✅ |
| Home plan editor (drag rooms, drain run, hand-offs to projects) | ✅ |
| Feasibility advisor: wall breaking, bathroom addition (green/amber/red) | ✅ |
| Book paid first visit, reschedule, cancel | ✅ (fee not charged 🟡) |
| Fixed quote re-priced from on-site measurements | ✅ |
| Milestones with photo proof, approve-then-pay, request changes ×3 | ✅ (payments simulated 🟡) |
| Change orders (priced first, approved to add) | ✅ |
| Budget & expenses, category breakdown, CSV export | ✅ |
| In-app chat: text + voice notes, unread badges | ✅ |
| Problems & support with auto-escalation | ✅ |
| Verified reviews (completed projects only) | ✅ |
| Crew directory per city | ✅ |
| Hindi across all screens and server messages | ✅ (native review needed) |
| Notifications (WhatsApp / SMS / push) | ⬜ |
| Real payments (Razorpay) | ⬜ |
| Timeline / Gantt view, daily photo journal | ⬜ |
| Product & artifact recommendations for interiors | ⬜ |
| Education articles | ⬜ |

## 3. Crew / contractor portal
| Feature | Status |
|---|---|
| Register: city, area, trades, project types wanted, day rate, team size, experience, availability | ✅ |
| Ops verification → Housy ID (`HSY-<CITY>-P###`) | ✅ |
| Matchmaking (rating + reviews, record, experience, rate fit, newcomer boost, load sharing) | ✅ |
| Job offers: accept / decline, decline re-offers to next best | ✅ |
| Appears in the city crew directory (New badge until reviewed) | ✅ |
| **Run the work from own portal**: start, upload photos, submit for review, respond to change requests | 🚧 |
| Price change orders from own portal (replaces demo control) | 🚧 |
| Chat from own portal (replaces demo reply) | 🚧 |
| Earnings, payout history | ⬜ (needs payments) |
| Availability calendar, service radius, price per job type | ⬜ |
| WhatsApp job alerts and replies | ⬜ |
| Physical Housy ID card (PDF), field-agent onboarding app | ⬜ |

## 4. Interior designer portal
| Feature | Status |
|---|---|
| Register as designer / architect: styles, fee per sq ft, experience | ✅ |
| Approval + matching for design-consultation visits and design milestones | 🟡 (uses the shared crew matcher; no style/budget fit yet) |
| Consultation workflow: brief, measurements, mood boards | 🚧 |
| Upload design renders with captions for owner approval (revisions ×3) | 🟡 exists as owner-page demo control; designer-side 🚧 |
| Match by style, budget and property type | 🚧 |
| Portfolio (photos of past work) | ⬜ |
| Product / artifact recommendations attached to a design | ⬜ |
| Design fee and revenue share | ⬜ |

## 5. Ops console
| Feature | Status |
|---|---|
| Demand by city, latest waitlist (masked phones) | ✅ |
| Support queue: reply, resolve, escalations | ✅ |
| Partner approvals: approve / suspend with note | ✅ |
| Analytics (funnel, GMV, crew utilisation), audit log | ⬜ |
| Payout and dispute tooling | ⬜ |
| Translate the console to Hindi | ⬜ (not needed yet) |

## 6. Platform
| Feature | Status |
|---|---|
| Owner-scoped data, strict input validation, bounded request bodies, rate limits | ✅ |
| ~262 automated tests, strict TS, ESLint, GitHub Actions CI | ✅ |
| Persistent storage: JSON files (single server) | 🟡 |
| Supabase database + file storage | ⬜ (deferred by choice) |
| Deployment (Cloud Run / Vercel + managed DB) | ⬜ |
| Playwright end-to-end suite checked into the repo | ⬜ |
| AI advisor (Gemini) and photo-to-floor-plan | ⬜ |
| Legacy mobile app (Expo) and NestJS backend | 🟡 kept, not connected |

## 7. Roadmap
**Now** — crew work screens (start / photos / submit / chat / change pricing from their own portal) → designer workflow (consultation, renders, style + budget matching) → product & artifact recommendations.
**Next** — notifications (WhatsApp + SMS) · real payments (visit fee, advance, milestone release, payouts) · Supabase storage and file storage · deployment.
**Later** — field-agent app and ID cards · AI advisor and photo-to-plan · supervisor-as-a-service · equipment and material marketplace · education content · more live cities (calibrate real rates first).

## 8. Biggest risks
1. **Supply quality** — verification by field agents is manual; ops tooling and ID cards are needed before scale.
2. **Unit economics** — rates and multipliers are placeholders; calibrate with real quotes per city.
3. **Trust without payments** — milestone approval is the trust mechanism, but money is simulated until Razorpay is integrated.
4. **Data durability** — JSON files are fine for a pilot, not for production.
