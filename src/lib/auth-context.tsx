import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const REMEMBERED_EMAIL_KEY = "sportsense_saved_email";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  oauthError: string | null;
  clearOAuthError: () => void;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    phone?: string,
  ) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  rememberEmail: (email: string) => void;
  getRememberedEmail: () => string;
  clearRememberedEmail: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const clearOAuthError = useCallback(() => {
    setOauthError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Check for OAuth callback errors in URL search or hash
    if (typeof window !== "undefined") {
      const hashStr = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashStr);
      const searchParams = new URLSearchParams(window.location.search);

      const errCode = hashParams.get("error") || searchParams.get("error");
      const errDesc =
        hashParams.get("error_description") || searchParams.get("error_description");

      if (errCode || errDesc) {
        let msg = errDesc || errCode || "OAuth authentication failed.";
        if (
          errCode === "unsupported_provider" ||
          errDesc?.toLowerCase().includes("external provider") ||
          errDesc?.toLowerCase().includes("provider is not enabled") ||
          errDesc?.toLowerCase().includes("unsupported")
        ) {
          msg =
            "Google Sign-In is not yet enabled in your Supabase project. Please enable Google provider in your Supabase Authentication settings, or sign in using Email & Password.";
        } else if (
          errCode === "access_denied" ||
          errDesc?.toLowerCase().includes("denied") ||
          errDesc?.toLowerCase().includes("cancelled")
        ) {
          msg = "Google Sign-In was cancelled.";
        }
        setOauthError(msg);

        // Clean up URL hash / search params so error doesn't persist on refresh
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {
          /* ignore */
        }
      }
    }

    // 2. Handle PKCE Code exchange if ?code= is present in URL
    async function initSession() {
      try {
        if (typeof window !== "undefined" && window.location.search.includes("code=")) {
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.warn("PKCE code exchange note:", error);
              setOauthError(error.message);
            } else if (data.session) {
              if (mounted) {
                setSession(data.session);
                setUser(data.session.user);
              }
              // Clean URL query
              try {
                window.history.replaceState({}, document.title, window.location.pathname);
              } catch {
                /* ignore */
              }
            }
          }
        }

        // Fetch active session from Supabase
        const {
          data: { session: existingSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn("Error retrieving Supabase session:", sessionError);
        }

        if (mounted) {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // 3. Listen for real-time auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);

      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        if (currentSession?.user) {
          try {
            const u = currentSession.user;
            const fullName =
              (u.user_metadata?.["full_name"] as string) ||
              (u.user_metadata?.["name"] as string) ||
              u.email?.split("@")[0] ||
              (u.phone ? `Athlete ${u.phone.slice(-4)}` : "Athlete");

            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("id, age, height, fitness_level, disclaimer_accepted")
              .eq("id", u.id)
              .maybeSingle();

            if (!existingProfile) {
              await supabase.from("profiles").upsert(
                {
                  id: u.id,
                  full_name: fullName,
                  age: (u.user_metadata?.["age"] as number) || null,
                  height: (u.user_metadata?.["height"] as number) || null,
                  fitness_level: (u.user_metadata?.["fitness_level"] as string) || null,
                  disclaimer_accepted: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "id" },
              );
            }
          } catch (profileErr) {
            console.warn("Auto profile sync note:", profileErr);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string, phone?: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phone,
            },
          },
        });
        if (error) throw error;

        // Check if email confirmation is required (session will be null if email confirm is turned on)
        const needsEmailConfirmation = Boolean(data.user && !data.session);

        if (data.user) {
          try {
            await supabase.from("profiles").upsert(
              {
                id: data.user.id,
                full_name: fullName || email.split("@")[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );
          } catch (profileErr) {
            console.warn("Profile auto-creation note:", profileErr);
          }
        }

        return { error: null, needsEmailConfirmation };
      } catch (err: any) {
        return {
          error:
            err instanceof Error ? err : new Error(err?.message || "Sign up failed"),
        };
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return {
        error:
          err instanceof Error
            ? err
            : new Error(err?.message || "Invalid email or password"),
      };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
      return { error: null };
    } catch (err: any) {
      return {
        error:
          err instanceof Error
            ? err
            : new Error(err?.message || "Google authentication failed"),
      };
    }
  }, []);

  const signInWithPhone = useCallback(async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return {
        error:
          err instanceof Error
            ? err
            : new Error(err?.message || "Failed to send phone OTP"),
      };
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });
      if (error) throw error;

      if (data.user) {
        try {
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              full_name: `Athlete ${phone.slice(-4)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );
        } catch (profileErr) {
          console.warn("Phone profile sync note:", profileErr);
        }
      }

      return { error: null };
    } catch (err: any) {
      return {
        error:
          err instanceof Error
            ? err
            : new Error(err?.message || "Invalid or expired OTP code"),
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (err: any) {
      return {
        error:
          err instanceof Error ? err : new Error(err?.message || "Sign out failed"),
      };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return {
        error:
          err instanceof Error
            ? err
            : new Error(err?.message || "Reset password request failed"),
      };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return {
        error:
          err instanceof Error
            ? err
            : new Error(err?.message || "Password update failed"),
      };
    }
  }, []);

  const rememberEmail = useCallback((email: string) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const getRememberedEmail = useCallback((): string => {
    if (typeof window !== "undefined") {
      try {
        return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
      } catch {
        return "";
      }
    }
    return "";
  }, []);

  const clearRememberedEmail = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      oauthError,
      clearOAuthError,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithPhone,
      verifyPhoneOtp,
      signOut,
      resetPassword,
      updatePassword,
      rememberEmail,
      getRememberedEmail,
      clearRememberedEmail,
    }),
    [
      user,
      session,
      isLoading,
      oauthError,
      clearOAuthError,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithPhone,
      verifyPhoneOtp,
      signOut,
      resetPassword,
      updatePassword,
      rememberEmail,
      getRememberedEmail,
      clearRememberedEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
