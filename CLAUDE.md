# FamilyBrief – Claude Rules
# These rules define the architectural standards, coding patterns, and conventions
# for this codebase. Follow them precisely when generating or modifying any code.

---

## 1. Architecture – Clean Architecture + Ports & Adapters

Dependencies point inward. Outer layers depend on inner abstractions. Inner layers never
import from outer layers.

### Layer order (inner → outer)
1. **Domain** (`src/domain/`) — pure types, constants, validators. No framework imports.
2. **Application** (`src/application/`) — use cases and port interfaces. No Supabase, no Resend, no Anthropic SDK.
3. **Infrastructure** (`src/infrastructure/`) — concrete adapters (Supabase repositories, email, AI clients).
4. **Delivery** (`src/app/api/`, `src/app/`, `src/components/`, `src/hooks/`) — Next.js routes, React components, hooks.

### Forbidden import directions
- Domain must NEVER import from application, infrastructure, or delivery.
- Application must NEVER import from infrastructure or delivery.
- Application must NEVER import directly from `src/services/*` or `src/lib/supabaseAdmin`.
- Infrastructure must NEVER import from delivery.
- API routes must NEVER import `supabaseAdmin` directly — use module composition roots.
- API routes must NEVER import repository implementations directly — use module roots.

### The only valid supabaseAdmin import locations
- `src/infrastructure/**/*.ts` — repository implementations only
- `src/lib/supabaseAdmin.ts` — the singleton definition itself
- `src/lib/apiAuth.ts` — auth token validation only

---

## 2. Feature Structure – Ports, Use Cases, Module, Infrastructure

Every feature (briefing, events, family, user) must follow this exact structure:

```
src/application/<feature>/
  <feature>Ports.ts      # TypeScript interfaces only — no implementations
  <feature>UseCases.ts   # Orchestration functions — depend only on ports and domain
  <feature>Module.ts     # Composition root — wires concrete adapters to use cases

src/infrastructure/<feature>/
  supabase<Feature>Repository.ts  # Implements the repository port using supabaseAdmin
```

### Ports file rules
- Export TypeScript `type` or `interface` only — no runtime code.
- Every external dependency (DB, email, AI) must be behind a named port type.
- Port types are functions or objects with named methods — not classes.

### Use cases file rules
- Functions only — no classes, no singletons.
- Accept dependencies via parameters (dependency injection), never import concretions.
- May import from: `@/application/<feature>/<feature>Ports`, `@/domain/*`, `@/lib/briefing/*`.
- Must NOT import from: `@/infrastructure/*`, `@/services/*`, `@/lib/supabaseAdmin`, `@/lib/anthropic`.

### Module file rules
- This is the only place where infrastructure is wired to use cases.
- Export `run<ActionName>(<args>)` functions — these are what API routes call.
- Example: `runGetEventsForUser`, `runCreateManualEventForUser`.

### Repository file rules
- Implements exactly one port interface.
- Contains a private `mapRow` function for DB row → domain type mapping.
- Throws `new Error(error.message)` on Supabase errors — never swallows them silently.
- Uses Supabase native upsert with `onConflict` — never manual select-then-insert patterns.

---

## 3. Domain Layer Rules

- `src/domain/` is the single source of truth for all core types and constants.
- `src/types/index.ts` re-exports from `src/domain/*` for backwards compatibility only.
- Domain files contain: interfaces/types, `as const` constant arrays, pure validator functions.
- Validator functions follow the pattern `parse<Thing>(value: unknown): Thing` — return the
  validated value or throw a descriptive `Error`.
- Constants used in Zod schemas must be defined in domain and imported into schemas — never
  duplicated. Example: `eventCategorySchema = z.enum(EVENT_CATEGORIES)`.
- All constants used as Zod enum inputs must be `as const` tuples:
  ```ts
  export const EVENT_CATEGORIES = ["school", "activity", "medical", "social", "other"] as const;
  export type EventCategory = typeof EVENT_CATEGORIES[number];
  ```

---

## 4. API Routes

- Routes live in `src/app/api/***/route.ts`.
- A route handler does exactly four things: authenticate, parse input, call a module function, return response.
- Routes must stay thin — no business logic, no DB calls, no SDK calls.
- Always use `getAuthedUserIdFromRequest` from `@/lib/apiAuth` for authentication.
- Always use `parseJsonBody` or `parseSearchParams` from `@/lib/api/httpZod` for input parsing.
- Always use `jsonResponse` with a Zod response schema for output — this validates the shape before sending.
- Return 401 immediately if `userId` is null — never proceed without authentication for protected routes.

### Route handler template
```ts
export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) return jsonResponse({ error: "Unauthorized" }, errorResponseSchema, { status: 401 });

  const parsed = await parseJsonBody(req, myBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await runMyAction(userId, parsed.data);
    return jsonResponse(result, myResponseSchema);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}
```

---

## 5. Zod Schemas

- All schemas live in `src/lib/api/schemas/`.
- Primitive enums and formats are in `primitives.ts` — derived from domain constants, never hardcoded.
- Request bodies are in `bodies.ts`.
- Response shapes are in `responses.ts`.
- Query param schemas are in `queries.ts`.
- `src/lib/api/schemas/index.ts` re-exports everything — routes and hooks import from `@/lib/api/schemas`.
- Every API route must validate both input (request) and output (response) with schemas.

---

## 6. Hooks

- Hooks live in `src/hooks/`.
- Hooks use TanStack Query (`useQuery`, `useMutation`, `useQueryClient`).
- Hooks do NOT call `supabaseAdmin` or any server-only code.
- Hooks call `/api/*` routes via `fetch` — always attaching `Authorization: Bearer <token>`.
- Fetch helpers inside hooks validate responses with Zod response schemas before returning.
- Use `queryClient.invalidateQueries` in `onSuccess` to keep cache fresh after mutations.
- Hooks return a stable interface — changing hook return shapes requires updating all consumers.

---

## 7. TypeScript Standards

- `strict: true` is assumed — no implicit `any`.
- Never use `any` — use `unknown` and narrow with type guards or Zod.
- Never use `as SomeType` to force-cast — use runtime validation (Zod `parse` / `safeParse`).
- Exception: explicit DB row casts like `data as Row` are acceptable where the DB schema
  guarantees the shape and Supabase types are not yet generated.
- All function parameters and return types must be explicitly typed unless trivially inferred.
- Prefer `type` over `interface` for port definitions and DTO shapes.
- Prefer `interface` for domain entities that may be extended.

---

## 8. Error Handling

- Use cases throw typed domain errors for known failure cases:
  ```ts
  export class BriefingNotFoundError extends Error {
    constructor() { super("Briefing not found"); this.name = "BriefingNotFoundError"; }
  }
  ```
- API routes catch typed errors and map to appropriate HTTP status codes.
- Infrastructure functions throw `new Error(supabaseError.message)` — never return null
  for error cases (null is reserved for "not found").
- Non-critical side effects (email, briefing sync) are wrapped in try/catch in the caller,
  logged with `console.warn`, and must never abort the primary operation.

---

## 9. Testing

- Tests live in `src/__tests__/` mirroring the `src/` structure.
- Domain functions: pure unit tests — no mocks needed.
- Use cases: tested with mock/fake ports — never real Supabase or real API calls.
- Infrastructure: tested with mocked `supabaseAdmin` responses.
- API routes: tested with `@jest-environment node`, mocked auth and mocked module functions.
- Component tests: Jest + React Testing Library.
- When adding a new use case, a corresponding test with mocked ports is required.
- When adding a new repository method, a corresponding infrastructure test is required.

---

## 10. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Port interface / type | `<Feature>Repository`, `<Feature>Port` | `BriefingRepository`, `WeeklyBriefingEmailPort` |
| Use case function | verb + noun | `generateBriefingForUserWeek`, `listBriefingItemsForUser` |
| Module export | `run` + use case name | `runGetEventsForUser`, `runCreateManualEventForUser` |
| Repository implementation | `supabase<Feature>Repository` | `supabaseBriefingRepository` |
| DB row type (local) | `Row` or `<Feature>Row` | `Row`, `EventRow`, `FamilyMemberRow` |
| Row mapper | `mapRow` or `map<Feature>Row` | `mapRow`, `mapEventRow` |
| Domain validator | `parse<Thing>` | `parseEventDate`, `parseMemberColor` |
| Domain guard | `is<Thing>` | `isEventCategory`, `isFamilyMemberRole` |

---

## 11. What Not To Do

- Do not call `supabaseAdmin` from API routes, hooks, services, or application layer files.
- Do not import repository implementations directly in API routes — always go via the module.
- Do not define types only in `src/types/index.ts` — types belong in `src/domain/`.
- Do not duplicate enum values between domain constants and Zod schemas.
- Do not use manual select-then-insert patterns — use Supabase native upsert with `onConflict`.
- Do not leave `console.info` or `console.log` as the only side effect of a use case.
- Do not create `@deprecated` exports — remove dead code, do not alias it.
- Do not use `moment.js` — use `date-fns` (`startOfISOWeek`, `endOfISOWeek`, `format`).
- Do not re-export domain utilities from service files.
- Do not write route handlers that return hardcoded stub data silently.
- Do not add a new feature without a corresponding port interface.
- Do not use `as const` assertions only in domain constants — always pair with an exported `type`.

---

## 12. Adding a New Feature – Checklist

When adding a new bounded context or feature, follow this order:

1. Define types in `src/domain/<feature>.ts`
2. Define port interfaces in `src/application/<feature>/<feature>Ports.ts`
3. Write use cases in `src/application/<feature>/<feature>UseCases.ts`
4. Write tests for use cases with mocked ports
5. Implement infrastructure in `src/infrastructure/<feature>/supabase<Feature>Repository.ts`
6. Write infrastructure tests
7. Wire composition root in `src/application/<feature>/<feature>Module.ts`
8. Add Zod schemas to `src/lib/api/schemas/`
9. Add API route in `src/app/api/<feature>/route.ts`
10. Write API route tests
11. Add hook in `src/hooks/use<Feature>.ts`
12. Add Supabase migration in `src/supabase/migrations/`
