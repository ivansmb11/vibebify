import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/components/post-card";
import type { Duel } from "@/components/duel-card";

const supabase = createClient();

// ─── Helpers ───

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

async function enrichPostsWithLikes(
  posts: Post[],
  userId: string
): Promise<Post[]> {
  if (posts.length === 0) return posts;
  const postIds = posts.map((p) => p.id);
  const { data: likes } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);

  const likedSet = new Set((likes ?? []).map((l) => l.post_id));
  return posts.map((post) => ({
    ...post,
    liked_by_user: likedSet.has(post.id),
  }));
}

// ─── Feed ───

export async function getFeed(cursor?: string) {
  const userId = await getUserId();

  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followedIds = (following ?? []).map((f) => f.following_id);
  followedIds.push(userId);

  let query = supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(id, display_name, avatar_url)")
    .in("user_id", followedIds)
    .order("created_at", { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;
  if (error) throw error;

  const enriched = await enrichPostsWithLikes((posts ?? []) as Post[], userId);
  return {
    posts: enriched,
    next_cursor:
      posts && posts.length === 20
        ? posts[posts.length - 1].created_at
        : null,
  };
}

// ─── Discover ───

export async function getDiscover(cursor?: string) {
  const userId = await getUserId();

  let query = supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(id, display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;
  if (error) throw error;

  const enriched = await enrichPostsWithLikes((posts ?? []) as Post[], userId);
  return {
    posts: enriched,
    next_cursor:
      posts && posts.length === 20
        ? posts[posts.length - 1].created_at
        : null,
  };
}

// ─── Posts ───

export async function createPost(payload: {
  content: string;
  song_title: string;
  song_artist: string;
  song_album?: string;
  song_image_url?: string;
  spotify_track_id?: string;
  musicbrainz_id?: string;
}) {
  const userId = await getUserId();

  // Upsert into catalog
  const artistNames = payload.song_artist.split(/,\s*/);
  await supabase.rpc("upsert_song", {
    p_title: payload.song_title,
    p_artist_names: artistNames,
    p_album_name: payload.song_album ?? null,
    p_image_url: payload.song_image_url ?? null,
    p_spotify_track_id: payload.spotify_track_id ?? null,
    p_musicbrainz_id: payload.musicbrainz_id ?? null,
  });

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      content: payload.content,
      song_title: payload.song_title,
      song_artist: payload.song_artist,
      song_album: payload.song_album,
      song_image_url: payload.song_image_url,
      spotify_track_id: payload.spotify_track_id,
      musicbrainz_id: payload.musicbrainz_id,
    })
    .select("*, profiles!posts_user_id_fkey(id, display_name, avatar_url)")
    .single();

  if (error) throw error;
  return post as Post;
}

export async function deletePost(postId: string) {
  const userId = await getUserId();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ─── Likes ───

export async function likePost(postId: string) {
  const userId = await getUserId();
  const { error } = await supabase
    .from("likes")
    .insert({ user_id: userId, post_id: postId });
  if (error && error.code !== "23505") throw error;
}

export async function unlikePost(postId: string) {
  const userId = await getUserId();
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);
  if (error) throw error;
}

// ─── Comments ───

export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_user_id_fkey(id, display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return data;
}

export async function createComment(postId: string, content: string) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("comments")
    .insert({ user_id: userId, post_id: postId, content })
    .select("*, profiles!comments_user_id_fkey(id, display_name, avatar_url)")
    .single();
  if (error) throw error;
  return data;
}

// ─── Follow ───

export async function followUser(followingId: string) {
  const userId = await getUserId();
  if (followingId === userId) throw new Error("Cannot follow yourself");
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: userId, following_id: followingId });
  if (error && error.code !== "23505") throw error;
}

export async function unfollowUser(followingId: string) {
  const userId = await getUserId();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", userId)
    .eq("following_id", followingId);
  if (error) throw error;
}

// ─── Search Users ───

export async function searchUsers(query: string) {
  if (query.length < 2) return [];
  const userId = await getUserId();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .ilike("display_name", `%${query}%`)
    .neq("id", userId)
    .limit(20);

  if (error) throw error;

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .in("following_id", ids);

  const followingSet = new Set((follows ?? []).map((f) => f.following_id));

  return (profiles ?? []).map((p) => ({
    ...p,
    is_following: followingSet.has(p.id),
  }));
}

// ─── User Profile ───

export async function getUserProfile(targetId: string) {
  const userId = await getUserId().catch(() => null);
  const { data, error } = await supabase.rpc("get_user_profile", {
    p_target_id: targetId,
    p_current_user_id: userId,
  });
  if (error) throw error;
  return data;
}

// ─── User Posts ───

export async function getUserPosts(targetId: string, cursor?: string) {
  const userId = await getUserId();

  let query = supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(id, display_name, avatar_url)")
    .eq("user_id", targetId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: posts, error } = await query;
  if (error) throw error;

  const enriched = await enrichPostsWithLikes((posts ?? []) as Post[], userId);
  return {
    posts: enriched,
    next_cursor:
      posts && posts.length === 20
        ? posts[posts.length - 1].created_at
        : null,
  };
}

// ─── Streak (shorthand from profile) ───

export async function getStreak(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("current_streak, longest_streak")
    .eq("id", userId)
    .single();
  return {
    current_streak: data?.current_streak ?? 0,
    longest_streak: data?.longest_streak ?? 0,
  };
}

// ─── Duels ───

export async function getDuels(filter: "open" | "active" | "mine" | "all" = "all") {
  const userId = await getUserId();

  let query = supabase
    .from("duels")
    .select(
      `*,
      creator:profiles!duels_creator_id_fkey(id, display_name, avatar_url),
      opponent:profiles!duels_opponent_id_fkey(id, display_name, avatar_url)`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (filter === "open") query = query.eq("status", "open");
  else if (filter === "active") query = query.eq("status", "active");
  else if (filter === "mine")
    query = query.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`);
  else query = query.in("status", ["active", "open"]);

  const { data: duels, error } = await query;
  if (error) throw error;

  const duelIds = (duels ?? []).map((d) => d.id);
  const { data: votes } = await supabase
    .from("duel_votes")
    .select("duel_id, voted_for")
    .eq("user_id", userId)
    .in("duel_id", duelIds);

  const votesMap = new Map((votes ?? []).map((v) => [v.duel_id, v.voted_for]));

  return (duels ?? []).map((duel) => ({
    ...duel,
    user_vote: votesMap.get(duel.id) ?? null,
  })) as Duel[];
}

export async function createDuel(payload: {
  creator_song_title: string;
  creator_song_artist: string;
  creator_song_image_url?: string;
  creator_spotify_track_id?: string;
  opponent_id?: string;
}) {
  const userId = await getUserId();

  // Upsert into catalog
  const artistNames = payload.creator_song_artist.split(/,\s*/);
  await supabase.rpc("upsert_song", {
    p_title: payload.creator_song_title,
    p_artist_names: artistNames,
    p_image_url: payload.creator_song_image_url ?? null,
    p_spotify_track_id: payload.creator_spotify_track_id ?? null,
  });

  const { data: duel, error } = await supabase
    .from("duels")
    .insert({
      creator_id: userId,
      opponent_id: payload.opponent_id || null,
      creator_song_title: payload.creator_song_title,
      creator_song_artist: payload.creator_song_artist,
      creator_song_image_url: payload.creator_song_image_url,
      creator_spotify_track_id: payload.creator_spotify_track_id,
      status: "open",
    })
    .select(
      `*,
      creator:profiles!duels_creator_id_fkey(id, display_name, avatar_url),
      opponent:profiles!duels_opponent_id_fkey(id, display_name, avatar_url)`
    )
    .single();

  if (error) throw error;
  return { ...duel, user_vote: null } as Duel;
}

export async function acceptDuel(
  duelId: string,
  song: {
    title: string;
    artist: string;
    image_url?: string;
    spotify_track_id?: string;
  }
) {
  const userId = await getUserId();
  const { data, error } = await supabase.rpc("accept_duel", {
    p_duel_id: duelId,
    p_user_id: userId,
    p_song_title: song.title,
    p_song_artist: song.artist,
    p_song_image_url: song.image_url ?? null,
    p_spotify_track_id: song.spotify_track_id ?? null,
  });
  if (error) throw error;
  return data as Duel;
}

export async function voteDuel(duelId: string, votedFor: "creator" | "opponent") {
  const userId = await getUserId();
  const { error } = await supabase
    .from("duel_votes")
    .insert({ duel_id: duelId, user_id: userId, voted_for: votedFor });
  if (error && error.code !== "23505") throw error;
}
