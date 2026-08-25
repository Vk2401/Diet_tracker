"use client";

import Link from "next/link";
import { IconDrop } from "@/components/icons";

export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center px-8 text-center">
      <div>
        <span
          className="mx-auto grid h-14 w-14 place-items-center rounded-card"
          style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}
        >
          <IconDrop width={26} height={26} />
        </span>
        <h1 className="mt-5 text-xl font-extrabold tracking-tight">You&apos;re offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This page hasn&apos;t been cached yet. Your logged data is safe on this device — reconnect
          and try again.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Back to today
        </Link>
      </div>
    </div>
  );
}
