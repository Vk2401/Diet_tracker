"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { notificationSupport, requestPermission, type PermissionState } from "@/lib/notifications";
import { usePwa } from "./PwaProvider";
import { IconBell, IconCheck, IconChevronRight, IconInstall } from "./icons";

/** Rough platform read — only ever used to pick which instructions to show. */
function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as Macintosh, so also check for touch.
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1))
    return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

const DENIED_STEPS: Record<ReturnType<typeof detectPlatform>, string[]> = {
  ios: [
    "Open the iOS Settings app",
    "Scroll to this app and tap it",
    "Turn Notifications on",
  ],
  android: [
    "Tap the ⋮ menu, then the padlock or ⓘ beside the address",
    "Open Permissions → Notifications",
    "Switch it to Allow, then reload this page",
  ],
  desktop: [
    "Click the padlock or ⓘ beside the address bar",
    "Find Notifications and set it to Allow",
    "Reload this page",
  ],
};

/**
 * Shows whether reminder notifications can actually be delivered, and what to
 * do when they can't. Browsers only allow one permission prompt, so a denied
 * state has to be fixed in browser settings — hence the explicit steps.
 */
export default function NotificationStatus({ compact = false }: { compact?: boolean }) {
  const { state } = useStore();
  const { isStandalone, canInstall, promptInstall } = usePwa();
  const [perm, setPerm] = useState<PermissionState>("default");
  const [platform, setPlatform] = useState<ReturnType<typeof detectPlatform>>("desktop");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    setPerm(notificationSupport());
    setPlatform(detectPlatform());
  }, []);

  const enabledCount = state.reminders.filter((r) => r.enabled).length;
  // iOS only delivers web notifications to a Home Screen install.
  const iosNeedsInstall = platform === "ios" && !isStandalone;

  const ask = async () => {
    setAsking(true);
    setPerm(await requestPermission());
    setAsking(false);
  };

  const tone =
    perm === "granted" && enabledCount > 0
      ? { bg: "var(--brand-soft)", fg: "var(--brand)" }
      : perm === "denied"
        ? { bg: "var(--danger-soft)", fg: "var(--danger)" }
        : { bg: "var(--accent-soft)", fg: "var(--accent)" };

  const headline =
    iosNeedsInstall
      ? "Add to Home Screen for reminders"
      : perm === "unsupported"
        ? "Notifications not supported"
        : perm === "denied"
          ? "Notifications are blocked"
          : perm === "default"
            ? "Reminders are off"
            : enabledCount === 0
              ? "Notifications allowed, all reminders off"
              : `Reminders on · ${enabledCount} scheduled`;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-pill"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {perm === "granted" && enabledCount > 0 && !iosNeedsInstall ? (
            <IconCheck width={17} height={17} />
          ) : (
            <IconBell width={17} height={17} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{headline}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
            {iosNeedsInstall
              ? "On iPhone and iPad, notifications only work once the app is on your Home Screen. Tap Share, then Add to Home Screen, and open it from there."
              : perm === "unsupported"
                ? "This browser can't show notifications. Your reminder schedule still works inside the app."
                : perm === "denied"
                  ? "Your browser is blocking notifications, and it won't ask again — you'll need to allow them in the site settings."
                  : perm === "default"
                    ? "Allow notifications so meal, weigh-in and water reminders reach you."
                    : enabledCount === 0
                      ? "Notifications are allowed, but every reminder is switched off."
                      : "Meal, weigh-in and water reminders will be delivered."}
          </p>
        </div>
      </div>

      {perm === "default" && !iosNeedsInstall && (
        <button onClick={ask} disabled={asking} className="btn btn-primary w-full !py-2.5 !text-sm">
          <IconBell width={16} height={16} />
          {asking ? "Waiting for your browser…" : "Enable notifications"}
        </button>
      )}

      {iosNeedsInstall && canInstall && (
        <button onClick={() => void promptInstall()} className="btn btn-primary w-full !py-2.5 !text-sm">
          <IconInstall width={16} height={16} />
          Install app
        </button>
      )}

      {perm === "denied" && !iosNeedsInstall && (
        <ol className="space-y-1.5 rounded-[12px] p-3" style={{ background: "var(--surface-2)" }}>
          {DENIED_STEPS[platform].map((step, i) => (
            <li key={step} className="flex gap-2.5 text-xs leading-relaxed text-ink-muted">
              <span
                className="num grid h-4 w-4 shrink-0 place-items-center rounded-pill text-[0.6rem] font-bold"
                style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      )}

      {!compact && (
        <Link
          href="/reminders"
          className="flex items-center gap-2 rounded-[12px] p-2.5 text-sm font-semibold"
          style={{ background: "var(--surface-2)" }}
        >
          <span className="flex-1">
            {perm === "granted" ? "Manage reminder times" : "Review reminder schedule"}
          </span>
          <IconChevronRight width={14} height={14} className="text-ink-faint" />
        </Link>
      )}
    </div>
  );
}
