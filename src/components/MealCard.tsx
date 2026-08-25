"use client";

import Link from "next/link";
import { SLOT_META } from "@/lib/plan";
import { entryNutrition } from "@/lib/nutrition";
import { formatTime } from "@/lib/date";
import type { MealEntry, MealSlot } from "@/lib/types";
import { useStore } from "@/lib/store";
import { IconCheck, IconChevronRight, IconClose, IconNote } from "./icons";
import { Pill } from "./ui";

const STATUS_STYLE = {
  completed: { border: "var(--brand)", bg: "var(--brand-soft)", fg: "var(--brand)" },
  skipped: { border: "var(--border)", bg: "var(--danger-soft)", fg: "var(--danger)" },
  planned: { border: "var(--border)", bg: "var(--surface-2)", fg: "var(--text-faint)" },
} as const;

export default function MealCard({
  date,
  slot,
  entry,
  isNext,
}: {
  date: string;
  slot: MealSlot;
  entry: MealEntry;
  isNext?: boolean;
}) {
  const { options, setMeal } = useStore();
  const meta = SLOT_META[slot];
  const option = options[entry.optionId];
  const n = entryNutrition(entry, options);
  const style = STATUS_STYLE[entry.status];

  const toggle = (next: "completed" | "skipped") =>
    setMeal(date, slot, {
      status: entry.status === next ? "planned" : next,
      completedAt: next === "completed" && entry.status !== next ? new Date().toISOString() : undefined,
    });

  return (
    <article
      className="card overflow-hidden transition-colors"
      style={{
        borderColor: entry.status === "completed" ? style.border : "var(--border)",
        background: entry.status === "skipped" ? "var(--surface)" : "var(--surface)",
      }}
    >
      <div className="flex items-start gap-3 p-3.5">
        <button
          onClick={() => toggle("completed")}
          aria-pressed={entry.status === "completed"}
          aria-label={`Mark ${meta.label} completed`}
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-pill border transition-all active:scale-90"
          style={{
            borderColor: entry.status === "completed" ? "var(--brand)" : "var(--border-strong)",
            background: entry.status === "completed" ? "var(--brand)" : "transparent",
            color: entry.status === "completed" ? "var(--brand-contrast)" : "var(--text-faint)",
          }}
        >
          {entry.status === "completed" ? (
            <IconCheck width={17} height={17} className="animate-pop" />
          ) : entry.status === "skipped" ? (
            <IconClose width={15} height={15} style={{ color: "var(--danger)" }} />
          ) : (
            <span className="h-2 w-2 rounded-pill" style={{ background: "var(--border-strong)" }} />
          )}
        </button>

        <Link href={`/meal/${date}/${slot}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[0.72rem] font-bold uppercase tracking-wider text-ink-faint">
              {meta.label}
            </span>
            <span className="text-[0.7rem] text-ink-faint">{formatTime(meta.defaultTime)}</span>
            {isNext && entry.status === "planned" && <Pill tone="accent">Up next</Pill>}
            {entry.status === "skipped" && <Pill tone="danger">Skipped</Pill>}
          </div>
          <p
            className="mt-1 text-[0.9rem] font-semibold leading-snug"
            style={{
              color: entry.status === "skipped" ? "var(--text-faint)" : "var(--text)",
              textDecoration: entry.status === "skipped" ? "line-through" : "none",
            }}
          >
            {option?.label ?? "Custom meal"}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-ink-muted">
            <span className="num">{n.kcal} kcal</span>
            <span className="num">{n.protein} g protein</span>
            {entry.portionFactor !== 1 && (
              <span className="num" style={{ color: "var(--accent)" }}>
                ×{entry.portionFactor}
              </span>
            )}
            {entry.notes && <IconNote width={13} height={13} className="text-ink-faint" />}
          </div>
        </Link>

        <div className="flex flex-col items-center gap-1.5">
          <Link
            href={`/meal/${date}/${slot}`}
            aria-label={`Open ${meta.label} details`}
            className="grid h-7 w-7 place-items-center rounded-pill text-ink-faint"
            style={{ background: "var(--surface-2)" }}
          >
            <IconChevronRight width={14} height={14} />
          </Link>
          <button
            onClick={() => toggle("skipped")}
            aria-pressed={entry.status === "skipped"}
            aria-label={`Mark ${meta.label} skipped`}
            className="grid h-7 w-7 place-items-center rounded-pill transition-colors"
            style={{
              background: entry.status === "skipped" ? "var(--danger-soft)" : "var(--surface-2)",
              color: entry.status === "skipped" ? "var(--danger)" : "var(--text-faint)",
            }}
          >
            <IconClose width={13} height={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
