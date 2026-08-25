# Weight Goal Tracker

A mobile-first **Next.js PWA** built from the *Healthy Weight-Gain Daily Nutrition & Progress Tracker*
BRD (v1.0) and extended to work in **both directions — weight gain and weight loss**. Follow a
structured seven-day diet plan, log six meals a day, and track calories, protein, hydration and
weekly weight progress toward a goal.

The goal direction is **derived from your start and goal weight** — set the goal higher to gain,
lower to lose, or the same to maintain. Everything else follows from it: which meal plan is active,
the recommended targets, the copy, and whether a given week's change is coloured as progress.

| | Gain | Lose | Maintain |
|---|---|---|---|
| Calories | 1,800–1,950 | 1,400–1,600 | 1,900–2,100 |
| Protein | 65–75 g | 75–95 g | 70–85 g |
| Water | 1.8–2.2 L | 2.5–3.0 L | 2.0–2.5 L |
| Weekly change | +0.2 to +0.35 kg | −0.5 to −0.25 kg | ±0.15 kg |

Every target is editable in Settings; a one-tap button re-applies the recommended set for the
current direction.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Requires Node 18.18+. No API keys, database or backend — the app is entirely client-side.

---

## Screens

| Route | Screen | What it does |
|---|---|---|
| `/onboarding` | Onboarding | 4 steps: welcome → weights → targets → reminders. Detects the goal direction as you type and recommends matching targets. Runs once. |
| `/` | Today's dashboard | Meal adherence ring, calorie/protein bars, weight snapshot, six meal cards, hydration, weigh-in, notes. Steps ±2 days. |
| `/meal/[date]/[slot]` | Meal detail | Complete/skip, portion multiplier, manual kcal/protein override, swap to an alternative, per-meal notes. |
| `/plan` | 7-day diet plan | The recurring weekly rotation for the active direction, with per-day totals and swappable alternatives. |
| `/weight` | Weight tracker | Log/edit/remove daily weights, trend chart, weekly averages, goal progress, history. |
| `/progress` | Progress dashboard | Goal ring, weight trend, 14-day averages, daily calorie bars, week-over-week averages. |
| `/report` | Weekly adherence report | Meal adherence, weight change, macro & hydration averages, missed meals, best day, improvements. Steps back week by week. |
| `/reminders` | Reminders | Per-reminder time + on/off, hydration cadence, notification permission. |
| `/settings` | Settings | Profile, goal direction, editable targets, theme, glass size, week start, JSON export/import, erase all. |

---

## Architecture

```
src/
  app/                    App Router pages (all client components)
  components/             AppShell, BottomNav, TopBar, MealCard, WaterCard,
                          WeightQuickLog, WeightChart, PwaProvider, ui primitives, icons
  lib/
    types.ts              Domain model
    goal.ts               Goal direction, recommended targets, pace and tone helpers
    plan.ts               Meal-option catalog + the 7-day gain and loss plans
    defaults.ts           Initial state, default targets and reminders
    store.tsx             React context store, debounced localStorage persistence
    nutrition.ts          Per-entry and per-day nutrition resolution
    stats.ts              Weekly averages, goal progress, weekly report
    date.ts               Local-timezone date helpers
    notifications.ts      Reminder scheduling and delivery
public/
  manifest.webmanifest    Installable app manifest with shortcuts
  sw.js                   Offline-first service worker
  icons/                  App, maskable and badge icons
```

### State and storage

All data lives in `localStorage` under `hwg-tracker-state` — nothing is sent anywhere. The key is
unchanged from v1 so existing installs keep their history; a v1 → v2 migration renames
`weeklyGainTarget` to `weeklyChangeTarget`, namespaces plan overrides by track, backfills new
reminders and refreshes reminder wording while preserving each user's times and on/off choices. Writes are
debounced 200 ms so rapid taps (water, portions) don't thrash storage. Loading is deferred to a
mount effect so server and client render the same pristine tree, and `AppShell` shows a spinner
until hydration completes.

**Historical logs are preserved when the plan changes.** A day's meals are only written into
`days[date]` when you interact with them; unlogged days resolve against the recurring plan on read.
Editing the plan therefore affects future days only — anything already logged keeps its original
food, portions and nutrition (BRD §14).

### Goal direction

`lib/goal.ts` derives the direction from the two weights (`gain` / `lose` / `maintain`, with a
0.25 kg dead-band around equal) and exposes everything that depends on it: recommended targets,
per-direction copy, and two helpers that keep the UI honest in both directions —

- `progressSign(change, direction)` — is this change *toward* the goal? Losing 0.4 kg is green on a
  loss goal and red on a gain goal, from one place.
- `paceOf(change, target, direction)` — `on-pace` / `slow` / `fast` / `reverse`. A loss target is
  simply a negative range, so the same band comparison works unchanged for both.

### Nutrition model

`lib/plan.ts` holds a catalog of `MealOption`s (label, ingredient breakdown, planned portion,
estimated kcal/protein), tagged by meal slot **and track** (`gain` or `loss`). Each track has its
own 7-day week plan; every other option for that slot *on the same track* becomes a one-tap
alternative. This covers the BRD's substitutions (dosa/idli/oats, paneer/tofu,
chicken/chickpeas/rajma/fish/egg, rice/chapati) and keeps a weight-gain shake from ever appearing
in a weight-loss plan.

Effective nutrition for a logged meal is `override ?? (option value × portion factor)`, so portion
changes and swaps recalculate automatically while manual entry still wins.

Planned-portion estimates are tuned so every day of each plan lands inside that plan's calorie
target — gain averages ~1,919 kcal/day, loss ~1,499 kcal/day, with loss protein kept at 76–95 g to
protect lean mass. `scripts`-free verification: the plan page shows each day's totals against the
target band.

**Note:** taken at maximum realistic portions the BRD's written gain plan would exceed its own
1,800–1,950 kcal target, so the estimates assume moderate portions. Every target is editable in
Settings, and any meal's calories/protein can be overridden directly.

### Progress logic

Goal progress follows the BRD formula exactly, and works unchanged in both directions because both
numerator and denominator flip sign together:

```
(current − start) / (goal − start) × 100

gain:  (44.6 − 43) / (50 − 43)   × 100 = 23%
loss:  (99.7 − 102) / (88 − 102) × 100 = 16%
```

Distance remaining is reported as an absolute value, so "kg to go" is never negative.

`current` is the most recent logged weight. The weekly average is the primary indicator; the trend
chart plots daily entries against a 7-day rolling average, and week-over-week change compares this
week's mean to last week's. **No target date is ever projected** (BRD §8).

### Reminders

Eight configurable reminders (weigh-in, six meals, repeating hydration). A client-only PWA can't
wake itself without a push server, so delivery is best-effort: due reminders fire while the app is
open — on load, every 60 s, and on tab focus — and anything due in the last 30 minutes is caught up
the next time you open the app. Fired reminders are de-duplicated per day.

### PWA

- `sw.js` — network-first for navigations (deploys land immediately) with a cached fallback and an
  `/offline` page; cache-first with background refresh for static assets.
- `PwaProvider` registers the worker, exposes the deferred `beforeinstallprompt` for the in-app
  install banner, and surfaces a "new version ready" refresh prompt.
- Manifest ships `standalone` display, three app shortcuts, and maskable icons.

### Design

A CSS custom-property design system in `globals.css` with a full light and dark palette,
`system`/`light`/`dark` theme override, safe-area insets, tabular figures, and reduced-motion
support. Chart colors are dedicated tokens validated for colorblind separation and contrast against
both surfaces.

---

## Not implemented (BRD §13, explicitly future scope)

Food database, barcode scanning, recipes, grocery list, photo meal logging, Apple Health / Google
Health Connect, PDF/CSV reports, AI meal suggestions and adaptive recommendations.

---

This app supports a nutrition plan and is **not medical advice**. Consult a doctor or dietitian
before significant dietary changes.
