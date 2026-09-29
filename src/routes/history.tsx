import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Camera, History, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssessmentHistory } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Assessment history — SportSense AI" },
      {
        name: "description",
        content: "Review every assessment session you've recorded and its measured result.",
      },
      { property: "og:title", content: "Assessment history — SportSense AI" },
      {
        property: "og:description",
        content: "A full log of your recorded assessments and outcomes.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <HistoryPage />
    </ProtectedRoute>
  ),
});

function HistoryPage() {
  const { user } = useAuth();
  const history = useQuery({
    queryKey: ["history", user?.id],
    queryFn: getAssessmentHistory,
    staleTime: 0,
    refetchOnMount: "always",
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="label-meta text-emerald-600 dark:text-emerald-400 font-bold">Session Log</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Assessment History</h1>
          </div>
          <Button asChild size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }} className="flex items-center gap-1.5">
              <Camera className="size-3.5" />
              <span>New Assessment</span>
            </Link>
          </Button>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {history.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : history.data && history.data.length > 0 ? (
            <ul className="divide-y divide-border">
              {history.data.map((run) => (
                <li key={run.id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{run.assessmentName}</p>
                    <p className="label-meta text-muted-foreground">
                      {run.date} · <span className="capitalize">{run.status}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="readout text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {run.result ?? "In progress"}
                    </span>
                    <Button asChild size="sm" variant="outline" className="rounded-lg h-8 text-xs">
                      <Link to="/results/$runId" params={{ runId: run.id }}>
                        View
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <History className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold">No assessments completed yet</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Record your first movement assessment to start building your personal athletic performance profile.
              </p>
              <Button asChild className="mt-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md">
                <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }} className="flex items-center gap-2">
                  <span>Record Vertical Jump</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
