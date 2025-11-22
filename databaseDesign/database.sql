-- Profiles table (one-to-one with auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  profile_picture text,
  created_at timestamptz DEFAULT now()
);

-- Long term storage (one-to-many with auth.users)
create table storage_nodes (
  id uuid primary key default gen_random_uuid(),

  -- Ownership (optional if you want per-user access)
  uid uuid references auth.users(id) on delete cascade,

  -- Node info
  name text not null,
  type text not null check (type in ('file', 'folder')),
  parent_id uuid references storage_nodes(id) on delete cascade,

  -- File metadata (NULL for folders)
  bucket text,             -- which bucket it's stored in
  bucket_path text,        -- path inside bucket
  mime_type text,
  file_size bigint,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
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