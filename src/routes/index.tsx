import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Camera,
  Cpu,
  Lock,
  Play,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Video,
} from "lucide-react";
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
    step: "01",
    title: "Perform",
    body: "Record standardized fitness assessments using your smartphone.",
    icon: Video,
  },
  {
    step: "02",
    title: "Analyze",
    body: "Movement and performance metrics are extracted from your assessment.",
    icon: TrendingUp,
  },
  {
    step: "03",
    title: "Discover",
    body: "Receive personalized sport suitability recommendations that match your profile.",
    icon: Trophy,
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

import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

function Landing() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-14 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20">
        <div className="mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
            {/* Headline */}
            <h1 className="text-balance text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
              Discover Your <br />
              <span className="text-emerald-600 dark:text-emerald-400">Athletic Potential</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 max-w-2xl text-pretty text-base sm:text-lg text-muted-foreground leading-relaxed">
              Assess your movement, measure your performance, and discover which sports match your
              athletic profile.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="h-11 sm:h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }} className="flex items-center gap-2">
                    <span>Start Assessment</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="h-11 sm:h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <Link to="/login" className="flex items-center gap-2">
                    <span>Start Assessment</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 sm:h-12 px-6 rounded-xl border-border bg-card/60 hover:bg-muted font-semibold transition-all backdrop-blur-sm"
              >
                <a href="#how-it-works" className="flex items-center gap-2">
                  <Play className="size-3.5 fill-current text-muted-foreground" />
                  How It Works
                </a>
              </Button>
            </div>
          </div>

          {/* Sports Showcase Carousel (Wider and Taller Showcase) */}
          <div className="mx-auto mt-8 sm:mt-10 w-full max-w-[92rem]">
            <SportsCarousel />
          </div>

          {/* Three-step Cards underneath Carousel (matches screenshot) */}
          <div id="how-it-works" className="mx-auto mt-10 sm:mt-14 max-w-[92rem] scroll-mt-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {steps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-start gap-4 p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-xs transition-all hover:shadow-md hover:border-emerald-500/30"
                >
                  <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                    <step.icon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {step.step}
                    </span>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">{step.title}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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

      <section id="why-sportsense" className="py-20 scroll-mt-24">
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
