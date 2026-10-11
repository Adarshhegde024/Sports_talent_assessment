import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Circle,
  Dumbbell,
  Layers,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricBar } from "@/components/metrics/MetricBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getAssessmentHistory, getResults } from "@/lib/api";
import { ASSESSMENTS, DISCLAIMER } from "@/data/mock";
import { useAuth } from "@/lib/auth-context";
import { LiveCoachInsight } from "@/components/coach/LiveCoachInsight";

export const Route = createFileRoute("/results/$runId")({
  head: () => ({
    meta: [
      { title: "Assessment Results — SportSense AI" },
      {
        name: "description",
        content: "Biomechanical kinematics, attempt performance, and talent battery progress.",
      },
      { property: "og:title", content: "Assessment Results — SportSense AI" },
      {
        property: "og:description",
        content: "Biomechanical measurements and progress toward your comprehensive sport talent recommendation.",
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
  const { user } = useAuth();
  const { runId } = Route.useParams();

  const results = useQuery({
    queryKey: ["results", runId],
    queryFn: () => getResults(runId),
  });

  const history = useQuery({
    queryKey: ["history", user?.id],
    queryFn: getAssessmentHistory,
    staleTime: 0,
  });

  if (results.isLoading || !results.data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const data = results.data;
  const completedRuns = history.data?.filter((r) => r.status === "completed") ?? [];
  const completedSlugs = new Set(completedRuns.map((r) => r.assessmentId));

  // Add current test to set if completed
  if (data.assessmentId) {
    completedSlugs.add(data.assessmentId);
  }

  const completedCount = Math.min(ASSESSMENTS.length, completedSlugs.size);
  const isBatteryComplete = completedCount >= ASSESSMENTS.length;

  // Next uncompleted assessment
  const nextAssessment =
    ASSESSMENTS.find((a) => !completedSlugs.has(a.id) && !completedSlugs.has(a.slug)) ||
    ASSESSMENTS[0]!;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label-meta text-emerald-600 dark:text-emerald-400 font-bold">
              {data.assessmentName} · {data.date}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Movement Performance & Biomechanics
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/assessments/$slug" params={{ slug: data.assessmentId || "vertical-jump" }}>
                <Zap className="size-4 mr-1.5" />
                Retake {data.assessmentName}
              </Link>
            </Button>
          </div>
        </div>

        {/* Headline Kinematics & 5-Trait Bar */}
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
              <h2 className="text-base font-bold">Movement Performance Traits</h2>
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

        {/* Real-time AI Biomechanical Analysis & Technique Observations */}
        <section className="mt-6">
          <LiveCoachInsight
            assessmentSlug={data.assessmentId || "vertical-jump"}
            athleteName={
              (user?.user_metadata?.["full_name"] as string) ||
              (user?.user_metadata?.["name"] as string) ||
              user?.email?.split("@")[0] ||
              "Athlete"
            }
            kinematics={{
              headline_val: data.headline.value,
              headline_unit: data.headline.unit,
            }}
            topSport={data.suitability?.[0]?.sport || "Basketball"}
            sportScores={data.suitability || []}
            performanceMetrics={data.metrics || []}
            initialExplanation={data.explanation}
          />
        </section>

        {/* TALENT BATTERY PROGRESSION SECTION */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Trophy className="size-3.5" />
                <span>5-Assessment Talent Discovery Battery</span>
              </div>
              <h3 className="mt-2 text-lg font-bold">
                {isBatteryComplete
                  ? "All 5 Movement Assessments Completed!"
                  : `Talent Discovery Battery: ${completedCount} of 5 Completed`}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xl">
                {isBatteryComplete
                  ? "Your complete 5-trait athletic vector is fully calibrated. Your unified Final Sport Recommendation and 4-Week Practice Plan is ready to view!"
                  : "SportSense AI aggregates your results across all 5 movements (Vertical Jump, Squat, Balance, Push-Up, and Agility) to calculate the single best sport for you to focus on and practice."}
              </p>
            </div>

            <div className="shrink-0">
              {isBatteryComplete ? (
                <Button asChild size="lg" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md active:scale-95 transition-all">
                  <Link to="/talent-report" className="flex items-center gap-2">
                    <Trophy className="size-4 text-amber-300" />
                    <span>View Final Sport Recommendation</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md active:scale-95 transition-all">
                  <Link to="/assessments/$slug" params={{ slug: nextAssessment.slug }} className="flex items-center gap-2">
                    <span>Next Test: {nextAssessment.name}</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* 5-Step Battery Indicator Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {ASSESSMENTS.map((test, index) => {
              const done = completedSlugs.has(test.id) || completedSlugs.has(test.slug);
              return (
                <div
                  key={test.id}
                  className={`rounded-xl border p-3 transition-all ${
                    done
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                      : "border-border bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Test {index + 1}</span>
                    {done ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="mt-1 text-xs font-bold truncate">{test.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{test.metricLabel}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Prescribed Movement Drills */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold">Prescribed Technique & Conditioning Drills</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
              <p className="font-semibold text-sm">Depth Jumps & Deceleration</p>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">3 sets × 5 reps</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Step off box and explode vertically with minimal ground contact time to optimize stretch-shortening cycle.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
              <p className="font-semibold text-sm">Triple-Extension Jumps</p>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">4 sets × 4 reps</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Maximizing concentric peak rate of force development through full ankle, knee, and hip extension.
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
              <p className="font-semibold text-sm">Single-Leg Stabilization</p>
              <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">3 sets × 8 reps</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Strengthening eccentric deceleration stability and protecting joint alignment upon landing.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">{DISCLAIMER}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {isBatteryComplete ? (
            <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md">
              <Link to="/talent-report">
                <Trophy className="size-4 mr-1.5 text-amber-300" />
                View Final Sport Recommendation
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md">
              <Link to="/assessments/$slug" params={{ slug: nextAssessment.slug }}>
                Take Next Test: {nextAssessment.name}
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/history">View Session History</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
