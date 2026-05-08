-- Voice Selection System Migration

-- 1. Create AI Voices Table
CREATE TABLE IF NOT EXISTS ai_voices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    voice_id TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'premade',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seed with verified voices from current account
INSERT INTO ai_voices (name, voice_id, description) VALUES 
('Alice', 'Xb7hH8MSUJpSbSDYk0k2', 'Clear, engaging, and professional. Great for educators and trainers.'),
('Sarah', 'EXAVITQu4vr4xnSDxMaL', 'Mature, reassuring, and confident. Ideal for experienced decision makers.'),
('Charlie', 'IKne3meq5aSn9XLyUdCD', 'Deep, energetic, and authoritative. Good for assertive personas.'),
('Roger', 'CwhRBWXzGAHq8TQ4Fs17', 'Laid-back, casual, and resonant. Perfect for approachable characters.');

-- 3. Update Scenarios to include recommended voice
ALTER TABLE training_scenarios 
ADD COLUMN IF NOT EXISTS recommended_voice_id TEXT REFERENCES ai_voices(voice_id);

-- Update existing scenarios to recommend Alice (verified free-tier compatible)
UPDATE training_scenarios SET recommended_voice_id = 'Xb7hH8MSUJpSbSDYk0k2';

-- 4. Update Sessions to track selected voice for the call
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS selected_voice_id TEXT DEFAULT 'Xb7hH8MSUJpSbSDYk0k2';
