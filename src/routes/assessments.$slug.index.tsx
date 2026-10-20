import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Ruler, ShieldCheck, Smartphone, Sun, UserCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssessment } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ASSESSMENTS, DISCLAIMER } from "@/data/mock";
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
  const routeParams = useParams({ strict: false }) as { slug?: string };
  const slug = routeParams?.slug || "vertical-jump";
  const { biometricBaseline, faceProfile } = useAssessmentSession();
  const fallback = ASSESSMENTS.find((a) => a.slug === slug || a.id === slug) || ASSESSMENTS[0]!;

  const { data, isLoading } = useQuery({
    queryKey: ["assessment", slug],
    queryFn: () => getAssessment(slug),
    initialData: fallback,
  });

  const assessment = data || fallback;
  const setupItems = assessment.setup && assessment.setup.length > 0 ? assessment.setup : fallback.setup;
  const protocolItems = assessment.protocol && assessment.protocol.length > 0 ? assessment.protocol : fallback.protocol;

  const isEnrolled = Boolean(faceProfile?.isLocked && faceProfile?.vector);
  const enrolledName = faceProfile?.athleteName || biometricBaseline?.athleteName || "Athlete";

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && !assessment ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : (
          <>
            <p className="label-meta text-muted-foreground">Step 01 / Instructions</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{assessment.name}</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{assessment.objective}</p>

            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <Chip label="Duration" value={`${assessment.durationMinutes} min`} />
              <Chip label="Attempts" value={String(assessment.attempts)} />
              <Chip label="Level" value={assessment.difficulty} />
              <Chip label="Measures" value={assessment.metricLabel} />
            </div>

            {/* Identity Proctoring Status Banner */}
            <div
              className={`mt-6 rounded-2xl border p-4 text-xs flex items-center justify-between gap-3 shadow-sm ${
                isEnrolled
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                  : "border-primary/20 bg-primary/5 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                {faceProfile?.photoDataUrl ? (
                  <img
                    src={faceProfile.photoDataUrl}
                    alt={enrolledName}
                    className="size-11 rounded-xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                  />
                ) : (
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isEnrolled
                        ? "bg-emerald-600 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isEnrolled ? <ShieldCheck className="size-5" /> : <UserCheck className="size-5" />}
                  </div>
                )}
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>
                      {isEnrolled ? "Athlete Face Identity Enrolled" : "Phase 1: Athlete Face Registration"}
                    </span>
                    {isEnrolled && (
                      <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                        {enrolledName}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    {isEnrolled
                      ? `AI proctoring is active. This assessment must be completed by ${enrolledName}. If another person attempts this test, recording locks with a red malpractice alert and siren.`
                      : "During your first assessment, the camera automatically registers your facial biometrics. You will perform all remaining battery assessments without interruption."}
                  </p>
                </div>
              </div>
            </div>

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              {setupItems.map((item: { title: string; body: string }, index: number) => {
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
                {protocolItems.map((line: string, i: number) => (
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
              <Button asChild size="lg" disabled={assessment.status !== "available"}>
                <Link to="/assessments/$slug/record" params={{ slug: assessment.slug || slug }}>
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
