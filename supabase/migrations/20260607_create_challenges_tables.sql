-- Pool Challenges: group accountability with shared stakes
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  stake numeric(10,2) NOT NULL CHECK (stake > 0 AND stake <= 10000),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  proof_requirement text,
  proof_frequency text NOT NULL DEFAULT 'daily' CHECK (proof_frequency IN ('daily', 'weekly')),
  creator_id uuid NOT NULL REFERENCES auth.users(id),
  max_participants integer NOT NULL DEFAULT 10 CHECK (max_participants >= 2 AND max_participants <= 50),
  join_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'completed', 'cancelled')),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  proof_count integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS challenge_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  proof_text text,
  proof_url text,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  ai_verdict boolean,
  ai_confidence real,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id, checkin_date)
);

-- RLS policies
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_checkins ENABLE ROW LEVEL SECURITY;

-- Challenges: anyone authenticated can read public, participants can read private
CREATE POLICY "challenges_select" ON challenges
  FOR SELECT TO authenticated
  USING (is_public OR creator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM challenge_participants WHERE challenge_id = challenges.id AND user_id = auth.uid()
  ));

CREATE POLICY "challenges_insert" ON challenges
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "challenges_update" ON challenges
  FOR UPDATE TO authenticated
  USING (creator_id = auth.uid());

-- Participants: visible to all challenge members
CREATE POLICY "challenge_participants_select" ON challenge_participants
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM challenge_participants cp WHERE cp.challenge_id = challenge_participants.challenge_id AND cp.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM challenges c WHERE c.id = challenge_participants.challenge_id AND c.is_public
  ));

CREATE POLICY "challenge_participants_insert" ON challenge_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Checkins: visible to challenge members
CREATE POLICY "challenge_checkins_select" ON challenge_checkins
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM challenge_participants cp WHERE cp.challenge_id = challenge_checkins.challenge_id AND cp.user_id = auth.uid()
  ));

CREATE POLICY "challenge_checkins_insert" ON challenge_checkins
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_checkins;
