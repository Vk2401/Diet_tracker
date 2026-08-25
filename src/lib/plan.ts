import { MEAL_SLOTS, type MealOption, type MealSlot } from "./types";

export const SLOT_META: Record<
  MealSlot,
  { label: string; short: string; icon: string; defaultTime: string }
> = {
  breakfast: { label: "Breakfast", short: "B'fast", icon: "sunrise", defaultTime: "08:00" },
  midMorning: { label: "Mid-morning", short: "Shake", icon: "cup", defaultTime: "11:00" },
  lunch: { label: "Lunch", short: "Lunch", icon: "bowl", defaultTime: "13:30" },
  evening: { label: "Evening snack", short: "Snack", icon: "apple", defaultTime: "17:00" },
  dinner: { label: "Dinner", short: "Dinner", icon: "plate", defaultTime: "20:30" },
  bedtime: { label: "Bedtime", short: "Bedtime", icon: "moon", defaultTime: "22:30" },
};

/**
 * Catalog of meal options. Nutrition figures are planned-portion estimates for
 * the BRD's default plan and are tuned so a full day lands inside the default
 * 1,800–1,950 kcal target. Users can override calories/protein per meal.
 */
export const MEAL_OPTIONS: MealOption[] = [
  // ---- Breakfast -------------------------------------------------------
  {
    id: "bf-dosa",
    slot: "breakfast",
    label: "3 dosa + sambar + 100 g paneer + full-fat milk",
    items: ["3 dosa", "Sambar", "100 g paneer", "200 ml full-fat milk"],
    kcal: 380,
    protein: 16,
    portion: "1 plate + 1 glass",
    tags: ["vegetarian", "south-indian"],
  },
  {
    id: "bf-idli",
    slot: "breakfast",
    label: "4 idli + sambar + chutney + milk",
    items: ["4 idli", "Sambar", "Coconut chutney", "200 ml milk"],
    kcal: 355,
    protein: 12,
    portion: "1 plate + 1 glass",
    tags: ["vegetarian", "south-indian"],
  },
  {
    id: "bf-oats",
    slot: "breakfast",
    label: "60 g oats + milk + banana + 1 tbsp peanut butter + 2 dates",
    items: ["60 g oats", "200 ml milk", "1 banana", "1 tbsp peanut butter", "2 dates"],
    kcal: 390,
    protein: 14,
    portion: "1 bowl",
    tags: ["vegetarian", "high-energy"],
  },
  {
    id: "bf-poha",
    slot: "breakfast",
    label: "Peanut poha + boiled egg + milk",
    items: ["1 bowl poha with peanuts", "1 boiled egg", "200 ml milk"],
    kcal: 370,
    protein: 17,
    portion: "1 bowl",
    tags: ["egg"],
  },
  {
    id: "bf-upma",
    slot: "breakfast",
    label: "Vegetable upma + curd + milk",
    items: ["1 bowl vegetable upma", "100 g curd", "200 ml milk"],
    kcal: 350,
    protein: 13,
    portion: "1 bowl",
    tags: ["vegetarian"],
  },
  {
    id: "bf-paratha",
    slot: "breakfast",
    label: "2 stuffed paratha + curd + milk",
    items: ["2 paneer/aloo paratha", "100 g curd", "150 ml milk"],
    kcal: 395,
    protein: 15,
    portion: "2 pieces",
    tags: ["vegetarian", "north-indian"],
  },

  // ---- Mid-morning -----------------------------------------------------
  {
    id: "mm-shake-oats",
    slot: "midMorning",
    label: "Banana–date–oats–peanut butter milk shake",
    items: ["1 banana", "3 dates", "20 g oats", "1 tbsp peanut butter", "250 ml milk"],
    kcal: 320,
    protein: 11,
    portion: "1 tall glass",
    tags: ["shake"],
  },
  {
    id: "mm-banana-milk",
    slot: "midMorning",
    label: "Banana + milk + 2 dates + peanut butter + 20 g oats",
    items: ["1 banana", "250 ml milk", "2 dates", "1 tbsp peanut butter", "20 g oats"],
    kcal: 330,
    protein: 12,
    portion: "1 tall glass",
    tags: ["shake"],
  },
  {
    id: "mm-gainer",
    slot: "midMorning",
    label: "Weight-gain shake",
    items: ["250 ml milk", "1 banana", "3 dates", "10 g almonds", "1 tsp ghee"],
    kcal: 315,
    protein: 11,
    portion: "1 tall glass",
    tags: ["shake"],
  },
  {
    id: "mm-banana-date",
    slot: "midMorning",
    label: "Banana–date milk shake",
    items: ["1 banana", "4 dates", "250 ml milk"],
    kcal: 295,
    protein: 10,
    portion: "1 tall glass",
    tags: ["shake"],
  },
  {
    id: "mm-nuts",
    slot: "midMorning",
    label: "Mixed nuts + dates + milk",
    items: ["25 g mixed nuts", "3 dates", "200 ml milk"],
    kcal: 310,
    protein: 10,
    portion: "1 handful + 1 glass",
    tags: ["no-blender"],
  },
  {
    id: "mm-lassi",
    slot: "midMorning",
    label: "Sweet lassi + 10 g almonds",
    items: ["300 ml sweet lassi", "10 g almonds"],
    kcal: 300,
    protein: 11,
    portion: "1 tall glass",
    tags: ["no-blender"],
  },

  // ---- Lunch -----------------------------------------------------------
  {
    id: "ln-chicken",
    slot: "lunch",
    label: "Rice + dal + 100–120 g chicken + vegetables + curd",
    items: ["1.5 cup rice", "1 katori dal", "100–120 g chicken curry", "Vegetables", "100 g curd"],
    kcal: 420,
    protein: 22,
    portion: "1 plate",
    tags: ["non-veg"],
  },
  {
    id: "ln-rajma",
    slot: "lunch",
    label: "Rice + dal + chickpeas/rajma + vegetables + curd + 1 tsp ghee",
    items: ["1.5 cup rice", "1 katori dal", "1 katori rajma/chana", "Vegetables", "100 g curd", "1 tsp ghee"],
    kcal: 430,
    protein: 17,
    portion: "1 plate",
    tags: ["vegetarian"],
  },
  {
    id: "ln-paneer",
    slot: "lunch",
    label: "Rice + dal + paneer + vegetables + curd + 1 tsp ghee",
    items: ["1.5 cup rice", "1 katori dal", "100 g paneer", "Vegetables", "100 g curd", "1 tsp ghee"],
    kcal: 435,
    protein: 20,
    portion: "1 plate",
    tags: ["vegetarian"],
  },
  {
    id: "ln-mixed",
    slot: "lunch",
    label: "Rice + rajma/chickpeas + paneer/tofu + vegetables + curd",
    items: ["1.5 cup rice", "1 katori rajma/chana", "80 g paneer or tofu", "Vegetables", "100 g curd"],
    kcal: 440,
    protein: 21,
    portion: "1 plate",
    tags: ["vegetarian"],
  },
  {
    id: "ln-chapati",
    slot: "lunch",
    label: "3 chapati + dal + vegetables + curd + salad",
    items: ["3 chapati", "1 katori dal", "Vegetables", "100 g curd", "Salad"],
    kcal: 405,
    protein: 16,
    portion: "1 plate",
    tags: ["vegetarian"],
  },
  {
    id: "ln-fish",
    slot: "lunch",
    label: "Rice + dal + fish curry + vegetables + curd",
    items: ["1.5 cup rice", "1 katori dal", "120 g fish curry", "Vegetables", "100 g curd"],
    kcal: 415,
    protein: 24,
    portion: "1 plate",
    tags: ["non-veg"],
  },
  {
    id: "ln-egg",
    slot: "lunch",
    label: "Rice + dal + egg curry (2 eggs) + vegetables + curd",
    items: ["1.5 cup rice", "1 katori dal", "2-egg curry", "Vegetables", "100 g curd"],
    kcal: 425,
    protein: 21,
    portion: "1 plate",
    tags: ["egg"],
  },

  // ---- Evening ---------------------------------------------------------
  {
    id: "ev-paneer-sw",
    slot: "evening",
    label: "Paneer sandwich + fruit",
    items: ["2 slices bread", "60 g paneer filling", "1 fruit"],
    kcal: 235,
    protein: 11,
    portion: "1 sandwich + 1 fruit",
    tags: ["vegetarian"],
  },
  {
    id: "ev-paneer-toast",
    slot: "evening",
    label: "Paneer toast + fruit",
    items: ["2 slices toast", "60 g paneer", "1 fruit"],
    kcal: 235,
    protein: 11,
    portion: "1 serving",
    tags: ["vegetarian"],
  },
  {
    id: "ev-chikki",
    slot: "evening",
    label: "Peanut chikki + banana + milk",
    items: ["1 peanut chikki", "1 banana", "150 ml milk"],
    kcal: 245,
    protein: 8,
    portion: "1 serving",
    tags: ["vegetarian"],
  },
  {
    id: "ev-nuts-curd",
    slot: "evening",
    label: "Nuts + dates + curd",
    items: ["20 g mixed nuts", "3 dates", "150 g curd"],
    kcal: 230,
    protein: 9,
    portion: "1 bowl",
    tags: ["vegetarian"],
  },
  {
    id: "ev-pb-toast",
    slot: "evening",
    label: "Peanut-butter banana toast",
    items: ["2 slices toast", "1 tbsp peanut butter", "1 banana"],
    kcal: 240,
    protein: 8,
    portion: "2 slices",
    tags: ["vegetarian"],
  },
  {
    id: "ev-nuts-banana",
    slot: "evening",
    label: "Nuts + dates + banana + milk",
    items: ["20 g mixed nuts", "2 dates", "1 banana", "150 ml milk"],
    kcal: 250,
    protein: 8,
    portion: "1 serving",
    tags: ["vegetarian"],
  },
  {
    id: "ev-sprouts",
    slot: "evening",
    label: "Sprouts chaat + buttermilk",
    items: ["1 bowl sprouts chaat", "200 ml buttermilk"],
    kcal: 200,
    protein: 12,
    portion: "1 bowl",
    tags: ["vegetarian", "light"],
  },

  // ---- Dinner ----------------------------------------------------------
  {
    id: "dn-paneer",
    slot: "dinner",
    label: "3 chapati + 100 g paneer + dal + vegetables + curd",
    items: ["3 chapati", "100 g paneer", "1 katori dal", "Vegetables", "100 g curd"],
    kcal: 410,
    protein: 20,
    portion: "1 plate",
    tags: ["vegetarian"],
  },
  {
    id: "dn-tofu",
    slot: "dinner",
    label: "3 chapati + tofu/paneer + dal + vegetables + curd",
    items: ["3 chapati", "100 g tofu or paneer", "1 katori dal", "Vegetables", "100 g curd"],
    kcal: 400,
    protein: 19,
    portion: "1 plate",
    tags: ["vegetarian"],
  },
  {
    id: "dn-chicken",
    slot: "dinner",
    label: "3 chapati + 100 g chicken + vegetables + curd",
    items: ["3 chapati", "100 g chicken curry", "Vegetables", "100 g curd"],
    kcal: 395,
    protein: 23,
    portion: "1 plate",
    tags: ["non-veg"],
  },
  {
    id: "dn-chicken-veg",
    slot: "dinner",
    label: "3 chapati + 100–120 g chicken + vegetables + curd",
    items: ["3 chapati", "100–120 g chicken curry", "Vegetables", "100 g curd"],
    kcal: 400,
    protein: 24,
    portion: "1 plate",
    tags: ["non-veg"],
  },
  {
    id: "dn-rajma",
    slot: "dinner",
    label: "3 chapati + chickpea/rajma curry + vegetables + curd",
    items: ["3 chapati", "1 katori rajma/chana curry", "Vegetables", "100 g curd"],
    kcal: 405,
    protein: 17,
    portion: "1 plate",
    tags: ["vegetarian"],
  },
  {
    id: "dn-khichdi",
    slot: "dinner",
    label: "Vegetable khichdi + curd + 1 tsp ghee",
    items: ["1.5 bowl khichdi", "100 g curd", "1 tsp ghee"],
    kcal: 385,
    protein: 14,
    portion: "1 bowl",
    tags: ["vegetarian", "light"],
  },

  // ---- Bedtime ---------------------------------------------------------
  {
    id: "bd-milk-dates",
    slot: "bedtime",
    label: "250 ml full-fat milk + 1–2 dates",
    items: ["250 ml full-fat milk", "1–2 dates"],
    kcal: 170,
    protein: 8,
    portion: "1 glass",
    tags: ["vegetarian"],
  },
  {
    id: "bd-milk",
    slot: "bedtime",
    label: "250 ml milk",
    items: ["250 ml full-fat milk"],
    kcal: 150,
    protein: 8,
    portion: "1 glass",
    tags: ["vegetarian"],
  },
  {
    id: "bd-turmeric",
    slot: "bedtime",
    label: "Turmeric milk + 5 almonds",
    items: ["250 ml turmeric milk", "5 almonds"],
    kcal: 180,
    protein: 9,
    portion: "1 glass",
    tags: ["vegetarian"],
  },
];

export const OPTION_BY_ID: Record<string, MealOption> = Object.fromEntries(
  MEAL_OPTIONS.map((o) => [o.id, o]),
);

export function optionsForSlot(slot: MealSlot): MealOption[] {
  return MEAL_OPTIONS.filter((o) => o.slot === slot);
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Default 7-day plan from the BRD. Index 0 = Sunday … 6 = Saturday. */
export const DEFAULT_WEEK_PLAN: Record<number, Record<MealSlot, string>> = {
  0: {
    breakfast: "bf-dosa",
    midMorning: "mm-banana-date",
    lunch: "ln-chicken",
    evening: "ev-nuts-banana",
    dinner: "dn-tofu",
    bedtime: "bd-milk-dates",
  },
  1: {
    breakfast: "bf-dosa",
    midMorning: "mm-shake-oats",
    lunch: "ln-chicken",
    evening: "ev-paneer-sw",
    dinner: "dn-paneer",
    bedtime: "bd-milk-dates",
  },
  2: {
    breakfast: "bf-idli",
    midMorning: "mm-banana-milk",
    lunch: "ln-rajma",
    evening: "ev-chikki",
    dinner: "dn-tofu",
    bedtime: "bd-milk",
  },
  3: {
    breakfast: "bf-oats",
    midMorning: "mm-gainer",
    lunch: "ln-chicken",
    evening: "ev-paneer-toast",
    dinner: "dn-chicken",
    bedtime: "bd-milk-dates",
  },
  4: {
    breakfast: "bf-dosa",
    midMorning: "mm-banana-milk",
    lunch: "ln-paneer",
    evening: "ev-nuts-curd",
    dinner: "dn-rajma",
    bedtime: "bd-milk",
  },
  5: {
    breakfast: "bf-idli",
    midMorning: "mm-gainer",
    lunch: "ln-chicken",
    evening: "ev-pb-toast",
    dinner: "dn-paneer",
    bedtime: "bd-milk-dates",
  },
  6: {
    breakfast: "bf-oats",
    midMorning: "mm-banana-date",
    lunch: "ln-mixed",
    evening: "ev-paneer-sw",
    dinner: "dn-chicken-veg",
    bedtime: "bd-milk",
  },
};

/** Planned option id for a weekday + slot, honouring user plan overrides. */
export function plannedOptionId(
  weekday: number,
  slot: MealSlot,
  overrides: Record<string, string> = {},
): string {
  return overrides[`${weekday}:${slot}`] ?? DEFAULT_WEEK_PLAN[weekday][slot];
}

export function plannedDayTotals(
  weekday: number,
  overrides: Record<string, string> = {},
): { kcal: number; protein: number } {
  return MEAL_SLOTS.reduce(
    (acc, slot) => {
      const opt = OPTION_BY_ID[plannedOptionId(weekday, slot, overrides)];
      return { kcal: acc.kcal + (opt?.kcal ?? 0), protein: acc.protein + (opt?.protein ?? 0) };
    },
    { kcal: 0, protein: 0 },
  );
}
