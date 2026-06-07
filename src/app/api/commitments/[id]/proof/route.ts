import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = new Set([
  "active",
  "pending_proof",
  "completed",
  "awaiting_verification",
]);

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

  const { data: commitment, error: fetchError } = await supabase
    .from("commitments")
    .select("creator_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !commitment) {
    return Response.json({ error: "Commitment not found" }, { status: 404 });
  }
  if (commitment.creator_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!ALLOWED_STATUSES.has(commitment.status)) {
    return Response.json(
      { error: "Cannot submit proof for this commitment" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { proof_text, proof_url } = body;

  if (!proof_text && !proof_url) {
    return Response.json(
      { error: "At least one of proof_text or proof_url is required" },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {
    proof_text: proof_text?.trim() || null,
    proof_url: proof_url?.trim() || null,
  };

  if (commitment.status === "active" || commitment.status === "pending_proof") {
    updates.status = "awaiting_verification";
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
