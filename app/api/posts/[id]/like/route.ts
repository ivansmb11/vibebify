import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isError, validateId } from "@/lib/api";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = validateId(rawId);
  if (isError(id)) return id;

  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const { error } = await supabase.from("likes").insert({
    user_id: user.id,
    post_id: id,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already liked" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = validateId(rawId);
  if (isError(id)) return id;

  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
