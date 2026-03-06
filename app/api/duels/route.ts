import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - list active/open duels
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = request.nextUrl.searchParams.get("filter") ?? "active";

  let query = supabase
    .from("duels")
    .select(
      `*,
      creator:profiles!duels_creator_id_fkey(id, display_name, avatar_url),
      opponent:profiles!duels_opponent_id_fkey(id, display_name, avatar_url)`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (filter === "open") {
    query = query.eq("status", "open");
  } else if (filter === "active") {
    query = query.eq("status", "active");
  } else if (filter === "mine") {
    query = query.or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`);
  } else {
    query = query.in("status", ["active", "open"]);
  }

  const { data: duels, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check which duels the user has voted on
  const duelIds = (duels ?? []).map((d) => d.id);
  const { data: userVotes } = await supabase
    .from("duel_votes")
    .select("duel_id, voted_for")
    .eq("user_id", user.id)
    .in("duel_id", duelIds);

  const votesMap = new Map(
    (userVotes ?? []).map((v) => [v.duel_id, v.voted_for])
  );

  const enriched = (duels ?? []).map((duel) => ({
    ...duel,
    user_vote: votesMap.get(duel.id) ?? null,
  }));

  return NextResponse.json(enriched);
}

// POST - create a new duel
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    opponent_id,
    creator_song_title,
    creator_song_artist,
    creator_song_image_url,
    creator_spotify_track_id,
  } = body;

  if (!creator_song_title || !creator_song_artist) {
    return NextResponse.json(
      { error: "Song title and artist are required" },
      { status: 400 }
    );
  }

  const { data: duel, error } = await supabase
    .from("duels")
    .insert({
      creator_id: user.id,
      opponent_id: opponent_id || null,
      creator_song_title,
      creator_song_artist,
      creator_song_image_url,
      creator_spotify_track_id,
      status: opponent_id ? "open" : "open",
    })
    .select(
      `*,
      creator:profiles!duels_creator_id_fkey(id, display_name, avatar_url),
      opponent:profiles!duels_opponent_id_fkey(id, display_name, avatar_url)`
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(duel, { status: 201 });
}
