import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildDemoModel } from "./demo";
import { useLiveModel } from "./live";
import { DEFAULT_ASSUMPTIONS, type Assumptions, type CinemaModel, type Mode } from "./types";

interface Ctx {
  model: CinemaModel;
  /** What the user asked for. */
  mode: Mode;
  setMode: (m: Mode) => void;
  assumptions: Assumptions;
  setAssumptions: (a: Assumptions) => void;
  liveLoading: boolean;
  liveError?: string;
  /** Live was requested but we are showing demo (no data / error). */
  fellBack: boolean;
}

const CinemaCtx = createContext<Ctx | null>(null);

const KEY = "boc.prefs.v1";

function loadPrefs(): { mode: Mode; assumptions: Assumptions } {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<{ mode: Mode; assumptions: Assumptions }>;
      return {
        mode: p.mode === "demo" ? "demo" : "live",
        assumptions: { ...DEFAULT_ASSUMPTIONS, ...(p.assumptions ?? {}) },
      };
    }
  } catch {
    /* storage unavailable – use defaults */
  }
  return { mode: "live", assumptions: DEFAULT_ASSUMPTIONS };
}

export function CinemaDataProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(loadPrefs, []);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [assumptions, setAssumptions] = useState<Assumptions>(initial.assumptions);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ mode, assumptions }));
    } catch {
      /* ignore */
    }
  }, [mode, assumptions]);

  const live = useLiveModel(assumptions, mode === "live", now);
  const demo = useMemo(() => buildDemoModel(now, assumptions), [now, assumptions]);

  const fellBack = mode === "live" && !live.isLoading && (!!live.error || live.empty || !live.model);
  const model = mode === "live" && live.model && !live.empty ? live.model : demo;

  const value: Ctx = {
    model,
    mode,
    setMode,
    assumptions,
    setAssumptions,
    liveLoading: mode === "live" && live.isLoading,
    liveError: live.error,
    fellBack,
  };
  return <CinemaCtx.Provider value={value}>{children}</CinemaCtx.Provider>;
}

export function useCinema(): Ctx {
  const c = useContext(CinemaCtx);
  if (!c) throw new Error("useCinema must be used inside CinemaDataProvider");
  return c;
}
