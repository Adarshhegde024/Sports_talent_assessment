-- ====================================================================
-- SPORTSENSE AI — ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures complete isolation: Athletes can only read/modify their own records.
-- ====================================================================

-- 1. Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- TABLE: profiles policies
-- ====================================================================
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ====================================================================
-- TABLE: sports policies (Public read-only)
-- ====================================================================
CREATE POLICY "Active sports are viewable by all authenticated users"
  ON public.sports FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ====================================================================
-- TABLE: user_sports policies
-- ====================================================================
CREATE POLICY "Users can view own selected sports"
  ON public.user_sports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sports preferences"
  ON public.user_sports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- TABLE: assessments catalog policies (Public read-only)
-- ====================================================================
CREATE POLICY "Assessments are viewable by all authenticated users"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ====================================================================
-- TABLE: assessment_runs policies
-- ====================================================================
CREATE POLICY "Users can view own assessment runs"
  ON public.assessment_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessment runs"
  ON public.assessment_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessment runs"
  ON public.assessment_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- TABLE: assessment_attempts policies
-- ====================================================================
CREATE POLICY "Users can view own assessment attempts"
  ON public.assessment_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_runs
      WHERE id = assessment_attempts.run_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own assessment attempts"
  ON public.assessment_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_runs
      WHERE id = assessment_attempts.run_id AND user_id = auth.uid()
    )
  );

-- ====================================================================
-- TABLE: assessment_results policies
-- ====================================================================
CREATE POLICY "Users can view own assessment results"
  ON public.assessment_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_runs
      WHERE id = assessment_results.run_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own assessment results"
  ON public.assessment_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_runs
      WHERE id = assessment_results.run_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own assessment results"
  ON public.assessment_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_runs
      WHERE id = assessment_results.run_id AND user_id = auth.uid()
    )
  );

-- ====================================================================
-- STORAGE BUCKET: assessment-videos
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('assessment-videos', 'assessment-videos', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own assessment videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assessment-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own assessment videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'assessment-videos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
