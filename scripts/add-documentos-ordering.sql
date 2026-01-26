-- Migration: Add ordering columns to documentos table
-- Run this in Supabase SQL Editor

-- Add sort_order column for custom ordering (lower number = higher priority)
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add importance_level column for category-based importance sorting
-- Higher number = more important
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS importance_level INTEGER DEFAULT 0;

-- Add file_type column to store MIME type
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);

-- Create index for sort_order to optimize ordering queries
CREATE INDEX IF NOT EXISTS idx_documentos_sort_order ON documentos(sort_order ASC);

-- Create index for importance_level
CREATE INDEX IF NOT EXISTS idx_documentos_importance_level ON documentos(importance_level DESC);

-- Create composite index for combined sorting
CREATE INDEX IF NOT EXISTS idx_documentos_importance_sort ON documentos(importance_level DESC, sort_order ASC);

-- Update existing documents to have sequential sort_order based on created_at
-- This ensures existing documents maintain their current order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM documentos
)
UPDATE documentos
SET sort_order = numbered.rn
FROM numbered
WHERE documentos.id = numbered.id;

-- Comment explaining the columns
COMMENT ON COLUMN documentos.sort_order IS 'Custom sort order for drag-and-drop reordering. Lower number = appears first.';
COMMENT ON COLUMN documentos.importance_level IS 'Importance level for category-based sorting. Higher number = more important.';
COMMENT ON COLUMN documentos.file_type IS 'MIME type of the uploaded file.';
