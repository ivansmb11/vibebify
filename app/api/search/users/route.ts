import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseQuery, isError } from "@/lib/api";
import { searchQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const query = parseQuery(request, searchQuerySchema);
  if (isError(query)) return query;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .ilike("display_name", `%${query.q}%`)
    .neq("id", user.id)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check which ones the current user follows
  const ids = (profiles ?? []).map((p) => p.id);
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .in("following_id", ids);

  const followingSet = new Set((follows ?? []).map((f) => f.following_id));

  const enriched = (profiles ?? []).map((p) => ({
    ...p,
    is_following: followingSet.has(p.id),
  }));

  return NextResponse.json(enriched);
}
