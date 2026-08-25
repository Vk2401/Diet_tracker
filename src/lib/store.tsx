"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEY, STATE_VERSION, makeInitialState } from "./defaults";
import { todayKey } from "./date";
import { makeEntry } from "./nutrition";
import { plannedOptionId } from "./plan";
import { weekdayOf } from "./date";
import type {
  AppState,
  DayLog,
  MealEntry,
  MealSlot,
  Profile,
  Reminder,
  Settings,
} from "./types";

type Ctx = {
  state: AppState;
  hydrated: boolean;
  update: (fn: (draft: AppState) => void) => void;
  getDay: (date: string) => DayLog;
  setMeal: (date: string, slot: MealSlot, patch: Partial<MealEntry>) => void;
  cycleMealStatus: (date: string, slot: MealSlot) => void;
  addWater: (date: string, ml: number) => void;
  setWater: (date: string, ml: number) => void;
  setWeight: (date: string, kg: number | undefined) => void;
  setDayNotes: (date: string, notes: string) => void;
  setProfile: (patch: Partial<Profile>) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setReminder: (id: string, patch: Partial<Reminder>) => void;
  setPlanOverride: (weekday: number, slot: MealSlot, optionId: string) => void;
  resetPlanOverrides: () => void;
  resetAll: () => void;
  importState: (json: string) => { ok: boolean; error?: string };
};

const StoreContext = createContext<Ctx | null>(null);

function emptyDay(date: string): DayLog {
  return { date, meals: {}, waterMl: 0 };
}

function migrate(raw: unknown): AppState {
  const base = makeInitialState();
  if (!raw || typeof raw !== "object") return base;
  const parsed = raw as Partial<AppState>;
  return {
    version: STATE_VERSION,
    profile: { ...base.profile, ...(parsed.profile ?? {}) },
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    reminders: base.reminders.map(
      (r) => parsed.reminders?.find((x) => x.id === r.id) ?? r,
    ),
    days: parsed.days ?? {},
    planOverrides: parsed.planOverrides ?? {},
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => makeInitialState());
  const [hydrated, setHydrated] = useState(false);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load once on mount — server render always starts from the pristine state.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(migrate(JSON.parse(raw)));
    } catch {
      /* corrupt payload — fall back to defaults */
    }
    setHydrated(true);
  }, []);

  // Debounced persist so rapid taps (water, portions) don't thrash storage.
  useEffect(() => {
    if (!hydrated) return;
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* quota exceeded — keep the in-memory state usable */
      }
    }, 200);
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [state, hydrated]);

  const update = useCallback((fn: (draft: AppState) => void) => {
    setState((prev) => {
      const draft: AppState = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const getDay = useCallback(
    (date: string): DayLog => state.days[date] ?? emptyDay(date),
    [state.days],
  );

  const setMeal = useCallback(
    (date: string, slot: MealSlot, patch: Partial<MealEntry>) => {
      update((d) => {
        const day = (d.days[date] ??= emptyDay(date));
        const existing =
          day.meals[slot] ?? makeEntry(plannedOptionId(weekdayOf(date), slot, d.planOverrides));
        day.meals[slot] = { ...existing, ...patch };
      });
    },
    [update],
  );

  const cycleMealStatus = useCallback(
    (date: string, slot: MealSlot) => {
      update((d) => {
        const day = (d.days[date] ??= emptyDay(date));
        const existing =
          day.meals[slot] ?? makeEntry(plannedOptionId(weekdayOf(date), slot, d.planOverrides));
        const next =
          existing.status === "planned"
            ? "completed"
            : existing.status === "completed"
              ? "skipped"
              : "planned";
        day.meals[slot] = {
          ...existing,
          status: next,
          completedAt: next === "completed" ? new Date().toISOString() : undefined,
        };
      });
    },
    [update],
  );

  const addWater = useCallback(
    (date: string, ml: number) => {
      update((d) => {
        const day = (d.days[date] ??= emptyDay(date));
        day.waterMl = Math.max(0, Math.min(6000, day.waterMl + ml));
      });
    },
    [update],
  );

  const setWater = useCallback(
    (date: string, ml: number) => {
      update((d) => {
        const day = (d.days[date] ??= emptyDay(date));
        day.waterMl = Math.max(0, Math.min(6000, Math.round(ml)));
      });
    },
    [update],
  );

  const setWeight = useCallback(
    (date: string, kg: number | undefined) => {
      update((d) => {
        const day = (d.days[date] ??= emptyDay(date));
        day.weightKg = kg;
      });
    },
    [update],
  );

  const setDayNotes = useCallback(
    (date: string, notes: string) => {
      update((d) => {
        const day = (d.days[date] ??= emptyDay(date));
        day.notes = notes;
      });
    },
    [update],
  );

  const setProfile = useCallback(
    (patch: Partial<Profile>) => update((d) => Object.assign(d.profile, patch)),
    [update],
  );

  const setSettings = useCallback(
    (patch: Partial<Settings>) => update((d) => Object.assign(d.settings, patch)),
    [update],
  );

  const setReminder = useCallback(
    (id: string, patch: Partial<Reminder>) =>
      update((d) => {
        const r = d.reminders.find((x) => x.id === id);
        if (r) Object.assign(r, patch);
      }),
    [update],
  );

  const setPlanOverride = useCallback(
    (weekday: number, slot: MealSlot, optionId: string) =>
      update((d) => {
        d.planOverrides[`${weekday}:${slot}`] = optionId;
      }),
    [update],
  );

  const resetPlanOverrides = useCallback(
    () => update((d) => { d.planOverrides = {}; }),
    [update],
  );

  const resetAll = useCallback(() => {
    const fresh = makeInitialState();
    fresh.profile.startDate = todayKey();
    setState(fresh);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const importState = useCallback((json: string) => {
    try {
      const next = migrate(JSON.parse(json));
      setState(next);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Invalid file" };
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      hydrated,
      update,
      getDay,
      setMeal,
      cycleMealStatus,
      addWater,
      setWater,
      setWeight,
      setDayNotes,
      setProfile,
      setSettings,
      setReminder,
      setPlanOverride,
      resetPlanOverrides,
      resetAll,
      importState,
    }),
    [
      state,
      hydrated,
      update,
      getDay,
      setMeal,
      cycleMealStatus,
      addWater,
      setWater,
      setWeight,
      setDayNotes,
      setProfile,
      setSettings,
      setReminder,
      setPlanOverride,
      resetPlanOverrides,
      resetAll,
      importState,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
