import { NextRequest, NextResponse } from "next/server";
import { searchRecordings } from "@/lib/musicbrainz";
import { requireAuth, parseQuery, isError } from "@/lib/api";
import { searchQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const query = parseQuery(request, searchQuerySchema);
  if (isError(query)) return query;

  try {
    const results = await searchRecordings(query.q);

    const tracks = results.recordings.map((r) => ({
      musicbrainz_id: r.id,
      title: r.title,
      artist: r["artist-credit"]?.map((a) => a.name).join(", ") ?? "Unknown",
      album: r.releases?.[0]?.title ?? null,
    }));

    return NextResponse.json(tracks);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
