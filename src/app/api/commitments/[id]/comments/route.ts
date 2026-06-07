import { createClient } from "@/lib/supabase/server";

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

  const { data: commitment } = await supabase
    .from("commitments")
    .select("id, is_public, creator_id, partner_id")
    .eq("id", id)
    .single();

  if (!commitment) {
    return Response.json({ error: "Commitment not found" }, { status: 404 });
  }

  if (!commitment.is_public) {
    const { data: partners } = await supabase
      .from("commitment_partners")
      .select("partner_id")
      .eq("commitment_id", id);

    const partnerIds = (partners ?? []).map((p) => p.partner_id);
    const canSee =
      commitment.creator_id === user.id ||
      commitment.partner_id === user.id ||
      partnerIds.includes(user.id);

    if (!canSee) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

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

  const { data: commitment } = await supabase
    .from("commitments")
    .select("id, is_public, creator_id, partner_id")
    .eq("id", id)
    .single();

  if (!commitment) {
    return Response.json({ error: "Commitment not found" }, { status: 404 });
  }

  if (!commitment.is_public) {
    const { data: partners } = await supabase
      .from("commitment_partners")
      .select("partner_id")
      .eq("commitment_id", id);

    const partnerIds = (partners ?? []).map((p) => p.partner_id);
    const canSee =
      commitment.creator_id === user.id ||
      commitment.partner_id === user.id ||
      partnerIds.includes(user.id);

    if (!canSee) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

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
