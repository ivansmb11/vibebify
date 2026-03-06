import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody, isError, validateId } from "@/lib/api";
import { voteDuelSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = validateId(rawId);
  if (isError(id)) return id;

  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await parseBody(request, voteDuelSchema);
  if (isError(body)) return body;

  // Verify duel is active
  const { data: duel } = await supabase
    .from("duels")
    .select("status")
    .eq("id", id)
    .single();

  if (!duel || duel.status !== "active") {
    return NextResponse.json(
      { error: "Duel is not active" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("duel_votes").insert({
    duel_id: id,
    user_id: user.id,
    voted_for: body.voted_for,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
