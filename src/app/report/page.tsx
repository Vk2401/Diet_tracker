"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatShort, relativeDayLabel, todayKey } from "@/lib/date";
import { STATUS_LABEL, buildWeeklyReport, weekWindow, type AdherenceStatus } from "@/lib/stats";
import { formatChange, paceLabel } from "@/lib/goal";
import TopBar from "@/components/TopBar";
import { Bar, Pill, Ring, SectionTitle, Stat, type Tone } from "@/components/ui";
import {
  IconBolt,
  IconChevronLeft,
  IconChevronRight,
  IconDrop,
  IconFlame,
  IconSparkle,
} from "@/components/icons";

const STATUS_TONE: Record<AdherenceStatus, Tone> = {
  "on-track": "brand",
  "needs-improvement": "accent",
  "needs-attention": "danger",
};

export default function ReportPage() {
  const { state } = useStore();
  const [offset, setOffset] = useState(0);

  const report = useMemo(() => {
    const win = weekWindow(todayKey(), state.settings.weekStartsOn, offset);
    return buildWeeklyReport(state, win);
  }, [state, offset]);

  const { profile } = state;
  const empty = report.trackedDays === 0;

  return (
    <div className="safe-bottom">
      <TopBar
        title="Weekly report"
        subtitle={`${formatShort(report.window.start)} – ${formatShort(report.window.end)}`}
      />

      {/* Week stepper */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <button onClick={() => setOffset(offset - 1)} className="btn btn-ghost !p-2" aria-label="Previous week">
          <IconChevronLeft width={16} height={16} />
        </button>
        <p className="text-sm font-semibold">
          {offset === 0 ? "This week" : offset === -1 ? "Last week" : `${-offset} weeks ago`}
        </p>
        <button
          onClick={() => setOffset(Math.min(0, offset + 1))}
          disabled={offset >= 0}
          className="btn btn-ghost !p-2"
          aria-label="Next week"
        >
          <IconChevronRight width={16} height={16} />
        </button>
      </div>

      <main className="space-y-5 px-4 pt-4">
        {empty ? (
          <div className="card grid place-items-center gap-2 px-6 py-12 text-center">
            <p className="font-semibold">Nothing logged this week</p>
            <p className="max-w-xs text-sm text-ink-muted">
              This week hasn&apos;t started yet, or nothing was tracked. Reports fill in as you log.
            </p>
          </div>
        ) : (
          <>
            {/* ---- Headline ------------------------------------------ */}
            <section className="card animate-rise p-5">
              <div className="flex items-center gap-5">
                <Ring
                  value={report.mealAdherence / 100}
                  size={116}
                  stroke={10}
                  color={
                    report.status === "on-track"
                      ? "var(--brand)"
                      : report.status === "needs-improvement"
                        ? "var(--accent)"
                        : "var(--danger)"
                  }
                  label={`${report.mealAdherence} percent meal adherence`}
                >
                  <div>
                    <p className="num text-[1.6rem] font-extrabold leading-none">
                      {report.mealAdherence}
                      <span className="text-base">%</span>
                    </p>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-ink-faint">
                      adherence
                    </p>
                  </div>
                </Ring>
                <div className="flex-1">
                  <Pill tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status]}</Pill>
                  <p className="num mt-2.5 text-[1.05rem] font-bold leading-tight">
                    {report.mealsCompleted}
                    <span className="text-ink-faint"> / {report.mealsPossible}</span>
                  </p>
                  <p className="text-xs text-ink-muted">meals completed</p>
                  <p className="mt-2 text-xs text-ink-faint">
                    across {report.trackedDays} day{report.trackedDays === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </section>

            {/* ---- Weight -------------------------------------------- */}
            <section>
              <SectionTitle title="Weight" hint="Averages, not single days" />
              <div className="grid grid-cols-2 gap-2.5">
                <Stat
                  label="Average weight"
                  value={report.weight.average?.toFixed(2) ?? "—"}
                  unit="kg"
                  sub={`${report.weight.entries} weigh-in${report.weight.entries === 1 ? "" : "s"}`}
                />
                <Stat
                  label="Weight change"
                  value={
                    report.weight.change === undefined
                      ? "—"
                      : formatChange(report.weight.change)
                  }
                  unit="kg"
                  tone={
                    report.pace === "on-pace"
                      ? "brand"
                      : report.pace === "unknown"
                        ? "neutral"
                        : report.pace === "reverse"
                          ? "danger"
                          : "accent"
                  }
                  sub={
                    report.weight.change === undefined
                      ? paceLabel(report.pace, report.direction)
                      : `${paceLabel(report.pace, report.direction)} · vs ${report.weight.previousAverage?.toFixed(2) ?? "—"} kg last week`
                  }
                />
              </div>
            </section>

            {/* ---- Macros -------------------------------------------- */}
            <section className="card p-4">
              <SectionTitle title="Daily averages" />
              <div className="space-y-4">
                <MetricRow
                  icon={<IconFlame width={13} height={13} />}
                  label="Calories"
                  value={`${report.avgCalories} kcal`}
                  pct={report.calorieAdherence}
                  color="var(--accent)"
                  target={`${profile.calorieTarget.min}–${profile.calorieTarget.max}`}
                />
                <MetricRow
                  icon={<IconBolt width={13} height={13} />}
                  label="Protein"
                  value={`${report.avgProtein} g`}
                  pct={report.proteinAdherence}
                  color="var(--protein)"
                  target={`${profile.proteinTarget.min}–${profile.proteinTarget.max}`}
                />
                <MetricRow
                  icon={<IconDrop width={13} height={13} />}
                  label="Water target days"
                  value={`${report.waterTargetDays} / ${report.trackedDays}`}
                  pct={report.hydrationAdherence}
                  color="var(--water)"
                  target={`${(profile.waterTargetMl.min / 1000).toFixed(1)} L+`}
                />
              </div>
            </section>

            {/* ---- Best day + misses ---------------------------------- */}
            <div className="grid gap-2.5">
              {report.bestDay && report.bestDay.adherence > 0 && (
                <section
                  className="card flex items-center gap-3 p-4"
                  style={{ background: "var(--brand-soft)", borderColor: "transparent" }}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-pill"
                    style={{ background: "var(--brand)", color: "var(--brand-contrast)" }}
                  >
                    <IconSparkle width={17} height={17} />
                  </span>
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: "var(--brand)" }}>
                      Best day
                    </p>
                    <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>
                      {relativeDayLabel(report.bestDay.date)} — {report.bestDay.adherence}% ·{" "}
                      <span className="num">{report.bestDay.kcal} kcal</span>
                    </p>
                  </div>
                </section>
              )}

              {report.missedMeals.length > 0 && (
                <section className="card p-4">
                  <SectionTitle title="Missed meals" hint="Skipped or never logged" />
                  <ul className="space-y-2">
                    {report.missedMeals.map((m) => (
                      <li key={m.slot} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-sm">{m.label}</span>
                        <div className="flex-1">
                          <Bar
                            value={m.count / Math.max(1, report.trackedDays)}
                            color="var(--danger)"
                            height={6}
                          />
                        </div>
                        <span className="num w-8 text-right text-xs font-bold text-ink-muted">
                          {m.count}×
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* ---- Improvements --------------------------------------- */}
            <section className="card p-4">
              <SectionTitle title="Areas to improve" hint="Small, specific, doable" />
              <ul className="space-y-2.5">
                {report.improvements.map((tip) => (
                  <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill"
                      style={{ background: "var(--brand)" }}
                    />
                    {tip}
                  </li>
                ))}
              </ul>
            </section>

            <p className="pb-2 text-center text-xs leading-relaxed text-ink-faint">
              One low week is not a setback. Consistency over four weeks is what shows up on the
              scale.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function MetricRow({
  icon,
  label,
  value,
  pct,
  color,
  target,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  pct: number;
  color: string;
  target: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-ink-muted">
          <span style={{ color }}>{icon}</span>
          {label}
        </span>
        <span className="num text-sm font-bold">
          {value} <span className="text-[0.7rem] font-medium text-ink-faint">/ {target}</span>
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1">
          <Bar value={pct / 100} color={pct >= 90 ? "var(--brand)" : color} />
        </div>
        <span className="num w-9 text-right text-[0.7rem] font-semibold text-ink-faint">{pct}%</span>
      </div>
    </div>
  );
}
