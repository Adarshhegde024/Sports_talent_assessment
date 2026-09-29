import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Dumbbell, Sparkles, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricBar, SuitabilityBar } from "@/components/metrics/MetricBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getResults } from "@/lib/api";
import { DISCLAIMER } from "@/data/mock";

export const Route = createFileRoute("/results/$runId")({
  head: () => ({
    meta: [
      { title: "Assessment results — SportSense AI" },
      {
        name: "description",
        content: "Jump height, explosive power, stability and sport suitability from your session.",
      },
      { property: "og:title", content: "Assessment results — SportSense AI" },
      {
        property: "og:description",
        content: "Measured performance metrics and matching sports for your assessment.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ResultsPage />
    </ProtectedRoute>
  ),
});

function ResultsPage() {
  const { runId } = Route.useParams();
  const results = useQuery({ queryKey: ["results", runId], queryFn: () => getResults(runId) });

  if (results.isLoading || !results.data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    );
  }

  const data = results.data;
  const topSport = data.suitability?.[0] || { sport: "Basketball", score: 96 };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label-meta text-emerald-600 dark:text-emerald-400 font-bold">
              {data.assessmentName} · {data.date}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Assessment Results
            </h1>
          </div>
          <Button asChild size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }}>
              <Zap className="size-4 mr-1.5" />
              Retake Assessment
            </Link>
          </Button>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="label-meta text-muted-foreground">{data.headline.label}</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="readout text-5xl font-extrabold text-foreground">{data.headline.value}</span>
              <span className="text-sm font-semibold text-muted-foreground">{data.headline.unit}</span>
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {data.attempts.map((attempt) => (
                <div key={attempt.label} className="rounded-xl bg-muted/60 border border-border/80 p-3">
                  <p className="label-meta text-muted-foreground">{attempt.label}</p>
                  <p className="readout mt-1 text-lg font-bold text-foreground">
                    {attempt.value}
                    <span className="ml-1 text-xs text-muted-foreground font-normal">{attempt.unit}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground border-t border-border/60 pt-3">
              3-Attempt Average: <strong className="text-foreground">{data.average.value} {data.average.unit}</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Performance Metrics</h2>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Calibrated
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {data.metrics.map((metric) => (
                <MetricBar
                  key={metric.key}
                  label={metric.label}
                  value={metric.value}
                  unit={metric.unit}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Machine Learning Multi-Sport Suitability Analysis */}
        <section className="mt-6 rounded-2xl bg-zinc-950 p-6 text-white shadow-xl sm:p-8 border border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300">
                <Sparkles className="size-3.5" />
                <span>ML Multi-Model Suitability Engine</span>
              </div>
              <h2 className="mt-2 text-xl font-bold">Where your profile fits best</h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-md">
              <Trophy className="size-4 text-amber-400" />
              <span className="text-xs font-semibold">Top Fit: <strong className="text-emerald-400">{topSport.sport}</strong> ({topSport.score}%)</span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {data.suitability.map((item, index) => (
              <SuitabilityBar
                key={item.sport}
                sport={item.sport}
                score={item.score}
                emphasis={index === 0}
              />
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">AI Coach Observation</p>
            <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">{data.explanation}</p>
          </div>
        </section>

        {/* Prescribed Athletic Drills */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold">Prescribed Athletic Drills</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
              <p className="font-semibold text-sm">Depth Jumps (SSC)</p>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">3 sets × 5 reps</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Step off a 30cm box and immediately explode vertically with minimal ground contact time.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
              <p className="font-semibold text-sm">Weighted Squat Jumps</p>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">4 sets × 4 reps</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Maximizing concentric peak rate of force development through full triple extension.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
              <p className="font-semibold text-sm">Single-Leg Landings</p>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">3 sets × 8 reps</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Strengthening eccentric deceleration stability and protecting knee ligaments upon landing.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">{DISCLAIMER}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <Link to="/dashboard">
              Return to Dashboard
              <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/history">View Assessment History</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
