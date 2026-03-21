import {
  buildInsertRowsFromExtracted,
  mapExtractedItemToInsertRow,
} from "@/domain/calendarImport";

describe("calendarImport extractedEvents", () => {
  it("applies email meta including raw_email_id", () => {
    const rows = buildInsertRowsFromExtracted(
      [{ date: "2026-01-15", title: "Parents evening" }],
      "user-1",
      [],
      { source: "email", raw_email_id: "email-row-id" }
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("email");
    expect(rows[0].raw_email_id).toBe("email-row-id");
  });

  it("applies image meta with null raw_email_id", () => {
    const row = mapExtractedItemToInsertRow(
      { date: "2026-02-01", title: "Trip" },
      "u1",
      [],
      { source: "image", raw_email_id: null }
    );
    expect(row?.source).toBe("image");
    expect(row?.raw_email_id).toBeNull();
  });
});
