import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
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
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

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
type AuthMethod = "email" | "phone";

function getPasswordStrength(pass: string): {
  score: number;
  label: string;
  color: string;
  hasLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
} {
  if (!pass) {
    return { score: 0, label: "", color: "", hasLength: false, hasNumber: false, hasSpecial: false };
  }
  const hasLength = pass.length >= 6;
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  let score = 0;
  if (hasLength) score += 1;
  if (pass.length >= 10) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500", hasLength, hasNumber, hasSpecial };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500", hasLength, hasNumber, hasSpecial };
  if (score === 3) return { score: 3, label: "Good", color: "bg-emerald-400", hasLength, hasNumber, hasSpecial };
  return { score: 4, label: "Strong", color: "bg-emerald-500", hasLength, hasNumber, hasSpecial };
}

function LoginPage() {
  const navigate = useNavigate();
  const {
    signIn,
    signUp,
    signOut,
    resetPassword,
    user,
    oauthError,
    clearOAuthError,
    getRememberedEmail,
    rememberEmail,
    clearRememberedEmail,
  } = useAuth();

  const justSignedUpRef = useRef(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [method, setMethod] = useState<AuthMethod>("email");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Autofill remembered email on initial mount
  useEffect(() => {
    const saved = getRememberedEmail();
    if (saved) {
      setEmail(saved);
      setSaveCredentials(true);
    }
  }, [getRememberedEmail]);

  // Handle incoming OAuth errors
  useEffect(() => {
    if (oauthError) {
      setErrorMsg(oauthError);
      toast.error("Authentication note", { description: oauthError });
      clearOAuthError();
    }
  }, [oauthError, clearOAuthError]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !justSignedUpRef.current) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  const passStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === "signin") {
      setIsSubmitting(true);
      const cleanEmail = email.trim();
      const { error } = await signIn(cleanEmail, password);
      setIsSubmitting(false);

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setErrorMsg("Your email has not been verified yet. Please check your inbox for the confirmation email from Supabase.");
        } else if (
          error.message.toLowerCase().includes("invalid login credentials") ||
          error.message.toLowerCase().includes("invalid_credentials")
        ) {
          setErrorMsg("Incorrect email or password. Please verify your details or use 'Create Account' if you are new.");
        } else {
          setErrorMsg(error.message || "Invalid credentials. Please verify your email and password.");
        }
        toast.error("Sign in failed");
      } else {
        if (saveCredentials) {
          rememberEmail(cleanEmail);
        } else {
          clearRememberedEmail();
        }
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } else {
      // Sign Up validation
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Please re-check.");
        return;
      }
      if (!acceptTerms) {
        setErrorMsg("Please accept the Terms & Conditions and Privacy Policy.");
        return;
      }

      setIsSubmitting(true);
      justSignedUpRef.current = true;
      const cleanEmail = email.trim();
      const cleanName = fullName.trim();
      const { error, needsEmailConfirmation } = await signUp(
        cleanEmail,
        password,
        cleanName,
        phoneNumber.trim() || undefined,
      );

      if (error) {
        justSignedUpRef.current = false;
        setIsSubmitting(false);
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("user already exists")
        ) {
          setErrorMsg("An account with this email already exists. Please switch to Sign In above.");
        } else {
          setErrorMsg(error.message || "Failed to create account. Please check your details.");
        }
        toast.error("Sign up failed");
      } else {
        // Sign out in case Supabase auto-logged in, ensuring user signs in explicitly
        await signOut();
        setIsSubmitting(false);

        // Pre-fill email, clear passwords
        setEmail(cleanEmail);
        setPassword("");
        setConfirmPassword("");
        if (saveCredentials) {
          rememberEmail(cleanEmail);
        }

        // Switch tab to Sign In
        setMode("signin");

        if (needsEmailConfirmation) {
          setSuccessMsg(
            `Account created! A confirmation link has been sent to ${cleanEmail}. Please check your inbox to confirm, then sign in below.`
          );
          toast.success("Account created! Please check your email to verify.");
        } else {
          setSuccessMsg(
            "Account created successfully! Please enter your password below to sign in."
          );
          toast.success("Account created! Please sign in with your password.");
        }

        setTimeout(() => {
          justSignedUpRef.current = false;
        }, 1500);
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
      toast.success("Password recovery link sent!");
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
            alt="Athlete in action"
            className="size-full object-cover opacity-25 scale-105 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
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
            Smartphone-based computer vision measures your vertical power, squat mobility, balance stability, and agility in seconds.
          </p>

          {/* Floating Metric Preview Card */}
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Kinematic Movement Battery
                </span>
              </div>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                AI Verified
              </span>
            </div>

            <div className="flex items-baseline justify-between border-y border-white/10 py-3">
              <div>
                <p className="text-[11px] text-zinc-400 uppercase font-medium">Primary Strength</p>
                <p className="text-2xl font-mono font-extrabold text-white">Explosive Power</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-zinc-400 uppercase font-medium">Performance Index</p>
                <p className="text-2xl font-mono font-extrabold text-emerald-400">92 / 100</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Trophy className="size-3.5 text-amber-400" />
                Top Sport Match: Basketball &amp; Volleyball
              </span>
              <span className="font-mono text-[11px] text-emerald-400 font-bold">96% Fit</span>
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
          <div className="mb-6 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {mode === "signin" ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Continue your athletic journey with SportSense AI."
                : "Join SportSense AI to begin your standardized movement assessments."}
            </p>
          </div>

          {/* Mode Switcher Tabs (Sign In vs Create Account) */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted/60 p-1 ring-1 ring-border/80">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
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
            {/* Social Login Button */}
            <div className="space-y-3">
              <GoogleAuthButton
                label={mode === "signin" ? "Continue with Google" : "Sign up with Google"}
                disabled={isSubmitting}
              />

              {/* Method Switcher between Email and Phone */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant={method === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMethod("email");
                    setErrorMsg(null);
                  }}
                  className={`h-9 rounded-lg text-xs font-semibold ${
                    method === "email"
                      ? "bg-muted text-foreground hover:bg-muted"
                      : "border-border/70 text-muted-foreground"
                  }`}
                >
                  <Mail className="mr-1.5 size-3.5" /> Email
                </Button>
                <Button
                  type="button"
                  variant={method === "phone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMethod("phone");
                    setErrorMsg(null);
                  }}
                  className={`h-9 rounded-lg text-xs font-semibold ${
                    method === "phone"
                      ? "bg-muted text-foreground hover:bg-muted"
                      : "border-border/70 text-muted-foreground"
                  }`}
                >
                  <Phone className="mr-1.5 size-3.5" /> Phone OTP
                </Button>
              </div>
            </div>

            {/* Visual Divider */}
            <div className="relative my-6 text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-card px-2 text-muted-foreground uppercase font-mono text-[10px] tracking-wider">
                Or continue with {method}
              </span>
            </div>

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

            {/* Render Phone Form or Email Form */}
            {method === "phone" ? (
              <PhoneAuthForm onSuccess={() => navigate({ to: "/dashboard" })} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold">
                      Full name
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        required
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
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="pl-10 h-11 rounded-xl focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="phoneNumber" className="text-xs font-semibold">
                      Phone number (optional)
                    </Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-10 h-11 rounded-xl focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

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
                      type={showPassword ? "text" : "password"}
                      required
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
                    <div className="pt-1.5 space-y-1.5">
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
                      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pt-1">
                        <span className={`flex items-center gap-1 ${passStrength.hasLength ? "text-emerald-500 font-medium" : ""}`}>
                          <Check className="size-3" /> 6+ characters
                        </span>
                        <span className={`flex items-center gap-1 ${passStrength.hasNumber ? "text-emerald-500 font-medium" : ""}`}>
                          <Check className="size-3" /> 1 number
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                      Confirm password
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="pl-10 pr-10 h-11 rounded-xl focus-visible:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me Checkbox on Sign In */}
                {mode === "signin" && (
                  <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer pt-1">
                    <Checkbox
                      checked={saveCredentials}
                      onCheckedChange={(val) => setSaveCredentials(val === true)}
                    />
                    <span>Save login credentials</span>
                  </label>
                )}

                {/* Terms of Service Checkbox on Sign Up */}
                {mode === "signup" && (
                  <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer pt-1">
                    <Checkbox
                      checked={acceptTerms}
                      onCheckedChange={(val) => setAcceptTerms(val === true)}
                      className="mt-0.5"
                    />
                    <span className="text-[11px] leading-relaxed">
                      I agree to the <span className="text-emerald-600 dark:text-emerald-400 font-medium">Terms of Service</span> and acknowledge the <span className="text-emerald-600 dark:text-emerald-400 font-medium">Privacy Policy</span>.
                    </span>
                  </label>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : mode === "signin" ? (
                    <span className="flex items-center gap-2">
                      Sign In <ArrowRight className="size-4" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account <ArrowRight className="size-4" />
                    </span>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 border-t border-border/80 pt-4 text-center text-xs text-muted-foreground">
              {mode === "signin" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMsg(null);
                    }}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Sign Up
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
                    Log in
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
