-- 12. Add notes and is_scheduled to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_scheduled boolean DEFAULT false;
