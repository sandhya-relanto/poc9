-- Best of 3 Attempts Migration
ALTER TABLE training_assignments 
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL;
