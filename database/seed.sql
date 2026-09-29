-- ====================================================================
-- SPORTSENSE AI — SEED DATA
-- Pre-populates default sports and standardized assessment definitions
-- ====================================================================

-- 1. Seed Sports Catalog (6 Core Supported Sports)
INSERT INTO public.sports (name, slug, description, image_url, is_active)
VALUES
  (
    'Basketball',
    'basketball',
    'High requirement for vertical jump power, rapid change of direction, and multi-directional court agility.',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80',
    TRUE
  ),
  (
    'Volleyball',
    'volleyball',
    'Demands explosive vertical takeoff mechanics, reactive stretch-shortening cycle (SSC), and airborne hang-time.',
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1600&q=80',
    TRUE
  ),
  (
    'Football',
    'football',
    'Relies on sprint acceleration, lower-body power, rapid deceleration, and high dynamic symmetry.',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=80',
    TRUE
  ),
  (
    'Cricket',
    'cricket',
    'Focuses on sprint bursts, upper-lower body kinematic chain coordination, and explosive release power.',
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80',
    TRUE
  ),
  (
    'Tennis',
    'tennis',
    'Tests rotational torque transfer, fast eccentric deceleration, and reactive court transition speed.',
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1600&q=80',
    TRUE
  ),
  (
    'Badminton',
    'badminton',
    'Prioritizes rapid takeoff reflexes, short-court sprint agility, and instant reaction coordination.',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=80',
    TRUE
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

-- 2. Seed Standardized Assessment Catalog
INSERT INTO public.assessments (name, slug, description, is_active)
VALUES
  (
    'Vertical Jump',
    'vertical-jump',
    'Measures explosive lower-body power, takeoff velocity, and peak flight time using stationary camera pose kinematics.',
    TRUE
  ),
  (
    'Squat',
    'squat',
    'Assesses lower-body bilateral mobility, joint alignment, countermovement depth, and eccentric stability.',
    TRUE
  ),
  (
    'Single-Leg Balance',
    'single-leg-balance',
    'Quantifies postural sway control, ankle-hip proprioception, and left/right stability symmetry.',
    TRUE
  ),
  (
    'Push-Up',
    'push-up',
    'Measures upper-body concentric strength, trunk stiffness, and muscular fatigue endurance.',
    TRUE
  ),
  (
    'Side-to-Side Agility',
    'side-to-side-agility',
    'Measures lateral change-of-direction quickness, line-touch velocity, and deceleration stability.',
    TRUE
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
