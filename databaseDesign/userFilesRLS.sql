-- Allow authenticated users to upload files to user_files
CREATE POLICY "Users can upload their own files to user_files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user_files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files from user_files
CREATE POLICY "Users can view their own files in user_files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user_files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files in user_files
CREATE POLICY "Users can update their own files in user_files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user_files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files from user_files
CREATE POLICY "Users can delete their own files in user_files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user_files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);