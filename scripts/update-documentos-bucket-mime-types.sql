-- Migration: Update documentos bucket to allow Excel files
-- Run this in Supabase SQL Editor

-- Update the bucket's allowed MIME types to include Excel files
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
WHERE id = 'documentos';

-- Verify the update
SELECT id, name, allowed_mime_types
FROM storage.buckets
WHERE id = 'documentos';
