import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <Logo />
          <div className="flex flex-wrap justify-center gap-8">
            <a
              href="#privacy"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </a>
            <a
              href="#privacy"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Responsible AI
            </a>
            <a
              href="#how-it-works"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Methodology
            </a>
          </div>
          <p className="label-meta">v0.1.0 — Frontend prototype</p>
        </div>
      </div>
    </footer>
  );
}
