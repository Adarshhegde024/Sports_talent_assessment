import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative size-9 rounded-full transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-primary",
        className,
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <Sun
        className={cn(
          "size-4.5 transition-all duration-300",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 text-amber-500",
        )}
      />
      <Moon
        className={cn(
          "absolute size-4.5 transition-all duration-300",
          isDark ? "rotate-0 scale-100 opacity-100 text-emerald-400" : "-rotate-90 scale-0 opacity-0",
        )}
      />
    </Button>
  );
}
