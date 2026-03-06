import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = request.nextUrl.searchParams.get("cursor");

  let query = supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(id, display_name, avatar_url)")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: userLikes } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", user.id)
    .in("post_id", postIds);

  const likedPostIds = new Set((userLikes ?? []).map((l) => l.post_id));

  const enriched = (posts ?? []).map((post) => ({
    ...post,
    liked_by_user: likedPostIds.has(post.id),
  }));

  return NextResponse.json({
    posts: enriched,
    next_cursor:
      posts && posts.length === 20
        ? posts[posts.length - 1].created_at
        : null,
  });
}
