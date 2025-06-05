-- Create storage policies for image uploads
-- Run this in your Supabase SQL editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "images_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "images_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "ranking_data_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "ranking_data_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "ranking_data_delete_policy" ON storage.objects;

-- Images bucket policies
CREATE POLICY "images_upload_policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "images_select_policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "images_delete_policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');

-- Avatars bucket policies
CREATE POLICY "avatars_upload_policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_select_policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_delete_policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Ranking data bucket policies (admin only for insert/delete, public for select)
CREATE POLICY "ranking_data_upload_policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ranking-data' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "ranking_data_select_policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'ranking-data');

CREATE POLICY "ranking_data_delete_policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ranking-data' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Also enable RLS on storage.buckets if needed
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to bucket metadata
CREATE POLICY "buckets_public_read" ON storage.buckets
  FOR SELECT
  TO public
  USING (true);

-- Print confirmation
SELECT 'Storage policies created successfully!' as message; 