import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import {
  Activity,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Flame,
  Scale,
  Shield,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { SHOWCASE_SPORTS, type ShowcaseSport } from "@/data/sports";
import { useAssessmentSession } from "@/lib/assessment-session";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 3000; // Auto-scroll every 3 seconds

interface SportsCarouselProps {
  sports?: ShowcaseSport[];
  className?: string;
  prioritizePreferred?: boolean;
}

function getAttributeIcon(attribute: string) {
  const lower = attribute.toLowerCase();
  if (lower.includes("explosive") || lower.includes("power")) return Zap;
  if (lower.includes("vertical") || lower.includes("jump")) return ArrowUp;
  if (lower.includes("agility") || lower.includes("running")) return Activity;
  if (lower.includes("coordination")) return Target;
  if (lower.includes("reaction")) return Timer;
  if (lower.includes("balance") || lower.includes("body control")) return Scale;
  if (lower.includes("acceleration")) return Flame;
  return Shield;
}

export function SportsCarousel({
  sports = SHOWCASE_SPORTS,
  className,
  prioritizePreferred = true,
}: SportsCarouselProps) {
  const { profile } = useAssessmentSession();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Prioritize sports based on user's preferred sports from onboarding/profile if available
  const displaySports = useMemo(() => {
    if (!prioritizePreferred || !profile?.preferredSports?.length) {
      return sports;
    }
    const preferredLower = profile.preferredSports.map((s) => s.toLowerCase());
    return [...sports].sort((a, b) => {
      const aMatch = preferredLower.includes(a.name.toLowerCase()) || preferredLower.includes(a.id.toLowerCase());
      const bMatch = preferredLower.includes(b.name.toLowerCase()) || preferredLower.includes(b.id.toLowerCase());
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [sports, profile?.preferredSports, prioritizePreferred]);

  const count = displaySports.length;

  // Reliable 3-second continuous auto-scroll
  useEffect(() => {
    if (count < 2) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [count, index]); // reset timer on manual index change so user gets full 3s

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goTo(index + 1); // Swipe left -> next
      } else {
        goTo(index - 1); // Swipe right -> prev
      }
    }
    touchStartX.current = null;
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goTo, index]);

  if (count === 0) return null;

  return (
    <div
      className={cn("group relative w-full select-none", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Sports we assess"
    >
      <div className="relative aspect-[4/5] xs:aspect-[1/1] sm:aspect-[16/10] md:aspect-[16/9] lg:aspect-[1.8/1] xl:aspect-[1.95/1] min-h-[500px] xs:min-h-[540px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[820px] xl:min-h-[880px] w-full overflow-hidden rounded-2xl sm:rounded-[3rem] bg-zinc-950 ring-1 ring-border/80 dark:ring-white/10 shadow-2xl">
        {/* Horizontal sliding track */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {displaySports.map((sport, i) => {
            const formattedIndex = String(i + 1).padStart(2, "0");
            const formattedTotal = String(count).padStart(2, "0");
            return (
              <div key={sport.id} className="relative min-w-full h-full shrink-0 overflow-hidden">
                <img
                  src={sport.image}
                  width={1600}
                  height={900}
                  loading={i === 0 ? "eager" : "lazy"}
                  alt={`${sport.name} athlete in action`}
                  className="absolute inset-0 size-full object-cover"
                />

                {/* Cinematic dark gradients for crisp readability in both light & dark themes */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/25" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/25 to-transparent" />

                {/* Top-left counter (e.g. 01 / 06) */}
                <div className="absolute left-4 top-4 sm:left-10 sm:top-10 lg:left-14 lg:top-12 z-10">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-base font-bold tracking-wider">
                    <span className="text-emerald-400 font-extrabold">{formattedIndex}</span>
                    <span className="text-white/40">/ {formattedTotal}</span>
                  </span>
                </div>

                {/* Sport details and circular attribute badges */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-10 md:p-14 lg:p-16">
                  <div className="max-w-2xl">
                    <h3 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
                      {sport.name}
                    </h3>
                    <p className="mt-2 sm:mt-4 max-w-[55ch] text-xs sm:text-base md:text-lg leading-relaxed text-white/85 drop-shadow-sm font-normal">
                      {sport.description}
                    </p>

                    {/* Circular attribute icons matching screenshot - responsive grid on mobile, flex on tablet/desktop */}
                    <div className="mt-5 sm:mt-8 grid grid-cols-2 xs:grid-cols-4 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6 md:gap-8">
                      {sport.attributes.map((attr) => {
                        const IconComponent = getAttributeIcon(attr);
                        return (
                          <div key={attr} className="flex flex-row sm:flex-col items-center gap-2 group/item">
                            <div className="flex size-9 sm:size-14 md:size-16 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-emerald-400 backdrop-blur-md transition-all duration-300 group-hover/item:border-emerald-400 group-hover/item:scale-110 shadow-sm">
                              <IconComponent className="size-4 sm:size-6 md:size-7" />
                            </div>
                            <span className="text-[10px] sm:text-xs md:text-sm font-medium tracking-tight text-white/90 text-left sm:text-center whitespace-normal sm:whitespace-nowrap">
                              {attr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Circular Prev/Next Buttons with touch-friendly 44px+ hit areas */}
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous sport"
          className="absolute left-2.5 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 grid size-10 sm:size-14 lg:size-16 place-items-center rounded-full bg-white/95 dark:bg-card/95 text-foreground shadow-2xl ring-1 ring-black/10 dark:ring-white/10 backdrop-blur transition-all duration-200 hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <ChevronLeft className="size-5 sm:size-7 lg:size-8 text-foreground" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next sport"
          className="absolute right-2.5 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 grid size-10 sm:size-14 lg:size-16 place-items-center rounded-full bg-white/95 dark:bg-card/95 text-foreground shadow-2xl ring-1 ring-black/10 dark:ring-white/10 backdrop-blur transition-all duration-200 hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <ChevronRight className="size-5 sm:size-7 lg:size-8 text-foreground" />
        </button>

        {/* Center-bottom indicator pills */}
        <div className="absolute inset-x-0 bottom-3 sm:bottom-6 z-20 flex items-center justify-center gap-1.5 sm:gap-2.5">
          {displaySports.map((sport, i) => (
            <button
              key={sport.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${sport.name}`}
              aria-current={i === index}
              className="py-2 px-1 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "block h-1.5 sm:h-2.5 rounded-full transition-all duration-300",
                  i === index ? "w-6 sm:w-12 bg-emerald-500 shadow-sm" : "w-1.5 sm:w-2.5 bg-white/40 hover:bg-white/70",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
