import { addDays, daysBetween, rangeKeys, startOfWeek, todayKey } from "./date";
import { dayTotals, goalProgressPct, resolveEntry, round } from "./nutrition";
import { SLOT_META, buildOptionIndex } from "./plan";
import { directionOf, paceOf, trackOf, type PaceState } from "./goal";
import { MEAL_SLOTS, type AppState, type GoalDirection, type MealSlot } from "./types";

/** The goal direction implied by the user's start and goal weight. */
export function directionOfState(state: AppState): GoalDirection {
  return directionOf(state.profile.startWeightKg, state.profile.goalWeightKg);
}

export type WeightSeriesPoint = { date: string; kg: number };

export function weightSeries(state: AppState): WeightSeriesPoint[] {
  return Object.values(state.days)
    .filter((d) => typeof d.weightKg === "number")
    .map((d) => ({ date: d.date, kg: d.weightKg as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Trailing n-day mean at each logged point — the trend line, not the noise. */
export function rollingAverage(points: WeightSeriesPoint[], windowDays = 7): WeightSeriesPoint[] {
  return points.map((p, i) => {
    const from = addDays(p.date, -(windowDays - 1));
    const window = points.slice(0, i + 1).filter((q) => q.date >= from);
    const mean = window.reduce((a, b) => a + b.kg, 0) / window.length;
    return { date: p.date, kg: round(mean, 2) };
  });
}

export function latestWeight(state: AppState): WeightSeriesPoint | undefined {
  const s = weightSeries(state);
  return s[s.length - 1];
}

export function currentWeight(state: AppState): number {
  return latestWeight(state)?.kg ?? state.profile.startWeightKg;
}

export function average(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export type WeekWindow = { start: string; end: string; label: string };

export function weekWindow(anchor: string, weekStartsOn: 0 | 1, offset = 0): WeekWindow {
  const start = addDays(startOfWeek(anchor, weekStartsOn), offset * 7);
  const end = addDays(start, 6);
  return { start, end, label: `${start} – ${end}` };
}

export type WeeklyWeight = {
  average?: number;
  previousAverage?: number;
  change?: number;
  entries: number;
};

export function weeklyWeight(state: AppState, win: WeekWindow): WeeklyWeight {
  const inWindow = (from: string, to: string) =>
    weightSeries(state)
      .filter((p) => p.date >= from && p.date <= to)
      .map((p) => p.kg);

  const cur = inWindow(win.start, win.end);
  const prevStart = addDays(win.start, -7);
  const prev = inWindow(prevStart, addDays(win.start, -1));

  const avg = average(cur);
  const prevAvg = average(prev);
  return {
    average: avg === undefined ? undefined : round(avg, 2),
    previousAverage: prevAvg === undefined ? undefined : round(prevAvg, 2),
    change: avg !== undefined && prevAvg !== undefined ? round(avg - prevAvg, 2) : undefined,
    entries: cur.length,
  };
}

export type AdherenceStatus = "on-track" | "needs-improvement" | "needs-attention";

export function statusFor(pct: number): AdherenceStatus {
  if (pct >= 80) return "on-track";
  if (pct >= 60) return "needs-improvement";
  return "needs-attention";
}

export const STATUS_LABEL: Record<AdherenceStatus, string> = {
  "on-track": "On track",
  "needs-improvement": "Needs improvement",
  "needs-attention": "Needs attention",
};

export type WeeklyReport = {
  window: WeekWindow;
  direction: GoalDirection;
  pace: PaceState;
  /** Days in the window that have already happened. */
  trackedDays: number;
  weight: WeeklyWeight;
  mealsCompleted: number;
  mealsPossible: number;
  mealAdherence: number;
  avgCalories: number;
  avgProtein: number;
  calorieAdherence: number;
  proteinAdherence: number;
  waterTargetDays: number;
  hydrationAdherence: number;
  missedMeals: { slot: MealSlot; label: string; count: number }[];
  bestDay?: { date: string; adherence: number; kcal: number };
  improvements: string[];
  status: AdherenceStatus;
};

export function buildWeeklyReport(state: AppState, win: WeekWindow): WeeklyReport {
  const today = todayKey();
  const direction = directionOfState(state);
  const track = trackOf(direction);
  const index = buildOptionIndex(state.customOptions);
  const days = rangeKeys(win.start, win.end).filter((d) => d <= today);
  const trackedDays = days.length;

  let mealsCompleted = 0;
  let kcalSum = 0;
  let proteinSum = 0;
  let waterTargetDays = 0;
  const missed = new Map<MealSlot, number>();
  let bestDay: WeeklyReport["bestDay"];

  for (const date of days) {
    const log = state.days[date];
    const totals = dayTotals(log, date, state.planOverrides, track, index);
    mealsCompleted += totals.completed;
    kcalSum += totals.kcal;
    proteinSum += totals.protein;
    if (totals.waterMl >= state.profile.waterTargetMl.min) waterTargetDays += 1;

    for (const slot of MEAL_SLOTS) {
      const entry = resolveEntry(log, date, slot, state.planOverrides, track);
      const isPast = date < today;
      if (entry.status === "skipped" || (isPast && entry.status === "planned")) {
        missed.set(slot, (missed.get(slot) ?? 0) + 1);
      }
    }

    if (!bestDay || totals.adherence > bestDay.adherence) {
      bestDay = { date, adherence: totals.adherence, kcal: totals.kcal };
    }
  }

  const mealsPossible = trackedDays * MEAL_SLOTS.length;
  const mealAdherence = mealsPossible ? round((mealsCompleted / mealsPossible) * 100) : 0;
  const avgCalories = trackedDays ? round(kcalSum / trackedDays) : 0;
  const avgProtein = trackedDays ? round(proteinSum / trackedDays, 1) : 0;
  const calorieAdherence = round(
    Math.min(100, (avgCalories / state.profile.calorieTarget.min) * 100),
  );
  const proteinAdherence = round(
    Math.min(100, (avgProtein / state.profile.proteinTarget.min) * 100),
  );
  const hydrationAdherence = trackedDays ? round((waterTargetDays / trackedDays) * 100) : 0;

  const improvements: string[] = [];
  if (avgCalories < state.profile.calorieTarget.min) {
    improvements.push(
      direction === "lose"
        ? `Average intake is ${state.profile.calorieTarget.min - avgCalories} kcal below target — eating too little stalls progress and costs lean mass.`
        : `Average intake is ${state.profile.calorieTarget.min - avgCalories} kcal below target — add an extra shake or bedtime milk.`,
    );
  } else if (avgCalories > state.profile.calorieTarget.max) {
    improvements.push(
      direction === "lose"
        ? `Average intake is ${avgCalories - state.profile.calorieTarget.max} kcal above target — tighten evening portions before cutting a whole meal.`
        : `Average intake is ${avgCalories - state.profile.calorieTarget.max} kcal above target, which is fine on a gain plan as long as the weekly pace holds.`,
    );
  }
  if (avgProtein < state.profile.proteinTarget.min) {
    improvements.push(
      `Protein is averaging ${avgProtein} g against a ${state.profile.proteinTarget.min} g target — keep paneer, curd, chana or chicken portions full.`,
    );
  }
  if (hydrationAdherence < 70) {
    improvements.push(
      `Water target met on ${waterTargetDays} of ${trackedDays} days — set the hydration reminder to repeat more often.`,
    );
  }
  const worstSlot = [...missed.entries()].sort((a, b) => b[1] - a[1])[0];
  if (worstSlot && worstSlot[1] >= 2) {
    improvements.push(
      `${SLOT_META[worstSlot[0]].label} was missed ${worstSlot[1]} times — it is the easiest meal to win back.`,
    );
  }
  if (!improvements.length) improvements.push("Everything is tracking well — keep the routine steady.");

  const weight = weeklyWeight(state, win);

  return {
    window: win,
    direction,
    pace: paceOf(weight.change, state.profile.weeklyChangeTarget, direction),
    trackedDays,
    weight,
    mealsCompleted,
    mealsPossible,
    mealAdherence,
    avgCalories,
    avgProtein,
    calorieAdherence,
    proteinAdherence,
    waterTargetDays,
    hydrationAdherence,
    missedMeals: [...missed.entries()]
      .map(([slot, count]) => ({ slot, label: SLOT_META[slot].label, count }))
      .sort((a, b) => b.count - a.count),
    bestDay,
    improvements,
    status: statusFor(mealAdherence),
  };
}

export type ProgressSummary = {
  direction: GoalDirection;
  startWeight: number;
  goalWeight: number;
  current: number;
  totalChange: number;
  remaining: number;
  goalProgress: number;
  weeklyAverage?: number;
  previousWeeklyAverage?: number;
  weeklyChange?: number;
  daysTracking: number;
  loggedDays: number;
  currentStreak: number;
};

export function progressSummary(state: AppState): ProgressSummary {
  const { startWeightKg, goalWeightKg, startDate } = state.profile;
  const direction = directionOfState(state);
  const current = currentWeight(state);
  const win = weekWindow(todayKey(), state.settings.weekStartsOn);
  const w = weeklyWeight(state, win);

  const loggedDays = Object.values(state.days).filter(
    (d) => d.waterMl > 0 || d.weightKg !== undefined || Object.keys(d.meals ?? {}).length > 0,
  ).length;

  let streak = 0;
  let cursor = todayKey();
  for (let i = 0; i < 400; i++) {
    const log = state.days[cursor];
    const touched =
      !!log && (log.waterMl > 0 || log.weightKg !== undefined || Object.keys(log.meals ?? {}).length > 0);
    if (!touched) {
      // Today not yet touched shouldn't break a streak that ended yesterday.
      if (i === 0) {
        cursor = addDays(cursor, -1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    direction,
    startWeight: startWeightKg,
    goalWeight: goalWeightKg,
    current,
    totalChange: round(current - startWeightKg, 2),
    /** Distance still to cover, always non-negative regardless of direction. */
    remaining: round(Math.abs(goalWeightKg - current), 2),
    goalProgress: Math.max(0, Math.min(100, goalProgressPct(current, startWeightKg, goalWeightKg))),
    weeklyAverage: w.average,
    previousWeeklyAverage: w.previousAverage,
    weeklyChange: w.change,
    daysTracking: Math.max(1, daysBetween(startDate, todayKey()) + 1),
    loggedDays,
    currentStreak: streak,
  };
}
