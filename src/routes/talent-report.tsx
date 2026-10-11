import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Dumbbell,
  FileCheck,
  FileDown,
  Printer,
  RefreshCw,
  Share2,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MetricBar, SuitabilityBar } from "@/components/metrics/MetricBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getComprehensiveTalentReport, ComprehensiveTalentReport } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DISCLAIMER } from "@/data/mock";

export const Route = createFileRoute("/talent-report")({
  head: () => ({
    meta: [
      { title: "Final Sport Recommendation & Talent Report — SportSense AI" },
      {
        name: "description",
        content:
          "Definitive multi-assessment talent discovery report and 4-week structured practice roadmap based on all 5 athletic tests.",
      },
      { property: "og:title", content: "Final Sport Recommendation — SportSense AI" },
      {
        property: "og:description",
        content: "Discover which sport you have the highest aptitude to practice and excel in.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <TalentReportPage />
    </ProtectedRoute>
  ),
});

function generateOfflineCertificateHtml(data: ComprehensiveTalentReport, athleteName: string): string {
  const primary = data.primarySport;
  const updateDate = data.updatedAt ? new Date(data.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : new Date().toLocaleString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SportSense AI — Official Talent Assessment Certificate — ${athleteName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 40px; color: #09090b; background: #ffffff; line-height: 1.5; }
    .certificate-border { border: 3px solid #10b981; border-radius: 20px; padding: 32px; background: #fafafa; }
    .header { border-bottom: 2px solid #e4e4e7; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 26px; font-weight: 900; color: #047857; letter-spacing: -0.5px; }
    .subtitle { font-size: 13px; color: #71717a; margin-top: 2px; }
    .badge { background: #ecfdf5; color: #047857; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 800; border: 1px solid #a7f3d0; text-transform: uppercase; }
    .meta-bar { display: flex; flex-wrap: wrap; gap: 24px; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 14px 20px; margin-bottom: 24px; font-size: 13px; }
    .hero { background: #09090b; color: #ffffff; padding: 28px; border-radius: 16px; margin-bottom: 24px; }
    .hero-eyebrow { font-size: 11px; font-weight: 800; color: #34d399; letter-spacing: 1.5px; text-transform: uppercase; }
    .hero-title { font-size: 38px; font-weight: 900; margin: 6px 0 12px; color: #ffffff; }
    .score-badge { display: inline-flex; align-items: baseline; gap: 8px; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 12px; padding: 8px 16px; margin-bottom: 16px; }
    .score-val { font-size: 32px; font-weight: 900; color: #34d399; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .card { background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; }
    .card h3 { margin: 0 0 14px; font-size: 15px; font-weight: 800; border-bottom: 1px solid #f4f4f5; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 10px; color: #71717a; border-bottom: 2px solid #f4f4f5; font-weight: 700; }
    td { padding: 9px 10px; border-bottom: 1px solid #f4f4f5; }
    .roadmap { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 10px; }
    .week-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 12px; }
    .week-title { font-weight: 800; color: #047857; margin-bottom: 6px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e4e4e7; text-align: center; font-size: 11px; color: #71717a; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="certificate-border">
    <div class="header">
      <div>
        <div class="brand">SportSense AI</div>
        <div class="subtitle">Standardized Multi-Assessment Olympic Talent Discovery Certificate</div>
      </div>
      <div>
        <span class="badge">Officially Verified & Persisted</span>
      </div>
    </div>

    <div class="meta-bar">
      <div><strong>Athlete:</strong> ${athleteName}</div>
      <div><strong>Height:</strong> ${data.athleteHeightCm || 175} cm</div>
      <div><strong>Age:</strong> ${data.age || 18} yrs</div>
      <div><strong>Standard Battery:</strong> ${data.completedCount} of ${data.totalAssessments} Tests Completed</div>
      <div><strong>Database Status:</strong> Persisted in User Record</div>
      <div><strong>Last Synced:</strong> ${updateDate}</div>
    </div>

    <div class="hero">
      <div class="hero-eyebrow">PRIMARY SPORT RECOMMENDATION</div>
      <div class="hero-title">${primary.sport}</div>
      <div class="score-badge">
        <span class="score-val">${primary.score}%</span>
        <span>Compatibility Match • ${primary.tier}</span>
      </div>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #d4d4d8;">${data.summary}</p>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <h3>Standardized 5-Movement Kinematic Assessment Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Movement Assessment</th>
            <th>Measured Kinematic Value</th>
            <th>Target Trait</th>
            <th>Recorded Date</th>
            <th>Database Status</th>
          </tr>
        </thead>
        <tbody>
          ${(data.latestAssessmentResults || []).map((r) => `
            <tr>
              <td><strong>${r.name}</strong></td>
              <td><strong style="color: #047857;">${r.value}</strong></td>
              <td>${r.label}</td>
              <td>${r.date}</td>
              <td><span style="color: #059669; font-weight: bold;">${r.completed ? "✓ Active Result" : "Baseline"}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>5-Trait Biomechanical Performance Scores</h3>
        <table>
          <tbody>
            ${data.metrics.map((m) => `
              <tr>
                <td>${m.label}</td>
                <td><strong style="color: #047857;">${m.value} / 100</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>Multi-Sport Machine Learning Aptitude Rankings</h3>
        <table>
          <tbody>
            ${data.sportScores.map((s, idx) => `
              <tr>
                <td>${idx + 1}. ${s.sport}</td>
                <td><strong>${s.score}%</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <h3>4-Week Structured Practice Roadmap for ${primary.sport}</h3>
      <div class="roadmap">
        ${data.practiceRoadmap.map((w) => `
          <div class="week-card">
            <div class="week-title">${w.week}: ${w.focus}</div>
            <div>${w.drills}</div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="card">
      <h3>Prescribed Developmental Drills</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px;">
        ${data.developmentalDrills.map((d) => `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px;">
            <strong>${d.name}</strong>
            <div style="color: #047857; font-weight: bold; margin: 4px 0;">${d.sets}</div>
            <div style="color: #64748b;">${d.focus}</div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="footer">
      SportSense AI Biomechanical Intelligence Protocol • Olympic Talent Discovery Framework<br>
      Notice: This report is dynamically updated in the athlete database whenever standardized assessments are re-tested with new video datasets.<br>
      Disclaimer: Field screening tool for developmental athletic pathways. Not medical diagnostic equipment.
    </div>
  </div>
</body>
</html>`;
}

function TalentReportPage() {
  const { user } = useAuth();
  const reportQuery = useQuery({
    queryKey: ["comprehensiveTalentReport", user?.id],
    queryFn: getComprehensiveTalentReport,
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (reportQuery.isLoading || !reportQuery.data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  const data = reportQuery.data;
  const primary = data.primarySport;
  const isComplete = data.isComplete;
  const athleteName = data.athleteName || user?.user_metadata?.["full_name"] || user?.email?.split("@")[0] || "Athlete";
  const updatedDateStr = data.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `SportSense_Official_Talent_Report_${athleteName.replace(/\s+/g, "_")}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleDownloadHtml = () => {
    const html = generateOfflineCertificateHtml(data, athleteName);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SportSense_Official_Talent_Report_${athleteName.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SportSense_Talent_Data_${athleteName.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      {/* Dedicated Print & PDF Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm;
          }
          body {
            background: #ffffff !important;
            color: #09090b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, header, footer, .no-print, button, .chat-widget, [data-sidebar], [role="navigation"] {
            display: none !important;
          }
          .print-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="size-3.5 text-emerald-500" />
                <span>Multi-Assessment 5-Trait Synthesis</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Database className="size-3 text-emerald-500" />
                <span>Persisted in User Database</span>
              </div>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Comprehensive Talent Discovery & Final Sport Recommendation
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <span className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold">
              Battery Progress: <strong className="text-emerald-600 dark:text-emerald-400">{data.completedCount} of {data.totalAssessments} Tests</strong>
            </span>
            <Button
              onClick={handleDownloadPdf}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md h-9"
            >
              <Download className="size-3.5 mr-1.5" />
              <span>Download Report (PDF)</span>
            </Button>
            <Button
              onClick={handleDownloadHtml}
              variant="outline"
              className="rounded-xl text-xs h-9 font-semibold"
            >
              <FileDown className="size-3.5 mr-1.5" />
              <span>Download Certificate (HTML)</span>
            </Button>
          </div>
        </div>

        {/* Athlete Info Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <User className="size-3.5 text-emerald-500" />
              <strong>{athleteName}</strong>
            </span>
            <span>Height: <strong>{data.athleteHeightCm || 175} cm</strong></span>
            <span>Age: <strong>{data.age || 18} yrs</strong></span>
            <span>Fitness: <strong className="capitalize">{data.fitnessLevel || "Recreational"}</strong></span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Clock className="size-3 text-emerald-500" />
            <span>Last Updated: {updatedDateStr}</span>
          </div>
        </div>

        {/* Incomplete Battery Notice (if applicable) */}
        {!isComplete && (
          <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-950 dark:text-amber-200 no-print">
            <div className="flex items-start gap-3">
              <Award className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Preliminary Recommendation ({data.completedCount}/{data.totalAssessments} Tests Completed)</h3>
                <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                  You have completed {data.completedCount} out of 5 standardized movement assessments. Complete the remaining {data.missingAssessments.length} {data.missingAssessments.length === 1 ? "assessment" : "assessments"} to fully calibrate your 5-trait biomechanical fingerprint and unlock your 100% verified Olympic coaching report.
                </p>
                {data.missingAssessments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.missingAssessments.map((missing) => (
                      <Button
                        key={missing.slug}
                        asChild
                        size="sm"
                        className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 font-semibold"
                      >
                        <Link to="/assessments/$slug" params={{ slug: missing.slug }}>
                          <span>Take {missing.name}</span>
                          <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* HERO SECTION: THE ONE DEFINITIVE RECOMMENDED SPORT */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-2xl sm:p-10 border border-white/10 relative print-break-avoid">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 size-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1 text-xs font-bold text-emerald-300">
                <Trophy className="size-4 text-amber-400" />
                <span>PRIMARY SPORT RECOMMENDATION</span>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs font-semibold text-zinc-300">
                {primary.tier}
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr] items-center">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Recommended Sport to Practice & Excel In</p>
                <h2 className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {primary.sport}
                </h2>
                <p className="mt-4 text-sm text-zinc-300 leading-relaxed max-w-xl">
                  {data.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-4 items-center">
                  <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-md">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Overall Compatibility</p>
                    <p className="readout mt-0.5 text-2xl font-extrabold text-emerald-400">{primary.score}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-md">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Assessed Traits</p>
                    <p className="readout mt-0.5 text-2xl font-extrabold text-white">5 / 5 Core Dimensions</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Target className="size-4 text-emerald-400" />
                  <span>Key Biomechanical Advantages</span>
                </h3>
                <ul className="mt-3 space-y-2.5 text-xs text-zinc-300">
                  {data.biomechanicalAdvantages.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span className="leading-snug">{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5-MOVEMENT STANDARDIZED ASSESSMENT BREAKDOWN */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm print-break-avoid">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold">Standardized 5-Movement Assessment Breakdown</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest kinematic recordings across the 5 standardized tests. Re-taking tests with new video datasets automatically updates previous results here and refreshes your final recommendation in the database.
              </p>
            </div>
            <div className="no-print">
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs h-8">
                <Link to="/assessments">
                  <RefreshCw className="size-3 mr-1.5" />
                  <span>Re-Test Assessments</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground">
                  <th className="pb-3 font-semibold">Movement Assessment</th>
                  <th className="pb-3 font-semibold">Measured Kinematic Value</th>
                  <th className="pb-3 font-semibold">Assessed Dimension</th>
                  <th className="pb-3 font-semibold">Latest Record Date</th>
                  <th className="pb-3 font-semibold">Database Status</th>
                  <th className="pb-3 font-semibold text-right no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(data.latestAssessmentResults || []).map((item) => (
                  <tr key={item.slug} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 font-bold text-foreground flex items-center gap-2">
                      <span className={`size-2 rounded-full ${item.completed ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {item.value}
                    </td>
                    <td className="py-3.5 text-muted-foreground">{item.label}</td>
                    <td className="py-3.5 text-muted-foreground font-mono text-[11px]">{item.date}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        <span>{item.completed ? "Updated & Active" : "Baseline"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-right no-print">
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs font-semibold hover:text-emerald-600">
                        <Link to="/assessments/$slug" params={{ slug: item.slug }}>
                          <span>Re-Test</span>
                          <ArrowRight className="size-3 ml-1" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5-TRAIT ATHLETIC PROFILE & SECONDARY PATHWAYS */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] print-break-avoid">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">5-Trait Athletic Profile</h3>
              <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                All 5 Tests Aggregated
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Integrated kinematic measurements across Explosive Power, Strength, Balance, Agility, and Coordination.
            </p>

            <div className="mt-6 space-y-4">
              {data.metrics.map((m) => (
                <MetricBar key={m.key} label={m.label} value={m.value} unit={m.unit} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-bold">Multi-Sport Aptitude Rankings</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Machine Learning ranking across all 6 calibrated sporting archetypes.
            </p>

            <div className="mt-6 space-y-3.5">
              {data.sportScores.map((item, idx) => (
                <SuitabilityBar
                  key={item.sport}
                  sport={item.sport}
                  score={item.score}
                  emphasis={idx === 0}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 4-WEEK STRUCTURED PRACTICE ROADMAP */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm print-break-avoid">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold">4-Week Structured Practice Roadmap for {primary.sport}</h3>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">Specialization Plan</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Follow this progressive developmental plan to build technical skills, power, and physical conditioning tailored to {primary.sport}.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.practiceRoadmap.map((weekItem, idx) => (
              <div
                key={weekItem.week}
                className="rounded-xl border border-border/80 bg-muted/30 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span>{weekItem.week}</span>
                  </div>
                  <h4 className="mt-2 font-bold text-sm">{weekItem.focus}</h4>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{weekItem.drills}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Target: Phase {idx + 1}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">3–4 Sessions/wk</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRESCRIBED DEVELOPMENTAL DRILLS */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm print-break-avoid">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold">Targeted Skill & Conditioning Drills</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Execute these high-impact drills to address weak links and enhance key sport-specific movement patterns.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {data.developmentalDrills.map((drill) => (
              <div key={drill.name} className="rounded-xl border border-border/80 bg-muted/40 p-4">
                <p className="font-bold text-sm">{drill.name}</p>
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  {drill.sets}
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{drill.focus}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-6 text-xs text-muted-foreground">{DISCLAIMER}</p>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-wrap gap-3 no-print">
          <Button
            onClick={handleDownloadPdf}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
          >
            <Download className="size-4 mr-1.5" />
            <span>Download Official Report (PDF)</span>
          </Button>
          <Button
            onClick={handleDownloadHtml}
            variant="outline"
            className="rounded-xl font-semibold"
          >
            <FileDown className="size-4 mr-1.5" />
            <span>Save Certificate File (HTML)</span>
          </Button>
          <Button
            onClick={handleExportJson}
            variant="outline"
            className="rounded-xl font-semibold"
          >
            <Share2 className="size-4 mr-1.5" />
            <span>Export Athlete JSON</span>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/assessments">Re-Test Movement Battery</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
