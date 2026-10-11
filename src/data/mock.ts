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
    protocol: [
      "Warm up for two minutes with light mobility work.",
      "Stand still inside the frame until the countdown ends.",
      "Perform a maximal countermovement jump, landing on both feet.",
      "Reset and repeat until all attempts are recorded.",
    ],
    setup: [
      { title: "Phone placement", body: "Stand the phone vertically at hip height, 3 m away." },
      { title: "Clear space", body: "Full body must stay inside the frame at the top of the jump." },
      { title: "Lighting", body: "Even, front-facing light. Avoid backlit windows." },
    ],
  },
  {
    id: "squat",
    slug: "squat",
    name: "Squat",
    description: "Assess lower-body movement, stability, depth, and consistency.",
    status: "available",
    durationMinutes: 6,
    attempts: 5,
    difficulty: "Beginner",
    objective: "Assess squat depth, tempo and joint alignment across repetitions.",
    metricLabel: "Depth score",
    protocol: [
      "Stand side-on to the camera with feet shoulder-width apart.",
      "Lower under control until thighs are at least parallel to the floor.",
      "Drive back up keeping heels flat and knees tracking over toes.",
      "Complete five controlled repetitions without pausing between reps.",
    ],
    setup: [
      { title: "Camera angle", body: "Film from the side at hip height, 2.5 m away." },
      { title: "Clear space", body: "Leave one metre of free floor around you." },
      { title: "Clothing", body: "Fitted clothing helps joint positions stay visible." },
    ],
  },
  {
    id: "single-leg-balance",
    slug: "single-leg-balance",
    name: "Single-Leg Balance",
    description: "Assess balance, stability, and postural control.",
    status: "available",
    durationMinutes: 4,
    attempts: 2,
    difficulty: "Beginner",
    objective: "Quantify postural sway while standing on one leg.",
    metricLabel: "Stability index",
    protocol: [
      "Stand facing the camera with hands on hips.",
      "Lift one foot to mid-calf height and hold for 30 seconds.",
      "Keep your eyes fixed on a point straight ahead.",
      "Repeat the hold on the opposite leg for the second attempt.",
    ],
    setup: [
      { title: "Phone placement", body: "Front-on at hip height, 2.5 m away." },
      { title: "Stable floor", body: "Use a firm, non-slip surface — no rugs or mats." },
      { title: "Safety", body: "Stay within arm's reach of a wall in case you wobble." },
    ],
  },
  {
    id: "push-up",
    slug: "push-up",
    name: "Push-Up",
    description: "Assess upper-body strength and movement consistency.",
    status: "available",
    durationMinutes: 5,
    attempts: 1,
    difficulty: "Intermediate",
    objective: "Count valid repetitions and track range-of-motion consistency.",
    metricLabel: "Valid reps",
    protocol: [
      "Set up side-on to the camera in a high plank position.",
      "Lower until your chest is roughly a fist above the floor.",
      "Press back to full elbow extension, keeping hips in line.",
      "Perform as many valid repetitions as you can in 60 seconds.",
    ],
    setup: [
      { title: "Camera angle", body: "Side-on, phone flat on the floor propped upright." },
      { title: "Clear space", body: "Your whole body from head to feet must stay in frame." },
      { title: "Surface", body: "Use a firm floor; a thin mat is fine." },
    ],
  },
  {
    id: "side-to-side-agility",
    slug: "side-to-side-agility",
    name: "Side-to-Side Agility",
    description: "Assess controlled lateral movement, coordination, and agility.",
    status: "available",
    durationMinutes: 6,
    attempts: 3,
    difficulty: "Intermediate",
    objective: "Measure lateral change-of-direction speed and control.",
    metricLabel: "Contacts / 20s",
    protocol: [
      "Mark two lines three metres apart, both visible in frame.",
      "Start in an athletic stance at the centre.",
      "Shuffle sideways to touch each line alternately for 20 seconds.",
      "Stay low and face the camera throughout — no crossing the feet.",
    ],
    setup: [
      { title: "Phone placement", body: "Front-on at hip height, 4 m back to capture both lines." },
      { title: "Markers", body: "Use tape, bottles or shoes as line markers." },
      { title: "Footwear", body: "Wear grippy trainers — avoid smooth or wet floors." },
    ],
  },
];

export const DEFAULT_PROFILE: AthleteProfile = {
  name: "",
  age: undefined,
  gender: undefined,
  heightCm: undefined,
  fitnessLevel: undefined,
  preferredSports: [],
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

/** Mock result sets per assessment, keyed by assessment id. */
export const RESULTS_BY_ASSESSMENT: Record<string, AssessmentResults> = {
  "vertical-jump": SAMPLE_RESULTS,
  squat: {
    id: "run-2001",
    assessmentId: "squat",
    assessmentName: "Squat",
    date: "2026-08-20",
    headline: { value: 82, unit: "/100", label: "Depth score" },
    attempts: [
      { label: "Rep 1", value: 78, unit: "/100" },
      { label: "Rep 2", value: 84, unit: "/100" },
      { label: "Rep 3", value: 85, unit: "/100" },
    ],
    average: { value: 82, unit: "/100" },
    metrics: [
      { key: "depth", label: "Squat Depth", value: 82, unit: "/100" },
      { key: "knee-tracking", label: "Knee Alignment", value: 74, unit: "/100" },
      { key: "tempo", label: "Tempo Consistency", value: 88, unit: "/100" },
    ],
    suitability: [
      { sport: "Weightlifting", score: 88 },
      { sport: "Rugby", score: 81 },
      { sport: "Rowing", score: 77 },
      { sport: "Football", score: 70 },
    ],
    explanation:
      "Depth and tempo were consistent across repetitions, indicating good lower-body control. Knee alignment drifted slightly inward on the final reps, which is common as fatigue builds.",
    isSample: true,
  },
  "single-leg-balance": {
    id: "run-2002",
    assessmentId: "single-leg-balance",
    assessmentName: "Single-Leg Balance",
    date: "2026-08-20",
    headline: { value: 91, unit: "/100", label: "Stability index" },
    attempts: [
      { label: "Left leg", value: 89, unit: "/100" },
      { label: "Right leg", value: 93, unit: "/100" },
    ],
    average: { value: 91, unit: "/100" },
    metrics: [
      { key: "balance", label: "Postural Control", value: 91, unit: "/100" },
      { key: "symmetry", label: "Left/Right Symmetry", value: 86, unit: "/100" },
      { key: "sway", label: "Sway Control", value: 83, unit: "/100" },
    ],
    suitability: [
      { sport: "Gymnastics", score: 90 },
      { sport: "Martial Arts", score: 84 },
      { sport: "Skiing", score: 79 },
      { sport: "Tennis", score: 72 },
    ],
    explanation:
      "Postural control was strong on both legs with only a small left-to-right difference, suggesting a balanced base for sports that demand single-leg stability.",
    isSample: true,
  },
  "push-up": {
    id: "run-2003",
    assessmentId: "push-up",
    assessmentName: "Push-Up",
    date: "2026-08-20",
    headline: { value: 34, unit: "reps", label: "Valid repetitions" },
    attempts: [{ label: "Set 1", value: 34, unit: "reps" }],
    average: { value: 34, unit: "reps" },
    metrics: [
      { key: "strength", label: "Upper-Body Strength", value: 79, unit: "/100" },
      { key: "rom", label: "Range of Motion", value: 85, unit: "/100" },
      { key: "endurance", label: "Muscular Endurance", value: 73, unit: "/100" },
    ],
    suitability: [
      { sport: "Swimming", score: 85 },
      { sport: "Rugby", score: 80 },
      { sport: "Climbing", score: 76 },
      { sport: "Boxing", score: 71 },
    ],
    explanation:
      "Range of motion held up well through most of the set, with rep speed slowing in the final ten seconds — a normal endurance-limited pattern.",
    isSample: true,
  },
  "side-to-side-agility": {
    id: "run-2004",
    assessmentId: "side-to-side-agility",
    assessmentName: "Side-to-Side Agility",
    date: "2026-08-20",
    headline: { value: 27, unit: "contacts", label: "Line contacts in 20 s" },
    attempts: [
      { label: "Attempt 1", value: 25, unit: "contacts" },
      { label: "Attempt 2", value: 27, unit: "contacts" },
      { label: "Attempt 3", value: 26, unit: "contacts" },
    ],
    average: { value: 26, unit: "contacts" },
    metrics: [
      { key: "agility", label: "Lateral Speed", value: 84, unit: "/100" },
      { key: "coordination", label: "Coordination", value: 80, unit: "/100" },
      { key: "deceleration", label: "Deceleration Control", value: 75, unit: "/100" },
    ],
    suitability: [
      { sport: "Badminton", score: 89 },
      { sport: "Basketball", score: 83 },
      { sport: "Tennis", score: 81 },
      { sport: "Handball", score: 74 },
    ],
    explanation:
      "Change-of-direction speed stayed stable across attempts. Deceleration into each turn is the main area with room to improve.",
    isSample: true,
  },
};
