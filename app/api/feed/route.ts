import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = 20;

  // Get IDs the user follows
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = (following ?? []).map((f) => f.following_id);
  // Include own posts in feed
  followedIds.push(user.id);

  let query = supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(id, display_name, avatar_url)")
    .in("user_id", followedIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check which posts the user has liked
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
      posts && posts.length === limit
        ? posts[posts.length - 1].created_at
        : null,
  });
}
