import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { calculateProfileCompleteness, useAssessmentSession } from "@/lib/assessment-session";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { DISCLAIMER } from "@/data/mock";
import type { AthleteProfile, FitnessLevel } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Create your athlete profile — SportSense AI" },
      {
        name: "description",
        content:
          "Enter your basic athlete details so assessment results can be normalized and interpreted correctly.",
      },
      { property: "og:title", content: "Create your athlete profile — SportSense AI" },
      {
        property: "og:description",
        content: "Basic profile setup before your first movement assessment.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  ),
});

const SPORTS = ["Basketball", "Volleyball", "Football", "Cricket", "Tennis", "Badminton"];

function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, saveProfile } = useAssessmentSession();

  const [form, setForm] = useState<AthleteProfile>({
    name: profile?.name || (user?.user_metadata?.["full_name"] as string) || "",
    age: profile?.age || undefined,
    gender: profile?.gender || "prefer-not-to-say",
    heightCm: profile?.heightCm || undefined,
    fitnessLevel: profile?.fitnessLevel || undefined,
    preferredSports: profile?.preferredSports || [],
  });

  const [accepted, setAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.name && !form.name) {
      setForm((prev) => ({
        ...prev,
        name: profile.name,
        age: profile.age ?? prev.age,
        heightCm: profile.heightCm ?? prev.heightCm,
        fitnessLevel: profile.fitnessLevel ?? prev.fitnessLevel,
        preferredSports: profile.preferredSports ?? prev.preferredSports ?? [],
      }));
    }
  }, [profile, form.name]);

  const toggleSport = (sport: string) =>
    setForm((f) => ({
      ...f,
      preferredSports: f.preferredSports?.includes(sport)
        ? f.preferredSports.filter((s) => s !== sport)
        : [...(f.preferredSports ?? []), sport],
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accepted || !form.name.trim()) return;

    setIsSaving(true);
    await saveProfile(form);
    setIsSaving(false);

    const score = calculateProfileCompleteness(form);
    if (score >= 100) {
      toast.success("Profile is 100% complete! You can now proceed to take assessments.", {
        duration: 5000,
        icon: "🎉",
      });
    } else {
      toast.success("Profile details saved successfully!", {
        duration: 3500,
      });
    }

    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10 sm:px-6 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-xl">
        <Logo className="mb-8" />
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <p className="label-meta text-emerald-600 dark:text-emerald-400 font-bold">Step 01 / Athlete Profile</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Set up your athlete profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            These details are used to calibrate your movement measurements and calculate sport suitability.
          </p>

          <form className="mt-8 space-y-6" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  placeholder="e.g. Alex Morgan"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={8}
                  max={90}
                  placeholder="e.g. 21"
                  value={form.age ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, age: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min={100}
                  max={240}
                  placeholder="e.g. 175"
                  value={form.heightCm ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      heightCm: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={form.gender ?? "prefer-not-to-say"}
                  onValueChange={(v) =>
                    setForm({ ...form, gender: v as NonNullable<AthleteProfile["gender"]> })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fitness level</Label>
                <Select
                  value={form.fitnessLevel ?? ""}
                  onValueChange={(v) => setForm({ ...form, fitnessLevel: v as FitnessLevel })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select fitness level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="recreational">Recreational</SelectItem>
                    <SelectItem value="trained">Trained</SelectItem>
                    <SelectItem value="competitive">Competitive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Preferred sports (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((sport) => {
                  const active = form.preferredSports?.includes(sport);
                  return (
                    <button
                      type="button"
                      key={sport}
                      onClick={() => toggleSport(sport)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? "border-emerald-500 bg-emerald-600 text-white shadow-xs scale-105"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sport}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex gap-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
              </div>
              <label className="mt-4 flex items-start gap-3 text-sm cursor-pointer">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(v === true)}
                  className="mt-0.5"
                />
                <span className="text-xs text-muted-foreground">
                  I understand this is an assessment tool, not medical advice, and I consent to
                  securely recording movement video for analysis.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
              disabled={!accepted || isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Continue to Dashboard <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
