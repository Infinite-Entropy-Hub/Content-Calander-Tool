-- 18. Instagram/Facebook keyword comment automations

CREATE TABLE IF NOT EXISTS public.comment_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  automation_type TEXT NOT NULL DEFAULT 'keyword_comment_dm'
    CHECK (automation_type = 'keyword_comment_dm'),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  platform_account_id TEXT NOT NULL,
  media_id TEXT NOT NULL,
  media_title TEXT,
  media_permalink TEXT,
  media_thumbnail_url TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  match_type TEXT NOT NULL DEFAULT 'contains'
    CHECK (match_type IN ('contains', 'exact', 'any_word')),
  public_reply TEXT NOT NULL,
  private_reply TEXT NOT NULL,
  confirmation_word TEXT NOT NULL DEFAULT 'FOLLOWED',
  final_message TEXT NOT NULL,
  final_link_url TEXT NOT NULL,
  final_button_text TEXT NOT NULL DEFAULT 'Get the source',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  scan_existing_comments BOOLEAN NOT NULL DEFAULT false,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comment_automations_lookup_idx
  ON public.comment_automations(platform, platform_account_id, media_id, is_enabled);
CREATE INDEX IF NOT EXISTS comment_automations_user_idx
  ON public.comment_automations(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.comment_automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.comment_automations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  platform_comment_id TEXT NOT NULL,
  platform_media_id TEXT NOT NULL,
  commenter_id TEXT,
  commenter_username TEXT,
  comment_text TEXT,
  comment_created_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processing', 'awaiting_response', 'completed', 'skipped', 'failed')),
  public_reply_id TEXT,
  private_message_id TEXT,
  recipient_id TEXT,
  final_message_id TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (automation_id, platform_comment_id)
);

CREATE INDEX IF NOT EXISTS comment_automation_events_recipient_idx
  ON public.comment_automation_events(recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS comment_automation_events_retry_idx
  ON public.comment_automation_events(status, attempt_count, updated_at);

ALTER TABLE public.comment_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_automation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their comment automations" ON public.comment_automations;
CREATE POLICY "Users manage their comment automations"
  ON public.comment_automations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view their automation events" ON public.comment_automation_events;
CREATE POLICY "Users view their automation events"
  ON public.comment_automation_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Webhook/cron writes use SUPABASE_SERVICE_ROLE_KEY and bypass RLS.
