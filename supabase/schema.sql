-- ====================================================================
-- SPORTSENSE AI — SUPABASE DATABASE INITIALIZATION SCHEMA & RLS
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- TABLE: profiles
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

-- ====================================================================
-- TABLE: sports
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
-- TABLE: user_sports (User preferred sports)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sport_id)
);

-- ====================================================================
-- TABLE: assessments (Supported Assessment Protocols)
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
-- TABLE: assessment_runs
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
-- TABLE: assessment_attempts
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
-- TABLE: assessment_results
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
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_user_sports_user ON public.user_sports(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_runs_user ON public.assessment_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_run ON public.assessment_attempts(run_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_run ON public.assessment_results(run_id);

-- ====================================================================
-- SEED INITIAL SPORTS & ASSESSMENTS
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
  ('Vertical Jump', 'vertical-jump', 'Measures explosive lower-body power and peak flight time using smartphone video pose estimation.', true)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- 2. Profiles policies (Users own their profile)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Sports policies (Public read-only for active sports)
CREATE POLICY "Anyone can view active sports"
  ON public.sports FOR SELECT
  USING (is_active = true);

-- 4. User Sports policies (Users manage their own preferred sports)
CREATE POLICY "Users can view own preferred sports"
  ON public.user_sports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferred sports"
  ON public.user_sports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferred sports"
  ON public.user_sports FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Assessments policies (Public read-only for active assessments)
CREATE POLICY "Anyone can view active assessments"
  ON public.assessments FOR SELECT
  USING (is_active = true);

-- 6. Assessment Runs policies (Users manage own runs)
CREATE POLICY "Users can view own assessment runs"
  ON public.assessment_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment runs"
  ON public.assessment_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessment runs"
  ON public.assessment_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Assessment Attempts policies (Enforce ownership through assessment_runs)
CREATE POLICY "Users can view attempts for own runs"
  ON public.assessment_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_runs
      WHERE public.assessment_runs.id = public.assessment_attempts.run_id
      AND public.assessment_runs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attempts for own runs"
  ON public.assessment_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_runs
      WHERE public.assessment_runs.id = public.assessment_attempts.run_id
      AND public.assessment_runs.user_id = auth.uid()
    )
  );

-- 8. Assessment Results policies (Enforce ownership through assessment_runs)
CREATE POLICY "Users can view results for own runs"
  ON public.assessment_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_runs
      WHERE public.assessment_runs.id = public.assessment_results.run_id
      AND public.assessment_runs.user_id = auth.uid()
    )
  );

-- ====================================================================
-- STORAGE: assessment-videos Bucket & Security
-- ====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-videos',
  'assessment-videos',
  false,
  52428800, -- 50 MB limit
  ARRAY['video/webm', 'video/mp4', 'video/quicktime']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload video to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assessment-videos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view video in own folder"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assessment-videos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
