-- 16. Add Work Reminders to Posts

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS work_reminder_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_reminder_sent BOOLEAN DEFAULT false;
