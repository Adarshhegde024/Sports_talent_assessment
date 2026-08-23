/**
 * API service layer.
 *
 * Every backend-dependent operation in the UI goes through this module.
 * Today each function resolves mock data; when the Python/FastAPI backend is
 * ready, swap the bodies for `request()` calls — the signatures already match
 * the planned REST contract:
 *
 *   POST /api/assessments
 *   POST /api/assessments/{id}/video
 *   GET  /api/assessments/{id}
 *   GET  /api/assessments/{id}/results
 *   GET  /api/profile
 *   GET  /api/assessment-history
 */
import {
  ASSESSMENTS,
  ASSESSMENT_HISTORY,
  ATHLETIC_METRICS,
  DEFAULT_PROFILE,
  RESULTS_BY_ASSESSMENT,
  SAMPLE_RESULTS,
} from "@/data/mock";
import type {
  AssessmentDefinition,
  AssessmentResults,
  AssessmentRun,
  AthleteProfile,
  AthleticMetric,
  RecordedAttempt,
} from "@/lib/types";

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Real transport, kept ready for the future backend. Unused while mocked. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed`, response.status);
  }
  return (await response.json()) as T;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET /api/assessments */
export async function listAssessments(): Promise<AssessmentDefinition[]> {
  await delay(200);
  return ASSESSMENTS;
}

export async function getAssessment(slug: string): Promise<AssessmentDefinition> {
  await delay(120);
  const found = ASSESSMENTS.find((assessment) => assessment.slug === slug);
  if (!found) throw new ApiError(`Unknown assessment: ${slug}`, 404);
  return found;
}

/** GET /api/profile */
export async function getProfile(): Promise<AthleteProfile> {
  await delay(200);
  return DEFAULT_PROFILE;
}

export async function getAthleticMetrics(): Promise<AthleticMetric[]> {
  await delay(220);
  return ATHLETIC_METRICS;
}

/** GET /api/assessment-history */
export async function getAssessmentHistory(): Promise<AssessmentRun[]> {
  await delay(260);
  return ASSESSMENT_HISTORY;
}

/** POST /api/assessments */
export async function createAssessment(assessmentId: string): Promise<{ id: string }> {
  await delay(300);
  return { id: `local-${assessmentId}-${Date.now()}` };
}

/**
 * POST /api/assessments/{id}/video
 *
 * Attempts are captured with MediaRecorder and held locally. This builds the
 * multipart payload the backend will expect, but does not send it yet.
 */
export async function uploadAttempts(
  assessmentRunId: string,
  attempts: RecordedAttempt[],
  onProgress?: (percent: number) => void,
): Promise<{ id: string; status: "queued" }> {
  const form = new FormData();
  form.set("assessmentId", assessmentRunId);
  attempts.forEach((attempt) => {
    if (attempt.blob) {
      form.append("videos", attempt.blob, `attempt-${attempt.index}.webm`);
    }
  });

  for (let percent = 10; percent <= 100; percent += 15) {
    await delay(280);
    onProgress?.(Math.min(percent, 100));
  }
  return { id: assessmentRunId, status: "queued" };
}

/** GET /api/assessments/{id}/results */
export async function getResults(runId: string): Promise<AssessmentResults> {
  await delay(400);
  // Local run ids look like `local-<assessmentId>-<timestamp>`; history runs are
  // resolved through their recorded assessment id.
  const fromHistory = ASSESSMENT_HISTORY.find((run) => run.id === runId)?.assessmentId;
  const matched = Object.keys(RESULTS_BY_ASSESSMENT).find(
    (assessmentId) => assessmentId === fromHistory || runId.includes(assessmentId),
  );
  const base = (matched && RESULTS_BY_ASSESSMENT[matched]) || SAMPLE_RESULTS;
  return { ...base, id: runId };
}
