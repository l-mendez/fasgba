-- Migration: Create documentos table
-- Run this in Supabase SQL Editor

-- Create the documentos table
CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  uploaded_by_auth_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_documentos_created_at ON documentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documentos_category ON documentos(category);

-- Enable Row Level Security
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "documentos_select_policy" ON documentos;
DROP POLICY IF EXISTS "documentos_insert_policy" ON documentos;
DROP POLICY IF EXISTS "documentos_update_policy" ON documentos;
DROP POLICY IF EXISTS "documentos_delete_policy" ON documentos;

-- Public read access for all users
CREATE POLICY "documentos_select_policy" ON documentos
  FOR SELECT
  TO public
  USING (true);

-- Admin-only insert
CREATE POLICY "documentos_insert_policy" ON documentos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_id = auth.uid()
    )
  );

-- Admin-only update
CREATE POLICY "documentos_update_policy" ON documentos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_id = auth.uid()
    )
  );

-- Admin-only delete
CREATE POLICY "documentos_delete_policy" ON documentos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.auth_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_documentos_updated_at ON documentos;
CREATE TRIGGER trigger_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_documentos_updated_at();
