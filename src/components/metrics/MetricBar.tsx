import { cn } from "@/lib/utils";

interface MetricBarProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  tone?: "primary" | "neutral";
  className?: string;
}

export function MetricBar({
  label,
  value,
  max = 100,
  unit = "/100",
  tone = "primary",
  className,
}: MetricBarProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="readout text-3xl">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            tone === "primary" ? "bg-primary" : "bg-muted-foreground",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function SuitabilityBar({
  sport,
  score,
  emphasis = false,
}: {
  sport: string;
  score: number;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm font-medium",
            emphasis ? "text-inverse-foreground" : "text-inverse-foreground/80",
          )}
        >
          {sport}
        </span>
        <span className="readout text-sm text-primary">{score}%</span>
      </div>
      <div className="h-1 rounded-full bg-inverse-muted/30">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${score}%`, opacity: emphasis ? 1 : 0.7 }}
        />
      </div>
    </div>
  );
}
