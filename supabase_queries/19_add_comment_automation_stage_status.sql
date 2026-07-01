-- 19. Track public reply, private reply, and final-message stages independently.

ALTER TABLE public.comment_automation_events
  ADD COLUMN IF NOT EXISTS public_reply_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS private_reply_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS private_reply_error TEXT,
  ADD COLUMN IF NOT EXISTS final_status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS meta_response JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.comment_automation_events
  DROP CONSTRAINT IF EXISTS comment_automation_events_status_check;

ALTER TABLE public.comment_automation_events
  ADD CONSTRAINT comment_automation_events_status_check
  CHECK (status IN (
    'received',
    'processing',
    'awaiting_response',
    'completed',
    'partial_success',
    'awaiting_response_disabled_dm',
    'skipped',
    'failed'
  ));

ALTER TABLE public.comment_automation_events
  DROP CONSTRAINT IF EXISTS comment_automation_events_public_reply_status_check;
ALTER TABLE public.comment_automation_events
  ADD CONSTRAINT comment_automation_events_public_reply_status_check
  CHECK (public_reply_status IN ('pending', 'succeeded', 'failed', 'skipped'));

ALTER TABLE public.comment_automation_events
  DROP CONSTRAINT IF EXISTS comment_automation_events_private_reply_status_check;
ALTER TABLE public.comment_automation_events
  ADD CONSTRAINT comment_automation_events_private_reply_status_check
  CHECK (private_reply_status IN ('pending', 'succeeded', 'failed', 'skipped', 'ineligible'));

ALTER TABLE public.comment_automation_events
  DROP CONSTRAINT IF EXISTS comment_automation_events_final_status_check;
ALTER TABLE public.comment_automation_events
  ADD CONSTRAINT comment_automation_events_final_status_check
  CHECK (final_status IN ('not_started', 'awaiting_response', 'succeeded', 'failed', 'disabled'));
