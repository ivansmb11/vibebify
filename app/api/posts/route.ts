import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody, isError } from "@/lib/api";
import { createPostSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await parseBody(request, createPostSchema);
  if (isError(body)) return body;

  // Upsert song into catalog
  const artistNames = body.song_artist.split(/,\s*/);
  await supabase.rpc("upsert_song", {
    p_title: body.song_title,
    p_artist_names: artistNames,
    p_album_name: body.song_album ?? null,
    p_image_url: body.song_image_url ?? null,
    p_spotify_track_id: body.spotify_track_id ?? null,
    p_musicbrainz_id: body.musicbrainz_id ?? null,
  });

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      content: body.content,
      song_title: body.song_title,
      song_artist: body.song_artist,
      song_album: body.song_album,
      song_image_url: body.song_image_url,
      spotify_track_id: body.spotify_track_id,
      musicbrainz_id: body.musicbrainz_id,
    })
    .select("*, profiles!posts_user_id_fkey(id, display_name, avatar_url)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(post, { status: 201 });
}
