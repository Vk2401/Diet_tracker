import { todayKey } from "./date";
import { RECOMMENDED_TARGETS } from "./goal";
import type { AppState, Profile, Reminder, Settings } from "./types";

/** Kept from v1 so existing installs keep their history. */
export const STORAGE_KEY = "hwg-tracker-state";
export const STATE_VERSION = 2;

export const DEFAULT_PROFILE: Profile = {
  name: "",
  startWeightKg: 43,
  goalWeightKg: 50,
  startDate: todayKey(),
  ...RECOMMENDED_TARGETS.gain,
  onboarded: false,
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  waterGlassMl: 250,
  weekStartsOn: 1,
};

export const DEFAULT_REMINDERS: Reminder[] = [
  { id: "weigh-in", label: "Morning weigh-in", time: "07:00", enabled: true },
  { id: "breakfast", label: "Breakfast", time: "08:00", enabled: true },
  { id: "midMorning", label: "Mid-morning snack", time: "11:00", enabled: true },
  { id: "lunch", label: "Lunch", time: "13:30", enabled: true },
  { id: "evening", label: "Evening snack", time: "17:00", enabled: true },
  { id: "dinner", label: "Dinner", time: "20:30", enabled: true },
  { id: "bedtime", label: "Bedtime", time: "22:30", enabled: true },
  {
    id: "hydration",
    label: "Drink water",
    time: "09:00",
    endTime: "21:00",
    repeatEveryMin: 120,
    enabled: true,
  },
];

export function makeInitialState(): AppState {
  return {
    version: STATE_VERSION,
    profile: { ...DEFAULT_PROFILE, startDate: todayKey() },
    settings: { ...DEFAULT_SETTINGS },
    reminders: DEFAULT_REMINDERS.map((r) => ({ ...r })),
    days: {},
    planOverrides: {},
  };
}
