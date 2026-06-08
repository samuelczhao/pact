import type { CommitmentStatus } from "@/lib/types/database";

interface ScoringCommitment {
  status: CommitmentStatus;
  amount: number;
  created_at: string;
  deadline: string | null;
}

const BASE_SCORE = 500;
const COMPLETE_POINTS = 50;
const FAIL_PENALTY = 75;
const STREAK_POINTS_PER_DAY = 10;
const STREAK_CAP = 200;
const STAKE_SCALE_REFERENCE = 50;
const MAX_STAKE_MULTIPLIER = 3;
const DECAY_PER_WEEK = 5;
const DECAY_FLOOR_THRESHOLD = 5;
const DECAY_FLOOR = 300;
const MAX_SCORE = 1000;
const MIN_SCORE = 0;

function stakeMultiplier(amount: number): number {
  return Math.min(amount / STAKE_SCALE_REFERENCE, MAX_STAKE_MULTIPLIER);
}

function computeStreak(commitments: ScoringCommitment[]): number {
  const completed = commitments
    .filter((c) => c.status === "completed")
    .sort((a, b) => {
      const dateA = a.deadline ?? a.created_at;
      const dateB = b.deadline ?? b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  let streak = 0;
  for (const c of completed) {
    const next = completed[streak + 1];
    if (!next) {
      streak++;
      break;
    }
    const thisDate = new Date(c.deadline ?? c.created_at).getTime();
    const nextDate = new Date(next.deadline ?? next.created_at).getTime();
    const gapDays = (thisDate - nextDate) / 86400000;
    if (gapDays > 14) break;
    streak++;
  }
  return streak;
}

function weeksSinceLastActivity(commitments: ScoringCommitment[]): number {
  if (commitments.length === 0) return 0;

  const latest = commitments.reduce((max, c) => {
    const t = new Date(c.created_at).getTime();
    return t > max ? t : max;
  }, 0);

  const now = Date.now();
  return Math.floor((now - latest) / (7 * 86400000));
}

export function computePactScore(commitments: ScoringCommitment[]): number {
  let score = BASE_SCORE;

  for (const c of commitments) {
    const mult = stakeMultiplier(c.amount);
    if (c.status === "completed") {
      score += COMPLETE_POINTS * mult;
    } else if (c.status === "failed") {
      score -= FAIL_PENALTY * mult;
    }
  }

  const streak = computeStreak(commitments);
  score += Math.min(streak * STREAK_POINTS_PER_DAY, STREAK_CAP);

  const weeksInactive = weeksSinceLastActivity(commitments);
  if (weeksInactive > 1) {
    const decay = (weeksInactive - 1) * DECAY_PER_WEEK;
    const completedCount = commitments.filter(
      (c) => c.status === "completed",
    ).length;
    const floor =
      completedCount >= DECAY_FLOOR_THRESHOLD ? DECAY_FLOOR : MIN_SCORE;
    score = Math.max(score - decay, floor);
  }

  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(score)));
}

export function scoreChange(
  status: "completed" | "failed",
  amount: number,
): number {
  const mult = stakeMultiplier(amount);
  return status === "completed"
    ? Math.round(COMPLETE_POINTS * mult)
    : -Math.round(FAIL_PENALTY * mult);
}
