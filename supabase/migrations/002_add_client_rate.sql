-- Add rate_ex_btw field to clients table for manual rate entry (e.g., for foreign clients)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rate_ex_btw NUMERIC(10, 2);

