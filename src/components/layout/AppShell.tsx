import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Settings, User } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAssessmentSession } from "@/lib/assessment-session";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assessments", label: "Assessments" },
  { to: "/history", label: "History" },
  { to: "/profile", label: "Profile" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { profile } = useAssessmentSession();
  const initials = profile.name.slice(0, 1).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-8">
            <Logo to="/dashboard" />
            <nav className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "text-foreground" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Settings">
              <Link to="/settings">
                <Settings className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Profile">
              <Link to="/profile">
                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                  {initials || <User className="size-3.5" />}
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <nav className="sticky bottom-0 z-50 grid grid-cols-4 border-t border-border bg-card md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="py-3 text-center text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
