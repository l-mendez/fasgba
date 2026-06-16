-- Legacy archive only. Do not run directly.
-- Create a new Supabase CLI migration under supabase/migrations instead.

-- Add contact and rate fields to profesores table
ALTER TABLE profesores
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tarifa_horaria VARCHAR(100);
