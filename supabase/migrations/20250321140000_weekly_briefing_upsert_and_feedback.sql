-- One row per user per calendar week (atomic upsert target)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'weekly_briefings_user_week_unique'
  ) THEN
    ALTER TABLE public.weekly_briefings
      ADD CONSTRAINT weekly_briefings_user_week_unique
      UNIQUE (user_id, week_start);
  END IF;
END $$;

-- Atomically insert or update; only touch sent_at when p_set_sent_at is true
CREATE OR REPLACE FUNCTION public.upsert_weekly_briefing(
  p_user_id uuid,
  p_week_start date,
  p_content text,
  p_sent_at timestamptz,
  p_set_sent_at boolean
)
RETURNS TABLE (
  id uuid,
  week_start date,
  content text,
  sent_at timestamptz
)
LANGUAGE sql
AS $$
  INSERT INTO public.weekly_briefings (user_id, week_start, content, sent_at)
  VALUES (
    p_user_id,
    p_week_start,
    p_content,
    CASE WHEN p_set_sent_at THEN p_sent_at ELSE NULL END
  )
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    content = EXCLUDED.content,
    sent_at = CASE
      WHEN p_set_sent_at THEN EXCLUDED.sent_at
      ELSE weekly_briefings.sent_at
    END
  RETURNING id, week_start, content, sent_at;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_weekly_briefing(
  uuid,
  date,
  text,
  timestamptz,
  boolean
) TO service_role;

CREATE TABLE public.briefing_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id uuid NOT NULL REFERENCES public.weekly_briefings (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  sentiment text NOT NULL CHECK (sentiment IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX briefing_feedback_briefing_id_idx ON public.briefing_feedback (briefing_id);

ALTER TABLE public.briefing_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.briefing_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON public.briefing_feedback
  FOR SELECT USING (auth.uid() = user_id);
