"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { addDays, fromKey, nowMinutes, relativeDayLabel, todayKey, weekdayOf } from "@/lib/date";
import { dayTotals, resolveEntry, targetState } from "@/lib/nutrition";
import { SLOT_META } from "@/lib/plan";
import { progressSummary } from "@/lib/stats";
import { MEAL_SLOTS, type MealSlot } from "@/lib/types";
import MealCard from "@/components/MealCard";
import WaterCard from "@/components/WaterCard";
import WeightQuickLog from "@/components/WeightQuickLog";
import InstallBanner from "@/components/InstallBanner";
import { Bar, Pill, Ring, SectionTitle } from "@/components/ui";
import {
  IconBell,
  IconBolt,
  IconChevronLeft,
  IconChevronRight,
  IconFlame,
  IconGear,
} from "@/components/icons";

export default function TodayPage() {
  const { state } = useStore();
  const [date, setDate] = useState(todayKey());
  const [minutes, setMinutes] = useState(0);

  // Keeps "up next" accurate without re-rendering on every tick.
  useEffect(() => {
    setMinutes(nowMinutes());
    const id = setInterval(() => setMinutes(nowMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  const day = state.days[date];
  const totals = useMemo(
    () => dayTotals(day, date, state.planOverrides),
    [day, date, state.planOverrides],
  );
  const summary = useMemo(() => progressSummary(state), [state]);
  const { calorieTarget, proteinTarget } = state.profile;

  const nextSlot = useMemo<MealSlot | undefined>(() => {
    if (date !== todayKey()) return undefined;
    return MEAL_SLOTS.find((slot) => {
      const entry = resolveEntry(day, date, slot, state.planOverrides);
      if (entry.status !== "planned") return false;
      const [h, m] = SLOT_META[slot].defaultTime.split(":").map(Number);
      return h * 60 + m >= minutes - 90;
    });
  }, [day, date, state.planOverrides, minutes]);

  const isToday = date === todayKey();
  const isFuture = date > todayKey();

  return (
    <div className="safe-bottom">
      {/* ---- Hero ---------------------------------------------------- */}
      <header
        className="relative overflow-hidden px-4 pb-6 pt-[max(1.1rem,env(safe-area-inset-top))]"
        style={{
          background:
            "linear-gradient(160deg, color-mix(in srgb, var(--brand) 16%, var(--bg)) 0%, var(--bg) 72%)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {state.profile.name ? `Hi ${state.profile.name}` : "Daily tracker"}
            </p>
            <h1 className="mt-0.5 text-[1.55rem] font-extrabold tracking-tight">
              {relativeDayLabel(date)}
            </h1>
          </div>
          <div className="flex gap-1.5">
            <Link href="/reminders" aria-label="Reminders" className="btn btn-ghost !p-2.5">
              <IconBell width={18} height={18} />
            </Link>
            <Link href="/settings" aria-label="Settings" className="btn btn-ghost !p-2.5">
              <IconGear width={18} height={18} />
            </Link>
          </div>
        </div>

        {/* Date stepper */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setDate(addDays(date, -1))}
            aria-label="Previous day"
            className="btn btn-ghost !p-2"
          >
            <IconChevronLeft width={16} height={16} />
          </button>
          <div className="flex flex-1 justify-center gap-1.5">
            {[-2, -1, 0, 1, 2].map((offset) => {
              const key = addDays(todayKey(), offset);
              const active = key === date;
              return (
                <button
                  key={key}
                  onClick={() => setDate(key)}
                  className="flex w-[3.1rem] flex-col items-center rounded-card py-1.5 text-[0.68rem] font-semibold transition-colors"
                  style={{
                    background: active ? "var(--brand)" : "var(--surface)",
                    color: active ? "var(--brand-contrast)" : "var(--text-muted)",
                    border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
                    opacity: key > todayKey() ? 0.55 : 1,
                  }}
                >
                  <span className="uppercase tracking-wide">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekdayOf(key)]}
                  </span>
                  <span className="num text-[0.95rem] font-bold">{fromKey(key).getDate()}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setDate(addDays(date, 1))}
            aria-label="Next day"
            className="btn btn-ghost !p-2"
          >
            <IconChevronRight width={16} height={16} />
          </button>
        </div>
      </header>

      <main className="space-y-5 px-4 pt-1">
        <InstallBanner />

        {/* ---- Adherence + macros ------------------------------------ */}
        <section className="card animate-rise p-4">
          <div className="flex items-center gap-4">
            <Ring
              value={totals.completed / totals.total}
              size={104}
              stroke={9}
              label={`${totals.completed} of ${totals.total} meals completed`}
            >
              <div>
                <p className="num text-[1.55rem] font-extrabold leading-none">{totals.completed}</p>
                <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-ink-faint">
                  of {totals.total} meals
                </p>
              </div>
            </Ring>

            <div className="flex-1 space-y-3">
              <MacroRow
                icon={<IconFlame width={13} height={13} />}
                label="Calories"
                value={totals.kcal}
                unit="kcal"
                target={calorieTarget}
                color="var(--accent)"
              />
              <MacroRow
                icon={<IconBolt width={13} height={13} />}
                label="Protein"
                value={totals.protein}
                unit="g"
                target={proteinTarget}
                color="var(--protein)"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
            <MiniStat label="Completed" value={totals.completed} tone="var(--brand)" />
            <MiniStat label="Skipped" value={totals.skipped} tone="var(--danger)" />
            <MiniStat label="Pending" value={totals.pending} tone="var(--text-muted)" />
          </div>
        </section>

        {/* ---- Weight snapshot --------------------------------------- */}
        <Link href="/progress" className="card block animate-rise p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
                Weight progress
              </p>
              <p className="num mt-1 text-[1.45rem] font-extrabold leading-none">
                {summary.current.toFixed(1)}
                <span className="text-sm font-semibold text-ink-faint"> kg</span>
                <span className="mx-2 text-ink-faint">→</span>
                <span style={{ color: "var(--brand)" }}>{summary.goalWeight.toFixed(0)}</span>
                <span className="text-sm font-semibold text-ink-faint"> kg</span>
              </p>
            </div>
            <Pill tone={summary.totalChange >= 0 ? "brand" : "danger"}>
              {summary.totalChange >= 0 ? "+" : ""}
              {summary.totalChange.toFixed(1)} kg
            </Pill>
          </div>
          <div className="mt-3">
            <Bar value={summary.goalProgress / 100} height={9} />
          </div>
          <div className="mt-1.5 flex justify-between text-[0.72rem] text-ink-faint">
            <span className="num">{summary.goalProgress.toFixed(0)}% of goal</span>
            <span className="num">{Math.max(0, summary.remaining).toFixed(1)} kg to go</span>
          </div>
        </Link>

        {/* ---- Meals -------------------------------------------------- */}
        <section>
          <SectionTitle
            title="Meals"
            hint={isFuture ? "Planned for this day" : "Tap the circle to complete, × to skip"}
            action={
              <Link href="/plan" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
                7-day plan
              </Link>
            }
          />
          <div className="space-y-2.5">
            {MEAL_SLOTS.map((slot) => (
              <MealCard
                key={slot}
                date={date}
                slot={slot}
                entry={resolveEntry(day, date, slot, state.planOverrides)}
                isNext={slot === nextSlot}
              />
            ))}
          </div>
        </section>

        {/* ---- Hydration + weight ------------------------------------- */}
        <WaterCard date={date} />
        {!isFuture && <WeightQuickLog date={date} />}

        <DayNotes date={date} />

        {isToday && summary.currentStreak > 1 && (
          <p className="pb-2 text-center text-xs text-ink-faint">
            🔥 {summary.currentStreak}-day tracking streak — keep it going.
          </p>
        )}
      </main>
    </div>
  );
}

function MacroRow({
  icon,
  label,
  value,
  unit,
  target,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  target: { min: number; max: number };
  color: string;
}) {
  const st = targetState(value, target);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-ink-muted">
          <span style={{ color }}>{icon}</span>
          {label}
        </span>
        <span className="num text-[0.8rem] font-bold">
          {value}
          <span className="font-medium text-ink-faint">
            {" "}
            / {target.min}–{target.max} {unit}
          </span>
        </span>
      </div>
      <div className="mt-1.5">
        <Bar
          value={value / target.max}
          color={st === "under" ? color : "var(--brand)"}
          bandFrom={target.min / target.max}
          bandTo={1}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <p className="num text-[1.15rem] font-bold leading-none" style={{ color: tone }}>
        {value}
      </p>
      <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </p>
    </div>
  );
}

function DayNotes({ date }: { date: string }) {
  const { getDay, setDayNotes } = useStore();
  const day = getDay(date);
  return (
    <section className="card p-4">
      <label htmlFor="day-notes" className="text-[0.95rem] font-bold tracking-tight">
        Notes
      </label>
      <textarea
        id="day-notes"
        rows={2}
        value={day.notes ?? ""}
        onChange={(e) => setDayNotes(date, e.target.value)}
        placeholder="Appetite, energy, digestion, anything worth remembering…"
        className="field mt-2 resize-none text-sm"
      />
    </section>
  );
}
