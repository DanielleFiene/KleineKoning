-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  btw_profile JSONB NOT NULL DEFAULT '{"label": "Geen BTW", "percentage": 0, "rule": "none"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_ex_btw NUMERIC(10, 2),
  default_unit TEXT NOT NULL DEFAULT 'minutes' CHECK (default_unit IN ('minutes', 'quarter', 'hour', 'day')),
  rounding_rule TEXT NOT NULL DEFAULT 'none' CHECK (rounding_rule IN ('none', 'nearest15', 'up15', 'down15')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Time entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Statements table
CREATE TABLE statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  statement_number TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_user_id, statement_number)
);

-- Statement lines table
CREATE TABLE statement_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id UUID NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  project_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_clients_owner ON clients(owner_user_id);
CREATE INDEX idx_projects_owner ON projects(owner_user_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_time_entries_owner ON time_entries(owner_user_id);
CREATE INDEX idx_time_entries_client ON time_entries(client_id);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_statements_owner ON statements(owner_user_id);
CREATE INDEX idx_statements_client ON statements(client_id);
CREATE INDEX idx_statement_lines_statement ON statement_lines(statement_id);

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE statement_lines ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Time entries policies
CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own time entries"
  ON time_entries FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Statements policies
CREATE POLICY "Users can view own statements"
  ON statements FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own statements"
  ON statements FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own statements"
  ON statements FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own statements"
  ON statements FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Statement lines policies
CREATE POLICY "Users can view own statement lines"
  ON statement_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM statements
      WHERE statements.id = statement_lines.statement_id
      AND statements.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own statement lines"
  ON statement_lines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM statements
      WHERE statements.id = statement_lines.statement_id
      AND statements.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own statement lines"
  ON statement_lines FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM statements
      WHERE statements.id = statement_lines.statement_id
      AND statements.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own statement lines"
  ON statement_lines FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM statements
      WHERE statements.id = statement_lines.statement_id
      AND statements.owner_user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

