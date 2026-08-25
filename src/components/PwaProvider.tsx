"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { runDueReminders } from "@/lib/notifications";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaCtx = {
  canInstall: boolean;
  isStandalone: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  updateReady: boolean;
  applyUpdate: () => void;
};

const Ctx = createContext<PwaCtx>({
  canInstall: false,
  isStandalone: false,
  promptInstall: async () => "unavailable",
  updateReady: false,
  applyUpdate: () => {},
});

export function usePwa() {
  return useContext(Ctx);
}

export default function PwaProvider({ children }: { children: ReactNode }) {
  const { state, hydrated } = useStore();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  // Register the service worker and watch for a newer version.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (cancelled) return;
        if (reg.waiting) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
          });
        });
      })
      .catch(() => {
        /* SW unsupported or blocked — the app still works online */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const mq = window.matchMedia("(display-mode: standalone)");
    const sync = () =>
      setIsStandalone(
        mq.matches ||
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    sync();
    mq.addEventListener("change", sync);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", sync);
    };
  }, []);

  // Catch-up reminder loop: on load, every minute, and whenever the tab wakes.
  useEffect(() => {
    if (!hydrated) return;
    const tick = () => void runDueReminders(state.reminders);
    tick();
    const id = setInterval(tick, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hydrated, state.reminders]);

  const value: PwaCtx = {
    canInstall: !!deferred,
    isStandalone,
    updateReady: !!waiting,
    applyUpdate: () => {
      waiting?.postMessage({ type: "SKIP_WAITING" });
      setWaiting(null);
      setTimeout(() => window.location.reload(), 300);
    },
    promptInstall: async () => {
      if (!deferred) return "unavailable";
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null);
      return outcome;
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
