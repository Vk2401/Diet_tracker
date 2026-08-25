import { BUILTIN_BY_ID, plannedOptionId, type OptionIndex } from "./plan";
import type { PlanTrack } from "./goal";
import { weekdayOf } from "./date";
import { MEAL_SLOTS, type DayLog, type MealEntry, type MealSlot, type Range } from "./types";

export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Resolves the effective calories/protein for a logged meal entry. */
export function entryNutrition(
  entry: MealEntry,
  index: OptionIndex = BUILTIN_BY_ID,
): { kcal: number; protein: number } {
  const opt = index[entry.optionId];
  const factor = entry.portionFactor ?? 1;
  return {
    kcal: entry.caloriesOverride ?? round((opt?.kcal ?? 0) * factor),
    protein: entry.proteinOverride ?? round((opt?.protein ?? 0) * factor, 1),
  };
}

export function makeEntry(optionId: string): MealEntry {
  return { status: "planned", optionId, portionFactor: 1 };
}

/** The entry for a slot, falling back to the recurring plan when nothing is logged. */
export function resolveEntry(
  day: DayLog | undefined,
  date: string,
  slot: MealSlot,
  planOverrides: Record<string, string>,
  track: PlanTrack = "gain",
): MealEntry {
  const logged = day?.meals?.[slot];
  if (logged) return logged;
  return makeEntry(plannedOptionId(track, weekdayOf(date), slot, planOverrides));
}

export type DayTotals = {
  kcal: number;
  protein: number;
  waterMl: number;
  completed: number;
  skipped: number;
  pending: number;
  total: number;
  adherence: number;
};

export function dayTotals(
  day: DayLog | undefined,
  date: string,
  planOverrides: Record<string, string>,
  track: PlanTrack = "gain",
  index: OptionIndex = BUILTIN_BY_ID,
): DayTotals {
  let kcal = 0;
  let protein = 0;
  let completed = 0;
  let skipped = 0;

  for (const slot of MEAL_SLOTS) {
    const entry = resolveEntry(day, date, slot, planOverrides, track);
    if (entry.status === "completed") {
      const n = entryNutrition(entry, index);
      kcal += n.kcal;
      protein += n.protein;
      completed += 1;
    } else if (entry.status === "skipped") {
      skipped += 1;
    }
  }

  const total = MEAL_SLOTS.length;
  return {
    kcal: round(kcal),
    protein: round(protein, 1),
    waterMl: day?.waterMl ?? 0,
    completed,
    skipped,
    pending: total - completed - skipped,
    total,
    adherence: round((completed / total) * 100),
  };
}

export type TargetState = "under" | "in" | "over";

export function targetState(value: number, target: Range): TargetState {
  if (value < target.min) return "under";
  if (value > target.max) return "over";
  return "in";
}

/** Fraction of the target's midpoint achieved, clamped to [0, 1] for display. */
export function targetFraction(value: number, target: Range): number {
  if (target.max <= 0) return 0;
  return Math.max(0, Math.min(1, value / target.max));
}

export function goalProgressPct(current: number, start: number, goal: number): number {
  if (goal === start) return current >= goal ? 100 : 0;
  return round(((current - start) / (goal - start)) * 100, 1);
}
