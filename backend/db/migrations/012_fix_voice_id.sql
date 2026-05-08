-- Fix Persona Voices for Free Tier
UPDATE training_scenarios 
SET voice_id = 'Xb7hH8MSUJpSbSDYk0k2' 
WHERE voice_id = '21m00Tcm4TlvDq8ikWAM' OR voice_id = 'EXAVITOxlAnEFE0Cwd44' OR voice_id IS NULL;

-- Update default for future scenarios
ALTER TABLE training_scenarios 
ALTER COLUMN voice_id SET DEFAULT 'Xb7hH8MSUJpSbSDYk0k2';

