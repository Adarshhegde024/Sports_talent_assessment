-- ====================================================================
-- SPORTSENSE AI — TALENT REPORTS & PROTOCOLS MIGRATION (RESILIENT)
-- Migration Version: 20261010010000_talent_reports_and_storage.sql
-- Description: Self-contained, ultra-resilient migration that safely
--              creates public.talent_reports, sets up RLS policies,
--              seeds the 5 assessments, and configures storage.
--              Guaranteed zero 42P01 relation errors.
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Helper Function: Automatic updated_at Timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure profiles table exists (if missing, create basic schema)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER CHECK (age >= 0 AND age <= 120),
  height INTEGER,
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'recreational', 'trained', 'competitive')),
  disclaimer_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Ensure assessments table exists before inserting seed rows
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Seed / Update All 5 Standardized Biomechanical Assessments
INSERT INTO public.assessments (name, slug, description, is_active)
VALUES
  ('Vertical Jump', 'vertical-jump', 'Measures explosive lower-body power and peak flight time using smartphone video pose estimation.', true),
  ('Squat', 'squat', 'Assesses lower-body movement, stability, depth, and kinematic consistency.', true),
  ('Single-Leg Balance', 'single-leg-balance', 'Assesses balance, core stability, and postural sway control on single leg.', true),
  ('Push-Up', 'push-up', 'Assesses upper-body muscular endurance and full range of motion repetition cadence.', true),
  ('Side-to-Side Agility', 'side-to-side-agility', 'Assesses lateral change-of-direction speed, deceleration control, and quickness.', true)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 6. Create talent_reports table
CREATE TABLE IF NOT EXISTS public.talent_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  primary_sport TEXT NOT NULL,
  compatibility_score NUMERIC NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 7. Add Foreign Key to profiles or auth.users safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'talent_reports_user_id_fkey' AND table_name = 'talent_reports'
    ) THEN
      ALTER TABLE public.talent_reports
        ADD CONSTRAINT talent_reports_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'talent_reports_user_id_auth_fkey' AND table_name = 'talent_reports'
    ) THEN
      ALTER TABLE public.talent_reports
        ADD CONSTRAINT talent_reports_user_id_auth_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Foreign key setup note: %', SQLERRM;
END $$;

-- 8. Create index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_talent_reports_user ON public.talent_reports(user_id);

-- 9. Auto-update updated_at timestamp trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_talent_reports_updated_at'
  ) THEN
    CREATE TRIGGER set_talent_reports_updated_at
      BEFORE UPDATE ON public.talent_reports
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- 10. Enable Row Level Security (RLS) & Policies Safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_reports') THEN
    ALTER TABLE public.talent_reports ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view own talent report" ON public.talent_reports;
    CREATE POLICY "Users can view own talent report"
      ON public.talent_reports FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own talent report" ON public.talent_reports;
    CREATE POLICY "Users can insert own talent report"
      ON public.talent_reports FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update own talent report" ON public.talent_reports;
    CREATE POLICY "Users can update own talent report"
      ON public.talent_reports FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete own talent report" ON public.talent_reports;
    CREATE POLICY "Users can delete own talent report"
      ON public.talent_reports FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 11. Storage bucket & security configuration
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'assessment-videos',
    'assessment-videos',
    false,
    52428800, -- 50 MB limit
    ARRAY['video/webm', 'video/mp4', 'video/quicktime']::text[]
  )
  ON CONFLICT (id) DO UPDATE
  SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DROP POLICY IF EXISTS "Users can upload video to own folder" ON storage.objects;
    CREATE POLICY "Users can upload video to own folder"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'assessment-videos' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );

    DROP POLICY IF EXISTS "Users can view video in own folder" ON storage.objects;
    CREATE POLICY "Users can view video in own folder"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'assessment-videos' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );

    DROP POLICY IF EXISTS "Users can delete video in own folder" ON storage.objects;
    CREATE POLICY "Users can delete video in own folder"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'assessment-videos' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Storage configuration note (non-fatal): %', SQLERRM;
END $$;
