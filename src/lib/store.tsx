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
import { RECOMMENDED_TARGETS } from "./goal";
import { STORAGE_KEY, STATE_VERSION, makeInitialState } from "./defaults";
import { todayKey } from "./date";
import { makeEntry } from "./nutrition";
import { overrideKey, plannedOptionId } from "./plan";
import { directionOf, trackOf, type PlanTrack } from "./goal";
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
  /** Which meal plan the current start/goal weights imply. */
  track: PlanTrack;
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
  resetTargetsForGoal: () => void;
  resetPlanOverrides: () => void;
  resetAll: () => void;
  importState: (json: string) => { ok: boolean; error?: string };
};

const StoreContext = createContext<Ctx | null>(null);

function emptyDay(date: string): DayLog {
  return { date, meals: {}, waterMl: 0 };
}

type LegacyProfile = Partial<Profile> & { weeklyGainTarget?: Profile["weeklyChangeTarget"] };

function migrate(raw: unknown): AppState {
  const base = makeInitialState();
  if (!raw || typeof raw !== "object") return base;
  const parsed = raw as Partial<AppState> & { profile?: LegacyProfile };
  const version = typeof parsed.version === "number" ? parsed.version : 1;

  const legacy: LegacyProfile = parsed.profile ?? {};
  const { weeklyGainTarget, ...storedProfile } = legacy;
  const profile: Profile = {
    ...base.profile,
    ...storedProfile,
    // v1 called this weeklyGainTarget and only ever held a gain range.
    weeklyChangeTarget:
      storedProfile.weeklyChangeTarget ?? weeklyGainTarget ?? base.profile.weeklyChangeTarget,
  };

  // v1 overrides were keyed `weekday:slot` and always belonged to the gain plan.
  let planOverrides = parsed.planOverrides ?? {};
  if (version < 2) {
    planOverrides = Object.fromEntries(
      Object.entries(planOverrides).map(([k, v]) => [k.includes(":") && k.split(":").length === 2 ? `gain:${k}` : k, v]),
    );
  }

  return {
    version: STATE_VERSION,
    profile,
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    // Keep the user's schedule but always take the current wording.
    reminders: base.reminders.map((r) => {
      const stored = parsed.reminders?.find((x) => x.id === r.id);
      return stored ? { ...r, ...stored, label: r.label } : r;
    }),
    days: parsed.days ?? {},
    planOverrides,
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

  const track = trackOf(directionOf(state.profile.startWeightKg, state.profile.goalWeightKg));

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
        const t = trackOf(directionOf(d.profile.startWeightKg, d.profile.goalWeightKg));
        const existing =
          day.meals[slot] ?? makeEntry(plannedOptionId(t, weekdayOf(date), slot, d.planOverrides));
        day.meals[slot] = { ...existing, ...patch };
      });
    },
    [update],
  );

  const cycleMealStatus = useCallback(
    (date: string, slot: MealSlot) => {
      update((d) => {
        const day = (d.days[date] ??= emptyDay(date));
        const t = trackOf(directionOf(d.profile.startWeightKg, d.profile.goalWeightKg));
        const existing =
          day.meals[slot] ?? makeEntry(plannedOptionId(t, weekdayOf(date), slot, d.planOverrides));
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
        const t = trackOf(directionOf(d.profile.startWeightKg, d.profile.goalWeightKg));
        d.planOverrides[overrideKey(t, weekday, slot)] = optionId;
      }),
    [update],
  );

  /** Re-applies the recommended targets for the current goal direction. */
  const resetTargetsForGoal = useCallback(
    () =>
      update((d) => {
        Object.assign(
          d.profile,
          RECOMMENDED_TARGETS[directionOf(d.profile.startWeightKg, d.profile.goalWeightKg)],
        );
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
      track,
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
      resetTargetsForGoal,
      resetPlanOverrides,
      resetAll,
      importState,
    }),
    [
      state,
      hydrated,
      track,
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
      resetTargetsForGoal,
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
