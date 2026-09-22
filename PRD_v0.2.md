# Housy — Product Requirements Document (PRD)

> **Version:** 0.2 (Updated with Founder Inputs)
> **Author:** Harshita G × Antigravity
> **Date:** September 2026
> **Status:** 🟢 Approved — Ready for MVP Build

---

## Executive Summary

**Housy** is a full-stack renovation intelligence and coordination platform for the urban Indian homeowner who has little to no experience with the construction ecosystem. It bridges the massive gap between homeowners and the fragmented, unorganized world of labor, materials, equipment, and design guidance.

Think of it as a **"Swiggy for your house"** — where instead of food, you're coordinating your entire renovation experience, end-to-end, from your phone or laptop.

**Seed Market:** Bareilly, Uttar Pradesh (Tier 2 city — real ground-truth market)
**Platform:** Cross-platform (Android + iOS + Web) for homeowners; POC/Supervisor model for labor supply

---

## The Problem Space

### Who Is The User?

**Primary User — The Homeowner:**
- Owns or inherits property in a Tier 2/3 city (e.g., Bareilly) but may live in a metro.
- Has zero local construction network.
- Has no construction knowledge — doesn't understand load-bearing walls, drainage slopes, or material grades.
- Is time-poor and decision-paralysed.
- Is money-conscious and afraid of being cheated.
- Uses smartphone comfortably (Android or iOS).

**Supply Side — The Labor Ecosystem (Tier 2 Reality):**
- Many individual laborers do NOT own smartphones — they use keypad/feature phones or no phone at all.
- Labor operates in informal "gangs" led by a Mistri or a local contractor.
- The **Mistri/Contractor is the POC (Point of Contact)** for a group of 5–20 workers.
- Housy's supply-side strategy: **onboard Mistris and local labor contractors as POCs**, not individual laborers. The POC manages their gang and dispatches the right worker for the job.
- Supervisors (site overseers) are a separate category — they coordinate across multiple trades.

### Problem Categories

| # | Problem | Current "Solution" | Pain Level |
|---|---------|-------------------|-----------| 
| 1 | Finding verified, skilled labor | Wandering labor chowks, word of mouth | 🔴 Critical |
| 2 | Assessing labor quality/skill | None — purely gut feel | 🔴 Critical |
| 3 | Getting construction equipment | Unknown rental shops, or labor brings it | 🟠 High |
| 4 | Sourcing materials (cement, bricks, tiles, sand) | Asking locals, visiting mandis | 🟠 High |
| 5 | Making feasibility decisions (can I break this wall?) | Guessing or expensive architects | 🔴 Critical |
| 6 | Understanding what renovation requires end-to-end | Google, YouTube | 🟡 Medium |
| 7 | Coordinating multiple trades (mason, electrician, plumber) | Manual phone calls, no oversight | 🔴 Critical |
| 8 | Budget estimation and tracking | Spreadsheets or nothing | 🟠 High |
| 9 | Finding a trustworthy supervisor | Purely word of mouth | 🟠 High |
| 10 | Language barrier (Hindi-first Tier 2 market) | None — English platforms don't work | 🔴 Critical |

---

## Product Vision

> **"Housy makes every homeowner renovation-confident — giving them the intelligence, the network, and the coordination tools to renovate without stress, without being cheated, and without needing a local network."**

---

## Target Market

### Primary Market — Phase 1
- Homeowners in Tier 2 cities renovating old/ancestral homes.
- **Seed city: Bareilly, Uttar Pradesh.**
- Expansion cities (6–12 months): Lucknow, Agra, Kanpur, Meerut, Varanasi, Jaipur, Indore.
- Age: 28–55.
- Language: Hindi primary, English secondary.

### Secondary Market — Phase 2+
- NRI homeowners managing Indian properties remotely (huge pain, high willingness to pay).
- Metro homeowners with apartment renovation needs.
- New self-construction projects on owned land.
- Small commercial renovations (shops, offices).

### Market Size (India)
- ~18 million homes renovated annually.
- Renovation market: ₹3–5 lakh crore/year.
- Tier 2 + Tier 3 cities: ~65% of this volume, almost zero organized platforms.
- Construction labor: ~55 million workers, largely unregistered.

---

## Platforms

| User Type | Platform |
|-----------|---------|
| Homeowners | Android App + iOS App + Web App |
| POC/Mistri/Labor Contractor | Android App (lite) + WhatsApp |
| Supervisors | Android App + Web |
| Housy Field Agents | Android App (internal) |
| Admin/Ops | Web Dashboard |

**Language support (MVP):** Hindi + English
**Language support (v1.1):** + Bhojpuri (Bareilly/UP), + Awadhi

---

## Product Phases

### 🏗️ Phase 1 — Renovation Intelligence & Coordination
*Make renovation manageable for the clueless homeowner in Tier 2 India.*

### 🏠 Phase 2 — New Construction
*Guide the homeowner building from scratch on owned land.*

### 🎨 Phase 3 — Interior Design
*Aesthetic layer — modular furniture, décor, lighting, false ceilings.*

### ✨ Phase 4 — Luxury & Smart Homes
*Premium finishes, automation, smart home integration.*

---

# PHASE 1 — Detailed Feature Specification

## Feature Area 1: Property Onboarding & Digital Twin

### 1.1 Property Profile
Inputs:
- City, locality, pincode
- Property type (independent house / apartment / plot)
- Property age
- Built-up area (sq ft)
- Number of floors, rooms (BHK), bathrooms
- Ownership status
- Photos (room-wise, exterior)
- Optional: Rough floor plan sketch (photo upload)

### 1.2 Floor Plan Generation — BOTH approaches ship in MVP

**Approach A — Manual Guided Wizard (Hindi + English)**
- Room-by-room text wizard: "Apne bedroom mein jaiye. Uski lambai kitni hai? Chahrayi kitni hai?"
- App draws a schematic from answers.
- User verifies and adjusts.

**Approach B — AI Photo-to-Floor-Plan**
- User takes 4-corner photos of each room.
- AI reconstructs approximate 2D layout.
- User verifies/adjusts dimensions.
- Powered by: on-device depth estimation + cloud CV model.

> Both approaches produce the same output: a simple 2D schematic sufficient for renovation planning, labor briefing, and cost estimation. Not architect-grade, but practically very useful.

### 1.3 Renovation Scope Selector
Checkboxes for what the user wants to renovate:
- Bathroom addition / renovation
- Kitchen renovation
- Wall demolition / room merging
- Flooring replacement
- Electrical rewiring
- Plumbing overhaul
- Roof/terrace waterproofing
- Painting
- Doors & windows replacement
- Structural repairs

---

## Feature Area 2: Renovation Intelligence Engine (AI Advisor)

Housy's brain. Makes the platform intelligent, not just a marketplace.

### 2.1 Feasibility Advisor
For each renovation task:
1. AI asks targeted clarifying questions.
2. Flags complications and dependencies.
3. Gives feasibility score: High / Medium / Low / Needs Expert.
4. Recommends next steps and what professional to consult.

**Core flows in MVP:**
- Bathroom Addition Advisor (highest pain — founder's real use case)
- Wall Breaking Feasibility Checker
- Kitchen Shift/Renovation Advisor

### 2.2 Wall Intelligence
Before breaking any wall:
- Questions about wall type, thickness, roof relationship, beam visibility.
- Output: GREEN / AMBER / RED safety signal.
- Red → Always recommend structural engineer site visit.

> Disclaimer always shown: Housy AI is a guide, not a structural engineer. For load-bearing decisions, always consult a licensed professional.

### 2.3 Task Dependency Map
Auto-generated sequence for the renovation:
- "Electrical wiring must happen BEFORE plastering"
- "Plumbing rough-in BEFORE flooring"
- "Waterproofing BEFORE tiling bathrooms"
Prevents classic, expensive sequencing mistakes.

### 2.4 Material Calculator
Input: Room dimensions → Output: Bill of Materials (BOM)

| Material | Formula Used |
|----------|-------------|
| Cement | Area + wall thickness + mortar ratio → bags |
| Bricks/Blocks | Wall area + bond type → units |
| Sand | Proportional to cement → cubic feet |
| Tiles | Floor/wall area + 10% wastage → sq ft |
| Paint | Wall area minus openings → litres per coat |
| Waterproofing | Area → kg required |
| PVC pipes | Schematic-based → linear feet |

### 2.5 Budget Estimator
Inputs: City, renovation scope, property size, quality tier (Economy/Standard/Premium)
Output: Range-based estimate with line items:
- Labor cost per trade
- Material cost
- Equipment rental
- 15–20% contingency buffer

---

## Feature Area 3: Resource Marketplace

### 3.1 Labor / POC Registry

**Key Insight — Tier 2 Labor Model:**
Individual laborers in Tier 2 cities like Bareilly often don't have smartphones. They operate under a Mistri or local labor contractor who manages 5–20 workers. Housy onboards these **POCs (Points of Contact)** — the Mistri or contractor — who then dispatches the right worker for each job.

**Who gets onboarded as a POC:**
- Mistri (lead mason) with a gang of workers
- Local labor contractor/subcontractor
- Experienced tradesperson managing others (lead electrician, lead plumber)

**POC Profile contains:**
- Name, photo, Aadhaar verification
- Skills available in their gang (e.g., "masonry, tiling, waterproofing")
- Gang size (how many workers they can deploy)
- Daily rate range for different skill types
- Areas served (neighborhoods/tehsils)
- Past project photos
- Rating & reviews from homeowners
- Languages spoken
- Phone (WhatsApp/SMS reachable)

**Individual Worker Profile (optional — for workers with smartphones):**
- Same as POC but without gang management
- Can be onboarded by their POC on their behalf

**Onboarding POCs:** Housy field agents visit labor chowks in Bareilly → register POCs on the spot using a field agent app → POC gets a Housy-issued ID card (trust signal in the offline world).

### 3.2 Supervisor-as-a-Service (Good to Have — v1.1)
- Housy-verified supervisors visit site daily or 3x/week.
- Report via app: photos, progress notes, issue flags.
- Manage labor attendance, verify material delivery.
- Premium add-on: ₹5,000–₹20,000/project.

### 3.3 Equipment Rental
- Jackhammer/Breaker, Concrete Mixer, Angle Grinder, Tile Cutter, Scaffolding, Power Drill, Generator.
- Partner network of local rental shops.
- Delivered to site, daily rental + deposit.

### 3.4 Material Vendors
- Cement, bricks, sand, aggregates, tiles, plumbing, electrical, paint, waterproofing, steel.
- Local vendor discovery (city + area).
- RFQ system: Send BOM → Get 3 quotes.
- Price comparison + delivery scheduling.

### 3.5 Professionals On-Demand
- Structural Engineer (for load-bearing wall sign-off)
- Architect (renovation design consultation — 1–3 hour session)
- Vastu Consultant (strong demand in UP/Bareilly market)
- Legal/documentation (building permits, NOC)
- Model: Pay-per-session. Video call or site visit.

---

## Feature Area 4: Project Management & Site Coordination

### 4.1 Project Dashboard
- Overall renovation progress (%)
- Active tasks and status
- Labor on-site today (attendance)
- Materials delivered vs. pending
- Budget spent vs. remaining
- Open issues/blockers

### 4.2 Daily Progress Tracker
- Photo log tied to specific task/room.
- Task status: Not Started → In Progress → Done → Needs Inspection.
- Gantt-lite timeline: planned vs. actual.

### 4.3 Payments & Expense Tracker
- Log every payment (labor, material, equipment).
- Category-wise breakdown.
- UPI / bank transfer integration (Razorpay).
- Escrow/milestone payments in v2.

### 4.4 Issue Flagging
- Issue types: Quality problem, Work stoppage, Material shortage, Design change, Payment dispute.
- Tracked to resolution. Unresolved issues auto-escalate.

### 4.5 Communication Hub
- In-app chat (homeowner ↔ POC/worker/supervisor).
- Voice message support (critical — many prefer speaking over typing).
- WhatsApp fallback for supply-side users.
- **Language:** Hindi primary, English secondary.

---

## Feature Area 5: Education & Community

### 5.1 Renovation Academy
Short content, Hindi + English:
- "Load-bearing wall kya hota hai aur kaise pehchanein?"
- "Cement ke prakar aur kab kaunsa use karein"
- "Apne contractor se poochne wale 10 sawaal"
- "Kaise pata karein tile sahi se lagi hai ya nahi"

Format: Short videos (2–5 min) + illustrated guides + searchable Q&A.

### 5.2 Community Forum
- Homeowners share renovation journeys.
- Location-based: See renovations in your neighborhood.
- Real case studies: "Maine Bareilly mein 35 saal purana makaan ₹8L mein renovate kiya"

### 5.3 AI Chat — "Housy GPT"
Freeform renovation Q&A:
- "Meri deewar se paani aa raha hai, kya karoon?"
- "Bathroom tile lagane mein kitna time lagta hai?"
- "Mistri mujhe cement mein kaise thagta hai?"
Grounded in IS codes, local pricing, and curated expert knowledge.

---

## Feature Area 6: Trust & Verification

### 6.1 POC/Worker Verification
- Aadhaar capture + OTP verification.
- Phone number verified.
- Field agent physically meets POC at labor chowk — confirms identity.
- Housy ID card issued (physical — for offline trust).
- Skill verification: Field agent observes or asks skill-specific questions.

### 6.2 Rating & Review System
- Post-project ratings: Quality, Punctuality, Behaviour, Value for Money.
- POCs can rate homeowners too (payment reliability, respectful treatment).
- Verified reviews only — linked to actual bookings.

### 6.3 Vendor Verification
- GST registration check.
- ISI mark verification for materials.
- Pricing transparency — no hidden costs.

### 6.4 Housy Quality Seal
For top-tier POCs and vendors:
- Aadhaar verified ✅
- Field-agent verified ✅
- 4.5+ rating, 10+ reviews ✅
- No dispute history ✅
- Housy ID card holder ✅

---

## Technical Architecture

### Platform Targets
| Surface | Technology |
|---------|-----------|
| Homeowner Mobile | React Native (Android + iOS from one codebase) |
| Homeowner Web | Next.js |
| POC/Worker App | React Native (lite variant) |
| Field Agent App | React Native (internal) |
| Admin/Ops Dashboard | Next.js |

### Core Backend Stack
| Component | Technology |
|-----------|-----------|
| API Server | Node.js + NestJS |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (OTP/Phone) |
| File Storage | Supabase Storage |
| Real-time Chat | Supabase Realtime (WebSocket) |
| AI Advisor | Gemini 1.5 Pro API |
| AI Floor Plan | Google Vision API + custom depth model |
| WhatsApp Bot | Meta WhatsApp Business API |
| SMS | MSG91 (India-native, cost-effective) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Maps | Google Maps Platform |
| Payments | Razorpay (UPI, cards, bank transfer) |
| Hosting | Google Cloud Run (serverless containers) |

---

## Business Model

| Revenue Stream | Model | Priority |
|---------------|-------|---------|
| Commission on labor bookings | 10–12% of labor fee | MVP |
| Equipment rental commission | 15–20% | v1.1 |
| Material vendor commission | 5–10% | v1.1 |
| Supervisor-as-a-Service | ₹5K–₹20K/project | v1.1 |
| On-demand expert consultation | 20–30% of fee | v1.1 |
| Premium homeowner subscription | ₹499–₹999/month | v2 |
| SaaS for contractors | Per-seat pricing | Phase 3 |

---

## Competitive Landscape

| Platform | Gap Housy Fills |
|----------|----------------|
| Urban Company | No civil/renovation; no materials; no Tier 2 |
| Livspace/Homelane | Only interiors, premium, metro-only |
| BuildSupply | B2B only, no consumer, no labor |
| NoBroker | Real estate only, no renovation ecosystem |
| Local contractors | Opaque, no accountability, no digital trail |
| **Housy** | **Full-stack renovation OS, Tier 2-first, Hindi-first** |

**Housy's moat:** Intelligence (AI Advisor) + Trust (verified POC network) + Tier 2 depth (where no one else is playing)

---

## Go-To-Market Strategy

### Seed Market: Bareilly, Uttar Pradesh
- Founder has real ground-truth (active renovation happening now).
- Can personally validate every workflow.
- Strong word-of-mouth potential in tight-knit Tier 2 communities.
- Hindi-first approach resonates with local market.

### Acquisition — Homeowner Side
1. Facebook/WhatsApp groups (Bareilly housing, renovation communities).
2. Local newspaper ads + cable TV (still effective in Tier 2).
3. Real estate agents and property dealers (warm referrals).
4. YouTube: Hindi renovation guides — "Bareilly mein ghar kaise renovate karein".
5. Word of mouth: First 10 successful projects = biggest marketing asset.

### Acquisition — Supply Side (POCs/Labor)
1. Housy field agents at Bareilly labor chowks.
2. POC gets physical Housy ID card → status symbol + trust signal.
3. POC earns more via Housy than standing at chowk → strong incentive.
4. Referral: One registered POC refers others.

---

## Naming Ideas (Q6 Response)

"Housy" is strong. Here are alternatives to consider:

| Name | Meaning/Vibe | Pros |
|------|-------------|------|
| **Housy** | Home + friendly suffix | Simple, memorable, English-accessible |
| **Neev** | Foundation (Sanskrit/Hindi) | Deeply Indian, meaningful, short |
| **Banao** | Build/Make (Hindi) | Action-oriented, very Hindi-native |
| **GharSaathi** | Home Companion (Hindi) | Warm, relatable for Tier 2 |
| **Tamir** | Repair/Construction (Urdu/Hindi) | Authentic to the trade |
| **Nirman.ai** | Construction (Hindi/Sanskrit) | Premium, futuristic, domain available? |
| **NeevAI** | Foundation + AI | Tech-forward with Indian roots |

**Recommendation:** "Housy" works well for cross-market appeal. "Neev" or "GharSaathi" could resonate deeper in Tier 2/Hindi markets. Worth A/B testing with target users before locking.

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| POC quality is inconsistent | Tiered verification, field-agent physical check, strong review system |
| AI gives wrong structural advice | Liability disclaimers, always escalate structural decisions to professionals |
| Cash-first Tier 2 market resists digital payments | Offer cash payment logging + gradual UPI nudge |
| Low smartphone penetration among laborers | POC model solves this — Housy talks to POC, POC dispatches labor |
| Hindi content quality | Native Hindi speaker review for all AI responses and content |
| Offline-first requirement | App works offline for property/project data; syncs when connected |

---

## Success Metrics — Phase 1 (12 months post-launch)

| Metric | Target |
|--------|--------|
| Properties onboarded | 2,000 (Bareilly + 2 UP cities) |
| POCs registered | 500 |
| Individual workers linked to POCs | 3,000+ |
| Projects successfully completed | 400 |
| NPS | > 50 |
| Avg project rating | > 4.2/5 |
| AI Advisor sessions | 5,000 |
| Monthly active homeowners | 5,000 |
| % projects without major dispute | > 85% |

---

## Open Questions — RESOLVED

| Question | Resolution |
|---------|-----------|
| App vs WhatsApp-first? | Android + iOS + Web for homeowners; WhatsApp + POC model for supply side |
| Seed city? | Bareilly, Uttar Pradesh |
| AI floor plan in MVP? | Both — manual wizard AND AI photo-to-plan |
| Supervisors: in-house or marketplace? | Good to have — v1.1 |
| First revenue stream? | Good to have — commission on labor (v1); focus is on product-market fit first |
| Brand name? | "Housy" retained; alternatives documented above |
