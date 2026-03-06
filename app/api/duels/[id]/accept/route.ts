import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

  const body = await request.json();
  const {
    opponent_song_title,
    opponent_song_artist,
    opponent_song_image_url,
    opponent_spotify_track_id,
  } = body;

  if (!opponent_song_title || !opponent_song_artist) {
    return NextResponse.json(
      { error: "Song title and artist are required" },
      { status: 400 }
    );
  }

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

  const { data: updated, error } = await supabase
    .from("duels")
    .update({
      opponent_id: user.id,
      opponent_song_title,
      opponent_song_artist,
      opponent_song_image_url,
      opponent_spotify_track_id,
      status: "active",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", id)
    .select(
      `*,
      creator:profiles!duels_creator_id_fkey(id, display_name, avatar_url),
      opponent:profiles!duels_opponent_id_fkey(id, display_name, avatar_url)`
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
