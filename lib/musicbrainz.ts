const MB_API = "https://musicbrainz.org/ws/2";
const USER_AGENT = "Vibebify/0.1.0 (https://vibebify.app)";

interface MBRecording {
  id: string;
  title: string;
  "artist-credit": { name: string; artist: { id: string; name: string } }[];
  releases?: { id: string; title: string }[];
}

interface MBSearchResult {
  recordings: MBRecording[];
  count: number;
}

export async function searchRecordings(
  query: string,
  artist?: string,
  limit = 10
): Promise<MBSearchResult> {
  const q = artist ? `recording:"${query}" AND artist:"${artist}"` : query;
  const url = `${MB_API}/recording?query=${encodeURIComponent(q)}&limit=${limit}&fmt=json`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`MusicBrainz error: ${res.status}`);
  return res.json();
}

export async function getRecording(mbid: string) {
  const url = `${MB_API}/recording/${mbid}?inc=artists+releases&fmt=json`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`MusicBrainz error: ${res.status}`);
  return res.json();
}
