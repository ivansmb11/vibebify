import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isError, validateId } from "@/lib/api";

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
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
