import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchRecordings } from "@/lib/musicbrainz";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  try {
    const results = await searchRecordings(q);

    const tracks = results.recordings.map((r) => ({
      musicbrainz_id: r.id,
      title: r.title,
      artist: r["artist-credit"]?.map((a) => a.name).join(", ") ?? "Unknown",
      album: r.releases?.[0]?.title ?? null,
    }));

    return NextResponse.json(tracks);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
