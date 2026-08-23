import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAssessmentSession } from "@/lib/assessment-session";

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
        content: "View the athlete details behind your SportSense AI assessments.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, isOnboarded } = useAssessmentSession();

  const rows = [
    { label: "Name", value: profile.name || "—" },
    { label: "Age", value: profile.age ? `${profile.age}` : "—" },
    { label: "Height", value: profile.heightCm ? `${profile.heightCm} cm` : "—" },
    { label: "Gender", value: profile.gender ?? "—" },
    { label: "Fitness level", value: profile.fitnessLevel },
    { label: "Preferred sports", value: profile.preferredSports?.join(", ") || "—" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="label-meta text-muted-foreground">Athlete</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>
        {!isOnboarded ? (
          <p className="mt-2 text-sm text-muted-foreground">
            You're viewing default values. Complete onboarding to personalise them.
          </p>
        ) : null}

        <dl className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="label-meta text-muted-foreground">{row.label}</dt>
              <dd className="text-sm font-medium capitalize">{row.value}</dd>
            </div>
          ))}
        </dl>

        <Button asChild className="mt-6">
          <Link to="/onboarding">Edit details</Link>
        </Button>
      </div>
    </AppShell>
  );
}
