import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody, parseQuery, isError } from "@/lib/api";
import { createDuelSchema } from "@/lib/validations";
import { z } from "zod/v4";

const duelsFilterSchema = z.object({
  filter: z.enum(["open", "active", "mine", "all"]).default("active"),
});

// GET - list duels
export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const query = parseQuery(request, duelsFilterSchema);
  if (isError(query)) return query;

  let dbQuery = supabase
    .from("duels")
    .select(
      `*,
      creator:profiles!duels_creator_id_fkey(id, display_name, avatar_url),
      opponent:profiles!duels_opponent_id_fkey(id, display_name, avatar_url)`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (query.filter === "open") {
    dbQuery = dbQuery.eq("status", "open");
  } else if (query.filter === "active") {
    dbQuery = dbQuery.eq("status", "active");
  } else if (query.filter === "mine") {
    dbQuery = dbQuery.or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`);
  } else {
    dbQuery = dbQuery.in("status", ["active", "open"]);
  }

  const { data: duels, error } = await dbQuery;

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
  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await parseBody(request, createDuelSchema);
  if (isError(body)) return body;

  if (body.opponent_id === user.id) {
    return NextResponse.json({ error: "Cannot duel yourself" }, { status: 400 });
  }

  // Upsert song into catalog
  const artistNames = body.creator_song_artist.split(/,\s*/);
  await supabase.rpc("upsert_song", {
    p_title: body.creator_song_title,
    p_artist_names: artistNames,
    p_image_url: body.creator_song_image_url ?? null,
    p_spotify_track_id: body.creator_spotify_track_id ?? null,
  });

  const { data: duel, error } = await supabase
    .from("duels")
    .insert({
      creator_id: user.id,
      opponent_id: body.opponent_id || null,
      creator_song_title: body.creator_song_title,
      creator_song_artist: body.creator_song_artist,
      creator_song_image_url: body.creator_song_image_url,
      creator_spotify_track_id: body.creator_spotify_track_id,
      status: "open",
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
