-- Ensure RLS enabled (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any old policies (safe)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- User policies: target authenticated users
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

  -- Delete policy
ALTER POLICY "Users can delete their own temp files"
  ON public.temp_storage
  TO public
  USING (
    (SELECT auth.uid()) = uid
  );

-- Insert policy (WITH CHECK)
ALTER POLICY "Users can insert their own temp files"
  ON public.temp_storage
  TO public
  WITH CHECK (
    (SELECT auth.uid()) = uid
  );

-- Update policy
ALTER POLICY "Users can update their own temp files"
  ON public.temp_storage
  TO public
  USING (
    (SELECT auth.uid()) = uid
  );

-- View/Select policy
ALTER POLICY "Users can view their own temp files"
  ON public.temp_storage
  TO public
  USING (
    (SELECT auth.uid()) = uid
  );