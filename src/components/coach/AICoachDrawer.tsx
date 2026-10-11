import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Dumbbell,
  ShieldCheck,
  Target,
  Trophy,
  ArrowRight,
  Flame,
  Zap,
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
  const [engineStatus, setEngineStatus] = useState<{
    ollama_online: boolean;
    active_model?: string;
    mode: "ollama_live" | "deterministic_fallback";
  }>({
    ollama_online: false,
    mode: "deterministic_fallback",
  });

  const [historySummary, setHistorySummary] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Dynamic Suggestion Chips based on active assessment
  const getSuggestions = () => {
    const slug = activeContext?.slug || "vertical-jump";
    if (slug === "vertical-jump") {
      return [
        { label: "🚀 Add 5 cm to Jump", prompt: "How can I add 5 cm to my vertical jump using reactive plyometrics?" },
        { label: "🩹 Check Landing & ACL Risk", prompt: "What does my landing deceleration and symmetry indicate for injury risk?" },
        { label: "🏐 Why is Volleyball my match?", prompt: "Why does my jump kinetic profile match Volleyball and Basketball?" },
        { label: "🏋️ 7-Day Jump Workout", prompt: "Create a 7-day training schedule to increase my vertical displacement and RFD." },
      ];
    } else if (slug === "squat") {
      return [
        { label: "🦵 Reach 90° Parallel Depth", prompt: "How can I safely increase my squat depth angle without heel lift?" },
        { label: "🛡️ Fix Knee Cave / Valgus", prompt: "How do I activate my glutes to prevent knee valgus during deep squats?" },
        { label: "🏋️ Squat Strength Routine", prompt: "Give me a progressive squat workout program for athletic power." },
      ];
    } else if (slug === "single-leg-balance") {
      return [
        { label: "🦶 Foot Tripod Stability", prompt: "What drills can I do to improve foot tripod stability and vestibular balance?" },
        { label: "⚖️ Fix Left-Right Asymmetry", prompt: "How do I correct unilateral balance asymmetry between my left and right legs?" },
      ];
    } else if (slug === "push-up") {
      return [
        { label: "💪 Reach 30+ Strict Reps", prompt: "What is the best grease-the-groove strategy to increase push-up rep endurance?" },
        { label: "📐 Elbow 45° Form Cues", prompt: "How do I maintain strict 45-degree elbow alignment to protect shoulder health?" },
      ];
    } else if (slug === "side-to-side-agility") {
      return [
        { label: "⚡ Quicker Line Contacts", prompt: "How can I lower ground contact time during lateral change-of-direction shuttles?" },
        { label: "👟 Deceleration Braking Power", prompt: "What eccentric drills build explosive deceleration and directional speed?" },
      ];
    }
    return [
      { label: "🎯 Improve My Scores", prompt: "What specific training drills will improve my athletic performance most?" },
      { label: "🏋️ Personalized 7-Day Plan", prompt: "Create a 7-day athletic workout blueprint for my fitness tier." },
      { label: "🛡️ Injury Prevention Cues", prompt: "What joint protection and deceleration mechanics should I prioritize?" },
      { label: "🏆 My Best Sport Fit", prompt: "Explain how my multi-trait physical profile transfers to competitive sports." },
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
                  engineStatus.ollama_online ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Coach Qwen</h2>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    engineStatus.ollama_online
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {engineStatus.ollama_online ? "● Qwen 2.5 Live" : "● Olympic Biomechanics Fallback"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Olympic Biomechanics & Sports Science</p>
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
            Powered by local Qwen 2.5 Neural LLM & Olympic Biomechanics Engine
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
