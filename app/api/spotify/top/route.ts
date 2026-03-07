/* eslint-disable prefer-const */
import { NextRequest, NextResponse } from "next/server";
import {
  getTopArtists,
  getTopTracks,
  refreshSpotifyToken,
} from "@/lib/spotify";
import { requireAuth, parseQuery, isError } from "@/lib/api";
import { spotifyTopQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const query = parseQuery(request, spotifyTopQuerySchema);
  if (isError(query)) return query;

  const { data: profile } = await supabase
    .from("profiles")
    .select("spotify_token")
    .eq("id", user.id)
    .single();

  if (!profile?.spotify_token) {
    return NextResponse.json(
      { error: "No Spotify token found" },
      { status: 400 },
    );
  }

  let { access_token, refresh_token } = profile.spotify_token as {
    access_token: string;
    refresh_token: string;
  };

  const fetcher = query.type === "tracks" ? getTopTracks : getTopArtists;

  try {
    const data = await fetcher(access_token, query.time_range);
    return NextResponse.json(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e.message === "token_expired" && refresh_token) {
      const refreshed = await refreshSpotifyToken(refresh_token);
      if (refreshed.access_token) {
        await supabase
          .from("profiles")
          .update({
            spotify_token: {
              access_token: refreshed.access_token,
              refresh_token: refreshed.refresh_token ?? refresh_token,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        const data = await fetcher(refreshed.access_token, query.time_range);
        return NextResponse.json(data);
      }
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
