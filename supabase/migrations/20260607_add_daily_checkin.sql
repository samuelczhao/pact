-- Add daily check-in support to individual pacts
ALTER TABLE commitments ADD COLUMN IF NOT EXISTS daily_checkin boolean NOT NULL DEFAULT false;
ALTER TABLE commitments ADD COLUMN IF NOT EXISTS strikes integer NOT NULL DEFAULT 0;
ALTER TABLE commitments ADD COLUMN IF NOT EXISTS max_strikes integer NOT NULL DEFAULT 3;

-- Reuse challenge_checkins table for pact check-ins too
-- Add commitment_id column (nullable, since challenge_id is also nullable now)
ALTER TABLE challenge_checkins ADD COLUMN IF NOT EXISTS commitment_id uuid REFERENCES commitments(id) ON DELETE CASCADE;
ALTER TABLE challenge_checkins ALTER COLUMN challenge_id DROP NOT NULL;

-- Add constraint: must have one of challenge_id or commitment_id
ALTER TABLE challenge_checkins ADD CONSTRAINT checkin_parent_check
  CHECK (challenge_id IS NOT NULL OR commitment_id IS NOT NULL);
