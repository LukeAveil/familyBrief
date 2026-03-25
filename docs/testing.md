# Testing strategy

- **Domain:** `parseBriefingSections`, `getWeekStart` / `getWeekEnd`, `pickCurrentBriefing`, calendarImport helpers (`coerceIsoDate`, `validateUploadedFile`, `resolveMediaTypeForVision`, `buildInsertRowsFromExtracted`, etc.).
- **Application:** `generateBriefingForUserWeek`, `listBriefingItemsForUser`, `recordBriefingFeedback`, `sendWeeklyBriefingsForActiveUsers` with mocked ports (deps injected directly — no module mocks needed); event/family use cases tested via repository fakes.
- **Infrastructure:** Supabase adapters (briefing, events, family, user, parsed email) with mocked `supabaseAdmin`; feedback use case asserts `recordFeedback` on the repository.
- **HTTP:** Route tests with `@jest-environment node`, mocked auth, and mocked module functions (`run*` from `briefingModule`, `calendarImportModule`, etc.); Zod rejects bad bodies (e.g. feedback without `briefingId`) with `400`.
- **calendarImport pipeline:** `runProcessParseImageUpload` tested end-to-end with mocked `familyModule`, `eventModule`, `briefingModule`, and `@/lib/anthropic`.
- **UI:** Component tests for calendar pieces; briefings page relies on domain + hooks tests for faster feedback.
