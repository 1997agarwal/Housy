# 🏠 Housy — Renovation Intelligence Platform

> Your renovation, simplified.

## Project Structure

```
Housy/
├── apps/
│   ├── mobile/          # Expo React Native (Android + iOS)
│   ├── web/             # Next.js web app
│   └── backend/         # NestJS API server
│       └── supabase/
│           └── schema.sql  ← Run this first in Supabase
├── packages/
│   └── shared/          # Shared TypeScript types
├── turbo.json
└── package.json
```

## Quick Start

### 1. Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- Expo CLI: `npm install -g expo-cli`
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

---

### 2. Database Setup (Supabase)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → paste the contents of `apps/backend/supabase/schema.sql`
3. Click **Run** — this creates all 9 tables, RLS policies, indexes, and triggers

---

### 3. Backend Setup
```bash
cd apps/backend

# Copy and fill in your credentials
cp .env.example .env

# Install dependencies
npm install

# Run in dev mode
npm run dev
# → API running at http://localhost:4000/api/v1
# → Swagger docs at http://localhost:4000/docs
```

**Required `.env` values:**
| Key | Where to get it |
|-----|----------------|
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| `RAZORPAY_KEY_ID` | [razorpay.com](https://razorpay.com) (test mode) |

---

### 4. Mobile App Setup
```bash
cd apps/mobile

# Copy and fill in env vars
cp .env.example .env

# Install dependencies
npm install

# Start Expo dev server
npm run dev
# → Scan QR code with Expo Go app on your phone
# → Or run on emulator: npm run android
```

**Required `.env` values:**
| Key | Value |
|-----|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Same as backend SUPABASE_URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Same as backend SUPABASE_ANON_KEY |
| `EXPO_PUBLIC_API_URL` | `http://localhost:4000/api/v1` (or deployed URL) |

---

## App Screens

| Screen | File | Description |
|--------|------|-------------|
| Login | `app/(auth)/login.tsx` | Phone OTP authentication |
| Home | `app/(tabs)/home.tsx` | Dashboard with project card + quick actions |
| Find Labor | `app/(tabs)/search.tsx` | Search & filter verified POCs |
| Ask Housy | `app/(tabs)/advisor.tsx` | AI renovation advisor chat |
| Project | `app/(tabs)/project.tsx` | Project dashboard — tasks, budget, photos |
| Profile | `app/(tabs)/profile.tsx` | User profile + settings |
| Property Wizard | `app/(onboarding)/property.tsx` | 4-step property setup |

## Backend API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/send-otp` | Send OTP to phone |
| POST | `/api/v1/auth/verify-otp` | Verify OTP, get token |
| POST | `/api/v1/properties` | Create property profile |
| GET | `/api/v1/properties` | List user's properties |
| POST | `/api/v1/ai-advisor/chat` | Freeform AI chat |
| POST | `/api/v1/ai-advisor/bathroom-feasibility` | Bathroom addition analysis |
| POST | `/api/v1/ai-advisor/wall-breaking` | Wall safety assessment |
| POST | `/api/v1/ai-advisor/budget-estimate` | Cost range estimate |
| POST | `/api/v1/ai-advisor/material-calculator` | Bill of materials |

Full docs: `http://localhost:4000/docs` (Swagger UI)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) |
| Web | Next.js 15 |
| Backend | NestJS |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase OTP |
| AI | Gemini 1.5 Pro |
| State | Zustand |
| Data fetching | TanStack Query |
| Payments | Razorpay |

---

## Phase Roadmap

- **Phase 1 (Now):** Renovation — Labor marketplace, AI advisor, project management
- **Phase 2:** New Construction — Full build from scratch
- **Phase 3:** Interiors — Modular furniture, décor, false ceilings
- **Phase 4:** Luxury & Smart Homes

---

*Built for the urban Indian homeowner who's lost in the chaos of renovation.*
