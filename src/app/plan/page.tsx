"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatTime, todayKey, weekdayOf } from "@/lib/date";
import {
  SLOT_META,
  WEEKDAY_NAMES,
  draftOption,
  isCustom,
  optionsForSlot,
  overrideKey,
  plannedDayTotals,
  plannedOptionId,
} from "@/lib/plan";
import { MEAL_SLOTS, type CustomMealOption, type MealSlot } from "@/lib/types";
import { DIRECTION_COPY } from "@/lib/goal";
import { directionOfState } from "@/lib/stats";
import TopBar from "@/components/TopBar";
import { Pill } from "@/components/ui";
import { IconCheck, IconClose, IconEdit, IconPlus, IconSwap } from "@/components/icons";
import MealOptionEditor from "@/components/MealOptionEditor";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday-first

export default function PlanPage() {
  const {
    state,
    track,
    options,
    setPlanOverride,
    clearPlanOverride,
    saveCustomOption,
    deleteCustomOption,
    resetPlanOverrides,
  } = useStore();
  const [weekday, setWeekday] = useState(weekdayOf(todayKey()));
  const [editing, setEditing] = useState<MealSlot | null>(null);
  const [draft, setDraft] = useState<{ option: CustomMealOption; isNew: boolean } | null>(null);
  const [toast, setToast] = useState("");

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const totals = plannedDayTotals(track, weekday, state.planOverrides, options);
  const { calorieTarget, proteinTarget } = state.profile;
  const customised = Object.keys(state.planOverrides).filter((k) => k.startsWith(`${track}:`)).length;

  return (
    <div className="safe-bottom">
      <TopBar
        title="7-day diet plan"
        subtitle={`${DIRECTION_COPY[directionOfState(state)].planName} · recurring weekly`}
        right={
          customised > 0 ? (
            <button
              onClick={resetPlanOverrides}
              className="btn btn-ghost !px-2.5 !py-1.5 !text-[0.7rem]"
            >
              Reset
            </button>
          ) : undefined
        }
      />

      {/* Weekday rail */}
      <div className="sticky top-[3.7rem] z-20 border-b border-line px-4 py-2.5"
        style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(12px)" }}>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {ORDER.map((d) => {
            const active = d === weekday;
            const isToday = d === weekdayOf(todayKey());
            return (
              <button
                key={d}
                onClick={() => {
                  setWeekday(d);
                  setEditing(null);
                }}
                className="btn shrink-0 !px-3.5 !py-1.5 !text-[0.8rem]"
                style={{
                  background: active ? "var(--brand)" : "var(--surface)",
                  color: active ? "var(--brand-contrast)" : "var(--text-muted)",
                  borderColor: active ? "var(--brand)" : "var(--border)",
                }}
              >
                {WEEKDAY_NAMES[d].slice(0, 3)}
                {isToday && !active && (
                  <span className="h-1.5 w-1.5 rounded-pill" style={{ background: "var(--brand)" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="space-y-4 px-4 pt-4">
        {/* Day totals */}
        <section className="card animate-rise p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">{WEEKDAY_NAMES[weekday]}</h2>
            {weekday === weekdayOf(todayKey()) && <Pill tone="brand">Today</Pill>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <TotalTile
              label="Planned calories"
              value={totals.kcal}
              unit="kcal"
              target={`${calorieTarget.min}–${calorieTarget.max}`}
              inRange={totals.kcal >= calorieTarget.min && totals.kcal <= calorieTarget.max}
              color="var(--accent)"
            />
            <TotalTile
              label="Planned protein"
              value={totals.protein}
              unit="g"
              target={`${proteinTarget.min}–${proteinTarget.max}`}
              inRange={totals.protein >= proteinTarget.min}
              color="var(--protein)"
            />
          </div>
        </section>

        {/* Meals */}
        <div className="space-y-2.5">
          {MEAL_SLOTS.map((slot, index) => {
            const optionId = plannedOptionId(track, weekday, slot, state.planOverrides);
            const option = options[optionId];
            const isEditing = editing === slot;
            const overridden = !!state.planOverrides[overrideKey(track, weekday, slot)];

            return (
              <section key={slot} className="card overflow-hidden">
                <div className="flex items-start gap-3 p-3.5">
                  <span
                    className="num mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-pill text-[0.85rem] font-bold"
                    style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[0.72rem] font-bold uppercase tracking-wider text-ink-faint">
                        {SLOT_META[slot].label}
                      </p>
                      <span className="text-[0.7rem] text-ink-faint">
                        {formatTime(SLOT_META[slot].defaultTime)}
                      </span>
                      {overridden && <Pill tone="accent">Custom</Pill>}
                    </div>
                    <p className="mt-1 text-[0.88rem] font-semibold leading-snug">{option?.label}</p>
                    <p className="num mt-1 text-[0.74rem] text-ink-muted">
                      {option?.kcal} kcal · {option?.protein} g protein · {option?.portion}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditing(isEditing ? null : slot)}
                    aria-label={isEditing ? "Close alternatives" : `Change ${SLOT_META[slot].label}`}
                    aria-expanded={isEditing}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-pill"
                    style={{
                      background: isEditing ? "var(--brand)" : "var(--surface-2)",
                      color: isEditing ? "var(--brand-contrast)" : "var(--text-muted)",
                    }}
                  >
                    {isEditing ? <IconClose width={14} height={14} /> : <IconSwap width={15} height={15} />}
                  </button>
                </div>

                {isEditing && (
                  <div className="animate-rise border-t border-line bg-[var(--surface-2)] p-2.5">
                    <p className="px-1 pb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">
                      Alternatives
                    </p>
                    <div className="space-y-1.5">
                      {optionsForSlot(options, slot, track).map((alt) => {
                        const active = alt.id === optionId;
                        const mine = isCustom(alt);
                        return (
                          <div
                            key={alt.id}
                            className="flex items-center gap-1 rounded-[12px] pr-1.5"
                            style={{ background: active ? "var(--brand-soft)" : "var(--surface)" }}
                          >
                            <button
                              onClick={() => {
                                setPlanOverride(weekday, slot, alt.id);
                                setEditing(null);
                              }}
                              className="flex min-w-0 flex-1 items-center gap-2.5 p-2.5 text-left"
                            >
                              <span
                                className="grid w-[18px] shrink-0 place-items-center rounded-pill border"
                                style={{
                                  height: 18,
                                  borderColor: active ? "var(--brand)" : "var(--border-strong)",
                                  background: active ? "var(--brand)" : "transparent",
                                  color: "var(--brand-contrast)",
                                }}
                              >
                                {active && <IconCheck width={10} height={10} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                  <span className="text-[0.8rem] font-medium leading-snug">
                                    {alt.label}
                                  </span>
                                  {mine && <Pill tone="accent">Mine</Pill>}
                                </span>
                                <span className="num text-[0.7rem] text-ink-faint">
                                  {alt.kcal} kcal · {alt.protein} g
                                </span>
                              </span>
                            </button>
                            {mine && (
                              <button
                                onClick={() => setDraft({ option: alt as CustomMealOption, isNew: false })}
                                aria-label={`Edit ${alt.label}`}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-pill text-ink-faint"
                                style={{ background: "var(--surface-2)" }}
                              >
                                <IconEdit width={13} height={13} />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      <button
                        onClick={() => setDraft({ option: draftOption(slot, track), isNew: true })}
                        className="flex w-full items-center gap-2.5 rounded-[12px] border border-dashed p-2.5 text-left"
                        style={{ borderColor: "var(--border-strong)", color: "var(--brand)" }}
                      >
                        <span className="grid w-[18px] shrink-0 place-items-center" style={{ height: 18 }}>
                          <IconPlus width={13} height={13} />
                        </span>
                        <span className="text-[0.8rem] font-semibold">Create your own meal</span>
                      </button>

                      {overridden && (
                        <button
                          onClick={() => {
                            clearPlanOverride(weekday, slot);
                            setEditing(null);
                          }}
                          className="w-full rounded-[12px] p-2.5 text-left text-[0.78rem] font-semibold text-ink-faint"
                        >
                          Reset this slot to the default plan
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <p className="px-1 pb-2 text-xs leading-relaxed text-ink-faint">
          Changing the plan updates future days only — days you have already logged keep their
          original record.
        </p>
      </main>

      {draft && (
        <MealOptionEditor
          draft={draft.option}
          isNew={draft.isNew}
          onClose={() => setDraft(null)}
          onSave={(option) => {
            saveCustomOption(option);
            // A freshly created meal goes straight into the slot being edited.
            if (draft.isNew) setPlanOverride(weekday, option.slot, option.id);
            setDraft(null);
            setEditing(null);
            flash(draft.isNew ? "Meal added to your plan" : "Meal updated");
          }}
          onDelete={
            draft.isNew
              ? undefined
              : () => {
                  const { archived } = deleteCustomOption(draft.option.id);
                  setDraft(null);
                  setEditing(null);
                  flash(
                    archived
                      ? "Removed from your plan — past logs keep it"
                      : "Meal deleted",
                  );
                }
          }
        />
      )}

      {toast && (
        <div
          role="status"
          className="animate-rise fixed inset-x-0 z-50 mx-auto w-fit max-w-[90%] rounded-pill px-4 py-2 text-center text-xs font-semibold shadow-[var(--shadow-lg)]"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + var(--nav-h) + 1rem)",
            background: "var(--brand)",
            color: "var(--brand-contrast)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function TotalTile({
  label,
  value,
  unit,
  target,
  inRange,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  target: string;
  inRange: boolean;
  color: string;
}) {
  return (
    <div className="rounded-[14px] p-3" style={{ background: "var(--surface-2)" }}>
      <p className="text-[0.66rem] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="num mt-1 text-[1.35rem] font-bold leading-none" style={{ color }}>
        {value}
        <span className="ml-0.5 text-[0.75rem] font-semibold text-ink-faint">{unit}</span>
      </p>
      <p className="mt-1.5 text-[0.68rem]" style={{ color: inRange ? "var(--brand)" : "var(--text-faint)" }}>
        {inRange ? "✓ within target" : `target ${target}`}
      </p>
    </div>
  );
}
