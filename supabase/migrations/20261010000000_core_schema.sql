-- ====================================================================
-- SPORTSENSE AI — COMPLETE SUPABASE DATABASE CORE SCHEMA & POLICIES
-- Migration Version: 20261010000000_core_schema.sql
-- Description: Complete core database setup for SportSense AI.
--              Includes all tables, 5 movement protocols, 6 sports,
--              Row Level Security (RLS) policies, triggers & storage.
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

-- ====================================================================
-- TABLE: profiles (Athlete Identity & Anthropometrics)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER CHECK (age >= 0 AND age <= 120),
  height INTEGER, -- Height in cm
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'recreational', 'trained', 'competitive')),
  disclaimer_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at') THEN
      CREATE TRIGGER set_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
  END IF;
END $$;

-- ====================================================================
-- TABLE: sports (Reference Sports & Athletic Archetypes)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- TABLE: user_sports (User Preferred / Target Sports)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sport_id)
);

-- ====================================================================
-- TABLE: assessments (The 5 Standardized Biomechanical Protocols)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- TABLE: assessment_runs (Sessions recorded per movement)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.assessment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ====================================================================
-- TABLE: assessment_attempts (Individual video takes within a run)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.assessment_runs(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'uploaded', 'analyzed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- TABLE: assessment_results (Computed Kinematics & Trait Scores)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL UNIQUE REFERENCES public.assessment_runs(id) ON DELETE CASCADE,
  jump_height NUMERIC,
  performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  sport_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- TABLE: talent_reports (Synthesized Multi-Movement Talent Discovery)
-- ====================================================================
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
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Foreign key check note: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_reports') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_talent_reports_updated_at') THEN
      CREATE TRIGGER set_talent_reports_updated_at
        BEFORE UPDATE ON public.talent_reports
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
  END IF;
END $$;

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_user_sports_user ON public.user_sports(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_runs_user ON public.assessment_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_runs_assessment ON public.assessment_runs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_run ON public.assessment_attempts(run_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_run ON public.assessment_results(run_id);
CREATE INDEX IF NOT EXISTS idx_talent_reports_user ON public.talent_reports(user_id);

-- ====================================================================
-- SEED DATA: Sports Archetypes & All 5 Assessment Protocols
-- ====================================================================
INSERT INTO public.sports (name, slug, description, image_url, is_active)
VALUES
  ('Basketball', 'basketball', 'Requires vertical jump power, agility, and multi-directional speed.', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80', true),
  ('Volleyball', 'volleyball', 'Demands explosive takeoff, reactive power, and airborne hang-time.', 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1600&q=80', true),
  ('Football', 'football', 'Relies on acceleration, stamina, rapid change of direction, and body control.', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=80', true),
  ('Cricket', 'cricket', 'Focuses on sprint bursts, upper-lower body coordination, and explosive bowling/batting mechanics.', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80', true),
  ('Tennis', 'tennis', 'Tests rotational torque, quick deceleration, and rapid court coverage.', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1600&q=80', true),
  ('Badminton', 'badminton', 'Prioritizes wrist snap velocity, short court burst agility, and instant reaction time.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=80', true)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

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

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
DO $$
BEGIN
  -- 1. Profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
    CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);
  END IF;

  -- 2. Sports
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sports') THEN
    ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can view active sports" ON public.sports;
    CREATE POLICY "Anyone can view active sports" ON public.sports FOR SELECT USING (is_active = true);
  END IF;

  -- 3. User Sports
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sports') THEN
    ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own preferred sports" ON public.user_sports;
    CREATE POLICY "Users can view own preferred sports" ON public.user_sports FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can insert own preferred sports" ON public.user_sports;
    CREATE POLICY "Users can insert own preferred sports" ON public.user_sports FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can delete own preferred sports" ON public.user_sports;
    CREATE POLICY "Users can delete own preferred sports" ON public.user_sports FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- 4. Assessments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments') THEN
    ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can view active assessments" ON public.assessments;
    CREATE POLICY "Anyone can view active assessments" ON public.assessments FOR SELECT USING (is_active = true);
  END IF;

  -- 5. Assessment Runs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessment_runs') THEN
    ALTER TABLE public.assessment_runs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own assessment runs" ON public.assessment_runs;
    CREATE POLICY "Users can view own assessment runs" ON public.assessment_runs FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can insert own assessment runs" ON public.assessment_runs;
    CREATE POLICY "Users can insert own assessment runs" ON public.assessment_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own assessment runs" ON public.assessment_runs;
    CREATE POLICY "Users can update own assessment runs" ON public.assessment_runs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can delete own assessment runs" ON public.assessment_runs;
    CREATE POLICY "Users can delete own assessment runs" ON public.assessment_runs FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- 6. Assessment Attempts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessment_attempts') THEN
    ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view attempts for own runs" ON public.assessment_attempts;
    CREATE POLICY "Users can view attempts for own runs" ON public.assessment_attempts FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.assessment_runs
        WHERE public.assessment_runs.id = public.assessment_attempts.run_id
        AND public.assessment_runs.user_id = auth.uid()
      )
    );
    DROP POLICY IF EXISTS "Users can insert attempts for own runs" ON public.assessment_attempts;
    CREATE POLICY "Users can insert attempts for own runs" ON public.assessment_attempts FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.assessment_runs
        WHERE public.assessment_runs.id = public.assessment_attempts.run_id
        AND public.assessment_runs.user_id = auth.uid()
      )
    );
  END IF;

  -- 7. Assessment Results
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessment_results') THEN
    ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view results for own runs" ON public.assessment_results;
    CREATE POLICY "Users can view results for own runs" ON public.assessment_results FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.assessment_runs
        WHERE public.assessment_runs.id = public.assessment_results.run_id
        AND public.assessment_runs.user_id = auth.uid()
      )
    );
  END IF;

  -- 8. Talent Reports
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'talent_reports') THEN
    ALTER TABLE public.talent_reports ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own talent report" ON public.talent_reports;
    CREATE POLICY "Users can view own talent report" ON public.talent_reports FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can insert own talent report" ON public.talent_reports;
    CREATE POLICY "Users can insert own talent report" ON public.talent_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can update own talent report" ON public.talent_reports;
    CREATE POLICY "Users can update own talent report" ON public.talent_reports FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users can delete own talent report" ON public.talent_reports;
    CREATE POLICY "Users can delete own talent report" ON public.talent_reports FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ====================================================================
-- STORAGE: assessment-videos Bucket & Security
-- ====================================================================
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
    RAISE NOTICE 'Storage setup notice (non-fatal): %', SQLERRM;
END $$;
