-- Step 1: Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Step 3: Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Step 4: Allow service role to insert profiles (for the trigger)
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Step 5: Allow users to insert their own profile (if needed)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 6: Enable RLS on storage_nodes table
ALTER TABLE public.storage_nodes ENABLE ROW LEVEL SECURITY;

create policy "users_read_own_nodes"
on storage_nodes for select
using (auth.uid() = uid);

create policy "users_write_own_nodes"
on storage_nodes for insert
with check (auth.uid() = uid);

create policy "users_update_own_nodes"
on storage_nodes for update
using (auth.uid() = uid)
with check (auth.uid() = uid);

create policy "users_delete_own_nodes"
on storage_nodes for delete
using (auth.uid() = uid);