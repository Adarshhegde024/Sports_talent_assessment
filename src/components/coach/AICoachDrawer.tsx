import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Dumbbell,
  ShieldCheck,
  Target,
  Trophy,
  ArrowRight,
  Flame,
  Zap,
  BarChart2,
  Copy,
  Check,
  Download,
  Award,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCoach } from "./CoachContext";
import { useAssessmentSession } from "@/lib/assessment-session";
import { getAssessmentHistory, getApiBaseUrl } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface BenchmarkStandard {
  slug: string;
  name: string;
  shortName: string;
  unit: string;
  metricLabel: string;
  defaultValue: number;
  tiers: { name: string; range: string }[];
  getPercent: (val: number) => number;
  getTier: (val: number) => { tier: string; badgeColor: string; gapText: string };
}

const BENCHMARK_STANDARDS: BenchmarkStandard[] = [
  {
    slug: "vertical-jump",
    name: "Vertical Jump",
    shortName: "Jump",
    unit: "cm",
    metricLabel: "Explosive Displacement",
    defaultValue: 52.4,
    tiers: [
      { name: "Beginner", range: "< 40 cm" },
      { name: "Trained", range: "40 – 52 cm" },
      { name: "State/College", range: "52 – 65 cm" },
      { name: "Olympic", range: "65+ cm" },
    ],
    getPercent: (val: number) => Math.min(100, Math.max(5, (val / 70) * 100)),
    getTier: (val: number) => {
      if (val >= 65) {
        return {
          tier: "Olympic / Elite Tier",
          badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          gapText: "🏆 Top 1% Olympic Standard achieved! Maintain RFD stiffness.",
        };
      }
      if (val >= 52) {
        const gap = (65 - val).toFixed(1);
        return {
          tier: "State / College Tier",
          badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
          gapText: `+${gap} cm needed to reach Olympic Standard (65 cm)`,
        };
      }
      if (val >= 40) {
        const gap = (52 - val).toFixed(1);
        return {
          tier: "Trained Tier",
          badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
          gapText: `+${gap} cm needed for State / College Tier (52 cm)`,
        };
      }
      const gap = (40 - val).toFixed(1);
      return {
        tier: "Beginner Tier",
        badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        gapText: `+${gap} cm needed to reach Trained Tier (40 cm)`,
      };
    },
  },
  {
    slug: "squat",
    name: "Squat Depth",
    shortName: "Squat",
    unit: "°",
    metricLabel: "Knee Flexion Angle",
    defaultValue: 88.0,
    tiers: [
      { name: "Beginner", range: "> 105°" },
      { name: "Trained", range: "90° – 105°" },
      { name: "State/College", range: "80° – 90°" },
      { name: "Olympic ATG", range: "< 80°" },
    ],
    getPercent: (val: number) => Math.min(100, Math.max(5, ((120 - val) / 50) * 100)),
    getTier: (val: number) => {
      if (val <= 80) {
        return {
          tier: "Olympic ATG Tier",
          badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          gapText: "🏆 Full Olympic ATG Depth achieved with superior hip mobility!",
        };
      }
      if (val <= 90) {
        const gap = (val - 80).toFixed(1);
        return {
          tier: "State / College Tier",
          badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
          gapText: `${gap}° deeper flexion to reach Olympic ATG (<80°)`,
        };
      }
      if (val <= 105) {
        const gap = (val - 90).toFixed(1);
        return {
          tier: "Trained Tier",
          badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
          gapText: `${gap}° deeper knee angle to break parallel (90°)`,
        };
      }
      const gap = (val - 105).toFixed(1);
      return {
        tier: "Beginner Tier",
        badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        gapText: `${gap}° deeper flexion needed to reach parallel depth`,
      };
    },
  },
  {
    slug: "single-leg-balance",
    name: "Single-Leg Balance",
    shortName: "Balance",
    unit: "s",
    metricLabel: "Postural Stability Hold",
    defaultValue: 34.0,
    tiers: [
      { name: "Beginner", range: "< 15s" },
      { name: "Trained", range: "15 – 30s" },
      { name: "State/College", range: "30 – 50s" },
      { name: "Olympic Elite", range: "50s+" },
    ],
    getPercent: (val: number) => Math.min(100, Math.max(5, (val / 60) * 100)),
    getTier: (val: number) => {
      if (val >= 50) {
        return {
          tier: "Olympic Elite Tier",
          badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          gapText: "🏆 Olympic single-leg stability and vestibular control!",
        };
      }
      if (val >= 30) {
        const gap = (50 - val).toFixed(1);
        return {
          tier: "State / College Tier",
          badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
          gapText: `+${gap}s hold needed to reach Olympic Elite Tier (50s)`,
        };
      }
      if (val >= 15) {
        const gap = (30 - val).toFixed(1);
        return {
          tier: "Trained Tier",
          badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
          gapText: `+${gap}s hold needed for State / College Tier (30s)`,
        };
      }
      const gap = (15 - val).toFixed(1);
      return {
        tier: "Beginner Tier",
        badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        gapText: `+${gap}s hold needed to enter Trained Tier (15s)`,
      };
    },
  },
  {
    slug: "push-up",
    name: "Push-Up Endurance",
    shortName: "Push-Up",
    unit: "reps",
    metricLabel: "Strict Cadence Repetitions",
    defaultValue: 28,
    tiers: [
      { name: "Beginner", range: "< 15" },
      { name: "Trained", range: "15 – 28" },
      { name: "State/College", range: "29 – 44" },
      { name: "Olympic Elite", range: "45+" },
    ],
    getPercent: (val: number) => Math.min(100, Math.max(5, (val / 50) * 100)),
    getTier: (val: number) => {
      if (val >= 45) {
        return {
          tier: "Olympic Elite Tier",
          badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          gapText: "🏆 Elite upper-body pushing endurance & core stability!",
        };
      }
      if (val >= 29) {
        const gap = 45 - val;
        return {
          tier: "State / College Tier",
          badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
          gapText: `+${gap} reps needed to reach Olympic Elite Standard (45 reps)`,
        };
      }
      if (val >= 15) {
        const gap = 29 - val;
        return {
          tier: "Trained Tier",
          badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
          gapText: `+${gap} reps needed for State / College Tier (29 reps)`,
        };
      }
      const gap = 15 - val;
      return {
        tier: "Beginner Tier",
        badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        gapText: `+${gap} reps needed to reach Trained Tier (15 reps)`,
      };
    },
  },
  {
    slug: "side-to-side-agility",
    name: "Side-to-Side Agility",
    shortName: "Agility",
    unit: "taps",
    metricLabel: "Lateral Change of Direction",
    defaultValue: 34,
    tiers: [
      { name: "Beginner", range: "< 20" },
      { name: "Trained", range: "20 – 30" },
      { name: "State/College", range: "31 – 42" },
      { name: "Olympic Elite", range: "42+" },
    ],
    getPercent: (val: number) => Math.min(100, Math.max(5, (val / 48) * 100)),
    getTier: (val: number) => {
      if (val >= 42) {
        return {
          tier: "Olympic Elite Tier",
          badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          gapText: "🏆 Elite lateral reaction tempo and rapid deceleration braking!",
        };
      }
      if (val >= 31) {
        const gap = 42 - val;
        return {
          tier: "State / College Tier",
          badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
          gapText: `+${gap} line taps needed to reach Olympic Elite Standard (42 taps)`,
        };
      }
      if (val >= 20) {
        const gap = 31 - val;
        return {
          tier: "Trained Tier",
          badgeColor: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
          gapText: `+${gap} line taps needed for State / College Tier (31 taps)`,
        };
      }
      const gap = 20 - val;
      return {
        tier: "Beginner Tier",
        badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        gapText: `+${gap} line taps needed to enter Trained Tier (20 taps)`,
      };
    },
  },
];

const DEFAULT_GREETING =
  "Hello! I am **Coach Qwen**, your personal Olympic Biomechanics & Sports Science Coach. " +
  "I have analyzed your movement kinematic data, joint alignment, and athletic traits. " +
  "Ask me anything about your form, how to increase your scores, or ask for a customized 7-day training plan!";

export function AICoachDrawer() {
  const {
    isOpen,
    closeCoach,
    activeContext,
    queuedPrompt,
    clearQueuedPrompt,
  } = useCoach();

  const { profile } = useAssessmentSession();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "assistant",
      content: DEFAULT_GREETING,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showBenchmarks, setShowBenchmarks] = useState(false);
  const [selectedBenchmarkSlug, setSelectedBenchmarkSlug] = useState<string>("vertical-jump");
  const [copiedRoutineId, setCopiedRoutineId] = useState<string | null>(null);

  const [engineStatus, setEngineStatus] = useState<{
    ollama_online: boolean;
    cloud_online?: boolean;
    active_model?: string;
    mode: "ollama_live" | "cloud_llm" | "deterministic_fallback";
    message?: string;
  }>({
    ollama_online: false,
    mode: "deterministic_fallback",
  });

  const [historySummary, setHistorySummary] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync selected benchmark with active assessment context
  useEffect(() => {
    if (activeContext?.slug) {
      setSelectedBenchmarkSlug(activeContext.slug);
    }
  }, [activeContext?.slug]);

  // 1. Fetch Engine Status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/coach/status`);
      if (res.ok) {
        const data = await res.json();
        setEngineStatus(data);
      }
    } catch {
      setEngineStatus({ ollama_online: false, mode: "deterministic_fallback" });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void checkStatus();
      void getAssessmentHistory()
        .then((runs) => setHistorySummary(runs))
        .catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, checkStatus]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Handle Queued Prompt
  useEffect(() => {
    if (queuedPrompt && isOpen) {
      const promptToSend = queuedPrompt;
      clearQueuedPrompt();
      void handleSendMessage(promptToSend);
    }
  }, [queuedPrompt, isOpen]);

  // Biomechanical Benchmark Athlete Value Extractor
  const getAthleteBenchmarkVal = (slug: string): number => {
    if (activeContext?.slug === slug && activeContext?.headlineValue !== undefined) {
      const num = parseFloat(String(activeContext.headlineValue));
      if (!isNaN(num)) return num;
    }
    if (historySummary && historySummary.length > 0) {
      const found = historySummary.find((h: any) => {
        const hSlug = (h.slug || h.assessmentSlug || "").toLowerCase();
        const hName = (h.name || h.assessmentName || "").toLowerCase();
        return (
          hSlug.includes(slug) ||
          (slug === "vertical-jump" && hName.includes("jump")) ||
          (slug === "squat" && hName.includes("squat")) ||
          (slug === "single-leg-balance" && hName.includes("balance")) ||
          (slug === "push-up" && hName.includes("push")) ||
          (slug === "side-to-side-agility" && hName.includes("agility"))
        );
      });
      if (found) {
        const val = found.val ?? found.headlineValue ?? found.result;
        const num = parseFloat(String(val));
        if (!isNaN(num)) return num;
      }
    }
    const standard = BENCHMARK_STANDARDS.find((b) => b.slug === slug);
    return standard ? standard.defaultValue : 50;
  };

  // Workout Routine Detection & Export (Option 2)
  const isWorkoutRoutine = (text: string): boolean => {
    const lower = text.toLowerCase();
    const hasDayMarkers =
      /day\s*[1-7]|week\s*[1-4]|routine|workout\s*plan|training\s*schedule|warm-up|sets\s*[×x]\s*reps|mobility\s*day|progression/i.test(
        lower
      );
    return hasDayMarkers && text.length > 180;
  };

  const handleCopyRoutine = (id: string, content: string) => {
    void navigator.clipboard.writeText(content);
    setCopiedRoutineId(id);
    setTimeout(() => setCopiedRoutineId(null), 2500);
  };

  const handleDownloadRoutine = (content: string) => {
    const athleteName = profile.name || "Athlete";
    const filename = `Coach_Qwen_Workout_Routine_${athleteName.replace(/\s+/g, "_")}.md`;
    const header = `# Coach Qwen Biomechanical Training Routine\n**Athlete:** ${athleteName}\n**Date Generated:** ${new Date().toLocaleDateString()}\n**Engine:** 24/7 Groq Cloud Qwen 3.8-27B / Olympic Biomechanics\n\n---\n\n`;
    const blob = new Blob([header + content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dynamic Suggestion Chips based on active assessment (with Option 2 & 3 triggers)
  const getSuggestions = () => {
    const slug = activeContext?.slug || "vertical-jump";
    if (slug === "vertical-jump") {
      return [
        { label: "📋 7-Day Jump Routine", prompt: "Create a customized 7-day training schedule to increase my vertical displacement and RFD with daily exercises, sets, reps, and kinetic cues." },
        { label: "🏋️ 14-Day Power Plan", prompt: "Generate a 14-day progressive kinetic chain training plan focusing on Rate of Force Development and reactive plyometrics." },
        { label: "📊 Gap to Olympic Tier", prompt: "Compare my vertical jump against Olympic and collegiate benchmarks. What exact mechanical adjustments do I need to reach 65+ cm?" },
        { label: "🚀 Add 5 cm to Jump", prompt: "How can I add 5 cm to my vertical jump using reactive plyometrics and ankle stiffness?" },
        { label: "🩹 Check Landing & ACL Risk", prompt: "What does my landing deceleration and symmetry indicate for injury risk?" },
        { label: "🏐 Why is Volleyball my match?", prompt: "Why does my jump kinetic profile match Volleyball and Basketball?" },
      ];
    } else if (slug === "squat") {
      return [
        { label: "📋 7-Day Squat Routine", prompt: "Create a 7-day squat mobility and strength training schedule to safely break parallel with full athletic control." },
        { label: "🏋️ 14-Day Leg Drive Plan", prompt: "Give me a 14-day lower body power routine to develop explosive bilateral leg drive." },
        { label: "📊 Gap to Olympic ATG", prompt: "How does my squat depth compare to Olympic ATG standards? What cues will help me reach sub-80 degree knee flexion?" },
        { label: "🦵 Reach 90° Parallel Depth", prompt: "How can I safely increase my squat depth angle without heel lift or lumbar flex?" },
        { label: "🛡️ Fix Knee Cave / Valgus", prompt: "How do I activate my glutes and adductors to prevent knee valgus during deep squats?" },
      ];
    } else if (slug === "single-leg-balance") {
      return [
        { label: "📋 7-Day Balance Routine", prompt: "Create a 7-day proprioceptive balance schedule to achieve 50+ seconds of single-leg hold stability." },
        { label: "📊 Olympic Balance Standard", prompt: "Compare my postural stability against Olympic athlete standards. What neuromuscular drills build micro-sway resilience?" },
        { label: "🦶 Foot Tripod Stability", prompt: "What drills can I do to improve foot tripod stability and vestibular balance?" },
        { label: "⚖️ Fix Left-Right Asymmetry", prompt: "How do I correct unilateral balance asymmetry between my left and right legs?" },
      ];
    } else if (slug === "push-up") {
      return [
        { label: "📋 7-Day Push-Up Routine", prompt: "Create a 7-day progressive push-up volume schedule using grease-the-groove and core anti-extension cues." },
        { label: "📊 Gap to Elite Tier (45+)", prompt: "How does my upper-body endurance compare against elite collegiate athletic standards? How do I reach 45+ strict cadence reps?" },
        { label: "💪 Reach 30+ Strict Reps", prompt: "What is the best grease-the-groove strategy to increase push-up rep endurance?" },
        { label: "📐 Elbow 45° Form Cues", prompt: "How do I maintain strict 45-degree elbow alignment to protect shoulder health?" },
      ];
    } else if (slug === "side-to-side-agility") {
      return [
        { label: "📋 7-Day Agility Routine", prompt: "Create a 7-day lateral quickness and change-of-direction training schedule with deceleration drills." },
        { label: "📊 Olympic Agility Benchmark", prompt: "How does my lateral line shuttle score compare to elite sport standards? How do I break 42+ taps?" },
        { label: "⚡ Quicker Line Contacts", prompt: "How can I lower ground contact time during lateral change-of-direction shuttles?" },
        { label: "👟 Deceleration Braking Power", prompt: "What eccentric drills build explosive deceleration and directional speed?" },
      ];
    }
    return [
      { label: "📋 7-Day Training Plan", prompt: "Create a 7-day athletic workout blueprint for my fitness tier with daily sets, reps, and kinetic cues." },
      { label: "🏋️ 14-Day Kinetic Routine", prompt: "Generate a 14-day training plan focusing on Rate of Force Development, joint alignment, and active recovery." },
      { label: "📊 Biomechanical Benchmark", prompt: "Compare my overall athletic test battery against Olympic and elite collegiate standards." },
      { label: "🛡️ Injury Prevention Cues", prompt: "What joint protection and deceleration mechanics should I prioritize based on my movement data?" },
    ];
  };

  // Send Message & Stream Response
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isStreaming) return;

    setInputText("");

    const userMsg: Message = {
      id: "u_" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantMsgId = "a_" + Date.now();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages([...updatedHistory, assistantMsg]);
    setIsStreaming(true);

    const effectiveAssessment =
      activeContext || (historySummary && historySummary.length > 0 ? historySummary[0] : null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/coach/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athlete_name: profile.name || "Athlete",
          athlete_profile: profile,
          current_assessment: effectiveAssessment,
          history_summary: historySummary,
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Chat request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const event = JSON.parse(dataStr);
              if (event.type === "token") {
                accumulated += event.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: accumulated } : msg
                  )
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      console.warn("Chat streaming warning:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  msg.content ||
                  `Great question, ${profile.name || "Athlete"}! Based on your kinetic profile and ${activeContext?.name || "assessment"} metrics, focusing on Rate of Force Development and joint deceleration mechanics will unlock the greatest performance gains. What specific drill would you like to explore?`,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={closeCoach}
        aria-hidden="true"
      />

      {/* Responsive Container:
          - Mobile: Bottom sheet (inset-x-0 bottom-0 h-[88vh] rounded-t-3xl)
          - Desktop: Slide-over right drawer (inset-y-0 right-0 w-full sm:max-w-md md:max-w-lg)
      */}
      <div className="fixed inset-x-0 bottom-0 top-auto h-[88vh] max-h-[88vh] rounded-t-3xl md:inset-y-0 md:inset-x-auto md:right-0 md:h-full md:max-h-full md:w-full md:max-w-lg md:rounded-none bg-background/95 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-border shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
        
        {/* Mobile Swipe Handle Indicator */}
        <div className="pt-2.5 pb-1 flex justify-center md:hidden">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between shrink-0 bg-card/40">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Bot className="size-5" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background ${
                  engineStatus.mode === "cloud_llm" || engineStatus.cloud_online
                    ? "bg-emerald-400 animate-pulse"
                    : engineStatus.ollama_online
                    ? "bg-teal-400"
                    : "bg-amber-400"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Coach Qwen</h2>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    engineStatus.mode === "cloud_llm" || engineStatus.cloud_online
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : engineStatus.ollama_online
                      ? "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {engineStatus.mode === "cloud_llm" || engineStatus.cloud_online
                    ? "● Qwen 3.8-27B Cloud (Live)"
                    : engineStatus.ollama_online
                    ? "● Qwen 2.5 Local (Live)"
                    : "● Olympic Biomechanics Fallback"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {engineStatus.mode === "cloud_llm" || engineStatus.cloud_online
                  ? "24/7 Groq High-Speed Cloud • Olympic Biomechanics"
                  : "Olympic Biomechanics & Sports Science"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={closeCoach}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Close Assistant"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Context Indicator Pill */}
        {activeContext && (
          <div className="px-4 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <Zap className="size-3.5 text-emerald-500 shrink-0" />
              <span className="font-semibold text-foreground truncate">
                {activeContext.name || "Assessment"}
              </span>
              {activeContext.headlineValue !== undefined && (
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  ({activeContext.headlineValue} {activeContext.headlineUnit})
                </span>
              )}
            </div>
            {activeContext.topSport && (
              <span className="text-[11px] text-muted-foreground shrink-0 bg-background/80 px-2 py-0.5 rounded-full border border-border/60">
                Fit: {activeContext.topSport}
              </span>
            )}
          </div>
        )}

        {/* Biomechanical Benchmarks vs Olympic Standards (Option 3) */}
        {(() => {
          const currentBenchmark =
            BENCHMARK_STANDARDS.find((b) => b.slug === selectedBenchmarkSlug) ||
            BENCHMARK_STANDARDS[0];
          const currentAthleteVal = getAthleteBenchmarkVal(currentBenchmark.slug);
          const currentTierInfo = currentBenchmark.getTier(currentAthleteVal);
          const percent = currentBenchmark.getPercent(currentAthleteVal);

          return (
            <div className="border-b border-border/70 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-indigo-500/5">
              <button
                type="button"
                onClick={() => setShowBenchmarks(!showBenchmarks)}
                className="w-full px-4 py-2 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <BarChart2 className="size-3.5 text-emerald-500" />
                  <span>Biomechanical Standards vs Olympic Tiers</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span>{showBenchmarks ? "Hide" : "View"}</span>
                  {showBenchmarks ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </div>
              </button>

              {showBenchmarks && (
                <div className="px-4 pb-3 pt-1 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                  {/* Assessment Switcher Tabs */}
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                    {BENCHMARK_STANDARDS.map((b) => (
                      <button
                        key={b.slug}
                        type="button"
                        onClick={() => setSelectedBenchmarkSlug(b.slug)}
                        className={`shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                          selectedBenchmarkSlug === b.slug
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-semibold"
                            : "bg-background/80 text-muted-foreground border-border/70 hover:border-border"
                        }`}
                      >
                        {b.shortName}
                      </button>
                    ))}
                  </div>

                  {/* Benchmark Meter Card */}
                  <div className="bg-background/90 border border-border/80 rounded-xl p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-foreground">
                          {currentBenchmark.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                          ({currentBenchmark.metricLabel})
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentTierInfo.badgeColor}`}
                      >
                        {currentAthleteVal} {currentBenchmark.unit} • {currentTierInfo.tier}
                      </Badge>
                    </div>

                    {/* Segmented Meter with Marker Pin */}
                    <div className="space-y-1">
                      <div className="relative pt-1.5 pb-1">
                        <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden flex shadow-inner">
                          <div className="w-1/4 h-full bg-amber-400/80 border-r border-background/50" title="Beginner" />
                          <div className="w-1/4 h-full bg-blue-400/80 border-r border-background/50" title="Trained" />
                          <div className="w-1/4 h-full bg-indigo-500/80 border-r border-background/50" title="State / College" />
                          <div className="w-1/4 h-full bg-emerald-500/90" title="Olympic Elite" />
                        </div>
                        {/* Needle Pin */}
                        <div
                          className="absolute top-0.5 transform -translate-x-1/2 transition-all duration-300"
                          style={{ left: `${Math.min(96, Math.max(4, percent))}%` }}
                        >
                          <div className="size-3.5 rounded-full bg-white dark:bg-zinc-900 border-2 border-emerald-600 shadow-md ring-2 ring-emerald-500/30" />
                        </div>
                      </div>

                      <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                        <span>Beginner</span>
                        <span>Trained</span>
                        <span>State/College</span>
                        <span className="text-emerald-500 font-semibold">Olympic</span>
                      </div>
                    </div>

                    {/* Gap to Olympic Tier & Quick Prompt */}
                    <div className="flex items-center justify-between pt-1 gap-2 border-t border-border/50 text-[11px]">
                      <p className="text-muted-foreground font-medium truncate text-[10.5px]">
                        {currentTierInfo.gapText}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void handleSendMessage(
                            `How do I bridge the gap from my current ${currentBenchmark.name} (${currentAthleteVal} ${currentBenchmark.unit}) to reach Olympic / Elite standards? What kinetic chain cues and drills should I focus on?`
                          )
                        }
                        className="h-6 text-[10px] px-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0 font-semibold"
                      >
                        Ask Coach <ArrowRight className="size-2.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="size-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-br-sm shadow-sm"
                      : "bg-muted/70 border border-border/80 text-foreground rounded-tl-sm space-y-2 leading-relaxed"
                  }`}
                >
                  <div className="whitespace-pre-wrap prose-sm dark:prose-invert">
                    {msg.content}
                  </div>

                  {/* Workout Routine One-Click Export Toolbar (Option 2) */}
                  {!isUser && isWorkoutRoutine(msg.content) && (
                    <div className="mt-2.5 pt-2 border-t border-border/60 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyRoutine(msg.id, msg.content)}
                        className="h-7 text-xs gap-1.5 rounded-lg border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium"
                      >
                        {copiedRoutineId === msg.id ? (
                          <>
                            <Check className="size-3.5 text-emerald-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>Copy Routine</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadRoutine(msg.content)}
                        className="h-7 text-xs gap-1.5 rounded-lg border-border hover:bg-accent text-foreground font-medium"
                      >
                        <Download className="size-3.5" />
                        <span>Download (.md)</span>
                      </Button>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isUser ? "text-emerald-200" : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic px-2">
              <Sparkles className="size-3.5 animate-spin text-emerald-500" />
              <span>Coach Qwen is synthesizing biomechanical insight...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips (Thumb-scrollable on mobile) */}
        <div className="px-4 py-2 border-t border-border/60 bg-card/20 shrink-0">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
            <Sparkles className="size-3 text-emerald-500" />
            <span>Suggested Coaching Inquiries:</span>
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {getSuggestions().map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => void handleSendMessage(s.prompt)}
                disabled={isStreaming}
                className="shrink-0 text-[11px] font-medium rounded-full px-3 py-1 bg-muted/80 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 border border-border/80 transition-all active:scale-95 text-foreground/90 disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border/80 bg-background shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="flex items-center gap-2 bg-muted/60 border border-border/80 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition-all shadow-inner"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask Coach Qwen about your ${activeContext?.name || "form"}...`}
              disabled={isStreaming}
              className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputText.trim() || isStreaming}
              className="size-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 disabled:opacity-40 transition-transform active:scale-95"
              aria-label="Send Message"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-1.5">
            Powered by 24/7 Groq Cloud Qwen 3.8-27B & Olympic Biomechanics Engine
          </p>
        </div>
      </div>
    </div>
  );
}

/** Floating Button Trigger that sits nicely across Desktop & Mobile */
export function CoachFloatingTrigger() {
  const { toggleCoach, isOpen } = useCoach();

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={toggleCoach}
      aria-label="Open AI Biomechanics Coach"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs py-2.5 px-4 shadow-xl shadow-emerald-500/25 border border-emerald-400/30 transition-all transform hover:scale-105 active:scale-95"
    >
      <div className="relative flex size-5 items-center justify-center">
        <Bot className="size-4" />
        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-300 animate-ping" />
        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-300" />
      </div>
      <span className="hidden sm:inline">Ask Coach Qwen</span>
      <span className="sm:hidden">Coach</span>
    </button>
  );
}
