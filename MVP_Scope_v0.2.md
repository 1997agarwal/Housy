# Housy — MVP Scope (Phase 1, v0.2)

> **Status:** ✅ Locked — Proceeding to Build
> **Seed City:** Bareilly, Uttar Pradesh
> **Platforms:** Android + iOS + Web (homeowners) | WhatsApp + POC model (supply side)
> **Language:** Hindi primary, English secondary

---

## Core MVP Hypothesis

> "Homeowners in Tier 2 cities will use a Hindi-first digital platform to find, book, and manage verified POC/labor if it saves them time and protects them from being cheated."

---

## What Ships in MVP

### ✅ 1. Property Onboarding
- Wizard: city, type, age, sq ft, BHK, bathrooms, renovation scope
- Photo upload (room-wise)
- **Manual wizard floor plan** (room-by-room questions)
- **AI photo-to-floor-plan** (4-corner room photos → 2D layout)
- Hindi + English throughout

### ✅ 2. AI Renovation Advisor (3 core flows)
- Bathroom Addition Advisor
- Wall Breaking Feasibility Checker
- Budget Estimator (city-calibrated ranges)
- Material Calculator (cement, bricks, tiles, paint)
- Freeform "Housy GPT" chat (Gemini API, Hindi + English)

### ✅ 3. Labor Marketplace — POC Model
- **POC profiles** (Mistri/labor contractors — manage gangs of workers)
- Skills: Mason, Plumber, Electrician, Tiles Fixer, Painter
- Search by area, skill, rating, daily rate
- Book a POC flow: dates, describe work, send request
- POC receives request via WhatsApp (Meta Business API)
- POC accepts/declines via WhatsApp
- Housy physical ID card for verified POCs (field agent issued)

### ✅ 4. Project Dashboard (Minimal)
- Active project card
- Task checklist (manual)
- Daily photo journal (site photos by date/room)
- Budget & expense tracker (log payments, see total spent)

### ✅ 5. Trust & Verification
- Phone OTP (mandatory all users)
- Aadhaar capture + field-agent physical verification
- Star ratings + text reviews (post-booking)
- Housy Quality Seal for top POCs

### ✅ 6. Communication
- In-app chat (voice + text messages)
- WhatsApp fallback for supply side
- Hindi + English

### ✅ 7. Education (Static)
- 10 articles in Hindi + English on renovation basics

---

## Deferred (Not in MVP)

| Feature | Version |
|---------|---------|
| Supervisor-as-a-Service | v1.1 |
| Equipment rental marketplace | v1.1 |
| Material vendor marketplace | v1.1 |
| Electrical / plumbing advisors | v1.1 |
| Task dependency map / Gantt | v1.1 |
| Community forum | v1.1 |
| Video academy | v1.1 |
| Automated Aadhaar UIDAI API check | v1.1 |
| Escrow / milestone payments | v2 |
| On-demand architect consultations | v1.1 |

---

## Tech Stack (Confirmed)

| Layer | Technology |
|-------|-----------|
| Mobile (Android + iOS) | React Native (Expo) |
| Web App | Next.js |
| Backend | Node.js + NestJS |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (Phone OTP) |
| Storage | Supabase Storage |
| Real-time chat | Supabase Realtime |
| AI Advisor | Gemini 1.5 Pro API |
| AI Floor Plan | Google Vision API + depth model |
| WhatsApp (POC comms) | Meta WhatsApp Business API |
| SMS | MSG91 |
| Push | Firebase Cloud Messaging |
| Maps | Google Maps Platform |
| Payments | Razorpay (UPI, cards) |
| Hosting | Google Cloud Run |

---

## Key Data Models

### User
```
id, phone, name, email?, city, role (homeowner|poc|supervisor|field_agent|admin),
language_pref (hi|en), created_at, phone_verified, aadhaar_verified
```

### Property
```
id, owner_id, city, locality, pincode, type, age_years, sq_ft, bhk, bathrooms,
renovation_scope[], photos[], floor_plan_url, created_at
```

### POC (Point of Contact / Mistri / Labor Contractor)
```
id, user_id, gang_size, skills_available[], daily_rate_min, daily_rate_max,
areas_served[], years_experience, languages[], bio, work_photos[],
rating_avg, review_count, is_verified, housy_id_card_number, is_available
```

### Project
```
id, property_id, homeowner_id, title, status (planning|active|paused|completed),
budget_estimate, budget_spent, start_date, end_date_estimate, created_at
```

### Booking
```
id, project_id, poc_id, homeowner_id, skills_required[], start_date, end_date,
daily_rate, status (pending|accepted|declined|active|completed|cancelled),
work_description, platform_fee_pct, created_at
```

### Review
```
id, booking_id, reviewer_id, reviewee_id,
quality_rating, punctuality_rating, behaviour_rating, value_rating,
text, photos[], created_at
```

---

## Key User Flows

### Flow 1 — Homeowner finds and books a mason POC
```
Sign up (Phone OTP, Hindi/English)
→ Create Property Profile (wizard)
→ Select Renovation Scope
→ "Find Labor" → Browse POCs by skill + area
→ View POC profile (gang size, skills, rating, rate, photos)
→ "Book this POC" → enter dates + describe work
→ POC gets WhatsApp notification
→ POC accepts → booking confirmed
→ In-app chat opens
→ Project dashboard activated
→ After work: leave review
```

### Flow 2 — Homeowner asks AI: "Can I add a bathroom?"
```
Home → "Ask Housy" (AI Advisor)
→ "Mujhe ek aur bathroom banana hai"
→ AI asks: kahan banana hai? existing bathroom kahan hai?
→ AI asks: ground floor ya upar? drainage kahan jaata hai?
→ AI shows: feasibility + cost range (₹1.5L–₹3L) + next steps
→ CTA: "Plumber dhundhein apne area mein" → Labor marketplace
```

### Flow 3 — POC gets onboarded (Bareilly labor chowk)
```
Field agent meets POC at labor chowk (physical)
→ Field agent app: enter POC phone, name, skills, gang size, area, rates
→ POC gets WhatsApp: "Housy pe aapka profile ban gaya hai!"
→ Field agent issues physical Housy ID card
→ POC receives booking requests via WhatsApp going forward
→ POC can optionally download full app later
```

### Flow 4 — AI Floor Plan Generation
```
Property profile → "Floor plan banayein"
→ Option A: Guided wizard (room-by-room questions in Hindi)
→ Option B: Photo scan (4-corner photos per room → AI generates layout)
→ User reviews and adjusts generated plan
→ Floor plan saved to property profile
→ Used in budget estimation and labor briefing
```

---

## Build Timeline (16 Weeks)

### Sprint 1 — Weeks 1–4: Foundation
- [ ] Repo + CI/CD + Supabase project setup
- [ ] React Native scaffold (Android + iOS)
- [ ] Next.js web app scaffold
- [ ] Auth: Phone OTP (Hindi + English UI)
- [ ] Property onboarding wizard
- [ ] Photo upload to Supabase Storage
- [ ] POC profile schema + admin entry (manual seeding of first 20 POCs in Bareilly)

### Sprint 2 — Weeks 5–8: Core Marketplace
- [ ] POC search (area + skill filter)
- [ ] POC profile view page
- [ ] Booking flow (homeowner → POC)
- [ ] WhatsApp notification for POC (Meta Business API)
- [ ] Accept/decline flow via WhatsApp
- [ ] In-app chat (voice + text, Supabase Realtime)
- [ ] Google Maps integration (POC area, property pin)

### Sprint 3 — Weeks 9–12: Intelligence + Floor Plan
- [ ] AI Advisor — Bathroom Addition flow (Gemini API, Hindi + English)
- [ ] AI Advisor — Wall Breaking Feasibility
- [ ] Budget Estimator (Bareilly-calibrated price data)
- [ ] Material Calculator
- [ ] Manual Floor Plan wizard
- [ ] AI photo-to-floor-plan (Google Vision API integration)
- [ ] Review & Rating system

### Sprint 4 — Weeks 13–16: Project Management + Launch Prep
- [ ] Project dashboard (tasks, photo journal, expense tracker)
- [ ] Push notifications (FCM)
- [ ] Razorpay payment integration (platform fee collection)
- [ ] 10 education articles (Hindi + English)
- [ ] Field agent app (POC registration at labor chowk)
- [ ] Housy ID card PDF generation (for field agents to print/issue)
- [ ] QA, performance, offline-mode for key screens
- [ ] Beta launch: 50 homeowners + 50 POCs in Bareilly

---

## Brand Name — Options Shortlisted

| Name | Vibe |
|------|------|
| **Housy** ✅ (current) | Simple, cross-market, memorable |
| **Neev** | Foundation (Hindi/Sanskrit) — deeply meaningful |
| **GharSaathi** | Home Companion — warm, Tier 2 resonant |
| **Banao** | Build/Make — action-oriented, Hindi-native |
| **Tamir** | Repair/Construction (Urdu/Hindi) — authentic |
| **Nirman.ai** | Construction — premium, tech-forward |

*Recommendation: Keep "Housy" for now. Test "Neev" and "GharSaathi" with Bareilly users before final decision.*

---

## MVP Success Criteria (8 weeks post-beta)

| Metric | Target |
|--------|--------|
| Homeowners onboarded | ≥ 100 |
| POCs registered in Bareilly | ≥ 50 |
| Bookings initiated | ≥ 75 |
| Bookings completed | ≥ 50 |
| Avg booking rating | ≥ 4.0/5 |
| AI Advisor sessions | ≥ 200 |
| Floor plans generated | ≥ 80 |
| D30 homeowner retention | ≥ 30% |
| NPS | ≥ 40 |

---

## Next Steps

1. ✅ PRD v0.2 approved
2. ✅ MVP Scope v0.2 locked
3. ⏳ Wireframes for 6 key screens
4. ⏳ Supabase project creation + repo init
5. ⏳ Seed first 20 POC profiles (Bareilly labor chowk field visit)
6. ⏳ Sprint 1 kickoff
