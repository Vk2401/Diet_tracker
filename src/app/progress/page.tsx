"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatShort, lastNDays, todayKey } from "@/lib/date";
import { dayTotals, round } from "@/lib/nutrition";
import {
  progressSummary,
  rollingAverage,
  weekWindow,
  weeklyWeight,
  weightSeries,
} from "@/lib/stats";
import TopBar from "@/components/TopBar";
import WeightChart from "@/components/WeightChart";
import { Bar, EmptyState, Pill, Ring, SectionTitle, Stat } from "@/components/ui";
import { IconBolt, IconDrop, IconFlame, IconTrend } from "@/components/icons";
import { DIRECTION_COPY, formatChange, progressSign } from "@/lib/goal";

export default function ProgressPage() {
  const { state, track } = useStore();
  const summary = useMemo(() => progressSummary(state), [state]);
  const series = useMemo(() => weightSeries(state), [state]);
  const averages = useMemo(() => rollingAverage(series), [series]);

  const last14 = useMemo(() => {
    return lastNDays(todayKey(), 14).map((date) => ({
      date,
      totals: dayTotals(state.days[date], date, state.planOverrides, track),
    }));
  }, [state, track]);

  const past = last14.filter((d) => d.date <= todayKey());
  const avgKcal = past.length ? round(past.reduce((a, d) => a + d.totals.kcal, 0) / past.length) : 0;
  const avgPro = past.length
    ? round(past.reduce((a, d) => a + d.totals.protein, 0) / past.length, 1)
    : 0;
  const avgWater = past.length
    ? round(past.reduce((a, d) => a + d.totals.waterMl, 0) / past.length)
    : 0;
  const avgAdherence = past.length
    ? round(past.reduce((a, d) => a + d.totals.adherence, 0) / past.length)
    : 0;

  const fourWeeks = useMemo(
    () =>
      [3, 2, 1, 0].map((back) => {
        const win = weekWindow(todayKey(), state.settings.weekStartsOn, -back);
        return { win, w: weeklyWeight(state, win) };
      }),
    [state],
  );

  const { calorieTarget, proteinTarget, waterTargetMl } = state.profile;
  const maxKcal = Math.max(calorieTarget.max, ...past.map((d) => d.totals.kcal), 1);

  return (
    <div className="safe-bottom">
      <TopBar title="Progress" subtitle="The long view" />

      <main className="space-y-5 px-4 pt-4">
        {/* ---- Goal hero ----------------------------------------------- */}
        <section className="card animate-rise p-5">
          <div className="flex items-center gap-5">
            <Ring
              value={summary.goalProgress / 100}
              size={124}
              stroke={11}
              label={`${summary.goalProgress.toFixed(0)} percent of goal reached`}
            >
              <div>
                <p className="num text-[1.7rem] font-extrabold leading-none">
                  {summary.goalProgress.toFixed(0)}
                  <span className="text-base">%</span>
                </p>
                <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-ink-faint">
                  of goal
                </p>
              </div>
            </Ring>
            <dl className="flex-1 space-y-2.5">
              <Row label="Current" value={`${summary.current.toFixed(1)} kg`} strong />
              <Row label="Started at" value={`${summary.startWeight} kg`} />
              <Row label="Goal" value={`${summary.goalWeight} kg`} />
              <Row
                label={DIRECTION_COPY[summary.direction].changeLabel}
                value={`${formatChange(summary.totalChange, 1)} kg`}
                tone={
                  progressSign(summary.totalChange, summary.direction) === 1
                    ? "var(--brand)"
                    : progressSign(summary.totalChange, summary.direction) === -1
                      ? "var(--danger)"
                      : undefined
                }
              />
              <Row label="Remaining" value={`${summary.remaining.toFixed(1)} kg`} />
            </dl>
          </div>
          <div className="mt-4">
            <Bar value={summary.goalProgress / 100} height={10} />
          </div>
        </section>

        {/* ---- Weight trend --------------------------------------------- */}
        <section className="card p-4">
          <SectionTitle title="Weight trend" hint="Daily entries with the 7-day rolling average" />
          {series.length >= 2 ? (
            <WeightChart
              points={series}
              averages={averages}
              goal={state.profile.goalWeightKg}
              start={state.profile.startWeightKg}
              height={210}
            />
          ) : (
            <p className="py-6 text-center text-sm text-ink-muted">
              Log a few weigh-ins to unlock the trend.{" "}
              <Link href="/weight" className="font-semibold" style={{ color: "var(--brand)" }}>
                Add one now
              </Link>
            </p>
          )}
        </section>

        {/* ---- 14-day averages ------------------------------------------ */}
        <section>
          <SectionTitle title="Last 14 days" hint="Daily averages against your targets" />
          <div className="grid grid-cols-2 gap-2.5">
            <Stat
              label="Avg calories"
              value={avgKcal}
              unit="kcal"
              tone="accent"
              sub={
                <span className="flex items-center gap-1">
                  <IconFlame width={11} height={11} /> target {calorieTarget.min}+
                </span>
              }
            />
            <Stat
              label="Avg protein"
              value={avgPro}
              unit="g"
              tone="protein"
              sub={
                <span className="flex items-center gap-1">
                  <IconBolt width={11} height={11} /> target {proteinTarget.min}+
                </span>
              }
            />
            <Stat
              label="Avg water"
              value={(avgWater / 1000).toFixed(2)}
              unit="L"
              tone="water"
              sub={
                <span className="flex items-center gap-1">
                  <IconDrop width={11} height={11} /> target {(waterTargetMl.min / 1000).toFixed(1)}+
                </span>
              }
            />
            <Stat
              label="Meal adherence"
              value={avgAdherence}
              unit="%"
              tone="brand"
              sub={`${summary.currentStreak}-day streak`}
            />
          </div>
        </section>

        {/* ---- Calorie bars --------------------------------------------- */}
        <section className="card p-4">
          <SectionTitle title="Daily calories" hint="Shaded band is your target range" />
          <div className="relative flex h-[120px] items-end gap-[3px]">
            {/* Target band, drawn behind the bars on the same scale. */}
            <div
              className="pointer-events-none absolute inset-x-0"
              style={{
                bottom: `${(calorieTarget.min / maxKcal) * 100}px`,
                height: `${((calorieTarget.max - calorieTarget.min) / maxKcal) * 100}px`,
                background: "color-mix(in srgb, var(--brand) 12%, transparent)",
                borderTop: "1px dashed var(--chart-grid)",
                borderBottom: "1px dashed var(--chart-grid)",
              }}
              aria-hidden
            />
            {last14.map(({ date, totals }) => {
              const future = date > todayKey();
              const h = Math.max(2, (totals.kcal / maxKcal) * 100);
              const inRange =
                totals.kcal >= calorieTarget.min && totals.kcal <= calorieTarget.max;
              return (
                <div key={date} className="relative z-10 flex-1">
                  <div
                    className="w-full rounded-t-[4px] transition-all"
                    style={{
                      height: `${h}px`,
                      background: future
                        ? "var(--surface-2)"
                        : totals.kcal === 0
                          ? "var(--surface-2)"
                          : inRange
                            ? "var(--brand)"
                            : "var(--accent)",
                      opacity: future ? 0.5 : 1,
                    }}
                    title={`${formatShort(date)}: ${totals.kcal} kcal`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-[0.68rem] text-ink-faint">
            <span>{formatShort(last14[0].date)}</span>
            <span>{formatShort(last14[last14.length - 1].date)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px]" style={{ background: "var(--brand)" }} /> In
              target
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px]" style={{ background: "var(--accent)" }} />{" "}
              Outside target
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-3.5 rounded-[2px]"
                style={{ background: "color-mix(in srgb, var(--brand) 22%, transparent)" }}
              />{" "}
              {calorieTarget.min}–{calorieTarget.max} kcal band
            </span>
          </div>
        </section>

        {/* ---- Weekly averages ------------------------------------------ */}
        <section>
          <SectionTitle title="Weekly averages" hint="Week-over-week is how progress is judged" />
          {fourWeeks.every((f) => f.w.average === undefined) ? (
            <EmptyState
              title="Not enough weigh-ins"
              body="Once you have entries across two weeks, week-over-week change appears here."
            />
          ) : (
            <ul className="card divide-y divide-[var(--border)] overflow-hidden">
              {fourWeeks.map(({ win, w }, i) => (
                <li key={win.start} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {i === 3 ? "This week" : `${3 - i} week${3 - i > 1 ? "s" : ""} ago`}
                    </p>
                    <p className="text-[0.7rem] text-ink-faint">
                      {formatShort(win.start)} – {formatShort(win.end)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {w.change !== undefined && (
                      <Pill
                        tone={
                          progressSign(w.change, summary.direction) === 1
                            ? "brand"
                            : progressSign(w.change, summary.direction) === -1
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {formatChange(w.change)} kg
                      </Pill>
                    )}
                    <span className="num text-base font-bold">
                      {w.average !== undefined ? `${w.average.toFixed(2)} kg` : "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link href="/report" className="card flex items-center gap-3 p-4">
          <span
            className="grid h-9 w-9 place-items-center rounded-pill"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <IconTrend width={17} height={17} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Weekly adherence report</span>
            <span className="block text-xs text-ink-faint">
              Meals, macros, hydration and what to improve
            </span>
          </span>
          <span className="text-ink-faint">›</span>
        </Link>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[0.75rem] text-ink-muted">{label}</dt>
      <dd
        className={`num ${strong ? "text-[1.05rem] font-extrabold" : "text-sm font-bold"}`}
        style={{ color: tone }}
      >
        {value}
      </dd>
    </div>
  );
}
