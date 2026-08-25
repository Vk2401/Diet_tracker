"use client";

import type { ReactNode } from "react";

/* ---------------------------------------------------------------- *
 * Progress ring
 * ---------------------------------------------------------------- */
export function Ring({
  value,
  size = 116,
  stroke = 10,
  color = "var(--brand)",
  track = "var(--surface-2)",
  children,
  label,
}: {
  /** 0–1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(clamped * 100)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-tight">
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Linear bar
 * ---------------------------------------------------------------- */
export function Bar({
  value,
  color = "var(--brand)",
  height = 8,
  bandFrom,
  bandTo,
}: {
  /** 0–1 */
  value: number;
  color?: string;
  height?: number;
  /** Optional target band overlay, expressed as 0–1 fractions. */
  bandFrom?: number;
  bandTo?: number;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      className="relative w-full overflow-hidden rounded-pill"
      style={{ height, background: "var(--surface-2)" }}
    >
      {bandFrom !== undefined && bandTo !== undefined && (
        <div
          className="absolute inset-y-0"
          style={{
            left: `${bandFrom * 100}%`,
            width: `${Math.max(0, bandTo - bandFrom) * 100}%`,
            background: "color-mix(in srgb, var(--text) 12%, transparent)",
          }}
        />
      )}
      <div
        className="absolute inset-y-0 left-0 rounded-pill"
        style={{
          width: `${clamped * 100}%`,
          background: color,
          transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Section header
 * ---------------------------------------------------------------- */
export function SectionTitle({
  title,
  action,
  hint,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[0.95rem] font-bold tracking-tight text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Status pill
 * ---------------------------------------------------------------- */
export type Tone = "brand" | "accent" | "danger" | "water" | "protein" | "neutral";

const TONE_STYLE: Record<Tone, { bg: string; fg: string }> = {
  brand: { bg: "var(--brand-soft)", fg: "var(--brand)" },
  accent: { bg: "var(--accent-soft)", fg: "var(--accent)" },
  danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
  water: { bg: "var(--water-soft)", fg: "var(--water)" },
  protein: { bg: "var(--protein-soft)", fg: "var(--protein)" },
  neutral: { bg: "var(--surface-2)", fg: "var(--text-muted)" },
};

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const s = TONE_STYLE[tone];
  return (
    <span className={`chip ${className}`} style={{ background: s.bg, color: s.fg }}>
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- *
 * Stat tile
 * ---------------------------------------------------------------- */
export function Stat({
  label,
  value,
  unit,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="card p-3.5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="num mt-1.5 text-[1.45rem] font-bold leading-none" style={{ color: TONE_STYLE[tone].fg === "var(--text-muted)" ? "var(--text)" : TONE_STYLE[tone].fg }}>
        {value}
        {unit && <span className="ml-0.5 text-[0.8rem] font-semibold text-ink-faint">{unit}</span>}
      </p>
      {sub && <div className="mt-1.5 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Empty state
 * ---------------------------------------------------------------- */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card grid place-items-center gap-2 px-6 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="max-w-xs text-sm text-ink-muted">{body}</p>
      {action}
    </div>
  );
}
