-- Add post_format to the posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS post_format TEXT DEFAULT 'reel';
