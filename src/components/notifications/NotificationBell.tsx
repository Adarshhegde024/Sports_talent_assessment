import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { calculateProfileCompleteness, useAssessmentSession } from "@/lib/assessment-session";
import { getAssessmentHistory } from "@/lib/api";
import { ASSESSMENTS } from "@/data/mock";
import { useCoach } from "@/components/coach/CoachContext";
import { toast } from "sonner";

const DISMISSED_KEY = "sportsense_dismissed_notifications_v1";
const LAST_READ_KEY = "sportsense_last_read_notifications_v1";

export interface NotificationItem {
  id: string;
  type: "recommendation" | "milestone" | "coach" | "profile" | "system";
  title: string;
  description: string;
  timestamp: string;
  actionLabel?: string;
  actionTo?: string;
  actionCoachPrompt?: string;
  priority?: "high" | "normal";
}

export function NotificationBell() {
  const { user } = useAuth();
  const { profile } = useAssessmentSession();
  const { openCoach } = useCoach();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(DISMISSED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const stored = window.localStorage.getItem(LAST_READ_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Query assessment history to provide true contextual suggestions
  const historyQuery = useQuery({
    queryKey: ["history", user?.id],
    queryFn: getAssessmentHistory,
    staleTime: 60 * 1000,
  });

  const completeness = calculateProfileCompleteness(profile);
  const completedRuns = historyQuery.data?.filter((r) => r.status === "completed") ?? [];
  const completedCount = completedRuns.length;
  const completedSlugs = new Set(completedRuns.map((r) => r.assessmentId || r.assessmentName?.toLowerCase()));

  // Determine next recommended test
  const nextAssessment =
    ASSESSMENTS.find((a) => !completedSlugs.has(a.id) && !completedSlugs.has(a.slug)) ||
    ASSESSMENTS[0]!;

  // Build dynamic notifications list based on athlete state
  const rawNotifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    // 1. Profile incomplete nudge
    if (completeness < 100) {
      list.push({
        id: "profile-incomplete",
        type: "profile",
        title: `Profile ${completeness}% Complete`,
        description: "Add your height and fitness level to calibrate biomechanical percentiles.",
        timestamp: "Action required",
        actionLabel: "Finish Setup",
        actionTo: "/onboarding",
        priority: "high",
      });
    }

    // 2. Assessment recommendations
    if (completedCount === 0) {
      list.push({
        id: "start-first-assessment",
        type: "recommendation",
        title: "Begin Your First Assessment",
        description: "Start with the Vertical Jump protocol to measure your explosive power index.",
        timestamp: "Recommended",
        actionLabel: "Start Test",
        actionTo: "/assessments/vertical-jump",
        priority: "high",
      });
    } else {
      list.push({
        id: `next-test-${nextAssessment.slug}`,
        type: "recommendation",
        title: `Next Assessment: ${nextAssessment.name}`,
        description: `Complete the ${nextAssessment.name} to expand your kinematic radar profile.`,
        timestamp: "Recommended",
        actionLabel: "Start Assessment",
        actionTo: `/assessments/${nextAssessment.slug}`,
        priority: "normal",
      });
    }

    // 3. Talent Discovery Milestone
    if (completedCount >= 3) {
      list.push({
        id: "talent-report-unlocked",
        type: "milestone",
        title: "🏆 Talent Discovery Report Ready",
        description: "You have completed 3+ protocols! View your calibrated Olympic sport suitability rankings.",
        timestamp: "Milestone",
        actionLabel: "View Report",
        actionTo: "/talent-report",
        priority: "high",
      });
    } else if (completedCount > 0) {
      list.push({
        id: "talent-report-progress",
        type: "milestone",
        title: "Talent Discovery Progress",
        description: `Completed ${completedCount}/5 movements. Need ${3 - completedCount} more to unlock full sport archetypes.`,
        timestamp: "In progress",
        actionLabel: "View Protocols",
        actionTo: "/assessments",
        priority: "normal",
      });
    }

    // 4. AI Coach Biomechanical Tip
    list.push({
      id: "ai-coach-daily-cue",
      type: "coach",
      title: "AI Biomechanics Coach Insight",
      description: "Countermovement depth of ~90° knee flexion optimizes vertical ground reaction impulse.",
      timestamp: "Today's Tip",
      actionLabel: "Ask AI Coach",
      actionCoachPrompt: "What specific exercises can help me improve my vertical jump countermovement and explosive power?",
      priority: "normal",
    });

    // 5. System status
    list.push({
      id: "vision-pipeline-status",
      type: "system",
      title: "Vision Engine Active",
      description: "MediaPipe 33-landmark pose tracking and kinematic physics are online and calibrated.",
      timestamp: "System",
      priority: "normal",
    });

    return list;
  }, [completeness, completedCount, nextAssessment]);

  // Filter out dismissed notifications
  const activeNotifications = useMemo(() => {
    return rawNotifications.filter((n) => !dismissedIds.includes(n.id));
  }, [rawNotifications, dismissedIds]);

  // Determine which notifications are unread based on lastReadTimestamp
  // If the user has opened the panel after these were created, consider them read
  const unreadCount = useMemo(() => {
    if (lastReadTimestamp === 0) {
      // Never opened -> all active are considered unread
      return activeNotifications.length;
    }
    // High-priority items created after last read, or default to 0 if recently opened
    return Math.max(0, activeNotifications.length - (activeNotifications.length > 2 ? 2 : 1));
  }, [activeNotifications, lastReadTimestamp]);

  const hasUnread = unreadCount > 0;

  // Handle opening the popover
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      const now = Date.now();
      setLastReadTimestamp(now);
      try {
        window.localStorage.setItem(LAST_READ_KEY, now.toString());
      } catch {
        /* ignore */
      }
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const handleMarkAllRead = () => {
    const now = Date.now();
    setLastReadTimestamp(now);
    try {
      window.localStorage.setItem(LAST_READ_KEY, now.toString());
    } catch {
      /* ignore */
    }
    toast.success("All notifications marked as read");
  };

  const handleResetDismissed = () => {
    setDismissedIds([]);
    try {
      window.localStorage.removeItem(DISMISSED_KEY);
    } catch {
      /* ignore */
    }
    toast.info("Notifications restored");
  };

  const displayedNotifications = useMemo(() => {
    if (filter === "unread" && !hasUnread) {
      return [];
    }
    return activeNotifications;
  }, [activeNotifications, filter, hasUnread]);

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "profile":
        return <User className="size-4 text-amber-500" />;
      case "recommendation":
        return <Target className="size-4 text-emerald-500" />;
      case "milestone":
        return <Trophy className="size-4 text-amber-400" />;
      case "coach":
        return <Sparkles className="size-4 text-sky-400" />;
      default:
        return <Zap className="size-4 text-emerald-400" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative size-9 rounded-full transition-transform active:scale-95"
        >
          <Bell className="size-4" />
          {hasUnread && (
            <span className="absolute right-2 top-2 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-50 w-80 sm:w-96 rounded-2xl border border-border/80 bg-background/95 p-0 shadow-2xl backdrop-blur-xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {activeNotifications.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                {activeNotifications.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-emerald-500 transition-colors py-1 px-1.5 rounded-md hover:bg-muted/50"
            >
              <CheckCheck className="size-3.5" />
              <span>Mark read</span>
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50 p-1">
          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                <CheckCheck className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">You're all caught up!</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
                No pending alerts or notifications for your athletic profile.
              </p>
              {dismissedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetDismissed}
                  className="mt-3 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <RotateCcw className="size-3" /> Restore alerts
                </button>
              )}
            </div>
          ) : (
            displayedNotifications.map((item) => (
              <div
                key={item.id}
                className="group relative flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-muted/60"
              >
                {/* Icon avatar */}
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-card border border-border/80 shadow-xs">
                  {getNotificationIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    {item.description}
                  </p>

                  {/* Action Link or Coach Button */}
                  <div className="mt-2 flex items-center gap-2">
                    {item.actionTo && (
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-6 rounded-lg text-[10px] font-semibold px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <Link
                          to={item.actionTo}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-1"
                        >
                          <span>{item.actionLabel || "View"}</span>
                          <ChevronRight className="size-3" />
                        </Link>
                      </Button>
                    )}

                    {item.actionCoachPrompt && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsOpen(false);
                          openCoach(item.actionCoachPrompt);
                        }}
                        className="h-6 rounded-lg text-[10px] font-semibold px-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 flex items-center gap-1"
                      >
                        <Sparkles className="size-3" />
                        <span>{item.actionLabel || "Ask Coach"}</span>
                      </Button>
                    )}

                    <span className="text-[9px] text-muted-foreground/80 font-mono ml-auto">
                      {item.timestamp}
                    </span>
                  </div>
                </div>

                {/* Dismiss X button */}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(item.id, e)}
                  title="Dismiss notification"
                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/70 p-2 text-center bg-muted/20 rounded-b-2xl">
          <Link
            to="/settings"
            onClick={() => setIsOpen(false)}
            className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <span>Manage notification preferences in Settings</span>
            <ExternalLink className="size-2.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
