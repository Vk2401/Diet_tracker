import type { GoalDirection, Range } from "./types";

/**
 * Which way the goal points. Derived from start vs goal weight rather than
 * asked for separately — the two numbers already say it.
 */
export function directionOf(startKg: number, goalKg: number): GoalDirection {
  const delta = goalKg - startKg;
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.25) return "maintain";
  return delta > 0 ? "gain" : "lose";
}

/** Meal plans are written for a surplus or a deficit; maintaining uses the balanced one. */
export type PlanTrack = "gain" | "loss";

export function trackOf(direction: GoalDirection): PlanTrack {
  return direction === "lose" ? "loss" : "gain";
}

type DirectionCopy = {
  /** "Weight gain" — used as a noun phrase for the mode. */
  label: string;
  /** "gain" — used mid-sentence: "7.0 kg to gain". */
  verb: string;
  /** "Gained" — a stat label for total change so far. */
  changeLabel: string;
  /** "to gain" / "to lose" — goal-remaining phrasing. */
  remainingVerb: string;
  headline: string;
  blurb: string;
  planName: string;
  weeklyHint: string;
};

export const DIRECTION_COPY: Record<GoalDirection, DirectionCopy> = {
  gain: {
    label: "Weight gain",
    verb: "gain",
    changeLabel: "Gained",
    remainingVerb: "to gain",
    headline: "Gain weight the\nsteady way.",
    blurb:
      "A structured seven-day meal plan, six meals a day, and the four numbers that actually move the needle: calories, protein, water and your weekly weight average.",
    planName: "Weight-gain plan",
    weeklyHint: "A healthy pace is 0.2–0.35 kg gained per week.",
  },
  lose: {
    label: "Weight loss",
    verb: "lose",
    changeLabel: "Lost",
    remainingVerb: "to lose",
    headline: "Lose weight the\nsteady way.",
    blurb:
      "A structured seven-day meal plan, six balanced meals a day, and the four numbers that actually move the needle: calories, protein, water and your weekly weight average.",
    planName: "Weight-loss plan",
    weeklyHint: "A healthy pace is 0.25–0.5 kg lost per week.",
  },
  maintain: {
    label: "Weight maintenance",
    verb: "maintain",
    changeLabel: "Changed",
    remainingVerb: "from target",
    headline: "Hold your weight,\nsteadily.",
    blurb:
      "A structured seven-day meal plan, six meals a day, and the four numbers that keep you level: calories, protein, water and your weekly weight average.",
    planName: "Maintenance plan",
    weeklyHint: "Staying within ±0.15 kg a week is holding steady.",
  },
};

export type DirectionTargets = {
  calorieTarget: Range;
  proteinTarget: Range;
  waterTargetMl: Range;
  weeklyChangeTarget: Range;
};

/**
 * Recommended starting targets per direction. Gain figures are the BRD defaults;
 * loss is a moderate deficit with protein raised to protect lean mass.
 */
export const RECOMMENDED_TARGETS: Record<GoalDirection, DirectionTargets> = {
  gain: {
    calorieTarget: { min: 1800, max: 1950 },
    proteinTarget: { min: 65, max: 75 },
    waterTargetMl: { min: 1800, max: 2200 },
    weeklyChangeTarget: { min: 0.2, max: 0.35 },
  },
  lose: {
    calorieTarget: { min: 1400, max: 1600 },
    proteinTarget: { min: 75, max: 95 },
    waterTargetMl: { min: 2500, max: 3000 },
    weeklyChangeTarget: { min: -0.5, max: -0.25 },
  },
  maintain: {
    calorieTarget: { min: 1900, max: 2100 },
    proteinTarget: { min: 70, max: 85 },
    waterTargetMl: { min: 2000, max: 2500 },
    weeklyChangeTarget: { min: -0.15, max: 0.15 },
  },
};

/**
 * +1 when a weight change moves toward the goal, -1 when away, 0 when it is
 * neither (a flat week, or any small drift while maintaining).
 */
export function progressSign(change: number, direction: GoalDirection): -1 | 0 | 1 {
  if (direction === "maintain") return 0;
  if (Math.abs(change) < 0.01) return 0;
  const towardGoal = direction === "gain" ? change > 0 : change < 0;
  return towardGoal ? 1 : -1;
}

export type PaceState = "unknown" | "on-pace" | "slow" | "fast" | "reverse";

/**
 * How this week's change compares with the target band. The same comparison
 * works in both directions because a loss target is a negative range.
 */
export function paceOf(
  change: number | undefined,
  target: Range,
  direction: GoalDirection,
): PaceState {
  if (change === undefined) return "unknown";
  if (direction === "maintain") {
    return change >= target.min && change <= target.max ? "on-pace" : "fast";
  }
  if (progressSign(change, direction) === -1) return "reverse";
  if (change >= target.min && change <= target.max) return "on-pace";
  // Outside the band: which side depends on which way the goal points.
  return direction === "gain"
    ? change < target.min
      ? "slow"
      : "fast"
    : change > target.max
      ? "slow"
      : "fast";
}

export function paceLabel(state: PaceState, direction: GoalDirection): string {
  switch (state) {
    case "on-pace":
      return "On target pace";
    case "slow":
      return direction === "gain" ? "Slower than target" : "Slower than target";
    case "fast":
      return direction === "maintain" ? "Drifting off target" : "Faster than target";
    case "reverse":
      return direction === "gain" ? "Trending down" : "Trending up";
    default:
      return "Needs two weeks of data";
  }
}

/** Formats a signed change with an explicit sign, e.g. "+0.30" / "−0.45". */
export function formatChange(kg: number, dp = 2): string {
  const sign = kg > 0 ? "+" : kg < 0 ? "−" : "";
  return `${sign}${Math.abs(kg).toFixed(dp)}`;
}
