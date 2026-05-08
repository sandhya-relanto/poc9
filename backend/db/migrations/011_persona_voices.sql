-- Persona Voices Migration
ALTER TABLE training_scenarios 
ADD COLUMN IF NOT EXISTS voice_id TEXT DEFAULT '21m00Tcm4TlvDq8ikWAM'; -- Default to "Rachel" (soft female voice)
