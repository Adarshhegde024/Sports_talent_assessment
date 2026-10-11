import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, History, LayoutDashboard, Settings, Target, Trophy, User } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { calculateProfileCompleteness, useAssessmentSession } from "@/lib/assessment-session";
import { useAuth } from "@/lib/auth-context";

import { CoachProvider } from "@/components/coach/CoachContext";
import { AICoachDrawer, CoachFloatingTrigger } from "@/components/coach/AICoachDrawer";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assessments", label: "Assessments", icon: Target },
  { to: "/talent-report", label: "Talent Discovery", icon: Trophy },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { profile } = useAssessmentSession();
  const { user } = useAuth();
  const displayName = profile.name || (user?.user_metadata?.["full_name"] as string) || user?.email?.split("@")[0] || "A";
  const initials = displayName.slice(0, 1).toUpperCase();
  const completeness = calculateProfileCompleteness(profile);
  const isProfileComplete = completeness >= 100;

  // Circumference of r=14 circle is 2 * PI * 14 ≈ 87.96
  const strokeDashoffset = 87.96 - (87.96 * completeness) / 100;

  return (
    <CoachProvider>
      <div className="flex min-h-screen flex-col bg-background selection:bg-emerald-500/20">
        {/* Top App Bar */}
        <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-8">
              <Logo to="/dashboard" />
              <nav className="hidden items-center gap-6 md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    activeProps={{ className: "text-foreground font-semibold" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative size-9 rounded-full">
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-emerald-500" />
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Settings" className="size-9 rounded-full">
                <Link to="/settings">
                  <Settings className="size-4" />
                </Link>
              </Button>

              {/* User Avatar */}
              {isProfileComplete ? (
                <Button asChild variant="ghost" size="icon" aria-label="Profile" className="size-9 rounded-full">
                  <Link to="/profile">
                    <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 text-xs font-bold transition-transform hover:scale-105">
                      {initials || <User className="size-3.5" />}
                    </span>
                  </Link>
                </Button>
              ) : (
                <Link
                  to="/onboarding"
                  title={`Profile ${completeness}% complete — Click to finish setup`}
                  className="group relative flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 p-1 transition-all hover:bg-amber-500/10 sm:pr-3"
                >
                  <div className="relative flex size-8 items-center justify-center">
                    {/* SVG Progress Ring */}
                    <svg className="size-8 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        className="stroke-muted"
                        strokeWidth="2.5"
                        fill="none"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        className="stroke-amber-500 dark:stroke-amber-400"
                        strokeWidth="2.5"
                        strokeDasharray={87.96}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-foreground">
                      {initials}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-[10px] font-mono font-bold leading-none text-amber-600 dark:text-amber-400">
                      {completeness}%
                    </span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pb-20 md:pb-8">{children}</main>

        {/* AI Biomechanics Coach Assistant (Option A: Bottom sheet on mobile / Slide-over on desktop) */}
        <AICoachDrawer />
        <CoachFloatingTrigger />

        {/* Mobile Android / iOS Bottom Navigation Bar (Material 3 App Bar) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border/80 bg-background/90 backdrop-blur-xl pb-safe md:hidden shadow-lg">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center py-2.5 text-[10px] font-medium text-muted-foreground transition-all active:scale-95 group"
              activeProps={{ className: "text-emerald-600 dark:text-emerald-400 font-semibold" }}
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex size-8 items-center justify-center rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 scale-105"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    <item.icon className="size-4.5" />
                  </div>
                  <span className="mt-1 leading-none truncate max-w-[64px]">{item.label}</span>
                </>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </CoachProvider>
  );
}

