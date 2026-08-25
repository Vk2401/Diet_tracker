import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import PwaProvider from "@/components/PwaProvider";
import AppShell from "@/components/AppShell";

const appFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Weight Goal Tracker — Daily Nutrition & Progress",
    template: "%s · Goal Tracker",
  },
  description:
    "Follow a structured meal plan for weight gain or weight loss: track meals, calories, protein, hydration and weekly weight progress.",
  manifest: "/manifest.webmanifest",
  applicationName: "Goal Tracker",
  appleWebApp: {
    capable: true,
    title: "Goal Tracker",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1210" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={appFont.variable}>
        <StoreProvider>
          <PwaProvider>
            <AppShell>{children}</AppShell>
          </PwaProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
