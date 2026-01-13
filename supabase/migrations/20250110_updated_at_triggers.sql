-- Example migration to add a database trigger for automatically updating updated_at
-- This ensures the field is always managed by the database, not the application

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to profile_video_cards table
DROP TRIGGER IF EXISTS update_profile_video_cards_updated_at ON profile_video_cards;
CREATE TRIGGER update_profile_video_cards_updated_at
  BEFORE UPDATE ON profile_video_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
