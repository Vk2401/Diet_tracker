"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { todayKey } from "@/lib/date";
import { usePwa } from "@/components/PwaProvider";
import TopBar from "@/components/TopBar";
import { SectionTitle } from "@/components/ui";
import { IconCheck, IconDownload, IconInstall, IconUpload } from "@/components/icons";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { state, setProfile, setSettings, resetAll, importState } = useStore();
  const { canInstall, isStandalone, promptInstall } = usePwa();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState("");

  const p = state.profile;

  const num = (v: string, fallback: number) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gain-tracker-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    const result = importState(text);
    setMessage(result.ok ? "Data imported." : `Import failed: ${result.error}`);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="safe-bottom">
      <TopBar title="Settings" />

      <main className="space-y-5 px-4 pt-4">
        {/* ---- Profile --------------------------------------------------- */}
        <section className="card p-4">
          <SectionTitle title="Profile" />
          <div className="space-y-3">
            <Field label="Name">
              <input
                value={p.name}
                onChange={(e) => setProfile({ name: e.target.value })}
                placeholder="Optional"
                className="field"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starting weight" suffix="kg">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={p.startWeightKg}
                  onChange={(e) => setProfile({ startWeightKg: num(e.target.value, 43) })}
                  className="field num pr-9 font-bold"
                />
              </Field>
              <Field label="Goal weight" suffix="kg">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={p.goalWeightKg}
                  onChange={(e) => setProfile({ goalWeightKg: num(e.target.value, 50) })}
                  className="field num pr-9 font-bold"
                />
              </Field>
            </div>
            <Field label="Height (optional)" suffix="cm">
              <input
                type="number"
                inputMode="numeric"
                value={p.heightCm ?? ""}
                onChange={(e) =>
                  setProfile({ heightCm: e.target.value ? num(e.target.value, 0) : undefined })
                }
                placeholder="—"
                className="field num pr-10"
              />
            </Field>
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            Changing your starting weight recalculates goal progress across all history.
          </p>
        </section>

        {/* ---- Targets ---------------------------------------------------- */}
        <section className="card p-4">
          <SectionTitle title="Daily targets" />
          <div className="space-y-3.5">
            <RangeField
              label="Calories"
              unit="kcal"
              min={p.calorieTarget.min}
              max={p.calorieTarget.max}
              step={10}
              onChange={(min, max) => setProfile({ calorieTarget: { min, max } })}
            />
            <RangeField
              label="Protein"
              unit="g"
              min={p.proteinTarget.min}
              max={p.proteinTarget.max}
              step={1}
              onChange={(min, max) => setProfile({ proteinTarget: { min, max } })}
            />
            <RangeField
              label="Water"
              unit="ml"
              min={p.waterTargetMl.min}
              max={p.waterTargetMl.max}
              step={100}
              onChange={(min, max) => setProfile({ waterTargetMl: { min, max } })}
            />
            <RangeField
              label="Weekly gain"
              unit="kg"
              min={p.weeklyGainTarget.min}
              max={p.weeklyGainTarget.max}
              step={0.05}
              onChange={(min, max) => setProfile({ weeklyGainTarget: { min, max } })}
            />
          </div>
        </section>

        {/* ---- Preferences ------------------------------------------------ */}
        <section className="card p-4">
          <SectionTitle title="Preferences" />
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
                Appearance
              </p>
              <div className="flex gap-1.5">
                {(["system", "light", "dark"] as const).map((t) => (
                  <Choice
                    key={t}
                    active={state.settings.theme === t}
                    onClick={() => setSettings({ theme: t })}
                    label={t[0].toUpperCase() + t.slice(1)}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
                Water glass size
              </p>
              <div className="flex gap-1.5">
                {[200, 250, 300, 500].map((ml) => (
                  <Choice
                    key={ml}
                    active={state.settings.waterGlassMl === ml}
                    onClick={() => setSettings({ waterGlassMl: ml })}
                    label={`${ml} ml`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
                Week starts on
              </p>
              <div className="flex gap-1.5">
                {([1, 0] as const).map((d) => (
                  <Choice
                    key={d}
                    active={state.settings.weekStartsOn === d}
                    onClick={() => setSettings({ weekStartsOn: d as Settings["weekStartsOn"] })}
                    label={d === 1 ? "Monday" : "Sunday"}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- App -------------------------------------------------------- */}
        <section className="card p-4">
          <SectionTitle title="App" />
          <div className="space-y-2">
            {!isStandalone && (
              <button
                onClick={() => void promptInstall()}
                disabled={!canInstall}
                className="btn btn-ghost w-full justify-start"
              >
                <IconInstall width={17} height={17} />
                {canInstall ? "Install to home screen" : "Install from your browser menu"}
              </button>
            )}
            <button onClick={exportJson} className="btn btn-ghost w-full justify-start">
              <IconDownload width={17} height={17} />
              Export data (JSON)
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn btn-ghost w-full justify-start"
            >
              <IconUpload width={17} height={17} />
              Import data
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImport(f);
                e.target.value = "";
              }}
            />
          </div>
          {message && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--brand)" }}>
              <IconCheck width={13} height={13} /> {message}
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            All data lives on this device only — nothing is uploaded. Export before clearing your
            browser storage or switching devices.
          </p>
        </section>

        {/* ---- Danger ----------------------------------------------------- */}
        <section className="card p-4">
          <SectionTitle title="Reset" />
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="btn btn-danger w-full">
              Erase all data
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
                This deletes every meal log, weigh-in and setting. It cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmReset(false)} className="btn btn-ghost flex-1">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetAll();
                    router.replace("/onboarding");
                  }}
                  className="btn btn-danger flex-1"
                >
                  Erase everything
                </button>
              </div>
            </div>
          )}
        </section>

        <p className="pb-2 text-center text-xs leading-relaxed text-ink-faint">
          This app supports a nutrition plan and is not medical advice. Talk to a doctor or
          dietitian before significant dietary changes.
        </p>
      </main>
    </div>
  );
}

function Field({
  label,
  suffix,
  children,
}: {
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <span className="relative block">
        {children}
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

function RangeField({
  label,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (min: number, max: number) => void;
}) {
  const parse = (v: string, fallback: number) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  };
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-ink-faint">
          {label}
        </span>
        <span className="text-[0.7rem] text-ink-faint">{unit} / day</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={min}
          aria-label={`${label} minimum`}
          onChange={(e) => onChange(parse(e.target.value, min), max)}
          className="field num font-bold"
        />
        <span className="text-ink-faint">–</span>
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={max}
          aria-label={`${label} maximum`}
          onChange={(e) => onChange(min, parse(e.target.value, max))}
          className="field num font-bold"
        />
      </div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="btn flex-1 !px-2 !py-2 !text-xs"
      style={{
        background: active ? "var(--brand)" : "var(--surface-2)",
        color: active ? "var(--brand-contrast)" : "var(--text-muted)",
        borderColor: active ? "var(--brand)" : "var(--border)",
      }}
    >
      {label}
    </button>
  );
}
