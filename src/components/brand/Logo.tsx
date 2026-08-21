import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2", className)}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-primary">
        <span className="size-2 rounded-full bg-primary-foreground" />
      </span>
      <span className="text-sm font-semibold uppercase tracking-tight">SportSense AI</span>
    </Link>
  );
}
