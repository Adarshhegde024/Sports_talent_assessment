import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
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
import { useAssessmentSession } from "@/lib/assessment-session";
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
  component: Onboarding,
});

const SPORTS = ["Basketball", "Football", "Athletics", "Volleyball", "Tennis", "Swimming"];

function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile } = useAssessmentSession();
  const [form, setForm] = useState<AthleteProfile>({
    name: "",
    age: 18,
    gender: "prefer-not-to-say",
    heightCm: 175,
    fitnessLevel: "recreational",
    preferredSports: [],
  });
  const [accepted, setAccepted] = useState(false);

  const toggleSport = (sport: string) =>
    setForm((f) => ({
      ...f,
      preferredSports: f.preferredSports?.includes(sport)
        ? f.preferredSports.filter((s) => s !== sport)
        : [...(f.preferredSports ?? []), sport],
    }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!accepted || !form.name.trim()) return;
    saveProfile(form);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <Logo className="mb-8" />
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="label-meta text-muted-foreground">Step 01 / Profile</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Set up your athlete profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            These details are used to normalize your measurements. They stay on this device.
          </p>

          <form className="mt-8 space-y-6" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  placeholder="Your name"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={10}
                  max={80}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min={120}
                  max={230}
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm({ ...form, gender: v as AthleteProfile["gender"] })}
                >
                  <SelectTrigger>
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
                  value={form.fitnessLevel}
                  onValueChange={(v) => setForm({ ...form, fitnessLevel: v as FitnessLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
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
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
              </div>
              <label className="mt-4 flex items-start gap-3 text-sm">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(v === true)}
                  className="mt-0.5"
                />
                <span className="text-muted-foreground">
                  I understand this is an assessment tool, not medical advice, and I consent to
                  recording video on my own device.
                </span>
              </label>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={!accepted}>
              Continue to dashboard
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
