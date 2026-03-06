import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTopArtists,
  getTopTracks,
  refreshSpotifyToken,
} from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("spotify_token")
    .eq("id", user.id)
    .single();

  if (!profile?.spotify_token) {
    return NextResponse.json(
      { error: "No Spotify token found" },
      { status: 400 }
    );
  }

  let { access_token, refresh_token } = profile.spotify_token as {
    access_token: string;
    refresh_token: string;
  };

  const type = request.nextUrl.searchParams.get("type") ?? "artists";
  const timeRange =
    request.nextUrl.searchParams.get("time_range") ?? "medium_term";

  const fetcher = type === "tracks" ? getTopTracks : getTopArtists;

  try {
    const data = await fetcher(access_token, timeRange);
    return NextResponse.json(data);
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

        const data = await fetcher(refreshed.access_token, timeRange);
        return NextResponse.json(data);
      }
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
