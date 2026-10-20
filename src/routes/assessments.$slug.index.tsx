import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Ruler, ShieldCheck, Smartphone, Sun, UserCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssessment } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DISCLAIMER } from "@/data/mock";
import { useAssessmentSession } from "@/lib/assessment-session";

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
  component: () => (
    <ProtectedRoute>
      <AssessmentDetail />
    </ProtectedRoute>
  ),
});

const setupIcons = [Smartphone, Ruler, Sun];

function AssessmentDetail() {
  const { slug } = useParams({ from: "/assessments/$slug/" });
  const { biometricBaseline } = useAssessmentSession();
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

            {/* Identity Proctoring Status Banner */}
            <div
              className={`mt-6 rounded-2xl border p-4 text-xs flex items-center justify-between gap-3 shadow-sm ${
                biometricBaseline
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                  : "border-primary/20 bg-primary/5 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                    biometricBaseline
                      ? "bg-emerald-600 text-white"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {biometricBaseline ? <ShieldCheck className="size-5" /> : <UserCheck className="size-5" />}
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>{biometricBaseline ? "Athlete Biometric Integrity Locked" : "AI Anti-Proxy Proctoring Active"}</span>
                    {biometricBaseline && (
                      <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-300">
                        {biometricBaseline.athleteName}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    {biometricBaseline
                      ? `All tests in this battery must be completed by ${biometricBaseline.athleteName}. Proxy or substitute athletes will trigger an automatic malpractice lockdown & audio siren.`
                      : "The athlete taking the first assessment will be biometrically registered. Only that athlete is permitted to take subsequent assessments."}
                  </p>
                </div>
              </div>
            </div>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              {data.setup.map((item: { title: string; body: string }, index: number) => {
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
                {data.protocol.map((line: string, i: number) => (
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
