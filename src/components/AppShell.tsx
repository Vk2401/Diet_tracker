"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import BottomNav from "./BottomNav";

const NO_CHROME = ["/onboarding"];

export default function AppShell({ children }: { children: ReactNode }) {
  const { state, hydrated } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  // Theme is applied here so every route (including onboarding) honours it.
  useEffect(() => {
    const root = document.documentElement;
    const theme = state.settings.theme;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [state.settings.theme]);

  const onboarded = state.profile.onboarded;
  const atOnboarding = pathname === "/onboarding";

  // Both directions: first run goes to onboarding, and anyone already set up
  // is kept out of it (a bookmark or a back-swipe must not restart setup).
  const needsOnboarding = !onboarded && !atOnboarding;
  const alreadyOnboarded = onboarded && atOnboarding;

  useEffect(() => {
    if (!hydrated) return;
    if (needsOnboarding) router.replace("/onboarding");
    else if (alreadyOnboarded) router.replace("/");
  }, [hydrated, needsOnboarding, alreadyOnboarded, router]);

  const bare = NO_CHROME.includes(pathname);

  // Hold the loader until state is read AND any redirect has settled, so a
  // first-run user never sees an empty dashboard flash behind onboarding.
  if (!hydrated || needsOnboarding || alreadyOnboarded) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-line"
          style={{ borderTopColor: "var(--brand)" }}
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (bare) return <>{children}</>;

  return (
    <>
      <div className="mx-auto min-h-dvh max-w-lg">{children}</div>
      <BottomNav />
    </>
  );
}
