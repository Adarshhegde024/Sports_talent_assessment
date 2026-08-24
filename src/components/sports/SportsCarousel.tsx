import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SHOWCASE_SPORTS, type ShowcaseSport } from "@/data/sports";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 4500;
const RESUME_AFTER_MS = 9000;

interface SportsCarouselProps {
  sports?: ShowcaseSport[];
  className?: string;
}

export function SportsCarousel({ sports = SHOWCASE_SPORTS, className }: SportsCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = sports.length;

  const pauseThenResume = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_AFTER_MS);
  }, []);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  useEffect(() => {
    if (paused || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  const goTo = (next: number) => {
    setIndex(((next % count) + count) % count);
    pauseThenResume();
  };

  if (count === 0) return null;

  const active = sports[index]!;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={pauseThenResume}
      role="region"
      aria-roledescription="carousel"
      aria-label="Sports we assess"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-card ring-1 ring-black/5">
        {sports.map((sport, i) => (
          <img
            key={sport.id}
            src={sport.image}
            width={1024}
            height={768}
            loading={i === 0 ? "eager" : "lazy"}
            alt={`${sport.name} athlete in action`}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out",
              i === index ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={i !== index}
          />
        ))}

        {/* readability scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* framing marks, consistent with the instrument aesthetic */}
        <div className="pointer-events-none absolute inset-4 flex flex-col justify-between border border-primary/20">
          <div className="flex justify-between">
            <span className="size-5 border-l-2 border-t-2 border-primary" />
            <span className="size-5 border-r-2 border-t-2 border-primary" />
          </div>
          <div className="flex justify-between">
            <span className="size-5 border-b-2 border-l-2 border-primary" />
            <span className="size-5 border-b-2 border-r-2 border-primary" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <span className="label-meta text-primary">Sports we assess</span>
          <h3 key={active.id} className="mt-2 animate-fade-in text-2xl font-semibold text-white sm:text-3xl">
            {active.name}
          </h3>
          <p className="mt-2 hidden max-w-[42ch] text-sm leading-normal text-white/70 sm:block">
            {active.description}
          </p>
          <ul className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            {active.attributes.map((attribute) => (
              <li
                key={attribute}
                className="label-meta rounded-full bg-white/10 px-2 py-1 text-white/85 backdrop-blur-sm"
              >
                {attribute}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous sport"
          className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next sport"
          className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {sports.map((sport, i) => (
          <button
            key={sport.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show ${sport.name}`}
            aria-current={i === index}
            className="grid h-8 w-6 place-items-center focus-visible:outline-none"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-primary" : "w-1.5 bg-border",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
