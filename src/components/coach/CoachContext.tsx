import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface CoachAssessmentContext {
  id?: string;
  slug?: string;
  name?: string;
  headlineValue?: number | string;
  headlineUnit?: string;
  headlineLabel?: string;
  kinematics?: Record<string, any>;
  topSport?: string;
  topScore?: number;
  sportScores?: any[];
  performanceMetrics?: any[];
  attempts?: Array<{ label: string; value: number; unit: string }>;
}

interface CoachContextType {
  isOpen: boolean;
  openCoach: (prompt?: string, context?: CoachAssessmentContext) => void;
  closeCoach: () => void;
  toggleCoach: () => void;
  activeContext: CoachAssessmentContext | null;
  setActiveContext: (context: CoachAssessmentContext | null) => void;
  queuedPrompt: string | null;
  clearQueuedPrompt: () => void;
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

export function CoachProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<CoachAssessmentContext | null>(null);
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);

  const openCoach = useCallback((prompt?: string, context?: CoachAssessmentContext) => {
    if (context) setActiveContext(context);
    if (prompt) setQueuedPrompt(prompt);
    setIsOpen(true);
  }, []);

  const closeCoach = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleCoach = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearQueuedPrompt = useCallback(() => {
    setQueuedPrompt(null);
  }, []);

  return (
    <CoachContext.Provider
      value={{
        isOpen,
        openCoach,
        closeCoach,
        toggleCoach,
        activeContext,
        setActiveContext,
        queuedPrompt,
        clearQueuedPrompt,
      }}
    >
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach() {
  const ctx = useContext(CoachContext);
  if (!ctx) {
    throw new Error("useCoach must be used within a CoachProvider");
  }
  return ctx;
}
