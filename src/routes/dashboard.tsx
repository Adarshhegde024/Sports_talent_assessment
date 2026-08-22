import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Camera, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricBar } from "@/components/metrics/MetricBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssessmentHistory, getAthleticMetrics } from "@/lib/api";
import { useAssessmentSession } from "@/lib/assessment-session";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SportSense AI" },
      {
        name: "description",
        content: "Track your athletic profile, recent assessments and progress over time.",
      },
      { property: "og:title", content: "Dashboard — SportSense AI" },
      {
        property: "og:description",
        content: "Your athletic profile, recent assessments and next recommended session.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useAssessmentSession();
  const metrics = useQuery({ queryKey: ["metrics"], queryFn: getAthleticMetrics });
  const history = useQuery({ queryKey: ["history"], queryFn: getAssessmentHistory });

  const completed = history.data?.filter((run) => run.status === "completed").length ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-meta text-muted-foreground">Athlete overview</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {profile.name || "athlete"}
            </h1>
          </div>
          <Button asChild size="lg">
            <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }}>
              <Camera className="size-4" />
              Start assessment
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Assessments completed" value={String(completed)} suffix="sessions" />
          <StatCard label="Best jump height" value="48" suffix="cm" />
          <StatCard label="Profile completeness" value="80" suffix="%" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Athletic profile</h2>
              <span className="label-meta text-muted-foreground">Mock data</span>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.isLoading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
                : metrics.data?.map((metric) => (
                    <MetricBar
                      key={metric.key}
                      label={metric.label}
                      value={metric.value}
                      unit={metric.unit}
                    />
                  ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent activity</h2>
              <Link
                to="/history"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {history.data?.map((run) => (
                <li key={run.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{run.assessmentName}</p>
                    <p className="label-meta text-muted-foreground">{run.date}</p>
                  </div>
                  <span className="readout shrink-0 text-sm">{run.result ?? "—"}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/results/$runId" params={{ runId: "run-1042" }}>
                <TrendingUp className="size-4" />
                View latest results
              </Link>
            </Button>
          </section>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl bg-inverse p-6 text-inverse-foreground sm:p-8">
          <p className="label-meta text-primary">Next recommended</p>
          <h2 className="mt-2 text-xl font-semibold">Vertical Jump — 3 attempts, 5 minutes</h2>
          <p className="mt-2 max-w-xl text-sm text-inverse-muted">
            Re-test every two to three weeks to keep your explosive power trend meaningful.
          </p>
          <Button asChild variant="secondary" className="mt-5">
            <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }}>
              Begin
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="label-meta text-muted-foreground">{label}</p>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="readout text-3xl">{value}</span>
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </p>
    </div>
  );
}
