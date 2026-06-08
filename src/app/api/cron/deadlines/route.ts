import { createServiceClient } from "@/lib/supabase/server";

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;

export async function POST(request: Request) {
  // TODO: Verify CRON_SECRET header once deployed
  const cronSecret = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && cronSecret !== `Bearer ${expectedSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date();
  const in1Hour = new Date(now.getTime() + ONE_HOUR_MS).toISOString();
  const in24Hours = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS).toISOString();

  // Mark past-deadline active commitments as pending_proof
  const { data: expired, error: expiredError } = await supabase
    .from("commitments")
    .update({ status: "pending_proof" })
    .eq("status", "active")
    .lt("deadline", now.toISOString())
    .select("id, creator_id");

  if (expiredError) {
    return Response.json({ error: expiredError.message }, { status: 500 });
  }

  // 24-hour deadline warnings
  const { data: approaching24h } = await supabase
    .from("commitments")
    .select("id, creator_id")
    .eq("status", "active")
    .gt("deadline", now.toISOString())
    .lte("deadline", in24Hours);

  let notifications24h = 0;
  for (const c of approaching24h ?? []) {
    const created = await createNotificationIfNotExists(
      supabase,
      c.creator_id,
      c.id,
      "deadline_approaching_24h",
      "Your commitment deadline is within 24 hours",
    );
    if (created) notifications24h++;
  }

  // 1-hour deadline warnings
  const { data: approaching1h } = await supabase
    .from("commitments")
    .select("id, creator_id")
    .eq("status", "active")
    .gt("deadline", now.toISOString())
    .lte("deadline", in1Hour);

  let notifications1h = 0;
  for (const c of approaching1h ?? []) {
    const created = await createNotificationIfNotExists(
      supabase,
      c.creator_id,
      c.id,
      "deadline_approaching_1h",
      "Your commitment deadline is within 1 hour",
    );
    if (created) notifications1h++;
  }

  // Daily check-in strikes: find active pacts with daily_checkin that weren't checked in yesterday
  const yesterday = new Date(now.getTime() - TWENTY_FOUR_HOURS_MS)
    .toISOString()
    .split("T")[0];

  const { data: dailyPacts } = await supabase
    .from("commitments")
    .select("id, creator_id, strikes, max_strikes, created_at")
    .eq("status", "active")
    .eq("daily_checkin", true);

  let strikesIssued = 0;
  let failedFromStrikes = 0;

  for (const pact of dailyPacts ?? []) {
    const createdAt = new Date(pact.created_at).getTime();
    if (now.getTime() - createdAt < TWENTY_FOUR_HOURS_MS) continue;

    const { data: checkin } = await supabase
      .from("challenge_checkins")
      .select("id")
      .eq("commitment_id", pact.id)
      .eq("user_id", pact.creator_id)
      .eq("checkin_date", yesterday)
      .limit(1);

    if (checkin && checkin.length > 0) continue;

    const newStrikes = pact.strikes + 1;
    if (newStrikes >= pact.max_strikes) {
      await supabase
        .from("commitments")
        .update({ status: "failed", strikes: newStrikes })
        .eq("id", pact.id);
      failedFromStrikes++;
    } else {
      await supabase
        .from("commitments")
        .update({ strikes: newStrikes })
        .eq("id", pact.id);
      strikesIssued++;
    }
  }

  return Response.json({
    expired_count: expired?.length ?? 0,
    notifications_24h: notifications24h,
    notifications_1h: notifications1h,
    strikes_issued: strikesIssued,
    failed_from_strikes: failedFromStrikes,
  });
}

async function createNotificationIfNotExists(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string,
  commitmentId: string,
  type: string,
  message: string,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("commitment_id", commitmentId)
    .eq("type", type)
    .limit(1);

  if (existing && existing.length > 0) {
    return false;
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    commitment_id: commitmentId,
    type,
    message,
    read: false,
  });

  return !error;
}
