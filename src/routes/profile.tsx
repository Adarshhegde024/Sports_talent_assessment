import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Edit3, Loader2, LogOut, Save, User, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateProfileCompleteness, useAssessmentSession } from "@/lib/assessment-session";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import type { AthleteProfile, FitnessLevel } from "@/lib/types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Athlete profile — SportSense AI" },
      {
        name: "description",
        content: "Your athlete details used to contextualise assessment results.",
      },
      { property: "og:title", content: "Athlete profile — SportSense AI" },
      {
        property: "og:description",
        content: "View and edit your personal athlete profile and preferred sports.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

const ALL_SPORTS = ["Basketball", "Volleyball", "Football", "Cricket", "Tennis", "Badminton"];

function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isOnboarded, saveProfile, isLoading } = useAssessmentSession();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<AthleteProfile>({
    name: profile?.name || "",
    age: profile?.age || 18,
    gender: profile?.gender || "prefer-not-to-say",
    heightCm: profile?.heightCm || 175,
    fitnessLevel: profile?.fitnessLevel || "recreational",
    preferredSports: profile?.preferredSports || [],
  });

  const startEditing = () => {
    setEditForm({
      name: profile?.name || "",
      age: profile?.age || 18,
      gender: profile?.gender || "prefer-not-to-say",
      heightCm: profile?.heightCm || 175,
      fitnessLevel: profile?.fitnessLevel || "recreational",
      preferredSports: profile?.preferredSports || [],
    });
    setIsEditing(true);
    setSuccessMsg(null);
  };

  const toggleSport = (sport: string) => {
    setEditForm((f) => ({
      ...f,
      preferredSports: f.preferredSports?.includes(sport)
        ? f.preferredSports.filter((s) => s !== sport)
        : [...(f.preferredSports ?? []), sport],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveProfile(editForm);
    setIsSaving(false);
    setIsEditing(false);
    const score = calculateProfileCompleteness(editForm);
    if (score >= 100) {
      toast.success("Profile is 100% updated! You can now proceed to take assessments.", {
        duration: 5000,
        icon: "🎉",
      });
    } else {
      toast.success("Athlete profile and preferred sports saved successfully!");
    }
    setSuccessMsg("Athlete profile and preferred sports saved successfully!");
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const rows = [
    { label: "Full Name", value: profile.name || "—" },
    { label: "Account Email", value: user?.email || "—" },
    { label: "Age", value: profile.age ? `${profile.age} years` : "—" },
    { label: "Height", value: profile.heightCm ? `${profile.heightCm} cm` : "—" },
    { label: "Gender", value: profile.gender ?? "Prefer not to say" },
    { label: "Fitness Level", value: profile.fitnessLevel },
    {
      label: "Preferred Sports",
      value: profile.preferredSports?.length ? profile.preferredSports.join(", ") : "None selected",
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="label-meta text-emerald-600 dark:text-emerald-400 font-bold">Athlete Account</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Athlete Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button onClick={startEditing} variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5">
                <Edit3 className="size-3.5" />
                <span>Edit Profile</span>
              </Button>
            ) : null}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 rounded-xl flex items-center gap-1.5"
            >
              <LogOut className="size-3.5" />
              <span>Log out</span>
            </Button>
          </div>
        </div>

        {successMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {!isOnboarded && !isLoading ? (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
            You are viewing default profile values. Please complete onboarding to calibrate your assessment scores.
          </div>
        ) : null}

        {isEditing ? (
          <form onSubmit={handleSave} className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="editName" className="text-xs font-semibold">
                  Full Name
                </Label>
                <Input
                  id="editName"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editAge" className="text-xs font-semibold">
                  Age
                </Label>
                <Input
                  id="editAge"
                  type="number"
                  min={10}
                  max={80}
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editHeight" className="text-xs font-semibold">
                  Height (cm)
                </Label>
                <Input
                  id="editHeight"
                  type="number"
                  min={120}
                  max={230}
                  value={editForm.heightCm}
                  onChange={(e) => setEditForm({ ...editForm, heightCm: Number(e.target.value) })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Gender</Label>
                <Select
                  value={editForm.gender ?? "prefer-not-to-say"}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, gender: v as NonNullable<AthleteProfile["gender"]> })
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fitness Level</Label>
                <Select
                  value={editForm.fitnessLevel}
                  onValueChange={(v) => setEditForm({ ...editForm, fitnessLevel: v as FitnessLevel })}
                >
                  <SelectTrigger className="h-10 rounded-xl">
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

            <div className="space-y-2 pt-2 border-t border-border/80">
              <Label className="text-xs font-semibold">Preferred Sports</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_SPORTS.map((sport) => {
                  const active = editForm.preferredSports?.includes(sport);
                  return (
                    <button
                      type="button"
                      key={sport}
                      onClick={() => toggleSport(sport)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        active
                          ? "border-emerald-500 bg-emerald-600 text-white shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sport}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="rounded-xl px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 font-semibold"
              >
                {isSaving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Save
              </Button>
            </div>
          </form>
        ) : (
          <dl className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-4">
                <dt className="text-xs font-semibold text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-medium capitalize text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </AppShell>
  );
}
