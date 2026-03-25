# Architecture

## Design goals

| Goal | How we approach it |
|------|-------------------|
| **Testability** | Business rules live in pure functions and use cases; I/O behind interfaces ("ports") so tests use fakes/mocks. |
| **Replaceable infrastructure** | Swap Supabase, Resend, or Anthropic without rewriting orchestration — only adapters change. |
| **Clear boundaries** | UI and HTTP handlers stay thin; they map DTOs and call application code, not SQL or SDKs directly. |
| **Honest pragmatism** | All bounded contexts (**briefing**, **events**, **family**, **user**, **parsedEmail**, **calendarImport**) use ports / use cases / modules; `supabaseAdmin` stays in `src/infrastructure/*` and `src/lib/supabaseAdmin.ts` (plus auth token verification). Routes call only `run*` module functions — no service layer or direct SDK calls. |

---

## Architectural style

**Clean Architecture:** dependencies point inward. Outer layers (Next.js routes, React, Supabase SDK, Resend) depend on inner abstractions; domain rules never import frameworks.

**DDD (lightweight):** The **briefing** feature is treated as a small bounded context: one logical aggregate per `(user_id, week_start)` — at most one persisted row per user per calendar week for manual/cron flows (enforced in application code via upsert, not only by DB constraints).

**SOLID (where it matters):**

- **S** — Single responsibility: `generateBriefingForUserWeek` orchestrates; `supabaseBriefingRepository` persists; `sendWeeklyBriefingEmail` sends mail.
- **O** — New channels (e.g. push) can implement the same ports without editing domain parsers.
- **L** — Repository and email implementations are swappable with test doubles.
- **I** — Small interfaces (`BriefingRepository`, `WeeklyBriefingEmailPort`, `EventQueryPort`, `UserQueryPort`, `EventRepository`, `FamilyRepository`, `UserRepository`, …) instead of one giant module.
- **D** — Use cases depend on ports; routes delegate to composition roots (`briefingModule`, `eventModule`, `familyModule`) that wire concrete adapters.

---

## Layer walkthrough

### Domain (`src/domain/` + `src/lib/briefing/`)

Core model types and invariants. No framework imports.

- **Types:** `Event`, `FamilyMember`, `User`, briefing types — canonical definitions live in `src/domain/`; `src/types/index.ts` re-exports them for existing `@/types` imports
- **Constants:** `EVENT_CATEGORIES`, `FAMILY_MEMBER_ROLES` — `src/lib/api/schemas/primitives.ts` builds Zod enums from these same tuples so API validation cannot drift from the domain
- **Briefing helpers** (`src/lib/briefing/`): pure week math, section parsing, and "current briefing" selection — no Supabase, no Resend
- **Date handling:** ISO week boundaries via Moment.js; `Date` is the in-memory type; `toIsoDateString` / `parseIsoDate` convert for APIs and SQL
- **Section parsing:** plain-text briefing sections parsed once for both HTML email and in-app UI so formatting never drifts

---

### Application — briefing (`src/application/briefing/`)

Orchestrates all briefing generation, delivery, and feedback.

- **Ports:** `BriefingRepository` (incl. `recordFeedback` → `briefing_feedback`), `WeeklyBriefingEmailPort`, `EventQueryPort`, `UserQueryPort` (slim fields for generation + email), `ActiveUsersQueryPort` (cron subscriber list)
- **Use cases:**
  - `generateBriefingForUserWeek` — loads events, generates with Claude, upserts, emails
  - `listBriefingItemsForUser`
  - `recordBriefingFeedback`
  - `ensureBriefingForWeek` — event-driven refresh for a single week
  - `syncBriefingsForDates` — deduplicates weeks across a list of dates, non-fatal per-week errors
  - `sendWeeklyBriefingsForActiveUsers` — cron batch via `Promise.allSettled`
- **Module exports** (`briefingModule.ts`):
  - `runSyncBriefingsForDates` — called after event create/delete/import
  - `runSendWeeklyBriefingsForActiveUsers` — called by the cron route

---

### Application — events (`src/application/events/`)

- **Repository:** `EventRepository` includes bulk `insertExtractedEventsForUser` for email/vision imports
- **Module export:** `runInsertExtractedEventsForUser` alongside existing run functions

### Application — family (`src/application/family/`)

- **Repository:** `FamilyRepository`
- **Module export:** `runGetFamilyMembersForUser` — used by parse-email, parse-image, and other flows (not the manual weekly generate path)

### Application — user (`src/application/user/`)

- **Repository:** `UserRepository`
- **Module exports:** `runGetUserProfile`, `runUpsertUserProfile`, `runGetActiveSubscribedUsers` (cron subscriber list)
- `GET/POST /api/profile` and other callers use `userModule`, not a legacy service layer

### Application — parsed email (`src/application/parsedEmail/`)

- Small port + `runRecordParsedEmail` so `/api/parse-email` never calls `supabaseAdmin` directly for `parsed_emails`

### Application — calendarImport (`src/application/calendarImport/`)

End-to-end image/PDF upload pipeline owned by `calendarImportModule.ts`:

1. Validate file → resolve MIME type
2. Load family members via `familyModule`
3. Call Claude vision
4. Build insert rows from domain helpers
5. Insert events via `eventModule`
6. Refresh briefings via `runSyncBriefingsForDates`

Exposed as `runProcessParseImageUpload` — route stays thin, all sub-steps testable via module mocks.

---

### Infrastructure (`src/infrastructure/`)

Concrete Supabase adapters — one per feature:

- `supabaseBriefingRepository` — uses `upsert_weekly_briefing` RPC for atomic week rows; implements `recordFeedback`
- `supabaseEventRepository`, `supabaseFamilyRepository`, `supabaseUserRepository`, `supabaseParsedEmailRepository` — each maps DB rows ↔ domain types
- `email.ts` — implements the email port (Resend)
- `lib/anthropic.ts` — briefing generation calls `generateWeeklyBriefing` from here

---

### Delivery (`src/app/api/`, `src/components/`, `src/hooks/`)

Routes stay thin: **auth → Zod I/O → `run*` call → `jsonResponse`**.

- All routes import from module roots (`briefingModule`, `eventModule`, `familyModule`, `userModule`, `parsedEmailModule`, `calendarImportModule`) — never `supabaseAdmin` or service layer directly
- Date fields in responses are serialized explicitly to ISO strings before `jsonResponse`, not via JSON round-tripping
- Client hooks parse responses with the same Zod schemas as the server

---

## HTTP contracts with Zod (`src/lib/api/`)

All JSON App Router handlers under `src/app/api/**` use shared schemas so inputs and outputs match the types the UI expects:

| Piece | Role |
|--------|------|
| [`src/lib/api/schemas/`](../src/lib/api/schemas/) | **Primitives** (event category and family role enums align with `src/domain` tuples), **request bodies**, **query objects**, and **response** shapes (events, members, briefings, cron `{ sent, total }`, errors). |
| [`src/lib/api/httpZod.ts`](../src/lib/api/httpZod.ts) | `parseJsonBody(req, schema)` — `safeParse` + `400` with `{ error }` on failure; `parseSearchParams(url, build, schema)` for query strings; `jsonResponse(data, schema, init?)` — `schema.parse` before `NextResponse.json` so bad domain-to-JSON mapping fails in tests/CI. |

- **Routes:** after auth, call `parseJsonBody` / `parseSearchParams`; on success pass typed `data` into use cases; return with `jsonResponse(...)`. Multipart `parse-image` only validates the success JSON (`events` + `count`), not the form body.
- **Hooks:** `await res.json()` then `schema.parse(raw)` (or `errorResponseSchema.safeParse` on errors) so a breaking API change throws early instead of corrupting React state.
- **Errors:** Invalid JSON → `400` + `{ error: "Invalid JSON" }`. Zod validation failures → `400` + `{ error: "<first issue message>" }`. Auth failures → `{ error: "…" }` with `401`/`403`.

---

## Authentication & data access

- **Browser:** `src/lib/supabase.ts` (anon key) for session and client-side auth.
- **Server:** `src/lib/supabaseAdmin.ts` (service role) is used exclusively from infrastructure adapters (`src/infrastructure/**`) and `src/lib/apiAuth.ts` (Bearer token verification). No route, module, or use case imports it directly. RLS on `weekly_briefings` allows users to **select** their rows; **writes** for generation and cron use the service role. `briefing_feedback` rows are inserted server-side after verifying the briefing belongs to the user.

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/logout/
│   │   ├── briefing/
│   │   │   ├── generate/       # POST – manual weekly briefing generation
│   │   │   └── list/           # GET – slim briefing list for sidebar
│   │   ├── events/             # Calendar CRUD via eventModule + Zod
│   │   ├── family-members/
│   │   ├── observability/
│   │   │   └── feedback/       # POST – thumbs up/down (briefing id)
│   │   ├── parse-email/        # Inbound email → Claude → events
│   │   ├── parse-image/        # Image/PDF → Claude → events
│   │   ├── profile/
│   │   └── weekly-briefing/    # Cron – batch send for subscribed users
│   ├── dashboard/              # Calendar, briefings, family, settings
│   ├── onboarding/
│   └── auth/
├── application/
│   ├── briefing/               # Ports (incl. ActiveUsersQueryPort), use cases (sync + cron + generate), briefingModule
│   ├── calendarImport/         # runProcessParseImageUpload (image/PDF → events pipeline)
│   ├── events/                 # eventPorts, eventUseCases, eventModule
│   ├── family/                 # familyPorts, familyUseCases, familyModule
│   ├── user/                   # userPorts, userUseCases, userModule
│   └── parsedEmail/            # parsed email ingest port + module
├── infrastructure/
│   ├── briefing/
│   │   └── supabaseBriefingRepository.ts  # RPC upsert + feedback insert
│   ├── events/
│   │   └── supabaseEventRepository.ts
│   ├── family/
│   │   └── supabaseFamilyRepository.ts
│   ├── user/
│   │   └── supabaseUserRepository.ts
│   └── parsedEmail/
│       └── supabaseParsedEmailRepository.ts
├── components/
│   ├── calendar/
│   └── layout/                   # DashboardLayout (sidebar nav)
├── domain/                     # Core types + invariants; calendarImport; re-exported via types/
├── lib/
│   ├── api/
│   │   ├── httpZod.ts          # parseJsonBody, parseSearchParams, jsonResponse
│   │   └── schemas/            # Zod: bodies, queries, responses, primitives
│   ├── anthropic.ts
│   ├── briefing/               # Pure domain: week + parseSections + pickCurrentBriefing
│   ├── email.ts                # Resend adapter (implements email port)
│   ├── apiAuth.ts
│   ├── supabase.ts / supabaseAdmin.ts
│   └── stripe.ts
├── hooks/                      # useEvents, useFamilyMembers, useBriefings
├── stores/
└── types/                      # Barrel re-exporting @/domain types
```

---

## Key technology choices

| Choice | Reason |
|--------|--------|
| **Next.js 14 App Router** | File-based routes, API routes, React Server Components where useful, single deployable unit for Vercel. |
| **TanStack Query** | Server state for events, family, briefings — caching, invalidation after mutations, consistent loading/error UX. |
| **Zustand** | Minimal UI state (e.g. selected calendar day) without boilerplate. |
| **Supabase** | Postgres + Auth + fast iteration; RLS for defense in depth on client-readable tables. |
| **Service role in API only** | Central place to enforce "only this user's data" after JWT verification. |
| **Moment.js** | Explicit calendar-week semantics (`isoWeek`) and stable formatting across environments; briefing code uses `Date` in TypeScript and converts at I/O boundaries. |
| **Resend** | Simple transactional email API; HTML + plain text from one send path. |
| **Claude (Anthropic)** | Family-facing copy and structured extraction; prompts live in `src/lib/anthropic.ts`. |
| **Zod** | Runtime validation for API JSON bodies, query params, and responses; shared with client hooks under `src/lib/api/schemas`. |
| **Jest + RTL** | Unit tests for domain, use cases, infrastructure adapters, remaining services, and API route handlers; `setupTests` sets env for Supabase client in tests. |
