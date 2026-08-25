"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChart, IconHome, IconPlan, IconReport, IconScale } from "./icons";

const TABS = [
  { href: "/", label: "Today", Icon: IconHome },
  { href: "/plan", label: "Plan", Icon: IconPlan },
  { href: "/weight", label: "Weight", Icon: IconScale },
  { href: "/progress", label: "Progress", Icon: IconChart },
  { href: "/report", label: "Report", Icon: IconReport },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line"
      style={{
        background: "color-mix(in srgb, var(--bg-elevated) 88%, transparent)",
        backdropFilter: "blur(14px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2.5 text-[0.66rem] font-semibold transition-colors"
                style={{ color: active ? "var(--brand)" : "var(--text-faint)" }}
              >
                <span
                  className="grid h-8 w-14 place-items-center rounded-pill transition-colors"
                  style={{ background: active ? "var(--brand-soft)" : "transparent" }}
                >
                  <Icon width={20} height={20} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
