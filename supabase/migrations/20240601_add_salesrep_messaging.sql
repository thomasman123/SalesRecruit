-- Add applicant_user_id column to reference the authenticated sales professional user who applied
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS applicant_user_id UUID;

-- Link to users table (add the FK only if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversations_applicant_user_id_fkey'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_applicant_user_id_fkey
      FOREIGN KEY (applicant_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- Back-fill applicant_user_id for existing rows by pairing on e-mail if possible
-- (safe to ignore failures if no matching user account exists yet)
UPDATE public.conversations AS c
SET applicant_user_id = u.id
FROM public.applicants AS a
JOIN public.users AS u          ON a.email = u.email
WHERE c.applicant_id = a.id
  AND c.applicant_user_id IS NULL;

-- Ensure new conversations always specify applicant_user_id
ALTER TABLE public.conversations
  ALTER COLUMN applicant_user_id SET NOT NULL;

-- Row-Level Security ------------------------------------------------------------------------
-- Replace the old recruiter-only policies so that BOTH participants (recruiter or applicant
-- user) can read/write their conversations and related messages.
---------------------------------------------------------------------------------------------

-- Conversations ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Recruiters can manage their conversations" ON public.conversations;

CREATE POLICY "Participants can manage their conversations"
  ON public.conversations
  FOR ALL
  USING (recruiter_id = auth.uid() OR applicant_user_id = auth.uid());

-- Messages --------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

CREATE POLICY "Participants can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE recruiter_id = auth.uid() OR applicant_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can insert messages in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE recruiter_id = auth.uid() OR applicant_user_id = auth.uid()
    )
  );

-- Trigger to keep last_message_timestamp + unread_count fresh ------------------------------
CREATE OR REPLACE FUNCTION public.update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp
  UPDATE public.conversations
  SET last_message_timestamp = NEW.timestamp,
      unread_count = CASE
        WHEN NEW.sender_type = 'recruiter' THEN unread_count + 1   -- applicant has a new unread msg
        WHEN NEW.sender_type = 'applicant' THEN unread_count       -- recruiter tracks unread in a different column or externally
        ELSE unread_count
      END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_on_new_message ON public.messages;

CREATE TRIGGER trg_update_conversation_on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_new_message(); 