"use client";

import { useStore } from "@/lib/store";
import { IconDrop, IconMinus, IconPlus } from "./icons";
import { Bar, Pill } from "./ui";

export default function WaterCard({ date }: { date: string }) {
  const { state, getDay, addWater } = useStore();
  const day = getDay(date);
  const glass = state.settings.waterGlassMl;
  const target = state.profile.waterTargetMl;
  const litres = (day.waterMl / 1000).toFixed(2);
  const glasses = Math.round(day.waterMl / glass);
  const met = day.waterMl >= target.min;

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-pill"
            style={{ background: "var(--water-soft)", color: "var(--water)" }}
          >
            <IconDrop width={15} height={15} />
          </span>
          <h2 className="text-[0.95rem] font-bold tracking-tight">Hydration</h2>
        </div>
        {met ? <Pill tone="water">Target met</Pill> : <Pill tone="neutral">{(target.min / 1000).toFixed(1)}–{(target.max / 1000).toFixed(1)} L</Pill>}
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="num text-[1.7rem] font-bold leading-none" style={{ color: "var(--water)" }}>
          {litres}
          <span className="ml-1 text-sm font-semibold text-ink-faint">L</span>
        </p>
        <p className="text-xs text-ink-muted">
          {glasses} × {glass} ml glass{glasses === 1 ? "" : "es"}
        </p>
      </div>

      <div className="mt-2.5">
        <Bar
          value={day.waterMl / target.max}
          color="var(--water)"
          height={10}
          bandFrom={target.min / target.max}
          bandTo={1}
        />
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        <button
          onClick={() => addWater(date, -glass)}
          disabled={day.waterMl <= 0}
          aria-label="Remove a glass of water"
          className="btn btn-ghost !px-3"
        >
          <IconMinus width={16} height={16} />
        </button>
        <button
          onClick={() => addWater(date, glass)}
          className="btn btn-primary flex-1"
          style={{ background: "var(--water)", color: "#fff" }}
        >
          <IconPlus width={16} height={16} />
          Add {glass} ml
        </button>
        <button onClick={() => addWater(date, 500)} className="btn btn-ghost text-xs">
          +500
        </button>
      </div>
    </section>
  );
}
