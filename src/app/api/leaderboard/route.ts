import { createClient } from "@/lib/supabase/server";
import type { Commitment, LeaderboardEntry } from "@/lib/types/database";

const ACTIVE_STATUSES = new Set([
  "active",
  "pending_proof",
  "awaiting_verification",
]);

export async function GET() {
  const supabase = await createClient();

  const { data: commitments, error: commitmentsError } = await supabase
    .from("commitments")
    .select("creator_id, status, amount, deadline")
    .order("deadline", { ascending: false });

  if (commitmentsError) {
    return Response.json(
      { error: commitmentsError.message },
      { status: 500 },
    );
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url");

  if (profilesError) {
    return Response.json({ error: profilesError.message }, { status: 500 });
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const grouped = new Map<string, Commitment[]>();

  for (const c of commitments) {
    const existing = grouped.get(c.creator_id) ?? [];
    existing.push(c as Commitment);
    grouped.set(c.creator_id, existing);
  }

  const leaderboard: LeaderboardEntry[] = [];

  for (const [userId, userCommitments] of grouped) {
    const profile = profileMap.get(userId);
    if (!profile) continue;

    const completed = userCommitments.filter((c) => c.status === "completed");
    const failed = userCommitments.filter((c) => c.status === "failed");
    const completedCount = completed.length;
    const failedCount = failed.length;
    const denominator = completedCount + failedCount;

    const moneyLost = failed.reduce((sum, c) => sum + c.amount, 0);
    const moneyAtRisk = userCommitments
      .filter((c) => ACTIVE_STATUSES.has(c.status))
      .reduce((sum, c) => sum + c.amount, 0);

    const streak = computeStreak(userCommitments);

    leaderboard.push({
      user_id: userId,
      display_name: profile.display_name ?? "Anonymous",
      avatar_url: profile.avatar_url,
      total_commitments: userCommitments.length,
      completed_count: completedCount,
      failed_count: failedCount,
      completion_rate: denominator > 0
        ? Math.round((completedCount / denominator) * 100)
        : 0,
      money_lost: moneyLost,
      money_at_risk: moneyAtRisk,
      current_streak: streak,
    });
  }

  leaderboard.sort((a, b) => b.money_lost - a.money_lost);

  return Response.json(leaderboard);
}

function computeStreak(commitments: Commitment[]): number {
  const resolved = commitments
    .filter((c) => c.status === "completed" || c.status === "failed")
    .sort(
      (a, b) =>
        new Date(b.deadline).getTime() - new Date(a.deadline).getTime(),
    );

  let streak = 0;
  for (const c of resolved) {
    if (c.status === "completed") {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
