import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Camera, Cpu, Lock, ShieldCheck, Target } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SportsCarousel } from "@/components/sports/SportsCarousel";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { ASSESSMENTS, DISCLAIMER } from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SportSense AI — Discover your athletic potential" },
      {
        name: "description",
        content:
          "Assess your movement, measure your performance, and discover which sports match your athletic profile.",
      },
      { property: "og:title", content: "SportSense AI — Discover your athletic potential" },
      {
        property: "og:description",
        content: "Smartphone-based movement assessment and AI-assisted sport suitability profiling.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    index: "01 / PERFORM",
    title: "Perform",
    body: "Record standardized fitness assessments using your smartphone.",
  },
  {
    index: "02 / ANALYZE",
    title: "Analyze",
    body: "Movement and performance metrics are extracted from your assessment.",
  },
  {
    index: "03 / DISCOVER",
    title: "Discover",
    body: "Receive personalized sport suitability recommendations.",
  },
];

const features = [
  {
    icon: Camera,
    title: "Smartphone-only capture",
    body: "No wearables or lab equipment. A stationary phone camera and three metres of space.",
  },
  {
    icon: Cpu,
    title: "Standardized protocols",
    body: "Every assessment follows a fixed setup so results stay comparable over time.",
  },
  {
    icon: Activity,
    title: "Performance profile",
    body: "Explosive power, agility, balance, strength and coordination tracked in one profile.",
  },
  {
    icon: Target,
    title: "Sport suitability",
    body: "Recommendations framed as suitability ranges, never as definitive selection verdicts.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 ring-1 ring-border">
                <span className="size-2 animate-pulse rounded-full bg-primary" />
                <span className="label-meta text-foreground/70">
                  Frontend prototype — AI model not connected
                </span>
              </div>
              <h1 className="text-balance text-4xl font-semibold leading-none tracking-tight sm:text-5xl lg:text-7xl">
                Discover Your Athletic Potential
              </h1>
              <p className="mt-8 max-w-[48ch] text-pretty text-lg leading-normal text-muted-foreground">
                Assess your movement, measure your performance, and discover which sports match your
                athletic profile.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild size="lg">
                  <Link to="/onboarding">Start Assessment</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how-it-works">How It Works</a>
                </Button>
              </div>
            </div>

            <div className="relative w-full min-w-0 flex-1">
              <SportsCarousel />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col gap-4">
                <span className="font-mono text-xs font-semibold text-primary">{step.index}</span>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="max-w-[40ch] text-pretty text-sm leading-normal text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight">Key features</h2>
          <p className="mt-2 max-w-[52ch] text-muted-foreground">
            Built as an instrument, not a workout app — every screen is designed around a repeatable
            measurement.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl bg-card p-6 ring-1 ring-black/5">
                <feature.icon className="size-5 text-primary" />
                <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-normal text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="supported" className="border-y border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Supported assessments</h2>
              <p className="mt-2 text-muted-foreground">
                Vertical Jump is available now. Additional protocols are in development.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/assessments">Browse assessments</Link>
            </Button>
          </div>
          <div className="mt-10 divide-y divide-border rounded-xl bg-background ring-1 ring-black/5">
            {ASSESSMENTS.map((assessment) => (
              <div
                key={assessment.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{assessment.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{assessment.description}</p>
                </div>
                <span
                  className={
                    assessment.status === "available"
                      ? "label-meta shrink-0 rounded-full bg-accent px-2 py-1 text-accent-foreground"
                      : "label-meta shrink-0 rounded-full bg-secondary px-2 py-1"
                  }
                >
                  {assessment.status === "available" ? "Available" : "Coming soon"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Why SportSense AI</h2>
            <p className="mt-4 max-w-[52ch] text-muted-foreground">
              Talent assessment usually needs a lab, a coach and expensive hardware. SportSense AI
              turns a standard phone camera into a repeatable measurement device so athletes anywhere
              can build an objective performance profile over time.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <dt className="label-meta">Setup time</dt>
                <dd className="readout mt-1 text-2xl">2 min</dd>
              </div>
              <div>
                <dt className="label-meta">Equipment</dt>
                <dd className="readout mt-1 text-2xl">Phone only</dd>
              </div>
            </dl>
          </div>

          <div id="privacy" className="rounded-xl bg-card p-8 ring-1 ring-black/5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Privacy &amp; responsible AI</h2>
            </div>
            <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                In this prototype your recordings stay on your device — nothing is uploaded.
              </li>
              <li className="flex gap-3">
                <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                Only the minimum profile data needed to contextualise results is collected.
              </li>
              <li className="flex gap-3">
                <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
                Results are presented as suitability ranges with the reasoning shown alongside.
              </li>
            </ul>
            <p className="mt-6 border-t border-border pt-6 text-xs italic leading-normal text-muted-foreground">
              {DISCLAIMER}
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
