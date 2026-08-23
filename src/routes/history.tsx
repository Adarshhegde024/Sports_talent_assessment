import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssessmentHistory } from "@/lib/api";

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
  component: HistoryPage,
});

function HistoryPage() {
  const history = useQuery({ queryKey: ["history"], queryFn: getAssessmentHistory });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="label-meta text-muted-foreground">Session log</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Assessment history
        </h1>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          {history.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {history.data?.map((run) => (
                <li key={run.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{run.assessmentName}</p>
                    <p className="label-meta text-muted-foreground">
                      {run.date} · {run.status}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="readout text-sm">{run.result ?? "—"}</span>
                    {run.status === "completed" ? (
                      <Link
                        to="/results/$runId"
                        params={{ runId: run.id }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
