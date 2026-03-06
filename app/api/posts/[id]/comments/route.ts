import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, parseBody, isError, validateId } from "@/lib/api";
import { createCommentSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = validateId(rawId);
  if (isError(id)) return id;

  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_user_id_fkey(id, display_name, avatar_url)")
    .eq("post_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = validateId(rawId);
  if (isError(id)) return id;

  const { user, supabase, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await parseBody(request, createCommentSchema);
  if (isError(body)) return body;

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({ user_id: user.id, post_id: id, content: body.content })
    .select("*, profiles!comments_user_id_fkey(id, display_name, avatar_url)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comment, { status: 201 });
}
