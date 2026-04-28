# FamilyBrief 🗓️

[![CI](https://github.com/LukeAveil/familyBrief/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/LukeAveil/familyBrief/actions/workflows/ci.yml)

> Your family's AI chief of staff

## Why this project exists

This project is intentionally both a **real product** and a **sandbox for learning**. My goals are to:

- Explore how far I can get with **pair‑/live‑coding alongside AI**, and how much direction an experienced developer still needs to provide.
- Try out **modern tooling** (Next.js App Router, TanStack Query, Zustand, Supabase, Stripe, Resend) in a realistic, end‑to‑end app.
- Experiment with **AI technologies and APIs** (Anthropic / Claude) and see what good patterns for prompts, error‑handling, and observability look like.
- Learn **how to design and integrate AI features** into a web app in a maintainable, testable way (not just "call the model from a button click").
- Solve a **real-world problem** my family (and many others) have: chaotic school/activity communications and calendar overload.
- Practice thinking like a **product manager**: breaking down the product into increments, roadmapping, and iterating based on feedback.
- Refine my own **development workflow in the AI era** — what to delegate to AI, what to keep as human judgment, and how to combine both effectively.

---

## Tech stack

- **Framework:** Next.js 14 (App Router)
- **UI / state:** React 18, TanStack Query, Zustand, Tailwind
- **Backend / data:** Supabase (Postgres + Auth), Zod for API I/O
- **AI / email:** Anthropic Claude, Resend
- **Billing:** Stripe (trial / subscription)

For detailed rationale behind each choice, see [docs/architecture.md](docs/architecture.md#key-technology-choices).

---

## Setup

**Node version:** This repo targets **Node 20** (see [`.nvmrc`](.nvmrc)). Use `nvm use` (or install Node 20) before `npm install`.

1. Clone and install

```bash
npm install
```

2. Copy env file and fill in keys

```bash
cp .env.example .env.local
```

3. Set up Supabase — apply `supabase-schema.sql` (or use the Supabase CLI) and run SQL migrations under `supabase/migrations/`. Fresh environments should rely on migrations as the source of truth.

4. Set up Stripe — create a $5/month recurring product and copy the price ID.

5. Set up Resend — API key, verify domain, optionally inbound routing to `/api/parse-email`.

6. Run locally

```bash
npm run dev
```

### npm audit and Next.js

`npm audit` may report **high** findings for `next` even on the latest 14.2.x. The suggested `npm audit fix --force` typically installs Next 15+ — a **major upgrade**, not a safe patch. Keep `next@^14.2.35` until you deliberately migrate.

---

## CI

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on push and pull_request to `main`: checkout, Node from `.nvmrc`, `npm ci`, `npx tsc --noEmit`, ESLint (`next lint --max-warnings 0`), `npm test -- --coverage --ci`, and `npm run build`.

The job sets dummy string values for all env variables (hardcoded in the workflow) so typecheck, tests, and `next build` can run without GitHub secrets.

## E2E tests (Playwright)

Run `npm run test:e2e` (requires the dev server or will start it automatically). The spec covers auth and check-email pages, and an optional signed-in flow (login → dashboard → add event) when `E2E_LOGIN_EMAIL` and `E2E_LOGIN_PASSWORD` are set.

## Deployment

Deploy to Vercel. Set up a cron job to `POST /api/weekly-briefing` with header `Authorization: Bearer <CRON_SECRET>` on your desired schedule (e.g. Sunday morning). The handler calls `runSendWeeklyBriefingsForActiveUsers` and returns `{ sent, total }` counts.

---

## Auth & onboarding — happy path

1. **Signup or login (`/auth`)** — new users enter email + password; existing users switch to login mode on the same screen.
2. **Email confirmation (`/auth/check-email`)** — on successful signup, Supabase sends a confirmation email. User confirms, then returns to `/auth` to sign in.
3. **Onboarding (`/onboarding`)** — add family name, own name, and family members. Requires an active session; unauthenticated visitors are redirected to `/auth`.
4. **Forwarding + trial** — after saving profile + members, onboarding walks through email forwarding then offers a Stripe trial or skip to `/dashboard`.

---

## Product roadmap

### v0.1 – Private Alpha

- [x] Basic family calendar with manual event entry
- [x] Email parsing into events (inbound `/api/parse-email`)
- [x] Weekly briefing email per family (manual generate + in-app history)
- [ ] Simple settings page (manage subscription, email preferences)

### v0.2 – Multi‑family polish

- [ ] Shared calendar view across multiple guardians
- [ ] Per‑child preferences (who gets which briefings / notifications)
- [ ] Better mobile layout for week strip and sidebar

### v0.3 – Insights & automation

- [ ] "Clash detection" for overlapping events across family members
- [ ] Smart reminders (travel time, packing lists) based on event type
- [ ] Briefing history view inside the app with search/filter

---

## Tech debt & clean‑up checklist

- [x] Extract remaining Supabase calls from client components/hooks into services + API routes
- [x] Consolidate auth flows (`/auth`, `/auth/check-email`, onboarding) and document the happy path
- [x] Add error boundary / empty state components for dashboard and family screens
- [x] Improve domain types (`src/domain/*`) with richer value objects and invariants
- [x] Set up Jest + React Testing Library and get a green test suite
- [x] Add unit tests for event/family Supabase adapters (`supabaseEventRepository`, `supabaseFamilyRepository`)
- [x] Add unit tests for use cases (`sendWeeklyBriefingsForActiveUsers`, user path via `supabaseUserRepository`)
- [x] Remove `src/services/` — all orchestration promoted to application use cases + modules (no service layer)
- [x] Add component tests for key calendar UI (`CalendarGrid`, `EventSidebar`, `AddEventModal`)
- [x] Add E2E test for signup → onboarding → first event flow
- [x] Improve accessibility (focus states, ARIA roles, keyboard navigation across calendar)
- [x] Add CI (GitHub Actions) to run tests and lint on every push/PR
- [ ] Track and enforce minimum test coverage thresholds over time
