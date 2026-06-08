-- Add AI verification columns to commitments
ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS ai_verdict boolean,
  ADD COLUMN IF NOT EXISTS ai_confidence real,
  ADD COLUMN IF NOT EXISTS ai_reason text;
