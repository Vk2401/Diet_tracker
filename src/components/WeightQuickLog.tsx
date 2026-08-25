"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { currentWeight } from "@/lib/stats";
import { IconCheck, IconScale } from "./icons";
import { Pill } from "./ui";

export default function WeightQuickLog({ date }: { date: string }) {
  const { state, getDay, setWeight } = useStore();
  const day = getDay(date);
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(day.weightKg !== undefined ? String(day.weightKg) : "");
  }, [day.weightKg, date]);

  const suggestion = day.weightKg ?? currentWeight(state);

  const commit = () => {
    const n = Number.parseFloat(value);
    if (!Number.isFinite(n) || n <= 0 || n > 300) return;
    setWeight(date, Math.round(n * 10) / 10);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-pill"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <IconScale width={15} height={15} />
          </span>
          <h2 className="text-[0.95rem] font-bold tracking-tight">Today&apos;s weight</h2>
        </div>
        {day.weightKg !== undefined && <Pill tone="brand">Logged</Pill>}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            placeholder={suggestion.toFixed(1)}
            aria-label="Weight in kilograms"
            className="field num pr-10 text-lg font-bold"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
            kg
          </span>
        </div>
        <button onClick={commit} disabled={!value} className="btn btn-primary">
          {saved ? <IconCheck width={16} height={16} className="animate-pop" /> : "Save"}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Weigh in at the same time each morning — the weekly average is what matters, not the daily number.
      </p>
    </section>
  );
}
