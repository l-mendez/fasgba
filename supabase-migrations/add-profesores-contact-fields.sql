-- Add contact and rate fields to profesores table
ALTER TABLE profesores
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tarifa_horaria VARCHAR(100);
