import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AthleteProfile, RecordedAttempt } from "@/lib/types";
import type { AnthropometricVector, FacialBiometricVector } from "@/lib/vision/athlete-biometrics";
import { DEFAULT_PROFILE } from "@/data/mock";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";

const PROFILE_KEY = "sportsense.profile";
const BIOMETRICS_KEY = "sportsense.athlete_biometrics";
const FACE_PROFILE_KEY = "sportsense.athlete_face_profile";

export interface AthleteFaceProfile {
  vector: FacialBiometricVector;
  photoDataUrl?: string;
  athleteName: string;
  sourceAssessmentSlug: string;
  enrolledAt: string;
  isLocked: boolean;
}

export function calculateProfileCompleteness(profile: AthleteProfile | null): number {
  if (!profile) return 0;
  let score = 0;
  // 1. Full name (25%) - must have non-empty non-placeholder name
  const name = profile.name?.trim();
  if (name && name.length > 0 && name.toLowerCase() !== "athlete" && name.toLowerCase() !== "marcus") {
    score += 25;
  }
  // 2. Age (25%) - must be valid age entered by user
  if (profile.age && typeof profile.age === "number" && profile.age >= 8 && profile.age <= 100) {
    score += 25;
  }
  // 3. Height (25%) - must be valid height in cm
  if (profile.heightCm && typeof profile.heightCm === "number" && profile.heightCm >= 80 && profile.heightCm <= 260) {
    score += 25;
  }
  // 4. Fitness Level & Preferred Sports (25%)
  const hasFitness = Boolean(
    profile.fitnessLevel &&
      ["beginner", "recreational", "trained", "competitive"].includes(profile.fitnessLevel),
  );
  const hasSports = Boolean(Array.isArray(profile.preferredSports) && profile.preferredSports.length > 0);
  if (hasFitness || hasSports) {
    score += 25;
  }
  return Math.min(100, Math.max(0, score));
}

interface SessionValue {
  profile: AthleteProfile;
  isOnboarded: boolean;
  isLoading: boolean;
  saveProfile: (profile: AthleteProfile) => Promise<void>;
  attempts: RecordedAttempt[];
  addAttempt: (attempt: RecordedAttempt) => void;
  removeAttempt: (index: number) => void;
  resetAttempts: () => void;
  biometricBaseline: AnthropometricVector | null;
  lockBiometricBaseline: (vector: AnthropometricVector) => void;
  clearBiometricBaseline: () => void;
  faceProfile: AthleteFaceProfile | null;
  registerFaceCandidate: (vector: FacialBiometricVector, photoDataUrl?: string, sourceSlug?: string) => void;
  lockFaceProfile: (sourceSlug: string) => void;
  clearFaceProfile: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

function readStoredProfile(): { profile: AthleteProfile; onboarded: boolean } {
  if (typeof window === "undefined") return { profile: DEFAULT_PROFILE, onboarded: false };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { profile: DEFAULT_PROFILE, onboarded: false };
    const parsed = JSON.parse(raw) as AthleteProfile;
    // Discard legacy mock data
    if (parsed.name === "Marcus") {
      return { profile: DEFAULT_PROFILE, onboarded: false };
    }
    const score = calculateProfileCompleteness(parsed);
    return { profile: parsed, onboarded: score >= 100 };
  } catch {
    return { profile: DEFAULT_PROFILE, onboarded: false };
  }
}

function readStoredBiometrics(): AnthropometricVector | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BIOMETRICS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AnthropometricVector;
  } catch {
    return null;
  }
}

function readStoredFaceProfile(): AthleteFaceProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FACE_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AthleteFaceProfile;
  } catch {
    return null;
  }
}

export function AssessmentSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState(() => readStoredProfile());
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState<RecordedAttempt[]>([]);
  const [biometricBaseline, setBiometricBaseline] = useState<AnthropometricVector | null>(() => readStoredBiometrics());
  const [faceProfile, setFaceProfile] = useState<AthleteFaceProfile | null>(() => readStoredFaceProfile());

  const lockBiometricBaseline = useCallback((vector: AnthropometricVector) => {
    setBiometricBaseline(vector);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(BIOMETRICS_KEY, JSON.stringify(vector));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const clearBiometricBaseline = useCallback(() => {
    setBiometricBaseline(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(BIOMETRICS_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const registerFaceCandidate = useCallback((vector: FacialBiometricVector, photoDataUrl?: string, sourceSlug?: string) => {
    setFaceProfile((prev) => {
      // If already locked from completed assessment 1, do not overwrite with candidate
      if (prev?.isLocked) return prev;
      const updated: AthleteFaceProfile = {
        vector,
        photoDataUrl: photoDataUrl || prev?.photoDataUrl,
        athleteName: prev?.athleteName || vector.athleteName || state.profile.name || "Athlete",
        sourceAssessmentSlug: sourceSlug || prev?.sourceAssessmentSlug || "assessment",
        enrolledAt: prev?.enrolledAt || new Date().toISOString(),
        isLocked: false,
      };
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(FACE_PROFILE_KEY, JSON.stringify(updated));
        } catch {
          /* ignore */
        }
      }

      // Automatically sync enrolled photo to athlete profile avatar
      const finalPhoto = photoDataUrl || prev?.photoDataUrl;
      if (finalPhoto) {
        setState((curr) => {
          if (curr.profile.avatarUrl === finalPhoto) return curr;
          const updatedProfile: AthleteProfile = {
            ...curr.profile,
            avatarUrl: finalPhoto,
          };
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
            } catch {
              /* ignore */
            }
          }
          return { ...curr, profile: updatedProfile };
        });
      }

      return updated;
    });
  }, [state.profile.name]);

  const lockFaceProfile = useCallback((sourceSlug: string) => {
    setFaceProfile((prev) => {
      // Guard: strictly do NOT lock if no face vector or snapshot was enrolled
      if (!prev || !prev.vector || !prev.photoDataUrl) return null;
      const locked: AthleteFaceProfile = {
        ...prev,
        sourceAssessmentSlug: sourceSlug,
        isLocked: true,
      };
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(FACE_PROFILE_KEY, JSON.stringify(locked));
        } catch {
          /* ignore */
        }
      }

      // Sync avatarUrl to athlete profile
      if (locked.photoDataUrl) {
        setState((curr) => {
          if (curr.profile.avatarUrl === locked.photoDataUrl) return curr;
          const updatedProfile: AthleteProfile = {
            ...curr.profile,
            avatarUrl: locked.photoDataUrl,
          };
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
            } catch {
              /* ignore */
            }
          }
          return { ...curr, profile: updatedProfile };
        });
      }

      return locked;
    });
  }, []);

  const clearFaceProfile = useCallback(() => {
    setFaceProfile(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(FACE_PROFILE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Synchronize profile with Supabase and authenticated user in real time
  useEffect(() => {
    let isMounted = true;

    if (!user) {
      // User is logged out
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(PROFILE_KEY);
          window.localStorage.removeItem(BIOMETRICS_KEY);
          window.localStorage.removeItem(FACE_PROFILE_KEY);
        } catch {
          /* ignore */
        }
      }
      setState({ profile: DEFAULT_PROFILE, onboarded: false });
      setBiometricBaseline(null);
      setFaceProfile(null);
      return;
    }

    const initialName =
      (user.user_metadata?.["full_name"] as string) ||
      (user.user_metadata?.["name"] as string) ||
      user.email?.split("@")[0] ||
      "";

    // Set immediate reactive name from auth metadata
    setState((prev) => ({
      profile: {
        ...prev.profile,
        name: prev.profile.name && prev.profile.name !== "Athlete" && prev.profile.name !== "Marcus" ? prev.profile.name : initialName,
      },
      onboarded: prev.onboarded,
    }));

    setIsLoading(true);

    async function syncRemoteProfile() {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user!.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData && isMounted) {
          // Load preferred sports from user_sports joined table
          const { data: sportsData } = await supabase
            .from("user_sports")
            .select("sports(name)")
            .eq("user_id", user!.id);

          const preferredSports = (sportsData ?? [])
            .map((item: any) => item.sports?.name)
            .filter(Boolean);

          const localRaw = typeof window !== "undefined" ? window.localStorage.getItem(PROFILE_KEY) : null;
          const localAvatar = localRaw ? (JSON.parse(localRaw)?.avatarUrl as string | undefined) : undefined;

          const athleteProfile: AthleteProfile = {
            name: profileData.full_name || initialName,
            age: profileData.age ? Number(profileData.age) : undefined,
            heightCm: profileData.height ? Number(profileData.height) : undefined,
            fitnessLevel: profileData.fitness_level || undefined,
            preferredSports,
            avatarUrl: profileData.avatar_url || localAvatar,
          };

          const completeness = calculateProfileCompleteness(athleteProfile);

          setState({
            profile: athleteProfile,
            onboarded: completeness >= 100,
          });

          try {
            window.localStorage.setItem(PROFILE_KEY, JSON.stringify(athleteProfile));
          } catch {
            /* ignore */
          }
        } else if (!profileData && isMounted) {
          // Auto-seed empty profile row for new user in Supabase
          try {
            await supabase
              .from("profiles")
              .upsert({
                id: user!.id,
                full_name: initialName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
          } catch {
            /* ignore */
          }

          const freshProfile: AthleteProfile = {
            name: initialName,
            age: undefined,
            heightCm: undefined,
            fitnessLevel: undefined,
            preferredSports: [],
          };

          setState({
            profile: freshProfile,
            onboarded: false,
          });

          try {
            window.localStorage.setItem(PROFILE_KEY, JSON.stringify(freshProfile));
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote profile, using local fallback:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    syncRemoteProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const saveProfile = useCallback(
    async (newProfile: AthleteProfile) => {
      setState({ profile: newProfile, onboarded: true });

      try {
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      } catch {
        /* storage unavailable — keep in-memory */
      }

      // If user is authenticated, persist to Supabase
      if (user) {
        try {
          // 1. Upsert profile table
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: user.id,
            full_name: newProfile.name,
            age: newProfile.age,
            height: newProfile.heightCm,
            fitness_level: newProfile.fitnessLevel,
            disclaimer_accepted: true,
            updated_at: new Date().toISOString(),
          });

          if (profileError) {
            console.error("Error saving profile to Supabase:", profileError);
          }

          // 2. Persist preferred sports if any
          if (newProfile.preferredSports && newProfile.preferredSports.length > 0) {
            // Fetch all sports to get their UUIDs
            const { data: allSports } = await supabase.from("sports").select("id, name");

            if (allSports && allSports.length > 0) {
              const sportMap = new Map(allSports.map((s: any) => [s.name.toLowerCase(), s.id]));

              // Delete old user_sports
              await supabase.from("user_sports").delete().eq("user_id", user.id);

              // Insert new user_sports
              const rowsToInsert = newProfile.preferredSports
                .map((sportName) => {
                  const sportId = sportMap.get(sportName.toLowerCase());
                  return sportId ? { user_id: user.id, sport_id: sportId } : null;
                })
                .filter(Boolean);

              if (rowsToInsert.length > 0) {
                await supabase.from("user_sports").insert(rowsToInsert);
              }
            }
          } else {
            // Clear sports if user removed all
            await supabase.from("user_sports").delete().eq("user_id", user.id);
          }
        } catch (err) {
          console.error("Failed to persist athlete profile to Supabase:", err);
        }
      }
    },
    [user],
  );

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
      isLoading,
      saveProfile,
      attempts,
      addAttempt,
      removeAttempt,
      resetAttempts,
      biometricBaseline,
      lockBiometricBaseline,
      clearBiometricBaseline,
      faceProfile,
      registerFaceCandidate,
      lockFaceProfile,
      clearFaceProfile,
    }),
    [
      state,
      isLoading,
      attempts,
      saveProfile,
      addAttempt,
      removeAttempt,
      resetAttempts,
      biometricBaseline,
      lockBiometricBaseline,
      clearBiometricBaseline,
      faceProfile,
      registerFaceCandidate,
      lockFaceProfile,
      clearFaceProfile,
    ],
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
