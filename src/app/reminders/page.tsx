"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { formatTime, nowMinutes } from "@/lib/date";
import {
  nextReminder,
  notificationSupport,
  occurrences,
  type PermissionState,
} from "@/lib/notifications";
import TopBar from "@/components/TopBar";
import NotificationStatus from "@/components/NotificationStatus";
import { Pill, SectionTitle } from "@/components/ui";
import { IconCheck, IconClock } from "@/components/icons";

export default function RemindersPage() {
  const { state, setReminder } = useStore();
  const [perm, setPerm] = useState<PermissionState>("default");
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    setPerm(notificationSupport());
    setMinutes(nowMinutes());
    const id = setInterval(() => setMinutes(nowMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  const next = nextReminder(state.reminders, minutes);
  const enabledCount = state.reminders.filter((r) => r.enabled).length;

  return (
    <div className="safe-bottom">
      <TopBar title="Reminders" subtitle={`${enabledCount} of ${state.reminders.length} enabled`} />

      <main className="space-y-5 px-4 pt-4">
        {/* ---- Permission ---------------------------------------------- */}
        <section className="card animate-rise p-4">
          <NotificationStatus compact />
        </section>

        {perm === "granted" && next && (
          <section
            className="card flex items-center gap-3 p-4"
            style={{ background: "var(--brand-soft)", borderColor: "transparent" }}
          >
            <IconClock width={18} height={18} style={{ color: "var(--brand)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
              Next up: {next.reminder.label} at{" "}
              {formatTime(
                `${String(Math.floor(next.at / 60)).padStart(2, "0")}:${String(next.at % 60).padStart(2, "0")}`,
              )}
            </p>
          </section>
        )}

        {/* ---- List ------------------------------------------------------ */}
        <section>
          <SectionTitle title="Daily schedule" hint="Tap a time to change it" />
          <div className="card divide-y divide-[var(--border)] overflow-hidden">
            {state.reminders.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{r.label}</p>
                    {r.repeatEveryMin && (
                      <Pill tone="water">every {r.repeatEveryMin / 60}h</Pill>
                    )}
                  </div>
                  <p className="mt-0.5 text-[0.72rem] text-ink-faint">
                    {r.repeatEveryMin && r.endTime
                      ? `${formatTime(r.time)} – ${formatTime(r.endTime)} · ${occurrences(r).length} nudges`
                      : formatTime(r.time)}
                  </p>
                </div>

                <input
                  type="time"
                  value={r.time}
                  onChange={(e) => setReminder(r.id, { time: e.target.value })}
                  aria-label={`${r.label} time`}
                  className="field num !w-auto !px-2 !py-1.5 text-xs"
                />

                <button
                  role="switch"
                  aria-checked={r.enabled}
                  aria-label={`${r.enabled ? "Disable" : "Enable"} ${r.label}`}
                  onClick={() => setReminder(r.id, { enabled: !r.enabled })}
                  className="relative h-6 w-11 shrink-0 rounded-pill transition-colors"
                  style={{ background: r.enabled ? "var(--brand)" : "var(--border-strong)" }}
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-pill bg-white transition-transform"
                    style={{ left: 2, transform: r.enabled ? "translateX(20px)" : "none" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Hydration cadence ------------------------------------------ */}
        <section className="card p-4">
          <SectionTitle title="Hydration cadence" hint="How often to nudge between start and end" />
          <div className="flex gap-1.5">
            {[60, 90, 120, 180].map((m) => {
              const hydration = state.reminders.find((r) => r.id === "hydration");
              const active = hydration?.repeatEveryMin === m;
              return (
                <button
                  key={m}
                  onClick={() => setReminder("hydration", { repeatEveryMin: m })}
                  className="btn flex-1 !px-2 !py-2 !text-xs"
                  style={{
                    background: active ? "var(--water)" : "var(--surface-2)",
                    color: active ? "#fff" : "var(--text-muted)",
                    borderColor: active ? "var(--water)" : "var(--border)",
                  }}
                >
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                  {active && <IconCheck width={12} height={12} />}
                </button>
              );
            })}
          </div>
          <label className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-muted">Stop nudging after</span>
            <input
              type="time"
              value={state.reminders.find((r) => r.id === "hydration")?.endTime ?? "21:00"}
              onChange={(e) => setReminder("hydration", { endTime: e.target.value })}
              className="field num !w-auto !px-2.5 !py-1.5 text-sm"
            />
          </label>
        </section>

        <p className="pb-2 text-xs leading-relaxed text-ink-faint">
          Reminders are delivered by your browser while the app is installed or open in a tab. If
          the app has been closed for a while, any reminders due in the last 30 minutes are
          delivered the next time you open it. Nothing is sent to a server.
        </p>
      </main>
    </div>
  );
}
