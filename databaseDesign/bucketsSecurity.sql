-- Allow owner to SELECT (read)
CREATE POLICY "profile_images_owner_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile_images'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Allow owner to INSERT (upload) into their folder
CREATE POLICY "profile_images_owner_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile_images'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Allow owner to UPDATE their objects
CREATE POLICY "profile_images_owner_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile_images'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'profile_images'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Allow owner to DELETE their objects
CREATE POLICY "profile_images_owner_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile_images'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );


-- SELECT (read)
CREATE POLICY "user_files_owner_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user_files'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- INSERT (upload)
CREATE POLICY "user_files_owner_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user_files'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- UPDATE (modify)
CREATE POLICY "user_files_owner_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user_files'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'user_files'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- DELETE (remove)
CREATE POLICY "user_files_owner_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user_files'::text AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- SELECT (read)
CREATE POLICY "temporary_storage_owner_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'temporary_storage'::text
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- INSERT (upload)
CREATE POLICY "temporary_storage_owner_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'temporary_storage'::text
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- UPDATE (modify)
CREATE POLICY "temporary_storage_owner_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'temporary_storage'::text
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'temporary_storage'::text
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- DELETE (remove)
CREATE POLICY "temporary_storage_owner_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'temporary_storage'::text
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );