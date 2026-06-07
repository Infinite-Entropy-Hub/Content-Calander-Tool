-- Add auto_publish to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;

-- Add notification settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_email TEXT,
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN DEFAULT false;
