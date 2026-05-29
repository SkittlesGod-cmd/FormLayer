-- Run this in the Supabase SQL editor to create the formulations table.

CREATE TABLE IF NOT EXISTS public.formulations (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT         NOT NULL,
  description           TEXT,
  status                TEXT         NOT NULL DEFAULT 'draft'
                                     CHECK (status IN ('draft', 'in_progress', 'review', 'compliant')),
  ingredients           JSONB        NOT NULL DEFAULT '[]'::jsonb,
  target_dose           TEXT,
  serving_size          TEXT,
  capsule_size          TEXT,
  capsules_per_serving  INTEGER,
  notes                 TEXT,
  compliance_score      INTEGER,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS formulations_user_id_idx
  ON public.formulations(user_id);

CREATE INDEX IF NOT EXISTS formulations_status_idx
  ON public.formulations(status);

ALTER TABLE public.formulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own formulations" ON public.formulations;
DROP POLICY IF EXISTS "Users can insert own formulations" ON public.formulations;
DROP POLICY IF EXISTS "Users can update own formulations" ON public.formulations;
DROP POLICY IF EXISTS "Users can delete own formulations" ON public.formulations;

CREATE POLICY "Users can view own formulations"
  ON public.formulations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own formulations"
  ON public.formulations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own formulations"
  ON public.formulations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own formulations"
  ON public.formulations FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_formulation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS formulations_updated_at ON public.formulations;
CREATE TRIGGER formulations_updated_at
  BEFORE UPDATE ON public.formulations
  FOR EACH ROW EXECUTE FUNCTION public.update_formulation_timestamp();
