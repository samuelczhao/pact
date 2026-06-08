import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("challenges")
    .select("*, creator:profiles!creator_id(*), participants:challenge_participants(*, profile:profiles!user_id(*))")
    .eq("id", id)
    .single();

  if (error || !data) {
    return Response.json({ error: "Challenge not found" }, { status: 404 });
  }

  if (data.status === "open" && new Date(data.start_date) <= new Date()) {
    await supabase
      .from("challenges")
      .update({ status: "active" })
      .eq("id", id)
      .eq("status", "open");
    data.status = "active";
  }

  if (data.status === "active" && new Date(data.end_date) <= new Date()) {
    await supabase
      .from("challenges")
      .update({ status: "completed" })
      .eq("id", id)
      .eq("status", "active");
    data.status = "completed";
  }

  return Response.json(data);
}
