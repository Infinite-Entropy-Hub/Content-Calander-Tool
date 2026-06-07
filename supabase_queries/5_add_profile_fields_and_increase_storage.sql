-- 1. Add new columns to the profiles table for the Auth Wizard
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS source TEXT;

-- 2. Increase the Supabase Storage Bucket file size limit to 500MB (524288000 bytes)
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'media';
