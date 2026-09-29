import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Dumbbell,
  Layers,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MetricBar, SuitabilityBar } from "@/components/metrics/MetricBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getComprehensiveTalentReport } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DISCLAIMER } from "@/data/mock";

export const Route = createFileRoute("/talent-report")({
  head: () => ({
    meta: [
      { title: "Final Sport Recommendation & Talent Report — SportSense AI" },
      {
        name: "description",
        content:
          "Definitive multi-assessment talent discovery report and 4-week structured practice roadmap based on all 5 athletic tests.",
      },
      { property: "og:title", content: "Final Sport Recommendation — SportSense AI" },
      {
        property: "og:description",
        content: "Discover which sport you have the highest aptitude to practice and excel in.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <TalentReportPage />
    </ProtectedRoute>
  ),
});

function TalentReportPage() {
  const { user } = useAuth();
  const reportQuery = useQuery({
    queryKey: ["comprehensiveTalentReport", user?.id],
    queryFn: getComprehensiveTalentReport,
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (reportQuery.isLoading || !reportQuery.data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const data = reportQuery.data;
  const primary = data.primarySport;
  const isComplete = data.isComplete;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-3.5 text-emerald-500" />
              <span>Multi-Assessment 5-Trait Synthesis</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Comprehensive Talent Discovery & Final Sport Recommendation
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold">
              Battery Progress: <strong className="text-emerald-600 dark:text-emerald-400">{data.completedCount} of {data.totalAssessments} Tests</strong>
            </span>
          </div>
        </div>

        {/* Incomplete Battery Notice (if applicable) */}
        {!isComplete && (
          <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-950 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <Award className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Preliminary Recommendation ({data.completedCount}/{data.totalAssessments} Tests Completed)</h3>
                <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                  You have completed {data.completedCount} out of 5 standardized movement assessments. Complete the remaining {data.missingAssessments.length} {data.missingAssessments.length === 1 ? "assessment" : "assessments"} to fully calibrate your 5-trait biomechanical fingerprint and unlock your 100% verified Olympic coaching report.
                </p>
                {data.missingAssessments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.missingAssessments.map((missing) => (
                      <Button
                        key={missing.slug}
                        asChild
                        size="sm"
                        className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 font-semibold"
                      >
                        <Link to="/assessments/$slug" params={{ slug: missing.slug }}>
                          <span>Take {missing.name}</span>
                          <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* HERO SECTION: THE ONE DEFINITIVE RECOMMENDED SPORT */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-2xl sm:p-10 border border-white/10 relative">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 size-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1 text-xs font-bold text-emerald-300">
                <Trophy className="size-4 text-amber-400" />
                <span>PRIMARY SPORT RECOMMENDATION</span>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs font-semibold text-zinc-300">
                {primary.tier}
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr] items-center">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Recommended Sport to Practice & Excel In</p>
                <h2 className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {primary.sport}
                </h2>
                <p className="mt-4 text-sm text-zinc-300 leading-relaxed max-w-xl">
                  {data.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-4 items-center">
                  <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-md">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Overall Compatibility</p>
                    <p className="readout mt-0.5 text-2xl font-extrabold text-emerald-400">{primary.score}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-md">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Assessed Traits</p>
                    <p className="readout mt-0.5 text-2xl font-extrabold text-white">5 / 5 Core Dimensions</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Target className="size-4 text-emerald-400" />
                  <span>Key Biomechanical Advantages</span>
                </h3>
                <ul className="mt-3 space-y-2.5 text-xs text-zinc-300">
                  {data.biomechanicalAdvantages.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span className="leading-snug">{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5-TRAIT ATHLETIC PROFILE & SECONDARY PATHWAYS */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">5-Trait Athletic Profile</h3>
              <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                All 5 Tests Aggregated
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Integrated kinematic measurements across Explosive Power, Strength, Balance, Agility, and Coordination.
            </p>

            <div className="mt-6 space-y-4">
              {data.metrics.map((m) => (
                <MetricBar key={m.key} label={m.label} value={m.value} unit={m.unit} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-bold">Multi-Sport Aptitude Rankings</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Machine Learning ranking across all 6 calibrated sporting archetypes.
            </p>

            <div className="mt-6 space-y-3.5">
              {data.sportScores.map((item, idx) => (
                <SuitabilityBar
                  key={item.sport}
                  sport={item.sport}
                  score={item.score}
                  emphasis={idx === 0}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 4-WEEK STRUCTURED PRACTICE ROADMAP */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold">4-Week Structured Practice Roadmap for {primary.sport}</h3>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">Specialization Plan</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Follow this progressive developmental plan to build technical skills, power, and physical conditioning tailored to {primary.sport}.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.practiceRoadmap.map((weekItem, idx) => (
              <div
                key={weekItem.week}
                className="rounded-xl border border-border/80 bg-muted/30 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span>{weekItem.week}</span>
                  </div>
                  <h4 className="mt-2 font-bold text-sm">{weekItem.focus}</h4>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{weekItem.drills}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Target: Phase {idx + 1}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">3–4 Sessions/wk</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRESCRIBED DEVELOPMENTAL DRILLS */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold">Targeted Skill & Conditioning Drills</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Execute these high-impact drills to address weak links and enhance key sport-specific movement patterns.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {data.developmentalDrills.map((drill) => (
              <div key={drill.name} className="rounded-xl border border-border/80 bg-muted/40 p-4">
                <p className="font-bold text-sm">{drill.name}</p>
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  {drill.sets}
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{drill.focus}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">{DISCLAIMER}</p>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
            <Link to="/dashboard">
              Return to Dashboard
              <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/assessments">Re-Test Movement Battery</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/history">View Assessment Log</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
