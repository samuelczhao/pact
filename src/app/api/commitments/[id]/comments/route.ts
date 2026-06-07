import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function canAccessCommitment(
  supabase: SupabaseClient,
  commitmentId: string,
  userId: string,
): Promise<{ allowed: boolean; notFound: boolean }> {
  const { data: commitment } = await supabase
    .from("commitments")
    .select("id, is_public, creator_id, partner_id")
    .eq("id", commitmentId)
    .single();

  if (!commitment) return { allowed: false, notFound: true };
  if (commitment.is_public) return { allowed: true, notFound: false };

  const { data: partners } = await supabase
    .from("commitment_partners")
    .select("partner_id")
    .eq("commitment_id", commitmentId);

  const partnerIds = (partners ?? []).map((p) => p.partner_id);
  const allowed =
    commitment.creator_id === userId ||
    commitment.partner_id === userId ||
    partnerIds.includes(userId);

  return { allowed, notFound: false };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, notFound } = await canAccessCommitment(supabase, id, user.id);
  if (notFound) return Response.json({ error: "Commitment not found" }, { status: 404 });
  if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*, profile:profiles!user_id(*)")
    .eq("commitment_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(comments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim() : "";

  if (!text) {
    return Response.json({ error: "Comment body is required" }, { status: 400 });
  }
  if (text.length > 2000) {
    return Response.json({ error: "Comment must be 2000 characters or less" }, { status: 400 });
  }

  const { allowed, notFound } = await canAccessCommitment(supabase, id, user.id);
  if (notFound) return Response.json({ error: "Commitment not found" }, { status: 404 });
  if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      commitment_id: id,
      user_id: user.id,
      body: text,
    })
    .select("*, profile:profiles!user_id(*)")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(comment, { status: 201 });
}
