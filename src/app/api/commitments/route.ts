import { createClient } from "@/lib/supabase/server";

interface PartnerInput {
  partner_id?: string | null;
  partner_name?: string | null;
  partner_email?: string | null;
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
    amount,
    deadline,
    proof_requirement,
    is_public,
    daily_checkin,
    partners,
    // Legacy single-partner fields
    partner_id,
    partner_name,
    partner_email,
  } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return Response.json(
      { error: "Amount must be greater than 0" },
      { status: 400 },
    );
  }
  if (deadline && new Date(deadline) <= new Date()) {
    return Response.json(
      { error: "Deadline must be in the future" },
      { status: 400 },
    );
  }

  const partnerList: PartnerInput[] = Array.isArray(partners) ? partners : [];
  if (partner_id) {
    partnerList.push({ partner_id, partner_name, partner_email });
  }
  if (partnerList.length === 0) {
    return Response.json(
      { error: "At least one accountability partner is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("commitments")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      amount,
      deadline: deadline || null,
      proof_requirement: proof_requirement?.trim() || null,
      is_public: is_public !== false,
      daily_checkin: daily_checkin === true,
      status: "active" as const,
      creator_id: user.id,
      partner_id: partner_id || null,
      partner_name: partner_name?.trim() || null,
      partner_email: partner_email?.trim() || null,
      editable_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = partnerList.map((p) => ({
    commitment_id: data.id,
    partner_id: p.partner_id || null,
    partner_name: p.partner_name?.toString().trim() || null,
    partner_email: p.partner_email?.toString().trim() || null,
  }));

  await supabase.from("commitment_partners").insert(rows);

  return Response.json(data, { status: 201 });
}
