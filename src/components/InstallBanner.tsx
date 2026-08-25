"use client";

import { useEffect, useState } from "react";
import { usePwa } from "./PwaProvider";
import { IconClose, IconInstall } from "./icons";

const DISMISS_KEY = "hwg-install-dismissed";

export default function InstallBanner() {
  const { canInstall, isStandalone, promptInstall, updateReady, applyUpdate } = usePwa();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (updateReady) {
    return (
      <div className="card mb-4 flex items-center gap-3 p-3" style={{ background: "var(--brand-soft)", borderColor: "var(--brand)" }}>
        <p className="flex-1 text-sm font-medium" style={{ color: "var(--brand)" }}>
          A new version is ready.
        </p>
        <button onClick={applyUpdate} className="btn btn-primary !py-1.5 !text-xs">
          Refresh
        </button>
      </div>
    );
  }

  if (!canInstall || isStandalone || dismissed) return null;

  return (
    <div className="card mb-4 flex items-center gap-3 p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
        <IconInstall width={20} height={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Install the tracker</p>
        <p className="text-xs text-ink-faint">Add it to your home screen — works offline.</p>
      </div>
      <button onClick={() => void promptInstall()} className="btn btn-primary !py-1.5 !text-xs">
        Install
      </button>
      <button
        aria-label="Dismiss"
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            /* ignore */
          }
        }}
        className="text-ink-faint"
      >
        <IconClose width={16} height={16} />
      </button>
    </div>
  );
}
