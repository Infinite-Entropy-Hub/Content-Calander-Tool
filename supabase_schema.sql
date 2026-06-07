-- 1. Create the `posts` table
CREATE TABLE posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users(id), -- Only if you implement Supabase Auth
  title text NOT NULL,
  description text,
  platform text NOT NULL CHECK (platform IN ('instagram', 'youtube', 'both')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  publish_mode text NOT NULL DEFAULT 'manual' CHECK (publish_mode IN ('auto', 'manual')),
  scheduled_for timestamp with time zone,
  published_at timestamp with time zone,
  media_url text -- URL to the file in Supabase Storage
);

-- 2. Create the `platforms_config` table (Optional: To store your API tokens if you want them in DB)
CREATE TABLE platforms_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  platform text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamp with time zone
);

-- 3. Set up Row Level Security (RLS) so only you can access your data
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own posts" 
ON posts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" 
ON posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON posts FOR DELETE 
USING (auth.uid() = user_id);

-- Note: If you are NOT using Supabase Auth (since you are the only user), 
-- you can disable RLS or remove the `user_id` column and policies.
