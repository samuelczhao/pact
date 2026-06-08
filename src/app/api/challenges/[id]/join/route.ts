import { createClient } from "@/lib/supabase/server";

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
  const { join_code } = body;

  const { data: challenge, error: fetchError } = await supabase
    .from("challenges")
    .select("id, join_code, status, max_participants")
    .eq("id", id)
    .single();

  if (fetchError || !challenge) {
    return Response.json({ error: "Challenge not found" }, { status: 404 });
  }

  if (challenge.join_code !== join_code) {
    return Response.json({ error: "Invalid join code" }, { status: 403 });
  }

  if (challenge.status !== "open" && challenge.status !== "active") {
    return Response.json({ error: "Challenge is no longer accepting participants" }, { status: 400 });
  }

  const { count } = await supabase
    .from("challenge_participants")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", id);

  if (count !== null && count >= challenge.max_participants) {
    return Response.json({ error: "Challenge is full" }, { status: 400 });
  }

  const { error: joinError } = await supabase
    .from("challenge_participants")
    .insert({ challenge_id: id, user_id: user.id });

  if (joinError) {
    if (joinError.code === "23505") {
      return Response.json({ error: "Already joined" }, { status: 409 });
    }
    return Response.json({ error: joinError.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
