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

  const { voted_for } = await request.json();

  if (!voted_for || !["creator", "opponent"].includes(voted_for)) {
    return NextResponse.json(
      { error: "voted_for must be 'creator' or 'opponent'" },
      { status: 400 }
    );
  }

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
    voted_for,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
