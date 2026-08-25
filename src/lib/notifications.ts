import { minutesOf, todayKey } from "./date";
import type { Reminder } from "./types";

const FIRED_KEY = "hwg-fired-reminders";

export type PermissionState = "unsupported" | "default" | "granted" | "denied";

export function notificationSupport(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  if (notificationSupport() === "unsupported") return "unsupported";
  return (await Notification.requestPermission()) as PermissionState;
}

/** All fire times (minutes since midnight) a reminder should produce today. */
export function occurrences(reminder: Reminder): number[] {
  const start = minutesOf(reminder.time);
  if (!reminder.repeatEveryMin || !reminder.endTime) return [start];
  const end = minutesOf(reminder.endTime);
  const out: number[] = [];
  for (let t = start; t <= end && out.length < 48; t += reminder.repeatEveryMin) out.push(t);
  return out;
}

function loadFired(): Record<string, true> {
  try {
    const raw = JSON.parse(localStorage.getItem(FIRED_KEY) ?? "{}") as {
      date?: string;
      keys?: Record<string, true>;
    };
    if (raw.date !== todayKey()) return {};
    return raw.keys ?? {};
  } catch {
    return {};
  }
}

function saveFired(keys: Record<string, true>) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify({ date: todayKey(), keys }));
  } catch {
    /* ignore */
  }
}

async function show(title: string, body: string, tag: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const options: NotificationOptions = {
      body,
      tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      data: { url: "/" },
    };
    if (reg) await reg.showNotification(title, options);
    else new Notification(title, options);
  } catch {
    /* notification failed — nothing actionable for the user */
  }
}

/**
 * Fires any reminder whose time has passed and that hasn't fired today yet.
 * Runs while the app is open (foreground or background tab); a client-only PWA
 * cannot wake itself without a push server, so this is best-effort catch-up.
 */
export async function runDueReminders(reminders: Reminder[]): Promise<void> {
  if (notificationSupport() !== "granted") return;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const fired = loadFired();
  let changed = false;

  for (const r of reminders) {
    if (!r.enabled) continue;
    for (const at of occurrences(r)) {
      // Only fire within 30 minutes of the scheduled time — never a stale burst.
      if (at > nowMin || nowMin - at > 30) continue;
      const key = `${r.id}@${at}`;
      if (fired[key]) continue;
      fired[key] = true;
      changed = true;
      await show(r.label, bodyFor(r), key);
    }
  }

  if (changed) saveFired(fired);
}

function bodyFor(r: Reminder): string {
  switch (r.id) {
    case "weigh-in":
      return "Step on the scale before breakfast and log today's weight.";
    case "hydration":
      return "Time for a glass of water — tap to log it.";
    case "bedtime":
      return "Last one of the day: bedtime milk.";
    default:
      return `Time for your ${r.label.toLowerCase()} — open the tracker to log it.`;
  }
}

/** The next upcoming reminder today, if any. */
export function nextReminder(
  reminders: Reminder[],
  nowMin: number,
): { reminder: Reminder; at: number } | undefined {
  let best: { reminder: Reminder; at: number } | undefined;
  for (const r of reminders) {
    if (!r.enabled) continue;
    for (const at of occurrences(r)) {
      if (at <= nowMin) continue;
      if (!best || at < best.at) best = { reminder: r, at };
    }
  }
  return best;
}
