import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, Layers, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listAssessments } from "@/lib/api";

export const Route = createFileRoute("/assessments/")({
  head: () => ({
    meta: [
      { title: "Assessments — SportSense AI" },
      {
        name: "description",
        content:
          "Choose a standardized movement assessment: vertical jump, squat, balance, push-up and agility.",
      },
      { property: "og:title", content: "Assessments — SportSense AI" },
      {
        property: "og:description",
        content: "Standardized smartphone assessments for measuring athletic performance.",
      },
    ],
  }),
  component: AssessmentsPage,
});

function AssessmentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["assessments"], queryFn: listAssessments });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="label-meta text-muted-foreground">Test library</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Assessments</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each protocol is fixed so your results stay comparable between sessions. All five
          assessments are open — start with any of them.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)
            : data?.map((assessment) => {
                const available = assessment.status === "available";
                return (
                  <article
                    key={assessment.id}
                    className={`flex flex-col rounded-2xl border p-6 transition-colors ${
                      available
                        ? "border-border bg-card hover:border-primary/50"
                        : "border-dashed border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-semibold">{assessment.name}</h2>
                      {available ? (
                        <Badge>Available</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="size-3" />
                          Coming soon
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">
                      {assessment.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {assessment.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Layers className="size-3.5" />
                        {assessment.attempts} attempts
                      </span>
                      <span>{assessment.difficulty}</span>
                    </div>
                    <div className="mt-5">
                      {available ? (
                        <Button asChild className="w-full">
                          <Link to="/assessments/$slug" params={{ slug: assessment.slug }}>
                            Start
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button disabled variant="outline" className="w-full">
                          Not yet available
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
        </div>
      </div>
    </AppShell>
  );
}
