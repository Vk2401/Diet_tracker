import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const IconHome = (p: P) => (
  <svg {...base} {...p}><path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const IconPlan = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 3v3M16 3v3M7.5 13.5h4M7.5 17h7" /></svg>
);
export const IconScale = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M12 8.5v3M8.5 12.2a3.5 3.5 0 0 1 7 0" /><circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" /></svg>
);
export const IconChart = (p: P) => (
  <svg {...base} {...p}><path d="M4 20V5M4 20h16" /><path d="M8 16.5V13M12.5 16.5V8.5M17 16.5v-6" /></svg>
);
export const IconReport = (p: P) => (
  <svg {...base} {...p}><path d="M6 3h8l4.5 4.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h4.5M8.5 13h7M8.5 16.5h4.5" /></svg>
);
export const IconBell = (p: P) => (
  <svg {...base} {...p}><path d="M18 15.5V10a6 6 0 1 0-12 0v5.5L4.5 18h15z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></svg>
);
export const IconGear = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 14.5a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.47 1z" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} {...p}><path d="m5 12.8 4.4 4.4L19 7.6" strokeWidth={2.4} /></svg>
);
export const IconClose = (p: P) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" strokeWidth={2} /></svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base} {...p}><path d="m9.5 5.5 6.5 6.5-6.5 6.5" /></svg>
);
export const IconChevronLeft = (p: P) => (
  <svg {...base} {...p}><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" strokeWidth={2} /></svg>
);
export const IconMinus = (p: P) => (
  <svg {...base} {...p}><path d="M5 12h14" strokeWidth={2} /></svg>
);
export const IconDrop = (p: P) => (
  <svg {...base} {...p}><path d="M12 3.2c3.2 3.6 6 6.8 6 10a6 6 0 1 1-12 0c0-3.2 2.8-6.4 6-10z" /></svg>
);
export const IconFlame = (p: P) => (
  <svg {...base} {...p}><path d="M12 3s.8 3.2-1.4 5.2C8 10.5 6.5 12.3 6.5 14.8a5.5 5.5 0 0 0 11 0c0-2.3-1.2-4-2.6-5.6-.6 1-1.4 1.6-2.2 1.8.6-2.6.3-5.6-.7-8z" /></svg>
);
export const IconBolt = (p: P) => (
  <svg {...base} {...p}><path d="M13.2 2.5 4.8 13.4h5.6l-.6 8.1 8.4-10.9h-5.6z" /></svg>
);
export const IconDownload = (p: P) => (
  <svg {...base} {...p}><path d="M12 3.5v11m0 0 4-4m-4 4-4-4M4 17.5v1.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-1.5" /></svg>
);
export const IconUpload = (p: P) => (
  <svg {...base} {...p}><path d="M12 20.5v-11m0 0 4 4m-4-4-4 4M4 6.5V5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 5v1.5" /></svg>
);
export const IconSwap = (p: P) => (
  <svg {...base} {...p}><path d="M4 8h13m0 0-3.5-3.5M17 8l-3.5 3.5M20 16H7m0 0 3.5-3.5M7 16l3.5 3.5" /></svg>
);
export const IconNote = (p: P) => (
  <svg {...base} {...p}><path d="M5 4.5h14v11L14.5 20H5z" /><path d="M14.5 20v-4.5H19M8.5 9h7M8.5 12.5h5" /></svg>
);
export const IconTrend = (p: P) => (
  <svg {...base} {...p}><path d="m4 15.5 5-5.5 3.5 3.5L20 6" /><path d="M15 6h5v5" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const IconInstall = (p: P) => (
  <svg {...base} {...p}><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M12 7v6m0 0 2.5-2.5M12 13l-2.5-2.5M10.5 18.5h3" /></svg>
);
export const IconSparkle = (p: P) => (
  <svg {...base} {...p}><path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" /><path d="M18.5 3v3M20 4.5h-3" /></svg>
);
export const IconTrash = (p: P) => (
  <svg {...base} {...p}><path d="M4.5 6.5h15M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5M6.5 6.5 7.4 20a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-13.5M10.5 10.5v6M13.5 10.5v6" /></svg>
);
export const IconEdit = (p: P) => (
  <svg {...base} {...p}><path d="M4 20.3h4.2L19.4 9.1a2 2 0 0 0 0-2.8l-1.7-1.7a2 2 0 0 0-2.8 0L3.7 15.8V20a.3.3 0 0 0 .3.3zM14.5 6.5l3 3" /></svg>
);
