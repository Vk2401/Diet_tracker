"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { todayKey } from "@/lib/date";
import { requestPermission } from "@/lib/notifications";
import { DEFAULT_PROFILE } from "@/lib/defaults";
import { plannedDayTotals } from "@/lib/plan";
import { IconBell, IconCheck, IconChevronLeft, IconSparkle } from "@/components/icons";
import { Bar } from "@/components/ui";

const STEPS = ["Welcome", "About you", "Targets", "Reminders"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { state, setProfile } = useStore();
  const [step, setStep] = useState(0);

  const [name, setName] = useState(state.profile.name);
  const [start, setStart] = useState(String(state.profile.startWeightKg));
  const [goal, setGoal] = useState(String(state.profile.goalWeightKg));
  const [height, setHeight] = useState(state.profile.heightCm ? String(state.profile.heightCm) : "");
  const [kcalMin, setKcalMin] = useState(String(state.profile.calorieTarget.min));
  const [kcalMax, setKcalMax] = useState(String(state.profile.calorieTarget.max));
  const [proMin, setProMin] = useState(String(state.profile.proteinTarget.min));
  const [proMax, setProMax] = useState(String(state.profile.proteinTarget.max));
  const [waterMin, setWaterMin] = useState(String(state.profile.waterTargetMl.min / 1000));
  const [waterMax, setWaterMax] = useState(String(state.profile.waterTargetMl.max / 1000));
  const [notifyState, setNotifyState] = useState<string>("");

  const num = (s: string, fallback: number) => {
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : fallback;
  };

  const startKg = num(start, DEFAULT_PROFILE.startWeightKg);
  const goalKg = num(goal, DEFAULT_PROFILE.goalWeightKg);
  const delta = goalKg - startKg;
  const weeksMin = delta > 0 ? Math.ceil(delta / 0.35) : 0;
  const weeksMax = delta > 0 ? Math.ceil(delta / 0.2) : 0;
  const weightsValid = startKg > 20 && startKg < 250 && goalKg > startKg && goalKg < 250;

  const finish = () => {
    setProfile({
      name: name.trim(),
      startWeightKg: startKg,
      goalWeightKg: goalKg,
      heightCm: height ? num(height, 0) || undefined : undefined,
      startDate: todayKey(),
      calorieTarget: { min: num(kcalMin, 1800), max: num(kcalMax, 1950) },
      proteinTarget: { min: num(proMin, 65), max: num(proMax, 75) },
      waterTargetMl: {
        min: Math.round(num(waterMin, 1.8) * 1000),
        max: Math.round(num(waterMax, 2.2) * 1000),
      },
      onboarded: true,
    });
    router.replace("/");
  };

  const askNotifications = async () => {
    const result = await requestPermission();
    setNotifyState(result);
  };

  return (
    <div
      className="min-h-dvh px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]"
      style={{
        background:
          "linear-gradient(170deg, color-mix(in srgb, var(--brand) 18%, var(--bg)) 0%, var(--bg) 60%)",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col">
        {/* Progress */}
        <div className="mb-7 flex items-center gap-3">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              aria-label="Back"
              className="btn btn-ghost !p-2"
            >
              <IconChevronLeft width={17} height={17} />
            </button>
          ) : (
            <span className="h-9 w-9" />
          )}
          <div className="flex flex-1 gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-pill transition-colors"
                style={{ background: i <= step ? "var(--brand)" : "var(--border)" }}
              />
            ))}
          </div>
          <span className="num text-xs font-semibold text-ink-faint">
            {step + 1}/{STEPS.length}
          </span>
        </div>

        <div className="flex-1 animate-rise">
          {step === 0 && <Welcome />}

          {step === 1 && (
            <Step
              title="About you"
              body="Your starting and goal weight drive every progress number in the app. You can change them later in Settings."
            >
              <Field label="Name (optional)">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="field"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starting weight" suffix="kg">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="field num pr-9 font-bold"
                  />
                </Field>
                <Field label="Goal weight" suffix="kg">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="field num pr-9 font-bold"
                  />
                </Field>
              </div>
              <Field label="Height (optional)" suffix="cm">
                <input
                  type="number"
                  inputMode="numeric"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="—"
                  className="field num pr-10"
                />
              </Field>

              {weightsValid && (
                <div className="card p-3.5" style={{ background: "var(--brand-soft)", borderColor: "transparent" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                    {delta.toFixed(1)} kg to gain
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--brand)" }}>
                    At a healthy 0.2–0.35 kg per week that is roughly {weeksMin}–{weeksMax} weeks of
                    consistent tracking. Steady beats fast.
                  </p>
                </div>
              )}
              {!weightsValid && (
                <p className="text-xs" style={{ color: "var(--danger)" }}>
                  Goal weight needs to be higher than your starting weight.
                </p>
              )}
            </Step>
          )}

          {step === 2 && (
            <Step
              title="Daily targets"
              body="These defaults come from the plan. Adjust the ranges if a dietitian has given you different numbers."
            >
              <RangeField
                label="Calories"
                unit="kcal / day"
                min={kcalMin}
                max={kcalMax}
                onMin={setKcalMin}
                onMax={setKcalMax}
                step="10"
              />
              <RangeField
                label="Protein"
                unit="g / day"
                min={proMin}
                max={proMax}
                onMin={setProMin}
                onMax={setProMax}
                step="1"
              />
              <RangeField
                label="Water"
                unit="L / day"
                min={waterMin}
                max={waterMax}
                onMin={setWaterMin}
                onMax={setWaterMax}
                step="0.1"
              />
              <PlanPreview />
            </Step>
          )}

          {step === 3 && (
            <Step
              title="Stay on schedule"
              body="Reminders nudge you for each meal, the morning weigh-in and regular water. Everything stays on this device."
            >
              <button onClick={askNotifications} className="btn btn-primary w-full">
                <IconBell width={17} height={17} />
                Enable reminders
              </button>
              {notifyState === "granted" && (
                <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--brand)" }}>
                  <IconCheck width={15} height={15} /> Reminders are on.
                </p>
              )}
              {notifyState === "denied" && (
                <p className="text-sm" style={{ color: "var(--danger)" }}>
                  Notifications are blocked in your browser. You can turn them on later from
                  Reminders.
                </p>
              )}
              {notifyState === "unsupported" && (
                <p className="text-sm text-ink-muted">
                  This browser doesn&apos;t support notifications — the in-app schedule still works.
                </p>
              )}
              <ul className="space-y-2 pt-1 text-sm text-ink-muted">
                {[
                  "Six meal reminders across the day",
                  "A morning weigh-in prompt",
                  "Water nudges every 2 hours",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <IconCheck width={15} height={15} className="mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ink-faint">
                You can skip this and enable reminders any time.
              </p>
            </Step>
          )}
        </div>

        <div className="mt-8 space-y-2">
          <button
            onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
            disabled={step === 1 && !weightsValid}
            className="btn btn-primary w-full !py-3.5 text-base"
          >
            {step === STEPS.length - 1 ? "Start tracking" : "Continue"}
          </button>
          {step === STEPS.length - 1 && (
            <button onClick={finish} className="btn w-full !py-2 text-sm text-ink-faint">
              Skip reminders for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Welcome() {
  return (
    <div className="pt-6">
      <span
        className="grid h-16 w-16 place-items-center rounded-card"
        style={{ background: "var(--brand)", color: "var(--brand-contrast)" }}
      >
        <IconSparkle width={30} height={30} />
      </span>
      <h1 className="mt-6 text-[2.1rem] font-extrabold leading-[1.1] tracking-tight">
        Gain weight the
        <br />
        steady way.
      </h1>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-muted">
        A structured seven-day meal plan, six meals a day, and the four numbers that actually move
        the needle: calories, protein, water and your weekly weight average.
      </p>
      <ul className="mt-7 space-y-3">
        {[
          ["Follow the plan", "A ready-made 7-day rotation with swappable alternatives."],
          ["Log in seconds", "Tap to complete a meal — calories and protein add themselves."],
          ["Watch the trend", "Weekly averages, not daily noise, tell you if it's working."],
        ].map(([t, d]) => (
          <li key={t} className="flex gap-3">
            <span
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-pill"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              <IconCheck width={13} height={13} />
            </span>
            <div>
              <p className="text-sm font-semibold">{t}</p>
              <p className="text-[0.82rem] text-ink-muted">{d}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-7 text-xs leading-relaxed text-ink-faint">
        This app supports a nutrition plan — it is not medical advice. Check with a doctor or
        dietitian before making significant dietary changes.
      </p>
    </div>
  );
}

function Step({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-[1.65rem] font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  suffix,
  children,
}: {
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <span className="relative block">
        {children}
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

function RangeField({
  label,
  unit,
  min,
  max,
  onMin,
  onMax,
  step,
}: {
  label: string;
  unit: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  step: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
          {label}
        </span>
        <span className="text-[0.7rem] text-ink-faint">{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={min}
          onChange={(e) => onMin(e.target.value)}
          aria-label={`${label} minimum`}
          className="field num font-bold"
        />
        <span className="text-ink-faint">–</span>
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={max}
          onChange={(e) => onMax(e.target.value)}
          aria-label={`${label} maximum`}
          className="field num font-bold"
        />
      </div>
    </div>
  );
}

function PlanPreview() {
  const weekly = Array.from({ length: 7 }, (_, i) => plannedDayTotals(i));
  const avgKcal = Math.round(weekly.reduce((a, d) => a + d.kcal, 0) / 7);
  const avgPro = Math.round(weekly.reduce((a, d) => a + d.protein, 0) / 7);
  return (
    <div className="card p-3.5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
        Default plan delivers
      </p>
      <div className="mt-2 flex items-baseline gap-4">
        <p className="num text-lg font-bold">
          {avgKcal} <span className="text-xs font-semibold text-ink-faint">kcal/day avg</span>
        </p>
        <p className="num text-lg font-bold">
          {avgPro} <span className="text-xs font-semibold text-ink-faint">g protein</span>
        </p>
      </div>
      <div className="mt-2.5">
        <Bar value={1} height={6} />
      </div>
    </div>
  );
}
