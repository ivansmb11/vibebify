import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody, isError, validateId } from "@/lib/api";
import { acceptDuelSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = validateId(rawId);
  if (isError(id)) return id;

  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await parseBody(request, acceptDuelSchema);
  if (isError(body)) return body;

  // Verify the duel exists and is open
  const { data: duel } = await supabase
    .from("duels")
    .select("*")
    .eq("id", id)
    .eq("status", "open")
    .single();

  if (!duel) {
    return NextResponse.json(
      { error: "Duel not found or already active" },
      { status: 404 }
    );
  }

  if (duel.creator_id === user.id) {
    return NextResponse.json(
      { error: "Cannot accept your own duel" },
      { status: 400 }
    );
  }

  // Upsert opponent song into catalog
  const artistNames = body.opponent_song_artist.split(/,\s*/);
  await supabase.rpc("upsert_song", {
    p_title: body.opponent_song_title,
    p_artist_names: artistNames,
    p_image_url: body.opponent_song_image_url ?? null,
    p_spotify_track_id: body.opponent_spotify_track_id ?? null,
  });

  const { error } = await supabase
    .from("duels")
    .update({
      opponent_id: user.id,
      opponent_song_title: body.opponent_song_title,
      opponent_song_artist: body.opponent_song_artist,
      opponent_song_image_url: body.opponent_song_image_url,
      opponent_spotify_track_id: body.opponent_spotify_track_id,
      status: "active",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: updated } = await supabase
    .from("duels")
    .select(
      `*,
      creator:profiles!duels_creator_id_fkey(id, display_name, avatar_url),
      opponent:profiles!duels_opponent_id_fkey(id, display_name, avatar_url)`
    )
    .eq("id", id)
    .single();

  return NextResponse.json(updated);
}
