import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AthleteProfile, RecordedAttempt } from "@/lib/types";
import { DEFAULT_PROFILE } from "@/data/mock";

const PROFILE_KEY = "sportsense.profile";

interface SessionValue {
  profile: AthleteProfile;
  isOnboarded: boolean;
  saveProfile: (profile: AthleteProfile) => void;
  attempts: RecordedAttempt[];
  addAttempt: (attempt: RecordedAttempt) => void;
  removeAttempt: (index: number) => void;
  resetAttempts: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

function readStoredProfile(): { profile: AthleteProfile; onboarded: boolean } {
  if (typeof window === "undefined") return { profile: DEFAULT_PROFILE, onboarded: false };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { profile: DEFAULT_PROFILE, onboarded: false };
    return { profile: JSON.parse(raw) as AthleteProfile, onboarded: true };
  } catch {
    return { profile: DEFAULT_PROFILE, onboarded: false };
  }
}

export function AssessmentSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => readStoredProfile());
  const [attempts, setAttempts] = useState<RecordedAttempt[]>([]);

  const saveProfile = useCallback((profile: AthleteProfile) => {
    setState({ profile, onboarded: true });
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }, []);

  const addAttempt = useCallback((attempt: RecordedAttempt) => {
    setAttempts((current) => [...current.filter((a) => a.index !== attempt.index), attempt]);
  }, []);

  const removeAttempt = useCallback((index: number) => {
    setAttempts((current) => current.filter((a) => a.index !== index));
  }, []);

  const resetAttempts = useCallback(() => setAttempts([]), []);

  const value = useMemo<SessionValue>(
    () => ({
      profile: state.profile,
      isOnboarded: state.onboarded,
      saveProfile,
      attempts,
      addAttempt,
      removeAttempt,
      resetAttempts,
    }),
    [state, attempts, saveProfile, addAttempt, removeAttempt, resetAttempts],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAssessmentSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useAssessmentSession must be used inside AssessmentSessionProvider");
  }
  return context;
}
