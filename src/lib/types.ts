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

/** Which way the user's goal points, derived from start vs goal weight. */
export type GoalDirection = "gain" | "lose" | "maintain";

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
  /** Which plan this option belongs to — a surplus plan or a deficit plan. */
  track: "gain" | "loss";
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
  /** Target kg change per week. Negative ranges express a loss goal. */
  weeklyChangeTarget: Range;
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
  /** Per-slot plan overrides, keyed `${track}:${weekday}:${slot}` so the gain
   * and loss plans keep separate customisations. */
  planOverrides: Record<string, string>;
};
