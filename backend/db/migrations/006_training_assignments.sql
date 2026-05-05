-- Training Assignments Table
CREATE TABLE IF NOT EXISTS training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rep_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES training_scenarios(id) ON DELETE CASCADE,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Pending',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assignments_rep ON training_assignments(rep_id);
CREATE INDEX IF NOT EXISTS idx_assignments_manager ON training_assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON training_assignments(status);
