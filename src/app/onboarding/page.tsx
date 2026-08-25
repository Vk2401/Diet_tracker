"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { todayKey } from "@/lib/date";
import type { GoalDirection } from "@/lib/types";
import { requestPermission } from "@/lib/notifications";
import { DEFAULT_PROFILE } from "@/lib/defaults";
import { plannedDayTotals } from "@/lib/plan";
import { DIRECTION_COPY, RECOMMENDED_TARGETS, directionOf, trackOf } from "@/lib/goal";
import { IconBell, IconCheck, IconChevronLeft, IconSparkle } from "@/components/icons";
import { Bar } from "@/components/ui";

const STEPS = ["Welcome", "About you", "Targets", "Reminders"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { state, setProfile } = useStore();
  const [step, setStep] = useState(0);

  const [name, setName] = useState(state.profile.name);
  const [start, setStart] = useState("");
  const [goal, setGoal] = useState("");
  const [height, setHeight] = useState(state.profile.heightCm ? String(state.profile.heightCm) : "");
  const [targets, setTargets] = useState(RECOMMENDED_TARGETS.gain);
  const [targetsTouched, setTargetsTouched] = useState(false);
  const [notifyState, setNotifyState] = useState<string>("");

  const num = (s: string, fallback: number) => {
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : fallback;
  };

  const startKg = num(start, DEFAULT_PROFILE.startWeightKg);
  const goalKg = num(goal, DEFAULT_PROFILE.goalWeightKg);
  const direction = directionOf(startKg, goalKg);
  const copy = DIRECTION_COPY[direction];
  const recommended = RECOMMENDED_TARGETS[direction];
  const delta = Math.abs(goalKg - startKg);

  // Pace is whichever end of the recommended band moves fastest/slowest.
  const paceFast = Math.max(
    Math.abs(recommended.weeklyChangeTarget.min),
    Math.abs(recommended.weeklyChangeTarget.max),
  );
  const paceSlow = Math.min(
    Math.abs(recommended.weeklyChangeTarget.min),
    Math.abs(recommended.weeklyChangeTarget.max),
  );
  const weeksMin = delta > 0 && paceFast > 0 ? Math.ceil(delta / paceFast) : 0;
  const weeksMax = delta > 0 && paceSlow > 0 ? Math.ceil(delta / paceSlow) : 0;

  // Only the numbers themselves need to be sane — either direction is a valid goal.
  const inRange = (n: number) => n >= 20 && n <= 300;
  const weightsValid =
    start.trim() !== "" && goal.trim() !== "" && inRange(startKg) && inRange(goalKg);

  useEffect(() => {
    if (!targetsTouched) setTargets(RECOMMENDED_TARGETS[direction]);
  }, [direction, targetsTouched]);

  const finish = () => {
    setProfile({
      name: name.trim(),
      startWeightKg: startKg,
      goalWeightKg: goalKg,
      heightCm: height ? num(height, 0) || undefined : undefined,
      startDate: todayKey(),
      ...targets,
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
                    placeholder="—"
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
                    placeholder="—"
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

              {weightsValid && direction !== "maintain" && (
                <div className="card p-3.5" style={{ background: "var(--brand-soft)", borderColor: "transparent" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                    {delta.toFixed(1)} kg {copy.remainingVerb}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--brand)" }}>
                    {copy.weeklyHint} That is roughly {weeksMin}–{weeksMax} weeks of consistent
                    tracking. Steady beats fast.
                  </p>
                </div>
              )}
              {weightsValid && direction === "maintain" && (
                <div className="card p-3.5" style={{ background: "var(--brand-soft)", borderColor: "transparent" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                    Holding at {goalKg.toFixed(1)} kg
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--brand)" }}>
                    {copy.weeklyHint} We&apos;ll track the weekly average so drift shows up early.
                  </p>
                </div>
              )}
              {!weightsValid && (start.trim() !== "" || goal.trim() !== "") && (
                <p className="text-xs" style={{ color: "var(--danger)" }}>
                  Enter both weights, between 20 and 300 kg.
                </p>
              )}
            </Step>
          )}

          {step === 2 && (
            <Step
              title="Daily targets"
              body={`These are the recommended ranges for a ${copy.label.toLowerCase()} goal. Adjust them if a dietitian has given you different numbers.`}
            >
              <RangeField
                label="Calories"
                unit="kcal / day"
                min={String(targets.calorieTarget.min)}
                max={String(targets.calorieTarget.max)}
                onMin={(v) => {
                  setTargetsTouched(true);
                  setTargets((t) => ({ ...t, calorieTarget: { ...t.calorieTarget, min: num(v, t.calorieTarget.min) } }));
                }}
                onMax={(v) => {
                  setTargetsTouched(true);
                  setTargets((t) => ({ ...t, calorieTarget: { ...t.calorieTarget, max: num(v, t.calorieTarget.max) } }));
                }}
                step="10"
              />
              <RangeField
                label="Protein"
                unit="g / day"
                min={String(targets.proteinTarget.min)}
                max={String(targets.proteinTarget.max)}
                onMin={(v) => {
                  setTargetsTouched(true);
                  setTargets((t) => ({ ...t, proteinTarget: { ...t.proteinTarget, min: num(v, t.proteinTarget.min) } }));
                }}
                onMax={(v) => {
                  setTargetsTouched(true);
                  setTargets((t) => ({ ...t, proteinTarget: { ...t.proteinTarget, max: num(v, t.proteinTarget.max) } }));
                }}
                step="1"
              />
              <RangeField
                label="Water"
                unit="L / day"
                min={String(targets.waterTargetMl.min / 1000)}
                max={String(targets.waterTargetMl.max / 1000)}
                onMin={(v) => {
                  setTargetsTouched(true);
                  setTargets((t) => ({ ...t, waterTargetMl: { ...t.waterTargetMl, min: Math.round(num(v, 1.8) * 1000) } }));
                }}
                onMax={(v) => {
                  setTargetsTouched(true);
                  setTargets((t) => ({ ...t, waterTargetMl: { ...t.waterTargetMl, max: Math.round(num(v, 2.2) * 1000) } }));
                }}
                step="0.1"
              />
              <PlanPreview direction={direction} />
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
        Reach your weight
        <br />
        goal, steadily.
      </h1>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-muted">
        Gaining or losing, it works the same way: a structured seven-day meal plan, six meals a day,
        and the four numbers that actually move the needle — calories, protein, water and your
        weekly weight average.
      </p>
      <ul className="mt-7 space-y-3">
        {[
          ["Follow the plan", "A ready-made 7-day rotation, matched to your goal, with swappable alternatives."],
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

function PlanPreview({ direction }: { direction: GoalDirection }) {
  const track = trackOf(direction);
  const weekly = Array.from({ length: 7 }, (_, i) => plannedDayTotals(track, i));
  const avgKcal = Math.round(weekly.reduce((a, d) => a + d.kcal, 0) / 7);
  const avgPro = Math.round(weekly.reduce((a, d) => a + d.protein, 0) / 7);
  return (
    <div className="card p-3.5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
        {DIRECTION_COPY[direction].planName} delivers
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
