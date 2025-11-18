-- Profiles table (one-to-one with auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  profile_picture text,
  created_at timestamptz DEFAULT now()
);

-- Long term storage (one-to-many with auth.users)
CREATE TABLE long_term_storage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  data text, -- or jsonb for structured data
  created_at timestamptz DEFAULT now()
);

-- Temporary storage (one-to-many with auth.users)
CREATE TABLE temp_storage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  data text, -- or jsonb
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for better query performance
CREATE INDEX idx_long_term_storage_uid ON long_term_storage(uid);
CREATE INDEX idx_temp_storage_uid ON temp_storage(uid);
CREATE INDEX idx_temp_storage_expires ON temp_storage(expires_at);

-- Constraints for username
ALTER TABLE profiles
ADD CONSTRAINT username_min_length CHECK (char_length(username) >= 3);