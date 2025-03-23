-- supabase/migrations/20250320174803_morning_resonance.sql

-- Create participant table with all attendance fields
CREATE TABLE IF NOT EXISTS participant (
  srn text PRIMARY KEY NOT NULL,
  entry text DEFAULT NULL,
  dinner text DEFAULT NULL,
  snacks text DEFAULT NULL,
  breakfast text DEFAULT NULL
);

-- Enable RLS
ALTER TABLE participant ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to participant" ON participant
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow update access to participant" ON participant
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert access to participant" ON participant
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add policy for public access if needed (only if you're not handling auth in your app)
CREATE POLICY "Allow public read access to participant" ON participant
  FOR SELECT USING (true);

CREATE POLICY "Allow public update access to participant" ON participant
  FOR UPDATE USING (true) WITH CHECK (true);