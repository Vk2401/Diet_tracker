"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { addDays, formatShort, relativeDayLabel, todayKey } from "@/lib/date";
import { round } from "@/lib/nutrition";
import {
  progressSummary,
  rollingAverage,
  weekWindow,
  weeklyWeight,
  weightSeries,
} from "@/lib/stats";
import TopBar from "@/components/TopBar";
import WeightChart from "@/components/WeightChart";
import { Bar, EmptyState, Pill, SectionTitle, Stat } from "@/components/ui";
import { IconCheck, IconClose, IconScale, IconTrend } from "@/components/icons";

export default function WeightPage() {
  const { state, setWeight } = useStore();
  const [date, setDate] = useState(todayKey());
  const [value, setValue] = useState("");

  const series = useMemo(() => weightSeries(state), [state]);
  const averages = useMemo(() => rollingAverage(series), [series]);
  const summary = useMemo(() => progressSummary(state), [state]);
  const thisWeek = useMemo(
    () => weeklyWeight(state, weekWindow(todayKey(), state.settings.weekStartsOn)),
    [state],
  );

  const existing = state.days[date]?.weightKg;

  const save = () => {
    const n = Number.parseFloat(value);
    if (!Number.isFinite(n) || n <= 0 || n > 300) return;
    setWeight(date, round(n, 1));
    setValue("");
  };

  const weeklyOnTrack =
    thisWeek.change !== undefined &&
    thisWeek.change >= state.profile.weeklyGainTarget.min &&
    thisWeek.change <= state.profile.weeklyGainTarget.max + 0.15;

  return (
    <div className="safe-bottom">
      <TopBar title="Weight tracker" subtitle="Daily entries, weekly averages" />

      <main className="space-y-5 px-4 pt-4">
        {/* ---- Log entry ---------------------------------------------- */}
        <section className="card animate-rise p-4">
          <div className="flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-pill"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              <IconScale width={15} height={15} />
            </span>
            <h2 className="text-[0.95rem] font-bold tracking-tight">Log a weight</h2>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
            {[0, -1, -2, -3, -4].map((o) => {
              const key = addDays(todayKey(), o);
              const active = key === date;
              const logged = state.days[key]?.weightKg !== undefined;
              return (
                <button
                  key={key}
                  onClick={() => setDate(key)}
                  className="btn shrink-0 !px-3 !py-1.5 !text-[0.75rem]"
                  style={{
                    background: active ? "var(--brand)" : "var(--surface-2)",
                    color: active ? "var(--brand-contrast)" : "var(--text-muted)",
                    borderColor: active ? "var(--brand)" : "var(--border)",
                  }}
                >
                  {o === 0 ? "Today" : formatShort(key)}
                  {logged && (
                    <IconCheck
                      width={11}
                      height={11}
                      style={{ color: active ? "var(--brand-contrast)" : "var(--brand)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder={existing !== undefined ? String(existing) : summary.current.toFixed(1)}
                aria-label={`Weight for ${relativeDayLabel(date)}`}
                className="field num pr-10 text-lg font-bold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
                kg
              </span>
            </div>
            <button onClick={save} disabled={!value} className="btn btn-primary">
              {existing !== undefined ? "Update" : "Save"}
            </button>
          </div>
          {existing !== undefined && (
            <button
              onClick={() => setWeight(date, undefined)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--danger)" }}
            >
              <IconClose width={12} height={12} /> Remove {relativeDayLabel(date).toLowerCase()}&apos;s entry
            </button>
          )}
        </section>

        {/* ---- Chart --------------------------------------------------- */}
        <section className="card p-4">
          <SectionTitle
            title="Trend"
            hint={series.length ? `${series.length} entries logged` : undefined}
          />
          {series.length >= 2 ? (
            <WeightChart
              points={series}
              averages={averages}
              goal={state.profile.goalWeightKg}
              start={state.profile.startWeightKg}
            />
          ) : (
            <p className="py-6 text-center text-sm text-ink-muted">
              Log at least two weigh-ins to see your trend line.
            </p>
          )}
        </section>

        {/* ---- Weekly summary ------------------------------------------ */}
        <section>
          <SectionTitle title="This week" hint="Weekly average is the primary progress indicator" />
          <div className="grid grid-cols-2 gap-2.5">
            <Stat
              label="Weekly average"
              value={thisWeek.average?.toFixed(2) ?? "—"}
              unit="kg"
              sub={`${thisWeek.entries} entr${thisWeek.entries === 1 ? "y" : "ies"} this week`}
            />
            <Stat
              label="Previous week"
              value={thisWeek.previousAverage?.toFixed(2) ?? "—"}
              unit="kg"
              sub="7-day average"
            />
            <Stat
              label="Weekly change"
              value={
                thisWeek.change === undefined
                  ? "—"
                  : `${thisWeek.change >= 0 ? "+" : ""}${thisWeek.change.toFixed(2)}`
              }
              unit="kg"
              tone={weeklyOnTrack ? "brand" : "neutral"}
              sub={
                thisWeek.change === undefined ? (
                  "Needs two weeks of data"
                ) : weeklyOnTrack ? (
                  <span style={{ color: "var(--brand)" }}>On target pace</span>
                ) : (
                  `Target ${state.profile.weeklyGainTarget.min}–${state.profile.weeklyGainTarget.max} kg`
                )
              }
            />
            <Stat
              label="Total change"
              value={`${summary.totalChange >= 0 ? "+" : ""}${summary.totalChange.toFixed(1)}`}
              unit="kg"
              tone={summary.totalChange >= 0 ? "brand" : "danger"}
              sub={`since ${formatShort(state.profile.startDate)}`}
            />
          </div>
        </section>

        {/* ---- Goal ---------------------------------------------------- */}
        <section className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-bold tracking-tight">
              <IconTrend width={16} height={16} style={{ color: "var(--brand)" }} />
              Goal progress
            </h2>
            <Pill tone="brand">{summary.goalProgress.toFixed(0)}%</Pill>
          </div>
          <div className="mt-3">
            <Bar value={summary.goalProgress / 100} height={11} />
          </div>
          <div className="num mt-2 flex justify-between text-xs text-ink-muted">
            <span>{summary.startWeight} kg start</span>
            <span className="font-bold text-ink">{summary.current.toFixed(1)} kg now</span>
            <span>{summary.goalWeight} kg goal</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            {Math.max(0, summary.remaining).toFixed(1)} kg remaining. Progress is measured from your
            weekly average — day-to-day swings of ±0.5 kg are normal water weight.
          </p>
        </section>

        {/* ---- History ------------------------------------------------- */}
        <section>
          <SectionTitle title="History" />
          {series.length === 0 ? (
            <EmptyState
              title="No weigh-ins yet"
              body="Log your first weight above. Weigh yourself in the morning, after the bathroom, before eating."
            />
          ) : (
            <ul className="card divide-y divide-[var(--border)] overflow-hidden">
              {[...series].reverse().slice(0, 30).map((p, i, arr) => {
                const prev = arr[i + 1];
                const delta = prev ? round(p.kg - prev.kg, 1) : undefined;
                return (
                  <li key={p.date} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{relativeDayLabel(p.date)}</p>
                      <p className="text-[0.7rem] text-ink-faint">{p.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {delta !== undefined && delta !== 0 && (
                        <span
                          className="num text-xs font-semibold"
                          style={{ color: delta > 0 ? "var(--brand)" : "var(--danger)" }}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta.toFixed(1)}
                        </span>
                      )}
                      <span className="num text-base font-bold">{p.kg.toFixed(1)} kg</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
