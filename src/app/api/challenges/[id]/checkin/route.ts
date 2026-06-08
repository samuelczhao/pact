import { createClient } from "@/lib/supabase/server";
import { verifyProofWithAi } from "@/lib/ai-verify";

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

  const { data: checkins, error } = await supabase
    .from("challenge_checkins")
    .select("*, profile:profiles!user_id(*)")
    .eq("challenge_id", id)
    .order("checkin_date", { ascending: false })
    .limit(100);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(checkins ?? []);
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

  const { data: participant } = await supabase
    .from("challenge_participants")
    .select("id, status, proof_count")
    .eq("challenge_id", id)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return Response.json({ error: "Not a participant" }, { status: 403 });
  }
  if (participant.status !== "active") {
    return Response.json({ error: "Challenge already ended for you" }, { status: 400 });
  }

  const { data: challenge } = await supabase
    .from("challenges")
    .select("title, proof_requirement, status")
    .eq("id", id)
    .single();

  if (!challenge || challenge.status !== "active") {
    return Response.json({ error: "Challenge is not active" }, { status: 400 });
  }

  const body = await request.json();
  const { proof_text, proof_url } = body;

  if (!proof_text && !proof_url) {
    return Response.json(
      { error: "Proof text or URL is required" },
      { status: 400 },
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const insertData: Record<string, unknown> = {
    challenge_id: id,
    user_id: user.id,
    proof_text: proof_text?.trim() || null,
    proof_url: proof_url?.trim() || null,
    checkin_date: today,
  };

  if (challenge.proof_requirement) {
    const verdict = await verifyProofWithAi(
      challenge.title,
      challenge.proof_requirement,
      proof_text?.trim() || null,
      proof_url?.trim() || null,
    );
    if (verdict) {
      insertData.ai_verdict = verdict.satisfied;
      insertData.ai_confidence = verdict.confidence;
    }
  }

  const { data: checkin, error } = await supabase
    .from("challenge_checkins")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Already checked in today" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("challenge_participants")
    .update({ proof_count: participant.proof_count + 1 })
    .eq("challenge_id", id)
    .eq("user_id", user.id);

  return Response.json(checkin, { status: 201 });
}
