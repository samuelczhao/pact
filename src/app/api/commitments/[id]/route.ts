import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("commitments")
    .select("*, creator:profiles!creator_id(*), partner:profiles!partner_id(*), commitment_partners(*, profile:profiles!partner_id(*))")
    .eq("id", id)
    .single();

  if (error || !data) {
    return Response.json({ error: "Commitment not found" }, { status: 404 });
  }

  if (data.status === "active" && data.deadline && new Date(data.deadline) < new Date()) {
    await supabase
      .from("commitments")
      .update({ status: "pending_proof" })
      .eq("id", id)
      .eq("status", "active");
    data.status = "pending_proof";
  }

  return Response.json(data);
}

export async function PATCH(
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

  const { data: commitment, error: fetchError } = await supabase
    .from("commitments")
    .select("creator_id, editable_until")
    .eq("id", id)
    .single();

  if (fetchError || !commitment) {
    return Response.json({ error: "Commitment not found" }, { status: 404 });
  }
  if (commitment.creator_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (new Date(commitment.editable_until) <= new Date()) {
    return Response.json(
      { error: "Edit window has expired" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if ("title" in body) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return Response.json({ error: "Title cannot be empty" }, { status: 400 });
    }
    updates.title = title;
  }

  if ("description" in body) {
    const desc = typeof body.description === "string" ? body.description.trim() : null;
    updates.description = desc || null;
  }

  if ("amount" in body) {
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return Response.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }
    if (amount > 10000) {
      return Response.json({ error: "Amount cannot exceed $10,000" }, { status: 400 });
    }
    updates.amount = amount;
  }

  if ("deadline" in body) {
    const deadline = new Date(body.deadline);
    if (isNaN(deadline.getTime()) || deadline <= new Date()) {
      return Response.json({ error: "Deadline must be in the future" }, { status: 400 });
    }
    updates.deadline = deadline.toISOString();
  }

  if ("proof_requirement" in body) {
    const pr = typeof body.proof_requirement === "string" ? body.proof_requirement.trim() : null;
    updates.proof_requirement = pr || null;
  }

  if ("partner_id" in body) {
    updates.partner_id = body.partner_id || null;
  }
  if ("partner_name" in body) {
    updates.partner_name = body.partner_name || null;
  }
  if ("partner_email" in body) {
    updates.partner_email = body.partner_email || null;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("commitments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
