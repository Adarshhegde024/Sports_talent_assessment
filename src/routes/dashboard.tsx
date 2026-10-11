import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Camera, Edit3, Sparkles, TrendingUp, Trophy, UserCog } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MetricBar } from "@/components/metrics/MetricBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssessmentHistory, getAthleticMetrics } from "@/lib/api";
import { calculateProfileCompleteness, useAssessmentSession } from "@/lib/assessment-session";
import { useAuth } from "@/lib/auth-context";
import { ASSESSMENTS } from "@/data/mock";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Athlete Dashboard — SportSense AI" },
      {
        name: "description",
        content: "Track your athletic profile, recent assessments and progress over time.",
      },
      { property: "og:title", content: "Athlete Dashboard — SportSense AI" },
      {
        property: "og:description",
        content: "Your athletic profile, recent assessments and next recommended session.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const { profile, isOnboarded } = useAssessmentSession();
  const metrics = useQuery({
    queryKey: ["metrics", user?.id],
    queryFn: getAthleticMetrics,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const history = useQuery({
    queryKey: ["history", user?.id],
    queryFn: getAssessmentHistory,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const completedRuns = history.data?.filter((run) => run.status === "completed") ?? [];
  const completedCount = completedRuns.length;
  const displayName = profile?.name || (user?.user_metadata?.["full_name"] as string) || user?.email?.split("@")[0] || "Athlete";

  // Calculate best jump from history
  const bestJump = history.data?.reduce((max, run) => {
    if (run.assessmentId === "vertical-jump" || run.assessmentName?.toLowerCase().includes("jump")) {
      const val = run.result ? parseFloat(run.result) : 0;
      return val > max ? val : max;
    }
    return max;
  }, 0);

  // Dynamic next recommended assessment calculation
  const completedSlugs = new Set(
    completedRuns.map((r) => r.assessmentId)
  );
  const nextAssessment =
    ASSESSMENTS.find((a) => !completedSlugs.has(a.id) && !completedSlugs.has(a.slug)) ||
    ASSESSMENTS[0]!;
  const allTestsDone = completedSlugs.size >= ASSESSMENTS.length;

  const hasTakenTests = completedCount > 0 || (bestJump && bestJump > 0);
  const isMetricsAllZero = metrics.data?.every((m) => m.value === 0) ?? true;
  const profileCompleteness = calculateProfileCompleteness(profile);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-meta text-emerald-600 dark:text-emerald-400 font-bold">Athlete Overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {displayName}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <Button asChild size="lg" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md">
              <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }} className="flex items-center gap-2">
                <Camera className="size-4" />
                <span>Start Assessment</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Assessments Completed" value={String(completedCount)} suffix="sessions" />
          <StatCard
            label="Best Jump Height"
            value={bestJump ? bestJump.toFixed(1) : "0"}
            suffix={bestJump ? "cm" : "cm (no tests yet)"}
          />
          <StatCard
            label="Profile Completeness"
            value={String(profileCompleteness)}
            suffix={profileCompleteness >= 100 ? "% (Complete)" : "% (Incomplete)"}
          />
        </div>

        {profileCompleteness < 100 && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-950 dark:text-amber-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm">
                {profileCompleteness}%
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Complete Your Athlete Profile
                </h3>
                <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
                  Fill in your age, height, and fitness level so the AI can calibrate your movement metrics and predict your optimal sporting pathways.
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 shadow-sm"
            >
              <Link to="/onboarding" className="flex items-center gap-1.5">
                <span>Complete Profile Now</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold">Athletic Profile</h2>
                {isMetricsAllZero && (
                  <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Unassessed (0 / 100)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {profile.preferredSports?.length ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {profile.preferredSports.join(" • ")}
                  </span>
                ) : null}
                <Link
                  to="/onboarding"
                  className="text-xs font-medium text-muted-foreground hover:text-emerald-500 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="size-3" />
                  <span>Update Details</span>
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.isLoading
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
                : metrics.data?.map((metric) => (
                    <MetricBar
                      key={metric.key}
                      label={metric.label}
                      value={metric.value}
                      unit={metric.unit}
                    />
                  ))}
            </div>

            {isMetricsAllZero && !metrics.isLoading && (
              <p className="mt-4 text-[11px] text-muted-foreground border-t border-border/60 pt-3">
                💡 Scores update automatically after you complete your first video movement assessment.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">Recent Activity</h2>
                <Link
                  to="/history"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  View all
                </Link>
              </div>

              {history.isLoading ? (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-10 rounded-xl" />
                  <Skeleton className="h-10 rounded-xl" />
                </div>
              ) : history.data && history.data.length > 0 ? (
                <ul className="mt-4 divide-y divide-border">
                  {history.data.slice(0, 4).map((run) => (
                    <li key={run.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{run.assessmentName}</p>
                        <p className="label-meta text-muted-foreground">{run.date}</p>
                      </div>
                      <span className="readout shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {run.result ?? "In progress"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-border/90 p-6 text-center">
                  <Sparkles className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-2 text-xs font-semibold">No assessments recorded yet</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Record your first vertical jump session to measure explosive power and calibrate your profile.
                  </p>
                </div>
              )}
            </div>

            {completedRuns.length > 0 && completedRuns[0]?.id ? (
              <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
                <Link to="/results/$runId" params={{ runId: completedRuns[0].id }}>
                  <TrendingUp className="size-4" />
                  View latest results
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
                <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }}>
                  <Camera className="size-4" />
                  Start First Assessment
                </Link>
              </Button>
            )}
          </section>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl bg-zinc-950 p-6 text-white shadow-xl sm:p-8 border border-white/10 relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
              <Trophy className="size-3.5 text-amber-400" />
              <span>{allTestsDone ? "Comprehensive Talent Discovery Complete" : `Talent Battery: ${completedSlugs.size} of 5 Completed`}</span>
            </div>
            {allTestsDone && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                100% Calibrated
              </span>
            )}
          </div>

          <h2 className="mt-3 text-2xl font-bold">
            {allTestsDone
              ? "Your Comprehensive Final Sport Recommendation Is Ready!"
              : `Next: ${nextAssessment.name} (${completedSlugs.size + 1} of 5)`}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-300 leading-relaxed">
            {allTestsDone
              ? "All 5 movement assessments (Vertical Jump, Squat, Balance, Push-Up, and Agility) have been analyzed. View your single definitive recommended sport, Olympic coach analysis, and customized 4-week practice roadmap."
              : `Complete all 5 assessments so our AI can synthesize your complete 5-trait biomechanical fingerprint and recommend the single best sport for you to practice and excel in.`}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {allTestsDone ? (
              <Button asChild className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold shadow-md active:scale-95 transition-all">
                <Link to="/talent-report">
                  <Trophy className="size-4 mr-1.5" />
                  View Final Sport Recommendation & Practice Plan
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold shadow-md active:scale-95 transition-all">
                <Link to="/assessments/$slug" params={{ slug: nextAssessment.slug }}>
                  Take Next Test: {nextAssessment.name}
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Link to="/talent-report">
                View Talent Discovery Report
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Link to="/assessments">
                Browse All 5 Tests
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="label-meta text-muted-foreground">{label}</p>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="readout text-3xl font-extrabold">{value}</span>
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </p>
    </div>
  );
}
