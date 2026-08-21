import type {
  AssessmentDefinition,
  AssessmentResults,
  AssessmentRun,
  AthleteProfile,
  AthleticMetric,
} from "@/lib/types";

export const ASSESSMENTS: AssessmentDefinition[] = [
  {
    id: "vertical-jump",
    slug: "vertical-jump",
    name: "Vertical Jump",
    description: "Measure explosive lower-body power and vertical jump performance.",
    status: "available",
    durationMinutes: 5,
    attempts: 3,
    difficulty: "Beginner",
    objective:
      "Record three maximal countermovement jumps so flight time and jump height can be estimated from the video.",
    metricLabel: "Jump height",
  },
  {
    id: "squat",
    slug: "squat",
    name: "Squat",
    description: "Assess lower-body movement, stability, depth, and consistency.",
    status: "coming-soon",
    durationMinutes: 6,
    attempts: 5,
    difficulty: "Beginner",
    objective: "Assess squat depth, tempo and joint alignment across repetitions.",
    metricLabel: "Depth score",
  },
  {
    id: "single-leg-balance",
    slug: "single-leg-balance",
    name: "Single-Leg Balance",
    description: "Assess balance, stability, and postural control.",
    status: "coming-soon",
    durationMinutes: 4,
    attempts: 2,
    difficulty: "Beginner",
    objective: "Quantify postural sway while standing on one leg.",
    metricLabel: "Stability index",
  },
  {
    id: "push-up",
    slug: "push-up",
    name: "Push-Up",
    description: "Assess upper-body strength and movement consistency.",
    status: "coming-soon",
    durationMinutes: 5,
    attempts: 1,
    difficulty: "Intermediate",
    objective: "Count valid repetitions and track range-of-motion consistency.",
    metricLabel: "Valid reps",
  },
  {
    id: "side-to-side-agility",
    slug: "side-to-side-agility",
    name: "Side-to-Side Agility",
    description: "Assess controlled lateral movement, coordination, and agility.",
    status: "coming-soon",
    durationMinutes: 6,
    attempts: 3,
    difficulty: "Intermediate",
    objective: "Measure lateral change-of-direction speed and control.",
    metricLabel: "Contacts / 20s",
  },
];

export const DEFAULT_PROFILE: AthleteProfile = {
  name: "Marcus",
  age: 21,
  gender: "prefer-not-to-say",
  heightCm: 181,
  fitnessLevel: "recreational",
  preferredSports: ["Basketball", "Athletics"],
};

export const ATHLETIC_METRICS: AthleticMetric[] = [
  { key: "explosive-power", label: "Explosive Power", value: 88, unit: "/100" },
  { key: "agility", label: "Agility", value: 72, unit: "/100" },
  { key: "balance", label: "Balance", value: 91, unit: "/100" },
  { key: "strength", label: "Strength", value: 66, unit: "/100" },
  { key: "coordination", label: "Coordination", value: 79, unit: "/100" },
];

export const ASSESSMENT_HISTORY: AssessmentRun[] = [
  {
    id: "run-1042",
    assessmentId: "vertical-jump",
    assessmentName: "Vertical Jump",
    date: "2026-08-18",
    status: "completed",
    result: "48 cm",
  },
  {
    id: "run-1038",
    assessmentId: "vertical-jump",
    assessmentName: "Vertical Jump",
    date: "2026-07-29",
    status: "completed",
    result: "46 cm",
  },
  {
    id: "run-1031",
    assessmentId: "single-leg-balance",
    assessmentName: "Baseline Screening",
    date: "2026-07-14",
    status: "completed",
    result: "Baseline set",
  },
];

export const SAMPLE_RESULTS: AssessmentResults = {
  id: "run-1042",
  assessmentId: "vertical-jump",
  assessmentName: "Vertical Jump",
  date: "2026-08-18",
  headline: { value: 48, unit: "cm", label: "Best jump height" },
  attempts: [
    { label: "Attempt 1", value: 46, unit: "cm" },
    { label: "Attempt 2", value: 49, unit: "cm" },
    { label: "Attempt 3", value: 49, unit: "cm" },
  ],
  average: { value: 48, unit: "cm" },
  metrics: [
    { key: "explosive-power", label: "Explosive Power", value: 88, unit: "/100" },
    { key: "movement-stability", label: "Movement Stability", value: 84, unit: "/100" },
    { key: "jump-consistency", label: "Jump Consistency", value: 91, unit: "/100" },
  ],
  suitability: [
    { sport: "Basketball", score: 92 },
    { sport: "Volleyball", score: 87 },
    { sport: "Football", score: 76 },
    { sport: "Athletics", score: 69 },
  ],
  explanation:
    "Your assessment indicates strong explosive power and consistent take-off mechanics, which are important characteristics for basketball and volleyball. Landing stability was steady across all three attempts, suggesting good control of ground contact.",
  isSample: true,
};

export const DISCLAIMER =
  "Sport suitability results are recommendations based on assessed performance characteristics and should not be treated as professional medical or sports-selection advice.";
