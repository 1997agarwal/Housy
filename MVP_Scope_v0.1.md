# Housy — MVP Scope (Phase 1, v0.1)

> **Status:** Draft — Based on approved PRD v0.1
> **Seed City (Assumed):** Bengaluru
> **Platform (Assumed):** Android-first + WhatsApp Bot for labor side

---

## Guiding Principle for MVP

> **Ship the smallest thing that makes a homeowner's renovation less chaotic.**

---

## What Ships in MVP

### ✅ 1. Property Onboarding (Manual Wizard only)
- City, property type, age, sq ft, BHK, bathrooms
- Renovation scope selector
- Photo upload
- DEFERRED: AI photo-to-floor-plan (v1.1)

### ✅ 2. Renovation Intelligence — Lite AI Advisor
- Bathroom Addition Advisor
- Wall Breaking Feasibility Checker
- Budget Estimator (scope + city → range)
- Material Calculator (cement, bricks, tiles, paint)
- Freeform "Housy GPT" chat (Gemini API)

### ✅ 3. Labor Marketplace — Core
- Skills: Mason, Plumber, Electrician, Tiles Fixer, Painter
- Search + filter by area, skill, rating, rate
- Book a worker flow
- Worker accepts/declines via WhatsApp

### ✅ 4. Project Dashboard — Minimal
- Active project card
- Task checklist (manual)
- Photo journal (daily site photos)
- Budget/expense tracker

### ✅ 5. Trust & Verification
- Phone OTP (mandatory)
- Aadhaar capture (manual verification in MVP)
- Star ratings + reviews (post-project)

### ✅ 6. Communication
- In-app chat (homeowner ↔ worker)
- WhatsApp fallback for workers

### ✅ 7. Education — Minimal
- 10 curated renovation articles (static)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Mobile | React Native (Expo) |
| Backend | Node.js + Supabase (Postgres + Auth + Storage + Realtime) |
| AI Advisor | Gemini 1.5 Pro API |
| WhatsApp | Meta WhatsApp Business API |
| Payments | Razorpay |
| Maps | Google Maps Platform |
| Notifications | FCM (push) + MSG91 (SMS) |
| Hosting | Google Cloud Run |

---

## Build Timeline (16 Weeks)

- **Sprint 1 (Wk 1–4):** Foundation — auth, property wizard, worker profiles, maps
- **Sprint 2 (Wk 5–8):** Marketplace — search, booking, WhatsApp bot, chat, dashboard
- **Sprint 3 (Wk 9–12):** Intelligence + Trust — AI advisor, budget estimator, reviews
- **Sprint 4 (Wk 13–16):** Polish + Launch — payments, field agent app, beta launch

---

## Open Question Defaults (please confirm)

| Question | Default |
|---------|---------|
| WhatsApp vs App-first? | Android app + WhatsApp for workers |
| Seed city? | Bengaluru |
| AI floor plan in MVP? | No — manual wizard only |
| Supervisors: in-house? | Deferred from MVP |
| First revenue stream? | Commission on labor bookings (10–12%) |
| Brand name? | "Housy" |

---

## MVP Success Criteria (8 weeks post-launch)

| Metric | Target |
|--------|--------|
| Homeowners onboarded | ≥ 100 |
| Workers registered | ≥ 500 |
| Bookings completed | ≥ 50 |
| Avg booking rating | ≥ 4.0/5 |
| AI Advisor sessions | ≥ 200 |
| NPS | ≥ 40 |
