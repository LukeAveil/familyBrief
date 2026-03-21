import { NextRequest, NextResponse } from "next/server";
import { z, type ZodError, type ZodTypeAny } from "zod";

export function formatZodError(error: ZodError): string {
  const first = error.issues[0];
  return first
    ? `${first.path.length ? first.path.join(".") + ": " : ""}${first.message}`
    : "Invalid request";
}

export async function parseJsonBody<S extends ZodTypeAny>(
  req: NextRequest,
  schema: S
): Promise<
  | { ok: true; data: z.infer<S> }
  | { ok: false; response: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}

export function parseSearchParams<S extends ZodTypeAny>(
  url: URL,
  build: (url: URL) => unknown,
  schema: S
): { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse } {
  const raw = build(url);
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}

/** Assert response shape before sending (throws if domain mapping is wrong). */
export function jsonResponse<S extends ZodTypeAny>(
  data: unknown,
  schema: S,
  init?: ResponseInit
): NextResponse {
  return NextResponse.json(schema.parse(data), init);
}
