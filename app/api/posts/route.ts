import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    content,
    song_title,
    song_artist,
    song_album,
    song_image_url,
    spotify_track_id,
    musicbrainz_id,
  } = body;

  if (!content || !song_title || !song_artist) {
    return NextResponse.json(
      { error: "content, song_title, and song_artist are required" },
      { status: 400 }
    );
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content,
      song_title,
      song_artist,
      song_album,
      song_image_url,
      spotify_track_id,
      musicbrainz_id,
    })
    .select("*, profiles!posts_user_id_fkey(id, display_name, avatar_url)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(post, { status: 201 });
}
