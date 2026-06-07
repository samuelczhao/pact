import { createClient } from "@/lib/supabase/server";

export async function POST(
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

  const { data: commitment, error: fetchError } = await supabase
    .from("commitments")
    .select("creator_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !commitment) {
    return Response.json({ error: "Commitment not found" }, { status: 404 });
  }
  if (commitment.creator_id !== user.id) {
    return Response.json({ error: "Only the creator can self-report" }, { status: 403 });
  }
  if (commitment.status !== "active") {
    return Response.json({ error: "Cannot complete a commitment in this state" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("commitments")
    .update({ status: "completed" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
