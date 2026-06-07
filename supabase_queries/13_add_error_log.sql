-- 13. Add error_log to posts table for cron execution logging
ALTER TABLE posts ADD COLUMN IF NOT EXISTS error_log text;
