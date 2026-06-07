import { createClient } from "@/lib/supabase/server";
import type { CommitmentStatus } from "@/lib/types/database";

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
    .select("partner_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !commitment) {
    return Response.json({ error: "Commitment not found" }, { status: 404 });
  }

  const isLegacyPartner = commitment.partner_id === user.id;

  const { data: partnerRow } = await supabase
    .from("commitment_partners")
    .select("id")
    .eq("commitment_id", id)
    .eq("partner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!isLegacyPartner && !partnerRow) {
    return Response.json(
      { error: "Only a partner can verify" },
      { status: 403 },
    );
  }

  if (commitment.status !== "awaiting_verification") {
    return Response.json(
      { error: "Commitment is not awaiting verification" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { approved } = body;

  if (typeof approved !== "boolean") {
    return Response.json(
      { error: "approved must be a boolean" },
      { status: 400 },
    );
  }

  const newStatus: CommitmentStatus = approved ? "completed" : "failed";

  const { data, error } = await supabase
    .from("commitments")
    .update({ status: newStatus })
    .eq("id", id)
    .eq("status", "awaiting_verification")
    .select()
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json({ error: "Commitment is no longer awaiting verification" }, { status: 409 });
  }

  return Response.json(data);
}
