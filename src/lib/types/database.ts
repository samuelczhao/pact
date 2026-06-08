export type CommitmentStatus =
  | "active"
  | "pending_proof"
  | "awaiting_verification"
  | "completed"
  | "failed";

export type NotificationType =
  | "partner_assigned"
  | "proof_submitted"
  | "deadline_approaching_24h"
  | "deadline_approaching_1h"
  | "commitment_verified"
  | "commitment_failed";

export interface Profile {
  id: string;
  display_name: string | null;
  venmo_username: string | null;
  avatar_url: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommitmentPartner {
  id: string;
  commitment_id: string;
  partner_id: string | null;
  partner_name: string | null;
  partner_email: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Commitment {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  deadline: string | null;
  proof_requirement: string | null;
  status: CommitmentStatus;
  creator_id: string;
  partner_id: string | null;
  partner_name: string | null;
  partner_email: string | null;
  proof_text: string | null;
  proof_url: string | null;
  ai_verdict: boolean | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  daily_checkin: boolean;
  strikes: number;
  max_strikes: number;
  is_public: boolean;
  editable_until: string;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  partner?: Profile;
  commitment_partners?: CommitmentPartner[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  commitment_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
  commitment?: Commitment;
}

export interface FeedEvent {
  id: string;
  commitment_id: string;
  user_id: string;
  event_type: string;
  message: string;
  created_at: string;
  profile?: Profile;
}

export interface Comment {
  id: string;
  commitment_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export type ChallengeStatus = "open" | "active" | "completed" | "cancelled";
export type ProofFrequency = "daily" | "weekly";
export type ChallengeParticipantStatus = "active" | "completed" | "failed";

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  stake: number;
  start_date: string;
  end_date: string;
  proof_requirement: string | null;
  proof_frequency: ProofFrequency;
  creator_id: string;
  max_participants: number;
  join_code: string;
  status: ChallengeStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  participants?: ChallengeParticipant[];
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  status: ChallengeParticipantStatus;
  proof_count: number;
  joined_at: string;
  profile?: Profile;
}

export interface ChallengeCheckin {
  id: string;
  challenge_id: string | null;
  commitment_id: string | null;
  user_id: string;
  proof_text: string | null;
  proof_url: string | null;
  checkin_date: string;
  ai_verdict: boolean | null;
  ai_confidence: number | null;
  created_at: string;
  profile?: Profile;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_commitments: number;
  completed_count: number;
  failed_count: number;
  completion_rate: number;
  money_lost: number;
  money_at_risk: number;
  current_streak: number;
  pact_score: number;
}
