"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconChevronLeft } from "./icons";

export default function TopBar({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  /** `true` uses browser history, a string navigates to that route. */
  back?: boolean | string;
  right?: ReactNode;
}) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-30 border-b border-line px-4 pb-3 pt-[max(0.9rem,env(safe-area-inset-top))]"
      style={{
        background: "color-mix(in srgb, var(--bg) 86%, transparent)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {back &&
          (typeof back === "string" ? (
            <Link href={back} aria-label="Back" className="btn btn-ghost !p-2">
              <IconChevronLeft width={18} height={18} />
            </Link>
          ) : (
            <button onClick={() => router.back()} aria-label="Back" className="btn btn-ghost !p-2">
              <IconChevronLeft width={18} height={18} />
            </button>
          ))}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-ink-faint">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
