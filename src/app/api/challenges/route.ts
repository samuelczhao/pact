import { createClient } from "@/lib/supabase/server";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: participating } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .eq("user_id", user.id);

  const challengeIds = participating?.map((p) => p.challenge_id) ?? [];

  const { data: challenges, error } = await supabase
    .from("challenges")
    .select("*, participants:challenge_participants(*, profile:profiles!user_id(*))")
    .or(`creator_id.eq.${user.id},id.in.(${challengeIds.join(",")})`)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(challenges ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    stake,
    start_date,
    end_date,
    proof_requirement,
    proof_frequency,
    max_participants,
    is_public,
  } = body;

  if (!title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (!stake || stake <= 0 || stake > 10000) {
    return Response.json({ error: "Stake must be between $0.01 and $10,000" }, { status: 400 });
  }
  if (!start_date || !end_date) {
    return Response.json({ error: "Start and end dates are required" }, { status: 400 });
  }
  if (new Date(end_date) <= new Date(start_date)) {
    return Response.json({ error: "End date must be after start date" }, { status: 400 });
  }

  const joinCode = generateJoinCode();

  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      stake: Number(stake),
      start_date,
      end_date,
      proof_requirement: proof_requirement?.trim() || null,
      proof_frequency: proof_frequency || "daily",
      creator_id: user.id,
      max_participants: max_participants || 10,
      join_code: joinCode,
      is_public: is_public ?? true,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("challenge_participants").insert({
    challenge_id: challenge.id,
    user_id: user.id,
  });

  return Response.json(challenge, { status: 201 });
}
