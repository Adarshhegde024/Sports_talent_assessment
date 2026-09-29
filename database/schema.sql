-- ====================================================================
-- SPORTSENSE AI — DATABASE DDL SCHEMA DEFINITION
-- PostgreSQL / Supabase
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- TABLE: profiles
-- Stores athlete demographics, anthropometric measurements, and preferences
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age INTEGER CHECK (age >= 0 AND age <= 120),
  height INTEGER CHECK (height >= 50 AND height <= 260), -- Height in cm
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'recreational', 'trained', 'competitive')) DEFAULT 'recreational',
  disclaimer_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- TABLE: sports
-- Master list of supported sports
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
-- TABLE: user_sports
-- Junction table mapping athlete's preferred/primary sports
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sport_id)
);

-- ====================================================================
-- TABLE: assessments
-- Master catalog of standardized athletic movement assessments
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
-- Tracks each test session executed by an athlete
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
-- Tracks each recorded video attempt within an assessment run
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
-- Biomechanical measurements, 5-trait scores, ML sport suitability, and AI coach report
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL UNIQUE REFERENCES public.assessment_runs(id) ON DELETE CASCADE,
  jump_height NUMERIC(5, 2),
  performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  sport_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_updated ON public.profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_sports_user ON public.user_sports(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_runs_user ON public.assessment_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_runs_status ON public.assessment_runs(status);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_run ON public.assessment_attempts(run_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_run ON public.assessment_results(run_id);
