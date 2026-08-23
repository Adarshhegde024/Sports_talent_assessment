import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Ruler, Smartphone, Sun } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssessment } from "@/lib/api";
import { DISCLAIMER } from "@/data/mock";

export const Route = createFileRoute("/assessments/$slug/")({
  head: () => ({
    meta: [
      { title: "Assessment instructions — SportSense AI" },
      {
        name: "description",
        content: "Set up your phone, review the protocol and prepare for your recorded assessment.",
      },
      { property: "og:title", content: "Assessment instructions — SportSense AI" },
      {
        property: "og:description",
        content: "Protocol, setup requirements and safety notes before recording.",
      },
    ],
  }),
  component: AssessmentDetail,
});

const setupIcons = [Smartphone, Ruler, Sun];

function AssessmentDetail() {
  const { slug } = useParams({ from: "/assessments/$slug/" });
  const { data, isLoading } = useQuery({
    queryKey: ["assessment", slug],
    queryFn: () => getAssessment(slug),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading || !data ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : (
          <>
            <p className="label-meta text-muted-foreground">Step 01 / Instructions</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{data.name}</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{data.objective}</p>

            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <Chip label="Duration" value={`${data.durationMinutes} min`} />
              <Chip label="Attempts" value={String(data.attempts)} />
              <Chip label="Level" value={data.difficulty} />
              <Chip label="Measures" value={data.metricLabel} />
            </div>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              {data.setup.map((item, index) => {
                const Icon = setupIcons[index % setupIcons.length]!;
                return (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
                  <Icon className="size-4 text-primary" />
                  <h2 className="mt-3 text-sm font-semibold">{item.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                </div>
                );
              })}
            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold">Protocol</h2>
              <ol className="mt-4 space-y-3">
                {data.protocol.map((line, i) => (
                  <li key={line} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="readout text-xs text-primary">0{i + 1}</span>
                    {line}
                  </li>
                ))}
              </ol>
              <p className="mt-5 flex gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {DISCLAIMER}
              </p>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" disabled={data.status !== "available"}>
                <Link to="/assessments/$slug/record" params={{ slug: data.slug }}>
                  Continue to camera check
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/assessments">Back to library</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-border bg-card px-3 py-1.5">
      <span className="label-meta text-muted-foreground">{label} </span>
      <span className="font-medium">{value}</span>
    </span>
  );
}
