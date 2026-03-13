import { NextRequest, NextResponse } from "next/server";

// Middleware auth based on Supabase cookies isn't wired up yet.
// To avoid redirect loops during local development, we currently
// allow all requests to pass through.
export async function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

