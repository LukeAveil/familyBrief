import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import {
  runCreateManualEventForUser,
  runDeleteEventForUser,
  runGetEventForUser,
  runGetEventsForUser,
} from "@/application/events/eventModule";
import { jsonResponse, parseJsonBody, parseSearchParams } from "@/lib/api/httpZod";
import {
  createEventPostBodySchema,
  deleteEventSuccessResponseSchema,
  errorResponseSchema,
  eventListResponseSchema,
  eventResponseSchema,
  eventsDeleteQuerySchema,
  eventsGetQuerySchema,
} from "@/lib/api/schemas";
import { runSyncBriefingsForDates } from "@/application/briefing/briefingModule";

export async function GET(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse([], eventListResponseSchema, { status: 401 });
  }

  const q = parseSearchParams(
    new URL(req.url),
    (url) => ({
      start: url.searchParams.get("start"),
      end: url.searchParams.get("end"),
    }),
    eventsGetQuerySchema
  );
  if (!q.ok) return q.response;

  try {
    const events = await runGetEventsForUser(userId, {
      start: q.data.start,
      end: q.data.end,
    });
    return jsonResponse(events, eventListResponseSchema);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load events";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, errorResponseSchema, {
      status: 401,
    });
  }

  const parsed = await parseJsonBody(req, createEventPostBodySchema);
  if (!parsed.ok) return parsed.response;

  const body = parsed.data;

  try {
    const event = await runCreateManualEventForUser(userId, {
      title: body.title,
      date: body.date,
      time: body.time,
      location: body.location,
      category: body.category,
      familyMemberId: body.family_member_id ?? null,
      description: body.description,
    });
    try {
      await runSyncBriefingsForDates(userId, [body.date]);
    } catch (briefingError: unknown) {
      console.warn(
        "Briefing update failed (event was created):",
        briefingError instanceof Error ? briefingError.message : briefingError
      );
    }
    return jsonResponse(event, eventResponseSchema);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create event";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, errorResponseSchema, {
      status: 401,
    });
  }

  const q = parseSearchParams(
    new URL(req.url),
    (url) => ({ id: url.searchParams.get("id") ?? "" }),
    eventsDeleteQuerySchema
  );
  if (!q.ok) return q.response;

  const { id } = q.data;

  try {
    const event = await runGetEventForUser(userId, id);
    await runDeleteEventForUser(userId, id);
    if (event?.date) {
      try {
        await runSyncBriefingsForDates(userId, [event.date]);
      } catch (briefingError: unknown) {
        console.warn(
          "Briefing update after delete failed:",
          briefingError instanceof Error ? briefingError.message : briefingError
        );
      }
    }
    return jsonResponse({ success: true }, deleteEventSuccessResponseSchema);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete event";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}
