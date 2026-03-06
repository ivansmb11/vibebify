const SPOTIFY_API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

export async function refreshSpotifyToken(refreshToken: string) {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  return res.json();
}

export async function spotifyFetch(
  endpoint: string,
  accessToken: string,
  params?: Record<string, string>
) {
  const url = new URL(`${SPOTIFY_API}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    throw new Error("token_expired");
  }

  if (!res.ok) {
    throw new Error(`Spotify API error: ${res.status}`);
  }

  return res.json();
}

export async function getRecentlyPlayed(token: string, limit = 20) {
  return spotifyFetch("/me/player/recently-played", token, {
    limit: String(limit),
  });
}

export async function getTopArtists(
  token: string,
  timeRange = "medium_term",
  limit = 20
) {
  return spotifyFetch("/me/top/artists", token, {
    time_range: timeRange,
    limit: String(limit),
  });
}

export async function getTopTracks(
  token: string,
  timeRange = "medium_term",
  limit = 20
) {
  return spotifyFetch("/me/top/tracks", token, {
    time_range: timeRange,
    limit: String(limit),
  });
}

export async function getRecommendations(
  token: string,
  seedArtists: string[],
  limit = 20
) {
  return spotifyFetch("/recommendations", token, {
    seed_artists: seedArtists.slice(0, 5).join(","),
    limit: String(limit),
  });
}
