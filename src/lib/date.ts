/** All date helpers work in the user's local timezone. */

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function weekdayOf(key: string): number {
  return fromKey(key).getDay();
}

/** Inclusive list of date keys from `from` to `to`. */
export function rangeKeys(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  let guard = 0;
  while (cur <= to && guard++ < 4000) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** The last `n` date keys ending at (and including) `key`. */
export function lastNDays(key: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(key, i - (n - 1)));
}

export function startOfWeek(key: string, weekStartsOn: 0 | 1 = 1): string {
  const day = weekdayOf(key);
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(key, -diff);
}

export function formatShort(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatLong(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatRange(from: string, to: string): string {
  return `${formatShort(from)} – ${formatShort(to)}`;
}

export function relativeDayLabel(key: string): string {
  const t = todayKey();
  if (key === t) return "Today";
  if (key === addDays(t, -1)) return "Yesterday";
  if (key === addDays(t, 1)) return "Tomorrow";
  return formatLong(key);
}

/** Minutes since midnight for an "HH:mm" string. */
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);
}
