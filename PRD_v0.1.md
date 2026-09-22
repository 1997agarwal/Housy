# Housy — Product Requirements Document (PRD)

> **Version:** 0.1 (Draft for Review)
> **Author:** Harshita G × Antigravity
> **Date:** September 2026
> **Status:** 🟡 Pending User Review

---

## Executive Summary

**Housy** is a comprehensive renovation and construction intelligence platform designed for the urban Indian homeowner who has little to no experience with the construction ecosystem. It bridges the massive gap between homeowners and the fragmented, unorganized world of contractors, labor, materials, equipment, and design guidance.

Think of it as a **"Swiggy for your house"** — where instead of food, you're ordering your entire renovation experience, coordinated end-to-end.

---

## The Problem Space

### Who Is The User?

The **primary user** is an **urban millennial/Gen-Z homeowner** who:
- Has lived in metro cities (Bengaluru, Mumbai, Delhi, Hyderabad, Pune) but owns/inherits property in a Tier 2/3 city or in a different part of the same metro.
- Has **zero local network** in the city where the property is located.
- Has **no construction knowledge** — doesn't know the difference between load-bearing and non-load-bearing walls, doesn't know where drainage lines run, doesn't understand what "PCC" or "DPC" means.
- Is **time-poor** — can't spend days hunting for labor at labor chowks, visiting material shops, and coordinating 7 different vendors.
- Is **money-conscious** — doesn't want to hire a full architect for a small renovation, but is constantly afraid of being cheated.
- Has **decision paralysis** — there are too many interdependent decisions (break this wall? where does drainage go? can this slab bear load?) and no trusted source to consult.

### Problem Categories

| # | Problem | Current "Solution" | Pain Level |
|---|---------|-------------------|-----------|
| 1 | Finding verified, skilled labor | Wandering labor chowks, word of mouth | 🔴 Critical |
| 2 | Assessing labor quality/skill | None — purely gut feel | 🔴 Critical |
| 3 | Getting construction equipment (jackhammers, concrete mixers) | Rent from unknown shops, or labor brings it | 🟠 High |
| 4 | Sourcing materials (cement, bricks, tiles, sand) | Asking locals, visiting markets | 🟠 High |
| 5 | Making feasibility decisions (can I break this wall?) | Guessing, expensive architect opinions | 🔴 Critical |
| 6 | Understanding what a renovation requires end-to-end | Google research, YouTube | 🟡 Medium |
| 7 | Coordinating multiple trades (mason, electrician, plumber, painter) | Manual phone calls, no oversight | 🔴 Critical |
| 8 | Budget estimation and tracking | Spreadsheets or nothing | 🟠 High |
| 9 | Finding a trustworthy local supervisor | Purely word of mouth | 🟠 High |
| 10 | Understanding building regulations and approvals | Lawyers/consultants, expensive | 🟡 Medium |

---

## Product Vision

> **"Housy makes every homeowner renovation-confident — by giving them the intelligence, the network, and the coordination tools to renovate their home without stress, without being cheated, and without needing to know anyone locally."**

---

## Target Market

### Primary Market (Phase 1)
- Urban Indian homeowners managing renovation of old/ancestral properties.
- Specifically targeting metros + Tier 1.5 cities: Bengaluru, Pune, Hyderabad, Chennai, Delhi NCR, Mumbai.
- Age: 28–50.
- Properties: 5–50 year old residential properties undergoing partial or full renovation.

### Secondary Market (Phase 2+)
- Self-construction (building from scratch on owned land).
- Real estate investors with multiple properties.
- NRI homeowners managing Indian properties remotely.
- Small commercial property renovation (shops, offices).

### Market Size (India)
- ~18 million homes renovated annually in India.
- Renovation market estimated at ₹3–5 lakh crore annually.
- Heavily unorganized — no dominant digital platform exists.
- Construction labor market: ~55 million workers, largely unregistered.

---

## Product Phases

### 🏗️ Phase 1 — Renovation Intelligence & Coordination
*Make renovation manageable for the clueless homeowner.*

### 🏠 Phase 2 — New Construction
*Guide the homeowner building from scratch.*

### 🎨 Phase 3 — Interior Design
*Aesthetic layer — modular furniture, décor, lighting, false ceilings.*

### ✨ Phase 4 — Luxury & Smart Homes
*Premium finishes, automation, smart home integration.*

---

# PHASE 1 — Detailed Feature Specification

## Feature Area 1: Property Onboarding & Digital Twin

### 1.1 Property Profile
The user creates a digital profile of their property. This is the **foundation of everything**.

**Inputs collected:**
- Location (city, locality, pincode)
- Property type (independent house, apartment, plot)
- Property age (estimated)
- Total built-up area (sq ft / sq m)
- Number of floors
- Current number of rooms (BHK configuration)
- Current number of bathrooms
- Ownership status (owned, inherited, rented — for renovation only)
- Optional: Property photos (exterior, interior, room-wise)
- Optional: Upload existing floor plan (PDF, photo, CAD file)

### 1.2 AI-Assisted Floor Plan Generation
**The single biggest "wow" feature for Phase 1.**

Many old properties have no floor plan. Housy will help create one.

**Approach A — Photo-to-plan (AI)**
- User takes photos of each room from 4 corners.
- AI (computer vision + depth estimation) reconstructs an approximate 2D floor plan.
- User verifies and adjusts room dimensions manually.

**Approach B — Manual Input via guided wizard**
- Room-by-room wizard: "Walk into your bedroom. What's its approximate length? Width? Does it have a window? Where is the door?"
- App generates a schematic from answers.

**Approach C — Upload & Enhance**
- Upload existing rough sketch or old blueprint.
- AI cleans it up, adds scale, labels rooms.

**Output:** A simplified 2D floor plan stored digitally. Not architect-grade, but sufficient for planning renovations, getting labor estimates, and sharing with contractors.

### 1.3 Renovation Scope Selector
User selects what they want to renovate:
- [ ] Bathroom addition / renovation
- [ ] Kitchen renovation
- [ ] Wall demolition / room merging
- [ ] Flooring replacement
- [ ] Electrical rewiring
- [ ] Plumbing overhaul
- [ ] Roof/terrace waterproofing
- [ ] Painting
- [ ] Doors & windows replacement
- [ ] Staircase modification
- [ ] Structural repairs (cracks, seepage)

---

## Feature Area 2: Renovation Intelligence Engine (AI Advisor)

This is Housy's **brain** — the feature that makes the platform intelligent rather than just a marketplace.

### 2.1 Feasibility Advisor

For each renovation task the user wants to do, the AI advisor:
1. Asks clarifying questions specific to that task.
2. Flags potential complications and dependencies.
3. Provides a feasibility score (High / Medium / Low / Requires Expert).
4. Recommends whether to proceed, what to check first, and what expert to consult.

**Example Flow — "I want to add a second bathroom":**

> **Housy asks:**
> - Where do you want to build it? (Floor plan selector)
> - Is there an existing bathroom nearby? How far?
> - Is it on ground floor or upper floor?
> - Do you have an open terrace above this space?
> - Do you know where your main drainage line exits the property?

> **Housy tells you:**
> - "Based on your inputs, adding a bathroom adjacent to Room 3 is feasible, but you'll need to break flooring for ~18 ft to extend the drainage line."
> - "The drainage slope must be maintained — your plumber will need to check the height difference between the existing outlet and new bathroom position."
> - "Estimated cost range: ₹1.8L – ₹3.2L depending on tile choice and fixture quality."
> - "We recommend a plumber site visit before finalizing the location."

### 2.2 Wall Intelligence

Before breaking any wall, the app guides the user through basic structural assessment:

**Questions asked:**
- Is this an exterior wall or interior wall?
- Does it run parallel or perpendicular to the roof slab?
- Is there a beam visible on top of the wall?
- What is the wall's thickness? (Measured via tape, or estimated)
- Is the property RCC framed or load-bearing masonry?

**Outputs:**
- **GREEN:** Wall is likely non-structural. Safe to break with normal labor.
- **AMBER:** Wall may be partially structural. Recommend structural engineer consultation (₹1,500–₹5,000 for a site visit).
- **RED:** High risk. This appears to be a load-bearing wall. Do NOT break without professional assessment.

> [!IMPORTANT]
> Housy never makes definitive structural engineering decisions. It helps the user ask the right questions and know when professional help is needed. Liability disclaimers are built into every AI recommendation.

### 2.3 Task Dependency Map

Users often don't know that tasks are interconnected. Housy auto-generates a **dependency graph** for the renovation:

Example for "Complete House Renovation":
```
Electrical rewiring → Must happen BEFORE plastering walls
Plumbing rough-in → Must happen BEFORE flooring
Wall breaking → Must happen BEFORE new wall construction
Waterproofing → Must happen BEFORE tiling bathrooms
False ceiling → Must happen AFTER electrical wiring
Painting → Must happen LAST (after all civil work)
```

This prevents the classic mistake of tiling a floor, then realizing you need to break it for a drainage pipe.

### 2.4 Material Calculator

User inputs room/area dimensions → App calculates:

| Material | Formula | Output |
|----------|---------|--------|
| Cement | Area + wall thickness + mortar ratio | Bags required |
| Bricks/Blocks | Wall area + bond type | Number of units |
| Sand | Proportional to cement | Cubic feet |
| Tiles | Floor/wall area + 10% wastage | Sq ft required |
| Paint | Wall area - doors/windows | Litres per coat |
| Waterproofing compound | Area | Kg required |
| PVC pipes (plumbing) | Schematic-based | Linear feet |
| Electrical wire | Room count + circuit design | Meters |

**Output:** A **Bill of Materials (BOM)** the user can share with material vendors or take to a shop.

### 2.5 Budget Estimator

Based on:
- City/locality (labor rates vary hugely — Bengaluru vs. Jabalpur)
- Renovation scope selected
- Property size
- Material quality tier (Economy / Standard / Premium)

Outputs a **range-based estimate** with line items:
- Labor cost per trade
- Material cost
- Equipment rental
- Contingency buffer (typically 15–20%)
- Housy coordination fee (optional)

---

## Feature Area 3: Resource Marketplace

The **supply side** of Housy — connecting homeowners with verified service providers and material vendors.

### 3.1 Labor Registry

**Categories of workers:**
- Mason (Mistri) — general civil work
- Plumber
- Electrician
- Tiles Fixer
- Painter
- Carpenter
- Waterproofing Specialist
- False Ceiling (POP/Gypsum)
- Demolition Worker
- Steel Fixer (for structural work)

**Worker Profile Contains:**
- Name, photo, government ID verification status
- Primary skill(s) + secondary skills
- Years of experience
- Location / area they operate in (city, neighborhoods)
- Daily rate (DR) and availability
- Past project photos (uploaded by worker or verified by Housy)
- Reviews and ratings from past homeowners
- Languages spoken
- Phone verified (OTP)

**For Workers (supply side onboarding):**
- Simple onboarding via WhatsApp bot or assisted by a Housy field agent.
- Workers do NOT need a smartphone or app initially — a Housy agent can register them.
- Workers receive job notifications via SMS/WhatsApp/Voice call.

### 3.2 Supervisor / Site Coordinator

For homeowners who cannot be present daily at the site (the core NRI / remote user), Housy offers a **Supervisor as a Service**:
- A Housy-verified supervisor visits site daily (or 3x/week).
- Reports to homeowner via app: photos, progress notes, issues flagged.
- Manages labor attendance, material delivery verification.
- Raises alerts if work is being done incorrectly.

This can be a premium add-on or Housy's core revenue driver.

### 3.3 Equipment Rental

A curated list of equipment available for daily/weekly rent:
- Jackhammer / Breaker
- Concrete Mixer
- Angle Grinder
- Tile Cutter
- Scaffolding
- Power Drill
- Water Pump (for waterproofing work)
- Generator (for sites with no power)

**Flow:**
- Homeowner selects equipment from app.
- Housy coordinates with local equipment rental shops (partner network).
- Equipment delivered to site on agreed date.
- Daily rental fee + deposit system.

### 3.4 Material Vendors

**Categories:**
- Cement (OPC 43/53, PPC)
- Bricks (red brick, fly ash brick, AAC block)
- Sand (river, M-sand)
- Aggregates (jelly/gravel)
- Tiles & Flooring
- Plumbing materials (pipes, fittings, taps, sanitary)
- Electrical materials (wires, switchboards, MCBs)
- Paint (primer, emulsion, texture)
- Waterproofing compounds
- Steel (rebar, mesh)

**Features:**
- Local vendor discovery (city + area based)
- Price comparison (3 vendors for same item)
- Request for Quote (RFQ) system — send your BOM, get quotes
- Delivery scheduling
- Material quality guide (which brand/grade is appropriate for your use case)

### 3.5 Professionals On-Demand

For tasks that need expert sign-off:
- **Structural Engineer** — for load-bearing wall assessment
- **Architect** — for renovation design consultation (1–3 hour sessions)
- **Interior Designer** — for space planning consultation
- **Vastu Consultant** — demand is real in this segment
- **Legal/Documentation** — building permits, NOC queries

**Model:** Pay-per-session consultation. Video call or site visit option.

---

## Feature Area 4: Project Management & Site Coordination

Once a homeowner has scoped, estimated, and hired — they need to **manage the project**.

### 4.1 Project Dashboard

A single view showing:
- Overall renovation progress (%)
- Active tasks and their status
- Labor on-site today (attendance)
- Materials delivered vs. pending
- Budget spent vs. remaining
- Upcoming milestones
- Open issues/blockers

### 4.2 Daily Progress Tracker

- Supervisor or homeowner logs daily progress.
- Upload photos tied to specific task/room.
- Mark tasks as: Not Started → In Progress → Done → Needs Inspection.
- Timeline view (Gantt-lite) showing planned vs. actual.

### 4.3 Payments & Expense Tracker

- Log every payment made (labor, material, equipment).
- Category-wise spend breakdown.
- Pending payments to workers.
- Digital payment integration (UPI, bank transfer).
- Optional: Escrow-style payment — release after milestone completion (premium feature).

### 4.4 Issue Flagging

- Any party (homeowner, supervisor, labor) can raise an issue.
- Issue types: Quality problem, Work stoppage, Material shortage, Design change needed, Payment dispute.
- Issues are tracked to resolution.
- Unresolved issues auto-escalate.

### 4.5 Communication Hub

- Chat with each worker/vendor.
- Group chat for the project (homeowner + supervisor + key contractors).
- Language support: English + Hindi + Kannada + Tamil + Telugu + Marathi (Phase 1 focus).
- Voice message support (critical for labor who prefer speaking over typing).

---

## Feature Area 5: Education & Community

### 5.1 Renovation Academy

Short-form educational content:
- "What is a load-bearing wall and how to identify one?"
- "Types of cement and when to use which"
- "How to read a basic floor plan"
- "What questions to ask your contractor before starting"
- "Red flags that your contractor is doing shoddy work"
- "How to verify if tiles are laid level"
- "Understanding your electrical circuit breaker panel"

**Format:** Short videos (2–5 min), illustrated guides, and a searchable Q&A.

### 5.2 Community Forum

- Homeowners share their renovation journeys.
- Ask questions, get answers from the community and Housy experts.
- Browse real renovation case studies: "I renovated a 40-year-old Bangalore house for ₹12L — here's what I learned."
- Location-based: See renovations happening in your neighborhood.

### 5.3 AI Chat Assistant ("Housy GPT")

A conversational AI that can answer any renovation question:
- "My walls are seeping water. What should I do?"
- "How long does it take to tile a 200 sq ft bathroom?"
- "What's the standard height for electrical switches in India?"
- "How do I know if my contractor is overcharging me for cement?"

Grounded in Indian construction standards (IS codes), local pricing data, and curated expert knowledge.

---

## Feature Area 6: Trust & Verification Layer

The single most critical problem in this space is **trust**. Housy's moat is its verification system.

### 6.1 Labor Verification
- Government ID (Aadhaar) verification (via UIDAI API or manual scan)
- Phone number OTP verification
- Police verification (voluntary, for premium workers — badge on profile)
- Skill assessment: For premium categories (electrician, plumber), a brief practical or knowledge test conducted by Housy field agents.
- Background check through previous employer references.

### 6.2 Review & Rating System
- Homeowners rate workers after each project on:
  - Quality of Work (1–5)
  - Punctuality (1–5)
  - Behaviour (1–5)
  - Value for Money (1–5)
- Workers can also rate homeowners (payment reliability, respectful behavior).
- Verified reviews only (linked to actual bookings).

### 6.3 Vendor Verification
- GST registration verification for vendors.
- Material authenticity: Cement bags with ISI mark, grade verification.
- Pricing transparency: Vendors must publish standard rates, no hidden costs.

### 6.4 Housy Quality Seal
A premium tier for labor and vendors who meet higher standards:
- Aadhaar verified ✅
- Skill tested ✅
- 4.5+ rating with 10+ reviews ✅
- No dispute history ✅
- Police verified ✅ (optional)

---

## Technical Architecture (High-Level)

### Platform Targets
- **Mobile App (Primary):** Android (India's dominant platform). iOS in Phase 2.
- **Web App (Secondary):** For homeowners who prefer desktop. Primarily for project management and reporting.
- **WhatsApp Bot:** For labor onboarding and job notifications. Critical for low-tech supply side.
- **Field Agent App:** Lightweight app for Housy field agents who onboard labor and conduct quality checks.

### Core Tech Components

| Component | Function |
|-----------|----------|
| AI Floor Plan Generator | Computer vision + depth estimation (on-device + cloud) |
| Renovation Intelligence Engine | LLM-based conversational advisor, grounded in construction knowledge |
| Matchmaking Algorithm | Labor ↔ Job matching based on skill, location, availability, rating |
| Real-time Communication | WebSocket-based chat + WhatsApp Business API |
| Payment Gateway | Razorpay / Cashfree (UPI, cards, bank transfer) |
| Maps & Location | Google Maps API (labor location, vendor proximity, site pin) |
| Document Storage | Property photos, floor plans, progress photos (S3/GCS) |
| Notifications | Push (FCM), SMS (Twilio/MSG91), WhatsApp (Meta Business API) |

---

## Business Model

### Revenue Streams

| Stream | Model | Phase |
|--------|-------|-------|
| **Take Rate on Labor Bookings** | 10–15% commission on labor fees booked through platform | Phase 1 |
| **Supervisor-as-a-Service** | ₹5,000–₹20,000/month per project | Phase 1 |
| **Equipment Rental Commission** | 15–20% on equipment rental orders | Phase 1 |
| **Material Vendor Commission** | 5–10% on material orders | Phase 1 |
| **Pro Consultation (On-demand expert)** | 20–30% of consultation fee | Phase 1 |
| **Premium Homeowner Subscription** | ₹999/month — unlimited AI advisor, priority matching | Phase 2 |
| **Vendor Listing Fee** | Featured placement for material vendors | Phase 2 |
| **SaaS for Contractors** | Project management tools for mid-size contractors | Phase 3 |

### Unit Economics (Rough)
- Average renovation project: ₹5L – ₹20L
- Housy take on labor: ₹15,000 – ₹50,000 per project (@ 10–15%)
- Supervisor-as-a-Service: ₹15,000 – ₹60,000 per project
- Combined take per project: ₹30,000 – ₹1,10,000

---

## Competitive Landscape

| Platform | What They Do | Gap Housy Fills |
|----------|-------------|-----------------|
| **Urban Company** | Home services (cleaning, AC repair) | No construction/renovation; no material sourcing; no project management |
| **BuildSupply** | B2B material procurement | No consumer focus; no labor; no intelligence |
| **Homelane / Livspace** | Premium interior design | Expensive, only interiors, no civil renovation |
| **NoBroker** | Real estate marketplace | No renovation ecosystem |
| **Local Contractors** | End-to-end but opaque | No transparency, no accountability |
| **Housy** | **Full-stack renovation OS** | Fills all gaps |

Housy's moat: **Intelligence + Trust + End-to-end Coordination** in a single platform.

---

## Go-To-Market Strategy

### Phase 1 Seed Market: Bengaluru
- Dense NRI and urban homeowner population.
- High renovation activity.
- Strong tech adoption for app-first solutions.
- Founder's home market → local knowledge + network.

### Acquisition Channels
1. **SEO + YouTube Content:** "How to renovate a house in Bengaluru" — massive search demand.
2. **Instagram/Facebook:** Renovation before/after content, cost breakdowns.
3. **WhatsApp Communities:** Apartment society groups, homeowner WhatsApp groups.
4. **Partnerships:** Real estate agents (often asked "who can renovate this?"), property management firms.
5. **Labor-side acquisition:** Housy field agents at labor chowks.

### Word of Mouth Loop
- Homeowner has a great experience → Shares renovation photos on social media → Tags Housy → New homeowners discover Housy.
- This is a inherently visual and shareable product.

---

## Phase 2 Preview — New Construction

Phase 2 expands Housy from *renovating existing homes* to *building new homes from scratch*.

**Additional features:**
- Full architect and structural engineer integration
- RERA compliance guidance
- Municipal approval / building permit assistance
- Soil testing coordination
- Foundation to finishing — end-to-end project management
- Contractor management (full building contractor vs. labor-only)
- Time-lapse construction photo documentation

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Labor quality is inconsistent despite verification | High | Tiered skill testing; strong review system; replacement guarantee |
| AI advisor gives wrong structural advice | Critical | Strict liability disclaimers; always recommend expert for structural; continuous grounding with IS codes |
| Vendor pricing manipulation | Medium | Price benchmarking; user reviews; Housy spot-check audits |
| Low labor adoption of WhatsApp bot | High | Housy field agents as intermediaries; voice call fallback |
| Trust deficit in new markets | High | City-by-city expansion with heavy field presence |
| Regulatory risk (RERA, labor laws) | Medium | Legal counsel; compliance monitoring |

---

## Success Metrics (Phase 1)

| Metric | Target (12 months post-launch) |
|--------|-------------------------------|
| Properties onboarded | 5,000 |
| Labor workers registered | 10,000 |
| Projects successfully completed | 1,000 |
| NPS score | > 50 |
| Average project rating | > 4.2 / 5 |
| % projects without major dispute | > 85% |
| Monthly active users | 15,000 |
| Supervisor-as-a-Service projects | 200 |

---

## Open Questions for Review

> [!IMPORTANT]
> **Q1 — App vs. WhatsApp-first?**
> Given the target audience includes labor and semi-urban users, should Phase 1 be WhatsApp-first (with app as complement) or app-first? This changes tech architecture significantly.

> [!IMPORTANT]
> **Q2 — City focus for seed market?**
> You mentioned Bengaluru as home city but the renovation is in your home city. Should we seed in your current renovation city first (where you have real ground truth), or go Bengaluru-first?

> [!IMPORTANT]
> **Q3 — AI floor plan scope in MVP?**
> The photo-to-floor-plan feature is technically ambitious. For MVP, do we scope it down to a guided manual wizard only, and add AI vision in v1.1?

> [!IMPORTANT]
> **Q4 — Supervisor-as-a-Service: In-house or marketplace?**
> Should Housy hire supervisors directly (more control, higher quality, higher cost) or build a marketplace of freelance supervisors (faster scale, harder to quality control)?

> [!IMPORTANT]
> **Q5 — Revenue model priority?**
> For earliest revenue, which stream do we prioritize? Commission on labor bookings (requires supply and demand) vs. Supervisor-as-a-Service (premium, immediate revenue, but needs supervisor supply)?

> [!NOTE]
> **Q6 — Brand name?**
> "Housy" is the working name used in this PRD. Is this the intended product name, or shall we explore naming options?
