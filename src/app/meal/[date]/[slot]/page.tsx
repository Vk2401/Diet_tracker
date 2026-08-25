"use client";

import { use, useMemo } from "react";
import { useStore } from "@/lib/store";
import { formatTime, relativeDayLabel } from "@/lib/date";
import { entryNutrition, resolveEntry, round } from "@/lib/nutrition";
import { OPTION_BY_ID, SLOT_META, optionsForSlot } from "@/lib/plan";
import { MEAL_SLOTS, type MealSlot } from "@/lib/types";
import TopBar from "@/components/TopBar";
import { Pill, SectionTitle } from "@/components/ui";
import { IconCheck, IconClose, IconSwap } from "@/components/icons";

const PORTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function MealDetailPage({
  params,
}: {
  params: Promise<{ date: string; slot: string }>;
}) {
  const { date, slot: rawSlot } = use(params);
  const { state, setMeal } = useStore();

  const slot = MEAL_SLOTS.includes(rawSlot as MealSlot) ? (rawSlot as MealSlot) : "breakfast";
  const meta = SLOT_META[slot];
  const entry = resolveEntry(state.days[date], date, slot, state.planOverrides);
  const option = OPTION_BY_ID[entry.optionId];
  const alternatives = useMemo(() => optionsForSlot(slot), [slot]);
  const n = entryNutrition(entry);
  const planned = OPTION_BY_ID[entry.optionId];

  return (
    <div className="safe-bottom">
      <TopBar
        title={meta.label}
        subtitle={`${relativeDayLabel(date)} · ${formatTime(meta.defaultTime)}`}
        back
        right={
          entry.status === "completed" ? (
            <Pill tone="brand">Completed</Pill>
          ) : entry.status === "skipped" ? (
            <Pill tone="danger">Skipped</Pill>
          ) : (
            <Pill tone="neutral">Planned</Pill>
          )
        }
      />

      <main className="space-y-5 px-4 pt-4">
        {/* ---- Current selection ------------------------------------- */}
        <section className="card animate-rise p-4">
          <p className="text-[1.02rem] font-bold leading-snug">{option?.label}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {option?.items.map((item) => (
              <span
                key={item}
                className="chip"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3.5 text-center">
            <div>
              <p className="num text-xl font-bold" style={{ color: "var(--accent)" }}>
                {n.kcal}
              </p>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
                kcal
              </p>
            </div>
            <div>
              <p className="num text-xl font-bold" style={{ color: "var(--protein)" }}>
                {n.protein}
              </p>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
                g protein
              </p>
            </div>
            <div>
              <p className="num text-xl font-bold">×{entry.portionFactor}</p>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-faint">
                portion
              </p>
            </div>
          </div>
        </section>

        {/* ---- Status ------------------------------------------------- */}
        <section className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() =>
              setMeal(date, slot, {
                status: entry.status === "completed" ? "planned" : "completed",
                completedAt: entry.status === "completed" ? undefined : new Date().toISOString(),
              })
            }
            className="btn !py-3"
            style={{
              background: entry.status === "completed" ? "var(--brand)" : "var(--surface)",
              color: entry.status === "completed" ? "var(--brand-contrast)" : "var(--text)",
              borderColor: entry.status === "completed" ? "var(--brand)" : "var(--border)",
            }}
          >
            <IconCheck width={17} height={17} />
            Completed
          </button>
          <button
            onClick={() =>
              setMeal(date, slot, {
                status: entry.status === "skipped" ? "planned" : "skipped",
                completedAt: undefined,
              })
            }
            className="btn !py-3"
            style={{
              background: entry.status === "skipped" ? "var(--danger-soft)" : "var(--surface)",
              color: entry.status === "skipped" ? "var(--danger)" : "var(--text)",
              borderColor: entry.status === "skipped" ? "var(--danger)" : "var(--border)",
            }}
          >
            <IconClose width={16} height={16} />
            Skipped
          </button>
        </section>

        {entry.completedAt && (
          <p className="-mt-2 text-center text-xs text-ink-faint">
            Logged at{" "}
            {new Date(entry.completedAt).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}

        {/* ---- Portion ------------------------------------------------ */}
        <section>
          <SectionTitle
            title="How much did you actually eat?"
            hint={planned ? `Planned portion: ${planned.portion}` : undefined}
          />
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {PORTIONS.map((p) => {
              const active = entry.portionFactor === p;
              return (
                <button
                  key={p}
                  onClick={() =>
                    setMeal(date, slot, {
                      portionFactor: p,
                      caloriesOverride: undefined,
                      proteinOverride: undefined,
                    })
                  }
                  className="btn shrink-0 !px-3.5 !py-2 !text-sm"
                  style={{
                    background: active ? "var(--brand)" : "var(--surface)",
                    color: active ? "var(--brand-contrast)" : "var(--text-muted)",
                    borderColor: active ? "var(--brand)" : "var(--border)",
                  }}
                >
                  {p === 1 ? "As planned" : `×${p}`}
                </button>
              );
            })}
          </div>
        </section>

        {/* ---- Manual nutrition --------------------------------------- */}
        <section className="card p-4">
          <SectionTitle title="Fine-tune nutrition" hint="Override if you know the real numbers" />
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Calories"
              unit="kcal"
              value={n.kcal}
              placeholder={round((option?.kcal ?? 0) * entry.portionFactor)}
              onChange={(v) => setMeal(date, slot, { caloriesOverride: v })}
            />
            <NumField
              label="Protein"
              unit="g"
              value={n.protein}
              placeholder={round((option?.protein ?? 0) * entry.portionFactor, 1)}
              onChange={(v) => setMeal(date, slot, { proteinOverride: v })}
            />
          </div>
          {(entry.caloriesOverride !== undefined || entry.proteinOverride !== undefined) && (
            <button
              onClick={() =>
                setMeal(date, slot, { caloriesOverride: undefined, proteinOverride: undefined })
              }
              className="btn btn-ghost mt-3 w-full !py-2 !text-xs"
            >
              Reset to plan estimate
            </button>
          )}
        </section>

        {/* ---- Alternatives ------------------------------------------- */}
        <section>
          <SectionTitle
            title="Swap this meal"
            hint="Nutrition recalculates from what you pick"
            action={<IconSwap width={16} height={16} className="text-ink-faint" />}
          />
          <div className="space-y-2">
            {alternatives.map((alt) => {
              const active = alt.id === entry.optionId;
              return (
                <button
                  key={alt.id}
                  onClick={() =>
                    setMeal(date, slot, {
                      optionId: alt.id,
                      caloriesOverride: undefined,
                      proteinOverride: undefined,
                    })
                  }
                  className="card flex w-full items-center gap-3 p-3 text-left transition-colors"
                  style={{
                    borderColor: active ? "var(--brand)" : "var(--border)",
                    background: active ? "var(--brand-soft)" : "var(--surface)",
                  }}
                >
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-pill border"
                    style={{
                      borderColor: active ? "var(--brand)" : "var(--border-strong)",
                      background: active ? "var(--brand)" : "transparent",
                      color: "var(--brand-contrast)",
                    }}
                  >
                    {active && <IconCheck width={11} height={11} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.85rem] font-semibold leading-snug">
                      {alt.label}
                    </span>
                    <span className="num mt-0.5 block text-[0.72rem] text-ink-muted">
                      {alt.kcal} kcal · {alt.protein} g protein
                    </span>
                  </span>
                  {alt.tags?.[0] && <Pill tone="neutral">{alt.tags[0]}</Pill>}
                </button>
              );
            })}
          </div>
        </section>

        {/* ---- Notes --------------------------------------------------- */}
        <section className="card p-4">
          <label htmlFor="meal-notes" className="text-[0.95rem] font-bold tracking-tight">
            Meal notes
          </label>
          <textarea
            id="meal-notes"
            rows={3}
            value={entry.notes ?? ""}
            onChange={(e) => setMeal(date, slot, { notes: e.target.value })}
            placeholder="Swapped chicken for rajma, felt very full, ate late…"
            className="field mt-2 resize-none text-sm"
          />
        </section>
      </main>
    </div>
  );
}

function NumField({
  label,
  unit,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  placeholder: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <span className="relative block">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={String(placeholder)}
          onChange={(e) => {
            const v = Number.parseFloat(e.target.value);
            onChange(Number.isFinite(v) && v >= 0 ? v : undefined);
          }}
          className="field num pr-10 font-bold"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-faint">
          {unit}
        </span>
      </span>
    </label>
  );
}
