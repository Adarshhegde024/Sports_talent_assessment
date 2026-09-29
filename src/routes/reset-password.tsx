import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — SportSense AI" },
      {
        name: "description",
        content: "Set a new secure password for your SportSense AI account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function getPasswordStrength(pass: string): {
  score: number;
  label: string;
  color: string;
  hasLength: boolean;
  hasNumber: boolean;
} {
  if (!pass) return { score: 0, label: "", color: "", hasLength: false, hasNumber: false };
  const hasLength = pass.length >= 6;
  const hasNumber = /[0-9]/.test(pass);
  let score = 0;
  if (hasLength) score += 1;
  if (pass.length >= 10) score += 1;
  if (hasNumber) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500", hasLength, hasNumber };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500", hasLength, hasNumber };
  if (score === 3) return { score: 3, label: "Good", color: "bg-emerald-400", hasLength, hasNumber };
  return { score: 4, label: "Strong", color: "bg-emerald-500", hasLength, hasNumber };
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const passStrength = getPasswordStrength(password);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || "Failed to update password. Your recovery link may have expired.");
      toast.error("Password update failed");
    } else {
      setIsDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1500);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 selection:bg-emerald-500/20">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo to="/" className="mb-4" />
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
            <KeyRound className="size-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Set New Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a new password for your SportSense AI athlete account.
          </p>
        </div>

        <div className="rounded-2xl border border-border/90 bg-card p-6 shadow-xl sm:p-8">
          {errorMsg && (
            <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5 animate-in fade-in">
              <span className="font-semibold">Error:</span> {errorMsg}
            </div>
          )}

          {isDone ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="text-base font-bold">Password Updated Successfully!</h3>
              <p className="text-xs text-muted-foreground">
                Redirecting you straight to your dashboard...
              </p>
              <Button asChild className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-semibold">
                  New password (min. 6 characters)
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="pl-10 pr-10 h-11 rounded-xl focus-visible:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {password.length > 0 && (
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

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                  Confirm new password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Update Password <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
