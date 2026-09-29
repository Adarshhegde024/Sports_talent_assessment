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
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error: Error | null }>;
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

  useEffect(() => {
    let mounted = true;

    // Initial session load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("Error retrieving Supabase session:", error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for real-time auth changes (sign in, sign out, token refresh, password recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // If user just authenticated (e.g. via Google OAuth or Phone OTP), ensure their profile row exists
      if (session?.user) {
        try {
          const u = session.user;
          const fullName =
            (u.user_metadata?.["full_name"] as string) ||
            (u.user_metadata?.["name"] as string) ||
            u.email?.split("@")[0] ||
            (u.phone ? `Athlete ${u.phone.slice(-4)}` : "Athlete");

          await supabase.from("profiles").upsert(
            {
              id: u.id,
              full_name: fullName,
              age: (u.user_metadata?.["age"] as number) ?? 18,
              height: (u.user_metadata?.["height"] as number) ?? 175,
              fitness_level: (u.user_metadata?.["fitness_level"] as string) || "recreational",
              disclaimer_accepted: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch (profileErr) {
          console.warn("Auto profile sync note:", profileErr);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string, phone?: string) => {
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

      if (data.user) {
        try {
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              full_name: fullName || email.split("@")[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch (profileErr) {
          console.warn("Profile auto-creation note:", profileErr);
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err?.message || "Sign up failed") };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err?.message || "Invalid credentials") };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
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
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err?.message || "Google authentication failed") };
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
      return { error: err instanceof Error ? err : new Error(err?.message || "Failed to send phone OTP") };
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
            { onConflict: "id" }
          );
        } catch (profileErr) {
          console.warn("Phone profile sync note:", profileErr);
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err?.message || "Invalid or expired OTP") };
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
      return { error: err instanceof Error ? err : new Error(err?.message || "Sign out failed") };
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
      return { error: err instanceof Error ? err : new Error(err?.message || "Reset password request failed") };
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
      return { error: err instanceof Error ? err : new Error(err?.message || "Password update failed") };
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
