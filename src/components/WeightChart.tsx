"use client";

import { useMemo, useRef, useState } from "react";
import { formatShort } from "@/lib/date";
import type { WeightSeriesPoint } from "@/lib/stats";

type Props = {
  points: WeightSeriesPoint[];
  /** Rolling 7-day average, aligned to `points`. */
  averages: WeightSeriesPoint[];
  goal: number;
  start: number;
  height?: number;
};

const PAD = { top: 14, right: 14, bottom: 24, left: 34 };

/**
 * Daily weight against its 7-day rolling average, with the goal as a reference
 * line. One y-axis, thin marks, crosshair on hover/touch.
 */
export default function WeightChart({ points, averages, goal, start, height = 200 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 340;
  const H = height;

  const model = useMemo(() => {
    if (!points.length) return null;
    const values = [...points.map((p) => p.kg), ...averages.map((p) => p.kg), start];
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    // A goal many kilos away would flatten the trend to a straight line, so it
    // only joins the scale while it stays within half the data's own span.
    const span = Math.max(0.8, hi - lo);
    const goalInScale = goal <= hi + span * 0.5 && goal >= lo - span * 0.5;
    const padY = Math.max(0.4, span * 0.16);
    const yMin = Math.min(lo, goalInScale ? goal : lo) - padY;
    const yMax = Math.max(hi, goalInScale ? goal : hi) + padY;

    const x = (i: number) =>
      PAD.left +
      (points.length === 1
        ? (W - PAD.left - PAD.right) / 2
        : (i / (points.length - 1)) * (W - PAD.left - PAD.right));
    const y = (v: number) =>
      PAD.top + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

    const path = (series: WeightSeriesPoint[]) =>
      series
        .map((p, i) => {
          const idx = points.findIndex((q) => q.date === p.date);
          return `${i === 0 ? "M" : "L"}${x(idx === -1 ? i : idx).toFixed(1)},${y(p.kg).toFixed(1)}`;
        })
        .join(" ");

    const ticks = [yMin, (yMin + yMax) / 2, yMax].map((v) => ({
      v,
      y: y(v),
      label: v.toFixed(1),
    }));

    return { x, y, path, ticks, yMin, yMax, goalInScale, goalAbove: goal > hi };
  }, [points, averages, goal, start, H]);

  if (!model) return null;

  const onMove = (clientX: number) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(model.x(i) - rel);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover(best);
  };

  const active = hover !== null ? points[hover] : null;
  const activeAvg =
    active && averages.find((a) => a.date === active.date);
  const goalInView = model.goalInScale;

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem]">
        <span className="flex items-center gap-1.5 font-semibold text-ink-muted">
          <span className="h-2 w-2 rounded-pill" style={{ background: "var(--chart-1)" }} />
          Daily weight
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-ink-muted">
          <span className="h-2 w-2 rounded-pill" style={{ background: "var(--chart-2)" }} />
          7-day average
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-ink-faint">
          <span className="h-px w-3.5" style={{ background: "var(--chart-goal)" }} />
          Goal {goal} kg
          {!model.goalInScale && (model.goalAbove ? " (above scale)" : " (below scale)")}
        </span>
      </figcaption>

      <div
        ref={wrap}
        className="relative touch-pan-y select-none"
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => onMove(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          role="img"
          aria-label={`Weight from ${points[0].kg} kg to ${points[points.length - 1].kg} kg, goal ${goal} kg`}
        >
          {/* Recessive grid + y labels */}
          {model.ticks.map((t) => (
            <g key={t.v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={t.y}
                y2={t.y}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={t.y + 3.5}
                textAnchor="end"
                fontSize={9}
                fill="var(--text-faint)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Goal reference */}
          {goalInView && (
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={model.y(goal)}
              y2={model.y(goal)}
              stroke="var(--chart-goal)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          )}

          {/* Daily series */}
          <path
            d={model.path(points)}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.55}
          />
          {/* Rolling average — the signal that matters */}
          {averages.length > 1 && (
            <path
              d={model.path(averages)}
              fill="none"
              stroke="var(--chart-2)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Latest marker, ringed against the surface */}
          <circle
            cx={model.x(points.length - 1)}
            cy={model.y(points[points.length - 1].kg)}
            r={4.5}
            fill="var(--chart-1)"
            stroke="var(--surface)"
            strokeWidth={2}
          />

          {/* Crosshair */}
          {hover !== null && (
            <g>
              <line
                x1={model.x(hover)}
                x2={model.x(hover)}
                y1={PAD.top}
                y2={H - PAD.bottom}
                stroke="var(--border-strong)"
                strokeWidth={1}
              />
              <circle
                cx={model.x(hover)}
                cy={model.y(points[hover].kg)}
                r={5}
                fill="var(--chart-1)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            </g>
          )}

          {/* X endpoints only — no label thicket */}
          <text x={PAD.left} y={H - 7} fontSize={9} fill="var(--text-faint)">
            {formatShort(points[0].date)}
          </text>
          <text x={W - PAD.right} y={H - 7} fontSize={9} textAnchor="end" fill="var(--text-faint)">
            {formatShort(points[points.length - 1].date)}
          </text>
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-1 rounded-[10px] border border-line px-2.5 py-1.5 text-[0.7rem] shadow-[var(--shadow-md)]"
            style={{
              background: "var(--bg-elevated)",
              left: `${Math.min(78, Math.max(2, (model.x(hover!) / W) * 100 - 10))}%`,
            }}
          >
            <p className="font-semibold text-ink">{formatShort(active.date)}</p>
            <p className="num text-ink-muted">
              <span style={{ color: "var(--chart-1)" }}>●</span> {active.kg.toFixed(1)} kg
            </p>
            {activeAvg && (
              <p className="num text-ink-muted">
                <span style={{ color: "var(--chart-2)" }}>●</span> {activeAvg.kg.toFixed(1)} avg
              </p>
            )}
          </div>
        )}
      </div>
    </figure>
  );
}
