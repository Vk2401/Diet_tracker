export const MEAL_SLOTS = [
  "breakfast",
  "midMorning",
  "lunch",
  "evening",
  "dinner",
  "bedtime",
] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number];

export type MealStatus = "planned" | "completed" | "skipped";

/** A selectable food option for a given meal slot. */
export type MealOption = {
  id: string;
  slot: MealSlot;
  label: string;
  items: string[];
  /** Estimated energy for one planned portion. */
  kcal: number;
  /** Estimated protein (g) for one planned portion. */
  protein: number;
  /** Human readable planned portion, e.g. "1 plate". */
  portion: string;
  tags?: string[];
};

/** What the user actually logged for one meal on one day. */
export type MealEntry = {
  status: MealStatus;
  /** Selected option id — defaults to the planned option, can be swapped. */
  optionId: string;
  /** Portion multiplier applied to the option's nutrition (1 = as planned). */
  portionFactor: number;
  /** Overrides the computed value when the user edits it directly. */
  caloriesOverride?: number;
  proteinOverride?: number;
  /** ISO timestamp of when the meal was marked complete. */
  completedAt?: string;
  notes?: string;
};

export type DayLog = {
  /** YYYY-MM-DD in local time. */
  date: string;
  meals: Partial<Record<MealSlot, MealEntry>>;
  waterMl: number;
  weightKg?: number;
  notes?: string;
};

export type Range = { min: number; max: number };

export type Profile = {
  name: string;
  startWeightKg: number;
  goalWeightKg: number;
  heightCm?: number;
  startDate: string;
  calorieTarget: Range;
  proteinTarget: Range;
  waterTargetMl: Range;
  weeklyGainTarget: Range;
  onboarded: boolean;
};

export type Reminder = {
  id: string;
  label: string;
  /** HH:mm, local time. */
  time: string;
  enabled: boolean;
  /** Repeat every N minutes between time and endTime (hydration reminders). */
  repeatEveryMin?: number;
  endTime?: string;
};

export type Settings = {
  theme: "system" | "light" | "dark";
  waterGlassMl: number;
  weekStartsOn: 0 | 1;
};

export type AppState = {
  version: number;
  profile: Profile;
  settings: Settings;
  reminders: Reminder[];
  /** keyed by YYYY-MM-DD */
  days: Record<string, DayLog>;
  /** Per-slot option overrides applied to the recurring plan, keyed `${weekday}:${slot}`. */
  planOverrides: Record<string, string>;
};
