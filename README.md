# FamilyBrief 🗓️

> Your family's AI chief of staff

## Why this project exists

This project is intentionally both a **real product** and a **sandbox for learning**. My goals are to:

- Explore how far I can get with **pair‑/live‑coding alongside AI**, and how much direction an experienced developer still needs to provide.
- Try out **modern tooling** (Next.js App Router, TanStack Query, Zustand, Supabase, Stripe, Resend) in a realistic, end‑to‑end app.
- Experiment with **AI technologies and APIs** (Anthropic / Claude) and see what good patterns for prompts, error‑handling, and observability look like.
- Learn **how to design and integrate AI features** into a web app in a maintainable, testable way (not just “call the model from a button click”).
- Solve a **real-world problem** my family (and many others) have: chaotic school/activity communications and calendar overload.
- Practice thinking like a **product manager**: breaking down the product into increments, roadmapping, and iterating based on feedback.
- Refine my own **development workflow in the AI era** — what to delegate to AI, what to keep as human judgment, and how to combine both effectively.

## What it does (current & planned)
- ✅ Displays a clean family calendar with colour-coded members
- ✅ Lets you add family members and events manually
- 🔜 Parses forwarded school/activity emails into calendar events using Claude AI
- 🔜 Sends a personalised weekly briefing every Sunday morning

## Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router) for routing, API routes, and server/client components.
- **UI / State**:
  - React 18 function components.
  - **TanStack Query** for server state (events, family members) + caching and refetching.
  - **Zustand** for lightweight client/UI state (e.g. selected date on the dashboard).
- **Backend & Data**:
  - **Supabase** (Postgres + Auth) as the primary data store.
  - `supabaseAdmin` (service role) used only on the server in API routes and services.
- **Domain & Services**:
  - Domain types in `src/types` and `src/domain` model users, family members, events, and briefings.
  - Application services in `src/services` encapsulate business logic (`eventService`, `familyService`, `briefingService`).
- **AI & Email**:
  - **Claude (Anthropic)** for email parsing and weekly briefing generation.
  - **Resend** for outbound briefing email delivery.
- **Billing**:
  - **Stripe** for subscription billing (planned $5/month offering).

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── logout/      # POST /api/auth/logout – server-side sign‑out
│   │   ├── events/          # /api/events – CRUD for calendar events via eventService
│   │   ├── family-members/  # /api/family-members – read/create family members via familyService
│   │   ├── parse-email/     # Inbound email webhook → Claude parsing → events
│   │   └── weekly-briefing/ # Cron job → generate + send Sunday briefings
│   ├── dashboard/           # Main calendar view (uses TanStack Query + Zustand)
│   ├── family/              # Family members management screen
│   ├── onboarding/          # Family setup flow
│   └── auth/                # Login / signup + email confirmation screens
├── components/
│   ├── calendar/            # Calendar grid, week strip, event sidebar, add-event modal
│   └── layout/              # Dashboard layout (sidebar, shell)
├── lib/
│   ├── anthropic.ts         # Anthropic client + email/briefing prompt helpers
│   ├── supabase.ts          # Browser Supabase client (auth/session)
│   ├── supabaseAdmin.ts     # Service‑role Supabase client (server‑only)
│   ├── stripe.ts            # Payment helpers
│   └── email.ts             # Resend helpers
├── domain/                  # Domain-level wrappers for core models (events, family members)
├── services/
│   ├── authClient.ts        # Client-side helpers (get access token, logout)
│   ├── eventService.ts      # Event fetch/create/delete using supabaseAdmin
│   ├── familyService.ts     # Family member fetch/create using supabaseAdmin
│   └── briefingService.ts   # Weekly briefing generation + email sending orchestration
├── hooks/                   # useEvents, useFamilyMembers – TanStack Query feature hooks
├── stores/                  # Zustand stores (e.g. UI store for selected date)
└── types/                   # Shared TypeScript types (domain-oriented shapes)
```

## Setup

1. Clone and install
```bash
npm install
```

2. Copy env file and fill in keys
```bash
cp .env.example .env.local
```

3. Set up Supabase — run `supabase-schema.sql` in your project's SQL editor

4. Set up Stripe — create a $5/month recurring product and copy the price ID

5. Set up Resend — configure inbound email routing to your `/api/parse-email` webhook

6. Run locally
```bash
npm run dev
```

## E2E tests (Playwright)
Run `npm run test:e2e` (requires the dev server or will start it automatically when not in CI). The spec covers auth and check-email pages, and an optional **signed-in flow** (login → dashboard → add event) when `E2E_LOGIN_EMAIL` and `E2E_LOGIN_PASSWORD` are set.

## Deployment
Deploy to Vercel. Set up a cron job (Vercel Cron or GitHub Actions) to call `/api/weekly-briefing` every Sunday at 7am.

## Tech Debt & Clean‑up Checklist

- [x] Extract remaining Supabase calls from client components/hooks into services + API routes
- [x] Consolidate auth flows (`/auth`, `/auth/check-email`, onboarding) and document the happy path
- [x] Add error boundary / empty state components for dashboard and family screens
- [x] Improve domain types (`src/domain/*`) with richer value objects and invariants
- [x] Set up Jest + React Testing Library and get a green test suite
- [x] Add unit tests for core services (`eventService`, `familyService`)
- [x] Add unit tests for remaining services (`briefingService`, `userService`)
- [x] Add component tests for key calendar UI (`CalendarGrid`, `EventSidebar`, `AddEventModal`)
- [x] Add E2E test for signup → onboarding → first event flow
- [x] Improve accessibility (focus states, ARIA roles, keyboard navigation across calendar)
- [ ] Add CI (GitHub Actions) to run tests and lint on every push/PR
- [ ] Track and enforce minimum test coverage thresholds over time

## Auth & Onboarding – Happy Path

1. **Signup or login (`/auth`)**
   - New users land on `/auth` in **signup** mode, enter email + password, and submit.
   - Existing users switch to **login** mode on the same screen, enter credentials, and submit.
2. **Email confirmation (`/auth/check-email`)**
   - On successful signup, the app redirects to `/auth/check-email?email=<user email>` and Supabase sends a confirmation email.
   - The user opens the email, clicks the confirmation link, then returns to `/auth` and signs in with the same credentials.
3. **Onboarding (`/onboarding`)**
   - On successful login, the app redirects to `/onboarding` for family setup.
   - `/onboarding` requires an active Supabase session; unauthenticated visitors are redirected back to `/auth`.
   - The user adds their own name + family name, then adds one or more family members and saves.
4. **Forwarding + trial**
   - After saving profile + members, onboarding walks through email forwarding and then offers to start the Stripe trial.
   - From here the user can either **start the free trial** or **skip** straight to the dashboard (`/dashboard`).

## Product Roadmap (High Level)

### v0.1 – Private Alpha
- [x] Basic family calendar with manual event entry
- [ ] Email parsing into events for a single family
- [ ] Weekly briefing email per family
- [ ] Simple settings page (manage subscription, email preferences)

### v0.2 – Multi‑family polish
- [ ] Shared calendar view across multiple guardians
- [ ] Per‑child preferences (who gets which briefings / notifications)
- [ ] Better mobile layout for week strip and sidebar

### v0.3 – Insights & automation
- [ ] “Clash detection” for overlapping events across family members
- [ ] Smart reminders (travel time, packing lists) based on event type
- [ ] Briefing history view inside the app with search/filter
