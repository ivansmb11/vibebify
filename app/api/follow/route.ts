import { NextRequest, NextResponse } from "next/server";
import { requireAuth, parseBody, isError } from "@/lib/api";
import { followSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await parseBody(request, followSchema);
  if (isError(body)) return body;

  if (body.following_id === user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: body.following_id,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already following" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await parseBody(request, followSchema);
  if (isError(body)) return body;

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", body.following_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
