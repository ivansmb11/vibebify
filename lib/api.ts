import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { z } from "zod/v4";

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns the parsed data or a 400 NextResponse with error details.
 */
export async function parseBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
): Promise<z.infer<T> | NextResponse> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    return NextResponse.json(
      { error: "Validation failed", details: messages },
      { status: 400 },
    );
  }
  return result.data;
}

/**
 * Parse and validate URL search params against a Zod schema.
 */
export function parseQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
): z.infer<T> | NextResponse {
  const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    return NextResponse.json(
      { error: "Invalid query params", details: messages },
      { status: 400 },
    );
  }
  return result.data;
}

/**
 * Check if a parse result is an error response.
 */
export function isError(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Require authenticated user. Returns user or a 401 response.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null as never,
      supabase,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, supabase, error: null };
}

/**
 * Validate a UUID path param. Returns the id or a 400 response.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateId(id: string): string | NextResponse {
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }
  return id;
}
