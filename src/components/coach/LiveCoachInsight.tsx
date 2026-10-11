import React, { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Bot,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCoach } from "./CoachContext";
import { getApiBaseUrl } from "@/lib/api";


interface Drill {
  name: string;
  sets: string;
  focus: string;
}

interface CoachReport {
  tier?: string;
  summary?: string;
  takeoff_mechanics?: string;
  landing_mechanics?: string;
  sport_match_rationale?: string;
  prescribed_drills?: Drill[];
}

interface EngineStatus {
  ollama_online: boolean;
  active_model?: string | null;
  mode: "ollama_live" | "deterministic_fallback";
  message?: string;
  setup_command?: string;
}

interface LiveCoachInsightProps {
  assessmentSlug: string;
  athleteName?: string;
  kinematics?: Record<string, any>;
  topSport?: string;
  sportScores?: Array<{ sport: string; score: number }>;
  performanceMetrics?: Array<{ key: string; label: string; value: number; unit: string }>;
  initialExplanation?: string;
}

export function LiveCoachInsight({
  assessmentSlug,
  athleteName = "Athlete",
  kinematics = {},
  topSport = "Basketball",
  sportScores = [],
  performanceMetrics = [],
  initialExplanation,
}: LiveCoachInsightProps) {
  const { openCoach } = useCoach();
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [report, setReport] = useState<CoachReport | null>(null);
  const [showTerminalHint, setShowTerminalHint] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasAutoStarted = useRef(false);

  // 1. Fetch engine status
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await fetch(`${getApiBaseUrl()}/coach/status`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setEngineStatus(data);
        } else {
          if (isMounted) {
            setEngineStatus({
              ollama_online: false,
              mode: "deterministic_fallback",
              message: "Calibrated Olympic Biomechanics Fallback Active",
            });
          }
        }
      } catch {
        if (isMounted) {
          setEngineStatus({
            ollama_online: false,
            mode: "deterministic_fallback",
            message: "Calibrated Olympic Biomechanics Fallback Active",
          });
        }
      }
    }
    void checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Stream feedback
  const startLiveStreaming = async () => {
    setIsStreaming(true);
    setStreamedText("");
    setErrorMsg(null);

    const payload = {
      assessment_slug: assessmentSlug,
      athlete_name: athleteName,
      kinematics,
      top_sport: topSport,
      sport_scores: sportScores,
      performance_metrics: performanceMetrics,
    };

    try {
      const response = await fetch(`${getApiBaseUrl()}/coach/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to establish live streaming connection with coach engine.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "token") {
              setStreamedText((prev) => prev + parsed.content);
            } else if (parsed.type === "status") {
              if (parsed.mode === "ollama_live") {
                setEngineStatus((s) => ({
                  ollama_online: true,
                  mode: "ollama_live",
                  active_model: parsed.active_model || "qwen2.5:3b",
                }));
              }
            } else if (parsed.type === "complete" && parsed.report) {
              setReport(parsed.report);
            }
          } catch {
            // raw token text fallback
          }
        }
      }
    } catch (err: any) {
      console.warn("Live coach stream fallback:", err);
      // Fall back to clean initial text or deterministic mock
      setErrorMsg(
        "Live local socket note: Displaying pre-calibrated Olympic biomechanical synthesis."
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Auto trigger stream once on initial mount if not already streamed
  useEffect(() => {
    if (!hasAutoStarted.current) {
      hasAutoStarted.current = true;
      void startLiveStreaming();
    }
  }, [assessmentSlug]);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-xl sm:p-8">
      {/* Header with Mode Badge & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold sm:text-lg">Olympic Biomechanics Coach</h3>
              {engineStatus?.mode === "ollama_live" ? (
                <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-mono text-[10px]">
                  <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Qwen LLM ({engineStatus.active_model || "qwen2.5:3b"})
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  onClick={() => setShowTerminalHint(!showTerminalHint)}
                  className="cursor-pointer border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-[10px] hover:bg-amber-500/20"
                >
                  <span className="mr-1.5 inline-block size-1.5 rounded-full bg-amber-400" />
                  Deterministic Biomechanics Engine
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Personalized kinematic form, joint angles & sport transfer analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() =>
              openCoach(
                `Can you analyze my ${assessmentSlug.replace(/-/g, " ")} performance and give me key biomechanical takeaways?`,
                {
                  slug: assessmentSlug,
                  name: assessmentSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                  kinematics,
                  topSport,
                  sportScores,
                  performanceMetrics,
                }
              )
            }
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Bot className="size-3.5" />
            <span>Ask Coach Qwen</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTerminalHint(!showTerminalHint)}
            className="text-xs text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <Terminal className="size-3.5 mr-1" />
            Ollama Config
          </Button>

          <Button
            size="sm"
            disabled={isStreaming}
            onClick={startLiveStreaming}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md active:scale-95 transition-all"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isStreaming ? "animate-spin" : ""}`} />
            {isStreaming ? "Analyzing..." : "Re-Stream"}
          </Button>
        </div>
      </div>

      {/* Terminal Guidance Collapsible */}
      {showTerminalHint && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-zinc-300">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="flex items-center gap-2 text-amber-400 font-bold">
              <Terminal className="size-4" />
              Local Qwen LLM Setup Guide
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTerminalHint(false)}
              className="h-6 px-2 text-[10px]"
            >
              Close
            </Button>
          </div>
          <p className="mt-2 text-zinc-400">
            SportSense AI automatically connects to Ollama on{" "}
            <code className="text-emerald-400">http://localhost:11434</code>. To switch from the
            calibrated Olympic fallback to 100% offline local neural inference:
          </p>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-900 p-2.5 text-emerald-300">
            <code>ollama run qwen2.5:3b</code>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px] border-zinc-700 text-white"
              onClick={() => navigator.clipboard?.writeText("ollama run qwen2.5:3b")}
            >
              Copy
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            *No server restart required. The engine hot-detects running Ollama models on every
            assessment.
          </p>
        </div>
      )}

      {/* Real-time Streaming Area */}
      <div className="mt-5 space-y-4">
        {/* Tier Announcement Badge */}
        {report?.tier && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>{report.tier}</span>
          </div>
        )}

        {/* Narrative / Streaming Text */}
        <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-4 leading-relaxed text-sm text-zinc-200">
          {streamedText ? (
            <div className="whitespace-pre-line">
              {streamedText}
              {isStreaming && (
                <span className="inline-block size-2 ml-1 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
          ) : report?.summary ? (
            <p>{report.summary}</p>
          ) : (
            <p className="text-zinc-400">
              {initialExplanation ||
                "Analyzing kinetic chain velocity, joint flexion, and force absorption..."}
            </p>
          )}
        </div>

        {/* Form & Biomechanical Breakdown (When available) */}
        {report && (report.takeoff_mechanics || report.landing_mechanics) && (
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            {report.takeoff_mechanics && (
              <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Propulsion & Force Transfer
                </p>
                <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
                  {report.takeoff_mechanics}
                </p>
              </div>
            )}
            {report.landing_mechanics && (
              <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                  Deceleration & Eccentric Stability
                </p>
                <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
                  {report.landing_mechanics}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sport Biomechanical Transfer */}
        {report?.sport_match_rationale && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ArrowUpRight className="size-4" />
              <span>Biomechanical Transfer to {topSport}</span>
            </div>
            <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
              {report.sport_match_rationale}
            </p>
          </div>
        )}

        {/* Prescribed Conditioning Drills */}
        {report?.prescribed_drills && report.prescribed_drills.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <Dumbbell className="size-3.5 text-emerald-400" />
              <span>Recommended Biomechanical Conditioning Drills</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {report.prescribed_drills.map((drill, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-zinc-900/40 p-3.5 transition-all hover:border-emerald-500/40"
                >
                  <p className="font-semibold text-xs text-white">{drill.name}</p>
                  <p className="mt-1 font-mono text-[11px] text-emerald-400">{drill.sets}</p>
                  <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed">{drill.focus}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Assistant Banner */}
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-teal-950/40 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Bot className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Have questions or want a customized workout routine?</span>
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </p>
              <p className="text-[11px] text-zinc-400">
                Coach Qwen can build a 7-day training schedule, analyze injury risks, or explain your sport match.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() =>
              openCoach(
                `Can you create a personalized workout plan and form checklist based on my ${assessmentSlug.replace(/-/g, " ")} metrics?`,
                {
                  slug: assessmentSlug,
                  name: assessmentSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                  kinematics,
                  topSport,
                  sportScores,
                  performanceMetrics,
                }
              )
            }
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            <MessageSquare className="size-3.5" />
            <span>Chat with Coach Qwen</span>
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
