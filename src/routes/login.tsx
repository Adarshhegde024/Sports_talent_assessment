import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In / Sign Up — SportSense AI" },
      {
        name: "description",
        content: "Log in or create your SportSense AI athlete account to assess your athletic potential.",
      },
    ],
  }),
  component: LoginPage,
});

type AuthMode = "signin" | "signup";

function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 3) return { score: 3, label: "Good", color: "bg-emerald-400" };
  return { score: 4, label: "Strong", color: "bg-emerald-500" };
}

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, user } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Redirect if user is already authenticated
  if (user) {
    navigate({ to: "/dashboard" });
  }

  const passStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    if (mode === "signin") {
      const { error } = await signIn(email.trim(), password);
      setIsSubmitting(false);
      if (error) {
        setErrorMsg(error.message || "Failed to sign in. Please verify your email and password.");
      } else {
        navigate({ to: "/dashboard" });
      }
    } else {
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        setIsSubmitting(false);
        return;
      }
      const { error } = await signUp(email.trim(), password, fullName.trim());
      setIsSubmitting(false);
      if (error) {
        setErrorMsg(error.message || "Failed to create account. Please check your details.");
      } else {
        setSuccessMsg("Account created! Redirecting to your athlete dashboard...");
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 1000);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSubmitting(true);
    const { error } = await resetPassword(forgotEmail.trim());
    setForgotSubmitting(false);
    if (error) {
      setForgotError(error.message || "Failed to send password reset email.");
    } else {
      setForgotSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:grid lg:grid-cols-12 selection:bg-emerald-500/20">
      {/* LEFT VISUAL HERO PANEL (Visible on lg+ screens) */}
      <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between overflow-hidden bg-zinc-950 p-10 xl:p-14 text-white border-r border-white/10">
        {/* Background Action Photo & Ambient Mesh */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80"
            alt="Athlete jumping"
            className="size-full object-cover opacity-25 scale-105 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />
          <div className="absolute -left-20 top-1/4 size-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        </div>

        {/* Top Header in Panel */}
        <div className="relative z-10">
          <Logo to="/" />
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 backdrop-blur-md">
            <Sparkles className="size-3.5 text-emerald-400" />
            <span className="font-mono text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
              AI Movement Intelligence
            </span>
          </div>
        </div>

        {/* Middle Value Proposition & Floating Preview Cards */}
        <div className="relative z-10 my-8 space-y-6">
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
            Discover Your True <br />
            <span className="text-emerald-400">Athletic Potential.</span>
          </h2>
          <p className="text-sm xl:text-base text-zinc-300 leading-relaxed max-w-md">
            Smartphone-based computer vision measures your explosive power, jump mechanics, and recommends matching sports in seconds.
          </p>

          {/* Floating Metric Preview Card */}
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Vertical Jump Assessment
                </span>
              </div>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                AI Verified
              </span>
            </div>

            <div className="flex items-baseline justify-between border-y border-white/10 py-3">
              <div>
                <p className="text-[11px] text-zinc-400 uppercase font-medium">Measured Peak Height</p>
                <p className="text-2xl font-mono font-extrabold text-white">52.4 cm</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-zinc-400 uppercase font-medium">Explosive Power</p>
                <p className="text-2xl font-mono font-extrabold text-emerald-400">92 / 100</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Trophy className="size-3.5 text-amber-400" />
                Top Fit: Basketball &amp; Volleyball
              </span>
              <span className="font-mono text-[11px] text-emerald-400 font-bold">94% Match</span>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
              <span>Private &amp; Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-emerald-400 shrink-0" />
              <span>Real-Time Pose Analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT AUTH CARD PANEL */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
        {/* Top Navbar items */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <div className="lg:hidden">
            <Logo to="/" />
          </div>
          <div className="hidden lg:block">
            <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              ← Back to SportSense AI Home
            </Link>
          </div>
          <ThemeToggle />
        </div>

        {/* Center Card */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {mode === "signin" ? "Welcome back, athlete" : "Create your athlete account"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access your assessment log, metrics, and recommendations."
                : "Join SportSense AI to begin your movement assessments and sport suitability discovery."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted/60 p-1 ring-1 ring-border/80">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setEmail("");
                setPassword("");
                setFullName("");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all ${
                mode === "signin"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setEmail("");
                setPassword("");
                setFullName("");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all ${
                mode === "signup"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Main Form Container */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5 animate-in fade-in duration-200">
                <span className="font-bold">Error:</span> {errorMsg}
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold">
                    Full name
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="sportsense_athlete_name"
                      type="text"
                      required
                      autoComplete="off"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="pl-10 h-11 rounded-xl focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="sportsense_athlete_email"
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="pl-10 h-11 rounded-xl focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Password
                  </Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setShowForgotModal(true);
                        setForgotSuccess(false);
                        setForgotError(null);
                      }}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="sportsense_athlete_pass"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signin" ? "Enter your password" : "Create password (min. 6 chars)"}
                    className="pl-10 pr-10 h-11 rounded-xl focus-visible:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator on Sign Up */}
                {mode === "signup" && password.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Password strength:</span>
                      <span className="font-bold text-foreground">{passStrength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-all ${
                            step <= passStrength.score ? passStrength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : mode === "signin" ? (
                  <span className="flex items-center gap-2">
                    Sign In to Dashboard <ArrowRight className="size-4" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Athlete Account <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 border-t border-border/80 pt-4 text-center text-xs text-muted-foreground">
              {mode === "signin" ? (
                <p>
                  Don't have an athlete account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMsg(null);
                    }}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Create one now
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMsg(null);
                    }}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="w-full max-w-md mx-auto text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} SportSense AI • Precision Sports Intelligence</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Reset Password</h3>
                <p className="text-xs text-muted-foreground">We'll email you a recovery link</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300">
                  Password reset link has been dispatched to <strong>{forgotEmail}</strong>. Check your inbox.
                </div>
                <Button
                  type="button"
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={() => setShowForgotModal(false)}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                {forgotError && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    {forgotError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="forgotEmail" className="text-xs font-semibold">
                    Email address
                  </Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/2 h-10 rounded-xl"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="w-1/2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {forgotSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Send Link"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
