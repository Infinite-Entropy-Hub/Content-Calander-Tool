-- Upgrades the `posts` table to support Carousels (multiple images)
-- 1. Add the new array column
ALTER TABLE posts ADD COLUMN media_urls text[] DEFAULT '{}';

-- 2. Migrate all existing data from media_url to the new media_urls array
UPDATE posts SET media_urls = ARRAY[media_url] WHERE media_url IS NOT NULL;

-- 3. Remove the old column
ALTER TABLE posts DROP COLUMN media_url;
