import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricBar, SuitabilityBar } from "@/components/metrics/MetricBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  component: ResultsPage,
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

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="label-meta text-muted-foreground">
          {data.assessmentName} · {data.date}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Assessment results
        </h1>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="label-meta text-muted-foreground">{data.headline.label}</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="readout text-5xl">{data.headline.value}</span>
              <span className="text-sm text-muted-foreground">{data.headline.unit}</span>
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {data.attempts.map((attempt) => (
                <div key={attempt.label} className="rounded-xl bg-secondary/60 p-3">
                  <p className="label-meta text-muted-foreground">{attempt.label}</p>
                  <p className="readout mt-1 text-lg">
                    {attempt.value}
                    <span className="ml-1 text-xs text-muted-foreground">{attempt.unit}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Average {data.average.value} {data.average.unit}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Performance metrics</h2>
            <div className="mt-6 space-y-6">
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

        <section className="mt-6 rounded-2xl bg-inverse p-6 text-inverse-foreground sm:p-8">
          <p className="label-meta text-primary">Sport suitability</p>
          <h2 className="mt-2 text-xl font-semibold">Where your profile fits best</h2>
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
          <p className="mt-6 max-w-2xl text-sm text-inverse-muted">{data.explanation}</p>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">{DISCLAIMER}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/assessments/$slug" params={{ slug: data.assessmentId }}>
              Retake assessment
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/history">View history</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
