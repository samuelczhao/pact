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

  const { data, error } = await supabase
    .from("challenge_checkins")
    .select("*")
    .eq("commitment_id", id)
    .eq("user_id", user.id)
    .order("checkin_date", { ascending: false })
    .limit(30);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
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

  const { data: commitment } = await supabase
    .from("commitments")
    .select("creator_id, status, daily_checkin")
    .eq("id", id)
    .single();

  if (!commitment) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (commitment.creator_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!commitment.daily_checkin) {
    return Response.json({ error: "Daily check-in not enabled" }, { status: 400 });
  }
  if (commitment.status !== "active") {
    return Response.json({ error: "Pact is not active" }, { status: 400 });
  }

  const body = await request.json();
  const { proof_text } = body;

  if (!proof_text?.trim()) {
    return Response.json({ error: "Check-in text is required" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: checkin, error } = await supabase
    .from("challenge_checkins")
    .insert({
      commitment_id: id,
      user_id: user.id,
      proof_text: proof_text.trim(),
      checkin_date: today,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Already checked in today" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(checkin, { status: 201 });
}
