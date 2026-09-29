import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth-context";

const links = [
  { to: "/", label: "Overview", hash: "features" },
  { to: "/", label: "How it works", hash: "how-it-works" },
  { to: "/", label: "Assessments", hash: "supported" },
  { to: "/", label: "About Us", hash: "why-sportsense" },
];

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 lg:gap-12">
          <Logo />
          <nav className="hidden items-center gap-6 sm:gap-8 md:flex">
            {links.map((link) => (
              <a
                key={link.label}
                href={`#${link.hash}`}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex text-sm font-medium text-foreground hover:text-emerald-500"
          >
            <Link to={user ? "/dashboard" : "/login"}>
              {user ? "Dashboard" : "Log in"}
            </Link>
          </Button>
          {user ? (
            <Button
              asChild
              size="sm"
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all hover:shadow-md text-xs sm:text-sm px-3 sm:px-4"
            >
              <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }} className="flex items-center gap-1.5">
                <span>Start Assessment</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all hover:shadow-md text-xs sm:text-sm px-3 sm:px-4"
            >
              <Link to="/login" className="flex items-center gap-1.5">
                <span>Start Assessment</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="grid size-9 place-items-center rounded-lg border border-border/80 bg-card text-foreground md:hidden active:scale-95 transition-transform"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer / sheet */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card/95 backdrop-blur-xl md:hidden px-6 py-5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={`#${link.hash}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-foreground/90 hover:text-emerald-500 transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-border pt-4 flex flex-col gap-3">
              <Button asChild variant="outline" className="w-full justify-center">
                <Link to={user ? "/dashboard" : "/login"} onClick={() => setMobileMenuOpen(false)}>
                  {user ? "Go to Dashboard" : "Sign In / Log In"}
                </Link>
              </Button>
              {user ? (
                <Button asChild className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link to="/assessments/$slug" params={{ slug: "vertical-jump" }} onClick={() => setMobileMenuOpen(false)}>
                    Start Assessment →
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Start Assessment →
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
