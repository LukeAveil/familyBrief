/** @jest-environment node */
jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

jest.mock("@/lib/anthropic", () => ({
  parseImageOrPdfToEvents: jest.fn(),
  VISION_IMAGE_MEDIA_TYPES: new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ]),
}));

jest.mock("@/services/briefingService", () => ({
  syncBriefingsForDates: jest.fn(),
}));

import { File as NodeBufferFile } from "node:buffer";
import {
  MAX_PARSE_IMAGE_BYTES,
  buildInsertRowsFromExtracted,
  coerceIsoDate,
  fileToBase64,
  insertCalendarImportEvents,
  loadFamilyMembers,
  mapExtractedItemToInsertRow,
  processParseImageUpload,
  resolveMediaTypeForVision,
  validateUploadedFile,
} from "@/services/parseImageService";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parseImageOrPdfToEvents } from "@/lib/anthropic";
import { syncBriefingsForDates } from "@/services/briefingService";

if (typeof globalThis.File === "undefined") {
  (globalThis as unknown as { File: typeof NodeBufferFile }).File =
    NodeBufferFile;
}

const mockFrom = supabaseAdmin.from as jest.Mock;
const mockParseImage = parseImageOrPdfToEvents as jest.MockedFunction<
  typeof parseImageOrPdfToEvents
>;
const mockSyncBriefings = syncBriefingsForDates as jest.MockedFunction<
  typeof syncBriefingsForDates
>;

const imageMeta = { source: "image" as const, raw_email_id: null };

describe("parseImageService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("coerceIsoDate", () => {
    it("accepts YYYY-MM-DD", () => {
      expect(coerceIsoDate("2026-03-21")).toBe("2026-03-21");
    });

    it("rejects invalid or non-string values", () => {
      expect(coerceIsoDate("03-21-2026")).toBeNull();
      expect(coerceIsoDate("2026-3-21")).toBeNull();
      expect(coerceIsoDate(null)).toBeNull();
      expect(coerceIsoDate(20260321)).toBeNull();
    });
  });

  describe("validateUploadedFile", () => {
    it("rejects missing or non-File input", () => {
      expect(validateUploadedFile(null).ok).toBe(false);
      expect(validateUploadedFile(undefined).ok).toBe(false);
      expect(validateUploadedFile("x").ok).toBe(false);
    });

    it("rejects empty files", () => {
      const file = new File([], "a.png", { type: "image/png" });
      const r = validateUploadedFile(file);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("Empty file");
    });

    it("rejects files over the size limit", () => {
      const file = new File(["x"], "big.png", { type: "image/png" });
      Object.defineProperty(file, "size", {
        value: MAX_PARSE_IMAGE_BYTES + 1,
        configurable: true,
      });
      const r = validateUploadedFile(file);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("too large");
    });

    it("accepts a non-empty file within the limit", () => {
      const file = new File(["x"], "ok.png", { type: "image/png" });
      const r = validateUploadedFile(file);
      expect(r).toEqual({ ok: true, file });
    });
  });

  describe("resolveMediaTypeForVision", () => {
    it("resolves PDF by MIME or extension", () => {
      expect(
        resolveMediaTypeForVision(
          new File([], "x.pdf", { type: "application/pdf" })
        )
      ).toBe("application/pdf");
      expect(
        resolveMediaTypeForVision(new File([], "letter.PDF", { type: "" }))
      ).toBe("application/pdf");
    });

    it("resolves supported images by MIME or extension", () => {
      expect(
        resolveMediaTypeForVision(new File([], "a.png", { type: "image/png" }))
      ).toBe("image/png");
      expect(
        resolveMediaTypeForVision(new File([], "b.jpg", { type: "" }))
      ).toBe("image/jpeg");
    });

    it("returns null for unsupported image subtypes", () => {
      expect(
        resolveMediaTypeForVision(
          new File([], "a.svg", { type: "image/svg+xml" })
        )
      ).toBeNull();
    });
  });

  describe("fileToBase64", () => {
    it("encodes file bytes as base64", async () => {
      const file = new File([new Uint8Array([97, 98, 99])], "t.bin");
      const b64 = await fileToBase64(file);
      expect(Buffer.from(b64, "base64").toString()).toBe("abc");
    });
  });

  describe("mapExtractedItemToInsertRow", () => {
    const members = [{ id: "m1", name: "Alex" }];

    it("maps a full extracted item and resolves family member", () => {
      const row = mapExtractedItemToInsertRow(
        {
          title: "Soccer",
          date: "2026-04-01",
          time: "15:00",
          location: "Field",
          category: "activity",
          familyMemberName: "Alex",
          description: "Bring boots",
        },
        "user-1",
        members,
        imageMeta
      );
      expect(row).toMatchObject({
        user_id: "user-1",
        family_member_id: "m1",
        title: "Soccer",
        date: "2026-04-01",
        time: "15:00",
        location: "Field",
        category: "activity",
        description: "Bring boots",
        source: "image",
      });
    });

    it("uses Untitled and other when fields are missing", () => {
      const row = mapExtractedItemToInsertRow(
        { date: "2026-04-02", category: "not-a-category" },
        "user-1",
        [],
        imageMeta
      );
      expect(row).toMatchObject({
        title: "Untitled",
        category: "other",
        family_member_id: null,
      });
    });

    it("returns null when date is missing or invalid", () => {
      expect(
        mapExtractedItemToInsertRow({ title: "x" }, "u", members, imageMeta)
      ).toBeNull();
      expect(
        mapExtractedItemToInsertRow({ date: "April 1" }, "u", members, imageMeta)
      ).toBeNull();
    });
  });

  describe("buildInsertRowsFromExtracted", () => {
    it("drops items without valid dates", () => {
      const rows = buildInsertRowsFromExtracted(
        [{ date: "2026-05-01", title: "A" }, { title: "bad" }],
        "u1",
        [],
        imageMeta
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].title).toBe("A");
    });
  });

  describe("loadFamilyMembers", () => {
    it("returns members on success", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: "m1", name: "Alex" }],
          error: null,
        }),
      });

      const r = await loadFamilyMembers("u1");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.members).toHaveLength(1);
      expect(mockFrom).toHaveBeenCalledWith("family_members");
    });

    it("returns failure when Supabase errors", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "db down" },
        }),
      });

      const r = await loadFamilyMembers("u1");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toBe("Failed to load family members");
    });
  });

  describe("insertCalendarImportEvents", () => {
    it("returns mapped events on success", async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [
              {
                id: "e1",
                user_id: "u1",
                family_member_id: null,
                title: "T",
                description: null,
                date: "2026-03-15",
                time: null,
                location: null,
                category: "school",
                source: "image",
                raw_email_id: null,
                created_at: "2026-03-10T10:00:00.000Z",
                family_members: null,
              },
            ],
            error: null,
          }),
        }),
      });

      const r = await insertCalendarImportEvents([
        {
          user_id: "u1",
          family_member_id: null,
          title: "T",
          description: null,
          date: "2026-03-15",
          time: null,
          location: null,
          category: "school",
          source: "image",
          raw_email_id: null,
        },
      ]);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.events).toHaveLength(1);
        expect(r.events[0].id).toBe("e1");
        expect(r.events[0].source).toBe("image");
      }
    });

    it("returns failure when insert fails", async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "insert failed" },
          }),
        }),
      });

      const r = await insertCalendarImportEvents([
        {
          user_id: "u1",
          family_member_id: null,
          title: "T",
          description: null,
          date: "2026-03-15",
          time: null,
          location: null,
          category: "other",
          source: "image",
          raw_email_id: null,
        },
      ]);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toBe("Failed to save events");
    });
  });

  describe("processParseImageUpload", () => {
    function mockSupabaseForHappyPath() {
      mockFrom.mockImplementation((table: string) => {
        if (table === "family_members") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ id: "m1", name: "Alex" }],
              error: null,
            }),
          };
        }
        if (table === "events") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: "e1",
                    user_id: "u1",
                    family_member_id: null,
                    title: "Meet",
                    description: null,
                    date: "2026-06-01",
                    time: null,
                    location: null,
                    category: "school",
                    source: "image",
                    raw_email_id: null,
                    created_at: "2026-03-10T10:00:00.000Z",
                    family_members: null,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      });
    }

    it("returns 400 when file validation fails", async () => {
      const file = new File([], "empty.png", { type: "image/png" });
      const r = await processParseImageUpload("u1", file);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.status).toBe(400);
        expect(r.message).toBe("Empty file");
      }
    });

    it("returns 400 when MIME is unsupported", async () => {
      const file = new File(["x"], "x.svg", { type: "image/svg+xml" });
      const r = await processParseImageUpload("u1", file);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.status).toBe(400);
        expect(r.message).toContain("Unsupported file type");
      }
    });

    it("returns 500 when family members cannot be loaded", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "err" },
        }),
      });
      const file = new File(["x"], "a.png", { type: "image/png" });
      const r = await processParseImageUpload("u1", file);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.status).toBe(500);
    });

    it("returns 500 when Claude throws", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockParseImage.mockRejectedValue(new Error("API error"));
      const file = new File(["x"], "a.png", { type: "image/png" });
      const r = await processParseImageUpload("u1", file);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.status).toBe(500);
        expect(r.message).toContain("Could not read");
      }
    });

    it("returns empty success when the model returns no events", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockParseImage.mockResolvedValue([]);
      const file = new File(["x"], "a.png", { type: "image/png" });
      const r = await processParseImageUpload("u1", file);
      expect(r).toEqual({ ok: true, events: [], count: 0 });
    });

    it("returns empty success when extraction yields no valid rows", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      mockParseImage.mockResolvedValue([{ title: "no date" }]);
      const file = new File(["x"], "a.png", { type: "image/png" });
      const r = await processParseImageUpload("u1", file);
      expect(r).toEqual({ ok: true, events: [], count: 0 });
    });

    it("returns events on full success", async () => {
      mockSupabaseForHappyPath();
      mockParseImage.mockResolvedValue([
        {
          title: "Meet",
          date: "2026-06-01",
          category: "school",
        },
      ]);

      const file = new File(["x"], "a.png", { type: "image/png" });
      const r = await processParseImageUpload("u1", file);

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.count).toBe(1);
        expect(r.events[0].title).toBe("Meet");
      }
      expect(mockSyncBriefings).toHaveBeenCalledWith("u1", ["2026-06-01"]);
    });
  });
});
