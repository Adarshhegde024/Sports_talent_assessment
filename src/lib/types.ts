export type AssessmentStatus = "available" | "coming-soon";
export type AssessmentRunStatus = "completed" | "processing" | "draft" | "failed";
export type FitnessLevel = "beginner" | "recreational" | "trained" | "competitive";

export interface AthleteProfile {
  name: string;
  age?: number | undefined;
  gender?: "female" | "male" | "other" | "prefer-not-to-say" | undefined;
  heightCm?: number | undefined;
  fitnessLevel?: FitnessLevel | undefined;
  preferredSports?: string[] | undefined;
}

export interface AssessmentDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: AssessmentStatus;
  durationMinutes: number;
  attempts: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  objective: string;
  metricLabel: string;
  /** Ordered protocol steps shown on the instructions screen. */
  protocol: string[];
  /** Assessment-specific setup guidance (phone placement, space, lighting). */
  setup: { title: string; body: string }[];
}

export type Assessment = AssessmentDefinition;

export interface AssessmentRun {
  id: string;
  assessmentId: string;
  assessmentName: string;
  date: string;
  status: AssessmentRunStatus;
  result: string | null;
}

export interface AthleticMetric {
  key: string;
  label: string;
  value: number;
  unit: string;
}

export interface SportSuitability {
  sport: string;
  score: number;
}

export interface AssessmentResults {
  id: string;
  assessmentId: string;
  assessmentName: string;
  date: string;
  headline: { value: number; unit: string; label: string };
  attempts: { label: string; value: number; unit: string }[];
  average: { value: number; unit: string };
  metrics: AthleticMetric[];
  suitability: SportSuitability[];
  explanation: string;
  isSample: boolean;
}

export interface RecordedAttempt {
  index: number;
  /** Object URL of the locally captured clip; never uploaded in this build. */
  previewUrl: string | null;
  durationSeconds: number;
  recordedAt: string;
  /** The raw file, kept in memory so a future backend can upload it. */
  blob?: Blob;
}
