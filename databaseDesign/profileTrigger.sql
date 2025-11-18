-- Update the function to use the username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',  -- Use username from signup form
      split_part(NEW.email, '@', 1)          -- Fallback to email prefix
    ),
    NOW()
  );
  RETURN NEW;
END;
$$;