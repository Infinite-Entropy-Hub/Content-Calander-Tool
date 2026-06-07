-- 8_add_integrations.sql

-- Add api_keys JSONB column to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS api_keys JSONB DEFAULT '{}'::jsonb;
